import { describe, it, expect } from "vitest";
import { parseTags, parseSeverity } from "@/lib/tags";

describe("parseTags", () => {
  it("splits on commas and trims whitespace", () => {
    expect(parseTags("shortness of breath, sweating,  nausea")).toEqual([
      "shortness of breath",
      "sweating",
      "nausea",
    ]);
  });

  it("drops empty entries from trailing/double commas", () => {
    expect(parseTags("a,,b, ,c")).toEqual(["a", "b", "c"]);
  });

  it("returns an empty array for empty input", () => {
    expect(parseTags("")).toEqual([]);
    expect(parseTags("   ")).toEqual([]);
  });
});

describe("parseSeverity", () => {
  it("parses a valid in-range severity", () => {
    expect(parseSeverity("7")).toBe(7);
    expect(parseSeverity("1")).toBe(1);
    expect(parseSeverity("10")).toBe(10);
  });

  it("returns null for empty/missing input", () => {
    expect(parseSeverity("")).toBeNull();
    expect(parseSeverity(null)).toBeNull();
    expect(parseSeverity(undefined)).toBeNull();
  });

  it("returns null for out-of-range values", () => {
    expect(parseSeverity("0")).toBeNull();
    expect(parseSeverity("11")).toBeNull();
    expect(parseSeverity("-5")).toBeNull();
  });

  it("returns null for non-numeric input", () => {
    expect(parseSeverity("severe")).toBeNull();
  });
});
