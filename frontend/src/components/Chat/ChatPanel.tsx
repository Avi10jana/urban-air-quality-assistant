import { useRef, useEffect, useState } from "react";
import type { UserProfile, AQIData } from "../../types";
import { useChat } from "../../hooks/useChat";
import { renderMarkdown } from "../../utils/markdown";
import { Send, Trash2, Bot, User } from "lucide-react";

interface Props {
  profile: Partial<UserProfile>;
  aqiData?: AQIData | null;
}

const QUICK_PROMPTS = [
  "What's today's air quality risk for my family?",
  "Give me a morning routine for high smog days",
  "What indoor plants help with PM2.5?",
  "How can I reduce my carbon footprint today?",
  "What N95 mask should I use?",
];

export function ChatPanel({ profile, aqiData }: Props) {
  const { messages, isLoading, error, sendMessage, clearChat } = useChat(
    profile as Partial<UserProfile>,
    aqiData ?? undefined
  );
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView?.({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    sendMessage(input.trim());
    setInput("");
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div
      id="panel-chat"
      role="tabpanel"
      aria-label="AI Chat"
      className="animate-fade-in"
      style={{
        display: "flex", flexDirection: "column",
        height: "calc(100vh - 190px)", minHeight: 460, maxHeight: 720,
        background: "var(--surface)", borderRadius: "var(--radius-lg)",
        border: "1px solid var(--border)", boxShadow: "var(--shadow-md)",
        overflow: "hidden",
      }}
    >
      {/* Chat Header */}
      <div style={{
        padding: "1rem 1.25rem", borderBottom: "1px solid var(--border)",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        background: "var(--info-bg)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.7rem" }}>
          <div style={{
            width: 38, height: 38, borderRadius: "12px",
            background: "var(--grad-brand)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 4px 12px rgba(14, 165, 233, 0.3)",
          }}>
            <Bot size={19} color="white" aria-hidden="true" />
          </div>
          <div>
            <div className="font-display" style={{ fontWeight: 700, fontSize: "0.98rem", color: "var(--text)" }}>AirGuide AI</div>
            <div style={{ fontSize: "0.75rem", color: "var(--sky-dark)", display: "flex", alignItems: "center", gap: "0.35rem", fontWeight: 500 }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--good)", display: "inline-block" }} aria-hidden="true" />
              Powered by Gemini · {profile.location ?? "Your Location"}
              {aqiData && ` · AQI ${aqiData.aqi}`}
            </div>
          </div>
        </div>
        <button
          onClick={clearChat}
          className="ag-btn-secondary"
          style={{ padding: "0.4rem 0.8rem", fontSize: "0.78rem" }}
          aria-label="Clear chat history"
        >
          <Trash2 size={13} aria-hidden="true" /> Clear
        </button>
      </div>

      {/* Quick prompts */}
      {messages.length <= 1 && (
        <div style={{ padding: "0.85rem 1.1rem", borderBottom: "1px solid var(--border)", background: "var(--surface-2)" }}>
          <p style={{ fontSize: "0.76rem", color: "var(--text-3)", marginBottom: "0.5rem", fontWeight: 500 }}>Quick questions:</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.45rem" }}>
            {QUICK_PROMPTS.map((p) => (
              <button
                key={p}
                onClick={() => { setInput(p); inputRef.current?.focus(); }}
                style={{
                  padding: "0.35rem 0.8rem", borderRadius: 999,
                  border: "1px solid var(--border)", background: "var(--surface)",
                  fontSize: "0.76rem", color: "var(--text-2)", cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
                onMouseOver={(e) => { e.currentTarget.style.borderColor = "var(--sky)"; e.currentTarget.style.color = "var(--sky-dark)"; e.currentTarget.style.background = "var(--sky-light)"; }}
                onMouseOut={(e) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text-2)"; e.currentTarget.style.background = "var(--surface)"; }}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      <div
        style={{ flex: 1, overflowY: "auto", padding: "1.1rem 1.25rem", display: "flex", flexDirection: "column", gap: "1rem" }}
        role="log"
        aria-live="polite"
        aria-label="Chat messages"
      >
        {messages.map((msg) => (
          <div
            key={msg.id}
            className="animate-fade-in"
            style={{ display: "flex", gap: "0.75rem", flexDirection: msg.role === "user" ? "row-reverse" : "row", alignItems: "flex-start" }}
          >
            <div
              aria-hidden="true"
              style={{
                width: 34, height: 34, borderRadius: "10px", flexShrink: 0,
                background: msg.role === "assistant" ? "var(--grad-brand)" : "linear-gradient(135deg, #6366f1, #8b5cf6)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              {msg.role === "assistant" ? <Bot size={16} color="white" aria-hidden="true" /> : <User size={16} color="white" aria-hidden="true" />}
            </div>
            <div style={{ maxWidth: "78%", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
              <div
                style={{
                  padding: "0.8rem 1.05rem",
                  borderRadius: msg.role === "user" ? "16px 4px 16px 16px" : "4px 16px 16px 16px",
                  background: msg.role === "user" ? "var(--grad-btn)" : "var(--surface-2)",
                  color: msg.role === "user" ? "#ffffff" : "var(--text)",
                  border: msg.role === "assistant" ? "1px solid var(--border)" : "none",
                  fontSize: "0.89rem", lineHeight: 1.65,
                  boxShadow: "var(--shadow)",
                }}
              >
                {msg.role === "assistant" ? (
                  <div
                    className={`prose${msg.isStreaming ? " streaming-cursor" : ""}`}
                    dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }}
                  />
                ) : (
                  <span>{msg.content}</span>
                )}
              </div>
              <span style={{ fontSize: "0.68rem", color: "var(--text-3)", textAlign: msg.role === "user" ? "right" : "left" }}>
                {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          </div>
        ))}

        {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
          <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
            <div style={{ width: 34, height: 34, borderRadius: "10px", background: "var(--grad-brand)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Bot size={16} color="white" aria-hidden="true" />
            </div>
            <div style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: "4px 16px 16px 16px", padding: "0.8rem 1.05rem", display: "flex", gap: "0.35rem", alignItems: "center" }} role="status" aria-label="AirGuide is thinking">
              {[0, 0.2, 0.4].map((d, i) => (
                <span key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--sky)", display: "inline-block", animation: `pulse 1.2s ${d}s ease-in-out infinite` }} aria-hidden="true" />
              ))}
            </div>
          </div>
        )}

        {error && (
          <div role="alert" style={{ padding: "0.65rem 1rem", background: "var(--error-bg)", borderRadius: 10, border: "1px solid var(--error-border)", fontSize: "0.82rem", color: "var(--error-text)" }}>
            ⚠️ {error}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ padding: "0.85rem 1.1rem", borderTop: "1px solid var(--border)", background: "var(--surface)", display: "flex", gap: "0.6rem", alignItems: "flex-end" }}>
        <label htmlFor="chat-input" className="sr-only">
          Type your air quality question
        </label>
        <textarea
          id="chat-input"
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about air quality, routines, indoor tips… (Enter to send)"
          rows={1}
          disabled={isLoading}
          aria-label="Type your message"
          className="ag-input"
          style={{
            flex: 1, resize: "none",
            lineHeight: 1.5, maxHeight: 110, overflowY: "auto",
          }}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || isLoading}
          className="ag-btn-primary"
          style={{ width: 44, height: 44, borderRadius: "12px", flexShrink: 0 }}
          aria-label="Send message"
        >
          <Send size={17} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
