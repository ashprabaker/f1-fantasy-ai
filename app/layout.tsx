import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/utilities/providers";
import { Analytics } from "@vercel/analytics/react";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "F1 Fantasy Team Advisor",
  description: "Get AI-powered advice for your F1 Fantasy team",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Don't try to create a profile on every request
  // This is causing errors since the column structure doesn't match

  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${inter.variable} antialiased`}>
        <Providers>
          {children}
        </Providers>
        <Analytics />
      </body>
    </html>
  );
}
