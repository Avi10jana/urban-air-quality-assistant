import type { UserProfile, AQIData } from "../types";
import { Wind } from "lucide-react";

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
        background: `${data.color}22`, border: `1px solid ${data.color}`,
        borderRadius: "999px", padding: "0.25rem 0.75rem",
        fontSize: "0.8rem", fontWeight: 600, color: data.color,
        cursor: "default",
      }}
      title={data.healthImplication}
      aria-label={`Air Quality Index: ${data.aqi}, Level: ${data.level}`}
    >
      <span style={{ fontWeight: 800, fontSize: "1rem" }}>{data.aqi}</span>
      <span>{data.level}</span>
    </div>
  );
}

export function Header({ profile, aqiData, onEditProfile }: Props) {
  return (
    <header
      role="banner"
      style={{
        background: "linear-gradient(135deg, #0ea5e9 0%, #0284c7 50%, #075985 100%)",
        color: "white", padding: "0 1rem",
        boxShadow: "0 2px 8px rgba(0,0,0,.15)",
        position: "sticky", top: 0, zIndex: 100,
      }}
    >
      <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", height: 60 }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <Wind size={26} aria-hidden="true" />
          <span style={{ fontSize: "1.2rem", fontWeight: 700, letterSpacing: "-0.02em" }}>
            AirGuide
          </span>
          <span style={{ opacity: 0.7, fontSize: "0.78rem", display: "none" }} className="subtitle">
            Urban Air Quality Assistant
          </span>
        </div>

        {/* AQI + Location */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flex: 1, justifyContent: "center" }}>
          {aqiData && <AQIBadge data={aqiData} />}
          <span style={{ opacity: 0.85, fontSize: "0.85rem" }}>📍 {profile.location}</span>
        </div>

        {/* Profile */}
        <button
          onClick={onEditProfile}
          style={{
            background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)",
            color: "white", borderRadius: "999px", padding: "0.3rem 0.9rem",
            cursor: "pointer", fontSize: "0.8rem", fontWeight: 500,
            transition: "background 0.2s",
          }}
          onMouseOver={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.25)")}
          onMouseOut={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.15)")}
          aria-label="Edit your profile"
        >
          ✏️ {profile.name ?? "My Profile"}
        </button>
      </div>
    </header>
  );
}
