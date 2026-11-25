import { useState } from "react";
import type { UserProfile, AQIData, DailyRoutine, DailyActivity } from "../../types";
import { generateRoutines } from "../../services/api";
import { CalendarClock, Loader2, AlertCircle, Sunrise, Sun, Sunset, Zap, TreePine } from "lucide-react";

interface Props {
  profile: UserProfile;
  aqiData?: AQIData | null;
}

function ActivityCard({ activity }: { activity: DailyActivity }) {
  return (
    <div
      style={{
        background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10,
        padding: "0.9rem", display: "flex", gap: "0.75rem", alignItems: "flex-start",
        boxShadow: "var(--shadow)", transition: "box-shadow 0.2s",
      }}
      onMouseOver={(e) => { e.currentTarget.style.boxShadow = "var(--shadow-md)"; }}
      onMouseOut={(e) => { e.currentTarget.style.boxShadow = "var(--shadow)"; }}
    >
      <span style={{ fontSize: "1.5rem", flexShrink: 0 }} aria-hidden="true">{activity.emoji}</span>
      <div>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "0.25rem" }}>
          <span style={{ fontSize: "0.73rem", fontWeight: 600, color: "var(--sky-dark)", background: "var(--sky-light)", padding: "0.1rem 0.5rem", borderRadius: 999 }}>
            {activity.time}
          </span>
          <span style={{ fontWeight: 600, fontSize: "0.88rem" }}>{activity.activity}</span>
        </div>
        <p style={{ fontSize: "0.82rem", color: "var(--text-2)", marginBottom: "0.4rem" }}>{activity.tip}</p>
        <p style={{ fontSize: "0.78rem", color: "#22c55e", fontWeight: 500 }}>✅ Impact: {activity.impact}</p>
      </div>
    </div>
  );
}

function TimeSection({ icon, title, activities }: { icon: React.ReactNode; title: string; activities: DailyActivity[] }) {
  return (
    <div style={{ marginBottom: "1.25rem" }}>
      <h3 style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: 700, marginBottom: "0.75rem", fontSize: "0.95rem", color: "var(--sky-dark)" }}>
        {icon} {title}
      </h3>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
        {activities.map((a, i) => <ActivityCard key={i} activity={a} />)}
      </div>
    </div>
  );
}

export function RoutinesPanel({ profile, aqiData }: Props) {
  const [routine, setRoutine] = useState<DailyRoutine | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await generateRoutines(profile, aqiData ?? undefined);
      setRoutine(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate routines. Please check your API key.");
    } finally {
      setLoading(false);
    }
  };

  const card: React.CSSProperties = { background: "var(--surface)", borderRadius: 12, padding: "1.25rem", border: "1px solid var(--border)", boxShadow: "var(--shadow)" };

  return (
    <div id="panel-routines" role="tabpanel" aria-label="Daily Routines" style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ fontSize: "1.3rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <CalendarClock size={22} aria-hidden="true" /> Low-Emission Daily Routines
          </h1>
          <p style={{ color: "var(--text-2)", fontSize: "0.85rem" }}>
            Personalized for {profile.location} · Family of {profile.familySize} · {aqiData ? `AQI ${aqiData.aqi}` : ""}
          </p>
        </div>
        <button
          onClick={handleGenerate}
          disabled={loading}
          style={{
            display: "flex", alignItems: "center", gap: "0.5rem",
            padding: "0.65rem 1.25rem", background: loading ? "var(--border)" : "linear-gradient(135deg, #0ea5e9, #0284c7)",
            color: "white", border: "none", borderRadius: 10, cursor: loading ? "not-allowed" : "pointer",
            fontWeight: 600, fontSize: "0.9rem", boxShadow: loading ? "none" : "0 2px 8px rgba(14,165,233,.4)",
          }}
          aria-busy={loading}
        >
          {loading ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <Zap size={16} aria-hidden="true" />}
          {loading ? "Generating..." : "Generate My Routine"}
        </button>
      </div>

      {error && (
        <div role="alert" style={{ ...card, background: "#fef2f2", borderColor: "#fecaca", display: "flex", gap: "0.6rem", alignItems: "flex-start" }}>
          <AlertCircle size={18} style={{ color: "#dc2626", flexShrink: 0 }} aria-hidden="true" />
          <p style={{ color: "#dc2626", fontSize: "0.85rem" }}>{error}</p>
        </div>
      )}

      {!routine && !loading && !error && (
        <div style={{ ...card, textAlign: "center", padding: "3rem 2rem" }}>
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📅</div>
          <h2 style={{ fontWeight: 600, marginBottom: "0.5rem" }}>Generate Your Personalized Routine</h2>
          <p style={{ color: "var(--text-2)", fontSize: "0.88rem", maxWidth: 400, margin: "0 auto 1.5rem" }}>
            Get a custom low-emission daily plan based on your location's air quality, your family's needs, commute type, and cooking habits.
          </p>
          <button
            onClick={handleGenerate}
            style={{ padding: "0.75rem 2rem", background: "linear-gradient(135deg, #0ea5e9, #0284c7)", color: "white", border: "none", borderRadius: 10, cursor: "pointer", fontWeight: 600, fontSize: "0.9rem", boxShadow: "0 4px 14px rgba(14,165,233,.4)" }}
          >
            🚀 Generate Routine
          </button>
        </div>
      )}

      {loading && (
        <div style={{ ...card, textAlign: "center", padding: "3rem" }} role="status" aria-live="polite" aria-label="Generating routine">
          <Loader2 size={40} className="animate-spin" style={{ color: "var(--sky)", margin: "0 auto 1rem" }} aria-hidden="true" />
          <p style={{ color: "var(--text-2)" }}>Crafting your personalized routine with Gemini AI...</p>
        </div>
      )}

      {routine && (
        <>
          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <div style={{ ...card, background: "linear-gradient(135deg, #f0fdf4, #dcfce7)", borderColor: "#86efac", textAlign: "center" }}>
              <div style={{ fontSize: "1.5rem", marginBottom: "0.4rem" }}><TreePine size={28} style={{ color: "#16a34a", margin: "0 auto" }} aria-hidden="true" /></div>
              <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#16a34a" }}>{routine.co2_saved_per_day_kg ?? 0} kg</div>
              <div style={{ fontSize: "0.78rem", color: "#166534" }}>CO₂ Saved Per Day</div>
            </div>
            <div style={{ ...card, background: "linear-gradient(135deg, #f0f9ff, #e0f2fe)", borderColor: "#7dd3fc", textAlign: "center" }}>
              <div style={{ fontSize: "1.5rem", marginBottom: "0.4rem" }}>💪</div>
              <div style={{ fontSize: "1rem", fontWeight: 700, color: "var(--sky-dark)" }}>{routine.health_score_improvement}</div>
              <div style={{ fontSize: "0.78rem", color: "#0369a1" }}>Health Score Improvement</div>
            </div>
          </div>

          {/* Schedule */}
          <div style={card}>
            {routine.morning?.length > 0 && <TimeSection icon={<Sunrise size={16} aria-hidden="true" />} title="Morning" activities={routine.morning} />}
            {routine.afternoon?.length > 0 && <TimeSection icon={<Sun size={16} aria-hidden="true" />} title="Afternoon" activities={routine.afternoon} />}
            {routine.evening?.length > 0 && <TimeSection icon={<Sunset size={16} aria-hidden="true" />} title="Evening" activities={routine.evening} />}
          </div>

          {/* General tips */}
          {routine.general_tips?.length > 0 && (
            <div style={card}>
              <h3 style={{ fontWeight: 700, marginBottom: "0.75rem", fontSize: "0.95rem" }}>💡 General Tips</h3>
              <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {routine.general_tips.map((tip, i) => (
                  <li key={i} style={{ display: "flex", gap: "0.5rem", fontSize: "0.85rem", color: "var(--text-2)" }}>
                    <span style={{ color: "var(--sky)", flexShrink: 0 }}>→</span> {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Emergency */}
          {routine.emergency_protocol && (
            <div style={{ ...card, background: "#fff7ed", borderColor: "#fdba74" }}>
              <h3 style={{ fontWeight: 700, marginBottom: "0.5rem", fontSize: "0.9rem", color: "#c2410c" }}>🚨 Emergency Protocol (AQI &gt; 200)</h3>
              <p style={{ fontSize: "0.85rem", color: "#7c2d12" }}>{routine.emergency_protocol}</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
