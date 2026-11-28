import { useState, useCallback, useEffect } from "react";
import type { UserProfile, AppTab } from "./types";
import { Header } from "./components/Header";
import { TabNav } from "./components/TabNav";
import { Dashboard } from "./components/Dashboard/Dashboard";
import { ChatPanel } from "./components/Chat/ChatPanel";
import { RoutinesPanel } from "./components/Routines/RoutinesPanel";
import { ImpactPanel } from "./components/Impact/ImpactPanel";
import { IndoorPanel } from "./components/Indoor/IndoorPanel";
import { ProfileSetup } from "./components/Profile/ProfileSetup";
import { useAQI } from "./hooks/useAQI";

const PROFILE_STORAGE_KEY = "airguide-profile";

const DEFAULT_PROFILE: UserProfile = {
  location: "Delhi",
  familySize: 4,
  hasChildren: true,
  hasElderly: false,
  lifestyle: "urban",
  commute: "car",
  homeType: "apartment",
  cookingType: "gas",
  currentConcerns: ["smog", "PM2.5"],
};

function loadSavedProfile(): { profile: UserProfile; isSet: boolean } {
  try {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!raw) return { profile: DEFAULT_PROFILE, isSet: false };
    const parsed = JSON.parse(raw) as UserProfile;
    if (parsed && typeof parsed.location === "string" && parsed.location.trim()) {
      return { profile: parsed, isSet: true };
    }
  } catch {
    // Ignore invalid stored JSON
  }
  return { profile: DEFAULT_PROFILE, isSet: false };
}

export default function App() {
  const initial = loadSavedProfile();
  const [profile, setProfile] = useState<UserProfile>(initial.profile);
  const [profileSet, setProfileSet] = useState(initial.isSet);
  const [activeTab, setActiveTab] = useState<AppTab>("dashboard");

  const { data: aqiData, loading: aqiLoading, loadAQI } = useAQI(
    profileSet ? profile.location : undefined
  );

  useEffect(() => {
    if (profileSet && profile.location) {
      loadAQI(profile.location);
    }
  }, [profileSet, profile.location, loadAQI]);

  /** Memoised so ProfileSetup re-renders are avoided. */
  const handleProfileSave = useCallback(
    (p: UserProfile) => {
      setProfile(p);
      setProfileSet(true);
      try {
        localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(p));
      } catch {
        // Ignore storage quota errors
      }
      loadAQI(p.location);
    },
    [loadAQI]
  );

  /** Memoised refresh callback passed down to Dashboard. */
  const handleRefresh = useCallback(
    () => loadAQI(profile.location),
    [loadAQI, profile.location]
  );

  /** Memoised edit-profile callback. */
  const handleEditProfile = useCallback(() => setProfileSet(false), []);

  if (!profileSet) {
    return <ProfileSetup onSave={handleProfileSave} />;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <Header
        profile={profile}
        aqiData={aqiData}
        onEditProfile={handleEditProfile}
      />
      <TabNav activeTab={activeTab} onTabChange={setActiveTab} />
      <main
        id="main-content"
        role="main"
        aria-label="Application content"
        style={{ flex: 1, maxWidth: 1100, width: "100%", margin: "0 auto", padding: "1.5rem 1rem" }}
      >
        {activeTab === "dashboard" && (
          <Dashboard
            profile={profile}
            aqiData={aqiData}
            aqiLoading={aqiLoading}
            onRefresh={handleRefresh}
            onTabChange={setActiveTab}
          />
        )}
        {activeTab === "chat" && (
          <ChatPanel profile={profile} aqiData={aqiData} />
        )}
        {activeTab === "routines" && (
          <RoutinesPanel profile={profile} aqiData={aqiData} />
        )}
        {activeTab === "impact" && (
          <ImpactPanel profile={profile} />
        )}
        {activeTab === "indoor" && (
          <IndoorPanel profile={profile} aqiData={aqiData} />
        )}
      </main>
      <footer
        role="contentinfo"
        style={{
          textAlign: "center", padding: "1rem", fontSize: "0.8rem",
          color: "var(--text-3)", borderTop: "1px solid var(--border)",
          background: "var(--surface)"
        }}
      >
        🌍 AirGuide — Powered by Gemini AI · Helping families breathe better every day
      </footer>
    </div>
  );
}
