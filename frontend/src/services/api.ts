import type { AQIData, UserProfile, LifestyleChoice } from "../types";

const API_BASE = "/api";

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

interface IndoorHacksRequest {
  homeType: string;
  cookingType: string;
  pollutants?: string[];
  aqiLevel?: string;
  budget?: string;
}

export async function fetchAQI(city: string): Promise<AQIData> {
  const res = await fetch(`${API_BASE}/aqi?city=${encodeURIComponent(city)}`);
  const json: ApiResponse<AQIData> = await res.json();
  if (!json.success || !json.data) throw new Error(json.error ?? "Failed to fetch AQI");
  return json.data;
}

export async function fetchAQIByCoords(lat: number, lon: number): Promise<AQIData> {
  const res = await fetch(`${API_BASE}/aqi?lat=${lat}&lon=${lon}`);
  const json: ApiResponse<AQIData> = await res.json();
  if (!json.success || !json.data) throw new Error(json.error ?? "Failed to fetch AQI");
  return json.data;
}

export async function* streamChat(
  message: string,
  previousInteractionId?: string,
  profile?: Partial<UserProfile>,
  aqiData?: Partial<AQIData>
): AsyncGenerator<{ type: "delta" | "done" | "error"; text?: string; interactionId?: string }> {
  const response = await fetch(`${API_BASE}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, previousInteractionId, profile, aqiData }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: "Chat request failed" }));
    yield { type: "error", text: err.error ?? "Chat request failed" };
    return;
  }

  const reader = response.body?.getReader();
  if (!reader) { yield { type: "error", text: "No response body" }; return; }

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (line.startsWith("data: ")) {
        try {
          const payload = JSON.parse(line.slice(6));
          yield payload;
        } catch {
          // skip malformed
        }
      }
    }
  }
}

export async function generateRoutines(
  profile: UserProfile,
  aqiData?: Partial<AQIData>
) {
  const res = await fetch(`${API_BASE}/routines`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ profile, aqiData }),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error ?? "Failed to generate routines");
  return json.data;
}

export async function analyzeImpact(
  choices: LifestyleChoice[],
  profile?: Partial<UserProfile>
) {
  const res = await fetch(`${API_BASE}/routines/impact`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ choices, profile }),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error ?? "Failed to analyze impact");
  return json.data;
}

export async function fetchIndoorHacks(request: IndoorHacksRequest) {
  const res = await fetch(`${API_BASE}/routines/indoor-hacks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error ?? "Failed to fetch indoor hacks");
  return json.data;
}
