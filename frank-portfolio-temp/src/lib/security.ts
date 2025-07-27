/**
 * Security utilities for input validation and sanitization
 */

// Email validation regex (RFC 5322 compliant)
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/

/**
 * Sanitize text input by removing/escaping dangerous characters
 */
export function sanitizeText(input: string): string {
  return input
    .trim()
    .replace(/[<>"'&]/g, (match) => {
      const htmlEntities: Record<string, string> = {
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '&': '&amp;'
      }
      return htmlEntities[match] || match
    })
    .slice(0, 1000) // Prevent excessively long inputs
}

/**
 * Validate and sanitize email address
 */
export function sanitizeEmail(email: string): string {
  const cleaned = email.trim().toLowerCase()
  if (!EMAIL_REGEX.test(cleaned)) {
    throw new Error('Invalid email format')
  }
  return cleaned
}

/**
 * Sanitize subject line for mailto links
 */
export function sanitizeSubject(subject: string): string {
  return sanitizeText(subject)
    .replace(/[\r\n\t]/g, ' ') // Remove line breaks
    .replace(/\s+/g, ' ') // Normalize whitespace
    .slice(0, 200) // Reasonable subject length limit
}

/**
 * Validate form data structure
 */
export interface ContactFormData {
  name: string
  email: string
  subject: string
  message: string
}

export function validateContactForm(data: ContactFormData): ContactFormData {
  return {
    name: sanitizeText(data.name),
    email: sanitizeEmail(data.email),
    subject: sanitizeSubject(data.subject),
    message: sanitizeText(data.message)
  }
}

/**
 * Create safe mailto URL with validated inputs
 */
export function createSafeMailtoUrl(data: ContactFormData): string {
  const validated = validateContactForm(data)
  
  const body = `Name: ${validated.name}\nEmail: ${validated.email}\n\nMessage:\n${validated.message}`
  
  return `mailto:frank@palmisano.io?subject=${encodeURIComponent(validated.subject)}&body=${encodeURIComponent(body)}`
}