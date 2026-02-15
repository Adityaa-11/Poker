"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus } from "lucide-react"
import { usePoker } from "@/contexts/poker-context"

export function CreateGameButton() {
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState({
    groupId: "",
    defaultBuyIn: "200"
  })
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  
  const { groups, currentUser, createNewGame } = usePoker()
  const router = useRouter()

  const resetForm = () => {
    setFormData({ groupId: "", defaultBuyIn: "200" })
    setError(null)
    setSubmitting(false)
  }
  
  const handleSubmit = async () => {
    setError(null)

    if (!formData.groupId) {
      setError("Please select a poker group.")
      return
    }

    const buyIn = parseInt(formData.defaultBuyIn)
    if (!formData.defaultBuyIn || isNaN(buyIn) || buyIn < 1) {
      setError("Buy-in must be at least $1.")
      return
    }

    if (!currentUser?.id) {
      setError("You must be signed in to create a game.")
      return
    }

    try {
      setSubmitting(true)
      const game = await createNewGame(
        formData.groupId,
        "$1/$2 NLHE",
        buyIn,
        currentUser.id
      )
      if (!game) {
        setError("Failed to create game. Please try again.")
        setSubmitting(false)
        return
      }
      setOpen(false)
      resetForm()
      router.push(`/games/${game.id}`)
    } catch (err) {
      console.error('Error creating game:', err)
      setError("Something went wrong. Please try again.")
      setSubmitting(false)
    }
  }

  return (
    <Card className="border-border/50 shadow-lg hover:shadow-xl transition-all duration-200">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5 text-primary" />
          Start a Game
        </CardTitle>
        <CardDescription>Track a new poker session</CardDescription>
      </CardHeader>
      <CardContent>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="w-full h-12 bg-primary hover:bg-primary/90 shadow-md hover:shadow-lg transition-all duration-200">
              <Plus className="mr-2 h-5 w-5" />
              New Game
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create New Game</DialogTitle>
              <DialogDescription>Set up a new poker game to track profits and losses.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="group">Poker Group</Label>
                <Select value={formData.groupId} onValueChange={(value) => { setFormData({...formData, groupId: value}); setError(null); }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select group" />
                  </SelectTrigger>
                  <SelectContent>
                    {groups.map(group => (
                      <SelectItem key={group.id} value={group.id}>{group.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="default-buy-in">Suggested Buy-in (players can customize)</Label>
                <Input 
                  id="default-buy-in" 
                  placeholder="200" 
                  type="number"
                  min={1}
                  value={formData.defaultBuyIn}
                  onChange={(e) => { setFormData({...formData, defaultBuyIn: e.target.value}); setError(null); }}
                />
              </div>
              <div className="text-sm text-muted-foreground">
                Players will opt-in to the game with their own buy-in amounts and manually enter their final cash-out when the game ends.
              </div>
              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
            </div>
            <DialogFooter>
              <Button type="submit" onClick={handleSubmit} disabled={submitting}>
                {submitting ? "Creating..." : "Create Game"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
