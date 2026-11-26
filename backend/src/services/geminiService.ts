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
import { GEMINI_FALLBACK_MODELS } from "../constants.js";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Checks whether an API error is a transient overload (503) or rate-limit/quota
 * error (429) that warrants trying a fallback model or degraded response.
 */
function isQuotaOrOverloadError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return (
    msg.includes("429") ||
    msg.includes("503") ||
    /rate limit|quota|high demand|overloaded|resource exhausted/i.test(msg)
  );
}

/**
 * Runs a non-streaming interaction across {@link GEMINI_FALLBACK_MODELS} in order,
 * falling back to the next model on 429/503 errors.
 */
async function createInteractionWithFallback(
  client: InstanceType<typeof GoogleGenAI>,
  input: string
): Promise<string> {
  let lastError: unknown;
  for (const model of GEMINI_FALLBACK_MODELS) {
    try {
      const interaction = await client.interactions.create({
        model,
        input,
        store: false,
      });
      return extractJSON(interaction.output_text ?? "{}");
    } catch (err) {
      lastError = err;
      if (!isQuotaOrOverloadError(err)) throw err;
    }
  }
  throw lastError;
}

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
  const systemInstruction = buildSystemPrompt(profile, aqiData);

  for (const model of GEMINI_FALLBACK_MODELS) {
    let emittedAny = false;
    try {
      const stream = await client.interactions.create({
        model,
        input: message,
        system_instruction: systemInstruction,
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
          emittedAny = true;
          yield { type: "delta", text: event.delta.text };
        } else if (event.event_type === "interaction.completed") {
          interactionId = interactionId ?? event.interaction?.id;
          yield { type: "done", interactionId };
          return;
        }
      }
      return;
    } catch (error) {
      if (!emittedAny && isQuotaOrOverloadError(error)) {
        continue;
      }
      const msg = error instanceof Error ? error.message : "Unknown error";
      yield { type: "error", text: msg };
      return;
    }
  }

  // All live models hit 429/503 — stream tailored winter-smog fallback guidance
  const city = aqiData?.city ?? profile?.location ?? "your city";
  const aqiText = aqiData?.aqi ? `AQI ${aqiData.aqi} (${aqiData.level})` : "elevated winter smog";
  const familyNote =
    profile?.hasChildren || profile?.hasElderly
      ? "\n- **Family Priority:** Children and elderly members should avoid outdoor exertion and wear a well-fitted N95/KN95 mask if stepping outside."
      : "";

  const fallbackReply = `### 🌬️ AirGuide Action Plan for ${city} (${aqiText})

- **Timing Matters:** During winter thermal inversions, PM2.5 peaks between **6–9 AM** and **6–10 PM**. Schedule essential errands between **12 PM – 4 PM** when dispersion is highest.
- **Indoor Air Protection:** Keep windows sealed during peak smog hours, run a HEPA purifier (or DIY box-fan MERV-13 filter), and wet-mop floors instead of dry sweeping to keep settled dust out of the air.
- **Low-Emission Choices:** Replacing one short car trip with metro/bus or carpooling cuts local PM2.5 and saves ~2.4 kg CO₂/day.${familyNote}

> *Note: Live Gemini API quota is temporarily exhausted on this key, so AirGuide provided tailored offline guidance.*`;

  yield { type: "delta", text: fallbackReply };
  yield { type: "done" };
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

  try {
    return await createInteractionWithFallback(client, prompt);
  } catch (err) {
    if (!isQuotaOrOverloadError(err)) throw err;
    return JSON.stringify({
      morning: [
        { time: "7:00 AM", activity: "Indoor stretching & hydration", tip: "Avoid early-morning outdoor walks when winter inversion traps PM2.5.", impact: "Cuts morning PM2.5 inhalation by ~60%", emoji: "🌅" },
        { time: "8:30 AM", activity: `${profile.commute === "car" ? "Carpool or metro commute" : "Filtered commute"}`, tip: "Use cabin recirculation mode or wear an N95 mask.", impact: "Saves ~2.4 kg CO₂/day", emoji: "🚇" },
      ],
      afternoon: [
        { time: "1:00 PM", activity: "Brief outdoor errands & ventilation", tip: "12–4 PM has the best winter air dispersion; ventilate for 10 mins if outdoor AQI permits.", impact: "Refreshes indoor CO₂ safely", emoji: "☀️" },
      ],
      evening: [
        { time: "6:30 PM", activity: `Low-smoke ${profile.cookingType} cooking`, tip: "Run exhaust fan + cover pots; avoid incense or candles.", impact: "Reduces indoor PM2.5 spikes by ~50%", emoji: "🌆" },
      ],
      general_tips: [
        "Wet-mop floors daily instead of dry sweeping to avoid resuspending fine dust.",
        "Keep indoor humidity between 40–55% to help particles settle.",
      ],
      emergency_protocol: "When AQI > 200: seal window gaps with weatherstripping, run HEPA filtration continuously, and keep children and elderly indoors.",
      co2_saved_per_day_kg: 2.8,
      health_score_improvement: "Estimated 35–45% lower daily PM2.5 exposure",
    });
  }
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

  try {
    return await createInteractionWithFallback(client, prompt);
  } catch (err) {
    if (!isQuotaOrOverloadError(err)) throw err;
    const mapped = choices.map((c) => ({
      category: c.category,
      currentBehavior: c.currentBehavior,
      alternative: c.proposedAlternative,
      co2SavedKgPerYear: 420,
      pm25ImpactPercent: 18,
      costSavingINRPerYear: 12000,
      healthBenefit: "Lower respiratory irritation and reduced household PM2.5 exposure.",
      difficultyLevel: "easy",
      implementationTips: ["Start 3 days per week and track weekly progress", "Pair with peak-hour smog alerts"],
    }));
    return JSON.stringify({
      totalCO2SavedKgPerYear: mapped.length * 420,
      pm25ReductionPercent: Math.min(60, mapped.length * 15),
      healthScoreImprovement: "Significant reduction in daily PM2.5 & NO₂ exposure",
      choices: mapped,
      overallMessage: `Adopting these ${mapped.length} sustainable change(s) in ${profile?.location ?? "your city"} meaningfully reduces both personal exposure and neighborhood emissions.`,
      equivalentTrees: mapped.length * 19,
    });
  }
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

  try {
    return await createInteractionWithFallback(client, prompt);
  } catch (err) {
    if (!isQuotaOrOverloadError(err)) throw err;
    return JSON.stringify({
      quickWins: [
        { hack: "Wet-mop hard floors instead of dry sweeping", impact: "Prevents settled PM2.5 & PM10 dust from re-entering the air", cost: "free", emoji: "🧹" },
        { hack: "Seal window & door gaps with foam weatherstripping", impact: "Blocks 30–50% of outdoor winter smog infiltration", cost: "low", emoji: "🪟" },
        { hack: "Build a DIY Corsi-Rosenthal box-fan + MERV-13 filter", impact: "Captures fine PM2.5 at a fraction of commercial purifier cost", cost: "low", emoji: "💨" },
      ],
      plants: [
        { name: "Snake Plant (Sansevieria)", targetPollutant: "NO₂ & Formaldehyde", careLevel: "easy", placementTip: "Place in bedrooms; releases oxygen at night" },
        { name: "Areca Palm", targetPollutant: "VOCs & indoor humidity", careLevel: "easy", placementTip: "Keep near bright living-room windows" },
      ],
      ventilation: [
        { strategy: "Midday cross-ventilation window", when: "12:30 PM – 3:30 PM", why: "Thermal inversion lifts in early afternoon, giving the lowest outdoor PM2.5 of the day" },
      ],
      cookingTips: [
        { tip: `Use exhaust hood + lids when cooking on ${request.cookingType}`, pollutantReduced: "NO₂ & ultrafine particles", impact: "Cuts kitchen PM2.5 spikes by up to 55%" },
      ],
      purifierAdvice: {
        needed: true,
        minCadr: 250,
        filterType: "True HEPA H13 + Activated Carbon",
        recommendation: `Recommended for a ${request.homeType} during ${request.aqiLevel ?? "elevated"} AQI days; keep bedroom doors closed at night.`,
      },
      seasonalTips: {
        winter: ["Avoid burning incense, dhoop, or wood indoors during winter smog.", "Run purifier on medium-high from 6 PM to 9 AM."],
        general: ["Wash bedding weekly in warm water to clear trapped allergens."],
      },
      emergencyProtocol: "When outdoor AQI exceeds 200, keep all exterior doors/windows sealed, place damp towels under drafty door gaps, and keep HEPA filtration running continuously.",
    });
  }
}
