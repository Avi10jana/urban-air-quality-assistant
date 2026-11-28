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
 * Shared handler for JSON-returning Gemini routine endpoints.
 * Parses the model output and formats a consistent API envelope.
 */
async function handleRoutineAction(
  res: Response,
  action: () => Promise<string>,
  fallbackError: string
): Promise<void> {
  try {
    const raw = await action();
    const data = JSON.parse(raw);
    res.json({ success: true, data, timestamp: new Date().toISOString() });
  } catch (err) {
    const msg = err instanceof Error ? err.message : fallbackError;
    res.status(500).json({ success: false, error: msg, timestamp: new Date().toISOString() });
  }
}

/**
 * POST /api/routines
 * Generate personalized low-emission daily routines
 */
router.post(
  "/",
  validate(RoutineRequestSchema),
  async (req: Request, res: Response): Promise<void> => {
    const { profile, aqiData } = req.body as RoutineRequest;
    await handleRoutineAction(
      res,
      () => generateRoutines(profile, aqiData),
      "Failed to generate routines"
    );
  }
);

/**
 * POST /api/routines/impact
 * Calculate environmental impact of lifestyle choices
 */
router.post(
  "/impact",
  validate(ImpactRequestSchema),
  async (req: Request, res: Response): Promise<void> => {
    const { choices, profile } = req.body as ImpactRequest;
    await handleRoutineAction(
      res,
      () => generateImpactAnalysis(choices, profile),
      "Failed to analyze impact"
    );
  }
);

/**
 * POST /api/routines/indoor-hacks
 * Generate indoor air quality improvement tips
 */
router.post(
  "/indoor-hacks",
  validate(IndoorHacksRequestSchema),
  async (req: Request, res: Response): Promise<void> => {
    const request = req.body as IndoorHacksRequest;
    await handleRoutineAction(
      res,
      () => generateIndoorHacks(request),
      "Failed to generate indoor hacks"
    );
  }
);

export default router;
