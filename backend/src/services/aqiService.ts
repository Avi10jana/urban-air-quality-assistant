/**
 * AQI Service — Air Quality Index calculation & data fetching
 * Uses US EPA standard breakpoints and OpenAQ v3 API
 * @module aqiService
 */

import type { AQIData, AQILevel } from "../types/index.js";
import {
  AQI_THRESHOLDS,
  AQI_COLORS,
  AQI_CACHE_TTL_MS,
} from "../constants.js";

// ─── Types ───────────────────────────────────────────────────────────────────

interface AQIBreakpoint {
  aqiLow: number;
  aqiHigh: number;
  concLow: number;
  concHigh: number;
}

interface CacheEntry {
  data: AQIData;
  expiresAt: number;
}

// ─── US EPA Breakpoints ───────────────────────────────────────────────────────

/** PM2.5 breakpoints per US EPA standard (µg/m³) */
export const PM25_BREAKPOINTS: AQIBreakpoint[] = [
  { aqiLow: 0,   aqiHigh: 50,  concLow: 0.0,  concHigh: 12.0  },
  { aqiLow: 51,  aqiHigh: 100, concLow: 12.1, concHigh: 35.4  },
  { aqiLow: 101, aqiHigh: 150, concLow: 35.5, concHigh: 55.4  },
  { aqiLow: 151, aqiHigh: 200, concLow: 55.5, concHigh: 150.4 },
  { aqiLow: 201, aqiHigh: 300, concLow: 150.5,concHigh: 250.4 },
  { aqiLow: 301, aqiHigh: 500, concLow: 250.5,concHigh: 500.4 },
];

/** PM10 breakpoints per US EPA standard (µg/m³) */
export const PM10_BREAKPOINTS: AQIBreakpoint[] = [
  { aqiLow: 0,   aqiHigh: 50,  concLow: 0,   concHigh: 54  },
  { aqiLow: 51,  aqiHigh: 100, concLow: 55,  concHigh: 154 },
  { aqiLow: 101, aqiHigh: 150, concLow: 155, concHigh: 254 },
  { aqiLow: 151, aqiHigh: 200, concLow: 255, concHigh: 354 },
  { aqiLow: 201, aqiHigh: 300, concLow: 355, concHigh: 424 },
  { aqiLow: 301, aqiHigh: 500, concLow: 425, concHigh: 604 },
];

// ─── In-Memory Cache ──────────────────────────────────────────────────────────

/** Simple in-memory LRU-style AQI cache (max 100 entries) */
const aqiCache = new Map<string, CacheEntry>();
const MAX_CACHE_SIZE = 100;

function getCached(key: string): AQIData | null {
  const entry = aqiCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    aqiCache.delete(key);
    return null;
  }
  return entry.data;
}

function setCache(key: string, data: AQIData): void {
  if (aqiCache.size >= MAX_CACHE_SIZE) {
    // Evict oldest entry
    const firstKey = aqiCache.keys().next().value;
    if (firstKey) aqiCache.delete(firstKey);
  }
  aqiCache.set(key, { data, expiresAt: Date.now() + AQI_CACHE_TTL_MS });
}

// ─── Core Calculation ─────────────────────────────────────────────────────────

/**
 * Calculate AQI from raw concentration using EPA linear interpolation.
 * @param concentration - Raw pollutant concentration
 * @param breakpoints - EPA breakpoint table for the pollutant
 * @returns Calculated AQI integer (capped at 500)
 */
export function calculateAQIFromConc(
  concentration: number,
  breakpoints: AQIBreakpoint[]
): number {
  if (concentration <= 0) return 0;
  const bp = breakpoints.find(
    (b) => concentration >= b.concLow && concentration <= b.concHigh
  );
  if (!bp) return Math.min(500, Math.round(concentration));
  return Math.round(
    ((bp.aqiHigh - bp.aqiLow) / (bp.concHigh - bp.concLow)) *
      (concentration - bp.concLow) +
      bp.aqiLow
  );
}

/**
 * Map an AQI number to its EPA category level.
 * @param aqi - AQI value (0–500+)
 * @returns AQI level string
 */
export function getAQILevel(aqi: number): AQILevel {
  if (aqi <= AQI_THRESHOLDS.GOOD) return "Good";
  if (aqi <= AQI_THRESHOLDS.MODERATE) return "Moderate";
  if (aqi <= AQI_THRESHOLDS.UNHEALTHY_SENSITIVE) return "Unhealthy for Sensitive Groups";
  if (aqi <= AQI_THRESHOLDS.UNHEALTHY) return "Unhealthy";
  if (aqi <= AQI_THRESHOLDS.VERY_UNHEALTHY) return "Very Unhealthy";
  return "Hazardous";
}

/**
 * Returns the EPA standard hex color for an AQI level.
 */
export function getAQIColor(level: AQILevel): string {
  return AQI_COLORS[level];
}

/**
 * Returns WHO health implication text for the given AQI level.
 */
export function getHealthImplication(level: AQILevel): string {
  const implications: Record<AQILevel, string> = {
    Good: "Air quality is satisfactory with little or no risk.",
    Moderate: "Acceptable air quality; unusually sensitive individuals may experience minor symptoms.",
    "Unhealthy for Sensitive Groups": "Children, elderly, and those with respiratory/heart conditions should limit prolonged outdoor exertion.",
    Unhealthy: "Everyone may begin to experience health effects; sensitive groups face serious risks.",
    "Very Unhealthy": "Health alert — everyone may experience more serious effects. Avoid outdoor activity.",
    Hazardous: "Emergency condition. Everyone is at high risk — stay indoors and seal windows/doors.",
  };
  return implications[level];
}

/**
 * Returns actionable cautionary statement for the given AQI level.
 */
export function getCautionaryStatement(level: AQILevel): string {
  const statements: Record<AQILevel, string> = {
    Good: "No precautions needed. Enjoy outdoor activities.",
    Moderate: "Consider reducing prolonged outdoor exertion if you experience unusual symptoms.",
    "Unhealthy for Sensitive Groups": "Sensitive groups should wear N95 masks outdoors and keep indoor air filtered.",
    Unhealthy: "Everyone should wear N95 masks, run air purifiers, and limit time outdoors.",
    "Very Unhealthy": "Avoid all outdoor activity. Keep all windows closed. Run HEPA purifiers continuously.",
    Hazardous: "EMERGENCY: Stay indoors. Seal doors/windows. Use high-grade air purification. Seek medical help if symptomatic.",
  };
  return statements[level];
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

/**
 * Representative pollutant concentrations for major cities.
 * Used as fallback when OpenAQ API is unavailable.
 */
const CITY_MOCK_DATA: Record<string, { pm25: number; pm10: number; no2: number; o3: number }> = {
  "delhi":        { pm25: 180.5, pm10: 320.0, no2: 85.0, o3: 45.0 },
  "new delhi":    { pm25: 180.5, pm10: 320.0, no2: 85.0, o3: 45.0 },
  "mumbai":       { pm25: 65.2,  pm10: 110.0, no2: 55.0, o3: 38.0 },
  "beijing":      { pm25: 95.4,  pm10: 165.0, no2: 72.0, o3: 50.0 },
  "los angeles":  { pm25: 32.1,  pm10: 55.0,  no2: 42.0, o3: 68.0 },
  "london":       { pm25: 18.3,  pm10: 35.0,  no2: 48.0, o3: 32.0 },
  "new york":     { pm25: 22.6,  pm10: 42.0,  no2: 51.0, o3: 55.0 },
  "tokyo":        { pm25: 14.8,  pm10: 28.0,  no2: 38.0, o3: 42.0 },
  "sydney":       { pm25: 8.5,   pm10: 18.0,  no2: 22.0, o3: 30.0 },
  "kolkata":      { pm25: 142.0, pm10: 258.0, no2: 78.0, o3: 35.0 },
  "chennai":      { pm25: 55.0,  pm10: 92.0,  no2: 44.0, o3: 30.0 },
  "bangalore":    { pm25: 48.0,  pm10: 85.0,  no2: 40.0, o3: 32.0 },
  "lahore":       { pm25: 195.0, pm10: 340.0, no2: 90.0, o3: 48.0 },
  "karachi":      { pm25: 125.0, pm10: 220.0, no2: 68.0, o3: 40.0 },
  "shanghai":     { pm25: 72.0,  pm10: 125.0, no2: 60.0, o3: 55.0 },
  "default":      { pm25: 45.0,  pm10: 80.0,  no2: 35.0, o3: 40.0 },
};

/**
 * Build an AQIData object from raw pollutant measurements.
 */
function buildAQIData(
  city: string,
  pm25: number,
  pm10: number,
  no2: number,
  o3: number
): AQIData {
  const pm25AQI = calculateAQIFromConc(pm25, PM25_BREAKPOINTS);
  const pm10AQI = calculateAQIFromConc(pm10, PM10_BREAKPOINTS);
  const aqi = Math.max(pm25AQI, pm10AQI);
  const level = getAQILevel(aqi);
  return {
    city,
    aqi,
    level,
    color: getAQIColor(level),
    pm25,
    pm10,
    no2,
    o3,
    timestamp: new Date().toISOString(),
    dominantPollutant: pm25AQI >= pm10AQI ? "PM2.5" : "PM10",
    healthImplication: getHealthImplication(level),
    cautionaryStatement: getCautionaryStatement(level),
  };
}

/**
 * Returns mock AQI data for a city (case-insensitive lookup).
 * Falls back to default if city is not in the dataset.
 */
export function getMockAQI(city: string): AQIData {
  const key = city.toLowerCase().trim();
  const raw = CITY_MOCK_DATA[key] ?? CITY_MOCK_DATA["default"];
  return buildAQIData(city, raw.pm25, raw.pm10, raw.no2, raw.o3);
}

// ─── Live API ─────────────────────────────────────────────────────────────────

/**
 * Fetch real-time AQI data for a city via OpenAQ v3 API.
 * Falls back to mock data if API key is absent or request fails.
 * Results are cached for {@link AQI_CACHE_TTL_MS} ms.
 */
export async function getAQIByCity(city: string): Promise<AQIData> {
  const sanitizedCity = city.trim().slice(0, 100); // sanitize input length
  const cacheKey = `city:${sanitizedCity.toLowerCase()}`;

  const cached = getCached(cacheKey);
  if (cached) return cached;

  const apiKey = process.env.OPENAQ_API_KEY;
  if (!apiKey) return getMockAQI(sanitizedCity);

  try {
    const url = new URL("https://api.openaq.io/v3/locations");
    url.searchParams.set("city", sanitizedCity);
    url.searchParams.set("limit", "1");

    const response = await fetch(url.toString(), {
      headers: { "X-API-Key": apiKey, Accept: "application/json" },
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) return getMockAQI(sanitizedCity);

    const data = (await response.json()) as {
      results?: Array<{ parameters?: Array<{ parameter: string; lastValue: number }> }>;
    };
    if (!data.results?.length) return getMockAQI(sanitizedCity);

    const params = data.results[0].parameters ?? [];
    const getValue = (name: string): number =>
      params.find((p) => p.parameter === name)?.lastValue ?? 0;

    const result = buildAQIData(
      sanitizedCity,
      getValue("pm25"),
      getValue("pm10"),
      getValue("no2"),
      getValue("o3")
    );
    setCache(cacheKey, result);
    return result;
  } catch {
    return getMockAQI(sanitizedCity);
  }
}

/**
 * Fetch real-time AQI data by GPS coordinates via OpenAQ v3 API.
 * Falls back to mock data on failure.
 */
export async function getAQIByCoords(lat: number, lon: number): Promise<AQIData> {
  const cacheKey = `coords:${lat.toFixed(2)},${lon.toFixed(2)}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const apiKey = process.env.OPENAQ_API_KEY;
  if (!apiKey) return getMockAQI("your location");

  try {
    const url = new URL("https://api.openaq.io/v3/locations");
    url.searchParams.set("coordinates", `${lat},${lon}`);
    url.searchParams.set("radius", "25000");
    url.searchParams.set("limit", "1");

    const response = await fetch(url.toString(), {
      headers: { "X-API-Key": apiKey, Accept: "application/json" },
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) return getMockAQI("your location");

    const data = (await response.json()) as {
      results?: Array<{
        city?: string;
        parameters?: Array<{ parameter: string; lastValue: number }>;
      }>;
    };
    if (!data.results?.length) return getMockAQI("your location");

    const r = data.results[0];
    const cityName = r.city ?? "your location";
    const params = r.parameters ?? [];
    const getValue = (name: string): number =>
      params.find((p) => p.parameter === name)?.lastValue ?? 0;

    const result = buildAQIData(cityName, getValue("pm25"), getValue("pm10"), getValue("no2"), getValue("o3"));
    setCache(cacheKey, result);
    return result;
  } catch {
    return getMockAQI("your location");
  }
}
