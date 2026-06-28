# Crawlio Browser Agent

**Connect AI to your browser.** Navigate, click, screenshot, inspect network traffic, and extract structured data — exposed to any MCP client (Claude, Cursor, VS Code, Windsurf, and more).

> ℹ️ **This repository hosts distribution and documentation only.**
> Crawlio Browser Agent is **proprietary software**. The source code is not
> published here; releases are **signed, compiled binaries**. See [`LICENSE`](./LICENSE).

## Install

```bash
# npm (recommended — works with any MCP client)
npx -y crawlio-browser init

# Claude Code
claude mcp add crawlio-browser -- npx -y crawlio-browser

# or one-line installer (macOS)
curl -fsSL https://get.crawlio.app/agent | sh
```

Add to an MCP client config:

```json
{ "mcpServers": { "crawlio-browser": { "command": "npx", "args": ["-y", "crawlio-browser"] } } }
```

## Chrome extension

Install **Crawlio for Chrome** from the Chrome Web Store:
https://www.crawlio.app/browser-agent

## Tiers

| Tier | Price | Includes |
|------|-------|----------|
| Free | $0 | Visible-browser (extension) agent, core tools |
| Core | $59 (one-time) | + headless engine, session vault, basic intelligence |
| Pro | $149 (one-time) | + interceptor, full on-device intelligence |

Pricing: https://crawlio.app/pricing

## Links

- Homepage: https://www.crawlio.app/browser-agent
- Issues / support: https://github.com/Crawlio-app/crawlio-browser-agent/issues

## License

Proprietary — © 2026 Crawlio. All rights reserved. See [`LICENSE`](./LICENSE).
