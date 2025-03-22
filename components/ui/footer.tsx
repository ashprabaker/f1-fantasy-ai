"use server"

import Link from "next/link"

export async function Footer() {
  return (
    <footer className="border-t py-6 md:py-8">
      <div className="container mx-auto max-w-screen-xl flex flex-col items-center justify-center gap-4">
        <p className="text-center text-[10px] leading-tight text-muted-foreground max-w-2xl">
          OpenF1 is an unofficial project and is not associated in any way with the Formula 1 companies. F1, FORMULA ONE, FORMULA 1, FIA FORMULA ONE WORLD CHAMPIONSHIP, GRAND PRIX and related marks are trade marks of Formula One Licensing B.V.
        </p>
      </div>
    </footer>
  )
} 