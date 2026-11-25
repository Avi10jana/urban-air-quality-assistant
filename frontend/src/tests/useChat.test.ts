import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useChat } from "../hooks/useChat";
import * as api from "../services/api";

describe("useChat hook", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("initializes with welcome message and non-loading state", () => {
    const { result } = renderHook(() => useChat());
    expect(result.current.messages).toHaveLength(1);
    expect(result.current.messages[0].role).toBe("assistant");
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("ignores empty or whitespace-only messages", async () => {
    const { result } = renderHook(() => useChat());
    await act(async () => {
      await result.current.sendMessage("   ");
    });
    expect(result.current.messages).toHaveLength(1);
  });

  it("streams assistant response chunks and finalizes message", async () => {
    vi.spyOn(api, "streamChat").mockImplementation(async function* () {
      yield { type: "delta", text: "Keep windows " };
      yield { type: "delta", text: "closed today." };
      yield { type: "done", interactionId: "int_123" };
    });

    const { result } = renderHook(() => useChat({ location: "Delhi" }));
    await act(async () => {
      await result.current.sendMessage("What should I do?");
    });

    expect(result.current.messages).toHaveLength(3);
    expect(result.current.messages[1].role).toBe("user");
    expect(result.current.messages[1].content).toBe("What should I do?");
    expect(result.current.messages[2].role).toBe("assistant");
    expect(result.current.messages[2].content).toBe("Keep windows closed today.");
    expect(result.current.messages[2].isStreaming).toBe(false);
    expect(result.current.isLoading).toBe(false);
  });

  it("handles stream error chunk gracefully", async () => {
    vi.spyOn(api, "streamChat").mockImplementation(async function* () {
      yield { type: "error", text: "API quota exceeded" };
    });

    const { result } = renderHook(() => useChat());
    await act(async () => {
      await result.current.sendMessage("Help");
    });

    expect(result.current.error).toBe("API quota exceeded");
    expect(result.current.messages[2].content).toContain("encountered an error");
  });

  it("clears chat history and resets error", async () => {
    vi.spyOn(api, "streamChat").mockImplementation(async function* () {
      yield { type: "error", text: "Failed" };
    });

    const { result } = renderHook(() => useChat());
    await act(async () => {
      await result.current.sendMessage("Help");
    });
    expect(result.current.messages.length).toBeGreaterThan(1);

    act(() => {
      result.current.clearChat();
    });

    expect(result.current.messages).toHaveLength(1);
    expect(result.current.error).toBeNull();
  });
});
