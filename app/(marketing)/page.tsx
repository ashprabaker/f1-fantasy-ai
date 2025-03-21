"use server"

import { Button } from "@/components/ui/button"
import Link from "next/link"
import { auth } from "@clerk/nextjs/server"
import { ArrowRight, Check } from "lucide-react"

export default async function LandingPage() {
  const { userId } = await auth()
  
  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)]">
      <main className="flex-1">
        <section className="py-12 md:py-16 lg:py-20">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl">
                  Optimize Your F1 Fantasy Team
                </h1>
                <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                  Get AI-powered recommendations to improve your F1 Fantasy team performance and beat your friends
                </p>
              </div>
              <div className="space-x-4">
                {userId ? (
                  <Button asChild size="lg">
                    <Link href="/dashboard">
                      Go to Dashboard <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                ) : (
                  <>
                    <Button asChild size="lg">
                      <Link href="/signup">
                        Get Started <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                    <Button asChild variant="outline" size="lg">
                      <Link href="/login">
                        Log in
                      </Link>
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>
        
        <section className="bg-muted py-12 md:py-16 lg:py-20">
          <div className="container px-4 md:px-6">
            <div className="mx-auto grid max-w-5xl items-center gap-6 lg:grid-cols-2 lg:gap-12">
              <div className="space-y-4">
                <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">
                  Why Choose Our F1 Fantasy Advisor?
                </h2>
                <p className="text-muted-foreground md:text-lg">
                  Our AI-powered recommendations analyze current prices, historical data, and performance trends to help you make better decisions.
                </p>
              </div>
              <div className="grid gap-4">
                <div className="flex items-start gap-4">
                  <Check className="h-6 w-6 text-primary flex-shrink-0" />
                  <div>
                    <h3 className="font-bold">AI-Powered Analysis</h3>
                    <p className="text-sm text-muted-foreground">
                      Get personalized recommendations based on your current team
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <Check className="h-6 w-6 text-primary flex-shrink-0" />
                  <div>
                    <h3 className="font-bold">Data-Driven Decisions</h3>
                    <p className="text-sm text-muted-foreground">
                      Recommendations based on historical race data and current prices
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <Check className="h-6 w-6 text-primary flex-shrink-0" />
                  <div>
                    <h3 className="font-bold">Save Your Team</h3>
                    <p className="text-sm text-muted-foreground">
                      No need to re-enter your team each time you visit
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
} 