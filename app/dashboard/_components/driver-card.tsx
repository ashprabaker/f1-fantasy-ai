"use client"

import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { SelectDriver, SelectMarketDriver } from "@/db/schema"
import { cn } from "@/lib/utils"

interface DriverCardProps {
  driver: SelectDriver | SelectMarketDriver;
  isSelected?: boolean;
  onToggleSelection?: () => void;
  disabled?: boolean;
  marketDrivers?: SelectMarketDriver[];
}

export function DriverCard({ 
  driver, 
  isSelected = false, 
  onToggleSelection,
  disabled = false,
  marketDrivers = []
}: DriverCardProps) {
  // For team drivers, try to find the corresponding market driver to get image
  let marketDriver: SelectMarketDriver | undefined;
  if (!('imageUrl' in driver) && marketDrivers.length > 0) {
    marketDriver = marketDrivers.find(md => md.name === driver.name);
  }
  
  // Check if driver has image URL (market driver does, team driver doesn't)
  const hasImage = 'imageUrl' in driver && !!driver.imageUrl || !!marketDriver?.imageUrl;
  const imageUrl = 'imageUrl' in driver ? driver.imageUrl : marketDriver?.imageUrl;
  const teamName = 'team' in driver ? driver.team : marketDriver?.team;
  const teamColor = 'teamColor' in driver ? driver.teamColor : marketDriver?.teamColor;
  
  return (
    <Card className={cn(
      "overflow-hidden transition-all h-full flex flex-col",
      isSelected ? "border-primary" : "border-border",
      disabled ? "opacity-70" : "hover:shadow-md cursor-pointer",
    )} onClick={!disabled && onToggleSelection ? onToggleSelection : undefined}>
      <CardHeader className="p-4 pb-2 space-y-3">
        <div className="flex flex-col items-center text-center">
          {hasImage ? (
            <Avatar className="h-12 w-12 mb-1">
              <AvatarImage src={imageUrl!} alt={driver.name} />
              <AvatarFallback>{driver.name.charAt(0)}</AvatarFallback>
            </Avatar>
          ) : (
            <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center mb-1">
              {driver.name.charAt(0)}
            </div>
          )}
          <div className="font-medium truncate w-full">{driver.name}</div>
          
          {teamName && (
            <Badge 
              style={{ backgroundColor: teamColor || "#718096" }} 
              variant="outline" 
              className="text-xs mt-1 text-black font-medium"
            >
              {teamName}
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="p-4 pt-2 pb-2 flex-grow">
        <div className="grid grid-cols-2 gap-2">
          <div className="text-center">
            <div className="text-xs text-muted-foreground">Price</div>
            <div className="font-semibold">${driver.price.toFixed(1)}M</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-muted-foreground">Points</div>
            <div className="font-semibold">{(driver.points ?? 0).toFixed(0)}</div>
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