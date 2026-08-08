// @ts-check

import { Card } from "../src/common/Card.js";
import { getCardColors } from "../src/common/color.js";
import { parseBoolean } from "../src/common/ops.js";
import { themes } from "../themes/index.js";

/**
 * Render the repository overview card.
 *
 * @param {{ total: number, publicCount: number, privateCount: number, forks: number, archived: number }} stats Repository statistics.
 * @param {{ theme?: string, title_color?: string, text_color?: string, icon_color?: string, bg_color?: string, border_color?: string, hide_border?: boolean, border_radius?: number }} options Card style options.
 * @returns {string} Rendered SVG.
 */
const renderRepositoryOverview = (stats, options = {}) => {
  const {
    theme,
    title_color,
    text_color,
    icon_color,
    bg_color,
    border_color,
    hide_border = false,
    border_radius,
  } = options;
  const selectedTheme =
    theme && Object.prototype.hasOwnProperty.call(themes, theme)
      ? theme
      : undefined;
  const legacyColors = selectedTheme
    ? {}
    : {
        title_color: "70a5fd",
        text_color: "a9b1d6",
        icon_color: "bf91f3",
        bg_color: "1a1b27",
        border_color: "30363d",
      };
  const colors = getCardColors({
    theme: selectedTheme,
    title_color: title_color ?? legacyColors.title_color,
    text_color: text_color ?? legacyColors.text_color,
    icon_color: icon_color ?? legacyColors.icon_color,
    bg_color: bg_color ?? legacyColors.bg_color,
    border_color: border_color ?? legacyColors.border_color,
  });
  const card = new Card({
    width: 495,
    height: 155,
    border_radius: border_radius ?? 6,
    defaultTitle: "Repository Overview",
    colors,
  });

  card.setHideBorder(hide_border);
  card.setAccessibilityLabel({
    title: "Repository Overview",
    desc: `${stats.total} total repositories, ${stats.publicCount} public, ${stats.privateCount} private, ${stats.forks} forks, and ${stats.archived} archived`,
  });
  card.setCSS(`
    .label {
      font: 400 14px 'Segoe UI', Ubuntu, Sans-Serif;
      fill: ${colors.textColor};
    }
    .value {
      font: 600 16px 'Segoe UI', Ubuntu, Sans-Serif;
      fill: ${colors.iconColor};
    }
    .sub {
      font: 400 12px 'Segoe UI', Ubuntu, Sans-Serif;
      fill: ${colors.textColor};
      opacity: 0.7;
    }
  `);

  return card.render(`
    <text x="25" y="20" class="value">${stats.total}</text>
    <text x="25" y="41" class="label">Total</text>

    <text x="135" y="20" class="value">${stats.publicCount}</text>
    <text x="135" y="41" class="label">Public</text>

    <text x="245" y="20" class="value">${stats.privateCount}</text>
    <text x="245" y="41" class="label">Private 🔒</text>

    <text x="365" y="20" class="value">${stats.forks}</text>
    <text x="365" y="41" class="label">Forks</text>

    <text x="25" y="75" class="sub">${stats.archived} archived repositories</text>
  `);
};

/**
 * @param {string | null} value Border radius query value.
 * @returns {number | undefined} Parsed border radius.
 */
const parseBorderRadius = (value) => {
  const radius = value === null ? Number.NaN : Number.parseFloat(value);
  return Number.isFinite(radius) ? radius : undefined;
};

export default {
  /**
   * @param {Request} request Incoming request.
   * @returns {Promise<Response>} SVG response.
   */
  async fetch(request) {
    try {
      const token = process.env.PAT_1;

      if (!token) {
        return new Response("PAT_1 is missing", { status: 500 });
      }

      const response = await fetch(
        "https://api.github.com/user/repos?visibility=all&affiliation=owner&per_page=100",
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
            "User-Agent": "moreveal-repo-stats",
          },
        },
      );

      if (!response.ok) {
        return new Response(`GitHub API error: ${response.status}`, {
          status: 500,
        });
      }

      const repos = await response.json();
      const params = new URL(request.url).searchParams;
      const total = repos.length;
      const privateCount = repos.filter((repo) => repo.private).length;
      const svg = renderRepositoryOverview(
        {
          total,
          privateCount,
          publicCount: total - privateCount,
          forks: repos.filter((repo) => repo.fork).length,
          archived: repos.filter((repo) => repo.archived).length,
        },
        {
          theme: params.get("theme") ?? undefined,
          title_color: params.get("title_color") ?? undefined,
          text_color: params.get("text_color") ?? undefined,
          icon_color: params.get("icon_color") ?? undefined,
          bg_color: params.get("bg_color") ?? undefined,
          border_color: params.get("border_color") ?? undefined,
          hide_border: parseBoolean(params.get("hide_border") ?? undefined),
          border_radius: parseBorderRadius(params.get("border_radius")),
        },
      );

      return new Response(svg, {
        headers: {
          "Content-Type": "image/svg+xml; charset=utf-8",
          "Cache-Control": "public, max-age=3600, s-maxage=3600",
        },
      });
    } catch {
      return new Response("Internal error", { status: 500 });
    }
  },
};

export { renderRepositoryOverview };
