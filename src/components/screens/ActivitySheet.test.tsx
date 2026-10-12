import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderScreen } from "@/src/components/app/testing";
import { ActivitySheet } from "@/src/components/screens/ActivitySheet";
import { workoutPlan } from "@/src/data/workout-plan";
import { WORKOUT_CATEGORY_LABELS } from "@/src/lib/fitora";
import type { WorkoutDay } from "@/src/types/workout";

const monday = workoutPlan.find((d) => d.id === "monday")!;

beforeEach(() => {
  localStorage.clear();
  // Only Date is faked (userEvent keeps real timers). Thursday: the mock history then holds a
  // badminton session from Wednesday → "Gần đây".
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(2026, 9, 15, 9, 0, 0));
});
afterEach(() => vi.useRealTimers());

function renderSheet(plannedDay: WorkoutDay | null = monday) {
  const onStart = vi.fn();
  const onOpenChange = vi.fn();
  renderScreen(<ActivitySheet open onOpenChange={onOpenChange} plannedDay={plannedDay} onStart={onStart} />);
  return { onStart, onOpenChange };
}

describe("ActivitySheet", () => {
  it("finds Cầu lông without diacritics, preselects the default variant and starts it", async () => {
    const user = userEvent.setup();
    const { onStart } = renderSheet();
    const dialog = await screen.findByRole("dialog", { name: "Chọn hoạt động" });

    await user.type(within(dialog).getByRole("searchbox", { name: "Tìm hoạt động" }), "cau long");
    const tile = within(dialog).getByRole("button", { name: /Cầu lông/ });
    expect(within(dialog).queryByText(/^Theo lịch/)).toBeNull();

    expect(within(dialog).getByRole("button", { name: "Bắt đầu" })).toBeDisabled();
    await user.click(tile);
    expect(tile).toHaveAttribute("aria-pressed", "true");

    const intensity = within(dialog).getByRole("group", { name: "Cường độ" });
    expect(within(intensity).getByRole("button", { name: /Giao lưu/ })).toHaveAttribute("aria-pressed", "true");
    // 5,5 MET · 70 kg (mock profile, measured) → metKcal 5.5·3.5·70/200·60 = 404
    expect(within(dialog).getByText("≈ 5,5 MET · ~404 kcal/giờ với 70 kg")).toBeInTheDocument();

    await user.click(within(intensity).getByRole("button", { name: /Thi đấu/ }));
    expect(within(dialog).getByText(/≈ 7,0 MET/)).toBeInTheDocument();

    await user.click(within(dialog).getByRole("button", { name: "Bắt đầu" }));
    expect(onStart).toHaveBeenCalledWith({ kind: "activity", dayId: null, activity: "badminton", variant: "competitive" });
  });

  it("shows a helpful message when nothing matches", async () => {
    const user = userEvent.setup();
    renderSheet();
    const dialog = await screen.findByRole("dialog", { name: "Chọn hoạt động" });
    await user.type(within(dialog).getByRole("searchbox", { name: "Tìm hoạt động" }), "zzzz");
    expect(within(dialog).getByText("Không có kết quả")).toBeInTheDocument();
    expect(within(dialog).getByText(/Không tìm thấy “zzzz”/)).toBeInTheDocument();
  });

  it("starts the scheduled session from the first card in one tap", async () => {
    const user = userEvent.setup();
    const { onStart } = renderSheet();
    const dialog = await screen.findByRole("dialog", { name: "Chọn hoạt động" });
    await user.click(within(dialog).getByRole("button", { name: /Theo lịch: Ngực, vai và tay sau/ }));
    expect(onStart).toHaveBeenCalledWith({ kind: "plan", dayId: "monday", activity: "weight_training", variant: "moderate" });
  });

  it("has no plan card on a rest day", async () => {
    renderSheet(null);
    const dialog = await screen.findByRole("dialog", { name: "Chọn hoạt động" });
    expect(within(dialog).queryByRole("button", { name: /Theo lịch/ })).toBeNull();
  });

  it("lists recent activities from the history and the Fitora categories", async () => {
    const user = userEvent.setup();
    renderSheet();
    const dialog = await screen.findByRole("dialog", { name: "Chọn hoạt động" });

    expect(await within(dialog).findByText("Gần đây")).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: /Cầu lông/ })).toBeInTheDocument();

    const groups = within(dialog).getByRole("group", { name: "Nhóm hoạt động" });
    for (const label of Object.values(WORKOUT_CATEGORY_LABELS)) {
      expect(within(groups).getByRole("button", { name: label })).toBeInTheDocument();
    }
    expect(within(groups).getByRole("button", { name: "Gym" })).toHaveAttribute("aria-pressed", "true");
    expect(within(dialog).getByRole("button", { name: /^Tập tạ$/ })).toBeInTheDocument();

    await user.click(within(groups).getByRole("button", { name: "Bơi" }));
    expect(within(groups).getByRole("button", { name: "Bơi" })).toHaveAttribute("aria-pressed", "true");
    expect(within(dialog).queryByRole("button", { name: /^Tập tạ$/ })).toBeNull();
  });
});
