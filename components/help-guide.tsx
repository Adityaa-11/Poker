"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { HelpCircle, Users, Play, DollarSign, Share } from "lucide-react"

const helpSections = [
  {
    id: "getting-started",
    title: "Getting Started",
    icon: Play,
    items: [
      {
        question: "How do I create my first poker group?",
        answer: "Click 'Create New Group' on the home page, give it a name like 'Friday Night Poker', and add a description. You can then invite friends using the invite link."
      },
      {
        question: "How do I track a poker game?",
        answer: "Go to your group and click 'New Game'. Set the stakes, buy-in, and bank person. Add players as they join, then update their cash-out amounts when the game ends."
      },
      {
        question: "What if someone rebuys during the game?",
        answer: "You can edit any player's buy-in amount during the game by clicking the edit button next to their name and updating their total buy-in."
      }
    ]
  },
  {
    id: "groups",
    title: "Managing Groups",
    icon: Users,
    items: [
      {
        question: "How do I invite friends to my group?",
        answer: "Go to your group page, click the 'Invite' tab, and share the invite link. Friends can join by clicking the link and entering their name."
      },
      {
        question: "Can I remove someone from a group?",
        answer: "Currently, all members have equal access. In future updates, we'll add admin controls for group management."
      },
      {
        question: "How many people can be in a group?",
        answer: "There's no limit! You can have as many members as you want in a group."
      }
    ]
  },
  {
    id: "settlements",
    title: "Settlements & Money",
    icon: DollarSign,
    items: [
      {
        question: "How are settlements calculated?",
        answer: "When a game is completed, the app automatically calculates who owes money to whom based on profits and losses, minimizing the number of transactions needed."
      },
      {
        question: "How do I mark a payment as complete?",
        answer: "Go to the 'Settle Up' page and click 'Mark as Paid' next to any settlement. This will remove it from your pending payments."
      },
      {
        question: "What if the game doesn't balance?",
        answer: "Check that all buy-ins and cash-outs are entered correctly. The game should show 'Unbalanced' if the total money in doesn't equal money out."
      }
    ]
  },
  {
    id: "tips",
    title: "Pro Tips",
    icon: Share,
    items: [
      {
        question: "Best practices for tracking games?",
        answer: "Always designate one person as the 'bank' to handle all money. Record buy-ins immediately when players join, and double-check cash-outs before completing the game."
      },
      {
        question: "How do I handle tournaments?",
        answer: "For tournaments, set the buy-in amount and track final payouts in the cash-out field. The app will calculate net winnings automatically."
      },
      {
        question: "Can I use this for other games?",
        answer: "Absolutely! This works for any game where you're tracking buy-ins and payouts - blackjack, fantasy sports, or any gambling activity."
      }
    ]
  }
]

export function HelpGuide() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <HelpCircle className="h-4 w-4 mr-2" />
          Help
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5" />
            PokerPals Help Guide
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {helpSections.map((section) => {
            const IconComponent = section.icon
            return (
              <Card key={section.id}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <IconComponent className="h-5 w-5" />
                    {section.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible>
                    {section.items.map((item, index) => (
                      <AccordionItem key={index} value={`${section.id}-${index}`}>
                        <AccordionTrigger className="text-left">
                          {item.question}
                        </AccordionTrigger>
                        <AccordionContent className="text-muted-foreground">
                          {item.answer}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            )
          })}
          
          <Card>
            <CardHeader>
              <CardTitle>Need More Help?</CardTitle>
              <CardDescription>
                Can't find what you're looking for? We're here to help!
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button variant="outline" className="h-auto p-4">
                  <div className="text-left">
                    <div className="font-medium">Email Support</div>
                    <div className="text-sm text-muted-foreground">help@pokerpals.app</div>
                  </div>
                </Button>
                <Button variant="outline" className="h-auto p-4">
                  <div className="text-left">
                    <div className="font-medium">Feature Request</div>
                    <div className="text-sm text-muted-foreground">Suggest improvements</div>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
} 