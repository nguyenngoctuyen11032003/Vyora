import type { Metadata, Viewport } from "next";
import { Barlow_Condensed, Be_Vietnam_Pro, JetBrains_Mono } from "next/font/google";
import { asset } from "@/src/lib/env";
import "./globals.css";

const bodyFont = Be_Vietnam_Pro({
  variable: "--font-body",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const displayFont = Barlow_Condensed({
  variable: "--font-display",
  subsets: ["latin", "vietnamese"],
  weight: ["500", "600", "700"],
  display: "swap",
});

const monoFont = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Gym Training Plan | Giáo án tập 12 tuần",
  description:
    "Website xem lịch tập gym trong tuần, danh sách bài tập và video hướng dẫn động tác.",
  // Brand mark and icon set are shared with Fitora (copied from Fitora/public).
  icons: {
    icon: [
      { url: asset("/favicon.ico"), sizes: "48x48" },
      { url: asset("/icons/favicon-32.png"), type: "image/png", sizes: "32x32" },
      { url: asset("/icons/favicon-16.png"), type: "image/png", sizes: "16x16" },
    ],
    shortcut: [asset("/favicon.ico")],
    apple: [{ url: asset("/icons/apple-touch-icon.png"), type: "image/png", sizes: "180x180" }],
  },
  manifest: asset("/manifest.webmanifest"),
  openGraph: {
    title: "Gym Training Plan | Giáo án tập 12 tuần",
    description: "Lịch tập gym trong tuần và video hướng dẫn động tác.",
    type: "website",
    locale: "vi_VN",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0a0b0a",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      className={`${bodyFont.variable} ${displayFont.variable} ${monoFont.variable} h-full antialiased`}
    >
      <body className="min-h-full">{children}</body>
    </html>
  );
}
