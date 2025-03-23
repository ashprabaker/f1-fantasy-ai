"use client"

import { motion } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { ArrowRight, LineChart, Zap, Trophy, Rocket } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";

export default function HeroSection() {
  const { userId } = useAuth();
  
  return (
    <div className="pt-32 pb-20 px-6 md:px-12 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto"
        >
          <div className="inline-flex items-center rounded-full px-4 py-1 bg-[#E10600]/10 text-[#E10600] text-sm font-medium mb-6">
            <span className="animate-pulse h-2 w-2 rounded-full bg-[#E10600] mr-2"></span>
            2025 Season Live Now
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
            AI-Powered{" "}
            <span className="text-[#E10600]">F1 Fantasy</span>{" "}
            Advisor
          </h1>
          <p className="text-lg text-muted-foreground max-w-lg mx-auto mb-8">
            Make winning selections for the official F1 fantasy game with AI-powered recommendations based on real-time data and advanced analytics.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            {!userId ? (
              <>
                <Button className="bg-[#E10600] hover:bg-[#E10600]/90 racing-shadow text-white rounded-full px-6" asChild>
                  <Link href="/signup">Get Started
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="outline" className="border-[#E10600]/20 text-[#E10600] hover:bg-[#E10600]/10 rounded-full px-6" asChild>
                  <Link href="/login">
                    Log In
                  </Link>
                </Button>
              </>
            ) : (
              <Button className="bg-[#E10600] hover:bg-[#E10600]/90 racing-shadow text-white rounded-full px-6" asChild>
                <Link href="/dashboard">
                  Go to Dashboard
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            )}
          </div>
          <div className="flex items-center gap-4 pt-6 text-sm text-muted-foreground justify-center flex-wrap">
            <div className="flex items-center">
              <div className="h-5 w-5 rounded-full bg-[#E10600]/10 flex items-center justify-center mr-2">
                <Zap className="h-3 w-3 text-[#E10600]" />
              </div>
              Top-Tier AI Models
            </div>
            <div className="flex items-center">
              <div className="h-5 w-5 rounded-full bg-[#E10600]/10 flex items-center justify-center mr-2">
                <LineChart className="h-3 w-3 text-[#E10600]" />
              </div>
              AI Insights
            </div>
            <div className="flex items-center">
              <div className="h-5 w-5 rounded-full bg-[#E10600]/10 flex items-center justify-center mr-2">
                <Rocket className="h-3 w-3 text-[#E10600]" />
              </div>
              Race-Day Strategy
            </div>
            <div className="flex items-center">
              <div className="h-5 w-5 rounded-full bg-[#E10600]/10 flex items-center justify-center mr-2">
                <Trophy className="h-3 w-3 text-[#E10600]" />
              </div>
              League Domination
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
} 