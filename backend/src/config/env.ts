import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const postgresUrlSchema = z
  .string()
  .min(1, 'DATABASE_URL is required')
  .refine(
    (value) => value.startsWith('postgresql://') || value.startsWith('postgres://'),
    'DATABASE_URL must be a PostgreSQL connection string'
  )
  .refine(
    (value) => !/(USERNAME|PASSWORD|HOST|YOUR_|example)/i.test(value),
    'DATABASE_URL still contains placeholder values'
  );

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  HOST: z.string().min(1).default('0.0.0.0'),
  DATABASE_URL: postgresUrlSchema,
  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 characters long'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters long'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),
  CORS_ORIGIN: z.string().default('http://localhost:3000,http://localhost:5173'),
  SEED_ADMIN_USERNAME: z.string().default('admin'),
  SEED_ADMIN_EMAIL: z.string().email().default('sk.kabungaan.admin@gmail.com'),
  SEED_ADMIN_PASSWORD: z.string().min(12).optional(),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  const fields = Object.keys(_env.error.flatten().fieldErrors);
  console.error(
    `❌ Invalid environment configuration${fields.length ? `: ${fields.join(', ')}` : ''}. ` +
      'Check backend/.env. Secret values are not printed.'
  );
  throw new Error('Invalid environment variables');
}

export const env = _env.data;
