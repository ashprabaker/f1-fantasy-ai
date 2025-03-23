"use client"

import { ReactNode } from "react";
import { motion } from "framer-motion";

interface FeatureCardProps {
  title: string;
  description: string;
  icon: ReactNode;
  color: string;
  delay?: number;
}

export default function FeatureCard({
  title,
  description,
  icon,
  color,
  delay = 0
}: FeatureCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay }}
      className="group relative overflow-hidden rounded-xl border shadow-sm hover:shadow transition-all duration-300"
    >
      <div className="p-6">
        <div 
          className="mb-4 inline-flex items-center justify-center rounded-lg p-2"
          style={{ backgroundColor: `${color}15` }}
        >
          <div style={{ color }}>{icon}</div>
        </div>
        <h3 className="text-xl font-bold mb-2">{title}</h3>
        <p className="text-muted-foreground text-sm">{description}</p>
      </div>
      <div 
        className="absolute top-0 right-0 h-20 w-20 -translate-y-1/2 translate-x-1/2 rounded-full opacity-20 transition-all duration-300 group-hover:opacity-30" 
        style={{ backgroundColor: color }}
      />
    </motion.div>
  );
} 