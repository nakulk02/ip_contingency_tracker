import pino from "pino";

/**
 * Structured application logger.
 *
 * - In production: emits JSON lines (suitable for log aggregation).
 * - In development: emits human-readable, colorized output via pino-pretty.
 *
 * Usage:
 *   logger.info({ userId }, "user logged in");
 *   logger.error({ err }, "failed to process request");
 */
export const logger = pino({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === "production" ? "info" : "debug"),
  ...(process.env.NODE_ENV !== "production"
    ? {
        transport: {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "SYS:standard",
            ignore: "pid,hostname",
          },
        },
      }
    : {}),
  // Never log sensitive fields even if accidentally passed in metadata.
  redact: {
    paths: ["password", "hashedPassword", "token", "apiKey", "authorization"],
    censor: "[REDACTED]",
  },
});

export default logger;
