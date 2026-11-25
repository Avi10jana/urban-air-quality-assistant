import { ChatRequestSchema, RoutineRequestSchema, ImpactRequestSchema, IndoorHacksRequestSchema } from "../src/middleware/validate.js";

describe("Input Validation Schemas", () => {
  describe("ChatRequestSchema", () => {
    it("accepts a valid chat request", () => {
      const result = ChatRequestSchema.safeParse({
        message: "What can I do about smog today?",
      });
      expect(result.success).toBe(true);
    });

    it("accepts full chat request with profile and aqiData", () => {
      const result = ChatRequestSchema.safeParse({
        message: "Give me tips",
        previousInteractionId: "int_abc123",
        profile: { location: "Delhi", familySize: 4, hasChildren: true, lifestyle: "urban", commute: "car", homeType: "apartment", cookingType: "gas", currentConcerns: ["smog"] },
        aqiData: { city: "Delhi", aqi: 180, level: "Unhealthy", pm25: 65, pm10: 120 },
      });
      expect(result.success).toBe(true);
    });

    it("rejects empty message", () => {
      const result = ChatRequestSchema.safeParse({ message: "" });
      expect(result.success).toBe(false);
    });

    it("rejects message over 2000 chars", () => {
      const result = ChatRequestSchema.safeParse({ message: "a".repeat(2001) });
      expect(result.success).toBe(false);
    });

    it("rejects invalid commute type", () => {
      const result = ChatRequestSchema.safeParse({
        message: "tips",
        profile: { location: "Delhi", commute: "helicopter" },
      });
      expect(result.success).toBe(false);
    });
  });

  describe("RoutineRequestSchema", () => {
    const validProfile = {
      location: "Mumbai",
      familySize: 3,
      hasChildren: false,
      hasElderly: true,
      lifestyle: "suburban",
      commute: "public_transport",
      homeType: "house",
      cookingType: "electric",
      currentConcerns: ["PM2.5", "indoor pollution"],
    };

    it("accepts valid routine request", () => {
      const result = RoutineRequestSchema.safeParse({ profile: validProfile });
      expect(result.success).toBe(true);
    });

    it("rejects missing location in profile", () => {
      const result = RoutineRequestSchema.safeParse({
        profile: { ...validProfile, location: "" },
      });
      expect(result.success).toBe(false);
    });

    it("rejects family size > 20", () => {
      const result = RoutineRequestSchema.safeParse({
        profile: { ...validProfile, familySize: 25 },
      });
      expect(result.success).toBe(false);
    });
  });

  describe("ImpactRequestSchema", () => {
    it("accepts valid impact request", () => {
      const result = ImpactRequestSchema.safeParse({
        choices: [{
          category: "Transport",
          currentBehavior: "Drive car daily",
          proposedAlternative: "Take metro",
        }],
      });
      expect(result.success).toBe(true);
    });

    it("rejects empty choices array", () => {
      const result = ImpactRequestSchema.safeParse({ choices: [] });
      expect(result.success).toBe(false);
    });

    it("rejects more than 10 choices", () => {
      const choices = Array(11).fill({
        category: "X", currentBehavior: "A", proposedAlternative: "B",
      });
      const result = ImpactRequestSchema.safeParse({ choices });
      expect(result.success).toBe(false);
    });
  });

  describe("IndoorHacksRequestSchema", () => {
    it("accepts valid indoor hacks request", () => {
      const result = IndoorHacksRequestSchema.safeParse({
        homeType: "apartment",
        cookingType: "gas",
        budget: "low",
      });
      expect(result.success).toBe(true);
    });

    it("uses defaults for missing optional fields", () => {
      const result = IndoorHacksRequestSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.homeType).toBe("apartment");
        expect(result.data.budget).toBe("medium");
      }
    });

    it("rejects invalid budget value", () => {
      const result = IndoorHacksRequestSchema.safeParse({
        homeType: "house",
        cookingType: "gas",
        budget: "luxury",
      });
      expect(result.success).toBe(false);
    });
  });
});
