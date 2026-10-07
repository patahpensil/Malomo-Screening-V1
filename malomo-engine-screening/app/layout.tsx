import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Malomo Screening V1",
  description: "Workspace screening crypto futures, riset deterministik, jurnal keputusan dan paper trading.",
  applicationName: "Malomo Screening V1",
  appleWebApp: {capable: true, title: "Malomo", statusBarStyle: "black-translucent"},
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/icons/malomo-192.png",
    apple: "/icons/malomo-180.png",
  },
};

export const viewport: Viewport = {width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#111518"};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <head><link rel="manifest" href="/manifest.webmanifest" crossOrigin="use-credentials" /></head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
