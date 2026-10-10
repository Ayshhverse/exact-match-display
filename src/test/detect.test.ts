import { describe, it, expect } from "vitest";
import { analyze, highlightSegments, EXAMPLES } from "@/lib/detect";

const byLabel = (label: string) => EXAMPLES.find((e) => e.label === label)!;

describe("analyze risk scoring", () => {
  it("sextortion threat scores high (67-100)", () => {
    const a = analyze(byLabel("Sextortion threat").text);
    expect(a.score).toBeGreaterThanOrEqual(67);
    expect(a.risk).toBe("High");
    expect(a.threat).toBe("Sextortion");
  });

  it("fake bank OTP scores high (67-100)", () => {
    const a = analyze(byLabel("Fake bank OTP").text);
    expect(a.score).toBeGreaterThanOrEqual(67);
    expect(a.risk).toBe("High");
  });

  it("fake job offer scores medium to high (34-100)", () => {
    const a = analyze(byLabel("Fake job offer").text);
    expect(a.score).toBeGreaterThanOrEqual(34);
    expect(["Medium", "High"]).toContain(a.risk);
  });

  it("friend impersonation scores medium to high (34-100)", () => {
    const a = analyze(byLabel("Friend impersonation").text);
    expect(a.score).toBeGreaterThanOrEqual(34);
    expect(["Medium", "High"]).toContain(a.risk);
  });

  it("score is capped at 100", () => {
    const a = analyze(EXAMPLES.map((e) => e.text).join(" "));
    expect(a.score).toBeLessThanOrEqual(100);
  });

  it("harmless message scores low", () => {
    const a = analyze("Hey, are we still meeting for coffee tomorrow at 5?");
    expect(a.score).toBeLessThan(34);
    expect(a.risk).toBe("Low");
  });
});

describe("highlightSegments", () => {
  it("marks matched phrases as hits and keeps the full text", () => {
    const text = "Send ₹500 now, this is urgent!";
    const { matches } = analyze(text);
    const segs = highlightSegments(text, matches);
    expect(segs.map((s) => s.text).join("")).toBe(text);
    expect(segs.some((s) => s.hit && /urgent/i.test(s.text))).toBe(true);
  });

  it("returns the text untouched when nothing matched", () => {
    expect(highlightSegments("hello there", [])).toEqual([{ text: "hello there", hit: false }]);
  });
});
