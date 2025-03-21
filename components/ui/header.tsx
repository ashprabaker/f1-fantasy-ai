"use client"

import { UserButton } from "@clerk/nextjs"
import { ModeToggle } from "@/components/ui/mode-toggle"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

export function Header() {
  const pathname = usePathname()
  
  return (
    <header className="border-b">
      <div className="container mx-auto max-w-screen-xl flex h-16 items-center justify-between py-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="font-bold text-xl">F1 Advisor</Link>
          
          <nav className="hidden md:flex gap-6">
            <Link 
              href="/dashboard" 
              className={cn(
                "transition-colors hover:text-foreground/80", 
                pathname?.startsWith("/dashboard") ? "text-foreground font-medium" : "text-foreground/60"
              )}
            >
              Dashboard
            </Link>
            <Link 
              href="/pricing" 
              className={cn(
                "transition-colors hover:text-foreground/80", 
                pathname === "/pricing" ? "text-foreground font-medium" : "text-foreground/60"
              )}
            >
              Pricing
            </Link>
          </nav>
        </div>
        
        <div className="flex items-center gap-4">
          <ModeToggle />
          <UserButton afterSignOutUrl="/home" />
        </div>
      </div>
    </header>
  )
} 