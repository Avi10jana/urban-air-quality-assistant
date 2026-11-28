/**
 * Integration tests for Express routes & error handling
 */
import { jest } from "@jest/globals";
import request from "supertest";

// Mock Gemini service so route integration tests are deterministic and fast
jest.unstable_mockModule("../src/services/geminiService.js", () => ({
  streamChatResponse: async function* () {
    yield { type: "delta", text: "Wear an N95 mask today." };
    yield { type: "done", interactionId: "test-interaction-1" };
  },
  generateRoutines: async () =>
    JSON.stringify({
      co2_saved_per_day_kg: 2.5,
      health_score_improvement: "15% lower PM2.5 exposure",
      morning: [{ time: "07:00 AM", activity: "Indoor stretch", tip: "Keep windows closed", impact: "Avoids peak smog", emoji: "🧘" }],
      afternoon: [{ time: "01:00 PM", activity: "Quick walk", tip: "Peak dispersion window", impact: "Lower PM2.5", emoji: "🚶" }],
      evening: [{ time: "07:00 PM", activity: "Run HEPA purifier", tip: "Set to medium", impact: "Clean sleep air", emoji: "💨" }],
      general_tips: ["Stay hydrated"],
      emergency_protocol: "Stay indoors with air purifier running.",
    }),
  generateImpactAnalysis: async () =>
    JSON.stringify({
      totalCO2SavedKgPerYear: 520,
      equivalentTrees: 24,
      pm25ReductionPercent: 18,
      overallMessage: "Great progress!",
      healthScoreImprovement: "Significant respiratory benefit",
      choices: [],
    }),
  generateIndoorHacks: async () =>
    JSON.stringify({
      quickWins: [{ emoji: "🪟", hack: "Seal window gaps", impact: "Cuts infiltration by 20%", cost: "free" }],
      plants: [{ name: "Snake Plant", targetPollutant: "VOCs", careLevel: "Easy", placementTip: "Bedroom" }],
      ventilation: [{ strategy: "Cross-ventilate", when: "1 PM - 3 PM", why: "Lowest PM2.5" }],
      cookingTips: [{ tip: "Use exhaust hood", pollutantReduced: "NO2", impact: "40% lower indoor NO2" }],
      purifierAdvice: { needed: true, recommendation: "Use HEPA H13", filterType: "HEPA H13", minCadr: 300 },
      emergencyProtocol: "Seal doors and run purifier on high.",
      seasonalTips: { winter: ["Avoid incense indoors"] },
    }),
}));

const { app } = await import("../src/server.js");

const validProfile = {
  location: "Delhi",
  familySize: 3,
  hasChildren: true,
  hasElderly: false,
  lifestyle: "urban",
  commute: "car",
  homeType: "apartment",
  cookingType: "gas",
  currentConcerns: ["PM2.5"],
};

describe("API Routes", () => {
  it("GET /health returns healthy status", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("healthy");
    expect(typeof res.body.geminiConfigured).toBe("boolean");
  });

  it("GET /unknown-route returns 404 JSON", async () => {
    const res = await request(app).get("/api/does-not-exist");
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it("GET /api/aqi?city=Delhi returns AQI payload", async () => {
    const res = await request(app).get("/api/aqi?city=Delhi");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.aqi).toBeGreaterThan(0);
  });

  it("GET /api/aqi?lat=28.6&lon=77.2 returns AQI payload", async () => {
    const res = await request(app).get("/api/aqi?lat=28.6&lon=77.2");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it("GET /api/aqi rejects out-of-range or NaN coordinates", async () => {
    const bad1 = await request(app).get("/api/aqi?lat=abc&lon=77.2");
    expect(bad1.status).toBe(400);
    const bad2 = await request(app).get("/api/aqi?lat=120&lon=77.2");
    expect(bad2.status).toBe(400);
  });

  it("GET /api/aqi without params returns default AQI", async () => {
    const res = await request(app).get("/api/aqi");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it("POST /api/routines validates payload and returns routine", async () => {
    const invalid = await request(app).post("/api/routines").send({});
    expect(invalid.status).toBe(400);

    const res = await request(app).post("/api/routines").send({ profile: validProfile });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.co2_saved_per_day_kg).toBe(2.5);
  });

  it("POST /api/routines/impact analyzes lifestyle choices", async () => {
    const res = await request(app)
      .post("/api/routines/impact")
      .send({
        choices: [
          {
            category: "Transport",
            currentBehavior: "Drive car 10km/day",
            proposedAlternative: "Take metro",
          },
        ],
        profile: validProfile,
      });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.totalCO2SavedKgPerYear).toBe(520);
  });

  it("POST /api/routines/indoor-hacks returns indoor recommendations", async () => {
    const res = await request(app)
      .post("/api/routines/indoor-hacks")
      .send({ homeType: "apartment", cookingType: "gas", budget: "medium" });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.quickWins).toHaveLength(1);
  });

  it("POST /api/chat validates input and streams SSE response", async () => {
    const invalid = await request(app).post("/api/chat").send({ message: "" });
    expect(invalid.status).toBe(400);

    const res = await request(app)
      .post("/api/chat")
      .send({ message: "Should I run outside today?", profile: validProfile });
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toContain("text/event-stream");
    expect(res.text).toContain("Wear an N95 mask today.");
    expect(res.text).toContain('"type":"done"');
  });
});
