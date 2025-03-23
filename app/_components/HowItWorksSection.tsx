"use client"

import { motion } from 'framer-motion';
import { Users, Search, Award, ChevronRight } from 'lucide-react';
import RaceTrack from './RaceTrack';

export default function HowItWorksSection() {
  const steps = [
    {
      title: "Create Your Team",
      description: "Set up your F1 Fantasy team with your initial selection of drivers and constructors.",
      icon: <Users className="h-5 w-5" />,
      delay: 0.1,
    },
    {
      title: "Get AI Insights",
      description: "Our AI analyzes performance data, track conditions, and historical results to provide recommendations.",
      icon: <Search className="h-5 w-5" />,
      delay: 0.2,
    },
    {
      title: "Optimize & Win",
      description: "Apply our suggestions to optimize your team and climb the leaderboards for each race.",
      icon: <Award className="h-5 w-5" />,
      delay: 0.3,
    },
  ];

  return (
    <div className="py-24 px-6 md:px-12 relative overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl font-bold mb-4">How It Works</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Our AI-powered platform is designed to make F1 Fantasy easy and successful
            </p>
          </motion.div>
        </div>

        <div className="relative">
          {/* The race track visual element in the center */}
          <div className="hidden lg:block absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] pointer-events-none z-0">
            <RaceTrack />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: step.delay }}
                className="relative"
              >
                <div className="bg-card rounded-xl p-6 border shadow-sm relative z-10">
                  <div className="mb-4 flex items-center">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E10600]/10 text-[#E10600]">
                      {step.icon}
                    </div>
                    <span className="ml-3 text-lg font-semibold">{step.title}</span>
                  </div>
                  <p className="text-muted-foreground text-sm">{step.description}</p>
                </div>
                
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 right-0 -translate-y-1/2 translate-x-1/2 z-20">
                    <div className="bg-[#E10600]/10 text-[#E10600] h-8 w-8 rounded-full flex items-center justify-center">
                      <ChevronRight className="h-5 w-5" />
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 