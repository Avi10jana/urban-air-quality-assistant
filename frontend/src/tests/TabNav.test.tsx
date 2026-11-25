import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TabNav } from "../components/TabNav";

describe("TabNav", () => {
  const mockChange = vi.fn();

  it("renders all 5 tabs", () => {
    render(<TabNav activeTab="dashboard" onTabChange={mockChange} />);
    expect(screen.getByRole("tab", { name: /dashboard/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /ai chat/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /routines/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /my impact/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /indoor/i })).toBeInTheDocument();
  });

  it("marks active tab as selected", () => {
    render(<TabNav activeTab="chat" onTabChange={mockChange} />);
    expect(screen.getByRole("tab", { name: /ai chat/i })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: /dashboard/i })).toHaveAttribute("aria-selected", "false");
  });

  it("calls onTabChange with correct tab id on click", async () => {
    const user = userEvent.setup();
    render(<TabNav activeTab="dashboard" onTabChange={mockChange} />);
    await user.click(screen.getByRole("tab", { name: /routines/i }));
    expect(mockChange).toHaveBeenCalledWith("routines");
  });
});
