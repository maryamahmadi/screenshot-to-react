import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Screenshot to React",
  description:
    "Drop in a UI screenshot and get a live-rendered React + Tailwind component.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
