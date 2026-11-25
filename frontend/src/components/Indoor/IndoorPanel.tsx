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
    free: { label: "Free", color: "#16a34a", bg: "#f0fdf4" },
    low: { label: "Low Cost", color: "#0284c7", bg: "#e0f2fe" },
    medium: { label: "Medium", color: "#c2410c", bg: "#fff7ed" },
    high: { label: "Investment", color: "#7c3aed", bg: "#faf5ff" },
  };
  const s = map[cost] ?? map.medium;
  return <span style={{ background: s.bg, color: s.color, padding: "0.1rem 0.5rem", borderRadius: 999, fontSize: "0.68rem", fontWeight: 600 }}>{s.label}</span>;
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

  const card: React.CSSProperties = { background: "var(--surface)", borderRadius: 12, padding: "1.25rem", border: "1px solid var(--border)", boxShadow: "var(--shadow)" };

  return (
    <div id="panel-indoor" role="tabpanel" aria-label="Indoor Air Quality" style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.75rem" }}>
        <div>
          <h1 style={{ fontSize: "1.3rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Home size={22} aria-hidden="true" /> Indoor Air Quality Hacks
          </h1>
          <p style={{ color: "var(--text-2)", fontSize: "0.85rem" }}>
            {profile.homeType} · {profile.cookingType} cooking · Budget: {budget}
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <fieldset style={{ border: "none", padding: 0 }}>
            <legend style={{ position: "absolute", width: 1, height: 1, overflow: "hidden" }}>Budget preference</legend>
            <div style={{ display: "flex", border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden" }}>
              {(["low", "medium", "high"] as const).map((b) => (
                <button key={b} onClick={() => setBudget(b)} style={{ padding: "0.4rem 0.75rem", border: "none", cursor: "pointer", fontSize: "0.78rem", fontWeight: budget === b ? 600 : 400, background: budget === b ? "var(--sky)" : "transparent", color: budget === b ? "white" : "var(--text-2)", transition: "all 0.15s" }} aria-pressed={budget === b}>
                  {b === "low" ? "🤑 Free/Low" : b === "medium" ? "💰 Medium" : "💎 All"}
                </button>
              ))}
            </div>
          </fieldset>
          <button
            onClick={handleGenerate}
            disabled={loading}
            style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.6rem 1.1rem", background: loading ? "var(--border)" : "linear-gradient(135deg, #0ea5e9, #0284c7)", color: "white", border: "none", borderRadius: 10, cursor: loading ? "not-allowed" : "pointer", fontWeight: 600, fontSize: "0.85rem" }}
            aria-busy={loading}
          >
            {loading ? <Loader2 size={15} className="animate-spin" aria-hidden="true" /> : <Home size={15} aria-hidden="true" />}
            {loading ? "Generating..." : "Get Hacks"}
          </button>
        </div>
      </div>

      {error && (
        <div role="alert" style={{ ...card, background: "#fef2f2", borderColor: "#fecaca", display: "flex", gap: "0.6rem" }}>
          <AlertCircle size={18} style={{ color: "#dc2626", flexShrink: 0 }} aria-hidden="true" />
          <p style={{ fontSize: "0.85rem", color: "#dc2626" }}>{error}</p>
        </div>
      )}

      {!hacks && !loading && !error && (
        <div style={{ ...card, textAlign: "center", padding: "3rem" }}>
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🏡</div>
          <h2 style={{ fontWeight: 600, marginBottom: "0.5rem" }}>Improve Your Indoor Air Quality</h2>
          <p style={{ color: "var(--text-2)", fontSize: "0.88rem", maxWidth: 420, margin: "0 auto 1.5rem" }}>
            Get tailored tips for your {profile.homeType} with {profile.cookingType} cooking — from free plant-based solutions to air purifier recommendations.
          </p>
          <button onClick={handleGenerate} style={{ padding: "0.75rem 2rem", background: "linear-gradient(135deg, #0ea5e9, #0284c7)", color: "white", border: "none", borderRadius: 10, cursor: "pointer", fontWeight: 600, boxShadow: "0 4px 14px rgba(14,165,233,.4)" }}>
            🏠 Generate Indoor Hacks
          </button>
        </div>
      )}

      {loading && (
        <div style={{ ...card, textAlign: "center", padding: "3rem" }} role="status" aria-live="polite" aria-label="Generating indoor hacks">
          <Loader2 size={40} className="animate-spin" style={{ color: "var(--sky)", margin: "0 auto 1rem" }} aria-hidden="true" />
          <p style={{ color: "var(--text-2)" }}>Generating personalized indoor air quality tips...</p>
        </div>
      )}

      {hacks && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem", animationName: "fadeIn", animationDuration: "0.4s" }}>
          {/* Quick Wins */}
          {hacks.quickWins?.length > 0 && (
            <div style={card}>
              <h2 style={{ fontWeight: 700, fontSize: "0.95rem", display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.9rem", color: "var(--sky-dark)" }}>
                <Leaf size={16} aria-hidden="true" /> Quick Wins
              </h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "0.6rem" }}>
                {hacks.quickWins.map((w, i) => (
                  <div key={i} style={{ padding: "0.75rem", border: "1px solid var(--border)", borderRadius: 10, background: "var(--surface-2)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4rem" }}>
                      <span style={{ fontSize: "1.3rem" }} aria-hidden="true">{w.emoji}</span>
                      <CostBadge cost={w.cost} />
                    </div>
                    <p style={{ fontWeight: 600, fontSize: "0.85rem", marginBottom: "0.3rem" }}>{w.hack}</p>
                    <p style={{ fontSize: "0.78rem", color: "#22c55e" }}>✅ {w.impact}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Plants */}
          {hacks.plants?.length > 0 && (
            <div style={card}>
              <h2 style={{ fontWeight: 700, fontSize: "0.95rem", display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.9rem", color: "#16a34a" }}>
                🌿 Air-Purifying Plants
              </h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "0.6rem" }}>
                {hacks.plants.map((p, i) => (
                  <div key={i} style={{ padding: "0.75rem", border: "1px solid #86efac", borderRadius: 10, background: "#f0fdf4" }}>
                    <div style={{ fontWeight: 600, marginBottom: "0.3rem" }}>🌱 {p.name}</div>
                    <div style={{ fontSize: "0.78rem", color: "#166534", marginBottom: "0.3rem" }}>Targets: {p.targetPollutant}</div>
                    <div style={{ fontSize: "0.73rem", background: "#dcfce7", borderRadius: 999, padding: "0.1rem 0.5rem", display: "inline-block", marginBottom: "0.3rem", color: "#15803d" }}>Care: {p.careLevel}</div>
                    <div style={{ fontSize: "0.75rem", color: "#166534" }}>📍 {p.placementTip}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Ventilation */}
          {hacks.ventilation?.length > 0 && (
            <div style={card}>
              <h2 style={{ fontWeight: 700, fontSize: "0.95rem", display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.9rem", color: "var(--sky-dark)" }}>
                <Wind size={16} aria-hidden="true" /> Ventilation Strategies
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {hacks.ventilation.map((v, i) => (
                  <div key={i} style={{ padding: "0.7rem 1rem", border: "1px solid var(--border)", borderRadius: 8, display: "grid", gridTemplateColumns: "1fr 100px", gap: "0.75rem", alignItems: "center" }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: "0.85rem", marginBottom: "0.2rem" }}>{v.strategy}</div>
                      <div style={{ fontSize: "0.78rem", color: "var(--text-2)" }}>{v.why}</div>
                    </div>
                    <span style={{ fontSize: "0.73rem", color: "var(--sky-dark)", background: "var(--sky-light)", padding: "0.2rem 0.5rem", borderRadius: 999, textAlign: "center" }}>{v.when}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Cooking Tips */}
          {hacks.cookingTips?.length > 0 && (
            <div style={card}>
              <h2 style={{ fontWeight: 700, fontSize: "0.95rem", display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.9rem", color: "#c2410c" }}>
                <Flame size={16} aria-hidden="true" /> Cooking Tips
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {hacks.cookingTips.map((t, i) => (
                  <div key={i} style={{ padding: "0.7rem 1rem", border: "1px solid #fdba74", borderRadius: 8, background: "#fff7ed" }}>
                    <div style={{ fontWeight: 500, fontSize: "0.85rem", marginBottom: "0.2rem" }}>🍳 {t.tip}</div>
                    <div style={{ fontSize: "0.78rem", color: "#7c2d12" }}>Reduces {t.pollutantReduced}: {t.impact}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Air Purifier */}
          {hacks.purifierAdvice && (
            <div style={{ ...card, background: hacks.purifierAdvice.needed ? "#eff6ff" : "#f0fdf4", borderColor: hacks.purifierAdvice.needed ? "#93c5fd" : "#86efac" }}>
              <h2 style={{ fontWeight: 700, fontSize: "0.95rem", display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem", color: hacks.purifierAdvice.needed ? "#1d4ed8" : "#16a34a" }}>
                <Shield size={16} aria-hidden="true" /> Air Purifier Recommendation
              </h2>
              <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start", flexWrap: "wrap" }}>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: "0.85rem", marginBottom: "0.5rem" }}>{hacks.purifierAdvice.recommendation}</p>
                  <div style={{ display: "flex", gap: "0.75rem", fontSize: "0.78rem", flexWrap: "wrap" }}>
                    <span>Filter: <strong>{hacks.purifierAdvice.filterType}</strong></span>
                    {hacks.purifierAdvice.minCadr > 0 && <span>Min CADR: <strong>{hacks.purifierAdvice.minCadr} m³/h</strong></span>}
                  </div>
                </div>
                <span style={{ background: hacks.purifierAdvice.needed ? "#dbeafe" : "#dcfce7", color: hacks.purifierAdvice.needed ? "#1d4ed8" : "#16a34a", padding: "0.25rem 0.75rem", borderRadius: 999, fontWeight: 700, fontSize: "0.8rem", whiteSpace: "nowrap" }}>
                  {hacks.purifierAdvice.needed ? "✅ Recommended" : "ℹ️ Optional"}
                </span>
              </div>
            </div>
          )}

          {/* Emergency */}
          {hacks.emergencyProtocol && (
            <div style={{ ...card, background: "#fff7ed", borderColor: "#fdba74" }}>
              <h2 style={{ fontWeight: 700, fontSize: "0.9rem", color: "#c2410c", marginBottom: "0.5rem" }}>🚨 Emergency Protocol (Outdoor AQI &gt; 200)</h2>
              <p style={{ fontSize: "0.85rem", color: "#7c2d12" }}>{hacks.emergencyProtocol}</p>
            </div>
          )}

          {/* Seasonal */}
          {hacks.seasonalTips?.winter?.length > 0 && (
            <div style={card}>
              <h2 style={{ fontWeight: 700, fontSize: "0.95rem", marginBottom: "0.75rem" }}>❄️ Winter Smog Specific Tips</h2>
              <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: "0.4rem" }}>
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
