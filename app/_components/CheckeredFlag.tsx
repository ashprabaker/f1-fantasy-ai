"use client"

import { motion } from 'framer-motion';

interface CheckeredFlagProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function CheckeredFlag({ className = "", size = 'md' }: CheckeredFlagProps) {
  const sizes = {
    sm: { width: 40, height: 30 },
    md: { width: 60, height: 45 },
    lg: { width: 80, height: 60 },
  };

  const { width, height } = sizes[size];
  
  return (
    <motion.div
      className={`relative overflow-hidden ${className}`}
      style={{ width, height }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
    >
      <div 
        className="absolute inset-0 animate-checkered-flag bg-checkered"
      />
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-black/80 via-transparent to-transparent"
        animate={{ 
          rotate: [0, 5, 0, -5, 0],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "easeInOut",
        }}
      />
      <div className="absolute bottom-0 left-0 w-full h-1/4 bg-gradient-to-t from-black to-transparent opacity-30" />
    </motion.div>
  );
} 