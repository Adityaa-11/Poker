"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle } from "lucide-react"

export default function AuthCodeError() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
          <CardTitle className="text-xl">Authentication Error</CardTitle>
          <CardDescription>
            There was a problem signing you in. This could be due to:
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ul className="text-sm text-muted-foreground space-y-2">
            <li>• The authentication link has expired</li>
            <li>• The authentication was cancelled</li>
            <li>• There was a network connection issue</li>
          </ul>
          
          <div className="pt-4 space-y-2">
            <Link href="/" className="w-full">
              <Button className="w-full">
                Try Again
              </Button>
            </Link>
            <p className="text-xs text-center text-muted-foreground">
              If the problem persists, please contact support
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
