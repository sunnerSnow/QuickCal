import type { Metadata } from "next";
import { Huninn, Josefin_Sans } from "next/font/google";
import "./globals.css";

// Huninn has no CJK subset option; Google's unicode-range CSS still serves the CJK glyphs on demand
const huninn = Huninn({
  variable: "--font-huninn",
  weight: "400",
  subsets: ["latin"],
  preload: false,
  // next/font has no metrics for Huninn to build an adjusted fallback from
  adjustFontFallback: false,
  fallback: ["Noto Sans TC", "sans-serif"],
});

const josefin = Josefin_Sans({
  variable: "--font-josefin",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "QuickCal",
  description: "快速新增 Google 日曆事件",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="zh-Hant" className={`${huninn.variable} ${josefin.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">{children}</body>
    </html>
  );
}
