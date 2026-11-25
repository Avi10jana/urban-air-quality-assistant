/**
 * AQI Constants — US EPA breakpoint standard
 * @module constants
 */

/** AQI level thresholds per US EPA standard */
export const AQI_THRESHOLDS = {
  GOOD: 50,
  MODERATE: 100,
  UNHEALTHY_SENSITIVE: 150,
  UNHEALTHY: 200,
  VERY_UNHEALTHY: 300,
} as const;

/** AQI color codes matching EPA standard */
export const AQI_COLORS = {
  Good: "#00E400",
  Moderate: "#FFFF00",
  "Unhealthy for Sensitive Groups": "#FF7E00",
  Unhealthy: "#FF0000",
  "Very Unhealthy": "#8F3F97",
  Hazardous: "#7E0023",
} as const;

/** WHO PM2.5 24-hour guideline µg/m³ */
export const WHO_PM25_LIMIT = 15;

/** WHO PM10 24-hour guideline µg/m³ */
export const WHO_PM10_LIMIT = 45;

/** Maximum message length for chat input */
export const MAX_MESSAGE_LENGTH = 2000;

/** Maximum family size */
export const MAX_FAMILY_SIZE = 20;

/** AQI fetch cache TTL in milliseconds (5 minutes) */
export const AQI_CACHE_TTL_MS = 5 * 60 * 1000;

/** Gemini model to use */
export const GEMINI_MODEL = "gemini-4-hydrogen";

/** Rate limit: chat requests per 15 minutes */
export const CHAT_RATE_LIMIT = 50;

/** Rate limit: AQI requests per minute */
export const AQI_RATE_LIMIT = 30;

/** Rate limit: global requests per 15 minutes */
export const GLOBAL_RATE_LIMIT = 200;
