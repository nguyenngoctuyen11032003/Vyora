import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { renderScreen } from "@/src/components/app/testing";
import { ResetPasswordScreen } from "@/src/components/screens/ResetPasswordScreen";
import type { RecoveryParams } from "@/src/types/gym";

beforeEach(() => localStorage.clear());

const link = (tokenHash: string | null): RecoveryParams => ({ tokenHash, type: "recovery", code: null });
const renderReset = (recovery: RecoveryParams | null) =>
  renderScreen(<ResetPasswordScreen recovery={recovery} />, { user: null, screen: "reset", nav: { recovery } });

describe("ResetPasswordScreen", () => {
  it("checks the link, then enforces Fitora's password rules and enters the app", async () => {
    const user = userEvent.setup();
    const { nav } = renderReset(link("demo"));
    expect(screen.getByText("Đang kiểm tra liên kết…")).toBeInTheDocument();

    const pw = await screen.findByLabelText("Mật khẩu mới");
    const repeat = screen.getByLabelText("Nhập lại mật khẩu mới");
    expect(screen.getByText("Tối thiểu 8 ký tự")).toBeInTheDocument();

    await user.type(pw, "ngan");
    await user.click(screen.getByRole("button", { name: "Lưu mật khẩu" }));
    expect(screen.getByText("Mật khẩu tối thiểu 8 ký tự.")).toBeInTheDocument();
    expect(pw).toHaveFocus();

    await user.type(pw, "-hon-nua");
    expect(screen.getByText("Đủ tối thiểu 8 ký tự")).toBeInTheDocument();
    await user.type(repeat, "khac-hoan-toan");
    await user.click(screen.getByRole("button", { name: "Lưu mật khẩu" }));
    expect(screen.getByText("Hai mật khẩu chưa khớp.")).toBeInTheDocument();
    expect(repeat).toHaveFocus();
    expect(nav.finishRecovery).not.toHaveBeenCalled();

    await user.clear(repeat);
    await user.type(repeat, "ngan-hon-nua");
    expect(screen.getByText("Hai mật khẩu đã khớp")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Lưu mật khẩu" }));
    await screen.findByText("Đã đổi mật khẩu");
    expect(nav.finishRecovery).toHaveBeenCalled();
  });

  it("shows the expired-link error with Gửi lại liên kết", async () => {
    const user = userEvent.setup();
    const { nav } = renderReset(link("het-han"));
    expect(await screen.findByRole("alert")).toHaveTextContent("Liên kết đã hết hạn");
    expect(screen.queryByLabelText("Mật khẩu mới")).toBeNull();
    await user.click(screen.getByRole("button", { name: "Gửi lại liên kết" }));
    expect(nav.navigate).toHaveBeenCalledWith("forgot");
    await user.click(screen.getByRole("button", { name: "Về đăng nhập" }));
    expect(nav.finishRecovery).toHaveBeenCalled();
  });

  it("treats a missing link as expired", async () => {
    renderReset(null);
    expect(await screen.findByRole("alert")).toHaveTextContent("Liên kết đã hết hạn");
  });
});
