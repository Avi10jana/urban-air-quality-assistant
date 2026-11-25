import type { Request, Response, NextFunction } from "express";
import { z } from "zod";

export const UserProfileSchema = z.object({
  name: z.string().max(100).optional(),
  location: z.string().min(1).max(200),
  familySize: z.number().int().min(1).max(20).default(1),
  hasChildren: z.boolean().default(false),
  hasElderly: z.boolean().default(false),
  lifestyle: z.enum(["urban", "suburban", "rural"]).default("urban"),
  commute: z.enum(["car", "public_transport", "walking", "cycling", "work_from_home"]).default("car"),
  homeType: z.enum(["apartment", "house", "studio"]).default("apartment"),
  cookingType: z.enum(["gas", "electric", "induction"]).default("gas"),
  currentConcerns: z.array(z.string().max(100)).max(10).default([]),
});

export const ChatRequestSchema = z.object({
  message: z.string().min(1).max(2000),
  previousInteractionId: z.string().optional(),
  profile: UserProfileSchema.partial().optional(),
  aqiData: z.object({
    city: z.string().optional(),
    aqi: z.number().optional(),
    level: z.string().optional(),
    pm25: z.number().optional(),
    pm10: z.number().optional(),
    dominantPollutant: z.string().optional(),
    healthImplication: z.string().optional(),
  }).optional(),
});

export const RoutineRequestSchema = z.object({
  profile: UserProfileSchema,
  aqiData: z.object({
    city: z.string().optional(),
    aqi: z.number().optional(),
    level: z.string().optional(),
    pm25: z.number().optional(),
    pm10: z.number().optional(),
    dominantPollutant: z.string().optional(),
    healthImplication: z.string().optional(),
  }).optional(),
});

export const ImpactRequestSchema = z.object({
  choices: z.array(z.object({
    category: z.string().min(1).max(100),
    currentBehavior: z.string().min(1).max(300),
    proposedAlternative: z.string().min(1).max(300),
  })).min(1).max(10),
  profile: UserProfileSchema.partial().optional(),
});

export const IndoorHacksRequestSchema = z.object({
  homeType: z.enum(["apartment", "house", "studio"]).default("apartment"),
  cookingType: z.enum(["gas", "electric", "induction"]).default("gas"),
  pollutants: z.array(z.string()).optional(),
  aqiLevel: z.string().optional(),
  budget: z.enum(["low", "medium", "high"]).default("medium"),
});

export function validate<T>(schema: z.ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({
        success: false,
        error: "Validation failed",
        details: result.error.flatten().fieldErrors,
        timestamp: new Date().toISOString(),
      });
      return;
    }
    req.body = result.data;
    next();
  };
}
