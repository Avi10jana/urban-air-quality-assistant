import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Header } from "../components/Header";
import { ChatPanel } from "../components/Chat/ChatPanel";
import { RoutinesPanel } from "../components/Routines/RoutinesPanel";
import { ImpactPanel } from "../components/Impact/ImpactPanel";
import { IndoorPanel } from "../components/Indoor/IndoorPanel";
import App from "../App";
import * as api from "../services/api";
import type { AQIData, UserProfile } from "../types";

const mockProfile: UserProfile = {
  name: "Priya",
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
  aqi: 165,
  level: "Unhealthy",
  color: "#FF0000",
  pm25: 62.0,
  pm10: 110.0,
  timestamp: new Date().toISOString(),
  healthImplication: "Health effects likely.",
  cautionaryStatement: "Wear an N95 mask.",
};

describe("Header", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute("data-theme");
  });

  it("renders brand, AQI badge, location, and toggles dark/light mode", async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    render(<Header profile={mockProfile} aqiData={mockAQI} onEditProfile={onEdit} />);

    expect(screen.getByText("AirGuide")).toBeInTheDocument();
    expect(screen.getByText("165")).toBeInTheDocument();
    expect(screen.getByText(/Delhi/)).toBeInTheDocument();

    const toggleBtn = screen.getByRole("button", { name: /switch to/i });
    await user.click(toggleBtn);
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");

    await user.click(screen.getByRole("button", { name: /edit your profile/i }));
    expect(onEdit).toHaveBeenCalledOnce();
  });
});

describe("ChatPanel", () => {
  it("renders quick prompts and lets user populate input", async () => {
    const user = userEvent.setup();
    render(<ChatPanel profile={mockProfile} aqiData={mockAQI} />);
    expect(screen.getByText("AirGuide AI")).toBeInTheDocument();
    const promptBtn = screen.getByRole("button", { name: /what n95 mask should i use/i });
    await user.click(promptBtn);
    expect(screen.getByLabelText(/type your message/i)).toHaveValue("What N95 mask should I use?");
  });
});

describe("RoutinesPanel", () => {
  it("generates and displays daily routine sections", async () => {
    const user = userEvent.setup();
    vi.spyOn(api, "generateRoutines").mockResolvedValueOnce({
      co2_saved_per_day_kg: 3.2,
      health_score_improvement: "12% better indoor air",
      morning: [{ time: "7:00 AM", activity: "Indoor yoga", tip: "Keep windows shut", impact: "Lower PM2.5", emoji: "🧘" }],
      afternoon: [],
      evening: [],
      general_tips: ["Use N95 outdoors"],
      emergency_protocol: "Run HEPA purifier",
    });

    render(<RoutinesPanel profile={mockProfile} aqiData={mockAQI} />);
    await user.click(screen.getByRole("button", { name: /generate routine/i }));

    await waitFor(() => expect(screen.getByText("3.2 kg")).toBeInTheDocument());
    expect(screen.getByText("Indoor yoga")).toBeInTheDocument();
    expect(screen.getByText(/Use N95 outdoors/)).toBeInTheDocument();
  });
});

describe("ImpactPanel", () => {
  it("allows adding a choice and displays impact analysis results", async () => {
    const user = userEvent.setup();
    vi.spyOn(api, "analyzeImpact").mockResolvedValueOnce({
      totalCO2SavedKgPerYear: 450,
      equivalentTrees: 20,
      pm25ReductionPercent: 15,
      overallMessage: "Awesome eco impact!",
      healthScoreImprovement: "Lower asthma risk",
      choices: [
        {
          category: "Transport",
          currentBehavior: "Car",
          alternative: "Metro",
          co2SavedKgPerYear: 450,
          pm25ImpactPercent: 15,
          healthBenefit: "Cleaner commute",
          costSavingINRPerYear: 12000,
          difficultyLevel: "easy",
          implementationTips: ["Get a metro card"],
        },
      ],
    });

    render(<ImpactPanel profile={mockProfile} />);
    await user.click(screen.getByRole("button", { name: /add a new lifestyle change/i }));
    await user.click(screen.getByRole("button", { name: /calculate my impact/i }));

    await waitFor(() => expect(screen.getByText("450 kg")).toBeInTheDocument());
    expect(screen.getByText(/Awesome eco impact!/)).toBeInTheDocument();
    expect(screen.getByText(/Get a metro card/)).toBeInTheDocument();
  });
});

describe("IndoorPanel", () => {
  it("switches budget and renders indoor air quality hacks", async () => {
    const user = userEvent.setup();
    vi.spyOn(api, "fetchIndoorHacks").mockResolvedValueOnce({
      quickWins: [{ emoji: "🪟", hack: "Seal window gaps", impact: "20% less dust", cost: "free" }],
      plants: [{ name: "Areca Palm", targetPollutant: "PM2.5", careLevel: "Easy", placementTip: "Living room" }],
      ventilation: [{ strategy: "Midday airing", when: "1-3 PM", why: "Best dispersion" }],
      cookingTips: [{ tip: "Run exhaust fan", pollutantReduced: "NO2", impact: "40% less NO2" }],
      purifierAdvice: { needed: true, recommendation: "Get HEPA H13", filterType: "HEPA H13", minCadr: 300 },
      emergencyProtocol: "Keep doors closed",
      seasonalTips: { winter: ["No incense"] },
    });

    render(<IndoorPanel profile={mockProfile} aqiData={mockAQI} />);
    await user.click(screen.getByRole("button", { name: /free\/low/i }));
    await user.click(screen.getByRole("button", { name: /generate indoor hacks/i }));

    await waitFor(() => expect(screen.getByText("Seal window gaps")).toBeInTheDocument());
    expect(screen.getByText(/Areca Palm/)).toBeInTheDocument();
    expect(screen.getByText(/Get HEPA H13/)).toBeInTheDocument();
  });
});

describe("App", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.spyOn(api, "fetchAQI").mockResolvedValue(mockAQI);
  });

  it("renders ProfileSetup initially and transitions to Dashboard on save", async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(screen.getByText(/Welcome to AirGuide/i)).toBeInTheDocument();
    await user.type(screen.getByLabelText(/city/i), "Delhi");
    await user.click(screen.getByRole("button", { name: /start my air quality journey/i }));

    await waitFor(() => expect(screen.getByText("Air Quality Dashboard")).toBeInTheDocument());
    expect(screen.getByText("Skip to main content")).toBeInTheDocument();
    expect(localStorage.getItem("airguide-profile")).toContain("Delhi");
  });
});
