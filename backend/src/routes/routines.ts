import { Router, type Request, type Response } from "express";
import {
  generateRoutines,
  generateImpactAnalysis,
  generateIndoorHacks,
} from "../services/geminiService.js";
import {
  validate,
  RoutineRequestSchema,
  ImpactRequestSchema,
  IndoorHacksRequestSchema,
} from "../middleware/validate.js";
import type { RoutineRequest, ImpactRequest, IndoorHacksRequest } from "../types/index.js";

const router = Router();

/**
 * POST /api/routines
 * Generate personalized low-emission daily routines
 */
router.post(
  "/",
  validate(RoutineRequestSchema),
  async (req: Request, res: Response): Promise<void> => {
    const { profile, aqiData } = req.body as RoutineRequest;
    try {
      const raw = await generateRoutines(profile, aqiData);
      const data = JSON.parse(raw);
      res.json({ success: true, data, timestamp: new Date().toISOString() });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to generate routines";
      res.status(500).json({ success: false, error: msg, timestamp: new Date().toISOString() });
    }
  }
);

/**
 * POST /api/impact
 * Calculate environmental impact of lifestyle choices
 */
router.post(
  "/impact",
  validate(ImpactRequestSchema),
  async (req: Request, res: Response): Promise<void> => {
    const { choices, profile } = req.body as ImpactRequest;
    try {
      const raw = await generateImpactAnalysis(choices, profile);
      const data = JSON.parse(raw);
      res.json({ success: true, data, timestamp: new Date().toISOString() });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to analyze impact";
      res.status(500).json({ success: false, error: msg, timestamp: new Date().toISOString() });
    }
  }
);

/**
 * POST /api/indoor-hacks
 * Generate indoor air quality improvement tips
 */
router.post(
  "/indoor-hacks",
  validate(IndoorHacksRequestSchema),
  async (req: Request, res: Response): Promise<void> => {
    const request = req.body as IndoorHacksRequest;
    try {
      const raw = await generateIndoorHacks(request);
      const data = JSON.parse(raw);
      res.json({ success: true, data, timestamp: new Date().toISOString() });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to generate indoor hacks";
      res.status(500).json({ success: false, error: msg, timestamp: new Date().toISOString() });
    }
  }
);

export default router;
