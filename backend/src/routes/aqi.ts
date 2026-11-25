import { Router } from "express";
import { getAQIByCity, getAQIByCoords, getMockAQI } from "../services/aqiService.js";
import { aqiRateLimiter } from "../middleware/rateLimiter.js";

const router = Router();

/**
 * GET /api/aqi?city=Delhi
 * GET /api/aqi?lat=28.6&lon=77.2
 */
router.get("/", aqiRateLimiter, async (req, res) => {
  const { city, lat, lon } = req.query;

  if (lat && lon) {
    const latNum = parseFloat(lat as string);
    const lonNum = parseFloat(lon as string);
    if (isNaN(latNum) || isNaN(lonNum)) {
      res.status(400).json({ success: false, error: "Invalid lat/lon values", timestamp: new Date().toISOString() });
      return;
    }
    try {
      const data = await getAQIByCoords(latNum, lonNum);
      res.json({ success: true, data, timestamp: new Date().toISOString() });
    } catch {
      res.status(500).json({ success: false, error: "Failed to fetch AQI data", timestamp: new Date().toISOString() });
    }
    return;
  }

  if (city && typeof city === "string") {
    try {
      const data = await getAQIByCity(city.trim());
      res.json({ success: true, data, timestamp: new Date().toISOString() });
    } catch {
      res.status(500).json({ success: false, error: "Failed to fetch AQI data", timestamp: new Date().toISOString() });
    }
    return;
  }

  // Return mock data for a default city if no params
  const data = getMockAQI("delhi");
  res.json({ success: true, data, timestamp: new Date().toISOString() });
});

export default router;
