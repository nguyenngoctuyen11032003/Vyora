import { AppShell } from "@/src/components/app/AppShell";

// The whole app is one client-side page: screens switch by state (no routes), so GitHub Pages needs
// no rewrites. See docs/ui-architecture.md.
export default function Home() {
  return <AppShell />;
}
