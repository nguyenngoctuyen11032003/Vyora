import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderScreen } from "@/src/components/app/testing";
import { TodayScreen } from "@/src/components/screens/TodayScreen";
import { estimateDayMinutes, splitTitle } from "@/src/components/workout/day-summary";
import { workoutPlan } from "@/src/data/workout-plan";
import { ACTIVE_SESSION_KEY } from "@/src/lib/session";

beforeEach(() => {
  localStorage.clear();
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(2026, 9, 12, 18, 0, 0)); // Monday
});
afterEach(() => vi.useRealTimers());

const renderToday = () => renderScreen(<TodayScreen plan={workoutPlan} />);

describe("TodayScreen", () => {
  it("shows today's caption, the 48px title and today's tab preselected", async () => {
    renderToday();
    expect(await screen.findByText(/Thứ Hai · 7 bài · ~60 phút/)).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent("Ngực, vaivà tay sau");
    expect(screen.getByRole("tab", { name: /Thứ 2, hôm nay/ })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByTestId("exercise-grid").querySelectorAll("li")).toHaveLength(7);
  });

  it("opens the existing exercise detail with its video and closes it when the day changes", async () => {
    const user = userEvent.setup();
    renderToday();
    await user.click(await screen.findByRole("button", { name: /^Xem hướng dẫn Bench Press/ }));
    const detail = await screen.findByRole("dialog", { name: "Bench Press" });
    expect(within(detail).getByTitle("✅ Bench Press LIKE THIS!")).toBeInTheDocument();

    await user.keyboard("{Escape}");
    await user.click(screen.getByRole("tab", { name: /Thứ 3/ }));
    expect(screen.queryByRole("dialog", { name: "Bench Press" })).toBeNull();
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent("Chân, mông");
  });

  it("starts the scheduled session in one tap, then offers 'Đang tập'", async () => {
    const user = userEvent.setup();
    const { nav } = renderToday();
    await user.click(await screen.findByRole("button", { name: "Bắt đầu buổi tập" }));

    expect(nav.navigate).toHaveBeenCalledWith("session");
    expect(JSON.parse(localStorage.getItem(ACTIVE_SESSION_KEY)!)).toMatchObject({
      kind: "plan",
      dayId: "monday",
      activity: "weight_training",
      variant: "moderate",
    });
    const running = screen.getByRole("button", { name: /Đang tập · 00:0\d/ });
    expect(screen.queryByRole("button", { name: "Bắt đầu buổi tập" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Hoạt động khác" })).toBeNull();
    await user.click(running);
    expect(nav.navigate).toHaveBeenLastCalledWith("session");
  });

  it("uses the vigorous default for Thứ 3", async () => {
    const user = userEvent.setup();
    renderToday();
    await user.click(await screen.findByRole("tab", { name: /Thứ 3/ }));
    await user.click(screen.getByRole("button", { name: "Bắt đầu buổi tập" }));
    expect(JSON.parse(localStorage.getItem(ACTIVE_SESSION_KEY)!)).toMatchObject({ dayId: "tuesday", variant: "vigorous" });
  });

  it("shows the rest-day card with its two actions", async () => {
    const user = userEvent.setup();
    renderToday();
    await user.click(await screen.findByRole("tab", { name: /Thứ 7/ }));
    expect(screen.getByText(/Thứ Bảy · Nghỉ phục hồi/)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Phục hồi để tập tốt hơn" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Bắt đầu buổi tập" })).toBeNull();

    await user.click(screen.getByRole("button", { name: "Hoạt động khác" }));
    expect(await screen.findByRole("dialog", { name: "Chọn hoạt động" })).toBeInTheDocument();
    await user.keyboard("{Escape}");

    await user.click(screen.getByRole("button", { name: "Vẫn tập theo giáo án" }));
    expect(screen.getByRole("tab", { name: /Thứ 2/ })).toHaveAttribute("aria-selected", "true");
  });

  it("opens Chọn hoạt động from 'Hoạt động khác'", async () => {
    const user = userEvent.setup();
    renderToday();
    await user.click(await screen.findByRole("button", { name: "Hoạt động khác" }));
    const sheet = await screen.findByRole("dialog", { name: "Chọn hoạt động" });
    expect(within(sheet).getByRole("button", { name: /Theo lịch: Ngực, vai và tay sau/ })).toBeInTheDocument();
  });
});

describe("day summary", () => {
  it("estimates ~60 min for Monday and splits titles like the template", () => {
    expect(estimateDayMinutes(workoutPlan[0])).toBe(60);
    expect(estimateDayMinutes(workoutPlan.find((d) => d.isRestDay)!)).toBe(0);
    expect(splitTitle("Ngực, vai và tay sau")).toEqual(["Ngực, vai", "và tay sau"]);
    expect(splitTitle("Ngày nghỉ phục hồi")).toEqual(["Ngày nghỉ", "phục hồi"]);
    expect(splitTitle("Deadlift và chân")).toEqual(["Deadlift", "và chân"]);
    expect(splitTitle("Ngực")).toEqual(["Ngực"]);
  });
});
