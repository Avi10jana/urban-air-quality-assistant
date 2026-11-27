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
          position: "relative", width: 148, height: 148, margin: "0 auto",
          borderRadius: "50%", padding: 10,
          background: `conic-gradient(${color} 0% ${pct}%, var(--border) ${pct}% 100%)`,
          boxShadow: `0 0 24px ${color}33`,
        }}
        role="img"
        aria-label={`AQI gauge: ${aqi} out of 500`}
      >
        <div style={{ width: "100%", height: "100%", borderRadius: "50%", background: "var(--surface)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <span className="font-display" style={{ fontSize: "2.15rem", fontWeight: 800, color, lineHeight: 1 }}>{aqi}</span>
          <span style={{ fontSize: "0.72rem", color: "var(--text-3)", marginTop: 4, fontWeight: 600, letterSpacing: "0.06em" }}>AQI</span>
        </div>
      </div>
    </div>
  );
}

function PollutantBar({ label, value, max, unit, color }: { label: string; value: number; max: number; unit: string; color: string }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div style={{ marginBottom: "0.65rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem", marginBottom: "0.3rem" }}>
        <span style={{ fontWeight: 600, color: "var(--text)" }}>{label}</span>
        <span style={{ color: "var(--text-2)", fontWeight: 500 }}>{value.toFixed(1)} {unit}</span>
      </div>
      <div style={{ height: 8, background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 999, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 999, transition: "width 0.8s ease" }} />
      </div>
    </div>
  );
}

function QuickActionCard({ emoji, title, desc, tab, onTabChange }: { emoji: string; title: string; desc: string; tab: AppTab; onTabChange: (t: AppTab) => void }) {
  return (
    <button
      onClick={() => onTabChange(tab)}
      className="ag-card ag-card-interactive"
      style={{ textAlign: "left", cursor: "pointer", width: "100%" }}
      aria-label={`Go to ${title}`}
    >
      <div style={{ fontSize: "1.6rem", marginBottom: "0.55rem" }}>{emoji}</div>
      <div style={{ fontWeight: 700, marginBottom: "0.25rem", fontSize: "0.92rem", color: "var(--text)" }}>{title}</div>
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
        background: "var(--grad-header)",
        color: "#f8fafc",
        borderRadius: "var(--radius)",
        padding: "1.1rem 1.35rem",
        display: "flex",
        gap: "0.9rem",
        alignItems: "flex-start",
        boxShadow: "var(--shadow-md)",
        border: "1px solid rgba(56, 189, 248, 0.25)",
      }}
    >
      <span style={{ fontSize: "1.6rem", flexShrink: 0 }} aria-hidden="true">🌫️</span>
      <div>
        <p style={{ fontWeight: 700, fontSize: "0.95rem", marginBottom: "0.25rem", color: "#38bdf8" }}>
          Winter Smog & Thermal Inversion Advisory
        </p>
        <p style={{ fontSize: "0.84rem", color: "#cbd5e1", lineHeight: 1.55 }}>
          Cold air traps PM2.5 near ground level during morning and evening hours. Schedule outdoor errands between 12 PM – 4 PM when dispersion is highest, seal window drafts, and avoid burning solid fuels or incense indoors.
        </p>
      </div>
    </div>
  );
}

export function Dashboard({ profile, aqiData, aqiLoading, onRefresh, onTabChange }: Props) {
  if (aqiLoading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "4rem", gap: "1rem" }} role="status" aria-live="polite" aria-label="Loading air quality data">
        <div style={{ width: 48, height: 48, border: "4px solid var(--sky-light)", borderTopColor: "var(--sky)", borderRadius: "50%" }} className="animate-spin" aria-hidden="true" />
        <p style={{ color: "var(--text-2)" }}>Fetching air quality data for {profile.location}...</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }} id="panel-dashboard" role="tabpanel" aria-label="Dashboard">
      {/* Header row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.75rem" }}>
        <div>
          <h1 style={{ fontSize: "1.45rem", fontWeight: 800, color: "var(--text)" }}>Air Quality Dashboard</h1>
          <p style={{ color: "var(--text-2)", fontSize: "0.86rem" }}>📍 {profile.location} · {aqiData ? `Updated ${new Date(aqiData.timestamp).toLocaleTimeString()}` : "No data"}</p>
        </div>
        <button
          onClick={onRefresh}
          className="ag-btn-secondary"
          style={{ padding: "0.5rem 1rem", fontSize: "0.85rem" }}
          aria-label="Refresh air quality data"
        >
          <RefreshCw size={14} aria-hidden="true" /> Refresh
        </button>
      </div>

      {aqiData ? (
        <>
          {/* AQI + Alert */}
          <div className="ag-grid-hero">
            <div className="ag-card" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "0.85rem" }}>
              <AQIGauge aqi={aqiData.aqi} color={aqiData.color} />
              <div style={{ textAlign: "center" }}>
                <div style={{ fontWeight: 700, color: aqiData.color, fontSize: "0.95rem" }}>{aqiData.level}</div>
                <div style={{ fontSize: "0.76rem", color: "var(--text-3)", marginTop: 2 }}>Dominant: {aqiData.dominantPollutant ?? "PM2.5"}</div>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
              <div className="ag-card" style={{ background: `${aqiData.color}14`, borderColor: `${aqiData.color}44` }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: "0.65rem" }}>
                  <AlertTriangle size={18} style={{ color: aqiData.color, flexShrink: 0, marginTop: 2 }} aria-hidden="true" />
                  <div>
                    <p style={{ fontWeight: 700, marginBottom: "0.25rem", color: aqiData.color }}>{aqiData.level}</p>
                    <p style={{ fontSize: "0.86rem", color: "var(--text-2)", marginBottom: "0.45rem" }}>{aqiData.healthImplication}</p>
                    <p style={{ fontSize: "0.83rem", fontWeight: 500, color: "var(--text)" }}>{aqiData.cautionaryStatement}</p>
                  </div>
                </div>
              </div>

              {/* Pollutants */}
              <div className="ag-card">
                <h2 style={{ fontSize: "0.88rem", fontWeight: 700, marginBottom: "0.8rem", display: "flex", alignItems: "center", gap: "0.4rem", color: "var(--text)" }}>
                  <Activity size={15} style={{ color: "var(--sky)" }} aria-hidden="true" /> Pollutant Breakdown
                </h2>
                <PollutantBar label="PM2.5" value={aqiData.pm25} max={250} unit="µg/m³" color="var(--unhealthy)" />
                <PollutantBar label="PM10" value={aqiData.pm10} max={500} unit="µg/m³" color="var(--usg)" />
                {aqiData.no2 && <PollutantBar label="NO₂" value={aqiData.no2} max={200} unit="µg/m³" color="var(--accent)" />}
                {aqiData.o3 && <PollutantBar label="O₃ (Ozone)" value={aqiData.o3} max={180} unit="µg/m³" color="var(--sky)" />}
              </div>
            </div>
          </div>

          {/* Vulnerable groups alert */}
          {(profile.hasChildren || profile.hasElderly) && aqiData.aqi > 100 && (
            <div
              role="alert"
              aria-live="assertive"
              className="ag-card"
              style={{ background: "var(--alert-bg)", borderColor: "var(--alert-border)", display: "flex", gap: "0.75rem", alignItems: "flex-start" }}
            >
              <span style={{ fontSize: "1.5rem" }}>⚠️</span>
              <div>
                <p style={{ fontWeight: 700, color: "var(--alert-title)", marginBottom: "0.25rem" }}>Vulnerable Family Members Alert</p>
                <p style={{ fontSize: "0.85rem", color: "var(--alert-text)" }}>
                  {profile.hasChildren && "Children's lungs are still developing — keep them indoors and avoid strenuous outdoor play. "}
                  {profile.hasElderly && "Elderly individuals have higher cardiovascular risk from PM2.5 — ensure they wear N95 masks if going out."}
                </p>
              </div>
            </div>
          )}

          {/* Winter Smog Seasonal Advisory */}
          <WinterSmogBanner aqi={aqiData.aqi} />

          {/* Stats row */}
          <div className="ag-grid-3">
            {[
              { icon: <Wind size={18} aria-hidden="true" />, label: "PM2.5", value: `${aqiData.pm25.toFixed(1)} µg/m³`, who: "WHO limit: 15 µg/m³", color: "var(--unhealthy)" },
              { icon: <Droplets size={18} aria-hidden="true" />, label: "PM10", value: `${aqiData.pm10.toFixed(1)} µg/m³`, who: "WHO limit: 45 µg/m³", color: "var(--usg)" },
              { icon: <Eye size={18} aria-hidden="true" />, label: "Visibility Risk", value: aqiData.aqi > 200 ? "Very Low" : aqiData.aqi > 100 ? "Reduced" : "Normal", who: `AQI: ${aqiData.aqi}`, color: aqiData.color },
            ].map((stat) => (
              <div key={stat.label} className="ag-card">
                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "0.5rem", color: stat.color }}>
                  {stat.icon}
                  <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--text-2)" }}>{stat.label}</span>
                </div>
                <div className="font-display" style={{ fontSize: "1.2rem", fontWeight: 800, color: stat.color }}>{stat.value}</div>
                <div style={{ fontSize: "0.74rem", color: "var(--text-3)", marginTop: "0.2rem" }}>{stat.who}</div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="ag-card" style={{ textAlign: "center", padding: "2rem" }}>
          <p style={{ color: "var(--text-2)" }}>No AQI data available. <button onClick={onRefresh} style={{ color: "var(--sky)", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>Try refreshing</button></p>
        </div>
      )}

      {/* Quick Actions */}
      <div>
        <h2 style={{ fontWeight: 700, marginBottom: "0.75rem", fontSize: "1.05rem", color: "var(--text)" }}>What would you like to do?</h2>
        <div className="ag-grid-auto">
          <QuickActionCard emoji="💬" title="Ask AirGuide AI" desc="Get personalized air quality advice" tab="chat" onTabChange={onTabChange} />
          <QuickActionCard emoji="📅" title="Daily Routines" desc="Low-emission schedule for your family" tab="routines" onTabChange={onTabChange} />
          <QuickActionCard emoji="🌱" title="My Impact" desc="See your CO₂ & health improvements" tab="impact" onTabChange={onTabChange} />
          <QuickActionCard emoji="🏠" title="Indoor Hacks" desc="Purify your home air quality" tab="indoor" onTabChange={onTabChange} />
        </div>
      </div>
    </div>
  );
}
