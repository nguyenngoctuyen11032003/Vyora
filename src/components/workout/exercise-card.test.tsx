import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ExerciseCard } from "@/src/components/workout/exercise-card";
import type { Exercise } from "@/src/types/workout";

const exercise: Exercise = {
  id: "incline-bench-press",
  name: "Incline Bench Press",
  vietnameseName: "Đẩy ngực dốc lên",
  muscleGroups: ["Ngực trên"],
  sets: 4,
  reps: "14 / 12 / 10 / 8",
  video: {
    embedUrl: "https://www.youtube.com/embed/8fXfwG4ftaQ",
    title: "Incline press",
    aspectRatio: "9:16",
  },
};

describe("ExerciseCard", () => {
  it("makes the complete row actionable and keeps key metrics visible", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<ExerciseCard exercise={exercise} index={1} onSelect={onSelect} />);

    const card = screen.getByRole("button", { name: /^Xem hướng dẫn Incline Bench Press/ });
    expect(card).toHaveTextContent("Đẩy ngực dốc lên");
    expect(card).toHaveTextContent("4 set × 14 / 12 / 10 / 8");
    expect(card).toHaveTextContent("Ngực trên");
    expect(card).toHaveAccessibleName(/có video$/);

    await user.click(card);
    expect(onSelect).toHaveBeenCalledWith("incline-bench-press");
  });

  it("says when there is no video and when the exercise is done (text, not colour)", () => {
    render(
      <ExerciseCard exercise={{ ...exercise, video: { embedUrl: null, aspectRatio: "16:9" } }} index={2} onSelect={() => {}} done />,
    );
    const card = screen.getByRole("button", { name: /Incline Bench Press/ });
    expect(card).toHaveAccessibleName(/chưa có video, đã xong$/);
    expect(card).toHaveTextContent("Đã xong");
  });
});
