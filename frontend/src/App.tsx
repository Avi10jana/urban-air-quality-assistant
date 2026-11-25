import { useState, useCallback } from "react";
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

export default function App() {
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [profileSet, setProfileSet] = useState(false);
  const [activeTab, setActiveTab] = useState<AppTab>("dashboard");

  const { data: aqiData, loading: aqiLoading, loadAQI } = useAQI(
    profileSet ? profile.location : undefined
  );

  /** Memoised so ProfileSetup re-renders are avoided. */
  const handleProfileSave = useCallback(
    (p: UserProfile) => {
      setProfile(p);
      setProfileSet(true);
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
