import crypto from 'node:crypto';

export function hashPassword(password: string) {
  const salt = crypto.randomBytes(32).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 100_000, 64, 'sha512').toString('hex');
  return { salt, hash };
}

export function verifyHash(password: string, salt: string, hash: string): boolean {
  const candidate = crypto.pbkdf2Sync(password, salt, 100_000, 64, 'sha512').toString('hex');
  return candidate === hash;
}

export function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}
