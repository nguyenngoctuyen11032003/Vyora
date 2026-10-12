import type { Metadata, Viewport } from "next";
import { Albert_Sans } from "next/font/google";
import { asset } from "@/src/lib/env";
import "./globals.css";

const albertSans = Albert_Sans({
  variable: "--font-albert",
  subsets: ["latin", "latin-ext"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Vyora | Giáo án, bấm giờ và calo",
  description: "Giáo án tập gym theo ngày, video hướng dẫn, bấm giờ buổi tập và ước lượng calo đồng bộ với Fitora.",
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
    title: "Vyora",
    description: "Giáo án tập gym, bấm giờ buổi tập và calo đồng bộ với Fitora.",
    type: "website",
    locale: "vi_VN",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0a0e1c",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className={`${albertSans.variable} h-full antialiased`}>
      <body className="min-h-full font-sans">{children}</body>
    </html>
  );
}
