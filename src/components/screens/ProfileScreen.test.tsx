import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { renderScreen } from "@/src/components/app/testing";
import { ProfileScreen } from "@/src/components/screens/ProfileScreen";
import { FITORA_URL } from "@/src/lib/env";

beforeEach(() => localStorage.clear());

describe("ProfileScreen", () => {
  it("shows the Fitora profile read-only", async () => {
    renderScreen(<ProfileScreen />, { screen: "profile" });
    expect(await screen.findByRole("heading", { level: 2, name: "Minh Anh" })).toBeInTheDocument();
    expect(screen.getByText("Giảm cân · 1.850 kcal/ngày")).toBeInTheDocument();
    expect(screen.getByText("Chiều cao")).toBeInTheDocument();
    expect(screen.getByText("172")).toBeInTheDocument();
    expect(screen.getByText("Cân nặng")).toBeInTheDocument();
    expect(screen.getByText("Tuổi")).toBeInTheDocument();
    expect(screen.getByText("31")).toBeInTheDocument();
    expect(screen.getByText("Nam")).toBeInTheDocument();
    expect(screen.getByText("Vận động vừa")).toBeInTheDocument();
    expect(screen.getByText("66 kg")).toBeInTheDocument();
    expect(screen.getByText(/Cân nặng tính calo: 70 kg · Fitora · đo/)).toBeInTheDocument();

    const edit = screen.getByRole("link", { name: /Sửa hồ sơ trong Fitora/ });
    expect(edit).toHaveAttribute("href", FITORA_URL);
    expect(edit).toHaveAttribute("target", "_blank");
    expect(screen.queryByText(/Hoàn tất hồ sơ/)).not.toBeInTheDocument();
    // Read-only: no inputs.
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });

  it("asks to finish the Fitora profile when there is none", async () => {
    renderScreen(<ProfileScreen />, { screen: "profile", user: { id: "mock-moi", email: "ban.moi@example.com" } });
    expect(await screen.findByRole("heading", { name: "Hoàn tất hồ sơ trong Fitora để tính calo chính xác" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Mở Fitora/ })).toHaveAttribute("href", FITORA_URL);
    expect(screen.getByText(/65 kg/)).toBeInTheDocument();
    expect(screen.queryByText("Chiều cao")).not.toBeInTheDocument();
  });

  it("shows the cached snapshot time when offline", async () => {
    const user = { id: "mock-offline", email: "minh.offline@example.com" };
    localStorage.setItem(
      `gym.fitoraProfile:${user.id}`,
      JSON.stringify({
        userId: user.id, email: user.email, displayName: "Minh", avatarUrl: null, hasFitProfile: true, sex: "male",
        birthDate: "1995-03-14", age: 31, heightCm: 172, activityLevel: "moderate", goal: "lose", calorieTarget: 1850,
        targetWeightKg: 66, startWeightKg: 74, latestWeightKg: 70, latestMeasuredOn: "2026-10-10", fetchedAt: "2026-10-12T07:05:00",
      }),
    );
    renderScreen(<ProfileScreen />, { screen: "profile", user });
    expect(await screen.findByText("Ngoại tuyến · dữ liệu lúc 07:05")).toBeInTheDocument();
  });

  it("goes back", async () => {
    const { nav } = renderScreen(<ProfileScreen />, { screen: "profile" });
    await userEvent.setup().click(await screen.findByRole("button", { name: "Quay lại" }));
    expect(nav.back).toHaveBeenCalled();
  });
});
