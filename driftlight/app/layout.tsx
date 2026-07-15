import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "driftlight",
  description: "a story that shapes itself",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
