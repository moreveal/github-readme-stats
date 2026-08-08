export default {
  async fetch() {
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
        }
      );

      if (!response.ok) {
        return new Response(`GitHub API error: ${response.status}`, {
          status: 500,
        });
      }

      const repos = await response.json();

      const total = repos.length;
      const privateCount = repos.filter((repo) => repo.private).length;
      const publicCount = total - privateCount;
      const forks = repos.filter((repo) => repo.fork).length;
      const archived = repos.filter((repo) => repo.archived).length;

      const svg = `
<svg width="495" height="155" viewBox="0 0 495 155"
     xmlns="http://www.w3.org/2000/svg">

  <style>
    .header {
      font: 600 18px 'Segoe UI', Ubuntu, Sans-Serif;
      fill: #70a5fd;
    }

    .label {
      font: 400 14px 'Segoe UI', Ubuntu, Sans-Serif;
      fill: #a9b1d6;
    }

    .value {
      font: 600 16px 'Segoe UI', Ubuntu, Sans-Serif;
      fill: #bf91f3;
    }

    .sub {
      font: 400 12px 'Segoe UI', Ubuntu, Sans-Serif;
      fill: #737aa2;
    }
  </style>

  <rect
    x="0.5"
    y="0.5"
    width="494"
    height="154"
    rx="6"
    fill="#1a1b27"
    stroke="#30363d"
  />

  <text x="25" y="35" class="header">
    Repository Overview
  </text>

  <text x="25" y="75" class="value">${total}</text>
  <text x="25" y="96" class="label">Total</text>

  <text x="135" y="75" class="value">${publicCount}</text>
  <text x="135" y="96" class="label">Public</text>

  <text x="245" y="75" class="value">${privateCount}</text>
  <text x="245" y="96" class="label">Private 🔒</text>

  <text x="365" y="75" class="value">${forks}</text>
  <text x="365" y="96" class="label">Forks</text>

  <text x="25" y="130" class="sub">
    ${archived} archived repositories
  </text>

</svg>`;

      return new Response(svg, {
        headers: {
          "Content-Type": "image/svg+xml; charset=utf-8",
          "Cache-Control": "public, max-age=3600, s-maxage=3600",
        },
      });
    } catch (error) {
      return new Response("Internal error", { status: 500 });
    }
  },
};
