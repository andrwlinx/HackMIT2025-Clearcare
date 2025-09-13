import crypto from 'crypto'

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-key-for-demo-only-change-in-production'
const ALGORITHM = 'aes-256-gcm'

export interface EncryptedData {
  encryptedData: string
  iv: string
  authTag: string
}

export function encrypt(text: string): EncryptedData {
  try {
    // Generate a random initialization vector
    const iv = crypto.randomBytes(16)
    
    // Create cipher
    const cipher = crypto.createCipher(ALGORITHM, ENCRYPTION_KEY)
    
    // Encrypt the text
    let encrypted = cipher.update(text, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    
    // Get the authentication tag (for AES-GCM)
    const authTag = cipher.getAuthTag ? cipher.getAuthTag().toString('hex') : ''
    
    return {
      encryptedData: encrypted,
      iv: iv.toString('hex'),
      authTag
    }
  } catch (error) {
    console.error('Encryption error:', error)
    throw new Error('Failed to encrypt data')
  }
}

export function decrypt(encryptedObj: EncryptedData): string {
  try {
    const { encryptedData, iv, authTag } = encryptedObj
    
    // Create decipher
    const decipher = crypto.createDecipher(ALGORITHM, ENCRYPTION_KEY)
    
    // Set auth tag if available (for AES-GCM)
    if (authTag && decipher.setAuthTag) {
      decipher.setAuthTag(Buffer.from(authTag, 'hex'))
    }
    
    // Decrypt the data
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    
    return decrypted
  } catch (error) {
    console.error('Decryption error:', error)
    throw new Error('Failed to decrypt data')
  }
}

// Hash function for sensitive data that doesn't need to be decrypted
export function hashSensitiveData(data: string): string {
  return crypto.createHash('sha256').update(data + ENCRYPTION_KEY).digest('hex')
}

// Secure random token generation
export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex')
}

// Data masking for display purposes
export function maskSensitiveData(data: string, visibleChars: number = 4): string {
  if (data.length <= visibleChars) {
    return '*'.repeat(data.length)
  }
  
  const masked = '*'.repeat(data.length - visibleChars)
  const visible = data.slice(-visibleChars)
  
  return masked + visible
}

// Validate encryption key strength
export function validateEncryptionKey(): boolean {
  if (!ENCRYPTION_KEY || ENCRYPTION_KEY === 'default-key-for-demo-only-change-in-production') {
    console.warn('WARNING: Using default encryption key. Change ENCRYPTION_KEY in production!')
    return false
  }
  
  if (ENCRYPTION_KEY.length < 32) {
    console.warn('WARNING: Encryption key should be at least 32 characters long')
    return false
  }
  
  return true
}

// Initialize encryption validation
validateEncryptionKey()
