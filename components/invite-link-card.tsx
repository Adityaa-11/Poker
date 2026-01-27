"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Copy, Share2, Check, Users, QrCode } from "lucide-react"
import { Group } from "@/lib/types"

interface InviteLinkCardProps {
  group: Group
}

export function InviteLinkCard({ group }: InviteLinkCardProps) {
  const [copied, setCopied] = useState(false)
  const [showQR, setShowQR] = useState(false)
  
  // Generate a unique invite token for this session
  const generateInviteToken = () => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
  }
  
  const [inviteToken] = useState(() => generateInviteToken())
  const inviteUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/join/${group.inviteCode}?token=${inviteToken}`
  
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }
  
  const shareInvite = async () => {
    // Check if Web Share API is supported (iOS Safari, Android Chrome, etc.)
    if (navigator.share && navigator.canShare) {
      const shareData = {
        title: `Join ${group.name} on PokerPals`,
        text: `🎰 You've been invited to join "${group.name}" poker group!\n\nTrack your games, winnings, and settle up with friends.\n\nTap to join:`,
        url: inviteUrl,
      }
      
      try {
        // Check if the data can be shared
        if (navigator.canShare(shareData)) {
          await navigator.share(shareData)
        } else {
          // Fallback for unsupported data
          await navigator.share({
            title: shareData.title,
            url: inviteUrl,
          })
        }
      } catch (err) {
        // User cancelled or error occurred
        if (err instanceof Error && err.name !== 'AbortError') {
          console.error('Share failed:', err)
          copyToClipboard() // Fallback to copy
        }
      }
    } else {
      // Fallback for browsers without Web Share API
      copyToClipboard()
    }
  }
  
  const shareViaMessages = () => {
    const message = `🎰 Join "${group.name}" poker group on PokerPals!\n\nTrack games, winnings & settle up with friends.\n\n${inviteUrl}`
    const smsUrl = `sms:?body=${encodeURIComponent(message)}`
    window.open(smsUrl, '_self')
  }
  
  const shareViaEmail = () => {
    const subject = `Join ${group.name} on PokerPals`
    const body = `Hi!\n\nYou've been invited to join "${group.name}" poker group on PokerPals.\n\nPokerPals helps you track your poker games, winnings, and settle up with friends easily.\n\nClick here to join: ${inviteUrl}\n\nSee you at the tables!\n`
    const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    window.open(mailtoUrl, '_self')
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Invite Friends
        </CardTitle>
        <CardDescription>
          Share this link to invite friends to join {group.name}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="invite-link">Invite Link</Label>
          <div className="flex gap-2">
            <Input
              id="invite-link"
              value={inviteUrl}
              readOnly
              className="font-mono text-sm"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={copyToClipboard}
              className="shrink-0"
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
        
        <div className="space-y-3">
          {/* Primary Share Button */}
          <Button onClick={shareInvite} className="w-full" size="lg">
            <Share2 className="mr-2 h-4 w-4" />
            Share Invite
          </Button>
          
          {/* Secondary Actions */}
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" onClick={copyToClipboard}>
              {copied ? (
                <>
                  <Check className="mr-2 h-4 w-4 text-green-500" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy Link
                </>
              )}
            </Button>
            <Button variant="outline" onClick={() => setShowQR(!showQR)}>
              <QrCode className="mr-2 h-4 w-4" />
              QR Code
            </Button>
          </div>
          
          {/* Direct Share Options */}
          <div className="grid grid-cols-2 gap-2">
            <Button variant="ghost" onClick={shareViaMessages} className="text-sm">
              💬 Messages
            </Button>
            <Button variant="ghost" onClick={shareViaEmail} className="text-sm">
              ✉️ Email
            </Button>
          </div>
        </div>
        
        {/* QR Code Display */}
        {showQR && (
          <div className="border rounded-lg p-4 bg-white dark:bg-gray-50 text-center">
            <div className="mb-3">
              <h4 className="font-medium text-gray-900 dark:text-gray-800 mb-1">Scan to Join</h4>
              <p className="text-xs text-gray-600 dark:text-gray-700">Point your camera at this QR code</p>
            </div>
            <div className="flex justify-center">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(inviteUrl)}&bgcolor=FFFFFF&color=000000&margin=10`}
                alt={`QR Code for ${group.name}`}
                className="w-48 h-48 border border-gray-200 rounded"
                loading="lazy"
              />
            </div>
            <div className="mt-3 text-xs text-gray-600 dark:text-gray-700">
              {group.name}
            </div>
          </div>
        )}
        
        <div className="text-xs text-muted-foreground">
          <strong>Invite Code:</strong> {group.inviteCode}
        </div>
      </CardContent>
    </Card>
  )
} 