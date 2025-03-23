"use client"

import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";

const testimonials = [
  {
    name: "Alex Hamilton",
    role: "Fantasy League Winner",
    text: "Since using F1 Fantasy Advisor, I've gone from mid-table to winning my league two races in a row. The AI recommendations are spot on!",
    avatar: "/testimonials/avatar-1.png",
    rating: 5,
    delay: 0.1,
  },
  {
    name: "Sophia Verstappen",
    role: "F1 Enthusiast",
    text: "I used to waste hours analyzing stats. Now the AI does it for me, and I'm getting better results than ever before.",
    avatar: "/testimonials/avatar-2.png",
    rating: 5,
    delay: 0.2,
  },
  {
    name: "Carlos Norris",
    role: "Fantasy Team Manager",
    text: "The budget optimization feature is incredible. I've managed to fit drivers I thought were out of my price range and still stay under budget.",
    avatar: "/testimonials/avatar-3.png",
    rating: 4,
    delay: 0.3,
  },
  {
    name: "Lando Perez",
    role: "F1 Fan Club President",
    text: "We use F1 Fantasy Advisor for our club's fantasy league. It's transformed how we play and made the experience even more competitive.",
    avatar: "/testimonials/avatar-4.png",
    rating: 5,
    delay: 0.4,
  },
];

export default function TestimonialsSection() {
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
            <h2 className="text-3xl font-bold mb-4">What Our Users Say</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Join thousands of F1 fans who are already dominating their fantasy leagues
            </p>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: testimonial.delay }}
            >
              <Card className="h-full border-[#E10600]/10 bg-card/50 backdrop-blur-sm hover:border-[#E10600]/30 transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-[#E10600] text-[#E10600]" />
                    ))}
                    {[...Array(5 - testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 text-muted-foreground/30" />
                    ))}
                  </div>
                  
                  <blockquote className="text-sm mb-6">
                    &ldquo;{testimonial.text}&rdquo;
                  </blockquote>
                  
                  <div className="flex items-center mt-auto">
                    <div className="h-10 w-10 rounded-full bg-[#E10600]/10 flex items-center justify-center text-[#E10600] font-semibold">
                      {testimonial.name.charAt(0)}
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium">{testimonial.name}</p>
                      <p className="text-xs text-muted-foreground">{testimonial.role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
} 