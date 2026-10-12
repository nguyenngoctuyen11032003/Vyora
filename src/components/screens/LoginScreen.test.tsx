import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { renderScreen } from "@/src/components/app/testing";
import { LoginScreen } from "@/src/components/screens/LoginScreen";
import { MOCK_USER_KEY } from "@/src/lib/data/mock";

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

const renderLogin = () => renderScreen(<LoginScreen />, { user: null, screen: "login" });

describe("LoginScreen", () => {
  it("shows a skeleton while the session restores, then the form", async () => {
    renderLogin();
    expect(screen.getByText("Đang khôi phục phiên đăng nhập…")).toBeInTheDocument();
    expect(screen.queryByLabelText("Email")).toBeNull();
    expect(await screen.findByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Mật khẩu")).toHaveAttribute("type", "password");
  });

  it("has the title, no account sub line and no sign-up link or button", async () => {
    renderLogin();
    await screen.findByLabelText("Email");
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent("Vyora");
    expect(screen.queryByText(/Dùng tài khoản|Note_mytasks/)).toBeNull();
    expect(screen.queryByRole("link", { name: /đăng ký|tạo tài khoản/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /đăng ký|tạo tài khoản/i })).toBeNull();
    expect(screen.queryByText(/đăng ký/i)).toBeNull();
  });

  it("toggles the password visibility", async () => {
    const user = userEvent.setup();
    renderLogin();
    const pw = await screen.findByLabelText("Mật khẩu");
    await user.click(screen.getByRole("button", { name: "Hiện mật khẩu" }));
    expect(pw).toHaveAttribute("type", "text");
    expect(screen.getByRole("button", { name: "Ẩn mật khẩu" })).toHaveAttribute("aria-pressed", "true");
  });

  it("validates the fields in Vietnamese and focuses the first invalid one", async () => {
    const user = userEvent.setup();
    renderLogin();
    const email = await screen.findByLabelText("Email");
    await user.click(screen.getByRole("button", { name: "Đăng nhập" }));
    expect(screen.getByText("Hãy nhập email.")).toBeInTheDocument();
    expect(screen.getByText("Hãy nhập mật khẩu.")).toBeInTheDocument();
    expect(email).toHaveFocus();
    expect(email).toHaveAttribute("aria-invalid", "true");

    await user.type(email, "khong-hop-le");
    expect(screen.queryByText("Hãy nhập email.")).toBeNull();
    await user.click(screen.getByRole("button", { name: "Đăng nhập" }));
    expect(screen.getByText("Địa chỉ email không hợp lệ.")).toBeInTheDocument();
  });

  it("shows the wrong-credentials error", async () => {
    const user = userEvent.setup();
    renderLogin();
    await user.type(await screen.findByLabelText("Email"), "sai@example.com");
    await user.type(screen.getByLabelText("Mật khẩu"), "matkhau123");
    await user.click(screen.getByRole("button", { name: "Đăng nhập" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Email hoặc mật khẩu không đúng");
    expect(localStorage.getItem(MOCK_USER_KEY)).toBeNull();
  });

  it("shows the offline error", async () => {
    const user = userEvent.setup();
    renderLogin();
    await user.type(await screen.findByLabelText("Email"), "offline@example.com");
    await user.type(screen.getByLabelText("Mật khẩu"), "matkhau123");
    await user.click(screen.getByRole("button", { name: "Đăng nhập" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Không có kết nối mạng");
  });

  it("signs in with valid credentials", async () => {
    const user = userEvent.setup();
    renderLogin();
    await user.type(await screen.findByLabelText("Email"), "minh.anh@example.com");
    await user.type(screen.getByLabelText("Mật khẩu"), "matkhau123");
    await user.click(screen.getByRole("button", { name: "Đăng nhập" }));
    await waitFor(() => expect(JSON.parse(localStorage.getItem(MOCK_USER_KEY) ?? "null")).toMatchObject({ email: "minh.anh@example.com" }));
  });

  it("opens Quên mật khẩu and carries the typed email over", async () => {
    const user = userEvent.setup();
    const { nav } = renderLogin();
    await user.type(await screen.findByLabelText("Email"), "minh.anh@example.com");
    await user.click(screen.getByRole("button", { name: "Quên mật khẩu?" }));
    expect(nav.navigate).toHaveBeenCalledWith("forgot");
    expect(sessionStorage.getItem("vyora.auth.emailDraft")).toBe("minh.anh@example.com");
  });
});
