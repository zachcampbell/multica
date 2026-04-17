import { describe, it, expect } from "vitest";
import { isNewer } from "./update-section";

describe("isNewer", () => {
  it("compares base semver components", () => {
    expect(isNewer("v0.2.6", "v0.2.5")).toBe(true);
    expect(isNewer("v0.3.0", "v0.2.99")).toBe(true);
    expect(isNewer("v1.0.0", "v0.9.9")).toBe(true);
    expect(isNewer("v0.2.5", "v0.2.5")).toBe(false);
    expect(isNewer("v0.2.4", "v0.2.5")).toBe(false);
  });

  it("treats -zc.N as a 4th version component", () => {
    expect(isNewer("v0.2.5-zc.2", "v0.2.5-zc.1")).toBe(true);
    expect(isNewer("v0.2.5-zc.10", "v0.2.5-zc.9")).toBe(true);
    expect(isNewer("v0.2.5-zc.1", "v0.2.5-zc.2")).toBe(false);
    expect(isNewer("v0.2.5-zc.2", "v0.2.5-zc.2")).toBe(false);
  });

  it("treats fork tag as newer than upstream base", () => {
    expect(isNewer("v0.2.5-zc.1", "v0.2.5")).toBe(true);
    expect(isNewer("v0.2.5", "v0.2.5-zc.1")).toBe(false);
  });

  it("prefers base version bump over zc suffix", () => {
    expect(isNewer("v0.2.6", "v0.2.5-zc.99")).toBe(true);
    expect(isNewer("v0.2.6-zc.1", "v0.2.5-zc.99")).toBe(true);
    expect(isNewer("v0.2.5-zc.99", "v0.2.6")).toBe(false);
  });

  it("tolerates -dirty and other suffixes after zc.N", () => {
    expect(isNewer("v0.2.5-zc.2", "v0.2.5-zc.1-dirty")).toBe(true);
    expect(isNewer("v0.2.5-zc.1-dirty", "v0.2.5-zc.1")).toBe(false);
  });

  it("ignores unknown prerelease suffixes (treated as zc=0)", () => {
    expect(isNewer("v0.2.5-zc.1", "v0.2.5-rc.1")).toBe(true);
    expect(isNewer("v0.2.5-rc.1", "v0.2.5")).toBe(false);
  });
});
