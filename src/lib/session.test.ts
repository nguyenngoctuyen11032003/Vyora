import { describe, expect, it } from "vitest";
import * as S from "@/src/lib/session";

const T0 = Date.parse("2026-10-12T18:00:00+07:00");
const min = (n: number) => n * 60000;

const params: S.StartParams = {
  kind: "plan",
  dayId: "monday",
  activity: "weight_training",
  category: "gym",
  variant: "moderate",
  met: 3.5,
  title: "Ngực, vai và tay sau",
  weightKg: 70,
  weightSource: "measured",
};

describe("session timer (spec §5)", () => {
  it("start → elapsed follows the clock", () => {
    const s = S.start(params, T0, "id-1");
    expect(s).toMatchObject({ id: "id-1", pausedAt: null, pausedMs: 0, checked: [] });
    expect(S.elapsedMs(s, T0)).toBe(0);
    expect(S.elapsedMs(s, T0 + min(12) + 34000)).toBe(min(12) + 34000);
  });

  it("pause freezes, resume continues without the paused time", () => {
    let s = S.start(params, T0);
    s = S.pause(s, T0 + min(10));
    expect(S.isPaused(s)).toBe(true);
    expect(S.elapsedMs(s, T0 + min(25))).toBe(min(10));
    s = S.resume(s, T0 + min(15));
    expect(s.pausedMs).toBe(min(5));
    expect(S.elapsedMs(s, T0 + min(20))).toBe(min(15));
  });

  it("several pauses accumulate; double pause/resume are no-ops", () => {
    let s = S.start(params, T0);
    s = S.pause(s, T0 + min(5));
    s = S.pause(s, T0 + min(6));
    s = S.resume(s, T0 + min(7));
    s = S.resume(s, T0 + min(8));
    s = S.pause(s, T0 + min(10));
    s = S.resume(s, T0 + min(13));
    expect(s.pausedMs).toBe(min(5));
    expect(S.elapsedMs(s, T0 + min(30))).toBe(min(25));
  });

  it("finish rounds to minutes and blocks saving under one minute", () => {
    const s = S.start(params, T0);
    expect(S.finish(s, T0 + 25000)).toMatchObject({ minutes: 0, canSave: false, forgotten: false });
    expect(S.finish(s, T0 + 40000)).toMatchObject({ minutes: 1, canSave: true });
    expect(S.finish(s, T0 + min(59) + 31000)).toMatchObject({ minutes: 60, suggestedMinutes: 60 });
  });

  it("finish after more than 4 h suggests 60 min", () => {
    const s = S.start(params, T0);
    const f = S.finish(s, T0 + min(4 * 60 + 1));
    expect(f).toMatchObject({ forgotten: true, suggestedMinutes: 60, canSave: true, minutes: 241 });
    expect(S.finish(s, T0 + min(600)).minutes).toBe(300);
  });

  it("toggleChecked adds and removes", () => {
    let s = S.start(params, T0);
    s = S.toggleChecked(s, "bench-press");
    s = S.toggleChecked(s, "dip");
    s = S.toggleChecked(s, "bench-press");
    expect(s.checked).toEqual(["dip"]);
  });

  it("survives a reload through JSON; rejects garbage", () => {
    let s = S.start(params, T0, "abc");
    s = S.pause(s, T0 + min(3));
    const back = S.parseSession(S.serializeSession(s));
    expect(back).toEqual(s);
    expect(S.elapsedMs(back!, T0 + min(99))).toBe(min(3));
    expect(S.parseSession(null)).toBeNull();
    expect(S.parseSession("{bad json")).toBeNull();
    expect(S.parseSession(JSON.stringify({ id: "x" }))).toBeNull();
  });

  it("clampMinutes keeps 1–300", () => {
    expect(S.clampMinutes(0)).toBe(1);
    expect(S.clampMinutes(45.4)).toBe(45);
    expect(S.clampMinutes(999)).toBe(300);
    expect(S.clampMinutes(Number.NaN)).toBe(1);
  });
});
