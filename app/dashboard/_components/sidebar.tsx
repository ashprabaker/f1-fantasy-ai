"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { 
  LayoutDashboard,
  LineChart,
  Users,
  BarChart4
} from "lucide-react"

const items = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard
  },
  {
    title: "Edit Team",
    href: "/dashboard/team",
    icon: Users
  },
  {
    title: "Market",
    href: "/dashboard/market",
    icon: LineChart
  }
]

export function Sidebar() {
  const pathname = usePathname()
  
  return (
    <aside className="fixed top-16 z-30 hidden h-[calc(100vh-4rem)] w-64 shrink-0 border-r bg-background md:sticky md:block">
      <div className="h-full py-6 px-4">
        <nav className="flex flex-col space-y-2">
          {items.map((item) => (
            <Button
              key={item.href}
              variant={pathname === item.href ? "default" : "ghost"}
              className={cn(
                "justify-start",
                pathname === item.href ? 
                  "bg-primary text-primary-foreground" : 
                  "hover:bg-muted"
              )}
              asChild
            >
              <Link href={item.href}>
                <item.icon className="mr-2 h-4 w-4" />
                {item.title}
              </Link>
            </Button>
          ))}
        </nav>
      </div>
    </aside>
  )
} 