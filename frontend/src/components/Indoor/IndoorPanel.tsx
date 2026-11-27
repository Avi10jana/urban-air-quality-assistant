import { useState } from "react";
import type { UserProfile, AQIData, IndoorHacks } from "../../types";
import { fetchIndoorHacks } from "../../services/api";
import { Home, Loader2, AlertCircle, Leaf, Wind, Flame, Shield } from "lucide-react";

interface Props {
  profile: UserProfile;
  aqiData?: AQIData | null;
}

function CostBadge({ cost }: { cost: string }) {
  const map: Record<string, { label: string; color: string; bg: string }> = {
    free: { label: "Free", color: "var(--success-text)", bg: "var(--success-bg)" },
    low: { label: "Low Cost", color: "var(--info-text)", bg: "var(--info-bg)" },
    medium: { label: "Medium", color: "var(--alert-title)", bg: "var(--alert-bg)" },
    high: { label: "Investment", color: "var(--accent)", bg: "var(--accent-light)" },
  };
  const s = map[cost] ?? map.medium;
  return <span style={{ background: s.bg, color: s.color, padding: "0.15rem 0.55rem", borderRadius: 999, fontSize: "0.7rem", fontWeight: 600 }}>{s.label}</span>;
}

export function IndoorPanel({ profile, aqiData }: Props) {
  const [hacks, setHacks] = useState<IndoorHacks | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [budget, setBudget] = useState<"low" | "medium" | "high">("medium");

  const handleGenerate = async () => {
    setLoading(true); setError(null);
    try {
      const data = await fetchIndoorHacks({
        homeType: profile.homeType,
        cookingType: profile.cookingType,
        aqiLevel: aqiData?.level,
        budget,
      });
      setHacks(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate indoor hacks. Check your API key.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="panel-indoor" role="tabpanel" aria-label="Indoor Air Quality" className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.75rem" }}>
        <div>
          <h1 style={{ fontSize: "1.45rem", fontWeight: 800, display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--text)" }}>
            <Home size={22} style={{ color: "var(--sky)" }} aria-hidden="true" /> Indoor Air Quality Hacks
          </h1>
          <p style={{ color: "var(--text-2)", fontSize: "0.86rem" }}>
            {profile.homeType} · {profile.cookingType} cooking · Budget: {budget}
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.55rem", alignItems: "center", flexWrap: "wrap" }}>
          <fieldset style={{ border: "none", padding: 0 }}>
            <legend className="sr-only">Budget preference</legend>
            <div style={{ display: "flex", border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden", background: "var(--surface)" }}>
              {(["low", "medium", "high"] as const).map((b) => (
                <button
                  key={b}
                  onClick={() => setBudget(b)}
                  style={{
                    padding: "0.45rem 0.8rem", border: "none", cursor: "pointer",
                    fontSize: "0.78rem", fontWeight: budget === b ? 600 : 500,
                    background: budget === b ? "var(--sky)" : "transparent",
                    color: budget === b ? "#ffffff" : "var(--text-2)",
                    transition: "all 0.15s ease",
                  }}
                  aria-pressed={budget === b}
                >
                  {b === "low" ? "🤑 Free/Low" : b === "medium" ? "💰 Medium" : "💎 All"}
                </button>
              ))}
            </div>
          </fieldset>
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="ag-btn-primary"
            style={{ padding: "0.58rem 1.15rem", fontSize: "0.86rem" }}
            aria-busy={loading}
          >
            {loading ? <Loader2 size={15} className="animate-spin" aria-hidden="true" /> : <Home size={15} aria-hidden="true" />}
            {loading ? "Generating..." : "Get Hacks"}
          </button>
        </div>
      </div>

      {error && (
        <div role="alert" className="ag-card" style={{ background: "var(--error-bg)", borderColor: "var(--error-border)", display: "flex", gap: "0.6rem" }}>
          <AlertCircle size={18} style={{ color: "var(--error-text)", flexShrink: 0 }} aria-hidden="true" />
          <p style={{ fontSize: "0.85rem", color: "var(--error-text)" }}>{error}</p>
        </div>
      )}

      {!hacks && !loading && !error && (
        <div className="ag-card" style={{ textAlign: "center", padding: "3rem 2rem" }}>
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🏡</div>
          <h2 style={{ fontWeight: 700, marginBottom: "0.5rem", color: "var(--text)" }}>Improve Your Indoor Air Quality</h2>
          <p style={{ color: "var(--text-2)", fontSize: "0.88rem", maxWidth: 440, margin: "0 auto 1.5rem" }}>
            Get tailored tips for your {profile.homeType} with {profile.cookingType} cooking — from free plant-based solutions to air purifier recommendations.
          </p>
          <button onClick={handleGenerate} className="ag-btn-primary" style={{ padding: "0.8rem 2rem", fontSize: "0.92rem" }}>
            🏠 Generate Indoor Hacks
          </button>
        </div>
      )}

      {loading && (
        <div className="ag-card" style={{ textAlign: "center", padding: "3rem" }} role="status" aria-live="polite" aria-label="Generating indoor hacks">
          <Loader2 size={40} className="animate-spin" style={{ color: "var(--sky)", margin: "0 auto 1rem" }} aria-hidden="true" />
          <p style={{ color: "var(--text-2)" }}>Generating personalized indoor air quality tips...</p>
        </div>
      )}

      {hacks && (
        <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {/* Quick Wins */}
          {hacks.quickWins?.length > 0 && (
            <div className="ag-card">
              <h2 style={{ fontWeight: 700, fontSize: "0.98rem", display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.9rem", color: "var(--sky-dark)" }}>
                <Leaf size={16} aria-hidden="true" /> Quick Wins
              </h2>
              <div className="ag-grid-auto">
                {hacks.quickWins.map((w, i) => (
                  <div key={i} style={{ padding: "0.85rem", border: "1px solid var(--border)", borderRadius: 10, background: "var(--surface-2)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.45rem", alignItems: "center" }}>
                      <span style={{ fontSize: "1.35rem" }} aria-hidden="true">{w.emoji}</span>
                      <CostBadge cost={w.cost} />
                    </div>
                    <p style={{ fontWeight: 600, fontSize: "0.86rem", marginBottom: "0.35rem", color: "var(--text)" }}>{w.hack}</p>
                    <p style={{ fontSize: "0.78rem", color: "var(--good)", fontWeight: 500 }}>✅ {w.impact}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Plants */}
          {hacks.plants?.length > 0 && (
            <div className="ag-card">
              <h2 style={{ fontWeight: 700, fontSize: "0.98rem", display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.9rem", color: "var(--success-text)" }}>
                🌿 Air-Purifying Plants
              </h2>
              <div className="ag-grid-auto">
                {hacks.plants.map((p, i) => (
                  <div key={i} style={{ padding: "0.85rem", border: "1px solid var(--success-border)", borderRadius: 10, background: "var(--success-bg)" }}>
                    <div style={{ fontWeight: 700, marginBottom: "0.3rem", color: "var(--text)" }}>🌱 {p.name}</div>
                    <div style={{ fontSize: "0.78rem", color: "var(--success-text)", marginBottom: "0.35rem" }}>Targets: {p.targetPollutant}</div>
                    <div style={{ fontSize: "0.73rem", background: "var(--surface)", border: "1px solid var(--success-border)", borderRadius: 999, padding: "0.12rem 0.55rem", display: "inline-block", marginBottom: "0.35rem", color: "var(--success-text)", fontWeight: 600 }}>Care: {p.careLevel}</div>
                    <div style={{ fontSize: "0.76rem", color: "var(--text-2)" }}>📍 {p.placementTip}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Ventilation */}
          {hacks.ventilation?.length > 0 && (
            <div className="ag-card">
              <h2 style={{ fontWeight: 700, fontSize: "0.98rem", display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.9rem", color: "var(--sky-dark)" }}>
                <Wind size={16} aria-hidden="true" /> Ventilation Strategies
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.55rem" }}>
                {hacks.ventilation.map((v, i) => (
                  <div key={i} style={{ padding: "0.75rem 1rem", border: "1px solid var(--border)", borderRadius: 10, background: "var(--surface-2)", display: "flex", justifyContent: "space-between", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
                    <div style={{ flex: 1, minWidth: 200 }}>
                      <div style={{ fontWeight: 600, fontSize: "0.86rem", marginBottom: "0.2rem", color: "var(--text)" }}>{v.strategy}</div>
                      <div style={{ fontSize: "0.79rem", color: "var(--text-2)" }}>{v.why}</div>
                    </div>
                    <span style={{ fontSize: "0.74rem", fontWeight: 600, color: "var(--sky-dark)", background: "var(--sky-light)", padding: "0.25rem 0.65rem", borderRadius: 999, textAlign: "center" }}>{v.when}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Cooking Tips */}
          {hacks.cookingTips?.length > 0 && (
            <div className="ag-card">
              <h2 style={{ fontWeight: 700, fontSize: "0.98rem", display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.9rem", color: "var(--alert-title)" }}>
                <Flame size={16} aria-hidden="true" /> Cooking Tips
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.55rem" }}>
                {hacks.cookingTips.map((t, i) => (
                  <div key={i} style={{ padding: "0.75rem 1rem", border: "1px solid var(--alert-border)", borderRadius: 10, background: "var(--alert-bg)" }}>
                    <div style={{ fontWeight: 600, fontSize: "0.86rem", marginBottom: "0.2rem", color: "var(--alert-title)" }}>🍳 {t.tip}</div>
                    <div style={{ fontSize: "0.79rem", color: "var(--alert-text)" }}>Reduces {t.pollutantReduced}: {t.impact}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Air Purifier */}
          {hacks.purifierAdvice && (
            <div className="ag-card" style={{ background: hacks.purifierAdvice.needed ? "var(--info-bg)" : "var(--success-bg)", borderColor: hacks.purifierAdvice.needed ? "var(--info-border)" : "var(--success-border)" }}>
              <h2 style={{ fontWeight: 700, fontSize: "0.98rem", display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem", color: hacks.purifierAdvice.needed ? "var(--info-text)" : "var(--success-text)" }}>
                <Shield size={16} aria-hidden="true" /> Air Purifier Recommendation
              </h2>
              <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start", flexWrap: "wrap" }}>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: "0.86rem", marginBottom: "0.5rem", color: "var(--text)" }}>{hacks.purifierAdvice.recommendation}</p>
                  <div style={{ display: "flex", gap: "0.85rem", fontSize: "0.8rem", flexWrap: "wrap", color: "var(--text-2)" }}>
                    <span>Filter: <strong>{hacks.purifierAdvice.filterType}</strong></span>
                    {hacks.purifierAdvice.minCadr > 0 && <span>Min CADR: <strong>{hacks.purifierAdvice.minCadr} m³/h</strong></span>}
                  </div>
                </div>
                <span style={{ background: "var(--surface)", color: hacks.purifierAdvice.needed ? "var(--info-text)" : "var(--success-text)", border: `1px solid ${hacks.purifierAdvice.needed ? "var(--info-border)" : "var(--success-border)"}`, padding: "0.25rem 0.8rem", borderRadius: 999, fontWeight: 700, fontSize: "0.8rem", whiteSpace: "nowrap" }}>
                  {hacks.purifierAdvice.needed ? "✅ Recommended" : "ℹ️ Optional"}
                </span>
              </div>
            </div>
          )}

          {/* Emergency */}
          {hacks.emergencyProtocol && (
            <div className="ag-card" style={{ background: "var(--alert-bg)", borderColor: "var(--alert-border)" }}>
              <h2 style={{ fontWeight: 700, fontSize: "0.92rem", color: "var(--alert-title)", marginBottom: "0.5rem" }}>🚨 Emergency Protocol (Outdoor AQI &gt; 200)</h2>
              <p style={{ fontSize: "0.85rem", color: "var(--alert-text)" }}>{hacks.emergencyProtocol}</p>
            </div>
          )}

          {/* Seasonal */}
          {hacks.seasonalTips?.winter?.length > 0 && (
            <div className="ag-card">
              <h2 style={{ fontWeight: 700, fontSize: "0.98rem", marginBottom: "0.75rem", color: "var(--text)" }}>❄️ Winter Smog Specific Tips</h2>
              <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: "0.45rem" }}>
                {hacks.seasonalTips.winter.map((tip, i) => (
                  <li key={i} style={{ fontSize: "0.85rem", color: "var(--text-2)", display: "flex", gap: "0.5rem" }}>
                    <span style={{ color: "var(--sky)", flexShrink: 0 }}>❄️</span> {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
