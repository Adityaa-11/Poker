"use client"

import React, { useState, useMemo, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Edit, Mail, User, Trash2, Download, TrendingUp, Calendar, DollarSign, Target, Users, BarChart3, LineChart as LineChartIcon, Grid3X3 } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { usePoker } from "@/contexts/poker-context"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'

export default function ProfilePage() {
  const { user: authUser } = useAuth()
  const { groups, games, getPlayerBalance, clearAllData } = usePoker()
  
  // State for analytics
  const [timeFilter, setTimeFilter] = useState("30d")
  const [selectedGroups, setSelectedGroups] = useState<string[]>([])
  const [chartType, setChartType] = useState<"line" | "heatmap">("line")

  // Auto-adjust time filter when switching to heatmap
  useEffect(() => {
    if (chartType === "heatmap" && timeFilter === "all") {
      setTimeFilter("30d")
    }
  }, [chartType, timeFilter])
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState(authUser?.name || "")
  const [editEmail, setEditEmail] = useState(authUser?.email || "")

  // Initialize selected groups to all groups (once we have groups + an authed user).
  // Must be an effect (not useMemo) and must not be conditional (hook rules).
  useEffect(() => {
    if (!authUser) return
    if (selectedGroups.length !== 0) return
    if (groups.length === 0) return
    setSelectedGroups(groups.map(g => g.id))
  }, [authUser, groups, selectedGroups.length])

  // Filter data based on selected groups and time
  const filteredData = useMemo(() => {
    if (!authUser) return []

    const userGames = games.filter(game => 
      game.players.some(p => p.playerId === authUser.id) &&
      selectedGroups.includes(game.groupId)
    )

    const now = new Date()
    let startDate = new Date()
    
    switch (timeFilter) {
      case "1d":
        startDate.setDate(now.getDate() - 1)
        break
      case "7d":
        startDate.setDate(now.getDate() - 7)
        break
      case "30d":
        startDate.setDate(now.getDate() - 30)
        break
      case "1y":
        startDate.setFullYear(now.getFullYear() - 1)
        break
      default:
        startDate = new Date(0) // All time
    }

    const filteredGames = userGames.filter(game => 
      new Date(game.date) >= startDate && game.isCompleted
    )

    return filteredGames
  }, [games, authUser, selectedGroups, timeFilter])

  // Calculate analytics
  const analytics = useMemo(() => {
    if (!authUser) {
      return {
        totalProfit: 0,
        averageBuyIn: 0,
        gamesPlayed: 0,
        winRate: 0,
        biggestWin: 0,
        biggestLoss: 0,
        chartData: [] as { date: string; profit: number; cumulative: number }[],
        heatmapData: [] as HeatmapDataPoint[],
      }
    }

    let totalProfit = 0
    let totalBuyIn = 0
    let gamesPlayed = 0
    let wins = 0
    let losses = 0
    let biggestWin = 0
    let biggestLoss = 0
    const dailyData: { [date: string]: number } = {}

    filteredData.forEach(game => {
      const playerData = game.players.find(p => p.playerId === authUser.id)
      if (playerData) {
        const profit = playerData.profit
        totalProfit += profit
        totalBuyIn += playerData.buyIn
        gamesPlayed++

        if (profit > 0) wins++
        else if (profit < 0) losses++

        if (profit > biggestWin) biggestWin = profit
        if (profit < biggestLoss) biggestLoss = profit

        // Group by date for chart
        const date = new Date(game.date).toISOString().split('T')[0]
        dailyData[date] = (dailyData[date] || 0) + profit
      }
    })

    // Convert daily data to chart format
    const chartData = Object.entries(dailyData)
      .map(([date, profit]) => ({
        date,
        profit,
        cumulative: 0 // Will be calculated below
      }))
      .sort((a, b) => a.date.localeCompare(b.date))

    // Calculate cumulative profit
    let cumulative = 0
    chartData.forEach(item => {
      cumulative += item.profit
      item.cumulative = cumulative
    })

    // Generate calendar-style heatmap data based on time filter
    const heatmapData = []
    
    // Determine date range based on time filter
    const now = new Date()
    let startDate: Date
    let endDate = new Date(now)
    
    switch (timeFilter) {
      case '1d':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000)
        break
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      case '1y':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
        break
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    }
    
    // Create daily profit map
    const dailyProfitMap: { [key: string]: number } = {}
    filteredData.forEach(game => {
      const gameDate = new Date(game.date)
      const dateKey = gameDate.toISOString().split('T')[0] // YYYY-MM-DD format
      const playerData = game.players.find(p => p.playerId === authUser.id)
      if (playerData) {
        dailyProfitMap[dateKey] = (dailyProfitMap[dateKey] || 0) + playerData.profit
      }
    })
    
    // Generate calendar grid
    const currentDate = new Date(startDate)
    while (currentDate <= endDate) {
      const dateKey = currentDate.toISOString().split('T')[0]
      const profit = dailyProfitMap[dateKey] || 0
      
      heatmapData.push({
        date: dateKey,
        dateObj: new Date(currentDate),
        profit: profit,
        hasGame: profit !== 0,
        dayOfWeek: currentDate.getDay(),
        dayOfMonth: currentDate.getDate(),
        month: currentDate.getMonth(),
        year: currentDate.getFullYear()
      })
      
      currentDate.setDate(currentDate.getDate() + 1)
    }

    return {
      totalProfit,
      averageBuyIn: gamesPlayed > 0 ? totalBuyIn / gamesPlayed : 0,
      gamesPlayed,
      winRate: gamesPlayed > 0 ? (wins / gamesPlayed) * 100 : 0,
      biggestWin,
      biggestLoss,
      chartData,
      heatmapData
    }
  }, [filteredData, authUser, timeFilter])

  if (!authUser) {
    return null
  }

  const handleGroupToggle = (groupId: string) => {
    setSelectedGroups(prev => 
      prev.includes(groupId) 
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    )
  }

  const handleSelectAllGroups = () => {
    setSelectedGroups(groups.map(g => g.id))
  }

  const handleDeselectAllGroups = () => {
    setSelectedGroups([])
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Analytics Dashboard
            </h1>
            <p className="text-muted-foreground">Track your poker performance</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-gradient-to-br from-primary/20 to-primary/40 rounded-full flex items-center justify-center text-primary font-bold">
            {authUser.name.charAt(0).toUpperCase()}
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card className="border-border/50 shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Time Filter */}
            <div className="space-y-2">
              <Label>Time Period</Label>
              <Select 
                value={chartType === "heatmap" && timeFilter === "all" ? "30d" : timeFilter} 
                onValueChange={(value) => {
                  // If switching to heatmap and "all" is selected, default to 30d
                  if (chartType === "heatmap" && value === "all") {
                    setTimeFilter("30d")
                  } else {
                    setTimeFilter(value)
                  }
                }}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1d">Last 24 Hours</SelectItem>
                  <SelectItem value="7d">Last 7 Days</SelectItem>
                  <SelectItem value="30d">Last 30 Days</SelectItem>
                  <SelectItem value="1y">Last Year</SelectItem>
                  <SelectItem value="all" disabled={chartType === "heatmap"}>
                    All Time {chartType === "heatmap" ? "(Not available for heatmap)" : ""}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Chart Type Filter */}
            <div className="space-y-2">
              <Label>Chart Type</Label>
              <Select value={chartType} onValueChange={(value: "line" | "heatmap") => setChartType(value)}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="line">
                    <div className="flex items-center gap-2">
                      <LineChartIcon className="h-4 w-4" />
                      Line Chart
                    </div>
                  </SelectItem>
                  <SelectItem value="heatmap">
                    <div className="flex items-center gap-2">
                      <Grid3X3 className="h-4 w-4" />
                      Heatmap
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Group Filter */}
            <div className="space-y-2 flex-1">
              <Label>Groups</Label>
              <div className="border rounded-lg p-3 space-y-2 max-h-32 overflow-y-auto">
                <div className="flex gap-2 mb-2">
                  <Button variant="outline" size="sm" onClick={handleSelectAllGroups}>
                    Select All
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleDeselectAllGroups}>
                    Clear All
                  </Button>
                </div>
                {groups.map(group => (
                  <div key={group.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={group.id}
                      checked={selectedGroups.includes(group.id)}
                      onCheckedChange={() => handleGroupToggle(group.id)}
                    />
                    <Label htmlFor={group.id} className="text-sm font-normal cursor-pointer">
                      {group.name}
                    </Label>
                  </div>
                ))}
                {groups.length === 0 && (
                  <p className="text-sm text-muted-foreground">No groups found</p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-border/50 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Total Profit</span>
            </div>
            <div className={`text-2xl font-bold ${
              analytics.totalProfit >= 0 ? 'text-green-500' : 'text-red-500'
            }`}>
              {analytics.totalProfit >= 0 ? '+' : ''}${analytics.totalProfit.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Average Buy-in</span>
            </div>
            <div className="text-2xl font-bold text-foreground">
              ${analytics.averageBuyIn.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Games Played</span>
            </div>
            <div className="text-2xl font-bold text-foreground">
              {analytics.gamesPlayed}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Win Rate</span>
            </div>
            <div className="text-2xl font-bold text-foreground">
              {analytics.winRate.toFixed(1)}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Winnings Chart */}
      <Card className="border-border/50 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {chartType === "line" ? <TrendingUp className="h-5 w-5 text-primary" /> : <Grid3X3 className="h-5 w-5 text-primary" />}
            {chartType === "line" ? "Profit Over Time" : "Performance Heatmap"}
          </CardTitle>
          <CardDescription>
            {chartType === "line" 
              ? "Your cumulative winnings for the selected period"
              : "Your performance by day of week and hour of day"
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {chartType === "line" ? (
            analytics.chartData.length > 0 ? (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={analytics.chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="date" 
                      className="text-xs"
                      tickFormatter={(date) => new Date(date).toLocaleDateString()}
                    />
                    <YAxis className="text-xs" />
                    <Tooltip 
                      labelFormatter={(date) => new Date(date).toLocaleDateString()}
                      formatter={(value: number, name: string) => [
                        `$${value.toFixed(2)}`, 
                        name === 'cumulative' ? 'Cumulative Profit' : 'Daily Profit'
                      ]}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="cumulative" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-80 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No data available for the selected filters</p>
                  <p className="text-sm">Try adjusting your time period or group selection</p>
                </div>
              </div>
            )
          ) : (
            <div className="h-64 overflow-hidden">
              <HeatmapChart data={analytics.heatmapData} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-border/50 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Performance Highlights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Biggest Win</span>
              <span className="font-semibold text-green-500">
                +${analytics.biggestWin.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Biggest Loss</span>
              <span className="font-semibold text-red-500">
                ${analytics.biggestLoss.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Profit per Game</span>
              <span className="font-semibold">
                ${analytics.gamesPlayed > 0 ? (analytics.totalProfit / analytics.gamesPlayed).toFixed(2) : '0.00'}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Group Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {selectedGroups.length > 0 ? (
                selectedGroups.map(groupId => {
                  const group = groups.find(g => g.id === groupId)
                  const groupGames = filteredData.filter(g => g.groupId === groupId)
                  const groupProfit = groupGames.reduce((sum, game) => {
                    const playerData = game.players.find(p => p.playerId === authUser.id)
                    return sum + (playerData?.profit || 0)
                  }, 0)
                  
                  return (
                    <div key={groupId} className="flex justify-between items-center py-2">
                      <span className="text-sm">{group?.name || 'Unknown Group'}</span>
                      <div className="text-right">
                        <div className={`font-semibold ${groupProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {groupProfit >= 0 ? '+' : ''}${groupProfit.toFixed(2)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {groupGames.length} games
                        </div>
                      </div>
                    </div>
                  )
                })
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Select groups to see breakdown
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Pikkit-style Heatmap Chart Component
interface HeatmapDataPoint {
  date: string
  dateObj: Date
  profit: number
  hasGame: boolean
  gameCount?: number
  dayOfWeek: number
  dayOfMonth: number
  month: number
  year: number
  isOutsideRange?: boolean
}

function HeatmapChart({ data }: { data: HeatmapDataPoint[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <Grid3X3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No data available for heatmap</p>
        </div>
      </div>
    )
  }

  // Calculate min and max values for color scaling
  const values = data.map(d => d.profit).filter(v => v !== 0)
  const maxValue = Math.max(...values, 0)
  const minValue = Math.min(...values, 0)
  const maxAbsValue = Math.max(Math.abs(maxValue), Math.abs(minValue))

  // Get color intensity based on value (0-4 levels like GitHub)
  const getIntensityLevel = (value: number, hasGame: boolean) => {
    if (!hasGame) return 0
    if (maxAbsValue === 0) return 1
    
    const intensity = Math.abs(value) / maxAbsValue
    if (intensity > 0.75) return 4
    if (intensity > 0.5) return 3
    if (intensity > 0.25) return 2
    return 1
  }

  // Get color class based on value and intensity (Pikkit-style)
  const getColorClass = (value: number, hasGame: boolean) => {
    const level = getIntensityLevel(value, hasGame)
    
    if (level === 0) return "bg-gray-100 dark:bg-gray-800"
    
    if (value > 0) {
      // Green for profits
      switch (level) {
        case 1: return "bg-green-200 dark:bg-green-900"
        case 2: return "bg-green-300 dark:bg-green-700"
        case 3: return "bg-green-400 dark:bg-green-600"
        case 4: return "bg-green-500 dark:bg-green-500"
        default: return "bg-green-200 dark:bg-green-900"
      }
    } else {
      // Red for losses
      switch (level) {
        case 1: return "bg-red-200 dark:bg-red-900"
        case 2: return "bg-red-300 dark:bg-red-700"
        case 3: return "bg-red-400 dark:bg-red-600"
        case 4: return "bg-red-500 dark:bg-red-500"
        default: return "bg-red-200 dark:bg-red-900"
      }
    }
  }

  // Create a proper calendar grid
  const weeks: HeatmapDataPoint[][] = []
  let currentWeek: HeatmapDataPoint[] = []
  
  // Start from the first date and go to Sunday before it
  const firstDate = new Date(data[0].dateObj)
  const lastDate = new Date(data[data.length - 1].dateObj)
  
  // Find the Sunday before the first date
  const startDate = new Date(firstDate)
  startDate.setDate(firstDate.getDate() - firstDate.getDay())
  
  // Find the Saturday after the last date
  const endDate = new Date(lastDate)
  endDate.setDate(lastDate.getDate() + (6 - lastDate.getDay()))
  
  // Create a map for quick lookup
  const dataMap = new Map()
  data.forEach(d => {
    dataMap.set(d.date, d)
  })
  
  // Fill calendar grid
  const currentDate = new Date(startDate)
  while (currentDate <= endDate) {
    const dateKey = currentDate.toISOString().split('T')[0]
    const dayData = dataMap.get(dateKey) || {
      date: dateKey,
      dateObj: new Date(currentDate),
      profit: 0,
      hasGame: false,
      dayOfWeek: currentDate.getDay(),
      dayOfMonth: currentDate.getDate(),
      month: currentDate.getMonth(),
      year: currentDate.getFullYear(),
      isOutsideRange: currentDate < firstDate || currentDate > lastDate
    }
    
    currentWeek.push(dayData)
    
    if (currentWeek.length === 7) {
      weeks.push(currentWeek)
      currentWeek = []
    }
    
    currentDate.setDate(currentDate.getDate() + 1)
  }
  
  if (currentWeek.length > 0) {
    weeks.push(currentWeek)
  }

  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

  // Calculate month positions for labels
  const monthPositions: { month: string; position: number }[] = []
  weeks.forEach((week, weekIndex) => {
    const firstDayOfWeek = week[0]
    if (firstDayOfWeek && firstDayOfWeek.dayOfMonth <= 7) {
      const monthName = monthNames[firstDayOfWeek.month]
      const year = firstDayOfWeek.year
      monthPositions.push({
        month: `${monthName} ${year}`,
        position: weekIndex
      })
    }
  })

  // Calculate responsive sizing
  const containerWidth = weeks.length * 16 + 60 // 16px per week + 60px for day labels
  const availableWidth = 800 // Approximate container width
  const shouldScale = containerWidth > availableWidth
  const scaleFactor = shouldScale ? availableWidth / containerWidth : 1
  const cellSize = Math.max(10, Math.floor(12 * scaleFactor))
  const gapSize = Math.max(1, Math.floor(2 * scaleFactor))

  return (
    <div className="h-full w-full p-2 flex flex-col overflow-hidden">
      {/* Month labels at top */}
      <div className="relative mb-2 h-4 overflow-hidden">
        <div className="flex w-full">
          {monthPositions.map((month, index) => (
            <div
              key={index}
              className="text-xs text-muted-foreground font-medium absolute"
              style={{ 
                left: `${60 + (month.position * (cellSize + gapSize))}px`,
                fontSize: `${Math.max(10, 12 * scaleFactor)}px`
              }}
            >
              {month.month}
            </div>
          ))}
        </div>
      </div>

      {/* Main calendar grid */}
      <div className="flex w-full overflow-x-auto">
        {/* Day labels on the left */}
        <div className="flex flex-col shrink-0 w-12" style={{ gap: `${gapSize}px` }}>
          {dayLabels.map((day, index) => (
            <div 
              key={index} 
              className="text-xs text-muted-foreground font-medium flex items-center justify-end pr-2"
              style={{ 
                height: `${cellSize}px`,
                fontSize: `${Math.max(10, 11 * scaleFactor)}px`
              }}
            >
              {index % 2 === 1 ? day.slice(0, 3) : ''}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="flex flex-1 min-w-0" style={{ gap: `${gapSize}px` }}>
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="flex flex-col" style={{ gap: `${gapSize}px` }}>
              {week.map((day, dayIndex) => {
                return (
                  <div
                    key={`${weekIndex}-${dayIndex}`}
                    className={`
                      rounded-sm cursor-pointer transition-all hover:ring-2 hover:ring-gray-400 hover:ring-opacity-50 relative group
                      ${day.isOutsideRange ? 'opacity-30' : ''}
                      ${getColorClass(day.profit, day.hasGame)}
                    `}
                    style={{
                      width: `${cellSize}px`,
                      height: `${cellSize}px`
                    }}
                    title={`${day.dateObj.toLocaleDateString()} - ${day.hasGame ? `$${day.profit.toFixed(2)}` : 'No games'}`}
                  >
                    {/* Tooltip on hover */}
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap pointer-events-none">
                      <div className="font-medium">{day.dateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</div>
                      <div className={day.hasGame ? (day.profit >= 0 ? 'text-green-400' : 'text-red-400') : 'text-gray-400'}>
                        {day.hasGame ? `${day.profit >= 0 ? '+' : ''}$${day.profit.toFixed(2)}` : 'No games'}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend at bottom */}
      <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
        <span>Less</span>
        <div className="flex items-center" style={{ gap: `${Math.max(1, gapSize)}px` }}>
          <div 
            className="bg-gray-100 dark:bg-gray-800 rounded-sm" 
            style={{ width: `${Math.max(8, cellSize * 0.7)}px`, height: `${Math.max(8, cellSize * 0.7)}px` }}
          ></div>
          <div 
            className="bg-green-200 dark:bg-green-900 rounded-sm" 
            style={{ width: `${Math.max(8, cellSize * 0.7)}px`, height: `${Math.max(8, cellSize * 0.7)}px` }}
          ></div>
          <div 
            className="bg-green-300 dark:bg-green-700 rounded-sm" 
            style={{ width: `${Math.max(8, cellSize * 0.7)}px`, height: `${Math.max(8, cellSize * 0.7)}px` }}
          ></div>
          <div 
            className="bg-green-400 dark:bg-green-600 rounded-sm" 
            style={{ width: `${Math.max(8, cellSize * 0.7)}px`, height: `${Math.max(8, cellSize * 0.7)}px` }}
          ></div>
          <div 
            className="bg-green-500 dark:bg-green-500 rounded-sm" 
            style={{ width: `${Math.max(8, cellSize * 0.7)}px`, height: `${Math.max(8, cellSize * 0.7)}px` }}
          ></div>
        </div>
        <span>More</span>
      </div>
    </div>
  )
} 