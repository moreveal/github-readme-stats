/** @jest-environment node */

import { afterEach, describe, expect, it, jest } from "@jest/globals";
import reposApi, { renderRepositoryOverview } from "../api/repos.js";

const stats = {
  total: 12,
  publicCount: 8,
  privateCount: 4,
  forks: 3,
  archived: 2,
};

describe("Repository overview API", () => {
  const originalToken = process.env.PAT_1;
  const originalFetch = global.fetch;

  afterEach(() => {
    process.env.PAT_1 = originalToken;
    global.fetch = originalFetch;
  });

  it("renders shared card style options", () => {
    const svg = renderRepositoryOverview(stats, {
      theme: "tokyonight",
      hide_border: true,
      border_radius: 9,
    });

    expect(svg).toContain("fill: #70a5fd");
    expect(svg).toContain("fill: #38bdae");
    expect(svg).toContain("fill: #bf91f3");
    expect(svg).toContain('fill="#1a1b27"');
    expect(svg).toContain('rx="9"');
    expect(svg).toContain('stroke-opacity="0"');
  });

  it("preserves the existing default appearance", () => {
    const svg = renderRepositoryOverview(stats);

    expect(svg).toContain("fill: #70a5fd");
    expect(svg).toContain("fill: #a9b1d6");
    expect(svg).toContain("fill: #bf91f3");
    expect(svg).toContain('fill="#1a1b27"');
    expect(svg).toContain('stroke="#30363d"');
    expect(svg).toContain('rx="6"');
  });

  it("reads style options from the request query", async () => {
    process.env.PAT_1 = "test-token";
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => [
        { private: false, fork: false, archived: false },
        { private: true, fork: true, archived: true },
      ],
    });

    const response = await reposApi.fetch(
      new Request(
        "https://example.com/api/repos?theme=tokyonight&hide_border=true&border_radius=8",
      ),
    );
    const svg = await response.text();

    expect(response.status).toBe(200);
    expect(svg).toContain("fill: #70a5fd");
    expect(svg).toContain('rx="8"');
    expect(svg).toContain('stroke-opacity="0"');
    expect(svg).toContain('<text x="25" y="20" class="value">2</text>');
  });
});
