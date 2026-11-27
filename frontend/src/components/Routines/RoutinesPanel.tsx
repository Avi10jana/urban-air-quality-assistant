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
      className="ag-card ag-card-interactive"
      style={{ padding: "0.95rem", display: "flex", gap: "0.8rem", alignItems: "flex-start" }}
    >
      <span style={{ fontSize: "1.55rem", flexShrink: 0 }} aria-hidden="true">{activity.emoji}</span>
      <div>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap", marginBottom: "0.3rem" }}>
          <span style={{ fontSize: "0.73rem", fontWeight: 600, color: "var(--sky-dark)", background: "var(--sky-light)", padding: "0.15rem 0.6rem", borderRadius: 999 }}>
            {activity.time}
          </span>
          <span style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--text)" }}>{activity.activity}</span>
        </div>
        <p style={{ fontSize: "0.83rem", color: "var(--text-2)", marginBottom: "0.4rem" }}>{activity.tip}</p>
        <p style={{ fontSize: "0.78rem", color: "var(--good)", fontWeight: 600 }}>✅ Impact: {activity.impact}</p>
      </div>
    </div>
  );
}

function TimeSection({ icon, title, activities }: { icon: React.ReactNode; title: string; activities: DailyActivity[] }) {
  return (
    <div style={{ marginBottom: "1.35rem" }}>
      <h3 style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: 700, marginBottom: "0.75rem", fontSize: "0.98rem", color: "var(--sky-dark)" }}>
        {icon} {title}
      </h3>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
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

  return (
    <div id="panel-routines" role="tabpanel" aria-label="Daily Routines" className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.75rem" }}>
        <div>
          <h1 style={{ fontSize: "1.45rem", fontWeight: 800, display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--text)" }}>
            <CalendarClock size={22} style={{ color: "var(--sky)" }} aria-hidden="true" /> Low-Emission Daily Routines
          </h1>
          <p style={{ color: "var(--text-2)", fontSize: "0.86rem" }}>
            Personalized for {profile.location} · Family of {profile.familySize}{aqiData ? ` · AQI ${aqiData.aqi}` : ""}
          </p>
        </div>
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="ag-btn-primary"
          style={{ padding: "0.65rem 1.25rem", fontSize: "0.88rem" }}
          aria-busy={loading}
        >
          {loading ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <Zap size={16} aria-hidden="true" />}
          {loading ? "Generating..." : "Generate My Routine"}
        </button>
      </div>

      {error && (
        <div role="alert" className="ag-card" style={{ background: "var(--error-bg)", borderColor: "var(--error-border)", display: "flex", gap: "0.6rem", alignItems: "flex-start" }}>
          <AlertCircle size={18} style={{ color: "var(--error-text)", flexShrink: 0 }} aria-hidden="true" />
          <p style={{ color: "var(--error-text)", fontSize: "0.85rem" }}>{error}</p>
        </div>
      )}

      {!routine && !loading && !error && (
        <div className="ag-card" style={{ textAlign: "center", padding: "3rem 2rem" }}>
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📅</div>
          <h2 style={{ fontWeight: 700, marginBottom: "0.5rem", color: "var(--text)" }}>Generate Your Personalized Routine</h2>
          <p style={{ color: "var(--text-2)", fontSize: "0.88rem", maxWidth: 420, margin: "0 auto 1.5rem" }}>
            Get a custom low-emission daily plan based on your location's air quality, your family's needs, commute type, and cooking habits.
          </p>
          <button
            onClick={handleGenerate}
            className="ag-btn-primary"
            style={{ padding: "0.8rem 2rem", fontSize: "0.92rem" }}
          >
            🚀 Generate Routine
          </button>
        </div>
      )}

      {loading && (
        <div className="ag-card" style={{ textAlign: "center", padding: "3rem" }} role="status" aria-live="polite" aria-label="Generating routine">
          <Loader2 size={40} className="animate-spin" style={{ color: "var(--sky)", margin: "0 auto 1rem" }} aria-hidden="true" />
          <p style={{ color: "var(--text-2)" }}>Crafting your personalized routine with Gemini AI...</p>
        </div>
      )}

      {routine && (
        <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {/* Stats */}
          <div className="ag-grid-2">
            <div className="ag-card" style={{ background: "var(--success-bg)", borderColor: "var(--success-border)", textAlign: "center" }}>
              <div style={{ marginBottom: "0.4rem" }}><TreePine size={28} style={{ color: "var(--good)", margin: "0 auto" }} aria-hidden="true" /></div>
              <div className="font-display" style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--success-text)" }}>{routine.co2_saved_per_day_kg ?? 0} kg</div>
              <div style={{ fontSize: "0.8rem", color: "var(--success-text)", fontWeight: 500 }}>CO₂ Saved Per Day</div>
            </div>
            <div className="ag-card" style={{ background: "var(--info-bg)", borderColor: "var(--info-border)", textAlign: "center" }}>
              <div style={{ fontSize: "1.6rem", marginBottom: "0.35rem" }}>💪</div>
              <div className="font-display" style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--info-text)" }}>{routine.health_score_improvement}</div>
              <div style={{ fontSize: "0.8rem", color: "var(--info-text)", fontWeight: 500, marginTop: "0.2rem" }}>Health Score Improvement</div>
            </div>
          </div>

          {/* Schedule */}
          <div className="ag-card">
            {routine.morning?.length > 0 && <TimeSection icon={<Sunrise size={16} aria-hidden="true" />} title="Morning" activities={routine.morning} />}
            {routine.afternoon?.length > 0 && <TimeSection icon={<Sun size={16} aria-hidden="true" />} title="Afternoon" activities={routine.afternoon} />}
            {routine.evening?.length > 0 && <TimeSection icon={<Sunset size={16} aria-hidden="true" />} title="Evening" activities={routine.evening} />}
          </div>

          {/* General tips */}
          {routine.general_tips?.length > 0 && (
            <div className="ag-card">
              <h3 style={{ fontWeight: 700, marginBottom: "0.75rem", fontSize: "0.95rem", color: "var(--text)" }}>💡 General Tips</h3>
              <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {routine.general_tips.map((tip, i) => (
                  <li key={i} style={{ display: "flex", gap: "0.5rem", fontSize: "0.85rem", color: "var(--text-2)" }}>
                    <span style={{ color: "var(--sky)", flexShrink: 0, fontWeight: 700 }}>→</span> {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Emergency */}
          {routine.emergency_protocol && (
            <div className="ag-card" style={{ background: "var(--alert-bg)", borderColor: "var(--alert-border)" }}>
              <h3 style={{ fontWeight: 700, marginBottom: "0.5rem", fontSize: "0.92rem", color: "var(--alert-title)" }}>🚨 Emergency Protocol (AQI &gt; 200)</h3>
              <p style={{ fontSize: "0.85rem", color: "var(--alert-text)" }}>{routine.emergency_protocol}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
