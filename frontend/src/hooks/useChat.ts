import { useState, useCallback, useRef } from "react";
import type { ChatMessage, UserProfile, AQIData } from "../types";
import { streamChat } from "../services/api";

function generateId() {
  return `msg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function useChat(profile?: Partial<UserProfile>, aqiData?: Partial<AQIData>) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: generateId(),
      role: "assistant",
      content: `👋 Hi! I'm **AirGuide**, your personal urban air quality assistant.

I can help you:
- 🌬️ Understand today's air quality in your city
- 🏃 Plan low-emission daily routines
- 🏠 Improve your indoor air quality
- 🌱 Discover sustainable alternatives
- 💚 Understand the health impact of your choices

**What would you like to know today?** You can ask things like:
- *"What should my family do today given the AQI?"*
- *"How can I reduce PM2.5 exposure for my kids?"*
- *"Give me indoor air quality tips for my gas-cooking apartment"*`,
      timestamp: new Date(),
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const interactionIdRef = useRef<string | undefined>(undefined);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isLoading) return;
      setError(null);

      const userMsg: ChatMessage = {
        id: generateId(),
        role: "user",
        content: content.trim(),
        timestamp: new Date(),
      };

      const assistantMsgId = generateId();
      const assistantMsg: ChatMessage = {
        id: assistantMsgId,
        role: "assistant",
        content: "",
        timestamp: new Date(),
        isStreaming: true,
      };

      setMessages((prev) => [...prev, userMsg, assistantMsg]);
      setIsLoading(true);

      try {
        const stream = streamChat(
          content.trim(),
          interactionIdRef.current,
          profile,
          aqiData
        );

        for await (const chunk of stream) {
          if (chunk.type === "delta" && chunk.text) {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantMsgId
                  ? { ...m, content: m.content + chunk.text }
                  : m
              )
            );
          } else if (chunk.type === "done") {
            if (chunk.interactionId) {
              interactionIdRef.current = chunk.interactionId;
            }
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantMsgId ? { ...m, isStreaming: false } : m
              )
            );
          } else if (chunk.type === "error") {
            setError(chunk.text ?? "An error occurred");
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantMsgId
                  ? { ...m, content: "⚠️ Sorry, I encountered an error. Please try again.", isStreaming: false }
                  : m
              )
            );
          }
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to send message";
        setError(msg);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId
              ? { ...m, content: "⚠️ Connection failed. Please check your API key and try again.", isStreaming: false }
              : m
          )
        );
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, profile, aqiData]
  );

  const clearChat = useCallback(() => {
    interactionIdRef.current = undefined;
    setMessages([{
      id: generateId(),
      role: "assistant",
      content: "Chat cleared! How can I help you with air quality today? 🌬️",
      timestamp: new Date(),
    }]);
    setError(null);
  }, []);

  return { messages, isLoading, error, sendMessage, clearChat };
}
