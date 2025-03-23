"use client"

import { Button } from "@/components/ui/button"
import { Loader2, RefreshCw } from "lucide-react"
import { useState, useEffect } from "react"
import { syncF1DataAction, getMarketDriversAction } from "@/actions/db/market-data-actions"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

export default function SyncF1DataButton() {
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncStartedAt, setSyncStartedAt] = useState<Date | null>(null)
  const [initialDriverCount, setInitialDriverCount] = useState<number | null>(null)
  const router = useRouter()
  
  // Store initial driver count when starting sync
  useEffect(() => {
    if (isSyncing && syncStartedAt && initialDriverCount === null) {
      getMarketDriversAction().then(result => {
        if (result.isSuccess && result.data) {
          setInitialDriverCount(result.data.length)
        }
      })
    }
  }, [isSyncing, syncStartedAt, initialDriverCount])
  
  // Poll for completion if sync is in progress
  useEffect(() => {
    if (!isSyncing || !syncStartedAt) return
    
    const checkInterval = 5000 // 5 seconds
    const maxWaitTime = 120000 // 2 minutes max
    
    const checkSyncCompletion = async () => {
      try {
        // Check if we have new drivers data
        const result = await getMarketDriversAction()
        
        // If successful and data has changed (either new entries or updated timestamps)
        // We need at least 10 seconds to have passed to avoid false positives
        const timeElapsed = Date.now() - syncStartedAt.getTime()
        if (result.isSuccess && result.data) {
          // Check if we have a different number of drivers or 30+ seconds elapsed
          const hasNewData = initialDriverCount !== null && 
                            (result.data.length !== initialDriverCount || timeElapsed > 30000)
          
          if (hasNewData) {
            setIsSyncing(false)
            setSyncStartedAt(null)
            setInitialDriverCount(null)
            toast.success("F1 data sync completed")
            
            // Force revalidation by refreshing the router
            router.refresh()
          }
        }
        
        if (timeElapsed > maxWaitTime) {
          // Timeout after max wait time
          setIsSyncing(false)
          setSyncStartedAt(null)
          setInitialDriverCount(null)
          toast.error("Sync is taking longer than expected. Check data later.")
          
          // Refresh anyway in case there was partial data
          router.refresh()
        }
      } catch (error) {
        console.error("Error checking sync status:", error)
      }
    }
    
    const interval = setInterval(checkSyncCompletion, checkInterval)
    return () => clearInterval(interval)
  }, [isSyncing, syncStartedAt, initialDriverCount, router])
  
  async function handleSync() {
    try {
      setIsSyncing(true)
      setSyncStartedAt(new Date())
      setInitialDriverCount(null)
      
      // Call the server action
      const result = await syncF1DataAction()
      
      if (result.isSuccess) {
        toast.success(result.message)
      } else {
        toast.error(result.message)
        setIsSyncing(false)
        setSyncStartedAt(null)
        setInitialDriverCount(null)
      }
    } catch (error) {
      toast.error("Failed to sync F1 data")
      console.error(error)
      setIsSyncing(false)
      setSyncStartedAt(null)
      setInitialDriverCount(null)
    }
  }
  
  return (
    <Button 
      onClick={handleSync} 
      disabled={isSyncing}
    >
      {isSyncing ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Syncing in background...
        </>
      ) : (
        <>
          <RefreshCw className="mr-2 h-4 w-4" />
          Sync F1 Data
        </>
      )}
    </Button>
  )
} 