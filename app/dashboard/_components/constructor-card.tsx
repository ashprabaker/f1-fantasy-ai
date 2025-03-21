"use client"

import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { SelectConstructor, SelectMarketConstructor } from "@/db/schema"
import { cn } from "@/lib/utils"

interface ConstructorCardProps {
  constructor: SelectConstructor | SelectMarketConstructor;
  isSelected?: boolean;
  onToggleSelection?: () => void;
  disabled?: boolean;
}

export function ConstructorCard({ 
  constructor, 
  isSelected = false, 
  onToggleSelection,
  disabled = false
}: ConstructorCardProps) {
  // Check if constructor has color property (market constructor does, team constructor doesn't)
  const color = 'color' in constructor ? constructor.color : "#718096";
  
  return (
    <Card className={cn(
      "overflow-hidden transition-all h-full flex flex-col",
      isSelected ? "border-primary" : "border-border",
      disabled ? "opacity-70" : "hover:shadow-md cursor-pointer",
    )} onClick={!disabled && onToggleSelection ? onToggleSelection : undefined}>
      <CardHeader className="p-4 pb-2 space-y-3">
        <div className="flex flex-col items-center text-center">
          <div 
            className="h-12 w-12 rounded-full flex items-center justify-center mb-1"
            style={{ 
              backgroundColor: color || "#718096",
              color: "#000000"
            }}
          >
            {constructor.name.charAt(0)}
          </div>
          <div className="font-medium truncate w-full">{constructor.name}</div>
        </div>
      </CardHeader>
      
      <CardContent className="p-4 pt-2 pb-2 flex-grow">
        <div className="grid grid-cols-2 gap-2">
          <div className="text-center">
            <div className="text-xs text-muted-foreground">Price</div>
            <div className="font-semibold">${constructor.price.toFixed(1)}M</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-muted-foreground">Points</div>
            <div className="font-semibold">{(constructor.points ?? 0).toFixed(0)}</div>
          </div>
        </div>
      </CardContent>
      
      {!disabled && onToggleSelection && (
        <CardFooter className="p-3 pt-1">
          <Button 
            variant={isSelected ? "destructive" : "secondary"} 
            size="sm" 
            className="w-full"
          >
            {isSelected ? "Remove" : "Add"}
          </Button>
        </CardFooter>
      )}
    </Card>
  )
} 