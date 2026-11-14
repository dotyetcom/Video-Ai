import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "KinoFrame — AI Video Creation Studio",
  description: "Direct, animate, and export custom motion videos from text prompts and reference frames.",
  openGraph: {
    title: "KinoFrame — AI Video Creation Studio",
    description: "Direct, animate, and export custom motion videos from text prompts and reference frames.",
    type: "website",
  },
  icons: {
    icon: "/favicon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@500;600;700&family=JetBrains+Mono:wght@400;500&family=Plus+Jakarta+Sans:wght@400;500;600&display=swap"
        />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
