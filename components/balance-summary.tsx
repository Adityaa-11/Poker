"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DollarSign, Check } from "lucide-react"
import { usePoker } from "@/contexts/poker-context"

export function BalanceSummary() {
  const { currentUser, getPlayerBalance, settlements, getPlayerById, toggleSettlementPayment } = usePoker()
  const [togglingId, setTogglingId] = useState<string | null>(null)
  
  if (!currentUser) return null
  
  const balance = getPlayerBalance(currentUser.id)
  const owedSettlements = settlements.filter(s => s.toPlayerId === currentUser.id && !s.isPaid)
  const oweSettlements = settlements.filter(s => s.fromPlayerId === currentUser.id && !s.isPaid)

  const handleToggle = async (settlementId: string) => {
    setTogglingId(settlementId)
    try {
      await toggleSettlementPayment(settlementId)
    } finally {
      setTogglingId(null)
    }
  }

  return (
    <Card className="border-border/50 shadow-lg">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-primary" />
          Balance Summary
        </CardTitle>
        <CardDescription>Your overall poker balance</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20">
            <span className="text-sm font-medium">Total Profit/Loss:</span>
            <span className={`text-xl font-bold ${balance.netBalance > 0 ? "text-green-500" : balance.netBalance < 0 ? "text-red-500" : "text-muted-foreground"}`}>
              {balance.netBalance > 0 ? "+" : ""}${Math.abs(balance.netBalance).toFixed(2)}
            </span>
          </div>

          {owedSettlements.length > 0 && (
            <div className="space-y-2">
              <div className="text-sm font-medium">You are owed:</div>
              {owedSettlements.map(settlement => {
                const fromPlayer = getPlayerById(settlement.fromPlayerId)
                return (
                  <div key={settlement.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-green-500/10 border border-green-500/20">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-500/20 text-green-500">
                        <DollarSign className="h-3 w-3" />
                      </span>
                      <span className="text-sm font-medium">{fromPlayer?.name} owes you</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-green-500">${settlement.amount.toFixed(2)}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs"
                        disabled={togglingId === settlement.id}
                        onClick={() => handleToggle(settlement.id)}
                      >
                        <Check className="h-3 w-3 mr-1" />
                        Received
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {oweSettlements.length > 0 && (
            <div className="space-y-2">
              <div className="text-sm font-medium">You owe:</div>
              {oweSettlements.map(settlement => {
                const toPlayer = getPlayerById(settlement.toPlayerId)
                return (
                  <div key={settlement.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-500/20 text-red-500">
                        <DollarSign className="h-3 w-3" />
                      </span>
                      <span className="text-sm font-medium">You owe {toPlayer?.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-red-500">${settlement.amount.toFixed(2)}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs"
                        disabled={togglingId === settlement.id}
                        onClick={() => handleToggle(settlement.id)}
                      >
                        <Check className="h-3 w-3 mr-1" />
                        Paid
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {owedSettlements.length === 0 && oweSettlements.length === 0 && (
            <div className="text-center py-4 text-muted-foreground">
              No pending settlements
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
