import { NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createAuditLog, auditActions, resourceTypes, logSecurityEvent } from './audit'
import { rateLimit } from './rate-limit'

// Security headers configuration
export const securityHeaders = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://clerk.dev https://js.stripe.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' https:; connect-src 'self' https://clerk.dev https://api.stripe.com; frame-src https://js.stripe.com https://hooks.stripe.com;"
}

// Input validation helpers
export function validateZipCode(zip: string): boolean {
  return /^\d{5}(-\d{4})?$/.test(zip)
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email) && email.length <= 254
}

export function validatePhoneNumber(phone: string): boolean {
  const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/
  return phoneRegex.test(phone)
}

export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential XSS characters
    .substring(0, 1000) // Limit length
}

// PHI (Protected Health Information) detection
export function containsPHI(text: string): boolean {
  const phiPatterns = [
    /\b\d{3}-\d{2}-\d{4}\b/, // SSN pattern
    /\b\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\b/, // Credit card pattern
    /\b[A-Z]{2}\d{7}\b/, // Medical record number pattern
    /\b\d{2}\/\d{2}\/\d{4}\b/, // Date of birth pattern
  ]
  
  return phiPatterns.some(pattern => pattern.test(text))
}

// Rate limiting wrapper
export async function withRateLimit(
  request: NextRequest,
  identifier: string,
  limit: number = 100,
  window: number = 3600000 // 1 hour
) {
  const { success, remaining, reset } = await rateLimit(identifier, limit, window)
  
  if (!success) {
    const { userId } = await auth()
    if (userId) {
      await logSecurityEvent(
        userId,
        auditActions.SUSPICIOUS_ACTIVITY,
        {
          reason: 'rate_limit_exceeded',
          identifier,
          limit,
          window
        },
        request
      )
    }
    
    throw new Error('Rate limit exceeded')
  }
  
  return { remaining, reset }
}

// Authentication wrapper with audit logging
export async function withAuth(request: NextRequest) {
  const { userId } = await auth()
  
  if (!userId) {
    await logSecurityEvent(
      'anonymous',
      auditActions.FAILED_LOGIN,
      {
        reason: 'no_auth_token',
        path: request.nextUrl.pathname
      },
      request
    )
    
    throw new Error('Unauthorized')
  }
  
  return userId
}

// Admin role check
export async function requireAdmin(request: NextRequest) {
  const userId = await withAuth(request)
  
  // In a real app, this would check user roles from database
  // For demo, we'll use a simple check
  const adminUsers = ['user_admin', 'admin_user'] // Demo admin user IDs
  
  if (!adminUsers.includes(userId)) {
    await logSecurityEvent(
      userId,
      auditActions.SUSPICIOUS_ACTIVITY,
      {
        reason: 'unauthorized_admin_access',
        path: request.nextUrl.pathname
      },
      request
    )
    
    throw new Error('Admin access required')
  }
  
  return userId
}

// Data validation for estimates
export function validateEstimateData(data: any): boolean {
  const required = ['zip', 'facilityId']
  const hasRequired = required.every(field => data[field])
  
  if (!hasRequired) return false
  
  // Validate ZIP code
  if (!validateZipCode(data.zip)) return false
  
  // Validate numeric fields
  const numericFields = ['outOfPocketSpent', 'deductible', 'oopMax']
  for (const field of numericFields) {
    if (data[field] !== undefined) {
      const value = Number(data[field])
      if (isNaN(value) || value < 0 || value > 100000) return false
    }
  }
  
  return true
}

// Secure session management
export function generateSessionToken(): string {
  const crypto = require('crypto')
  return crypto.randomBytes(32).toString('hex')
}

// IP address extraction with proxy support
export function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  const remoteAddr = request.headers.get('remote-addr')
  
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  return realIP || remoteAddr || 'unknown'
}

// Suspicious activity detection
export async function detectSuspiciousActivity(
  userId: string,
  action: string,
  request: NextRequest
): Promise<boolean> {
  const ip = getClientIP(request)
  const userAgent = request.headers.get('user-agent') || ''
  
  // Check for suspicious patterns
  const suspiciousPatterns = [
    /bot|crawler|spider/i.test(userAgent),
    ip === 'unknown',
    action.includes('admin') && !userId.includes('admin'),
    // Add more patterns as needed
  ]
  
  const isSuspicious = suspiciousPatterns.some(pattern => pattern)
  
  if (isSuspicious) {
    await logSecurityEvent(
      userId,
      auditActions.SUSPICIOUS_ACTIVITY,
      {
        reason: 'pattern_detection',
        action,
        ip,
        userAgent
      },
      request
    )
  }
  
  return isSuspicious
}

// Data export controls
export async function auditDataExport(
  userId: string,
  dataType: string,
  recordCount: number,
  request: NextRequest
) {
  await createAuditLog({
    userId,
    action: auditActions.DATA_EXPORT,
    resourceType: resourceTypes.SYSTEM,
    details: {
      dataType,
      recordCount,
      exportTime: new Date().toISOString()
    },
    ipAddress: getClientIP(request),
    userAgent: request.headers.get('user-agent') || 'unknown'
  })
}

// Privacy compliance helpers
export function anonymizeUserData(userData: any): any {
  const anonymized = { ...userData }
  
  // Remove or hash sensitive fields
  delete anonymized.email
  delete anonymized.phone
  delete anonymized.ssn
  
  if (anonymized.dateOfBirth) {
    // Keep only year for age calculation
    anonymized.birthYear = new Date(anonymized.dateOfBirth).getFullYear()
    delete anonymized.dateOfBirth
  }
  
  if (anonymized.zip) {
    // Keep only first 3 digits of ZIP
    anonymized.zipPrefix = anonymized.zip.substring(0, 3)
    delete anonymized.zip
  }
  
  return anonymized
}

// HIPAA compliance check
export function isHIPAACompliant(operation: string, userData: any): boolean {
  // Basic HIPAA compliance checks
  const checks = [
    // Minimum necessary standard
    !containsPHI(JSON.stringify(userData)),
    // Purpose limitation
    ['estimate', 'aid_matching', 'payment_simulation'].includes(operation),
    // Data minimization
    Object.keys(userData).length <= 10
  ]
  
  return checks.every(check => check)
}

export { securityHeaders as default }
