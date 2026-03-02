import { describe, it, expect, vi } from "vitest";
import { calculateCost, getModelName, normalizeModelId } from "./pricing";

describe("calculateCost", () => {
  it("calculates cost for claude-opus-4-6", () => {
    const cost = calculateCost("anthropic/claude-opus-4-6", 1000, 500);
    expect(cost).toBeGreaterThan(0);
    expect(cost).toBeCloseTo(0.0525, 4);
  });

  it("calculates cost for claude-sonnet-4-5", () => {
    const cost = calculateCost("anthropic/claude-sonnet-4-5", 1000, 500);
    expect(cost).toBeGreaterThan(0);
    expect(cost).toBeCloseTo(0.0105, 4);
  });

  it("calculates cost for gemini-flash", () => {
    const cost = calculateCost("google/gemini-2.5-flash", 1000, 500);
    expect(cost).toBeGreaterThan(0);
    expect(cost).toBeCloseTo(0.00045, 4);
  });

  it("handles zero tokens", () => {
    const cost = calculateCost("claude-opus-4-6", 0, 0);
    expect(cost).toBe(0);
  });

  it("returns default cost for unknown model", () => {
    const cost = calculateCost("unknown-model", 1000, 500);
    expect(cost).toBeGreaterThan(0);
  });
});

describe("getModelName", () => {
  it("returns name for known model id", () => {
    expect(getModelName("anthropic/claude-opus-4-6")).toBe("Opus 4.6");
  });

  it("returns name for alias", () => {
    expect(getModelName("sonnet")).toBe("Sonnet 4.5");
  });

  it("returns model id for unknown model", () => {
    expect(getModelName("unknown-model")).toBe("unknown-model");
  });
});

describe("normalizeModelId", () => {
  it("normalizes short aliases", () => {
    expect(normalizeModelId("opus")).toBe("anthropic/claude-opus-4-6");
  });

  it("normalizes openclaw format without provider", () => {
    expect(normalizeModelId("claude-sonnet-4-5")).toBe("anthropic/claude-sonnet-4-5");
  });

  it("returns original if not in alias map", () => {
    expect(normalizeModelId("some-random-model")).toBe("some-random-model");
  });
});
