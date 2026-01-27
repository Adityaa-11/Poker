"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Spade, Heart, Diamond, Club, ArrowRight, User } from "lucide-react"
import { usePoker } from "@/contexts/poker-context"

export function OnboardingScreen() {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    name: "",
    email: ""
  })
  const [isCreating, setIsCreating] = useState(false)
  
  const { createNewPlayer } = usePoker()

  const handleCreateProfile = async () => {
    if (!formData.name.trim()) return
    
    setIsCreating(true)
    try {
      await createNewPlayer(formData.name.trim(), formData.email.trim() || undefined)
      // The onboarding screen will disappear automatically when currentUser is set
    } catch (error) {
      console.error('Failed to create profile:', error)
    } finally {
      setIsCreating(false)
    }
  }

  const cardSuits = [
    { icon: Spade, color: "text-black", delay: "0ms" },
    { icon: Heart, color: "text-red-500", delay: "200ms" },
    { icon: Diamond, color: "text-red-500", delay: "400ms" },
    { icon: Club, color: "text-black", delay: "600ms" }
  ]

  if (step === 1) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          {/* Animated Card Suits */}
          <div className="flex justify-center mb-8">
            <div className="flex gap-4">
              {cardSuits.map(({ icon: Icon, color, delay }, index) => (
                <div
                  key={index}
                  className="animate-bounce"
                  style={{ animationDelay: delay, animationDuration: "2s" }}
                >
                  <Icon className={`h-12 w-12 ${color}`} />
                </div>
              ))}
            </div>
          </div>

          {/* Welcome Card */}
          <Card className="transform transition-all duration-1000 animate-in slide-in-from-bottom-8">
            <CardHeader className="text-center pb-2">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Spade className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                Welcome to PokerPals!
              </CardTitle>
              <p className="text-muted-foreground mt-2">
                Track your poker games, manage groups, and settle up with friends.
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm">Track wins & losses</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: "0.5s" }}></div>
                  <span className="text-sm">Manage poker groups</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" style={{ animationDelay: "1s" }}></div>
                  <span className="text-sm">Automatic settlements</span>
                </div>
              </div>
              
              <Button 
                onClick={() => setStep(2)} 
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 transition-all duration-300 transform hover:scale-105"
                size="lg"
              >
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Floating Animation */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full blur-lg opacity-30 animate-pulse"></div>
            <div className="relative w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center animate-float">
              <User className="h-10 w-10 text-white" />
            </div>
          </div>
        </div>

        {/* Profile Creation Card */}
        <Card className="transform transition-all duration-1000 animate-in slide-in-from-right-8">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Create Your Profile</CardTitle>
            <p className="text-muted-foreground">
              Let's get you set up to start tracking your poker games!
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Your Name *</Label>
                <Input
                  id="name"
                  placeholder="Enter your name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="transition-all duration-300 focus:scale-105"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email (Optional)</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="transition-all duration-300 focus:scale-105"
                />
              </div>
            </div>

            <div className="space-y-3">
              <Button
                onClick={handleCreateProfile}
                disabled={!formData.name.trim() || isCreating}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 transition-all duration-300 transform hover:scale-105"
                size="lg"
              >
                {isCreating ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Creating Profile...
                  </div>
                ) : (
                  <>
                    Create Profile
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
              
              <Button
                variant="ghost"
                onClick={() => setStep(1)}
                className="w-full"
              >
                Back
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

/* Custom CSS animations - add to globals.css */
const styles = `
@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
}

.animate-float {
  animation: float 3s ease-in-out infinite;
}
` 