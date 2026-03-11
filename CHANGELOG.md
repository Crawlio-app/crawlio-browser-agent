# Changelog

All notable changes to the Browser Agent are documented here.

> For the full release history, see the [`releases/`](./releases/) directory.

## [1.5.9] - 2026-03-11

### Security Hardening

- WebSocket bridge now requires shared-secret token authentication
- CDP error handling throws instead of silent failure
- Recording state persisted across service worker restarts
- Input validation at extension layer (URL scheme blocking, expression caps, HTML gates)
- All in-memory collections bounded with FIFO eviction
- Health endpoint and portal CORS restricted to specific origins

[Full release notes](./releases/v1.5.9.md)

## [1.5.8] - 2026-03-09

### Fixed

- Fixed IIFE detection in `evaluate` for multiline expressions — `smart.detectTables` and related calls no longer return `undefined`
- Extension manifest versions synced with npm package version

[Full release notes](./releases/v1.5.8.md)
