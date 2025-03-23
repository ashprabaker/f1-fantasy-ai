"use client"

import { motion } from 'framer-motion';
import FeatureCard from './FeatureCard';
import { Brain, TrendingUp, BarChart4, Gauge } from 'lucide-react';

export default function FeaturesSection() {
  const features = [
    {
      title: "AI Recommendations",
      description: "Get personalized team recommendations powered by advanced AI models trained on historical F1 data.",
      icon: <Brain className="h-6 w-6" />,
      color: "#E10600",
      delay: 0.1,
    },
    {
      title: "Performance Analysis",
      description: "Track driver and team performance trends to make data-driven decisions for your fantasy team.",
      icon: <TrendingUp className="h-6 w-6" />,
      color: "#0090D0",
      delay: 0.2,
    },
    {
      title: "Race Predictions",
      description: "Access detailed race predictions and qualifying forecasts for every Grand Prix weekend.",
      icon: <BarChart4 className="h-6 w-6" />,
      color: "#FFF200",
      delay: 0.3,
    },
    {
      title: "Budget Optimization",
      description: "Maximize your team's potential while staying within your budget constraints with AI-powered suggestions.",
      icon: <Gauge className="h-6 w-6" />,
      color: "#FF8700",
      delay: 0.4,
    }
  ];

  return (
    <div className="py-24 px-6 md:px-12">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl font-bold mb-4">Powered by AI</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Our AI-powered platform gives you everything you need to dominate your F1 Fantasy league
            </p>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <FeatureCard 
              key={index}
              title={feature.title}
              description={feature.description}
              icon={feature.icon}
              color={feature.color}
              delay={feature.delay}
            />
          ))}
        </div>
      </div>
    </div>
  );
} 