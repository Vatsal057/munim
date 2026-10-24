import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0f172a",
};

export const metadata: Metadata = {
  title: "Munim — AI Munim for Small Businesses",
  description: "Tell it what happened. It tells you what to do. Get paid before you have to pay.",
  appleWebApp: {
    title: "Munim",
    statusBarStyle: "default",
    capable: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full bg-slate-900/5">
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased min-h-full text-slate-900 bg-[#f8fafc] selection:bg-amber-100 selection:text-amber-900`}
      >
        <div className="min-h-screen flex flex-col justify-between">
          <main className="flex-1">{children}</main>
        </div>
      </body>
    </html>
  );
}
