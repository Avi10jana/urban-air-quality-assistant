import { useState, useEffect } from "react";
import type { UserProfile, AQIData } from "../types";
import { Wind, Sun, Moon } from "lucide-react";

interface Props {
  profile: UserProfile;
  aqiData: AQIData | null;
  onEditProfile: () => void;
}

function AQIBadge({ data }: { data: AQIData }) {
  return (
    <div
      style={{
        display: "flex", alignItems: "center", gap: "0.5rem",
        background: `${data.color}26`, border: `1px solid ${data.color}88`,
        borderRadius: "999px", padding: "0.28rem 0.85rem",
        fontSize: "0.8rem", fontWeight: 600, color: "#ffffff",
        cursor: "default", backdropFilter: "blur(8px)",
      }}
      title={data.healthImplication}
      aria-label={`Air Quality Index: ${data.aqi}, Level: ${data.level}`}
    >
      <span style={{ width: 8, height: 8, borderRadius: "50%", background: data.color, boxShadow: `0 0 8px ${data.color}` }} aria-hidden="true" />
      <span style={{ fontWeight: 800, fontSize: "0.95rem" }}>{data.aqi}</span>
      <span style={{ opacity: 0.92 }}>{data.level}</span>
    </div>
  );
}

export function Header({ profile, aqiData, onEditProfile }: Props) {
  const [dark, setDark] = useState(() => {
    if (typeof window === "undefined") return false;
    const saved = localStorage.getItem("airguide-theme");
    if (saved) return saved === "dark";
    return window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
  });

  useEffect(() => {
    const theme = dark ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("airguide-theme", theme);
  }, [dark]);

  return (
    <header
      role="banner"
      style={{
        background: "var(--grad-header)",
        color: "white", padding: "0 1rem",
        boxShadow: "0 4px 20px rgba(2, 6, 23, 0.25)",
        borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
        position: "sticky", top: 0, zIndex: 100,
      }}
    >
      <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.75rem", height: 64 }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: "var(--grad-brand)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 2px 10px rgba(6, 182, 212, 0.45)",
          }}>
            <Wind size={20} color="white" aria-hidden="true" />
          </div>
          <div>
            <span className="font-display" style={{ fontSize: "1.15rem", fontWeight: 800, letterSpacing: "-0.02em", display: "block", lineHeight: 1.1 }}>
              AirGuide
            </span>
            <span style={{ opacity: 0.72, fontSize: "0.68rem", letterSpacing: "0.02em" }}>
              Urban Air Assistant
            </span>
          </div>
        </div>

        {/* AQI + Location */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flex: 1, justifyContent: "center", flexWrap: "wrap" }}>
          {aqiData && <AQIBadge data={aqiData} />}
          <span style={{ opacity: 0.9, fontSize: "0.84rem", fontWeight: 500 }}>📍 {profile.location}</span>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <button
            type="button"
            onClick={() => setDark((d) => !d)}
            aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
            title={dark ? "Light mode" : "Dark mode"}
            style={{
              background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.22)",
              color: "white", borderRadius: "999px", width: 34, height: 34,
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", transition: "background 0.2s",
            }}
            onMouseOver={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.22)")}
            onMouseOut={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.12)")}
          >
            {dark ? <Sun size={16} aria-hidden="true" /> : <Moon size={16} aria-hidden="true" />}
          </button>

          <button
            onClick={onEditProfile}
            style={{
              background: "rgba(255,255,255,0.14)", border: "1px solid rgba(255,255,255,0.26)",
              color: "white", borderRadius: "999px", padding: "0.35rem 0.9rem",
              cursor: "pointer", fontSize: "0.8rem", fontWeight: 500,
              transition: "background 0.2s", whiteSpace: "nowrap",
            }}
            onMouseOver={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.24)")}
            onMouseOut={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.14)")}
            aria-label="Edit your profile"
          >
            ✏️ {profile.name ?? "My Profile"}
          </button>
        </div>
      </div>
    </header>
  );
}
