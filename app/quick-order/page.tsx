"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import BottomNavigation from "@/components/bottom-navigation"
import { ArrowLeft, Clock } from "lucide-react"
import Link from "next/link"
import { Progress } from "@/components/ui/progress"
import { useOrders } from "@/hooks/use-orders"
import { useCart } from "@/hooks/use-cart"

type SavedOrder = {
  id: number
  name: string
  items: string[]
  totalPrice: number
  canteen: string
}

export default function QuickOrderPage() {
  const { orders } = useOrders()
  const { addItem } = useCart()
  const [savedOrders] = useState<SavedOrder[]>([
    {
      id: 1,
      name: "My Usual",
      items: ["Masala Dosa", "Filter Coffee"],
      totalPrice: 75,
      canteen: "KL Adda",
    },
    {
      id: 2,
      name: "Lunch Special",
      items: ["Chicken Rice", "Coke"],
      totalPrice: 110,
      canteen: "Satish",
    },
  ])

  // Calculate time remaining for active orders
  const activeOrders = orders
    .filter((order) => order.status !== "Completed" && order.status !== "Cancelled")
    .map((order) => {
      const estimatedReady = new Date(order.estimatedReadyTime).getTime()
      const now = new Date().getTime()
      const timeRemainingMs = Math.max(0, estimatedReady - now)
      const timeRemainingMinutes = Math.ceil(timeRemainingMs / (1000 * 60))

      return {
        ...order,
        timeRemaining: timeRemainingMinutes,
      }
    })

  // Reorder functionality
  const handleReorder = (order: SavedOrder) => {
    // In a real app, we would fetch the actual items
    // For now, we'll just add a placeholder item
    addItem({
      id: Math.floor(Math.random() * 1000),
      name: order.items[0],
      price: order.totalPrice / order.items.length,
      quantity: 1,
      canteen: order.canteen,
  category: "",
    })

    // Navigate to cart
    window.location.href = "/cart"
  }

  return (
    <div className="min-h-screen pb-16 page-transition">
      <div className="sticky top-0 z-10 flex items-center bg-background p-4 shadow-sm">
        <Link href="/" className="mr-2">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-xl font-bold">Quick Order</h1>
      </div>

      <div className="container px-4 py-6">
        {activeOrders.length > 0 && (
          <section className="mb-8">
            <h2 className="mb-4 text-lg font-semibold">Active Orders</h2>
            {activeOrders.map((order) => (
              <Card key={order.id} className="mb-4">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Order #{order.id}</CardTitle>
                    <Badge variant={order.status === "Ready for Pickup" ? "default" : "secondary"}>
                      {order.status}
                    </Badge>
                  </div>
                  <CardDescription>{order.canteen}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-2 space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span>Time remaining</span>
                      <span className="font-medium">{order.timeRemaining} minutes</span>
                    </div>
                    <Progress value={100 - (order.timeRemaining / 20) * 100} className="h-2" />
                  </div>
                  <div className="mt-4">
                    <p className="text-sm text-muted-foreground">
                      {order.items.map((item) => `${item.name} (x${item.quantity})`).join(", ")}
                    </p>
                    <div className="mt-3 flex justify-between">
                      <span className="text-sm font-medium">Total: ₹{order.totalAmount}</span>
                      <span className="text-sm text-muted-foreground">Paid via {order.paymentMethod}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </section>
        )}

        <section>
          <h2 className="mb-4 text-lg font-semibold">Saved Orders</h2>
          {savedOrders.length > 0 ? (
            savedOrders.map((order) => (
              <Card key={order.id} className="mb-4">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{order.name}</CardTitle>
                    <span className="font-medium">₹{order.totalPrice}</span>
                  </div>
                  <CardDescription>{order.canteen}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="mb-4 text-sm text-muted-foreground">{order.items.join(", ")}</p>
                  <div className="flex items-center justify-between">
                    <Button variant="outline" size="sm">
                      Edit
                    </Button>
                    <Button size="sm" onClick={() => handleReorder(order)}>
                      Order Again
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <Clock className="mb-2 h-10 w-10 text-muted-foreground" />
                <p className="text-center text-muted-foreground">
                  No saved orders yet. Your frequent orders will appear here.
                </p>
              </CardContent>
            </Card>
          )}
        </section>
      </div>

      <BottomNavigation />
    </div>
  )
}
