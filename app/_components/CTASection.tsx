"use client"

import { motion } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";

export default function CTASection() {
  const { userId } = useAuth();
  
  return (
    <div className="py-24 px-6 md:px-12">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
          className="rounded-2xl overflow-hidden relative"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-[#15151E] to-[#15151E]/95 z-0"></div>
          <div className="absolute inset-0 bg-[url('/grid-pattern.png')] bg-repeat opacity-10 z-0"></div>
          
          <div className="absolute top-0 right-0 transform translate-x-1/4 -translate-y-1/4 z-0">
            <div className="w-64 h-64 rounded-full bg-[#E10600]/20 filter blur-3xl"></div>
          </div>
          
          <div className="relative z-10 py-16 px-8 md:px-16 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to dominate your F1 Fantasy league?
            </h2>
            
            <p className="text-white/70 max-w-2xl mx-auto mb-8">
              Join thousands of F1 fans who are already using AI to build winning fantasy teams and climb the leaderboards
            </p>
            
            <div className="flex flex-wrap justify-center gap-4">
              {!userId ? (
                <>
                  <Button size="lg" className="bg-[#E10600] hover:bg-[#E10600]/90 text-white racing-shadow rounded-full px-8" asChild>
                    <Link href="/signup">
                      Get Started Free
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10 rounded-full px-8" asChild>
                    <Link href="/login">
                      Log In
                    </Link>
                  </Button>
                </>
              ) : (
                <Button size="lg" className="bg-[#E10600] hover:bg-[#E10600]/90 text-white racing-shadow rounded-full px-8" asChild>
                  <Link href="/dashboard">
                    Go to Dashboard
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
} 