"use client";

import { ForgotPasswordScreen } from "@/src/components/screens/ForgotPasswordScreen";
import { LoginScreen } from "@/src/components/screens/LoginScreen";
import { ProfileScreen } from "@/src/components/screens/ProfileScreen";
import { ResetPasswordScreen } from "@/src/components/screens/ResetPasswordScreen";
import { SessionScreen } from "@/src/components/screens/SessionScreen";
import { TodayScreen } from "@/src/components/screens/TodayScreen";
import { WeekScreen } from "@/src/components/screens/WeekScreen";
import { workoutPlan } from "@/src/data/workout-plan";
import type { RecoveryParams, ScreenId } from "@/src/types/gym";

/** Maps a ScreenId to its component with its final props. The only place screens are instantiated. */
export function ScreenView({ screen, recovery }: { screen: ScreenId; recovery: RecoveryParams | null }) {
  switch (screen) {
    case "login":
      return <LoginScreen />;
    case "forgot":
      return <ForgotPasswordScreen />;
    case "reset":
      return <ResetPasswordScreen recovery={recovery} />;
    case "today":
      return <TodayScreen plan={workoutPlan} />;
    case "session":
      return <SessionScreen plan={workoutPlan} />;
    case "week":
      return <WeekScreen />;
    case "profile":
      return <ProfileScreen />;
  }
}

export const SCREEN_LABELS: Record<ScreenId, string> = {
  login: "Đăng nhập",
  forgot: "Quên mật khẩu",
  reset: "Đặt mật khẩu mới",
  today: "Hôm nay",
  session: "Đang tập",
  week: "Tuần này",
  profile: "Hồ sơ",
};
