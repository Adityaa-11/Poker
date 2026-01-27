"use client"

import { useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Camera, Upload, X } from "lucide-react"

interface GamePhotosProps {
  gameId: string
  photos?: string[]
  onPhotosChange?: (photos: string[]) => void
}

export function GamePhotos({ gameId, photos = [], onPhotosChange }: GamePhotosProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [showDialog, setShowDialog] = useState(false)

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    setIsUploading(true)
    
    try {
      const newPhotos: string[] = []
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        
        // Create preview URL (in production, upload to cloud storage)
        const reader = new FileReader()
        const photoUrl = await new Promise<string>((resolve) => {
          reader.onload = (e) => resolve(e.target?.result as string)
          reader.readAsDataURL(file)
        })
        
        newPhotos.push(photoUrl)
      }
      
      const updatedPhotos = [...photos, ...newPhotos]
      onPhotosChange?.(updatedPhotos)
      
      // In production, save to database
      console.log('Photos uploaded for game:', gameId, updatedPhotos)
      
    } catch (error) {
      console.error('Failed to upload photos:', error)
    } finally {
      setIsUploading(false)
    }
  }

  const removePhoto = (index: number) => {
    const updatedPhotos = photos.filter((_, i) => i !== index)
    onPhotosChange?.(updatedPhotos)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Game Photos
          </span>
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Upload className="h-4 w-4 mr-2" />
                Add Photos
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Game Photos</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileUpload}
                    disabled={isUploading}
                    className="hidden"
                    id="photo-upload"
                  />
                  <label 
                    htmlFor="photo-upload" 
                    className="cursor-pointer flex flex-col items-center gap-2"
                  >
                    <Camera className="h-12 w-12 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      {isUploading ? "Uploading..." : "Click to select photos"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Supports multiple images
                    </p>
                  </label>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {photos.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Camera className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No photos yet</p>
            <p className="text-sm">Add some memories from your game!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {photos.map((photo, index) => (
              <div key={index} className="relative group">
                <Image
                  src={photo}
                  alt={`Game photo ${index + 1}`}
                  width={400}
                  height={200}
                  unoptimized
                  className="w-full h-24 object-cover rounded-lg"
                />
                <Button
                  size="icon"
                  variant="destructive"
                  className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => removePhoto(index)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
} 