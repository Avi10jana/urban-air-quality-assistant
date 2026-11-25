import type { AppTab } from "../types";
import { LayoutDashboard, MessageSquare, CalendarClock, Leaf, Home } from "lucide-react";

interface Tab { id: AppTab; label: string; icon: React.ReactNode; }

const TABS: Tab[] = [
  { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={16} aria-hidden="true" /> },
  { id: "chat", label: "AI Chat", icon: <MessageSquare size={16} aria-hidden="true" /> },
  { id: "routines", label: "Routines", icon: <CalendarClock size={16} aria-hidden="true" /> },
  { id: "impact", label: "My Impact", icon: <Leaf size={16} aria-hidden="true" /> },
  { id: "indoor", label: "Indoor", icon: <Home size={16} aria-hidden="true" /> },
];

interface Props {
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
}

export function TabNav({ activeTab, onTabChange }: Props) {
  return (
    <nav
      role="navigation"
      aria-label="Main navigation"
      style={{
        background: "var(--surface)", borderBottom: "1px solid var(--border)",
        position: "sticky", top: 60, zIndex: 90,
        boxShadow: "var(--shadow)",
      }}
    >
      <div
        role="tablist"
        style={{ maxWidth: 1100, margin: "0 auto", display: "flex", overflowX: "auto", gap: "0.25rem", padding: "0 0.75rem" }}
      >
        {TABS.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              aria-controls={`panel-${tab.id}`}
              onClick={() => onTabChange(tab.id)}
              style={{
                display: "flex", alignItems: "center", gap: "0.4rem",
                padding: "0.75rem 1rem", border: "none", cursor: "pointer",
                background: "transparent", fontSize: "0.875rem", fontWeight: isActive ? 600 : 400,
                color: isActive ? "var(--sky-dark)" : "var(--text-2)",
                borderBottom: isActive ? "2px solid var(--sky)" : "2px solid transparent",
                transition: "all 0.15s", whiteSpace: "nowrap",
                marginBottom: "-1px",
              }}
              onMouseOver={(e) => { if (!isActive) e.currentTarget.style.color = "var(--sky)"; }}
              onMouseOut={(e) => { if (!isActive) e.currentTarget.style.color = "var(--text-2)"; }}
            >
              {tab.icon}
              {tab.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
