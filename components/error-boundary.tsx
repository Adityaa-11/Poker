"use client"

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { RefreshCw, Bug, Home, Send } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  errorId: string
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: ''
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Generate unique error ID for tracking
    const errorId = Date.now().toString(36) + Math.random().toString(36).substr(2)
    
    return {
      hasError: true,
      error,
      errorId
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo
    })

    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error caught by boundary:', error, errorInfo)
    }

    // In production, you would send this to your error reporting service
    if (process.env.NODE_ENV === 'production') {
      this.logErrorToService(error, errorInfo)
    }
  }

  private logErrorToService = (error: Error, errorInfo: ErrorInfo) => {
    // Example error logging - replace with your preferred service
    // (Sentry, LogRocket, Bugsnag, etc.)
    const errorData = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      errorId: this.state.errorId,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    }

    // You would send this to your error tracking service
    console.error('Production error logged:', errorData)
    
    // Example: Send to a logging endpoint
    // fetch('/api/errors', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(errorData)
    // }).catch(() => {
    //   // Silently fail if logging fails
    // })
  }

  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: ''
    })
  }

  private handleReload = () => {
    if (typeof window !== 'undefined') {
      window.location.reload()
    }
  }

  private handleGoHome = () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/'
    }
  }

  private handleReportError = () => {
    const { error, errorId } = this.state
    const subject = `PokerPals Error Report - ${errorId}`
    const body = `Error ID: ${errorId}%0A%0APlease describe what you were doing when this error occurred:%0A%0A%0A----%0AError Details:%0A${error?.message}%0A%0ATime: ${new Date().toISOString()}`
    
    if (typeof window !== 'undefined') {
      window.open(`mailto:support@pokerpals.app?subject=${subject}&body=${body}`)
    }
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default error UI
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <Bug className="h-6 w-6 text-red-600" />
              </div>
              <CardTitle className="text-red-900">Oops! Something went wrong</CardTitle>
              <CardDescription>
                We're sorry, but something unexpected happened. Don't worry, your data is safe.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Error ID for support */}
              <Alert>
                <AlertDescription className="text-xs">
                  Error ID: <code className="font-mono">{this.state.errorId}</code>
                </AlertDescription>
              </Alert>

              {/* Development error details */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <Alert variant="destructive">
                  <AlertDescription className="text-xs font-mono whitespace-pre-wrap">
                    {this.state.error.message}
                  </AlertDescription>
                </Alert>
              )}

              {/* Action buttons */}
              <div className="space-y-2">
                <Button 
                  onClick={this.handleRetry} 
                  className="w-full"
                  variant="default"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
                
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    onClick={this.handleGoHome} 
                    variant="outline"
                    size="sm"
                  >
                    <Home className="h-4 w-4 mr-1" />
                    Home
                  </Button>
                  
                  <Button 
                    onClick={this.handleReload} 
                    variant="outline"
                    size="sm"
                  >
                    <RefreshCw className="h-4 w-4 mr-1" />
                    Reload
                  </Button>
                </div>

                <Button 
                  onClick={this.handleReportError} 
                  variant="ghost" 
                  size="sm"
                  className="w-full text-muted-foreground"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Report this error
                </Button>
              </div>

              <div className="text-center text-xs text-muted-foreground">
                If this problem persists, please contact support with the error ID above.
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}

// Functional wrapper for easier usage
interface ErrorBoundaryWrapperProps {
  children: ReactNode
  fallback?: ReactNode
}

export function ErrorBoundaryWrapper({ children, fallback }: ErrorBoundaryWrapperProps) {
  return (
    <ErrorBoundary fallback={fallback}>
      {children}
    </ErrorBoundary>
  )
} 