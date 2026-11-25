import type { AQIData, UserProfile, AppTab } from "../../types";
import { RefreshCw, AlertTriangle, Activity, Wind, Droplets, Eye } from "lucide-react";

interface Props {
  profile: UserProfile;
  aqiData: AQIData | null;
  aqiLoading: boolean;
  onRefresh: () => void;
  onTabChange: (tab: AppTab) => void;
}

function AQIGauge({ aqi, color }: { aqi: number; color: string }) {
  const pct = Math.min((aqi / 500) * 100, 100);
  return (
    <div style={{ textAlign: "center" }}>
      <div
        style={{
          position: "relative", width: 140, height: 140, margin: "0 auto",
          borderRadius: "50%", padding: 8,
          background: `conic-gradient(${color} 0% ${pct}%, var(--border) ${pct}% 100%)`,
        }}
        role="img"
        aria-label={`AQI gauge: ${aqi} out of 500`}
      >
        <div style={{ width: "100%", height: "100%", borderRadius: "50%", background: "var(--surface)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: "2rem", fontWeight: 800, color, lineHeight: 1 }}>{aqi}</span>
          <span style={{ fontSize: "0.7rem", color: "var(--text-3)", marginTop: 2 }}>AQI</span>
        </div>
      </div>
    </div>
  );
}

function PollutantBar({ label, value, max, unit, color }: { label: string; value: number; max: number; unit: string; color: string }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div style={{ marginBottom: "0.6rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", marginBottom: "0.25rem" }}>
        <span style={{ fontWeight: 500 }}>{label}</span>
        <span style={{ color: "var(--text-2)" }}>{value.toFixed(1)} {unit}</span>
      </div>
      <div style={{ height: 8, background: "var(--border)", borderRadius: 4, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 4, transition: "width 0.8s ease" }} />
      </div>
    </div>
  );
}

function QuickActionCard({ emoji, title, desc, tab, onTabChange }: { emoji: string; title: string; desc: string; tab: AppTab; onTabChange: (t: AppTab) => void }) {
  return (
    <button
      onClick={() => onTabChange(tab)}
      style={{
        background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12,
        padding: "1rem", textAlign: "left", cursor: "pointer", transition: "all 0.2s",
        boxShadow: "var(--shadow)",
      }}
      onMouseOver={(e) => { e.currentTarget.style.borderColor = "var(--sky)"; e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "var(--shadow-md)"; }}
      onMouseOut={(e) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "var(--shadow)"; }}
      aria-label={`Go to ${title}`}
    >
      <div style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>{emoji}</div>
      <div style={{ fontWeight: 600, marginBottom: "0.25rem", fontSize: "0.9rem" }}>{title}</div>
      <div style={{ fontSize: "0.78rem", color: "var(--text-2)" }}>{desc}</div>
    </button>
  );
}

function WinterSmogBanner({ aqi }: { aqi: number }) {
  const month = new Date().getMonth(); // 0=Jan, 10=Nov, 11=Dec
  const isWinter = month >= 10 || month <= 1;
  if (!isWinter && aqi <= 150) return null;

  return (
    <div
      role="region"
      aria-label="Winter Smog Season Advisory"
      style={{
        background: "linear-gradient(135deg, #1e293b 0%, #334155 100%)",
        color: "#f8fafc",
        borderRadius: 12,
        padding: "1rem 1.25rem",
        display: "flex",
        gap: "0.85rem",
        alignItems: "flex-start",
        boxShadow: "var(--shadow-md)",
        border: "1px solid #475569",
      }}
    >
      <span style={{ fontSize: "1.5rem", flexShrink: 0 }} aria-hidden="true">🌫️</span>
      <div>
        <p style={{ fontWeight: 700, fontSize: "0.95rem", marginBottom: "0.25rem", color: "#38bdf8" }}>
          Winter Smog & Thermal Inversion Advisory
        </p>
        <p style={{ fontSize: "0.83rem", color: "#cbd5e1", lineHeight: 1.5 }}>
          Cold air traps PM2.5 near ground level during morning and evening hours. Schedule outdoor errands between 12 PM – 4 PM when dispersion is highest, seal window drafts, and avoid burning solid fuels or incense indoors.
        </p>
      </div>
    </div>
  );
}

export function Dashboard({ profile, aqiData, aqiLoading, onRefresh, onTabChange }: Props) {
  const card: React.CSSProperties = {
    background: "var(--surface)", borderRadius: 12, padding: "1.25rem",
    border: "1px solid var(--border)", boxShadow: "var(--shadow)",
  };

  if (aqiLoading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "4rem", gap: "1rem" }} role="status" aria-live="polite" aria-label="Loading air quality data">
        <div style={{ width: 48, height: 48, border: "4px solid var(--sky-light)", borderTopColor: "var(--sky)", borderRadius: "50%" }} className="animate-spin" aria-hidden="true" />
        <p style={{ color: "var(--text-2)" }}>Fetching air quality data for {profile.location}...</p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }} id="panel-dashboard" role="tabpanel" aria-label="Dashboard">
      {/* Header row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ fontSize: "1.3rem", fontWeight: 700 }}>Air Quality Dashboard</h1>
          <p style={{ color: "var(--text-2)", fontSize: "0.85rem" }}>📍 {profile.location} · {aqiData ? `Updated ${new Date(aqiData.timestamp).toLocaleTimeString()}` : "No data"}</p>
        </div>
        <button
          onClick={onRefresh}
          style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.5rem 1rem", border: "1px solid var(--border)", borderRadius: 8, background: "var(--surface)", cursor: "pointer", fontSize: "0.85rem", color: "var(--text-2)" }}
          aria-label="Refresh air quality data"
        >
          <RefreshCw size={14} aria-hidden="true" /> Refresh
        </button>
      </div>

      {aqiData ? (
        <>
          {/* AQI + Alert */}
          <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "1.25rem" }}>
            <div style={{ ...card, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "0.75rem", minWidth: 180 }}>
              <AQIGauge aqi={aqiData.aqi} color={aqiData.color} />
              <div style={{ textAlign: "center" }}>
                <div style={{ fontWeight: 700, color: aqiData.color, fontSize: "0.9rem" }}>{aqiData.level}</div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-3)" }}>Dominant: {aqiData.dominantPollutant ?? "PM2.5"}</div>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <div style={{ ...card, background: `${aqiData.color}11`, borderColor: `${aqiData.color}44` }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: "0.6rem" }}>
                  <AlertTriangle size={18} style={{ color: aqiData.color, flexShrink: 0, marginTop: 2 }} aria-hidden="true" />
                  <div>
                    <p style={{ fontWeight: 600, marginBottom: "0.25rem", color: aqiData.color }}>{aqiData.level}</p>
                    <p style={{ fontSize: "0.85rem", color: "var(--text-2)", marginBottom: "0.5rem" }}>{aqiData.healthImplication}</p>
                    <p style={{ fontSize: "0.82rem", fontWeight: 500 }}>{aqiData.cautionaryStatement}</p>
                  </div>
                </div>
              </div>

              {/* Pollutants */}
              <div style={card}>
                <h2 style={{ fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <Activity size={14} aria-hidden="true" /> Pollutant Breakdown
                </h2>
                <PollutantBar label="PM2.5" value={aqiData.pm25} max={250} unit="µg/m³" color="#ef4444" />
                <PollutantBar label="PM10" value={aqiData.pm10} max={500} unit="µg/m³" color="#f97316" />
                {aqiData.no2 && <PollutantBar label="NO₂" value={aqiData.no2} max={200} unit="µg/m³" color="#a855f7" />}
                {aqiData.o3 && <PollutantBar label="O₃ (Ozone)" value={aqiData.o3} max={180} unit="µg/m³" color="#0ea5e9" />}
              </div>
            </div>
          </div>

          {/* Vulnerable groups alert */}
          {(profile.hasChildren || profile.hasElderly) && aqiData.aqi > 100 && (
            <div
              role="alert"
              aria-live="assertive"
              style={{ ...card, background: "#fef3c7", borderColor: "#f59e0b", display: "flex", gap: "0.75rem", alignItems: "flex-start" }}
            >
              <span style={{ fontSize: "1.5rem" }}>⚠️</span>
              <div>
                <p style={{ fontWeight: 600, color: "#92400e", marginBottom: "0.25rem" }}>Vulnerable Family Members Alert</p>
                <p style={{ fontSize: "0.85rem", color: "#78350f" }}>
                  {profile.hasChildren && "Children's lungs are still developing — keep them indoors and avoid strenuous outdoor play. "}
                  {profile.hasElderly && "Elderly individuals have higher cardiovascular risk from PM2.5 — ensure they wear N95 masks if going out."}
                </p>
              </div>
            </div>
          )}

          {/* Winter Smog Seasonal Advisory */}
          <WinterSmogBanner aqi={aqiData.aqi} />

          {/* Stats row */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.75rem" }}>
            {[
              { icon: <Wind size={18} aria-hidden="true" />, label: "PM2.5", value: `${aqiData.pm25.toFixed(1)} µg/m³`, who: "WHO limit: 15 µg/m³", color: "#ef4444" },
              { icon: <Droplets size={18} aria-hidden="true" />, label: "PM10", value: `${aqiData.pm10.toFixed(1)} µg/m³`, who: "WHO limit: 45 µg/m³", color: "#f97316" },
              { icon: <Eye size={18} aria-hidden="true" />, label: "Visibility Risk", value: aqiData.aqi > 200 ? "Very Low" : aqiData.aqi > 100 ? "Reduced" : "Normal", who: `AQI: ${aqiData.aqi}`, color: aqiData.color },
            ].map((stat) => (
              <div key={stat.label} style={card}>
                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "0.5rem", color: stat.color }}>
                  {stat.icon}
                  <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--text-2)" }}>{stat.label}</span>
                </div>
                <div style={{ fontSize: "1.1rem", fontWeight: 700, color: stat.color }}>{stat.value}</div>
                <div style={{ fontSize: "0.73rem", color: "var(--text-3)", marginTop: "0.2rem" }}>{stat.who}</div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div style={{ ...card, textAlign: "center", padding: "2rem" }}>
          <p style={{ color: "var(--text-2)" }}>No AQI data available. <button onClick={onRefresh} style={{ color: "var(--sky)", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>Try refreshing</button></p>
        </div>
      )}

      {/* Quick Actions */}
      <div>
        <h2 style={{ fontWeight: 600, marginBottom: "0.75rem", fontSize: "1rem" }}>What would you like to do?</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "0.75rem" }}>
          <QuickActionCard emoji="💬" title="Ask AirGuide AI" desc="Get personalized air quality advice" tab="chat" onTabChange={onTabChange} />
          <QuickActionCard emoji="📅" title="Daily Routines" desc="Low-emission schedule for your family" tab="routines" onTabChange={onTabChange} />
          <QuickActionCard emoji="🌱" title="My Impact" desc="See your CO₂ & health improvements" tab="impact" onTabChange={onTabChange} />
          <QuickActionCard emoji="🏠" title="Indoor Hacks" desc="Purify your home air quality" tab="indoor" onTabChange={onTabChange} />
        </div>
      </div>
    </div>
  );
}
