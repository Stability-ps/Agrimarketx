import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AgriMarketX",
  description: "Agricultural marketplace and farm management platform for Africa"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
