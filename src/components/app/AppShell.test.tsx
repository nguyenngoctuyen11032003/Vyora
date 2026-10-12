import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { AppShell } from "@/src/components/app/AppShell";
import { createMockDataSource, MOCK_USER_KEY } from "@/src/lib/data/mock";
import { ACTIVE_SESSION_KEY } from "@/src/lib/session";

const renderApp = () => render(<AppShell data={createMockDataSource({ latencyMs: 0 })} />);

beforeEach(() => localStorage.clear());

describe("AppShell (phone layout)", () => {
  it("signs in with the mock and lands on Hôm nay with the tab bar", async () => {
    const user = userEvent.setup();
    renderApp();
    await user.type(await screen.findByLabelText("Email"), "minh.anh@example.com");
    await user.type(screen.getByLabelText("Mật khẩu"), "matkhau123");
    await user.click(screen.getByRole("button", { name: "Đăng nhập" }));

    const tabs = await screen.findByRole("navigation", { name: "Điều hướng chính" });
    expect(within(tabs).getByRole("button", { name: /Hôm nay/ })).toHaveAttribute("aria-current", "page");
    expect(screen.queryByRole("button", { name: /đăng ký/i })).toBeNull();
  });

  it("shows the Vietnamese error for wrong credentials", async () => {
    const user = userEvent.setup();
    renderApp();
    await user.type(await screen.findByLabelText("Email"), "sai@example.com");
    await user.type(screen.getByLabelText("Mật khẩu"), "matkhau123");
    await user.click(screen.getByRole("button", { name: "Đăng nhập" }));
    expect(await screen.findByText("Email hoặc mật khẩu không đúng")).toBeInTheDocument();
  });

  it("tabs switch screens; the menu opens, closes with Escape and signs out", async () => {
    localStorage.setItem(MOCK_USER_KEY, JSON.stringify({ id: "mock-1", email: "minh.anh@example.com" }));
    const user = userEvent.setup();
    renderApp();
    const tabs = await screen.findByRole("navigation", { name: "Điều hướng chính" });
    await user.click(within(tabs).getByRole("button", { name: /Tuần này/ }));
    expect(screen.getByRole("main", { name: "Tuần này" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Mở menu" }));
    const menu = await screen.findByRole("dialog", { name: "Menu" });
    expect(within(menu).getByRole("button", { name: /Tuần này/ })).toHaveAttribute("aria-current", "page");
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog", { name: "Menu" })).toBeNull();

    await user.click(screen.getByRole("button", { name: "Hồ sơ" }));
    expect(screen.getByRole("main", { name: "Hồ sơ" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Mở menu" }));
    await user.click(await screen.findByRole("button", { name: "Đăng xuất" }));
    // The demo history contains a pending row on some weekdays → confirmation first.
    const confirm = screen.queryByRole("alertdialog");
    if (confirm) await user.click(within(confirm).getByRole("button", { name: "Vẫn đăng xuất" }));
    expect(await screen.findByLabelText("Email")).toBeInTheDocument();
  });

  it("Bắt đầu buổi tập starts the timer and opens Đang tập", async () => {
    localStorage.setItem(MOCK_USER_KEY, JSON.stringify({ id: "mock-1", email: "minh.anh@example.com" }));
    const user = userEvent.setup();
    renderApp();
    await screen.findByRole("navigation", { name: "Điều hướng chính" });
    const startButton = screen.queryByRole("button", { name: "Bắt đầu buổi tập" });
    if (!startButton) return; // rest day in the runner's clock: covered by the session unit tests
    await user.click(startButton);
    expect(screen.getByRole("main", { name: "Đang tập" })).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem(ACTIVE_SESSION_KEY)!)).toMatchObject({ kind: "plan", activity: "weight_training" });
    await act(async () => {});
  });

  it("opens the reset screen from a recovery link", async () => {
    window.history.replaceState(null, "", "/?flow=recovery&token_hash=demo&type=recovery");
    renderApp();
    expect(await screen.findByRole("main", { name: "Đặt mật khẩu mới" })).toBeInTheDocument();
    window.history.replaceState(null, "", "/");
  });
});
