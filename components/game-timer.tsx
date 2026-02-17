"use client"

import { useEffect, useState } from "react"
import { Clock, Timer } from "lucide-react"

function formatDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  const pad = (n: number) => n.toString().padStart(2, "0")
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
}

function formatDurationShort(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes}m`
}

interface GameTimerProps {
  startTime?: string
  endTime?: string
  duration?: number
  isCompleted: boolean
  compact?: boolean
}

export function GameTimer({ startTime, endTime, duration, isCompleted, compact = false }: GameTimerProps) {
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    if (isCompleted) {
      if (duration) {
        setElapsed(duration)
      } else if (startTime && endTime) {
        setElapsed(Math.round((new Date(endTime).getTime() - new Date(startTime).getTime()) / 1000))
      }
      return
    }

    if (!startTime) return

    const start = new Date(startTime).getTime()
    const updateElapsed = () => {
      setElapsed(Math.round((Date.now() - start) / 1000))
    }
    updateElapsed()
    const interval = setInterval(updateElapsed, 1000)
    return () => clearInterval(interval)
  }, [startTime, endTime, duration, isCompleted])

  if (compact) {
    return (
      <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
        <Clock className="h-3 w-3" />
        {isCompleted ? formatDurationShort(elapsed) : formatDuration(elapsed)}
      </span>
    )
  }

  return (
    <div className={`flex items-center gap-2 p-3 rounded-lg ${isCompleted ? "bg-muted/50" : "bg-green-50 dark:bg-green-950/30"}`}>
      <Timer className={`h-5 w-5 ${isCompleted ? "text-muted-foreground" : "text-green-600 dark:text-green-400"}`} />
      <div>
        <div className="text-xs text-muted-foreground">
          {isCompleted ? "Duration" : "Elapsed Time"}
        </div>
        <div className={`text-lg font-mono font-semibold ${isCompleted ? "" : "text-green-700 dark:text-green-300"}`}>
          {formatDuration(elapsed)}
        </div>
      </div>
    </div>
  )
}

export { formatDuration, formatDurationShort }
