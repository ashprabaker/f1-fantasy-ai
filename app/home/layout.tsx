import { Header } from "@/components/ui/header"
import { Footer } from "@/components/ui/footer"

interface HomeLayoutProps {
  children: React.ReactNode
}

export default function HomeLayout({ children }: HomeLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col relative">
      {/* Background patterns and gradients */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        {/* Main gradient background */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-background"></div>
        
        {/* Red-themed highlights */}
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_30%_20%,rgba(120,0,0,0.1),transparent_40%)]"></div>
        <div className="absolute top-1/2 left-3/4 w-96 h-96 bg-[radial-gradient(circle,rgba(255,0,0,0.08),transparent_40%)]"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[radial-gradient(circle,rgba(255,180,0,0.08),transparent_40%)]"></div>
        
        {/* Racing checkered pattern */}
        <div className="absolute inset-0 opacity-[0.02] pointer-events-none">
          <div className="h-full w-full bg-[repeating-linear-gradient(45deg,#000,#000_10px,transparent_10px,transparent_20px)]"></div>
        </div>
      </div>
      
      <Header />
      <main className="flex-1 w-full relative z-10">
        {children}
      </main>
      <Footer />
    </div>
  )
} 