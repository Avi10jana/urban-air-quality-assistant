import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Dashboard } from "../components/Dashboard/Dashboard";
import type { AQIData, UserProfile } from "../types";

const mockProfile: UserProfile = {
  location: "Delhi",
  familySize: 4,
  hasChildren: true,
  hasElderly: false,
  lifestyle: "urban",
  commute: "car",
  homeType: "apartment",
  cookingType: "gas",
  currentConcerns: ["PM2.5"],
};

const mockAQI: AQIData = {
  city: "Delhi",
  aqi: 180,
  level: "Unhealthy",
  color: "#FF0000",
  pm25: 65.5,
  pm10: 120.0,
  no2: 55.0,
  o3: 42.0,
  timestamp: new Date().toISOString(),
  dominantPollutant: "PM2.5",
  healthImplication: "Everyone may begin to experience health effects.",
  cautionaryStatement: "Everyone should wear N95 masks and limit outdoor activity.",
};

describe("Dashboard", () => {
  const mockRefresh = vi.fn();
  const mockTabChange = vi.fn();

  beforeEach(() => { mockRefresh.mockClear(); mockTabChange.mockClear(); });

  it("shows loading spinner when aqiLoading is true", () => {
    render(<Dashboard profile={mockProfile} aqiData={null} aqiLoading={true} onRefresh={mockRefresh} onTabChange={mockTabChange} />);
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByText(/fetching air quality/i)).toBeInTheDocument();
  });

  it("renders AQI data when available", () => {
    render(<Dashboard profile={mockProfile} aqiData={mockAQI} aqiLoading={false} onRefresh={mockRefresh} onTabChange={mockTabChange} />);
    expect(screen.getByText("180")).toBeInTheDocument();
    expect(screen.getAllByText("Unhealthy").length).toBeGreaterThan(0);
    expect(screen.getAllByText(/65.5/).length).toBeGreaterThan(0);
  });

  it("shows vulnerable family alert when AQI > 100 and has children", () => {
    render(<Dashboard profile={mockProfile} aqiData={mockAQI} aqiLoading={false} onRefresh={mockRefresh} onTabChange={mockTabChange} />);
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText(/vulnerable family members/i)).toBeInTheDocument();
  });

  it("does NOT show alert when AQI is good", () => {
    const goodAQI = { ...mockAQI, aqi: 45, level: "Good" as const, color: "#00E400", healthImplication: "Safe", cautionaryStatement: "No precautions" };
    render(<Dashboard profile={mockProfile} aqiData={goodAQI} aqiLoading={false} onRefresh={mockRefresh} onTabChange={mockTabChange} />);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("calls onRefresh when refresh button clicked", async () => {
    const user = userEvent.setup();
    render(<Dashboard profile={mockProfile} aqiData={mockAQI} aqiLoading={false} onRefresh={mockRefresh} onTabChange={mockTabChange} />);
    await user.click(screen.getByRole("button", { name: /refresh/i }));
    expect(mockRefresh).toHaveBeenCalledOnce();
  });

  it("calls onTabChange when quick action cards clicked", async () => {
    const user = userEvent.setup();
    render(<Dashboard profile={mockProfile} aqiData={mockAQI} aqiLoading={false} onRefresh={mockRefresh} onTabChange={mockTabChange} />);
    await user.click(screen.getByRole("button", { name: /ask airguide ai/i }));
    expect(mockTabChange).toHaveBeenCalledWith("chat");
  });

  it("displays PM2.5 WHO limit reference", () => {
    render(<Dashboard profile={mockProfile} aqiData={mockAQI} aqiLoading={false} onRefresh={mockRefresh} onTabChange={mockTabChange} />);
    expect(screen.getByText(/WHO limit: 15/i)).toBeInTheDocument();
  });
});
