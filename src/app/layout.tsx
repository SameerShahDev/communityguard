import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Igone - AI-Powered Community Management",
  description: "AI-powered Discord community management and churn prevention",
  icons: {
    icon: [
      { url: '/icon.jpeg', sizes: '32x32', type: 'image/jpeg' },
      { url: '/icon.jpeg', sizes: '16x16', type: 'image/jpeg' },
      { url: '/icon.jpeg', sizes: '192x192', type: 'image/jpeg' },
      { url: '/icon.jpeg', sizes: '512x512', type: 'image/jpeg' },
    ],
    shortcut: '/icon.jpeg',
    apple: [
      { url: '/icon.jpeg', sizes: '180x180', type: 'image/jpeg' },
      { url: '/icon.jpeg', sizes: '152x152', type: 'image/jpeg' },
      { url: '/icon.jpeg', sizes: '120x120', type: 'image/jpeg' },
    ],
    other: [
      {
        rel: 'mask-icon',
        url: '/icon.jpeg',
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
      </body>
    </html>
  );
}
