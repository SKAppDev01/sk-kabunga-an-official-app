import bcrypt from 'bcryptjs';

const BCRYPT_ROUNDS = 12;

type Argon2Module = {
  hash: (
    password: string,
    options?: {
      type?: number;
      memoryCost?: number;
      timeCost?: number;
      parallelism?: number;
    }
  ) => Promise<string>;
  verify: (hash: string, password: string) => Promise<boolean>;
  argon2id: number;
};

let cachedArgon2: Argon2Module | null | undefined;

async function loadArgon2(): Promise<Argon2Module | null> {
  if (cachedArgon2 !== undefined) {
    return cachedArgon2;
  }

  try {
    // Dynamic import allows Argon2 to remain optional.
    // Termux/Android can fall back to bcryptjs if the native module
    // cannot be installed.
    const moduleName = 'argon2';
    const imported = await import(moduleName);

    cachedArgon2 = ((imported as any).default ?? imported) as Argon2Module;
    return cachedArgon2;
  } catch {
    cachedArgon2 = null;
    return null;
  }
}

export async function hashPassword(password: string): Promise<string> {
  const argon2 = await loadArgon2();

  if (argon2) {
    try {
      return await argon2.hash(password, {
        type: argon2.argon2id,
        memoryCost: 2 ** 16,
        timeCost: 3,
        parallelism: 1,
      });
    } catch {
      // Continue to bcrypt fallback below.
    }
  }

  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function verifyPassword(
  hash: string,
  password: string
): Promise<boolean> {
  try {
    if (hash.startsWith('$argon2')) {
      const argon2 = await loadArgon2();

      if (!argon2) {
        return false;
      }

      return await argon2.verify(hash, password);
    }

    return await bcrypt.compare(password, hash);
  } catch {
    return false;
  }
}
