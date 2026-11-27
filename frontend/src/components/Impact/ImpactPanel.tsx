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
  const colors = {
    easy: { bg: "var(--success-bg)", text: "var(--success-text)", border: "var(--success-border)" },
    medium: { bg: "var(--alert-bg)", text: "var(--alert-title)", border: "var(--alert-border)" },
    hard: { bg: "var(--error-bg)", text: "var(--error-text)", border: "var(--error-border)" },
  };
  const c = colors[level as keyof typeof colors] ?? colors.medium;
  return <span style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}`, padding: "0.18rem 0.6rem", borderRadius: 999, fontSize: "0.72rem", fontWeight: 600 }}>{level}</span>;
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

  return (
    <div id="panel-impact" role="tabpanel" aria-label="My Impact" className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      <div>
        <h1 style={{ fontSize: "1.45rem", fontWeight: 800, display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--text)" }}>
          <Leaf size={22} style={{ color: "var(--good)" }} aria-hidden="true" /> My Environmental Impact
        </h1>
        <p style={{ color: "var(--text-2)", fontSize: "0.86rem" }}>See the CO₂ and health benefits of switching to greener alternatives</p>
      </div>

      {/* Choices editor */}
      <div className="ag-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.5rem" }}>
          <h2 style={{ fontWeight: 700, fontSize: "0.98rem", color: "var(--text)" }}>Your Lifestyle Changes</h2>
          <button
            onClick={addChoice}
            style={{
              display: "flex", alignItems: "center", gap: "0.4rem",
              padding: "0.45rem 0.85rem", border: "1px solid var(--sky)", borderRadius: 8,
              background: "var(--sky-light)", cursor: "pointer", fontSize: "0.8rem",
              color: "var(--sky-dark)", fontWeight: 600,
            }}
            aria-label="Add a new lifestyle change"
          >
            <Plus size={14} aria-hidden="true" /> Add Change
          </button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {choices.map((choice, i) => (
            <div key={i} style={{ padding: "0.8rem", border: "1px solid var(--border)", borderRadius: 10, background: "var(--surface-2)" }}>
              <div className="ag-impact-row">
                <select className="ag-input" value={choice.category} onChange={(e) => updateChoice(i, "category", e.target.value)} aria-label={`Category for change ${i + 1}`}>
                  {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                </select>
                <input className="ag-input" placeholder="Current behavior…" value={choice.currentBehavior} onChange={(e) => updateChoice(i, "currentBehavior", e.target.value)} aria-label={`Current behavior for change ${i + 1}`} />
                <input className="ag-input" placeholder="Proposed alternative…" value={choice.proposedAlternative} onChange={(e) => updateChoice(i, "proposedAlternative", e.target.value)} aria-label={`Proposed alternative for change ${i + 1}`} />
                <button onClick={() => removeChoice(i)} style={{ padding: "0.5rem", border: "none", background: "none", cursor: "pointer", color: "var(--text-3)", borderRadius: 6 }} aria-label={`Remove change ${i + 1}`}>
                  <Trash2 size={16} aria-hidden="true" />
                </button>
              </div>
            </div>
          ))}
        </div>
        {error && <p role="alert" style={{ color: "var(--error-text)", fontSize: "0.82rem", marginTop: "0.75rem" }}>{error}</p>}
        <button
          onClick={handleAnalyze}
          disabled={loading}
          className="ag-btn-primary"
          style={{
            marginTop: "1rem", width: "100%", padding: "0.8rem", fontSize: "0.92rem",
            background: loading ? undefined : "var(--grad-eco)",
          }}
          aria-busy={loading}
        >
          {loading ? <><Loader2 size={16} className="animate-spin" aria-hidden="true" /> Analyzing...</> : <><Leaf size={16} aria-hidden="true" /> Calculate My Impact</>}
        </button>
      </div>

      {/* Results */}
      {result && (
        <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {/* Summary */}
          <div className="ag-grid-3">
            {[
              { icon: "🌿", value: `${result.totalCO2SavedKgPerYear?.toFixed(0) ?? 0} kg`, label: "CO₂ Saved / Year", color: "var(--success-text)", bg: "var(--success-bg)", border: "var(--success-border)" },
              { icon: "🌳", value: `${result.equivalentTrees ?? 0}`, label: "Equivalent Trees", color: "var(--good)", bg: "var(--success-bg)", border: "var(--success-border)" },
              { icon: "💪", value: `${result.pm25ReductionPercent ?? 0}%`, label: "PM2.5 Exposure Cut", color: "var(--info-text)", bg: "var(--info-bg)", border: "var(--info-border)" },
            ].map((s) => (
              <div key={s.label} className="ag-card" style={{ background: s.bg, borderColor: s.border, textAlign: "center" }}>
                <div style={{ fontSize: "1.55rem", marginBottom: "0.4rem" }}>{s.icon}</div>
                <div className="font-display" style={{ fontSize: "1.55rem", fontWeight: 800, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: "0.76rem", color: s.color, fontWeight: 600 }}>{s.label}</div>
              </div>
            ))}
          </div>

          <div className="ag-card" style={{ background: "var(--success-bg)", borderColor: "var(--success-border)" }}>
            <p style={{ color: "var(--success-text)", fontWeight: 600, fontSize: "0.92rem" }}>🎉 {result.overallMessage}</p>
            <p style={{ color: "var(--success-text)", fontSize: "0.84rem", marginTop: "0.4rem", opacity: 0.9 }}>Health Improvement: {result.healthScoreImprovement}</p>
          </div>

          {/* Per-choice breakdown */}
          {result.choices?.map((c, i) => (
            <div key={i} className="ag-card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.85rem", gap: "0.5rem" }}>
                <div>
                  <span style={{ fontSize: "0.73rem", fontWeight: 600, background: "var(--sky-light)", color: "var(--sky-dark)", padding: "0.15rem 0.55rem", borderRadius: 999 }}>{c.category}</span>
                  <div style={{ marginTop: "0.45rem", fontSize: "0.87rem" }}>
                    <span style={{ color: "var(--text-3)", textDecoration: "line-through" }}>{c.currentBehavior}</span>
                    <span style={{ margin: "0 0.5rem", color: "var(--sky)", fontWeight: 700 }}>→</span>
                    <span style={{ fontWeight: 600, color: "var(--text)" }}>{c.alternative}</span>
                  </div>
                </div>
                <DifficultyBadge level={c.difficultyLevel} />
              </div>
              <div className="ag-grid-3" style={{ marginBottom: "0.8rem" }}>
                {[
                  { label: "CO₂ Saved", value: `${c.co2SavedKgPerYear?.toFixed(0) ?? 0} kg/yr`, color: "var(--good)" },
                  { label: "PM2.5 Cut", value: `${c.pm25ImpactPercent ?? 0}%`, color: "var(--sky)" },
                  { label: "Cost Saved", value: `₹${c.costSavingINRPerYear?.toFixed(0) ?? 0}/yr`, color: "var(--accent)" },
                ].map((m) => (
                  <div key={m.label} style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 10, padding: "0.55rem", textAlign: "center" }}>
                    <div className="font-display" style={{ fontSize: "0.95rem", fontWeight: 700, color: m.color }}>{m.value}</div>
                    <div style={{ fontSize: "0.7rem", color: "var(--text-3)" }}>{m.label}</div>
                  </div>
                ))}
              </div>
              <p style={{ fontSize: "0.83rem", color: "var(--good)", marginBottom: "0.5rem", fontWeight: 500 }}>✅ {c.healthBenefit}</p>
              {c.implementationTips?.length > 0 && (
                <ul style={{ listStyle: "none", padding: 0 }}>
                  {c.implementationTips.map((tip, j) => (
                    <li key={j} style={{ fontSize: "0.8rem", color: "var(--text-2)", display: "flex", gap: "0.4rem", marginBottom: "0.2rem" }}>
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
