import { randomBytes, pbkdf2 as pbkdf2Callback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const pbkdf2 = promisify(pbkdf2Callback);
const ITERATIONS = 120000;
const KEY_LENGTH = 64;
const DIGEST = 'sha512';

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const derivedKey = await pbkdf2(password, salt, ITERATIONS, KEY_LENGTH, DIGEST);

  return `pbkdf2$${ITERATIONS}$${salt}$${derivedKey.toString('hex')}`;
}

export async function verifyPassword(password: string, storedValue: string): Promise<boolean> {
  if (storedValue.startsWith('pbkdf2$')) {
    const [scheme, iterationsText, salt, expectedHash] = storedValue.split('$');

    if (scheme !== 'pbkdf2' || !iterationsText || !salt || !expectedHash) {
      return false;
    }

    const iterations = Number(iterationsText);
    if (!Number.isFinite(iterations) || iterations <= 0) {
      return false;
    }

    const derivedKey = await pbkdf2(password, salt, iterations, KEY_LENGTH, DIGEST);
    const expectedBuffer = Buffer.from(expectedHash, 'hex');
    const derivedBuffer = Buffer.from(derivedKey.toString('hex'), 'hex');

    if (expectedBuffer.length !== derivedBuffer.length) {
      return false;
    }

    return timingSafeEqual(expectedBuffer, derivedBuffer);
  }

  return storedValue === password;
}