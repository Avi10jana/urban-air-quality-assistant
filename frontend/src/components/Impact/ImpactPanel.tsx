import { useState } from "react";
import type { UserProfile, LifestyleChoice, ImpactAnalysis } from "../../types";
import { analyzeImpact } from "../../services/api";
import { Leaf, Plus, Trash2, Loader2 } from "lucide-react";

interface Props { profile: Partial<UserProfile>; }

const CATEGORIES = ["Transport", "Cooking", "Energy", "Shopping", "Waste", "Water", "Food", "Heating/Cooling"];

const PRESETS: LifestyleChoice[] = [
  { category: "Transport", currentBehavior: "Drive personal car 15km/day", proposedAlternative: "Take metro/bus daily" },
  { category: "Cooking", currentBehavior: "Cook on gas stove 3 times/day", proposedAlternative: "Switch to induction cooktop" },
  { category: "Energy", currentBehavior: "Use AC all day at 18°C", proposedAlternative: "Set AC to 24°C with fans" },
];

function DifficultyBadge({ level }: { level: string }) {
  const colors = { easy: { bg: "#f0fdf4", text: "#16a34a", border: "#86efac" }, medium: { bg: "#fff7ed", text: "#c2410c", border: "#fdba74" }, hard: { bg: "#fef2f2", text: "#dc2626", border: "#fecaca" } };
  const c = colors[level as keyof typeof colors] ?? colors.medium;
  return <span style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}`, padding: "0.15rem 0.5rem", borderRadius: 999, fontSize: "0.7rem", fontWeight: 600 }}>{level}</span>;
}

export function ImpactPanel({ profile }: Props) {
  const [choices, setChoices] = useState<LifestyleChoice[]>(PRESETS);
  const [result, setResult] = useState<ImpactAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addChoice = () => setChoices((c) => [...c, { category: "Transport", currentBehavior: "", proposedAlternative: "" }]);
  const removeChoice = (i: number) => setChoices((c) => c.filter((_, idx) => idx !== i));
  const updateChoice = (i: number, field: keyof LifestyleChoice, value: string) =>
    setChoices((c) => c.map((item, idx) => idx === i ? { ...item, [field]: value } : item));

  const handleAnalyze = async () => {
    const valid = choices.filter((c) => c.currentBehavior && c.proposedAlternative);
    if (!valid.length) { setError("Please fill in at least one complete lifestyle change."); return; }
    setLoading(true); setError(null);
    try {
      const data = await analyzeImpact(valid, profile);
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed. Please check your API key.");
    } finally {
      setLoading(false);
    }
  };

  const card: React.CSSProperties = { background: "var(--surface)", borderRadius: 12, padding: "1.25rem", border: "1px solid var(--border)", boxShadow: "var(--shadow)" };
  const inputStyle: React.CSSProperties = { width: "100%", padding: "0.5rem 0.75rem", border: "1px solid var(--border)", borderRadius: 8, fontSize: "0.82rem", fontFamily: "inherit", outline: "none" };

  return (
    <div id="panel-impact" role="tabpanel" aria-label="My Impact" style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      <div>
        <h1 style={{ fontSize: "1.3rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Leaf size={22} aria-hidden="true" /> My Environmental Impact
        </h1>
        <p style={{ color: "var(--text-2)", fontSize: "0.85rem" }}>See the CO₂ and health benefits of switching to greener alternatives</p>
      </div>

      {/* Choices editor */}
      <div style={card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <h2 style={{ fontWeight: 600, fontSize: "0.95rem" }}>Your Lifestyle Changes</h2>
          <button onClick={addChoice} style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.4rem 0.8rem", border: "1px solid var(--sky)", borderRadius: 8, background: "var(--sky-light)", cursor: "pointer", fontSize: "0.8rem", color: "var(--sky-dark)", fontWeight: 500 }} aria-label="Add a new lifestyle change">
            <Plus size={14} aria-hidden="true" /> Add Change
          </button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {choices.map((choice, i) => (
            <div key={i} style={{ padding: "0.75rem", border: "1px solid var(--border)", borderRadius: 10, background: "var(--surface-2)" }}>
              <div style={{ display: "grid", gridTemplateColumns: "120px 1fr 1fr auto", gap: "0.5rem", alignItems: "start" }}>
                <select value={choice.category} onChange={(e) => updateChoice(i, "category", e.target.value)} style={inputStyle} aria-label={`Category for change ${i + 1}`}>
                  {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                </select>
                <input placeholder="Current behavior…" value={choice.currentBehavior} onChange={(e) => updateChoice(i, "currentBehavior", e.target.value)} style={inputStyle} aria-label={`Current behavior for change ${i + 1}`} onFocus={(e) => (e.target.style.borderColor = "var(--sky)")} onBlur={(e) => (e.target.style.borderColor = "var(--border)")} />
                <input placeholder="Proposed alternative…" value={choice.proposedAlternative} onChange={(e) => updateChoice(i, "proposedAlternative", e.target.value)} style={inputStyle} aria-label={`Proposed alternative for change ${i + 1}`} onFocus={(e) => (e.target.style.borderColor = "var(--sky)")} onBlur={(e) => (e.target.style.borderColor = "var(--border)")} />
                <button onClick={() => removeChoice(i)} style={{ padding: "0.5rem", border: "none", background: "none", cursor: "pointer", color: "var(--text-3)", borderRadius: 6 }} aria-label={`Remove change ${i + 1}`}>
                  <Trash2 size={15} aria-hidden="true" />
                </button>
              </div>
            </div>
          ))}
        </div>
        {error && <p role="alert" style={{ color: "#dc2626", fontSize: "0.8rem", marginTop: "0.75rem" }}>{error}</p>}
        <button
          onClick={handleAnalyze}
          disabled={loading}
          style={{ marginTop: "1rem", width: "100%", padding: "0.75rem", background: loading ? "var(--border)" : "linear-gradient(135deg, #22c55e, #16a34a)", color: "white", border: "none", borderRadius: 10, cursor: loading ? "not-allowed" : "pointer", fontWeight: 600, fontSize: "0.9rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}
          aria-busy={loading}
        >
          {loading ? <><Loader2 size={16} className="animate-spin" aria-hidden="true" /> Analyzing...</> : <><Leaf size={16} aria-hidden="true" /> Calculate My Impact</>}
        </button>
      </div>

      {/* Results */}
      {result && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem", animationName: "fadeIn", animationDuration: "0.4s" }}>
          {/* Summary */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.75rem" }}>
            {[
              { icon: "🌿", value: `${result.totalCO2SavedKgPerYear?.toFixed(0) ?? 0} kg`, label: "CO₂ Saved / Year", color: "#16a34a", bg: "#f0fdf4" },
              { icon: "🌳", value: `${result.equivalentTrees ?? 0}`, label: "Equivalent Trees", color: "#15803d", bg: "#dcfce7" },
              { icon: "💪", value: `${result.pm25ReductionPercent ?? 0}%`, label: "PM2.5 Exposure Cut", color: "#0284c7", bg: "#e0f2fe" },
            ].map((s) => (
              <div key={s.label} style={{ ...card, background: s.bg, borderColor: `${s.color}44`, textAlign: "center" }}>
                <div style={{ fontSize: "1.5rem", marginBottom: "0.4rem" }}>{s.icon}</div>
                <div style={{ fontSize: "1.5rem", fontWeight: 800, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: "0.75rem", color: s.color, opacity: 0.8 }}>{s.label}</div>
              </div>
            ))}
          </div>

          <div style={{ ...card, background: "linear-gradient(135deg, #f0fdf4, #dcfce7)", borderColor: "#86efac" }}>
            <p style={{ color: "#166534", fontWeight: 500, fontSize: "0.9rem" }}>🎉 {result.overallMessage}</p>
            <p style={{ color: "#16a34a", fontSize: "0.82rem", marginTop: "0.4rem" }}>Health Improvement: {result.healthScoreImprovement}</p>
          </div>

          {/* Per-choice breakdown */}
          {result.choices?.map((c, i) => (
            <div key={i} style={card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
                <div>
                  <span style={{ fontSize: "0.73rem", fontWeight: 600, background: "var(--sky-light)", color: "var(--sky-dark)", padding: "0.1rem 0.5rem", borderRadius: 999 }}>{c.category}</span>
                  <div style={{ marginTop: "0.4rem", fontSize: "0.85rem" }}>
                    <span style={{ color: "var(--text-3)", textDecoration: "line-through" }}>{c.currentBehavior}</span>
                    <span style={{ margin: "0 0.5rem", color: "var(--sky)" }}>→</span>
                    <span style={{ fontWeight: 500 }}>{c.alternative}</span>
                  </div>
                </div>
                <DifficultyBadge level={c.difficultyLevel} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.5rem", marginBottom: "0.75rem" }}>
                {[
                  { label: "CO₂ Saved", value: `${c.co2SavedKgPerYear?.toFixed(0) ?? 0} kg/yr`, color: "#16a34a" },
                  { label: "PM2.5 Cut", value: `${c.pm25ImpactPercent ?? 0}%`, color: "#0284c7" },
                  { label: "Cost Saved", value: `₹${c.costSavingINRPerYear?.toFixed(0) ?? 0}/yr`, color: "#7c3aed" },
                ].map((m) => (
                  <div key={m.label} style={{ background: "var(--surface-2)", borderRadius: 8, padding: "0.5rem", textAlign: "center" }}>
                    <div style={{ fontSize: "0.9rem", fontWeight: 700, color: m.color }}>{m.value}</div>
                    <div style={{ fontSize: "0.68rem", color: "var(--text-3)" }}>{m.label}</div>
                  </div>
                ))}
              </div>
              <p style={{ fontSize: "0.82rem", color: "#16a34a", marginBottom: "0.5rem" }}>✅ {c.healthBenefit}</p>
              {c.implementationTips?.length > 0 && (
                <ul style={{ listStyle: "none", padding: 0 }}>
                  {c.implementationTips.map((tip, j) => (
                    <li key={j} style={{ fontSize: "0.78rem", color: "var(--text-2)", display: "flex", gap: "0.4rem" }}>
                      <span style={{ color: "var(--sky)", flexShrink: 0 }}>•</span> {tip}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
