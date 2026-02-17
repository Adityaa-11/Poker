"use client"

import { useEffect, useRef } from "react"
import { usePoker } from "@/contexts/poker-context"

export function GameNotificationChecker() {
  const { games, currentUser } = usePoker()
  const seenGameIds = useRef<Set<string>>(new Set())
  const initialized = useRef(false)

  useEffect(() => {
    if (!currentUser) return

    const activeGames = games.filter(g => !g.isCompleted)

    if (!initialized.current) {
      activeGames.forEach(g => seenGameIds.current.add(g.id))
      initialized.current = true
      return
    }

    const newGames = activeGames.filter(g => !seenGameIds.current.has(g.id))
    if (newGames.length === 0) return

    newGames.forEach(g => seenGameIds.current.add(g.id))

    if (typeof window === "undefined" || !("Notification" in window)) return
    if (Notification.permission !== "granted") return

    newGames.forEach(game => {
      try {
        new Notification("New Poker Game!", {
          body: `A new ${game.stakes} game has started. Tap to join!`,
          icon: "/icons/icon-192x192.png",
          tag: `game-${game.id}`,
        })
      } catch {
        // Notification API not available in this context
      }
    })
  }, [games, currentUser])

  return null
}
