// ============================================
// STRUCTURED LOGGER
// Central logging utility for ClauseWall
// - JSON output in production
// - Human-readable in development
// ============================================

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogMeta {
  [key: string]: unknown;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const isDev = process.env.NODE_ENV === "development";

// In production, skip debug logs
const MIN_LEVEL: number = isDev ? LOG_LEVELS.debug : LOG_LEVELS.info;

/**
 * Core log function — formats output based on environment.
 *
 * Production: JSON structured output (parseable by log aggregators)
 * Development: Human-readable colored output
 */
function emit(
  level: LogLevel,
  module: string,
  message: string,
  meta?: LogMeta,
): void {
  if (LOG_LEVELS[level] < MIN_LEVEL) return;

  const timestamp = new Date().toISOString();

  if (!isDev) {
    // Production: structured JSON
    const entry: Record<string, unknown> = {
      timestamp,
      level,
      module,
      message,
    };

    if (meta && Object.keys(meta).length > 0) {
      entry.meta = meta;
    }

    const output = JSON.stringify(entry);

    switch (level) {
      case "error":
        console.error(output);
        break;
      case "warn":
        console.warn(output);
        break;
      default:
        console.log(output);
    }
  } else {
    // Development: human-readable
    const prefix = `[${timestamp.slice(11, 23)}] [${level.toUpperCase().padEnd(5)}] [${module}]`;
    const metaStr =
      meta && Object.keys(meta).length > 0
        ? ` ${JSON.stringify(meta)}`
        : "";

    switch (level) {
      case "error":
        console.error(`${prefix} ${message}${metaStr}`);
        break;
      case "warn":
        console.warn(`${prefix} ${message}${metaStr}`);
        break;
      case "debug":
        console.debug(`${prefix} ${message}${metaStr}`);
        break;
      default:
        console.log(`${prefix} ${message}${metaStr}`);
    }
  }
}

// ── Public API ──────────────────────────────────

export const log = {
  debug(module: string, message: string, meta?: LogMeta): void {
    emit("debug", module, message, meta);
  },

  info(module: string, message: string, meta?: LogMeta): void {
    emit("info", module, message, meta);
  },

  warn(module: string, message: string, meta?: LogMeta): void {
    emit("warn", module, message, meta);
  },

  error(module: string, message: string, meta?: LogMeta): void {
    emit("error", module, message, meta);
  },

  /**
   * Log an error object safely — extracts message without leaking the full stack.
   * Use this in catch blocks instead of `console.error("...", error)`.
   */
  errorWithCause(
    module: string,
    message: string,
    error: unknown,
    meta?: LogMeta,
  ): void {
    const errorMessage =
      error instanceof Error ? error.message : String(error);
    emit("error", module, message, {
      ...meta,
      errorMessage,
      errorType: error instanceof Error ? error.constructor.name : typeof error,
    });
  },
};

export type { LogLevel, LogMeta };
