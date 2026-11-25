/**
 * Security middleware — request ID injection and input sanitisation
 */
import type { Request, Response, NextFunction } from "express";
import { randomUUID } from "crypto";

/**
 * Injects a unique request ID into every request for tracing.
 * Never exposes internal details in responses.
 */
export function requestId(req: Request, res: Response, next: NextFunction): void {
  const id = randomUUID();
  res.setHeader("X-Request-ID", id);
  (req as Request & { id: string }).id = id;
  next();
}

/**
 * Strips null bytes and control characters from string values in req.body
 * to prevent injection via JSON payloads.
 */
export function sanitizeBody(req: Request, _res: Response, next: NextFunction): void {
  if (req.body && typeof req.body === "object") {
    req.body = deepSanitize(req.body) as Record<string, unknown>;
  }
  next();
}

function deepSanitize(value: unknown): unknown {
  if (typeof value === "string") {
    // Remove null bytes and non-printable ASCII control chars (except tab/newline)
    return value.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "").trim();
  }
  if (Array.isArray(value)) return value.map(deepSanitize);
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([k, v]) => [
        k,
        deepSanitize(v),
      ])
    );
  }
  return value;
}
