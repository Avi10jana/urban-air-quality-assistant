// ============================================================
// TYPES — shared TypeScript interfaces
// ============================================================

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
  so2?: number;
  co?: number;
  timestamp: string;
  dominantPollutant?: string;
  healthImplication: string;
  cautionaryStatement: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export interface ChatRequest {
  message: string;
  previousInteractionId?: string;
  profile?: Partial<UserProfile>;
  aqiData?: Partial<AQIData>;
}

export interface RoutineRequest {
  profile: UserProfile;
  aqiData?: Partial<AQIData>;
}

export interface ImpactRequest {
  choices: LifestyleChoice[];
  profile?: Partial<UserProfile>;
}

export interface LifestyleChoice {
  category: string;
  currentBehavior: string;
  proposedAlternative: string;
}

export interface IndoorHacksRequest {
  homeType: HomeType;
  cookingType: CookingType;
  pollutants?: string[];
  aqiLevel?: AQILevel;
  budget?: "low" | "medium" | "high";
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}
