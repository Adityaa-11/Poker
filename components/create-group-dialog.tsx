"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus } from "lucide-react"
import { usePoker } from "@/contexts/poker-context"
import { useRouter } from "next/navigation"

interface CreateGroupDialogProps {
  children?: React.ReactNode
}

export function CreateGroupDialog({ children }: CreateGroupDialogProps) {
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    description: ""
  })
  
  const { createNewGroup } = usePoker()
  const router = useRouter()
  
  const handleSubmit = async () => {
    if (!formData.name.trim()) return

    try {
      setSubmitting(true)
      setError(null)
      const group = await createNewGroup(formData.name.trim(), formData.description.trim())
      if (!group) {
        setError("Couldn’t create the group. Please try again.")
        return
      }

      setFormData({ name: "", description: "" })
      setOpen(false)
      router.push(`/groups/${group.id}`)
    } catch {
      setError("Couldn’t create the group. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  const handleClose = () => {
    setFormData({ name: "", description: "" })
    setError(null)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" className="w-full py-8 border-dashed border-2 border-primary/30 hover:border-primary/50 hover:bg-primary/5 transition-all duration-200">
            <Plus className="mr-2 h-4 w-4 text-primary" />
            Create New Group
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Group</DialogTitle>
          <DialogDescription>
            Create a new poker group to invite friends and track games together.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Group Name</Label>
            <Input
              id="name"
              placeholder="Friday Night Poker"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Weekly poker game with friends"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!formData.name.trim() || submitting}>
            {submitting ? "Creating..." : "Create Group"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 