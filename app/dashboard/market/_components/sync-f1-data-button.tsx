"use client"

import { Button } from "@/components/ui/button"
import { Loader2, RefreshCw } from "lucide-react"
import { useState } from "react"
import { syncF1DataAction } from "@/actions/db/market-data-actions"
import { toast } from "sonner"

export default function SyncF1DataButton() {
  const [isSyncing, setIsSyncing] = useState(false)
  
  async function handleSync() {
    try {
      setIsSyncing(true)
      
      // Call the server action directly instead of using fetch
      const result = await syncF1DataAction()
      
      if (result.isSuccess) {
        toast.success(result.message)
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      toast.error("Failed to sync F1 data")
      console.error(error)
    } finally {
      setIsSyncing(false)
    }
  }
  
  return (
    <Button onClick={handleSync} disabled={isSyncing}>
      {isSyncing ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Syncing...
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