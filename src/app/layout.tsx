import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Senus PLC — Board Report",
  description: "AI-native board report for Senus PLC, built on audited FY2024/FY2025 financials.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
