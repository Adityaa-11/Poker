"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { Spade, Heart, Diamond, Club, Mail, ArrowRight, Eye, EyeOff, Github } from "lucide-react"
import { signInWithGoogle, signInWithGitHub, signInWithEmail, signUpWithEmail, resetPassword } from "@/lib/auth/supabase-auth"
import { demoLogin } from "@/lib/demo-data"

export function AuthScreen() {
  const [activeTab, setActiveTab] = useState("login")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: ""
  })

  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    setError("")
    
    try {
      console.log('🔄 Starting Google OAuth sign-in...')
      const result = await signInWithGoogle()
      console.log('🔄 OAuth result:', result)
      
      if (!result.success) {
        console.error('❌ OAuth failed:', result.error)
        setError(result.error || "Failed to sign in with Google")
      } else {
        console.log('✅ OAuth initiated successfully')
      }
      // Google OAuth will redirect, so no success handling needed here
    } catch (error) {
      console.error('❌ OAuth exception:', error)
      setError("An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const handleGitHubSignIn = async () => {
    setIsLoading(true)
    setError("")
    
    try {
      const result = await signInWithGitHub()
      if (!result.success) {
        setError(result.error || "Failed to sign in with GitHub")
      }
      // GitHub OAuth will redirect, so no success handling needed here
    } catch (error) {
      setError("An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const handleForgotPassword = async () => {
    if (!formData.email) {
      setError("Please enter your email address")
      return
    }

    setIsLoading(true)
    setError("")
    
    try {
      const result = await resetPassword(formData.email)
      if (result.success) {
        setSuccess("Password reset email sent! Check your inbox.")
      } else {
        setError(result.error || "Failed to send reset email")
      }
    } catch (error) {
      setError("An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setSuccess("")
    
    try {
      if (activeTab === "signup") {
        if (!formData.name || !formData.email || !formData.password) {
          setError("Please fill in all fields")
          return
        }

        const result = await signUpWithEmail({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        })

        if (result.success) {
          setSuccess("Account created successfully! Please check your email to verify your account.")
        } else {
          setError(result.error || "Failed to create account")
        }
      } else {
        if (!formData.email || !formData.password) {
          setError("Please fill in all fields")
          return
        }

          // Check for demo credentials
          console.log('🔍 Checking demo credentials for:', formData.email)
          const { DEMO_USERS } = await import('@/lib/demo-data')
          console.log('🔍 Available demo users:', Object.values(DEMO_USERS).map(u => u.email))
          
          const demoUser = Object.values(DEMO_USERS).find(user => 
            user.email.toLowerCase() === formData.email.toLowerCase() && 
            user.password === formData.password
          )
          
          console.log('🔍 Demo user found:', demoUser ? demoUser.name : 'None')
          
          if (demoUser) {
            console.log('🎮 Demo login detected for:', demoUser.name)
            const { demoLogin } = await import('@/lib/demo-data')
            const success = demoLogin(demoUser)
            console.log('🎮 Demo login success:', success)
            if (success) {
              setSuccess(`Demo mode activated as ${demoUser.name}!`)
              // Give a moment for the event to be processed, then reload
              setTimeout(() => {
                console.log('🎮 Reloading page...')
                window.location.reload()
              }, 500)
              return
            } else {
              setError("Failed to load demo data")
              return
            }
          }

        const result = await signInWithEmail({
          email: formData.email,
          password: formData.password,
        })

        if (result.success) {
          // User will be redirected by auth context
          setSuccess("Successfully signed in!")
        } else {
          setError(result.error || "Failed to sign in")
        }
      }
    } catch (error) {
      setError("An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Animated Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center items-center gap-2 mb-4">
            <div className="flex gap-1 animate-pulse">
              <Spade className="h-6 w-6 text-slate-700 animate-bounce" style={{ animationDelay: '0ms' }} />
              <Heart className="h-6 w-6 text-red-500 animate-bounce" style={{ animationDelay: '150ms' }} />
              <Diamond className="h-6 w-6 text-red-500 animate-bounce" style={{ animationDelay: '300ms' }} />
              <Club className="h-6 w-6 text-slate-700 animate-bounce" style={{ animationDelay: '450ms' }} />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-slate-800 mb-2">PokerPals</h1>
          <p className="text-slate-600">Track games, manage groups, settle up</p>
        </div>

        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-center text-slate-800">Welcome Back</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* OAuth Providers */}
            <div className="space-y-3">
              <Button 
                onClick={handleGoogleSignIn}
                variant="outline" 
                className="w-full flex items-center gap-2 border-slate-200 hover:bg-slate-50"
                disabled={isLoading}
              >
                <div className="w-5 h-5 bg-gradient-to-r from-blue-500 to-red-500 rounded-full"></div>
                {isLoading ? "Connecting..." : "Continue with Google"}
              </Button>
              
              <Button 
                onClick={handleGitHubSignIn}
                variant="outline" 
                className="w-full flex items-center gap-2 border-slate-200 hover:bg-slate-50"
                disabled={isLoading}
              >
                <Github className="w-5 h-5" />
                {isLoading ? "Connecting..." : "Continue with GitHub"}
              </Button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-slate-500">Or continue with email</span>
              </div>
            </div>

            {/* Email/Password Forms */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login" className="space-y-4 mt-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  {success && (
                    <Alert className="border-green-200 bg-green-50">
                      <AlertDescription className="text-green-800">{success}</AlertDescription>
                    </Alert>
                  )}
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      id="email"
                      type="email" 
                      placeholder="Enter your email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      disabled={isLoading}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Input 
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={formData.password}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                        disabled={isLoading}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      className="text-sm text-blue-600 hover:underline"
                      disabled={isLoading}
                    >
                      Forgot password?
                    </button>
                  </div>
                  
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Signing In..." : "Sign In"}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="signup" className="space-y-4 mt-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  {success && (
                    <Alert className="border-green-200 bg-green-50">
                      <AlertDescription className="text-green-800">{success}</AlertDescription>
                    </Alert>
                  )}
                  
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Full Name</Label>
                    <Input 
                      id="signup-name"
                      type="text" 
                      placeholder="Enter your full name"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      disabled={isLoading}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input 
                      id="signup-email"
                      type="email" 
                      placeholder="Enter your email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      disabled={isLoading}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <div className="relative">
                      <Input 
                        id="signup-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Create a password (8+ characters)"
                        value={formData.password}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                        disabled={isLoading}
                        required
                        minLength={8}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  
                  <div className="text-xs text-slate-500">
                    Password must be at least 8 characters long
                  </div>
                  
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Creating Account..." : "Create Account"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <div className="text-center mt-6 space-y-2">
          <div className="text-xs text-slate-500">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="text-xs font-medium text-blue-800 mb-1">🎮 Demo Mode Available</div>
             <div className="text-xs text-blue-600">
               Try the app with sample data: <br />
               <span className="font-mono bg-blue-100 px-1 rounded">Email: test@pokerpals.com</span> • <span className="font-mono bg-blue-100 px-1 rounded">Password: 123</span>
             </div>
          </div>
        </div>
      </div>
    </div>
  )
} 