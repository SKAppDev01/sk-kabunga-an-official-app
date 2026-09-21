import argon2 from 'argon2';
import bcrypt from 'bcryptjs';

export async function hashPassword(password: string): Promise<string> {
  try {
    return await argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 2 ** 16, // 64 MB
      timeCost: 3,
      parallelism: 1,
    });
  } catch (error) {
    // Fallback to bcrypt if native argon2 module has issues in execution environment
    const salt = await bcrypt.genSalt(12);
    return await bcrypt.hash(password, salt);
  }
}

export async function verifyPassword(hash: string, password: string): Promise<boolean> {
  try {
    if (hash.startsWith('$argon2')) {
      return await argon2.verify(hash, password);
    }
    return await bcrypt.compare(password, hash);
  } catch (error) {
    // If argon2 verification fails, attempt bcrypt fallback comparison
    try {
      return await bcrypt.compare(password, hash);
    } catch {
      return false;
    }
  }
}
