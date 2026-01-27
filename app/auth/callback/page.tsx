'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { handleOAuthCallback } from '@/lib/auth/supabase-auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, CheckCircle, XCircle } from 'lucide-react'

export default function AuthCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const processCallback = async () => {
      try {
        // Check if there's an error in the URL
        const error = searchParams.get('error')
        const errorDescription = searchParams.get('error_description')
        
        if (error) {
          setStatus('error')
          setMessage(errorDescription || error)
          return
        }

        // Handle OAuth callback and create/retrieve user profile
        const result = await handleOAuthCallback()
        
        if (result.success && result.user) {
          setStatus('success')
          setMessage('Successfully signed in! Redirecting...')
          
          // Redirect to dashboard after a short delay
          setTimeout(() => {
            router.push('/')
          }, 1500)
        } else {
          setStatus('error')
          setMessage(result.error || 'Authentication failed')
        }
      } catch (error) {
        console.error('Callback error:', error)
        setStatus('error')
        setMessage('An unexpected error occurred')
      }
    }

    processCallback()
  }, [router, searchParams])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            {status === 'loading' && <Loader2 className="h-6 w-6 animate-spin text-blue-600" />}
            {status === 'success' && <CheckCircle className="h-6 w-6 text-green-600" />}
            {status === 'error' && <XCircle className="h-6 w-6 text-red-600" />}
            {status === 'loading' && 'Completing Sign In...'}
            {status === 'success' && 'Sign In Successful!'}
            {status === 'error' && 'Sign In Failed'}
          </CardTitle>
          <CardDescription>{message}</CardDescription>
        </CardHeader>
        <CardContent>
          {status === 'loading' && (
            <div className="text-center text-sm text-muted-foreground">
              Please wait while we complete your authentication...
            </div>
          )}
          {status === 'success' && (
            <div className="text-center text-sm text-green-600">
              You will be redirected to your dashboard shortly.
            </div>
          )}
          {status === 'error' && (
            <div className="text-center">
              <p className="text-sm text-red-600 mb-4">
                Please try signing in again.
              </p>
              <button
                onClick={() => router.push('/')}
                className="text-sm text-blue-600 hover:underline"
              >
                Return to Home
              </button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 