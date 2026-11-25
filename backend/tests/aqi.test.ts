import {
  calculateAQIFromConc,
  getAQILevel,
  getAQIColor,
  getHealthImplication,
  getCautionaryStatement,
  getMockAQI,
} from "../src/services/aqiService.js";

describe("AQI Calculation", () => {
  describe("calculateAQIFromConc - PM2.5", () => {
    const PM25_BREAKPOINTS = [
      { aqiLow: 0, aqiHigh: 50, concLow: 0.0, concHigh: 12.0 },
      { aqiLow: 51, aqiHigh: 100, concLow: 12.1, concHigh: 35.4 },
      { aqiLow: 101, aqiHigh: 150, concLow: 35.5, concHigh: 55.4 },
      { aqiLow: 151, aqiHigh: 200, concLow: 55.5, concHigh: 150.4 },
      { aqiLow: 201, aqiHigh: 300, concLow: 150.5, concHigh: 250.4 },
      { aqiLow: 301, aqiHigh: 500, concLow: 250.5, concHigh: 500.4 },
    ];

    it("returns 0 for zero concentration", () => {
      expect(calculateAQIFromConc(0, PM25_BREAKPOINTS)).toBe(0);
    });

    it("returns Good AQI (≤50) for PM2.5 ≤ 12", () => {
      const aqi = calculateAQIFromConc(10, PM25_BREAKPOINTS);
      expect(aqi).toBeLessThanOrEqual(50);
    });

    it("returns Moderate AQI (51-100) for PM2.5 ~20", () => {
      const aqi = calculateAQIFromConc(20, PM25_BREAKPOINTS);
      expect(aqi).toBeGreaterThan(50);
      expect(aqi).toBeLessThanOrEqual(100);
    });

    it("returns Unhealthy AQI (151-200) for PM2.5 ~100", () => {
      const aqi = calculateAQIFromConc(100, PM25_BREAKPOINTS);
      expect(aqi).toBeGreaterThan(150);
      expect(aqi).toBeLessThanOrEqual(200);
    });

    it("caps at 500 for extreme values", () => {
      expect(calculateAQIFromConc(600, PM25_BREAKPOINTS)).toBe(500);
    });
  });

  describe("getAQILevel", () => {
    it("returns Good for AQI 0-50", () => {
      expect(getAQILevel(0)).toBe("Good");
      expect(getAQILevel(50)).toBe("Good");
    });
    it("returns Moderate for AQI 51-100", () => {
      expect(getAQILevel(51)).toBe("Moderate");
      expect(getAQILevel(100)).toBe("Moderate");
    });
    it("returns Unhealthy for Sensitive Groups for AQI 101-150", () => {
      expect(getAQILevel(101)).toBe("Unhealthy for Sensitive Groups");
      expect(getAQILevel(150)).toBe("Unhealthy for Sensitive Groups");
    });
    it("returns Unhealthy for AQI 151-200", () => {
      expect(getAQILevel(151)).toBe("Unhealthy");
      expect(getAQILevel(200)).toBe("Unhealthy");
    });
    it("returns Very Unhealthy for AQI 201-300", () => {
      expect(getAQILevel(201)).toBe("Very Unhealthy");
      expect(getAQILevel(300)).toBe("Very Unhealthy");
    });
    it("returns Hazardous for AQI > 300", () => {
      expect(getAQILevel(301)).toBe("Hazardous");
      expect(getAQILevel(500)).toBe("Hazardous");
    });
  });

  describe("getAQIColor", () => {
    it("returns green for Good", () => {
      expect(getAQIColor("Good")).toBe("#00E400");
    });
    it("returns red for Unhealthy", () => {
      expect(getAQIColor("Unhealthy")).toBe("#FF0000");
    });
    it("returns dark red for Hazardous", () => {
      expect(getAQIColor("Hazardous")).toBe("#7E0023");
    });
  });

  describe("getHealthImplication", () => {
    it("returns a non-empty string for each level", () => {
      const levels = [
        "Good",
        "Moderate",
        "Unhealthy for Sensitive Groups",
        "Unhealthy",
        "Very Unhealthy",
        "Hazardous",
      ] as const;
      levels.forEach((level) => {
        expect(getHealthImplication(level)).toBeTruthy();
        expect(typeof getHealthImplication(level)).toBe("string");
      });
    });
  });

  describe("getCautionaryStatement", () => {
    it("returns actionable advice for each level", () => {
      const levels = [
        "Good",
        "Moderate",
        "Unhealthy for Sensitive Groups",
        "Unhealthy",
        "Very Unhealthy",
        "Hazardous",
      ] as const;
      levels.forEach((level) => {
        const statement = getCautionaryStatement(level);
        expect(statement).toBeTruthy();
        expect(statement.length).toBeGreaterThan(10);
      });
    });
  });

  describe("getMockAQI", () => {
    it("returns valid AQI data for Delhi", () => {
      const data = getMockAQI("delhi");
      expect(data.city).toBe("delhi");
      expect(data.aqi).toBeGreaterThan(100); // Delhi is typically polluted
      expect(data.pm25).toBeGreaterThan(0);
      expect(data.pm10).toBeGreaterThan(0);
      expect(data.level).toBeTruthy();
      expect(data.color).toMatch(/^#[0-9A-F]{6}$/i);
      expect(data.timestamp).toBeTruthy();
      expect(data.healthImplication).toBeTruthy();
      expect(data.cautionaryStatement).toBeTruthy();
    });

    it("returns valid AQI data for Sydney (clean city)", () => {
      const data = getMockAQI("sydney");
      expect(data.aqi).toBeLessThan(100); // Sydney is typically cleaner
      expect(data.level).toMatch(/Good|Moderate/);
    });

    it("returns default data for unknown city", () => {
      const data = getMockAQI("unknown_xyz_city");
      expect(data.city).toBe("unknown_xyz_city");
      expect(data.aqi).toBeGreaterThan(0);
    });

    it("is case-insensitive for city lookup", () => {
      const lower = getMockAQI("delhi");
      const upper = getMockAQI("Delhi");
      const mixed = getMockAQI("DELHI");
      expect(lower.aqi).toBe(upper.aqi);
      expect(lower.aqi).toBe(mixed.aqi);
    });

    it("includes dominantPollutant", () => {
      const data = getMockAQI("mumbai");
      expect(["PM2.5", "PM10"]).toContain(data.dominantPollutant);
    });
  });
});
