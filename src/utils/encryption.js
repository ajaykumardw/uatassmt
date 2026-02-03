
import crypto from 'crypto';

// AES-256-CBC requires a 32-byte key
const ENCRYPTION_KEY = Buffer.from(process.env.ENCRYPTION_KEY, 'base64'); // must be 32 bytes
const IV_LENGTH = 16; // AES block size

/**
 * Encrypt text
 * @param {string} text
 * @returns {string} Encrypted text in format: encryptedHex:ivHex
 */
export function encrypt(text) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);

  const encrypted = cipher.update(text, 'utf8', 'hex') + cipher.final('hex');

  return `${encrypted}:${iv.toString('hex')}`;
}

/**
 * Decrypt text
 * @param {string} encryptedText
 * @returns {string} Decrypted text
 */
export function decrypt(encryptedText) {
  if (!encryptedText || typeof encryptedText !== 'string') return encryptedText;
  if (!encryptedText.includes(':')) return encryptedText;

  const [encrypted, ivHex] = encryptedText.split(':');

  if (!encrypted || !ivHex) return encryptedText;

  const iv = Buffer.from(ivHex, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);

  try {
    return decipher.update(encrypted, 'hex', 'utf8') + decipher.final('utf8');
  } catch (err) {
    console.error('Decryption error:', err.message);

    return encryptedText;
  }
}


export function maskAadhaar(aadhaar){

  const digits = aadhaar.replace(/\D/g, '');

  return `XXXXXXXX${digits.slice(-4)}`;

}

