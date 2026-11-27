import { useState } from "react";
import type { UserProfile, LifestyleType, CommuteType, HomeType, CookingType } from "../../types";
import { Wind, MapPin, Users, AlertCircle } from "lucide-react";

interface Props { onSave: (p: UserProfile) => void; }

const CONCERNS = [
  "Smog/Haze", "PM2.5", "PM10", "NO2", "Ozone (O3)", "VOCs",
  "Respiratory issues", "Children's health", "Elderly care", "Exercise outdoors",
];

export function ProfileSetup({ onSave }: Props) {
  const [form, setForm] = useState<UserProfile>({
    name: "",
    location: "",
    familySize: 2,
    hasChildren: false,
    hasElderly: false,
    lifestyle: "urban",
    commute: "car",
    homeType: "apartment",
    cookingType: "gas",
    currentConcerns: [],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const toggle = (concern: string) =>
    setForm((f) => ({
      ...f,
      currentConcerns: f.currentConcerns.includes(concern)
        ? f.currentConcerns.filter((c) => c !== concern)
        : [...f.currentConcerns, concern],
    }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.location.trim()) e.location = "City/location is required";
    if (form.familySize < 1) e.familySize = "At least 1 member required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) onSave({ ...form, name: form.name || undefined });
  };

  const labelStyle: React.CSSProperties = {
    display: "block", fontSize: "0.82rem", fontWeight: 600,
    color: "var(--text-2)", marginBottom: "0.4rem",
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--grad-hero-bg)", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem 1rem" }}>
      <div className="animate-fade-in" style={{ width: "100%", maxWidth: 640 }}>
        {/* Hero */}
        <div style={{ textAlign: "center", marginBottom: "1.75rem" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            width: 68, height: 68, borderRadius: "20px",
            background: "var(--grad-brand)", marginBottom: "1rem",
            boxShadow: "0 10px 28px rgba(14, 165, 233, 0.35)",
          }}>
            <Wind size={34} color="white" aria-hidden="true" />
          </div>
          <h1 style={{ fontSize: "2rem", fontWeight: 800, color: "var(--text)", marginBottom: "0.45rem" }}>
            Welcome to AirGuide
          </h1>
          <p style={{ color: "var(--text-2)", fontSize: "0.95rem", maxWidth: 460, margin: "0 auto" }}>
            Your GenAI-powered Urban Air Quality Assistant.<br />
            Tell us about yourself so we can personalize your advice.
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {/* Basic Info */}
            <section className="ag-card" aria-labelledby="basic-heading">
              <h2 id="basic-heading" style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "1rem", fontWeight: 700, color: "var(--sky-dark)", marginBottom: "1rem" }}>
                <MapPin size={18} aria-hidden="true" /> Basic Information
              </h2>
              <div className="ag-grid-2">
                <div>
                  <label htmlFor="name" style={labelStyle}>Your Name (optional)</label>
                  <input id="name" className="ag-input" placeholder="e.g. Priya" value={form.name ?? ""} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
                </div>
                <div>
                  <label htmlFor="location" style={labelStyle}>City / Location *</label>
                  <input
                    id="location"
                    required
                    aria-required="true"
                    aria-describedby={errors.location ? "loc-error" : undefined}
                    className="ag-input"
                    style={{ borderColor: errors.location ? "var(--unhealthy)" : undefined }}
                    placeholder="e.g. Delhi, Mumbai"
                    value={form.location}
                    onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                  />
                  {errors.location && <p id="loc-error" role="alert" style={{ color: "var(--error-text)", fontSize: "0.78rem", marginTop: "0.3rem", fontWeight: 500 }}>{errors.location}</p>}
                </div>
              </div>
            </section>

            {/* Family */}
            <section className="ag-card" aria-labelledby="family-heading">
              <h2 id="family-heading" style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "1rem", fontWeight: 700, color: "var(--sky-dark)", marginBottom: "1rem" }}>
                <Users size={18} aria-hidden="true" /> Family & Lifestyle
              </h2>
              <div className="ag-grid-2">
                <div>
                  <label htmlFor="familySize" style={labelStyle}>Family Size</label>
                  <input id="familySize" type="number" min={1} max={20} className="ag-input" value={form.familySize} onChange={(e) => setForm((f) => ({ ...f, familySize: parseInt(e.target.value) || 1 }))} />
                </div>
                <div>
                  <label htmlFor="lifestyle" style={labelStyle}>Area Type</label>
                  <select id="lifestyle" className="ag-input" value={form.lifestyle} onChange={(e) => setForm((f) => ({ ...f, lifestyle: e.target.value as LifestyleType }))}>
                    <option value="urban">Urban (City)</option>
                    <option value="suburban">Suburban</option>
                    <option value="rural">Rural</option>
                  </select>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.55rem", paddingTop: "0.25rem" }}>
                  <input type="checkbox" id="hasChildren" checked={form.hasChildren} onChange={(e) => setForm((f) => ({ ...f, hasChildren: e.target.checked }))} style={{ width: 17, height: 17, accentColor: "var(--sky)", cursor: "pointer" }} />
                  <label htmlFor="hasChildren" style={{ ...labelStyle, marginBottom: 0, cursor: "pointer" }}>👶 Has Children</label>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.55rem", paddingTop: "0.25rem" }}>
                  <input type="checkbox" id="hasElderly" checked={form.hasElderly} onChange={(e) => setForm((f) => ({ ...f, hasElderly: e.target.checked }))} style={{ width: 17, height: 17, accentColor: "var(--sky)", cursor: "pointer" }} />
                  <label htmlFor="hasElderly" style={{ ...labelStyle, marginBottom: 0, cursor: "pointer" }}>👴 Has Elderly</label>
                </div>
              </div>
            </section>

            {/* Home & Commute */}
            <section className="ag-card" aria-labelledby="home-heading">
              <h2 id="home-heading" style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "1rem", fontWeight: 700, color: "var(--sky-dark)", marginBottom: "1rem" }}>
                🏠 Home & Commute
              </h2>
              <div className="ag-grid-3">
                <div>
                  <label htmlFor="homeType" style={labelStyle}>Home Type</label>
                  <select id="homeType" className="ag-input" value={form.homeType} onChange={(e) => setForm((f) => ({ ...f, homeType: e.target.value as HomeType }))}>
                    <option value="apartment">Apartment</option>
                    <option value="house">House</option>
                    <option value="studio">Studio</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="cookingType" style={labelStyle}>Cooking Type</label>
                  <select id="cookingType" className="ag-input" value={form.cookingType} onChange={(e) => setForm((f) => ({ ...f, cookingType: e.target.value as CookingType }))}>
                    <option value="gas">Gas Stove</option>
                    <option value="electric">Electric</option>
                    <option value="induction">Induction</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="commute" style={labelStyle}>Daily Commute</label>
                  <select id="commute" className="ag-input" value={form.commute} onChange={(e) => setForm((f) => ({ ...f, commute: e.target.value as CommuteType }))}>
                    <option value="car">🚗 Car</option>
                    <option value="public_transport">🚌 Public Transport</option>
                    <option value="walking">🚶 Walking</option>
                    <option value="cycling">🚴 Cycling</option>
                    <option value="work_from_home">🏠 Work from Home</option>
                  </select>
                </div>
              </div>
            </section>

            {/* Concerns */}
            <section className="ag-card" aria-labelledby="concerns-heading">
              <h2 id="concerns-heading" style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "1rem", fontWeight: 700, color: "var(--sky-dark)", marginBottom: "0.5rem" }}>
                <AlertCircle size={18} aria-hidden="true" /> Your Air Quality Concerns
              </h2>
              <p style={{ fontSize: "0.82rem", color: "var(--text-3)", marginBottom: "0.85rem" }}>Select all that apply</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }} role="group" aria-labelledby="concerns-heading">
                {CONCERNS.map((c) => {
                  const selected = form.currentConcerns.includes(c);
                  return (
                    <button
                      key={c} type="button"
                      onClick={() => toggle(c)}
                      aria-pressed={selected}
                      style={{
                        padding: "0.4rem 0.9rem", borderRadius: "999px", fontSize: "0.82rem",
                        border: `1px solid ${selected ? "var(--sky)" : "var(--border)"}`,
                        background: selected ? "var(--sky-light)" : "var(--surface-2)",
                        color: selected ? "var(--sky-dark)" : "var(--text-2)",
                        fontWeight: selected ? 600 : 500,
                        cursor: "pointer", transition: "all 0.15s ease",
                      }}
                    >
                      {c}
                    </button>
                  );
                })}
              </div>
            </section>

            <button
              type="submit"
              className="ag-btn-primary"
              style={{ padding: "0.95rem 1.5rem", fontSize: "1rem", borderRadius: "14px", width: "100%" }}
            >
              🚀 Start My Air Quality Journey
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
