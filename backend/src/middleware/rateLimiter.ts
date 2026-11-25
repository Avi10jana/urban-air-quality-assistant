/**
 * Rate limiting middleware using shared constants.
 * Skipped automatically during test runs.
 * @module rateLimiter
 */
import rateLimit from "express-rate-limit";
import {
  CHAT_RATE_LIMIT,
  AQI_RATE_LIMIT,
  GLOBAL_RATE_LIMIT,
} from "../constants.js";

const isTest = (): boolean => process.env.NODE_ENV === "test";

/** Limits chat/AI requests: {@link CHAT_RATE_LIMIT} per 15 minutes */
export const chatRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1_000,
  max: CHAT_RATE_LIMIT,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: "Too many chat requests, please slow down." },
  skip: isTest,
});

/** Limits AQI data requests: {@link AQI_RATE_LIMIT} per minute */
export const aqiRateLimiter = rateLimit({
  windowMs: 60 * 1_000,
  max: AQI_RATE_LIMIT,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: "Too many AQI requests, please wait." },
  skip: isTest,
});

/** Global IP-level limiter: {@link GLOBAL_RATE_LIMIT} requests per 15 minutes */
export const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1_000,
  max: GLOBAL_RATE_LIMIT,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: "Too many requests from this IP, please try again later." },
  skip: isTest,
});
