"use client"

import { motion } from 'framer-motion';

interface RaceTrackProps {
  className?: string;
}

export default function RaceTrack({ className = "" }: RaceTrackProps) {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <svg
        viewBox="0 0 300 150"
        className="w-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        <motion.path
          d="M20,75 C20,20 100,20 150,20 C200,20 280,20 280,75 C280,130 200,130 150,130 C100,130 20,130 20,75 Z"
          fill="none"
          stroke="rgba(225, 6, 0, 0.4)"
          strokeWidth="12"
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
        />
        
        <motion.path
          d="M20,75 C20,20 100,20 150,20 C200,20 280,20 280,75 C280,130 200,130 150,130 C100,130 20,130 20,75 Z"
          fill="none"
          stroke="rgba(225, 6, 0, 0.8)"
          strokeWidth="2"
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1.8, ease: "easeInOut" }}
        />
        
        {/* Start/Finish line */}
        <motion.rect
          x="18" y="70"
          width="4" height="10"
          fill="#fff"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 0.3 }}
        />
        
        {/* Start position dots */}
        <motion.g
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.8, duration: 0.5 }}
        >
          {[0, 1, 2, 3, 4].map((i) => (
            <circle key={i} cx={35 + i * 15} cy="75" r="2" fill="white" />
          ))}
        </motion.g>
      </svg>
    </div>
  );
} 