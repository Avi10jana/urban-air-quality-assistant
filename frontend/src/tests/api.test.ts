import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchAQI, fetchAQIByCoords, generateRoutines, analyzeImpact, fetchIndoorHacks, streamChat } from "../services/api";

describe("API service", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("fetchAQI returns AQI data on success", async () => {
    const mockData = { city: "Delhi", aqi: 210, level: "Very Unhealthy", pm25: 160, pm10: 250, color: "#8F3F97", healthImplication: "Alert", cautionaryStatement: "Stay indoors", timestamp: new Date().toISOString() };
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      json: async () => ({ success: true, data: mockData }),
    } as Response);

    const result = await fetchAQI("Delhi");
    expect(result.city).toBe("Delhi");
    expect(result.aqi).toBe(210);
  });

  it("fetchAQI throws when success is false", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      json: async () => ({ success: false, error: "City not found" }),
    } as Response);

    await expect(fetchAQI("Unknown")).rejects.toThrow("City not found");
  });

  it("fetchAQIByCoords requests lat and lon query params", async () => {
    const mockData = { city: "Local", aqi: 45, level: "Good", pm25: 10, pm10: 20, color: "#00E400", healthImplication: "Good", cautionaryStatement: "None", timestamp: new Date().toISOString() };
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      json: async () => ({ success: true, data: mockData }),
    } as Response);

    const result = await fetchAQIByCoords(28.6, 77.2);
    expect(fetchSpy).toHaveBeenCalledWith("/api/aqi?lat=28.6&lon=77.2");
    expect(result.aqi).toBe(45);
  });

  it("generateRoutines posts profile and returns routines", async () => {
    const mockRoutines = { summary: "Low emission plan", morning: [], afternoon: [], evening: [] };
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      json: async () => ({ success: true, data: mockRoutines }),
    } as Response);

    const result = await generateRoutines({
      location: "Delhi",
      familySize: 4,
      hasChildren: true,
      hasElderly: false,
      lifestyle: "urban",
      commute: "car",
      homeType: "apartment",
      cookingType: "gas",
      currentConcerns: ["smog"],
    });
    expect(result.summary).toBe("Low emission plan");
  });

  it("analyzeImpact throws on error response", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      json: async () => ({ success: false, error: "Validation failed" }),
    } as Response);

    await expect(analyzeImpact([])).rejects.toThrow("Validation failed");
  });

  it("fetchIndoorHacks returns hacks on success", async () => {
    const mockHacks = { priorityActions: [], lowCostHacks: [], plants: [] };
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      json: async () => ({ success: true, data: mockHacks }),
    } as Response);

    const result = await fetchIndoorHacks({ homeType: "apartment", cookingType: "gas" });
    expect(result).toEqual(mockHacks);
  });

  it("streamChat yields error chunk on non-ok response", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "Rate limited" }),
    } as Response);

    const chunks = [];
    for await (const chunk of streamChat("Hello")) {
      chunks.push(chunk);
    }
    expect(chunks).toEqual([{ type: "error", text: "Rate limited" }]);
  });
});
