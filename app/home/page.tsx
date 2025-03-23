"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@clerk/nextjs"
import HeroSection from "@/app/_components/HeroSection"
import FeaturesSection from "@/app/_components/FeaturesSection"
import HowItWorksSection from "@/app/_components/HowItWorksSection"
import TestimonialsSection from "@/app/_components/TestimonialsSection"
import CTASection from "@/app/_components/CTASection"

export default function HomePage() {
  const { isLoaded } = useAuth()
  const [isClient, setIsClient] = useState(false)
  
  // This ensures hydration mismatch is avoided
  useEffect(() => {
    setIsClient(true)
  }, [])
  
  if (!isClient || !isLoaded) {
    return null
  }
  
  return (
    <div className="relative">
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <TestimonialsSection />
      <CTASection />
    </div>
  )
} 