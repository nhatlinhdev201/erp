import { z } from 'zod'

/**
 * Environment Variables Schema
 * Validates all environment variables at startup
 */
const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid PostgreSQL URL'),

  // Authentication
  NEXTAUTH_URL: z.string().url('NEXTAUTH_URL must be a valid URL'),
  NEXTAUTH_SECRET: z.string().min(32, 'NEXTAUTH_SECRET must be at least 32 characters'),
  AUTH_SECRET: z.string().min(32, 'AUTH_SECRET must be at least 32 characters'),

  // App
  NODE_ENV: z.enum(['development', 'test', 'staging', 'production']).default('development'),
  NEXT_PUBLIC_APP_NAME: z.string().default('L-ERP HRM'),
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),

  // AI (Optional)
  ANTHROPIC_API_KEY: z.string().optional(),

  // Email (Optional)
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  SMTP_FROM: z.string().email().optional(),

  // Redis (Optional)
  REDIS_URL: z.string().url().optional(),

  // S3/Storage (Optional)
  S3_BUCKET: z.string().optional(),
  S3_REGION: z.string().optional(),
  S3_ACCESS_KEY: z.string().optional(),
  S3_SECRET_KEY: z.string().optional(),

  // Monitoring (Optional)
  SENTRY_DSN: z.string().url().optional(),
})

export type Env = z.infer<typeof envSchema>

/**
 * Validates environment variables
 * Throws an error with details if validation fails
 */
function validateEnv(): Env {
  // Skip validation during build time
  if (process.env.SKIP_ENV_VALIDATION === 'true') {
    return process.env as unknown as Env
  }

  const parsed = envSchema.safeParse(process.env)

  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors
    const errorMessages = Object.entries(errors)
      .map(([field, messages]) => `  - ${field}: ${messages?.join(', ')}`)
      .join('\n')

    console.error('❌ Invalid environment variables:\n' + errorMessages)

    // In development, show a helpful message
    if (process.env.NODE_ENV === 'development') {
      console.error('\n💡 Tip: Copy .env.example to .env.local and update the values.')
    }

    throw new Error('Invalid environment variables')
  }

  return parsed.data
}

/**
 * Validated environment variables
 * Use this instead of process.env directly
 */
export const env = validateEnv()

/**
 * Helper to check if we're in production
 */
export const isProd = env.NODE_ENV === 'production'

/**
 * Helper to check if we're in development
 */
export const isDev = env.NODE_ENV === 'development'

/**
 * Helper to check if AI features are enabled
 */
export const isAIEnabled = !!env.ANTHROPIC_API_KEY

/**
 * Helper to check if email is configured
 */
export const isEmailEnabled = !!(
  env.SMTP_HOST &&
  env.SMTP_PORT &&
  env.SMTP_USER &&
  env.SMTP_PASSWORD
)
