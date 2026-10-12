import { act, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { renderScreen } from "@/src/components/app/testing";
import { SessionScreen } from "@/src/components/screens/SessionScreen";
import { storeActivity, storeSession } from "@/src/components/session/test-utils";
import { workoutPlan } from "@/src/data/workout-plan";
import { ACTIVE_SESSION_KEY } from "@/src/lib/session";

beforeEach(() => localStorage.clear());

describe("SessionScreen", () => {
  it("shows the empty state with the two ways to start", async () => {
    renderScreen(<SessionScreen plan={workoutPlan} />, { screen: "session" });
    expect(await screen.findByRole("heading", { level: 2, name: /Chưa có\s*buổi tập/ })).toBeInTheDocument();
    // Today's plan (or, on a rest day, a link to it) + other activity.
    expect(screen.getByRole("button", { name: /Theo lịch hôm nay|Xem lịch hôm nay/ })).toBeInTheDocument();
    const other = screen.getByRole("button", { name: "Hoạt động khác" });
    await userEvent.setup().click(other);
    expect(await screen.findByRole("dialog", { name: "Chọn hoạt động" })).toBeInTheDocument();
  });

  it("starts today's plan in one tap from the empty state", async () => {
    renderScreen(<SessionScreen plan={workoutPlan} />, { screen: "session" });
    const start = await screen.findByRole("button", { name: /Theo lịch hôm nay|Xem lịch hôm nay/ });
    if (start.textContent?.includes("Xem lịch")) return; // rest day on the runner's clock
    await userEvent.setup().click(start);
    expect(JSON.parse(localStorage.getItem(ACTIVE_SESSION_KEY)!)).toMatchObject({ kind: "plan", activity: "weight_training" });
    expect(await screen.findByRole("timer")).toBeInTheDocument();
  });

  it("shows the running plan session: clock, live kcal, caption and checklist", async () => {
    storeSession(60);
    renderScreen(<SessionScreen plan={workoutPlan} />, { screen: "session" });
    expect(await screen.findByRole("heading", { level: 2, name: "Ngực, vai và tay sau" })).toBeInTheDocument();
    expect(screen.getByRole("timer")).toHaveTextContent(/^(1:00:0\d|59:5\d)$/);
    // Fitora metKcal: 3.5 MET · 3.5 · 70 kg / 200 · 60 min = 257.
    expect(screen.getByText("≈ 257 kcal")).toBeInTheDocument();
    expect(screen.getByText("ước lượng · 70 kg · Vừa")).toBeInTheDocument();
    expect(screen.getByText(/±20%/)).toBeInTheDocument();
    expect(screen.getByText("Đang chạy")).toBeInTheDocument();

    const monday = workoutPlan.find((d) => d.id === "monday")!;
    const boxes = screen.getAllByRole("checkbox");
    expect(boxes).toHaveLength(monday.exercises.length);
    expect(screen.queryByRole("group", { name: "Chọn cường độ" })).not.toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(boxes[0]);
    expect(boxes[0]).toHaveAttribute("aria-checked", "true");
    expect(screen.getByText(`Xong 1/${monday.exercises.length}`)).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem(ACTIVE_SESSION_KEY)!).checked).toEqual([monday.exercises[0].id]);
  });

  it("pauses and resumes with a text status, not only colour", async () => {
    storeSession(10);
    renderScreen(<SessionScreen plan={workoutPlan} />, { screen: "session" });
    const user = userEvent.setup();
    await user.click(await screen.findByRole("button", { name: "Tạm dừng" }));
    expect(screen.getByText("Đã tạm dừng")).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem(ACTIVE_SESSION_KEY)!).pausedAt).not.toBeNull();
    await user.click(screen.getByRole("button", { name: "Tiếp tục" }));
    expect(screen.getByText("Đang chạy")).toBeInTheDocument();
  });

  it("shows the MET/intensity card instead of a checklist for other activities", async () => {
    storeActivity(60);
    renderScreen(<SessionScreen plan={workoutPlan} />, { screen: "session" });
    expect(await screen.findByRole("heading", { level: 2, name: "Cầu lông · Thi đấu" })).toBeInTheDocument();
    expect(screen.queryAllByRole("checkbox")).toHaveLength(0);
    const group = screen.getByRole("group", { name: "Chọn cường độ" });
    expect(within(group).getByRole("button", { name: /Thi đấu/ })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText(/7,0 MET · ~515 kcal\/giờ với 70 kg/)).toBeInTheDocument();

    await userEvent.setup().click(within(group).getByRole("button", { name: "Giao lưu" }));
    expect(await screen.findByRole("heading", { level: 2, name: "Cầu lông · Giao lưu" })).toBeInTheDocument();
    expect(screen.getByText("≈ 404 kcal")).toBeInTheDocument();
  });

  it("opens the finish sheet from Kết thúc", async () => {
    storeSession(30);
    renderScreen(<SessionScreen plan={workoutPlan} />, { screen: "session" });
    await userEvent.setup().click(await screen.findByRole("button", { name: "Kết thúc" }));
    expect(await screen.findByRole("dialog", { name: "Kết thúc buổi tập" })).toBeInTheDocument();
    await act(async () => {});
  });
});
