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

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "0.6rem 0.9rem", border: "1px solid var(--border)",
    borderRadius: 8, fontSize: "0.9rem", background: "var(--surface)", color: "var(--text)",
    transition: "border-color 0.2s", outline: "none",
  };

  const labelStyle: React.CSSProperties = {
    display: "block", fontSize: "0.82rem", fontWeight: 600,
    color: "var(--text-2)", marginBottom: "0.4rem",
  };

  const sectionStyle: React.CSSProperties = {
    background: "var(--surface)", borderRadius: 12, padding: "1.25rem",
    border: "1px solid var(--border)", boxShadow: "var(--shadow)",
  };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #e0f2fe 0%, #bae6fd 50%, #e0f2fe 100%)", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem 1rem" }}>
      <div style={{ width: "100%", maxWidth: 600, animationName: "fadeIn", animationDuration: "0.5s" }}>
        {/* Hero */}
        <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
          <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 64, height: 64, borderRadius: "50%", background: "linear-gradient(135deg, #0ea5e9, #0284c7)", marginBottom: "1rem", boxShadow: "0 4px 14px rgba(14,165,233,.4)" }}>
            <Wind size={32} color="white" aria-hidden="true" />
          </div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "#0c4a6e", marginBottom: "0.4rem" }}>
            Welcome to AirGuide
          </h1>
          <p style={{ color: "#0369a1", fontSize: "0.95rem" }}>
            Your GenAI-powered Urban Air Quality Assistant.<br />
            Tell us about yourself so we can personalize your advice.
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {/* Basic Info */}
            <section style={sectionStyle} aria-labelledby="basic-heading">
              <h2 id="basic-heading" style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "1rem", fontWeight: 600, color: "var(--sky-dark)", marginBottom: "1rem" }}>
                <MapPin size={18} aria-hidden="true" /> Basic Information
              </h2>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <div>
                  <label htmlFor="name" style={labelStyle}>Your Name (optional)</label>
                  <input id="name" style={inputStyle} placeholder="e.g. Priya" value={form.name ?? ""} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} onFocus={(e) => (e.target.style.borderColor = "var(--sky)")} onBlur={(e) => (e.target.style.borderColor = "var(--border)")} />
                </div>
                <div>
                  <label htmlFor="location" style={labelStyle}>City / Location *</label>
                  <input id="location" required aria-required="true" aria-describedby={errors.location ? "loc-error" : undefined} style={{ ...inputStyle, borderColor: errors.location ? "#ef4444" : "var(--border)" }} placeholder="e.g. Delhi, Mumbai" value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} onFocus={(e) => (e.target.style.borderColor = errors.location ? "#ef4444" : "var(--sky)")} onBlur={(e) => (e.target.style.borderColor = errors.location ? "#ef4444" : "var(--border)")} />
                  {errors.location && <p id="loc-error" role="alert" style={{ color: "#ef4444", fontSize: "0.75rem", marginTop: "0.25rem" }}>{errors.location}</p>}
                </div>
              </div>
            </section>

            {/* Family */}
            <section style={sectionStyle} aria-labelledby="family-heading">
              <h2 id="family-heading" style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "1rem", fontWeight: 600, color: "var(--sky-dark)", marginBottom: "1rem" }}>
                <Users size={18} aria-hidden="true" /> Family & Lifestyle
              </h2>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <div>
                  <label htmlFor="familySize" style={labelStyle}>Family Size</label>
                  <input id="familySize" type="number" min={1} max={20} style={inputStyle} value={form.familySize} onChange={(e) => setForm((f) => ({ ...f, familySize: parseInt(e.target.value) || 1 }))} onFocus={(e) => (e.target.style.borderColor = "var(--sky)")} onBlur={(e) => (e.target.style.borderColor = "var(--border)")} />
                </div>
                <div>
                  <label htmlFor="lifestyle" style={labelStyle}>Area Type</label>
                  <select id="lifestyle" style={inputStyle} value={form.lifestyle} onChange={(e) => setForm((f) => ({ ...f, lifestyle: e.target.value as LifestyleType }))} onFocus={(e) => (e.target.style.borderColor = "var(--sky)")} onBlur={(e) => (e.target.style.borderColor = "var(--border)")}>
                    <option value="urban">Urban (City)</option>
                    <option value="suburban">Suburban</option>
                    <option value="rural">Rural</option>
                  </select>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <input type="checkbox" id="hasChildren" checked={form.hasChildren} onChange={(e) => setForm((f) => ({ ...f, hasChildren: e.target.checked }))} style={{ width: 16, height: 16, accentColor: "var(--sky)", cursor: "pointer" }} />
                  <label htmlFor="hasChildren" style={{ ...labelStyle, marginBottom: 0, cursor: "pointer" }}>👶 Has Children</label>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <input type="checkbox" id="hasElderly" checked={form.hasElderly} onChange={(e) => setForm((f) => ({ ...f, hasElderly: e.target.checked }))} style={{ width: 16, height: 16, accentColor: "var(--sky)", cursor: "pointer" }} />
                  <label htmlFor="hasElderly" style={{ ...labelStyle, marginBottom: 0, cursor: "pointer" }}>👴 Has Elderly</label>
                </div>
              </div>
            </section>

            {/* Home & Commute */}
            <section style={sectionStyle} aria-labelledby="home-heading">
              <h2 id="home-heading" style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "1rem", fontWeight: 600, color: "var(--sky-dark)", marginBottom: "1rem" }}>
                🏠 Home & Commute
              </h2>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem" }}>
                <div>
                  <label htmlFor="homeType" style={labelStyle}>Home Type</label>
                  <select id="homeType" style={inputStyle} value={form.homeType} onChange={(e) => setForm((f) => ({ ...f, homeType: e.target.value as HomeType }))} onFocus={(e) => (e.target.style.borderColor = "var(--sky)")} onBlur={(e) => (e.target.style.borderColor = "var(--border)")}>
                    <option value="apartment">Apartment</option>
                    <option value="house">House</option>
                    <option value="studio">Studio</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="cookingType" style={labelStyle}>Cooking Type</label>
                  <select id="cookingType" style={inputStyle} value={form.cookingType} onChange={(e) => setForm((f) => ({ ...f, cookingType: e.target.value as CookingType }))} onFocus={(e) => (e.target.style.borderColor = "var(--sky)")} onBlur={(e) => (e.target.style.borderColor = "var(--border)")}>
                    <option value="gas">Gas Stove</option>
                    <option value="electric">Electric</option>
                    <option value="induction">Induction</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="commute" style={labelStyle}>Daily Commute</label>
                  <select id="commute" style={inputStyle} value={form.commute} onChange={(e) => setForm((f) => ({ ...f, commute: e.target.value as CommuteType }))} onFocus={(e) => (e.target.style.borderColor = "var(--sky)")} onBlur={(e) => (e.target.style.borderColor = "var(--border)")}>
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
            <section style={sectionStyle} aria-labelledby="concerns-heading">
              <h2 id="concerns-heading" style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "1rem", fontWeight: 600, color: "var(--sky-dark)", marginBottom: "0.75rem" }}>
                <AlertCircle size={18} aria-hidden="true" /> Your Air Quality Concerns
              </h2>
              <p style={{ fontSize: "0.8rem", color: "var(--text-3)", marginBottom: "0.75rem" }}>Select all that apply</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }} role="group" aria-labelledby="concerns-heading">
                {CONCERNS.map((c) => {
                  const selected = form.currentConcerns.includes(c);
                  return (
                    <button
                      key={c} type="button"
                      onClick={() => toggle(c)}
                      aria-pressed={selected}
                      style={{
                        padding: "0.35rem 0.8rem", borderRadius: "999px", fontSize: "0.8rem",
                        border: `1px solid ${selected ? "var(--sky)" : "var(--border)"}`,
                        background: selected ? "var(--sky-light)" : "transparent",
                        color: selected ? "var(--sky-dark)" : "var(--text-2)",
                        fontWeight: selected ? 600 : 400,
                        cursor: "pointer", transition: "all 0.15s",
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
              style={{
                background: "linear-gradient(135deg, #0ea5e9, #0284c7)", color: "white",
                border: "none", borderRadius: 12, padding: "0.9rem",
                fontSize: "1rem", fontWeight: 600, cursor: "pointer",
                boxShadow: "0 4px 14px rgba(14,165,233,.4)",
                transition: "transform 0.15s, box-shadow 0.15s",
              }}
              onMouseOver={(e) => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 6px 18px rgba(14,165,233,.5)"; }}
              onMouseOut={(e) => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 4px 14px rgba(14,165,233,.4)"; }}
            >
              🚀 Start My Air Quality Journey
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
