# Contributing to Crawlio Agent

Thank you for your interest in contributing to Crawlio Agent! This document provides guidelines and information for contributors.

## How to Contribute

### Choose an Issue

Before writing code, check [existing issues](https://github.com/Crawlio-app/crawlio-browser-agent/issues) or create a new one to discuss the change. This helps avoid duplicate work and ensures alignment.

Look for issues labeled [`good-first-issue`](https://github.com/Crawlio-app/crawlio-browser-agent/labels/good-first-issue) if you're new to the project.

### Make a Change

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/<your-username>/crawlio-browser-agent.git
   cd crawlio-browser-agent
   ```
3. Install dependencies:
   ```bash
   npm ci
   ```
4. Create a branch:
   ```bash
   git checkout -b fix/your-change-description
   ```
5. Make your changes
6. Verify everything works:
   ```bash
   npm run typecheck    # TypeScript strict check
   npm run test         # Run all tests
   npm run build        # Build server + extension
   ```

### Coding Style

- **TypeScript strict mode** — `strict: true`, avoid `any` unless unavoidable
- **Prefer `const`** over `let`, never use `var`
- **Async/await** over raw Promises
- **Error handling** — always catch and provide context, never swallow errors
- **Naming** — PascalCase for types, camelCase for functions/variables, UPPER_SNAKE_CASE for constants, kebab-case for files

### Write Tests

- Tests use [Vitest](https://vitest.dev/)
- Write hermetic tests — no network calls, no file system side effects
- Test naming: `describe("Component", () => it("should do X when Y", ...))`
- Run tests: `npm run test`
- Run with coverage: `npm run test:coverage`

### Commit Messages

Use semantic commit format:

```
type: short description

Optional longer description.
```

Types: `fix`, `feat`, `docs`, `test`, `devops`, `chore`, `refactor`, `perf`

Examples:
- `fix: handle CDP disconnect during navigation`
- `feat: add WebSocket message capture tool`
- `docs: update smart object API reference`
- `test: add coverage for frame switching`

### Send a Pull Request

- Keep PRs small and focused — one concern per PR
- Include a clear description of what and why
- Reference the related issue (e.g., `Closes #42`)
- All CI checks must pass (typecheck, tests, build)
- Expect review feedback — we aim to respond within a few days

### No New Dependencies

We maintain a high bar for adding dependencies. If your change requires a new npm package, explain why in the PR description and demonstrate that the functionality can't be reasonably achieved without it.

## Development Workflow

```bash
npm run dev              # Watch mode for MCP server
npm run build:extension  # Build Chrome extension (IIFE)
npm run build:server     # Build MCP server (ESM)
npm run typecheck        # TypeScript check (server + extension)
npm run test             # Run all tests
```

## Project Structure

```
src/extension/   — Chrome extension (background, popup, sensors)
src/mcp-server/  — MCP server (tools, bridge, client)
src/shared/      — Shared types, constants, protocol definitions
tests/           — Unit tests (vitest)
```

## Questions?

Open a [GitHub issue](https://github.com/Crawlio-app/crawlio-browser-agent/issues) — we're happy to help.
