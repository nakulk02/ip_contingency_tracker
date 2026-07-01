import { z } from "zod";

/**
 * Validates required environment variables at startup.
 *
 * Import this module anywhere early in the app's lifecycle (it self-executes
 * on import) so misconfiguration fails fast with a clear error instead of
 * surfacing later as a confusing runtime failure deep in a request handler.
 */
const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required (postgresql connection string)"),
  NEXTAUTH_SECRET: z
    .string()
    .min(
      32,
      "NEXTAUTH_SECRET must be at least 32 characters (generate with: openssl rand -base64 32)"
    ),
  NEXTAUTH_URL: z.string().url("NEXTAUTH_URL must be a valid URL").optional(),
  REDIS_URL: z.string().min(1).optional(),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace"]).optional(),
  NODE_ENV: z.enum(["development", "production", "test"]).optional(),
});

export type Env = z.infer<typeof envSchema>;

function validateEnv(): Env {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");
    // Intentionally thrown rather than logged: this must stop startup, not just warn.
    throw new Error(
      `Invalid environment configuration:\n${issues}\n\nSee .env.example for reference.`
    );
  }

  return result.data;
}

export const env = validateEnv();
