"use server"

import { Header } from "@/components/ui/header"
import { Footer } from "@/components/ui/footer"
import { Sidebar } from "./_components/sidebar"
import { auth } from "@clerk/nextjs/server"
import { getProfileAction } from "@/actions/db/profiles-actions"
import { redirect } from "next/navigation"

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  const { userId } = await auth()
  
  if (!userId) {
    redirect("/login")
  }
  
  // Get the profile and check if user is pro
  const { data: profile, isSuccess } = await getProfileAction(userId)
  
  // If user is not a pro member or profile doesn't exist, redirect to pricing
  if (!isSuccess || !profile || profile.membership !== "pro") {
    redirect("/pricing")
  }
  
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <div className="flex flex-1 mx-auto w-full">
        <Sidebar />
        <main className="flex-1 p-6 md:p-10 overflow-auto">
          <div className="mx-auto max-w-4xl">
            {children}
          </div>
        </main>
      </div>
      <Footer />
    </div>
  )
} 