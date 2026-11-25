// Shared TypeScript types for the frontend
export type AQILevel =
  | "Good"
  | "Moderate"
  | "Unhealthy for Sensitive Groups"
  | "Unhealthy"
  | "Very Unhealthy"
  | "Hazardous";

export type LifestyleType = "urban" | "suburban" | "rural";
export type CommuteType =
  | "car"
  | "public_transport"
  | "walking"
  | "cycling"
  | "work_from_home";
export type HomeType = "apartment" | "house" | "studio";
export type CookingType = "gas" | "electric" | "induction";

export interface UserProfile {
  name?: string;
  location: string;
  familySize: number;
  hasChildren: boolean;
  hasElderly: boolean;
  lifestyle: LifestyleType;
  commute: CommuteType;
  homeType: HomeType;
  cookingType: CookingType;
  currentConcerns: string[];
}

export interface AQIData {
  city: string;
  aqi: number;
  level: AQILevel;
  color: string;
  pm25: number;
  pm10: number;
  no2?: number;
  o3?: number;
  timestamp: string;
  dominantPollutant?: string;
  healthImplication: string;
  cautionaryStatement: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}

export interface DailyActivity {
  time: string;
  activity: string;
  tip: string;
  impact: string;
  emoji: string;
}

export interface DailyRoutine {
  morning: DailyActivity[];
  afternoon: DailyActivity[];
  evening: DailyActivity[];
  general_tips: string[];
  emergency_protocol: string;
  co2_saved_per_day_kg: number;
  health_score_improvement: string;
}

export interface LifestyleChoice {
  category: string;
  currentBehavior: string;
  proposedAlternative: string;
}

export interface ImpactChoice {
  category: string;
  currentBehavior: string;
  alternative: string;
  co2SavedKgPerYear: number;
  pm25ImpactPercent: number;
  costSavingINRPerYear: number;
  healthBenefit: string;
  difficultyLevel: "easy" | "medium" | "hard";
  implementationTips: string[];
}

export interface ImpactAnalysis {
  totalCO2SavedKgPerYear: number;
  pm25ReductionPercent: number;
  healthScoreImprovement: string;
  choices: ImpactChoice[];
  overallMessage: string;
  equivalentTrees: number;
}

export interface IndoorPlant {
  name: string;
  targetPollutant: string;
  careLevel: "easy" | "medium" | "hard";
  placementTip: string;
}

export interface IndoorHacks {
  quickWins: Array<{ hack: string; impact: string; cost: string; emoji: string }>;
  plants: IndoorPlant[];
  ventilation: Array<{ strategy: string; when: string; why: string }>;
  cookingTips: Array<{ tip: string; pollutantReduced: string; impact: string }>;
  purifierAdvice: { needed: boolean; minCadr: number; filterType: string; recommendation: string };
  seasonalTips: { winter: string[]; general: string[] };
  emergencyProtocol: string;
}

export type AppTab = "dashboard" | "chat" | "routines" | "impact" | "indoor";
