import { useRef, useEffect, useState } from "react";
import type { UserProfile, AQIData } from "../../types";
import { useChat } from "../../hooks/useChat";
import { Send, Trash2, Bot, User } from "lucide-react";

interface Props {
  profile: Partial<UserProfile>;
  aqiData?: AQIData | null;
}

function renderMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`(.+?)`/g, "<code>$1</code>")
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    .replace(/^- (.+)$/gm, "<li>$1</li>")
    .replace(/(<li>.*<\/li>\n?)+/g, (m) => `<ul>${m}</ul>`)
    .replace(/\n\n/g, "</p><p>")
    .replace(/^(?!<[hul])/gm, "")
    .trim();
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
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
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
      style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 180px)", maxHeight: 700, background: "var(--surface)", borderRadius: 16, border: "1px solid var(--border)", boxShadow: "var(--shadow-md)", overflow: "hidden" }}
    >
      {/* Chat Header */}
      <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "linear-gradient(135deg, #f0f9ff, #e0f2fe)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg, #0ea5e9, #0284c7)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Bot size={18} color="white" aria-hidden="true" />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: "0.95rem" }}>AirGuide AI</div>
            <div style={{ fontSize: "0.73rem", color: "var(--sky-dark)", display: "flex", alignItems: "center", gap: "0.3rem" }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", display: "inline-block" }} aria-hidden="true" />
              Powered by Gemini · {profile.location ?? "Your Location"}
              {aqiData && ` · AQI ${aqiData.aqi}`}
            </div>
          </div>
        </div>
        <button
          onClick={clearChat}
          style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.4rem 0.8rem", border: "1px solid var(--border)", borderRadius: 8, background: "var(--surface)", cursor: "pointer", fontSize: "0.78rem", color: "var(--text-3)" }}
          aria-label="Clear chat history"
        >
          <Trash2 size={13} aria-hidden="true" /> Clear
        </button>
      </div>

      {/* Quick prompts */}
      {messages.length <= 1 && (
        <div style={{ padding: "0.75rem 1rem", borderBottom: "1px solid var(--border)", background: "#f8fafc" }}>
          <p style={{ fontSize: "0.75rem", color: "var(--text-3)", marginBottom: "0.5rem" }}>Quick questions:</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
            {QUICK_PROMPTS.map((p) => (
              <button
                key={p}
                onClick={() => { setInput(p); inputRef.current?.focus(); }}
                style={{ padding: "0.3rem 0.7rem", borderRadius: 999, border: "1px solid var(--border)", background: "white", fontSize: "0.75rem", color: "var(--text-2)", cursor: "pointer", transition: "all 0.15s" }}
                onMouseOver={(e) => { e.currentTarget.style.borderColor = "var(--sky)"; e.currentTarget.style.color = "var(--sky-dark)"; }}
                onMouseOut={(e) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text-2)"; }}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      <div
        style={{ flex: 1, overflowY: "auto", padding: "1rem 1.25rem", display: "flex", flexDirection: "column", gap: "1rem" }}
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
                width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
                background: msg.role === "assistant" ? "linear-gradient(135deg, #0ea5e9, #0284c7)" : "linear-gradient(135deg, #64748b, #475569)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              {msg.role === "assistant" ? <Bot size={15} color="white" aria-hidden="true" /> : <User size={15} color="white" aria-hidden="true" />}
            </div>
            <div style={{ maxWidth: "75%", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
              <div
                style={{
                  padding: "0.75rem 1rem", borderRadius: msg.role === "user" ? "16px 4px 16px 16px" : "4px 16px 16px 16px",
                  background: msg.role === "user" ? "linear-gradient(135deg, #0ea5e9, #0284c7)" : "var(--surface-2)",
                  color: msg.role === "user" ? "white" : "var(--text)",
                  border: msg.role === "assistant" ? "1px solid var(--border)" : "none",
                  fontSize: "0.88rem", lineHeight: 1.65,
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
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg, #0ea5e9, #0284c7)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Bot size={15} color="white" aria-hidden="true" />
            </div>
            <div style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: "4px 16px 16px 16px", padding: "0.75rem 1rem", display: "flex", gap: "0.3rem", alignItems: "center" }} role="status" aria-label="AirGuide is thinking">
              {[0, 0.2, 0.4].map((d, i) => (
                <span key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--sky)", display: "inline-block", animation: `pulse 1.2s ${d}s ease-in-out infinite` }} aria-hidden="true" />
              ))}
            </div>
          </div>
        )}

        {error && (
          <div role="alert" style={{ padding: "0.6rem 1rem", background: "#fef2f2", borderRadius: 8, border: "1px solid #fecaca", fontSize: "0.8rem", color: "#dc2626" }}>
            ⚠️ {error}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ padding: "0.75rem 1rem", borderTop: "1px solid var(--border)", background: "var(--surface)", display: "flex", gap: "0.5rem", alignItems: "flex-end" }}>
        <label htmlFor="chat-input" className="sr-only" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden" }}>
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
          style={{
            flex: 1, resize: "none", border: "1px solid var(--border)", borderRadius: 10,
            padding: "0.65rem 0.9rem", fontSize: "0.88rem", fontFamily: "inherit",
            background: isLoading ? "var(--surface-2)" : "var(--surface)",
            outline: "none", lineHeight: 1.5, maxHeight: 100, overflowY: "auto",
            transition: "border-color 0.2s",
          }}
          onFocus={(e) => (e.target.style.borderColor = "var(--sky)")}
          onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || isLoading}
          style={{
            width: 42, height: 42, borderRadius: 10, border: "none",
            background: !input.trim() || isLoading ? "var(--border)" : "linear-gradient(135deg, #0ea5e9, #0284c7)",
            color: "white", cursor: !input.trim() || isLoading ? "not-allowed" : "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "background 0.2s",
            flexShrink: 0,
          }}
          aria-label="Send message"
        >
          <Send size={17} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
