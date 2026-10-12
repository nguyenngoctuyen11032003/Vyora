import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { workoutPlan } from "@/src/data/workout-plan";
import { WeeklyDaySelector } from "@/src/components/workout/weekly-day-selector";

describe("WeeklyDaySelector", () => {
  it("keeps the today marker when another day is selected", () => {
    render(<WeeklyDaySelector plan={workoutPlan} selectedDayId="tuesday" todayId="monday" onSelectDay={() => {}} />);

    const monday = screen.getByRole("tab", { name: /Thứ 2, hôm nay/i });
    const tuesday = screen.getByRole("tab", { name: /Thứ 3/i });

    expect(monday).toHaveAttribute("aria-selected", "false");
    expect(tuesday).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: /Thứ 7, ngày nghỉ/i })).toBeInTheDocument();
  });

  it("moves with the arrow keys (roving focus)", async () => {
    const user = userEvent.setup();
    const onSelectDay = vi.fn();
    render(<WeeklyDaySelector plan={workoutPlan} selectedDayId="monday" todayId="monday" onSelectDay={onSelectDay} />);

    screen.getByRole("tab", { name: /Thứ 2/i }).focus();
    await user.keyboard("{ArrowRight}");
    expect(onSelectDay).toHaveBeenLastCalledWith("tuesday");
    await user.keyboard("{End}");
    expect(onSelectDay).toHaveBeenLastCalledWith("sunday");
  });
});
