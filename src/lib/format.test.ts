import { describe, expect, it } from "vitest";
import { addDaysIso, ageFrom, formatClock, formatDayMonth, formatDecimal, formatInt, formatKg, toLocalDate, weekDates, weekStartIso } from "@/src/lib/format";
import { resolveWeightInfo } from "@/src/lib/weight";
import { readRecoveryParams } from "@/src/lib/recovery";
import type { FitoraProfile } from "@/src/types/gym";

describe("format", () => {
  it("clock is mm:ss, then h:mm:ss", () => {
    expect(formatClock(0)).toBe("00:00");
    expect(formatClock(754000)).toBe("12:34");
    expect(formatClock(3600000)).toBe("1:00:00");
    expect(formatClock(-5)).toBe("00:00");
  });

  it("numbers use Vietnamese separators", () => {
    expect(formatInt(1850)).toBe("1.850");
    expect(formatInt(1234567)).toBe("1.234.567");
    expect(formatDecimal(7)).toBe("7,0");
    expect(formatKg(70)).toBe("70");
    expect(formatKg(70.46)).toBe("70,5");
  });

  it("weeks start on Monday", () => {
    expect(weekStartIso("2026-10-12")).toBe("2026-10-12");
    expect(weekStartIso("2026-10-18")).toBe("2026-10-12");
    expect(weekDates("2026-10-14")).toEqual(["2026-10-12", "2026-10-13", "2026-10-14", "2026-10-15", "2026-10-16", "2026-10-17", "2026-10-18"]);
    expect(addDaysIso("2026-10-31", 1)).toBe("2026-11-01");
    expect(formatDayMonth("2026-10-10")).toBe("10/10");
    expect(toLocalDate(new Date(2026, 0, 5))).toBe("2026-01-05");
  });

  it("age from birth date", () => {
    expect(ageFrom("1995-03-14", new Date(2026, 9, 12))).toBe(31);
    expect(ageFrom("1995-10-13", new Date(2026, 9, 12))).toBe(30);
    expect(ageFrom(null)).toBeNull();
  });
});

describe("weight resolution", () => {
  const base = { latestWeightKg: null, latestMeasuredOn: null, startWeightKg: null } as unknown as FitoraProfile;
  it("measured → profile → manual → fallback (needs confirm)", () => {
    expect(resolveWeightInfo({ ...base, latestWeightKg: 70, latestMeasuredOn: "2026-10-10" }, 80)).toEqual({ kg: 70, source: "measured", label: "Fitora · đo 10/10", needsConfirm: false });
    expect(resolveWeightInfo({ ...base, startWeightKg: 74 }, 80)).toMatchObject({ kg: 74, source: "profile", label: "Fitora · hồ sơ" });
    expect(resolveWeightInfo(null, 80)).toMatchObject({ kg: 80, source: "manual", label: "nhập tay" });
    expect(resolveWeightInfo(null, null)).toMatchObject({ kg: 65, source: "fallback", needsConfirm: true });
    expect(resolveWeightInfo(null, 12)).toMatchObject({ source: "fallback" });
  });
});

describe("recovery link", () => {
  it("reads token_hash / type / code", () => {
    expect(readRecoveryParams("?flow=recovery&token_hash=demo&type=recovery")).toEqual({ tokenHash: "demo", type: "recovery", code: null });
    expect(readRecoveryParams("?code=abc")).toEqual({ tokenHash: null, type: null, code: "abc" });
    expect(readRecoveryParams("")).toBeNull();
    expect(readRecoveryParams("?foo=1")).toBeNull();
  });
});
