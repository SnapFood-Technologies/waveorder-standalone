// Base62 encoding/decoding for shorter, URL-safe product IDs
// Converts MongoDB ObjectId (24 hex chars) to shorter Base62 string (~16 chars)

const CHARSET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
const BASE = BigInt(62)

/**
 * Encode a hex string (MongoDB ObjectId) to Base62
 * @param hex - 24 character hex string (MongoDB ObjectId)
 * @returns Base62 encoded string (~16 characters)
 */
export function encodeBase62(hex: string): string {
  if (!hex || !/^[0-9a-fA-F]+$/.test(hex)) {
    return ''
  }
  
  let num = BigInt('0x' + hex)
  if (num === BigInt(0)) return CHARSET[0]
  
  let result = ''
  while (num > 0) {
    result = CHARSET[Number(num % BASE)] + result
    num = num / BASE
  }
  
  return result
}

/**
 * Decode a Base62 string back to hex (MongoDB ObjectId)
 * @param encoded - Base62 encoded string
 * @returns 24 character hex string (MongoDB ObjectId)
 */
export function decodeBase62(encoded: string): string {
  if (!encoded) return ''
  
  let num = BigInt(0)
  for (const char of encoded) {
    const index = CHARSET.indexOf(char)
    if (index === -1) return '' // Invalid character
    num = num * BASE + BigInt(index)
  }
  
  // Convert back to hex and pad to 24 characters
  let hex = num.toString(16)
  while (hex.length < 24) {
    hex = '0' + hex
  }
  
  return hex
}

/**
 * Validate if a string is a valid Base62 encoded product ID
 * @param encoded - String to validate
 * @returns true if valid Base62
 */
export function isValidBase62(encoded: string): boolean {
  if (!encoded || encoded.length < 10 || encoded.length > 20) return false
  return [...encoded].every(char => CHARSET.includes(char))
}
