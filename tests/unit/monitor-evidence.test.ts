import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { writeEvidence, readEvidence } from "../../src/evidence/store.js";
import { wrapEvidence, deriveQuality } from "../../src/evidence/wrap.js";
import { mkdtemp, rm, readFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import type { EvidenceEnvelope } from "../../src/evidence/schema.js";
import type { DiffReport, DiffChange } from "../../src/shared/evidence-types.js";

function makeDiffChange(overrides?: Partial<DiffChange>): DiffChange {
  return {
    dimension: "meta",
    field: "title",
    before: "Old Title",
    after: "New Title",
    severity: "info",
    description: "Page title changed",
    ...overrides,
  };
}

function makeDiffReport(overrides?: Partial<DiffReport>): DiffReport {
  return {
    baselineId: "ev_test_baseline",
    currentId: "ev_test_current",
    url: "https://example.com",
    capturedAt: {
      baseline: "2026-03-12T00:00:00.000Z",
      current: "2026-03-12T01:00:00.000Z",
    },
    changes: [makeDiffChange()],
    summary: {
      totalChanges: 1,
      breakingChanges: 0,
      dimensions: ["meta"],
    },
    ...overrides,
  };
}

describe("DiffReport type validation", () => {
  it("should have required fields", () => {
    const report = makeDiffReport();
    expect(report.baselineId).toBe("ev_test_baseline");
    expect(report.currentId).toBe("ev_test_current");
    expect(report.url).toBe("https://example.com");
    expect(report.capturedAt.baseline).toBeTruthy();
    expect(report.capturedAt.current).toBeTruthy();
    expect(report.changes).toHaveLength(1);
    expect(report.summary.totalChanges).toBe(1);
    expect(report.summary.breakingChanges).toBe(0);
    expect(report.summary.dimensions).toEqual(["meta"]);
  });

  it("should handle empty changes list", () => {
    const report = makeDiffReport({
      changes: [],
      summary: { totalChanges: 0, breakingChanges: 0, dimensions: [] },
    });
    expect(report.changes).toHaveLength(0);
    expect(report.summary.totalChanges).toBe(0);
    expect(report.summary.dimensions).toEqual([]);
  });

  it("should track multiple dimensions", () => {
    const report = makeDiffReport({
      changes: [
        makeDiffChange({ dimension: "security", field: "https", severity: "breaking" }),
        makeDiffChange({ dimension: "performance", field: "lcp", severity: "warning" }),
        makeDiffChange({ dimension: "meta", field: "title", severity: "info" }),
      ],
      summary: {
        totalChanges: 3,
        breakingChanges: 1,
        dimensions: ["security", "performance", "meta"],
      },
    });
    expect(report.summary.dimensions).toHaveLength(3);
    expect(report.summary.breakingChanges).toBe(1);
  });
});

describe("DiffChange severity classification", () => {
  it("should classify breaking changes", () => {
    const change = makeDiffChange({
      dimension: "security",
      field: "https",
      before: true,
      after: false,
      severity: "breaking",
      description: "HTTPS downgraded to HTTP",
    });
    expect(change.severity).toBe("breaking");
  });

  it("should classify warning changes", () => {
    const change = makeDiffChange({
      dimension: "performance",
      field: "lcp",
      before: 1200,
      after: 3500,
      severity: "warning",
      description: "LCP regressed from 1.2s to 3.5s",
    });
    expect(change.severity).toBe("warning");
  });

  it("should classify info changes", () => {
    const change = makeDiffChange({
      dimension: "meta",
      field: "title",
      before: "Old Title",
      after: "New Title",
      severity: "info",
      description: "Page title changed",
    });
    expect(change.severity).toBe("info");
  });

  it("should support unknown/null before values for new fields", () => {
    const change = makeDiffChange({
      before: null,
      after: "new-value",
      severity: "info",
      description: "New field appeared",
    });
    expect(change.before).toBeNull();
    expect(change.after).toBe("new-value");
  });
});

describe("monitor loop definition", () => {
  it("should have valid structure", async () => {
    const raw = await readFile(
      join(process.cwd(), "loops/monitor.json"),
      "utf-8"
    );
    const loop = JSON.parse(raw);

    expect(loop.name).toBe("monitor");
    expect(loop.family).toBe("monitor");
    expect(loop.phases).toHaveLength(3);
    expect(loop.evidence_dir).toBe(".crawlio/evidence");
    expect(loop.on_phase_failure).toBe("continue_with_gaps");
  });

  it("should have correct phase sequence", async () => {
    const raw = await readFile(
      join(process.cwd(), "loops/monitor.json"),
      "utf-8"
    );
    const loop = JSON.parse(raw);

    expect(loop.phases[0].id).toBe("baseline");
    expect(loop.phases[0].agent).toBe("crawlio-crawler");
    expect(loop.phases[0].required).toBe(true);

    expect(loop.phases[1].id).toBe("recapture");
    expect(loop.phases[1].agent).toBe("crawlio-crawler");
    expect(loop.phases[1].required).toBe(true);

    expect(loop.phases[2].id).toBe("diff");
    expect(loop.phases[2].agent).toBe("crawlio-differ");
    expect(loop.phases[2].output.type).toBe("monitor");
    expect(loop.phases[2].required).toBe(true);
  });

  it("should reference agents that have definitions", async () => {
    const raw = await readFile(
      join(process.cwd(), "loops/monitor.json"),
      "utf-8"
    );
    const loop = JSON.parse(raw);
    const agents = loop.phases.map((p: { agent: string }) => p.agent);

    for (const agent of agents) {
      const agentPath = join(
        process.cwd(),
        ".claude/agents",
        `${agent}.md`
      );
      const content = await readFile(agentPath, "utf-8");
      expect(content.length).toBeGreaterThan(0);
    }
  });
});

describe("writeEvidence with DiffReport", () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), "monitor-test-"));
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  it("should write and read a DiffReport envelope", async () => {
    const report = makeDiffReport();
    const envelope: EvidenceEnvelope<DiffReport> = {
      evidenceId: "ev_monitor_test1",
      type: "monitor",
      url: "https://example.com",
      provenance: {
        source: "inferred",
        tool: "crawlio-differ",
        timestamp: new Date().toISOString(),
      },
      confidence: { level: "high", basis: "direct comparison" },
      gaps: [],
      quality: "complete",
      payload: report,
      createdAt: new Date().toISOString(),
      parentId: "ev_test_baseline",
    };

    const path = await writeEvidence(envelope, tmpDir);
    expect(path).toContain("ev_monitor_test1.json");

    const read = await readEvidence<DiffReport>("ev_monitor_test1", tmpDir);
    expect(read.type).toBe("monitor");
    expect(read.payload.baselineId).toBe("ev_test_baseline");
    expect(read.payload.currentId).toBe("ev_test_current");
    expect(read.payload.changes).toHaveLength(1);
    expect(read.payload.summary.totalChanges).toBe(1);
  });

  it("should produce correct quality for DiffReport with no gaps", async () => {
    const report = makeDiffReport({ changes: [] });
    const envelope: EvidenceEnvelope<DiffReport> = {
      evidenceId: "ev_monitor_test2",
      type: "monitor",
      url: "https://example.com",
      provenance: {
        source: "inferred",
        tool: "crawlio-differ",
        timestamp: new Date().toISOString(),
      },
      confidence: { level: "high", basis: "direct comparison" },
      gaps: [],
      quality: "complete",
      payload: report,
      createdAt: new Date().toISOString(),
    };

    await writeEvidence(envelope, tmpDir);
    const read = await readEvidence<DiffReport>("ev_monitor_test2", tmpDir);
    expect(read.quality).toBe("complete");
  });

  it("should derive partial quality when gaps exist", async () => {
    const report = makeDiffReport();
    const envelope: EvidenceEnvelope<DiffReport> = {
      evidenceId: "ev_monitor_test3",
      type: "monitor",
      url: "https://example.com",
      provenance: {
        source: "inferred",
        tool: "crawlio-differ",
        timestamp: new Date().toISOString(),
      },
      confidence: { level: "high", basis: "direct comparison" },
      gaps: [
        {
          dimension: "performance",
          reason: "Baseline had no performance data",
          impact: "data-absent",
          reducesConfidence: false,
        },
      ],
      quality: "partial",
      payload: report,
      createdAt: new Date().toISOString(),
    };

    await writeEvidence(envelope, tmpDir);
    const read = await readEvidence<DiffReport>("ev_monitor_test3", tmpDir);
    expect(read.quality).toBe("partial");
  });

  it("should use wrapEvidence to create a monitor envelope", () => {
    const report = makeDiffReport();
    const envelope = wrapEvidence({
      type: "monitor",
      url: "https://example.com",
      payload: report,
      provenance: { source: "inferred", tool: "crawlio-differ" },
      confidence: { level: "high", basis: "direct comparison" },
      parentId: "ev_test_baseline",
    });

    expect(envelope.type).toBe("monitor");
    expect(envelope.evidenceId).toMatch(/^ev_/);
    expect(envelope.payload.baselineId).toBe("ev_test_baseline");
    expect(envelope.parentId).toBe("ev_test_baseline");
    expect(envelope.quality).toBe("complete");
  });
});
