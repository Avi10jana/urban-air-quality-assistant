/**
 * Gemini AI Service — Streaming chat, routine generation, impact analysis
 * Uses @google/genai Interactions API (gemini-4-hydrogen)
 * @module geminiService
 */

import { GoogleGenAI } from "@google/genai";
import type {
  UserProfile,
  AQIData,
  LifestyleChoice,
  IndoorHacksRequest,
} from "../types/index.js";
import { GEMINI_MODEL } from "../constants.js";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Lazily initialises and returns the Gemini client.
 * @throws {Error} If GEMINI_API_KEY is not set in environment.
 */
function getClient(): InstanceType<typeof GoogleGenAI> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured");
  return new GoogleGenAI({ apiKey });
}

/**
 * Extracts a JSON object from a model response string.
 * Handles markdown code fences (```json ... ```) or bare JSON.
 */
function extractJSON(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) return fenced[1].trim();
  const bare = text.match(/(\{[\s\S]*\})/);
  return bare ? bare[1].trim() : text;
}

// ─── System Prompt ────────────────────────────────────────────────────────────

/**
 * Build a fully-contextualised system prompt for the AirGuide assistant.
 * Injects live AQI data and user profile for hyper-personalised responses.
 */
function buildSystemPrompt(
  profile?: Partial<UserProfile>,
  aqiData?: Partial<AQIData>
): string {
  const aqiContext = aqiData
    ? `
## Live Air Quality — ${aqiData.city ?? "User's Location"}
- **AQI**: ${aqiData.aqi} (${aqiData.level})
- **PM2.5**: ${aqiData.pm25} µg/m³ | **PM10**: ${aqiData.pm10} µg/m³
- **Dominant Pollutant**: ${aqiData.dominantPollutant ?? "PM2.5"}
- **Health Impact**: ${aqiData.healthImplication}`
    : "";

  const profileContext = profile
    ? `
## User Profile
- Location: ${profile.location ?? "Unknown"} | Family: ${profile.familySize ?? 1} member(s)
- Children: ${profile.hasChildren ? "Yes ⚠️" : "No"} | Elderly: ${profile.hasElderly ? "Yes ⚠️" : "No"}
- Lifestyle: ${profile.lifestyle ?? "urban"} | Commute: ${profile.commute ?? "car"}
- Home: ${profile.homeType ?? "apartment"} | Cooking: ${profile.cookingType ?? "gas"}
- Concerns: ${(profile.currentConcerns ?? []).join(", ") || "General"}`
    : "";

  return `You are **AirGuide**, an expert AI assistant helping families navigate severe winter smog and urban air pollution.
${aqiContext}
${profileContext}

## Your Core Mission
1. **Winter Smog Focus** — Address temperature inversions, biomass burning, vehicle emissions that trap pollutants in winter.
2. **Low-Emission Routines** — Practical morning/afternoon/evening plans that reduce pollution exposure AND contribution.
3. **Indoor Air Quality** — Budget-friendly hacks: plants, ventilation timing, purifiers, cooking adjustments.
4. **Sustainable Alternatives** — Always cite concrete impact (e.g., "switching to metro saves ~2.4 kg CO₂/day, cutting your PM2.5 exposure by ~35%").
5. **Family Safety** — Flag extra cautions for children (developing lungs), elderly (cardiovascular risk), pregnant women.
6. **Impact Education** — Explain the WHY behind every tip — link it to PM2.5, PM10, NO₂, or O₃ health effects.

## AQI Scale (US EPA)
| AQI | Level | Action |
|-----|-------|--------|
| 0–50 | 🟢 Good | No restrictions |
| 51–100 | 🟡 Moderate | Sensitive groups cautious |
| 101–150 | 🟠 Unhealthy for Sensitive Groups | Limit outdoor exertion |
| 151–200 | 🔴 Unhealthy | N95 mask + limit outdoor time |
| 201–300 | 🟣 Very Unhealthy | Health alert, avoid outdoors |
| 301+ | ⚫ Hazardous | Emergency, stay indoors |

## Communication Rules
- Be warm, empathetic, non-judgmental, and actionable
- Always quantify impact with numbers when possible
- Use markdown for readability (bullets, bold, headers)
- End every serious warning with a hopeful, concrete action step
- Prioritise advice by urgency and ease of implementation`;
}

// ─── Chat Streaming ───────────────────────────────────────────────────────────

/**
 * Streams a chat response from Gemini using Server-Sent Events.
 * Maintains multi-turn conversation via previous_interaction_id.
 *
 * @param message - User's input message
 * @param previousInteractionId - Optional ID for multi-turn context
 * @param profile - Optional user profile for personalisation
 * @param aqiData - Optional live AQI data for context
 * @yields Delta text chunks and final done/error events
 */
export async function* streamChatResponse(
  message: string,
  previousInteractionId?: string,
  profile?: Partial<UserProfile>,
  aqiData?: Partial<AQIData>
): AsyncGenerator<{
  type: "delta" | "done" | "error";
  text?: string;
  interactionId?: string;
}> {
  const client = getClient();

  try {
    const stream = await client.interactions.create({
      model: GEMINI_MODEL,
      input: message,
      system_instruction: buildSystemPrompt(profile, aqiData),
      ...(previousInteractionId && {
        previous_interaction_id: previousInteractionId,
      }),
      stream: true,
      store: true,
    });

    let interactionId: string | undefined;

    for await (const event of stream) {
      if (event.event_type === "interaction.created") {
        interactionId = event.interaction?.id;
      } else if (
        event.event_type === "step.delta" &&
        event.delta?.type === "text"
      ) {
        yield { type: "delta", text: event.delta.text };
      } else if (event.event_type === "interaction.completed") {
        interactionId = interactionId ?? event.interaction?.id;
        yield { type: "done", interactionId };
      }
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    yield { type: "error", text: msg };
  }
}

// ─── Routine Generation ───────────────────────────────────────────────────────

/**
 * Generate a personalised low-emission daily routine for the user.
 * Returns structured JSON with morning/afternoon/evening activities.
 *
 * @param profile - Full user profile
 * @param aqiData - Optional live AQI context
 * @returns JSON string with routine schedule
 */
export async function generateRoutines(
  profile: UserProfile,
  aqiData?: Partial<AQIData>
): Promise<string> {
  const client = getClient();
  const aqiInfo = aqiData
    ? `Current AQI: ${aqiData.aqi} (${aqiData.level}) in ${aqiData.city}. PM2.5: ${aqiData.pm25} µg/m³.`
    : "AQI data unavailable — provide general advice.";

  const prompt = `Generate a detailed low-emission daily routine for this family. Focus on WINTER SMOG conditions.

${aqiInfo}

User Profile:
- Location: ${profile.location} | Family: ${profile.familySize} | Children: ${profile.hasChildren} | Elderly: ${profile.hasElderly}
- Commute: ${profile.commute} | Home: ${profile.homeType} | Cooking: ${profile.cookingType}
- Concerns: ${profile.currentConcerns.join(", ")}

Return ONLY valid JSON (no markdown, no explanation) in this exact structure:
{
  "morning": [{"time":"6:00 AM","activity":"...","tip":"...","impact":"...","emoji":"🌅"}],
  "afternoon": [{"time":"12:00 PM","activity":"...","tip":"...","impact":"...","emoji":"☀️"}],
  "evening": [{"time":"6:00 PM","activity":"...","tip":"...","impact":"...","emoji":"🌆"}],
  "general_tips": ["tip1","tip2"],
  "emergency_protocol": "What to do if AQI spikes above 200",
  "co2_saved_per_day_kg": 0.0,
  "health_score_improvement": "Qualitative or % improvement"
}`;

  const interaction = await client.interactions.create({
    model: GEMINI_MODEL,
    input: prompt,
    store: false,
  });

  return extractJSON(interaction.output_text ?? "{}");
}

// ─── Impact Analysis ──────────────────────────────────────────────────────────

/**
 * Analyse the CO₂, PM2.5, and health impact of proposed lifestyle changes.
 *
 * @param choices - Array of current vs. proposed lifestyle changes
 * @param profile - Optional user profile for location context
 * @returns JSON string with per-choice and aggregate impact metrics
 */
export async function generateImpactAnalysis(
  choices: LifestyleChoice[],
  profile?: Partial<UserProfile>
): Promise<string> {
  const client = getClient();

  const choicesList = choices
    .map(
      (c, i) =>
        `${i + 1}. [${c.category}] Current: "${c.currentBehavior}" → Alternative: "${c.proposedAlternative}"`
    )
    .join("\n");

  const prompt = `Analyse the environmental and health impact of these lifestyle changes.
${profile?.location ? `User location: ${profile.location}` : ""}

${choicesList}

Return ONLY valid JSON (no markdown) in this exact structure:
{
  "totalCO2SavedKgPerYear": 0.0,
  "pm25ReductionPercent": 0,
  "healthScoreImprovement": "...",
  "choices": [
    {
      "category": "...",
      "currentBehavior": "...",
      "alternative": "...",
      "co2SavedKgPerYear": 0.0,
      "pm25ImpactPercent": 0,
      "costSavingINRPerYear": 0,
      "healthBenefit": "...",
      "difficultyLevel": "easy",
      "implementationTips": ["tip1","tip2"]
    }
  ],
  "overallMessage": "...",
  "equivalentTrees": 0
}`;

  const interaction = await client.interactions.create({
    model: GEMINI_MODEL,
    input: prompt,
    store: false,
  });

  return extractJSON(interaction.output_text ?? "{}");
}

// ─── Indoor Hacks ─────────────────────────────────────────────────────────────

/**
 * Generate practical indoor air quality improvement tips.
 * Tailored to home type, cooking method, budget, and outdoor AQI.
 *
 * @param request - Indoor hacks request parameters
 * @returns JSON string with categorised indoor air improvement strategies
 */
export async function generateIndoorHacks(
  request: IndoorHacksRequest
): Promise<string> {
  const client = getClient();

  const prompt = `Generate practical indoor air quality hacks for this home. Focus on WINTER SMOG season.

Home: ${request.homeType} | Cooking: ${request.cookingType}
Pollutants: ${(request.pollutants ?? ["PM2.5", "VOCs", "CO2"]).join(", ")}
Outdoor AQI Level: ${request.aqiLevel ?? "Moderate"} | Budget: ${request.budget ?? "medium"}

Return ONLY valid JSON (no markdown) in this exact structure:
{
  "quickWins": [{"hack":"...","impact":"...","cost":"free|low|medium|high","emoji":"🌿"}],
  "plants": [{"name":"...","targetPollutant":"...","careLevel":"easy|medium|hard","placementTip":"..."}],
  "ventilation": [{"strategy":"...","when":"...","why":"..."}],
  "cookingTips": [{"tip":"...","pollutantReduced":"...","impact":"..."}],
  "purifierAdvice": {"needed":true,"minCadr":0,"filterType":"HEPA","recommendation":"..."},
  "seasonalTips": {"winter":["tip1"],"general":["tip1"]},
  "emergencyProtocol": "Steps when outdoor AQI > 200"
}`;

  const interaction = await client.interactions.create({
    model: GEMINI_MODEL,
    input: prompt,
    store: false,
  });

  return extractJSON(interaction.output_text ?? "{}");
}
