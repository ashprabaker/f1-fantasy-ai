"use server"

import { Button } from "@/components/ui/button"
import Link from "next/link"
import { auth } from "@clerk/nextjs/server"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, Brain, Trophy, TrendingUp, Gauge, SparkleIcon, Zap, Flag } from "lucide-react"
import Image from "next/image"

export default async function HomePage() {
  // Try to get userId, but handle case where middleware is not set up
  let userId: string | null = null;
  try {
    const session = await auth();
    userId = session?.userId || null;
  } catch (error) {
    console.error("Auth error:", error);
    // Continue without userId
  }
  
  return (
    <div className="relative">
      {/* Hero section */}
      <div className="relative">
        <div className="container mx-auto flex flex-col items-center justify-center py-24 text-center">
          <Badge className="mb-6 px-4 py-2 text-base font-medium animate-fade-in backdrop-blur-sm bg-white/10" variant="outline">
            <SparkleIcon className="mr-1 h-4 w-4 text-red-500" /> Powered by AI
          </Badge>
          
          <h1 className="animate-fade-up text-4xl font-bold tracking-tight sm:text-6xl md:text-7xl bg-clip-text text-transparent bg-gradient-to-r from-red-500 via-orange-400 to-red-600">
            F1 Fantasy Team Advisor
          </h1>
          
          <p className="mt-6 text-xl text-muted-foreground max-w-[600px] animate-fade-up animation-delay-150">
            Get AI-powered advice for your F1 Fantasy team and maximize your points this season
          </p>
          
          <div className="mt-10 flex flex-wrap gap-4 justify-center animate-fade-up animation-delay-300">
            {!userId ? (
              <>
                <Button asChild size="lg" className="px-8 font-medium bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-600 shadow-lg hover:shadow-xl transition-all">
                  <Link href="/login">Log In</Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="px-8 font-medium border-red-500/50 text-red-500 hover:bg-red-500/10 hover:text-red-400">
                  <Link href="/signup">Sign Up Free</Link>
                </Button>
              </>
            ) : (
              <Button asChild size="lg" className="px-8 font-medium bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-600 shadow-lg hover:shadow-xl transition-all">
                <Link href="/dashboard">Go to Dashboard</Link>
              </Button>
            )}
          </div>
        </div>
      </div>
      
      {/* Features section */}
      <div className="container mx-auto max-w-screen-xl py-20">
        <h2 className="text-3xl font-bold text-center mb-4">Why Use F1 Fantasy Advisor?</h2>
        <p className="text-muted-foreground text-center max-w-2xl mx-auto mb-12">Our AI-powered platform gives you the competitive edge in your fantasy league</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Card className="border-red-500/20 bg-gradient-to-br from-background to-red-950/5 backdrop-blur-sm hover:shadow-md hover:shadow-red-500/5 transition-all duration-300 overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/10 rounded-bl-full -translate-y-1/2 translate-x-1/2 group-hover:bg-red-500/20 transition-all"></div>
            <CardHeader>
              <CardTitle className="flex items-center text-red-500">
                <Brain className="mr-2 h-5 w-5" />
                AI Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Get personalized team recommendations based on performance data, budget constraints, and upcoming races.
              </p>
            </CardContent>
          </Card>
          
          <Card className="border-orange-500/20 bg-gradient-to-br from-background to-orange-950/5 backdrop-blur-sm hover:shadow-md hover:shadow-orange-500/5 transition-all duration-300 overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/10 rounded-bl-full -translate-y-1/2 translate-x-1/2 group-hover:bg-orange-500/20 transition-all"></div>
            <CardHeader>
              <CardTitle className="flex items-center text-orange-500">
                <TrendingUp className="mr-2 h-5 w-5" />
                Performance Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Analyze driver and constructor performance trends to make data-driven decisions.
              </p>
            </CardContent>
          </Card>
          
          <Card className="border-yellow-500/20 bg-gradient-to-br from-background to-yellow-950/5 backdrop-blur-sm hover:shadow-md hover:shadow-yellow-500/5 transition-all duration-300 overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-500/10 rounded-bl-full -translate-y-1/2 translate-x-1/2 group-hover:bg-yellow-500/20 transition-all"></div>
            <CardHeader>
              <CardTitle className="flex items-center text-yellow-500">
                <Gauge className="mr-2 h-5 w-5" />
                Budget Optimization
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Maximize your team's potential while staying within your budget constraints.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Stats section */}
      <div className="container mx-auto max-w-screen-xl py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
          <div className="bg-gradient-to-br from-background to-red-950/5 backdrop-blur-sm border border-red-500/10 rounded-lg p-6 text-center">
            <Zap className="h-8 w-8 text-red-500 mx-auto mb-2" />
            <p className="text-3xl font-bold text-red-500">250+</p>
            <p className="text-sm text-muted-foreground">Race Analyses</p>
          </div>
          <div className="bg-gradient-to-br from-background to-orange-950/5 backdrop-blur-sm border border-orange-500/10 rounded-lg p-6 text-center">
            <Trophy className="h-8 w-8 text-orange-500 mx-auto mb-2" />
            <p className="text-3xl font-bold text-orange-500">98%</p>
            <p className="text-sm text-muted-foreground">Accuracy Rate</p>
          </div>
          <div className="bg-gradient-to-br from-background to-yellow-950/5 backdrop-blur-sm border border-yellow-500/10 rounded-lg p-6 text-center">
            <CheckCircle className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
            <p className="text-3xl font-bold text-yellow-500">2.5x</p>
            <p className="text-sm text-muted-foreground">Point Multiplier</p>
          </div>
          <div className="bg-gradient-to-br from-background to-red-950/5 backdrop-blur-sm border border-red-500/10 rounded-lg p-6 text-center">
            <Flag className="h-8 w-8 text-red-500 mx-auto mb-2" />
            <p className="text-3xl font-bold text-red-500">5K+</p>
            <p className="text-sm text-muted-foreground">Fantasy Teams</p>
          </div>
        </div>
      </div>
      
      {/* CTA section */}
      <div className="container mx-auto max-w-screen-xl py-16 mb-10">
        <div className="rounded-xl overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-r from-red-600/20 to-red-950/30"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,0,0,0.2),transparent_50%)]"></div>
          <div className="relative p-10 text-center">
            <h2 className="text-3xl font-bold mb-4 text-white">Ready to dominate your F1 Fantasy league?</h2>
            <p className="text-lg text-red-100/70 mb-8 max-w-2xl mx-auto">
              Join thousands of F1 fans using AI to build winning fantasy teams and climb the leaderboards.
            </p>
            
            {!userId ? (
              <Button asChild size="lg" className="px-10 py-6 font-medium bg-white text-red-600 hover:bg-red-50 shadow-lg hover:shadow-xl transition-all">
                <Link href="/signup">Get Started Free</Link>
              </Button>
            ) : (
              <Button asChild size="lg" className="px-10 py-6 font-medium bg-white text-red-600 hover:bg-red-50 shadow-lg hover:shadow-xl transition-all">
                <Link href="/dashboard">Go to Dashboard</Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 