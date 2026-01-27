"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Users, Plus, Receipt, User, Settings, FileText, BarChart3 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { CreateGameButton } from "@/components/create-game-button"
import { CreateGroupDialog } from "@/components/create-group-dialog"
import { cn } from "@/lib/utils"
import { isDemoMode } from "@/lib/demo-data"

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/groups", label: "Groups", icon: Users },
  { href: "/ledger", label: "Ledger", icon: FileText },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
]

export function MobileNav() {
  const pathname = usePathname()
  const [showCreateSheet, setShowCreateSheet] = useState(false)
  const [isVisible, setIsVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)
  const [isDemo, setIsDemo] = useState(false)

  // Check demo mode on mount and when localStorage changes
  useEffect(() => {
    const checkDemoMode = () => setIsDemo(isDemoMode())
    checkDemoMode()
    
    // Listen for storage changes (when demo mode is activated/deactivated)
    window.addEventListener('storage', checkDemoMode)
    return () => window.removeEventListener('storage', checkDemoMode)
  }, [])

  // Hide/show navigation on scroll for better UX
  useEffect(() => {
    const controlNavbar = () => {
      if (typeof window !== 'undefined') {
        if (window.scrollY > lastScrollY && window.scrollY > 100) {
          // Scrolling down
          setIsVisible(false)
        } else {
          // Scrolling up
          setIsVisible(true)
        }
        setLastScrollY(window.scrollY)
      }
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('scroll', controlNavbar, { passive: true })
      return () => {
        window.removeEventListener('scroll', controlNavbar)
      }
    }
  }, [lastScrollY])

  // Don't show mobile nav on auth pages
  if (pathname?.startsWith('/auth/')) {
    return null
  }

  return (
    <>
      {/* Mobile Bottom Navigation */}
      <nav 
        className={cn(
          "fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-t border-border md:hidden transition-transform duration-300 safe-area-pb",
          isVisible ? "translate-y-0" : "translate-y-full"
        )}
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="flex items-center justify-around px-2 py-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center min-w-[64px] py-2 px-3 rounded-lg transition-all duration-200 touch-manipulation",
                  "hover:bg-muted/50 active:bg-muted active:scale-95",
                  isActive 
                    ? "text-primary bg-primary/10" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon 
                  className={cn(
                    "h-6 w-6 mb-1 transition-colors",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )} 
                />
                <span 
                  className={cn(
                    "text-xs font-medium transition-colors",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  {item.label}
                </span>
              </Link>
            )
          })}
          
          {/* Create Button with Sheet */}
          <Sheet open={showCreateSheet} onOpenChange={setShowCreateSheet}>
            <SheetTrigger asChild>
              <Button
                size="icon"
                className="h-12 w-12 rounded-full bg-primary hover:bg-primary/90 shadow-lg touch-manipulation active:scale-95 transition-transform"
              >
                <Plus className="h-6 w-6 text-primary-foreground" />
                <span className="sr-only">Create</span>
              </Button>
            </SheetTrigger>
            <SheetContent 
              side="bottom" 
              className="h-auto max-h-[80vh] rounded-t-xl border-0 p-0"
            >
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-center">
                  <div className="w-12 h-1 bg-muted rounded-full"></div>
                </div>
                
                <div className="text-center space-y-2">
                  <h3 className="text-lg font-semibold">Create New</h3>
                  <p className="text-sm text-muted-foreground">What would you like to create?</p>
                </div>
                
                                 <div className="grid gap-3">
                   <CreateGameButton />
                   <CreateGroupDialog />
                 </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>

      {/* Desktop Sidebar */}
      <nav className="hidden md:flex md:flex-col md:fixed md:inset-y-0 md:left-0 md:w-64 md:bg-card md:border-r md:border-border md:z-40">
        <div className="flex flex-col flex-1 pt-5 pb-4 overflow-y-auto">
          <div className="flex items-center flex-shrink-0 px-4">
            <div className="flex-1">
              <h1 className="text-xl font-bold text-foreground">PokerPals</h1>
              {isDemo && (
                <div className="text-xs text-orange-500 font-medium mt-1 flex items-center gap-1">
                  🎮 Demo Mode
                </div>
              )}
            </div>
          </div>
          
          <nav className="mt-5 flex-1 px-2 space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              const Icon = item.icon
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Icon 
                    className={cn(
                      "mr-3 h-5 w-5 flex-shrink-0",
                      isActive ? "text-primary" : "text-muted-foreground"
                    )} 
                  />
                  {item.label}
                </Link>
              )
            })}
            
            <div className="pt-4 space-y-2">
              <CreateGameButton />
              <CreateGroupDialog />
            </div>
          </nav>
        </div>
      </nav>
    </>
  )
} 