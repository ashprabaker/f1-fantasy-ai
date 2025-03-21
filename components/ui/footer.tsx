"use server"

import Link from "next/link"

export async function Footer() {
  return (
    <footer className="border-t py-6 md:py-8">
      <div className="container mx-auto max-w-screen-xl flex flex-col items-center justify-between gap-4 md:flex-row">
        <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
          &copy; {new Date().getFullYear()} F1 Fantasy Team Advisor. All rights reserved.
        </p>
        <div className="flex gap-4">
          <Link 
            href="/terms" 
            className="text-sm text-muted-foreground underline underline-offset-4"
          >
            Terms
          </Link>
          <Link 
            href="/privacy" 
            className="text-sm text-muted-foreground underline underline-offset-4"
          >
            Privacy
          </Link>
        </div>
      </div>
    </footer>
  )
} 