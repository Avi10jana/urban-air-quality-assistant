import { describe, it, expect } from "vitest";
import { escapeHtml, renderMarkdown } from "../utils/markdown";

describe("markdown utils", () => {
  it("escapes HTML special characters to prevent XSS", () => {
    const escaped = escapeHtml(`<script>alert("xss")</script> & 'test'`);
    expect(escaped).not.toContain("<script>");
    expect(escaped).toContain("&lt;script&gt;");
    expect(escaped).toContain("&amp;");
    expect(escaped).toContain("&quot;");
    expect(escaped).toContain("&#39;");
  });

  it("renders safe markdown tokens after escaping HTML", () => {
    const html = renderMarkdown("## Advice\n- Wear **N95** *mask* and use `HEPA` <img src=x onerror=alert(1)>");
    expect(html).toContain("<h2>Advice</h2>");
    expect(html).toContain("<strong>N95</strong>");
    expect(html).toContain("<em>mask</em>");
    expect(html).toContain("<code>HEPA</code>");
    expect(html).not.toContain("<img");
    expect(html).toContain("&lt;img");
  });
});
