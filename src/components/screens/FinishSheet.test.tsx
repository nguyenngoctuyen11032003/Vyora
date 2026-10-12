import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderScreen } from "@/src/components/app/testing";
import { FinishSheet } from "@/src/components/screens/FinishSheet";
import { storeActivity, storeSession } from "@/src/components/session/test-utils";
import { ACTIVE_SESSION_KEY } from "@/src/lib/session";

beforeEach(() => localStorage.clear());

function renderSheet() {
  const onDone = vi.fn();
  const onOpenChange = vi.fn();
  const r = renderScreen(<FinishSheet open onOpenChange={onOpenChange} onDone={onDone} />, { screen: "session" });
  return { ...r, onDone, onOpenChange };
}

/** The live kcal of the footer ("≈ 257 kcal"), read from its sr-friendly text. */
function footerKcal(): string {
  const el = screen.getByText(/Calo ước lượng/).parentElement!;
  return el.textContent!.replace(/\s+/g, " ").replace("Calo ước lượng ", "").trim();
}

describe("FinishSheet", () => {
  it("pre-fills the minutes from the clock and recomputes kcal when minutes or intensity change", async () => {
    storeSession(60);
    renderSheet();
    const input = await screen.findByLabelText("Thời gian tập");
    expect(input).toHaveValue("60");
    expect(footerKcal()).toBe("≈ 257 kcal");

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Thêm 1 phút" }));
    expect(input).toHaveValue("61");
    expect(footerKcal()).toBe("≈ 262 kcal");

    await user.clear(input);
    await user.type(input, "30");
    expect(footerKcal()).toBe("≈ 129 kcal");

    await user.click(screen.getByRole("button", { name: "Nặng" }));
    expect(screen.getByRole("button", { name: /Nặng/ })).toHaveAttribute("aria-pressed", "true");
    expect(footerKcal()).toBe("≈ 221 kcal");
  });

  it("clamps typed minutes to 1–300", async () => {
    storeSession(60);
    renderSheet();
    const input = await screen.findByLabelText("Thời gian tập");
    const user = userEvent.setup();
    await user.clear(input);
    await user.type(input, "999");
    await user.tab();
    expect(input).toHaveValue("300");
    await user.clear(input);
    await user.type(input, "0");
    await user.tab();
    expect(input).toHaveValue("1");
  });

  it("shows the km field only for speed-based activities", async () => {
    storeSession(60);
    const { unmount } = renderSheet();
    await screen.findByLabelText("Thời gian tập");
    expect(screen.queryByLabelText(/Quãng đường/)).not.toBeInTheDocument();
    unmount();

    localStorage.clear();
    storeActivity(45, "running");
    renderSheet();
    const km = await screen.findByLabelText(/Quãng đường/);
    await userEvent.setup().type(km, "5,2");
    expect(screen.getByText("Ghi vào ghi chú: “Quãng đường 5,2 km”")).toBeInTheDocument();
  });

  it("saves the row with the Fitora distance note and reports it", async () => {
    storeActivity(45, "running");
    const { onDone } = renderSheet();
    const user = userEvent.setup();
    await user.type(await screen.findByLabelText(/Quãng đường/), "5,2");
    await user.click(screen.getByRole("button", { name: "Lưu buổi tập" }));
    await waitFor(() => expect(onDone).toHaveBeenCalled());
    const saved = onDone.mock.calls[0][0];
    expect(saved).toMatchObject({
      activity: "running",
      category: "running",
      duration_min: 45,
      notes: "Quãng đường 5,2 km\nGym app",
      source: "gym",
      kcal: 458,
    });
    expect(localStorage.getItem(ACTIVE_SESSION_KEY)).toBeNull();
  });

  it("only allows cancelling under one minute, with a confirmation", async () => {
    storeSession(0.2);
    const { onDone } = renderSheet();
    expect(await screen.findByText(/chưa đủ 1 phút/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Lưu buổi tập" })).not.toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Huỷ buổi tập" }));
    const confirm = await screen.findByRole("alertdialog", { name: "Huỷ buổi tập này?" });
    await user.click(within(confirm).getByRole("button", { name: "Huỷ buổi tập" }));
    await waitFor(() => expect(onDone).toHaveBeenCalledWith(null));
    expect(localStorage.getItem(ACTIVE_SESSION_KEY)).toBeNull();
  });

  it("warns after 4 hours and pre-fills 60 minutes", async () => {
    storeSession(5 * 60);
    renderSheet();
    expect(await screen.findByText("Có thể bạn quên bấm kết thúc.")).toBeInTheDocument();
    expect(screen.getByLabelText("Thời gian tập")).toHaveValue("60");
  });

  it("shows the weight and its Fitora source (read-only)", async () => {
    storeSession(60);
    renderSheet();
    expect(await screen.findByText("70 kg")).toBeInTheDocument();
    expect(screen.getByText(/Fitora · /)).toBeInTheDocument();
    expect(screen.getByText("Sửa cân nặng trong Fitora")).toBeInTheDocument();
  });

  it("asks to confirm the 65 kg fallback before saving", async () => {
    storeSession(60, { weightKg: 65, weightSource: "fallback" });
    renderScreen(<FinishSheet open onOpenChange={() => {}} />, { user: { id: "mock-moi", email: "ban.moi@example.com" } });
    const weight = await screen.findByLabelText("Cân nặng (kg) để tính calo");
    expect(weight).toHaveValue("65");
    const save = screen.getByRole("button", { name: "Lưu buổi tập" });
    expect(save).toBeDisabled();
    await userEvent.setup().click(screen.getByRole("checkbox", { name: /Đúng, tôi nặng khoảng 65 kg/ }));
    expect(save).toBeEnabled();
  });
});
