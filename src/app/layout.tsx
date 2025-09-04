import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Inter, Cairo } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Providers } from "@/components/providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const cairo = Cairo({
  subsets: ["arabic"],
  variable: "--font-cairo",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "نظام إدارة المصنع - ERP",
  description: "نظام إدارة المصنع المتكامل للمصانع الغذائية",
  keywords: ["ERP", "نظام إدارة المصنع", "المصانع الغذائية", "إدارة"],
  authors: [{ name: "فريق تطوير النظام" }],
  openGraph: {
    title: "نظام إدارة المصنع",
    description: "نظام إدارة المصنع المتكامل للمصانع الغذائية",
    url: "https://localhost:3000",
    siteName: "نظام إدارة المصنع",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "نظام إدارة المصنع",
    description: "نظام إدارة المصنع المتكامل للمصانع الغذائية",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${inter.variable} ${cairo.variable} antialiased bg-background text-foreground`}
      >
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
