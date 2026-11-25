import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProfileSetup } from "../components/Profile/ProfileSetup";

describe("ProfileSetup", () => {
  const mockOnSave = vi.fn();

  beforeEach(() => mockOnSave.mockClear());

  it("renders the welcome heading", () => {
    render(<ProfileSetup onSave={mockOnSave} />);
    expect(screen.getByText(/Welcome to AirGuide/i)).toBeInTheDocument();
  });

  it("renders all required form fields", () => {
    render(<ProfileSetup onSave={mockOnSave} />);
    expect(screen.getByLabelText(/city/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/family size/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/home type/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/cooking type/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/daily commute/i)).toBeInTheDocument();
  });

  it("shows validation error when location is empty", async () => {
    const user = userEvent.setup();
    render(<ProfileSetup onSave={mockOnSave} />);
    const submitBtn = screen.getByRole("button", { name: /start my air quality journey/i });
    await user.click(submitBtn);
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(mockOnSave).not.toHaveBeenCalled();
  });

  it("calls onSave with valid data", async () => {
    const user = userEvent.setup();
    render(<ProfileSetup onSave={mockOnSave} />);
    const locationInput = screen.getByLabelText(/city/i);
    await user.type(locationInput, "Delhi");
    const submitBtn = screen.getByRole("button", { name: /start my air quality journey/i });
    await user.click(submitBtn);
    expect(mockOnSave).toHaveBeenCalledWith(
      expect.objectContaining({ location: "Delhi" })
    );
  });

  it("toggles concern chips correctly", async () => {
    const user = userEvent.setup();
    render(<ProfileSetup onSave={mockOnSave} />);
    const smogBtn = screen.getByRole("button", { name: "Smog/Haze" });
    expect(smogBtn).toHaveAttribute("aria-pressed", "false");
    await user.click(smogBtn);
    expect(smogBtn).toHaveAttribute("aria-pressed", "true");
    await user.click(smogBtn);
    expect(smogBtn).toHaveAttribute("aria-pressed", "false");
  });

  it("renders the submit button prominently", () => {
    render(<ProfileSetup onSave={mockOnSave} />);
    const btn = screen.getByRole("button", { name: /start my air quality journey/i });
    expect(btn).toBeVisible();
    expect(btn).toHaveAttribute("type", "submit");
  });
});
