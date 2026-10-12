import { act, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderScreen } from "@/src/components/app/testing";
import { ForgotPasswordScreen } from "@/src/components/screens/ForgotPasswordScreen";

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});
afterEach(() => vi.useRealTimers());

const renderForgot = () => renderScreen(<ForgotPasswordScreen />, { user: null, screen: "forgot" });

describe("ForgotPasswordScreen", () => {
  it("sends the link, shows the neutral message and locks resending for 60 s", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderForgot();
    await user.type(screen.getByLabelText("Email"), "ai.do@example.com");
    await user.click(screen.getByRole("button", { name: "Gửi liên kết" }));

    expect(await screen.findByText("Nếu email tồn tại, liên kết đặt lại đã được gửi")).toBeInTheDocument();
    const locked = screen.getByRole("button", { name: "Gửi lại sau 60 giây" });
    expect(locked).toHaveAttribute("aria-disabled", "true");

    act(() => vi.advanceTimersByTime(20_000));
    expect(screen.getByRole("button", { name: /Gửi lại sau 4\d giây/ })).toBeInTheDocument();

    act(() => vi.advanceTimersByTime(41_000));
    const resend = screen.getByRole("button", { name: "Gửi lại liên kết" });
    expect(resend).not.toHaveAttribute("aria-disabled");
    await user.click(resend);
    expect(await screen.findByRole("button", { name: "Gửi lại sau 60 giây" })).toBeInTheDocument();
  });

  it("does not resend while locked", async () => {
    const user = userEvent.setup();
    const { nav } = renderForgot();
    await user.type(screen.getByLabelText("Email"), "ai.do@example.com");
    await user.click(screen.getByRole("button", { name: "Gửi liên kết" }));
    const locked = await screen.findByRole("button", { name: /Gửi lại sau \d+ giây/ });
    await user.click(locked);
    expect(screen.getByRole("button", { name: /Gửi lại sau \d+ giây/ })).toBeInTheDocument();
    expect(nav.navigate).not.toHaveBeenCalled();
  });

  it("validates the email and reports the offline case", async () => {
    const user = userEvent.setup();
    renderForgot();
    await user.click(screen.getByRole("button", { name: "Gửi liên kết" }));
    expect(screen.getByText("Hãy nhập email.")).toBeInTheDocument();

    await user.type(screen.getByLabelText("Email"), "offline@example.com");
    await user.click(screen.getByRole("button", { name: "Gửi liên kết" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Không có kết nối mạng");
    expect(screen.queryByText(/Nếu email tồn tại/)).toBeNull();
  });

  it("pre-fills the email typed on the login and goes back", async () => {
    sessionStorage.setItem("vyora.auth.emailDraft", "minh.anh@example.com");
    const user = userEvent.setup();
    const { nav } = renderForgot();
    expect(screen.getByLabelText("Email")).toHaveValue("minh.anh@example.com");
    await user.click(screen.getByRole("button", { name: "Quay lại đăng nhập" }));
    expect(nav.back).toHaveBeenCalled();
  });
});
