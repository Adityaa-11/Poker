"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Plus, Share2, Check } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { CreateGroupDialog } from "@/components/create-group-dialog"
import { usePoker } from "@/contexts/poker-context"

export default function GroupsPage() {
  const { groups, currentUser, getPlayerBalance } = usePoker()
  const [copiedGroupId, setCopiedGroupId] = useState<string | null>(null)

  const currentUserBalance = currentUser ? getPlayerBalance(currentUser.id) : null

  const copyInviteLink = async (e: React.MouseEvent, group: { id: string; name: string; inviteCode: string }) => {
    e.preventDefault()
    e.stopPropagation()
    const url = `${typeof window !== "undefined" ? window.location.origin : ""}/join/${group.inviteCode}`
    try {
      await navigator.clipboard.writeText(url)
      setCopiedGroupId(group.id)
      setTimeout(() => setCopiedGroupId(null), 2000)
    } catch {
      // ignore
    }
  }

  return (
    <div className="container mx-auto py-6 px-4 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Your Groups
          </h1>
          <p className="text-muted-foreground mt-1">Manage your poker groups and games</p>
        </div>
        <CreateGroupDialog>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Group
          </Button>
        </CreateGroupDialog>
      </div>

      {groups.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groups.map(group => (
            <Link key={group.id} href={`/groups/${group.id}`}>
              <Card className="cursor-pointer hover:bg-muted/30 transition-all duration-200 border-border/50 hover:border-primary/20 hover:shadow-md h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    {group.name}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-2">
                    <Users className="h-3 w-3" />
                    {group.members.length} members • Created {new Date(group.createdAt).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      Your balance: 
                      <span className={`font-semibold ml-1 ${currentUserBalance && currentUserBalance.netBalance > 0 ? "text-green-500" : currentUserBalance && currentUserBalance.netBalance < 0 ? "text-red-500" : "text-muted-foreground"}`}>
                        {currentUserBalance ? (currentUserBalance.netBalance > 0 ? "+" : "") + "$" + Math.abs(currentUserBalance.netBalance).toFixed(2) : "$0.00"}
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="shrink-0"
                      onClick={(e) => copyInviteLink(e, group)}
                    >
                      {copiedGroupId === group.id ? (
                        <Check className="h-4 w-4 mr-2 text-green-500" />
                      ) : (
                        <Share2 className="h-4 w-4 mr-2" />
                      )}
                      {copiedGroupId === group.id ? "Copied!" : "Invite"}
                    </Button>
                  </div>
                  <div className="text-xs text-muted-foreground text-right">
                    Tap to view →
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card className="border-border/50 shadow-lg">
          <CardContent className="py-12">
            <div className="text-center">
              <Users className="h-16 w-16 text-muted-foreground/50 mx-auto mb-6" />
              <h3 className="text-xl font-semibold mb-2">No groups yet</h3>
              <p className="text-muted-foreground mb-6">Create your first poker group to get started</p>
              <CreateGroupDialog>
                <Button size="lg">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Your First Group
                </Button>
              </CreateGroupDialog>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}


