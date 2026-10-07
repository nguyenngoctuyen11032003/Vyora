import type { Metadata, Viewport } from "next";
import { Barlow_Condensed, Be_Vietnam_Pro, JetBrains_Mono } from "next/font/google";
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
  icons: {
    icon: [{ url: "/image/logo.png", type: "image/png" }],
    shortcut: ["/image/logo.png"],
    apple: [{ url: "/image/logo.png", type: "image/png" }],
  },
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
