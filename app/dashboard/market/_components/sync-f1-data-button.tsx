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
  const router = useRouter()
  
  // Poll for completion if sync is in progress
  useEffect(() => {
    if (!isSyncing || !syncStartedAt) return
    
    const checkInterval = 5000 // 5 seconds
    const maxWaitTime = 120000 // 2 minutes max
    
    const checkSyncCompletion = async () => {
      try {
        // Check if we have new drivers data
        const result = await getMarketDriversAction()
        
        // If successful and we've been syncing for at least 10 seconds
        // (to avoid false completion if the sync was started previously)
        const timeElapsed = Date.now() - syncStartedAt.getTime()
        if (result.isSuccess && result.data && result.data.length > 0 && timeElapsed > 10000) {
          setIsSyncing(false)
          setSyncStartedAt(null)
          toast.success("F1 data sync completed")
          router.refresh()
        } else if (timeElapsed > maxWaitTime) {
          // Timeout after max wait time
          setIsSyncing(false)
          setSyncStartedAt(null)
          toast.error("Sync is taking longer than expected. Check data later.")
        }
      } catch (error) {
        console.error("Error checking sync status:", error)
      }
    }
    
    const interval = setInterval(checkSyncCompletion, checkInterval)
    return () => clearInterval(interval)
  }, [isSyncing, syncStartedAt, router])
  
  async function handleSync() {
    try {
      setIsSyncing(true)
      setSyncStartedAt(new Date())
      
      // Call the server action
      const result = await syncF1DataAction()
      
      if (result.isSuccess) {
        toast.success(result.message)
      } else {
        toast.error(result.message)
        setIsSyncing(false)
        setSyncStartedAt(null)
      }
    } catch (error) {
      toast.error("Failed to sync F1 data")
      console.error(error)
      setIsSyncing(false)
      setSyncStartedAt(null)
    }
  }
  
  return (
    <Button onClick={handleSync} disabled={isSyncing}>
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