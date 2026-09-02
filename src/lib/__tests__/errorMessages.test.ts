import { describe, it, expect } from "vitest";
import { humanizeAlertError, humanizePairingError } from "@/lib/errorMessages";

describe("humanizeAlertError", () => {
  it("passes through known messages", () => {
    expect(humanizeAlertError("No trusted contact connected")).toBe(
      "No trusted contact connected"
    );
  });

  it("matches a known message embedded in a Postgres error wrapper", () => {
    const pgWrapped = 'ERROR: No trusted contact connected (SQLSTATE P0001)';
    expect(humanizeAlertError(pgWrapped)).toBe("No trusted contact connected");
  });

  it("falls back to a generic message for unknown errors", () => {
    expect(humanizeAlertError("some unexpected database error")).toBe(
      "Something went wrong sending the alert. Please try again."
    );
  });
});

describe("humanizePairingError", () => {
  it("passes through known messages", () => {
    expect(humanizePairingError("That code has expired")).toBe(
      "That code has expired"
    );
  });

  it("falls back to a generic message for unknown errors", () => {
    expect(humanizePairingError("connection reset")).toBe(
      "Couldn't pair with that code. Please try again."
    );
  });
});
