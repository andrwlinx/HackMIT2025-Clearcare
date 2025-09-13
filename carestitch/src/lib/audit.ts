import { prisma } from './prisma'
import { nanoid } from 'nanoid'

export interface AuditLogEntry {
  userId: string
  action: string
  resourceType: string
  resourceId?: string
  details?: any
  ipAddress?: string
  userAgent?: string
}

export async function createAuditLog(entry: AuditLogEntry): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        id: nanoid(),
        userId: entry.userId,
        action: entry.action,
        resourceType: entry.resourceType,
        resourceId: entry.resourceId,
        details: entry.details || {},
        ipAddress: entry.ipAddress,
        userAgent: entry.userAgent,
        timestamp: new Date()
      }
    })
  } catch (error) {
    console.error('Failed to create audit log:', error)
    // Don't throw error to avoid breaking main functionality
  }
}

// Audit log helpers for common actions
export const auditActions = {
  // User actions
  USER_LOGIN: 'user_login',
  USER_LOGOUT: 'user_logout',
  USER_CREATED: 'user_created',
  USER_UPDATED: 'user_updated',
  
  // Estimate actions
  ESTIMATE_CREATED: 'estimate_created',
  ESTIMATE_VIEWED: 'estimate_viewed',
  ESTIMATE_UPDATED: 'estimate_updated',
  ESTIMATE_DELETED: 'estimate_deleted',
  
  // Facility actions
  FACILITY_VIEWED: 'facility_viewed',
  FACILITY_COMPARED: 'facility_compared',
  
  // Aid program actions
  AID_SEARCH: 'aid_search',
  AID_APPLICATION_STARTED: 'aid_application_started',
  
  // Payment actions
  PAYMENT_SIMULATION: 'payment_simulation',
  PAYMENT_PLAN_SELECTED: 'payment_plan_selected',
  
  // Crowdfunding actions
  CROWDFUND_CREATED: 'crowdfund_created',
  CROWDFUND_VIEWED: 'crowdfund_viewed',
  CROWDFUND_SHARED: 'crowdfund_shared',
  
  // Admin actions
  ADMIN_LOGIN: 'admin_login',
  FACILITY_RATE_UPDATED: 'facility_rate_updated',
  AID_PROGRAM_UPDATED: 'aid_program_updated',
  
  // Security events
  FAILED_LOGIN: 'failed_login',
  SUSPICIOUS_ACTIVITY: 'suspicious_activity',
  DATA_EXPORT: 'data_export',
  PRIVACY_POLICY_ACCEPTED: 'privacy_policy_accepted'
}

export const resourceTypes = {
  USER: 'user',
  ESTIMATE: 'estimate',
  FACILITY: 'facility',
  AID_PROGRAM: 'aid_program',
  PAYMENT_PLAN: 'payment_plan',
  CROWDFUND_LINK: 'crowdfund_link',
  INSURANCE_PLAN: 'insurance_plan',
  SYSTEM: 'system'
}

// Middleware helper to extract request metadata
export function extractRequestMetadata(request: Request) {
  const forwardedFor = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const ipAddress = forwardedFor?.split(',')[0] || realIp || 'unknown'
  const userAgent = request.headers.get('user-agent') || 'unknown'
  
  return { ipAddress, userAgent }
}

// Security monitoring helpers
export async function logSecurityEvent(
  userId: string,
  action: string,
  details: any,
  request?: Request
) {
  const metadata = request ? extractRequestMetadata(request) : {}
  
  await createAuditLog({
    userId,
    action,
    resourceType: resourceTypes.SYSTEM,
    details: {
      ...details,
      severity: 'high',
      timestamp: new Date().toISOString()
    },
    ...metadata
  })
  
  // In production, this could also:
  // - Send alerts to security team
  // - Trigger automated responses
  // - Update threat detection systems
}

// Data retention helper
export async function cleanupOldAuditLogs(retentionDays: number = 365): Promise<number> {
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays)
  
  try {
    const result = await prisma.auditLog.deleteMany({
      where: {
        timestamp: {
          lt: cutoffDate
        }
      }
    })
    
    console.log(`Cleaned up ${result.count} audit log entries older than ${retentionDays} days`)
    return result.count
  } catch (error) {
    console.error('Failed to cleanup audit logs:', error)
    return 0
  }
}

// Query helpers for audit analysis
export async function getAuditLogsByUser(
  userId: string,
  limit: number = 100,
  offset: number = 0
) {
  return await prisma.auditLog.findMany({
    where: { userId },
    orderBy: { timestamp: 'desc' },
    take: limit,
    skip: offset
  })
}

export async function getAuditLogsByAction(
  action: string,
  startDate?: Date,
  endDate?: Date,
  limit: number = 100
) {
  const where: any = { action }
  
  if (startDate || endDate) {
    where.timestamp = {}
    if (startDate) where.timestamp.gte = startDate
    if (endDate) where.timestamp.lte = endDate
  }
  
  return await prisma.auditLog.findMany({
    where,
    orderBy: { timestamp: 'desc' },
    take: limit
  })
}

export async function getSecurityEvents(
  startDate?: Date,
  endDate?: Date,
  limit: number = 50
) {
  const securityActions = [
    auditActions.FAILED_LOGIN,
    auditActions.SUSPICIOUS_ACTIVITY,
    auditActions.DATA_EXPORT
  ]
  
  const where: any = {
    action: { in: securityActions }
  }
  
  if (startDate || endDate) {
    where.timestamp = {}
    if (startDate) where.timestamp.gte = startDate
    if (endDate) where.timestamp.lte = endDate
  }
  
  return await prisma.auditLog.findMany({
    where,
    orderBy: { timestamp: 'desc' },
    take: limit
  })
}
