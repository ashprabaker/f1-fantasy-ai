"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@clerk/nextjs"
import { Check } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { getProfile, fixSubscription } from "@/app/pricing/actions"
import { toast } from "@/components/ui/use-toast"

export default function PricingPage() {
  const { userId, isLoaded } = useAuth()
  const [isClient, setIsClient] = useState(false)
  const [isPro, setIsPro] = useState(false)
  const [isFixing, setIsFixing] = useState(false)
  
  useEffect(() => {
    setIsClient(true)
    
    if (userId) {
      const fetchProfile = async () => {
        const profileResult = await getProfile(userId)
        setIsPro(profileResult.isSuccess && profileResult.data?.membership === "pro")
      }
      
      fetchProfile()
    }
  }, [userId])
  
  const handleFixSubscription = async () => {
    if (!userId) return
    
    setIsFixing(true)
    try {
      const result = await fixSubscription(userId)
      if (result.isSuccess) {
        toast({
          title: "Subscription fixed",
          description: "Your pro membership has been restored.",
          variant: "default"
        })
        setIsPro(true)
      } else {
        toast({
          title: "Unable to fix subscription",
          description: result.message || "No active subscription found.",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fix subscription. Please contact support.",
        variant: "destructive"
      })
    } finally {
      setIsFixing(false)
    }
  }
  
  if (!isClient || !isLoaded) {
    return null
  }
  
  return (
    <div className="container py-12 mx-auto max-w-5xl">
      <div className="flex flex-col items-center text-center mb-12">
        <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl">Simple, Transparent Pricing</h1>
        <p className="mt-4 text-muted-foreground max-w-[700px]">
          Maximize your F1 Fantasy performance with our premium features
        </p>
      </div>
      
      <div className="flex justify-center">
        <Card className="flex flex-col border-primary max-w-md w-full">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl">Pro Plan</CardTitle>
              <span className="rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
                Required for Full Access
              </span>
            </div>
            <div className="mt-4 flex items-baseline justify-center">
              <span className="text-5xl font-extrabold tracking-tight">$9.99</span>
              <span className="ml-1 text-xl text-muted-foreground">/month</span>
            </div>
          </CardHeader>
          <CardContent className="flex-1">
            <ul className="space-y-3">
              <li className="flex items-center">
                <Check className="mr-2 h-4 w-4 text-primary" />
                <span>Advanced team analysis</span>
              </li>
              <li className="flex items-center">
                <Check className="mr-2 h-4 w-4 text-primary" />
                <span>AI-powered detailed recommendations</span>
              </li>
              <li className="flex items-center">
                <Check className="mr-2 h-4 w-4 text-primary" />
                <span>Save and update your team</span>
              </li>
              <li className="flex items-center">
                <Check className="mr-2 h-4 w-4 text-primary" />
                <span>Full access to market data and trends</span>
              </li>
              <li className="flex items-center">
                <Check className="mr-2 h-4 w-4 text-primary" />
                <span>Weekly personalized insights</span>
              </li>
            </ul>
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            {!userId ? (
              <Button className="w-full" asChild>
                <Link href="/signup">Sign Up for Pro</Link>
              </Button>
            ) : isPro ? (
              <Button className="w-full" variant="destructive" asChild>
                <Link href={`${process.env.NEXT_PUBLIC_STRIPE_PORTAL_LINK}?client_reference_id=${userId}`}>
                  Manage Subscription
                </Link>
              </Button>
            ) : (
              <>
                <Button className="w-full" asChild>
                  <Link href={`${process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK_MONTHLY}?client_reference_id=${userId}`}>
                    Upgrade to Pro
                  </Link>
                </Button>
                <div className="text-center w-full">
                  <Button 
                    variant="link" 
                    size="sm" 
                    className="text-xs text-muted-foreground"
                    onClick={handleFixSubscription}
                    disabled={isFixing}
                  >
                    {isFixing ? "Checking subscription..." : "Already subscribed but can't access?"}
                  </Button>
                </div>
              </>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  )
} 