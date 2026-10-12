import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { renderScreen } from "@/src/components/app/testing";
import { WeekScreen } from "@/src/components/screens/WeekScreen";

beforeEach(() => localStorage.clear());

describe("WeekScreen", () => {
  it("shows the week numbers, the 7-day strip and the recent list with sync labels", async () => {
    renderScreen(<WeekScreen />, { screen: "week" });
    // The mock always seeds one session last week (and up to two earlier this week).
    expect(await screen.findByText("Deadlift và chân")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Tiến độ" })).toBeInTheDocument();
    expect(screen.getByText("Calo đã đốt")).toBeInTheDocument();
    expect(screen.getByText("buổi tập")).toBeInTheDocument();
    expect(screen.getByText("phút")).toBeInTheDocument();

    const strip = screen.getByRole("list", { name: "Các ngày trong tuần" });
    const days = within(strip).getAllByRole("listitem");
    expect(days.map((d) => d.textContent?.slice(0, 2))).toEqual(["T2", "T3", "T4", "T5", "T6", "T7", "CN"]);
    // Each day says in words whether it was trained (never colour alone).
    for (const d of days) expect(d.textContent).toMatch(/buổi tập|chưa tập/);

    expect(screen.getAllByText(/Đã lưu|Chờ gửi/).length).toBeGreaterThan(0);
  });

  it("deletes a session after confirmation", async () => {
    renderScreen(<WeekScreen />, { screen: "week" });
    const user = userEvent.setup();
    await user.click(await screen.findByRole("button", { name: /^Xoá buổi Deadlift và chân/ }));
    const dialog = await screen.findByRole("alertdialog", { name: "Xoá buổi tập?" });
    await user.click(within(dialog).getByRole("button", { name: "Xoá buổi tập" }));
    await waitFor(() => expect(screen.queryByText("Deadlift và chân")).not.toBeInTheDocument());
  });

  it("keeps the session when the confirmation is dismissed", async () => {
    renderScreen(<WeekScreen />, { screen: "week" });
    const user = userEvent.setup();
    await user.click(await screen.findByRole("button", { name: /^Xoá buổi Deadlift và chân/ }));
    const dialog = await screen.findByRole("alertdialog");
    await user.click(within(dialog).getByRole("button", { name: "Giữ lại" }));
    expect(screen.getByText("Deadlift và chân")).toBeInTheDocument();
  });

  it("shows an empty state that leads to Hôm nay for a new account", async () => {
    const { nav } = renderScreen(<WeekScreen />, { screen: "week", user: { id: "mock-moi", email: "ban.moi@example.com" } });
    expect(await screen.findByText("Chưa có buổi tập nào")).toBeInTheDocument();
    await userEvent.setup().click(screen.getByRole("button", { name: "Bắt đầu buổi tập" }));
    expect(nav.navigate).toHaveBeenCalledWith("today");
  });
});
