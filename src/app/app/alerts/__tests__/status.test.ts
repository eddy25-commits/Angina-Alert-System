import { describe, it, expect } from "vitest";
import { STATUS_LABEL, STATUS_TONE, formatTimestamp } from "../status";
import type { AlertStatus } from "@/lib/supabase/types";

const ALL_STATUSES: AlertStatus[] = [
  "CREATED",
  "SENT",
  "DELIVERED",
  "OPENED",
  "ACKNOWLEDGED",
  "CANCELLED",
  "EXPIRED",
  "FAILED",
];

describe("STATUS_LABEL / STATUS_TONE", () => {
  it("has a label and tone for every alert status", () => {
    for (const status of ALL_STATUSES) {
      expect(STATUS_LABEL[status]).toBeTruthy();
      expect(["active", "ok", "muted"]).toContain(STATUS_TONE[status]);
    }
  });

  it("marks resolved/failed states as non-active tones", () => {
    expect(STATUS_TONE.ACKNOWLEDGED).toBe("ok");
    expect(STATUS_TONE.CANCELLED).toBe("muted");
    expect(STATUS_TONE.EXPIRED).toBe("muted");
    expect(STATUS_TONE.FAILED).toBe("muted");
  });

  it("marks in-flight states as active", () => {
    expect(STATUS_TONE.CREATED).toBe("active");
    expect(STATUS_TONE.SENT).toBe("active");
    expect(STATUS_TONE.DELIVERED).toBe("active");
    expect(STATUS_TONE.OPENED).toBe("active");
  });
});

describe("formatTimestamp", () => {
  it("produces a non-empty, human-readable string", () => {
    const result = formatTimestamp("2026-03-15T14:30:00Z");
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });
});
