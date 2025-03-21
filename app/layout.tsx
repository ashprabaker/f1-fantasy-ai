import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/utilities/providers";
import { auth } from "@clerk/nextjs/server";
import { createProfileAction, getProfileAction } from "@/actions/db/profiles-actions";

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
  const { userId } = await auth();
  
  if (userId) {
    // Check if profile exists first before creating
    const { isSuccess, data } = await getProfileAction(userId);
    
    if (!isSuccess || !data) {
      // Only create profile if it doesn't exist
      await createProfileAction({
        userId,
        membership: "free"
      });
    }
  }
  
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} antialiased`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
