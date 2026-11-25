/**
 * AirGuide Backend Server
 * Express + TypeScript API powering the Urban Air Quality Assistant
 */
import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { globalRateLimiter } from "./middleware/rateLimiter.js";
import { requestId, sanitizeBody } from "./middleware/security.js";
import chatRouter from "./routes/chat.js";
import aqiRouter from "./routes/aqi.js";
import routinesRouter from "./routes/routines.js";

const app = express();
const PORT = parseInt(process.env.PORT ?? "3001", 10);
const CORS_ORIGIN = process.env.CORS_ORIGIN ?? "http://localhost:5173";

// ─── Security Headers ─────────────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: false,          // handled by frontend
  crossOriginEmbedderPolicy: false,
}));
app.use(requestId);                      // unique request tracing

// ─── CORS ─────────────────────────────────────────────────────────────────────
app.use(cors({
  origin: [CORS_ORIGIN, "http://localhost:5174", "http://127.0.0.1:5173"],
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
}));

// ─── Body Parsing + Sanitisation ──────────────────────────────────────────────
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(sanitizeBody);                   // strip null bytes / control chars

// ─── Rate Limiting ────────────────────────────────────────────────────────────
app.use(globalRateLimiter);

// ─── Request Logging (safe — never logs body) ─────────────────────────────────
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    // Safe: logs method, path, status and duration only — no body/query values
    console.log(
      `[${new Date().toISOString()}] ${req.method} ${req.path} ${res.statusCode} ${duration}ms`
    );
  });
  next();
});

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({
    status: "healthy",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    // Never expose the key itself — only whether it's configured
    geminiConfigured: !!process.env.GEMINI_API_KEY,
    openaqConfigured: !!process.env.OPENAQ_API_KEY,
  });
});

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use("/api/chat",     chatRouter);
app.use("/api/aqi",      aqiRouter);
app.use("/api/routines", routinesRouter);

// ─── 404 ──────────────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: "Route not found",
    timestamp: new Date().toISOString(),
  });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  // Log error details server-side only — never expose stack traces to clients
  console.error(`[ERROR] ${err.message}`);
  res.status(500).json({
    success: false,
    error: "Internal server error",
    timestamp: new Date().toISOString(),
  });
});

// ─── Start ────────────────────────────────────────────────────────────────────
const server = app.listen(PORT, () => {
  console.log(`🌍 Urban Air Quality API running on http://localhost:${PORT}`);
  // Safe: does not log the key value
  console.log(`🔑 Gemini API: ${process.env.GEMINI_API_KEY ? "configured" : "NOT configured ⚠️"}`);
  console.log(`🌐 CORS origin: ${CORS_ORIGIN}`);
});

// ─── Graceful Shutdown ────────────────────────────────────────────────────────
const shutdown = () => {
  console.log("Shutting down gracefully...");
  server.close(() => { process.exit(0); });
};
process.on("SIGTERM", shutdown);
process.on("SIGINT",  shutdown);

export { app };
