"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { Plus, Minus, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { motion, AnimatePresence } from "framer-motion"

interface FoodItemCardProps {
  item: {
    id: number
    name: string
    price: number
    canteen: string
    image?: string
    category?: string
    description?: string
    rating?: number
    preparationTime?: string
  }
  unavailable?: boolean
  onAddToCart?: (item: any) => void
  quantity?: number
  onIncrement?: () => void
  onDecrement?: () => void
  isLoading?: boolean
}

export default function FoodItemCard({ item, unavailable = false, onAddToCart, quantity = 0, onIncrement, onDecrement, isLoading = false }: FoodItemCardProps) {
  const handleAction = () => {
    if (onAddToCart) {
      onAddToCart(item)
    } else if (onIncrement) {
      onIncrement()
    }
  }

  return (
    <Card className="overflow-hidden h-full flex flex-col">
      <CardContent className="flex p-0 flex-grow">
        <div className="flex-1 p-4 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start">
              <h3 className="font-semibold leading-tight">{item.name}</h3>
              {item.rating && (
                <Badge variant="outline" className="bg-primary/10 text-primary text-xs flex-shrink-0 ml-2">
                  ★ {item.rating}
                </Badge>
              )}
            </div>
            <p className="mb-1 text-xs text-muted-foreground">{item.canteen}</p>
            <p className="mb-2 text-sm text-muted-foreground line-clamp-2 flex-grow">{item.description}</p>
          </div>
          <div className="mt-2">
            {item.preparationTime && (
              <p className="text-xs text-muted-foreground mb-2">Prep time: {item.preparationTime}</p>
            )}
            <div className="flex items-center justify-between">
              <span className="font-bold text-lg">₹{item.price}</span>
              {quantity > 0 ? (
                <div className="flex items-center gap-2">
                  <Button size="icon" variant="outline" disabled={isLoading} onClick={onDecrement} className="h-8 w-8 rounded-full">
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Minus className="h-4 w-4" />}
                  </Button>
                  <span className="w-6 text-center text-sm font-medium">{quantity}</span>
                  <Button size="icon" variant="default" disabled={isLoading} onClick={onIncrement} className="h-8 w-8 rounded-full">
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  {unavailable && (
                    <Badge variant="outline" className="px-2 py-0.5 text-[10px] rounded-full border-amber-300 text-amber-700 bg-amber-50">
                      Pre-Order
                    </Badge>
                  )}
                  <Button size="sm" disabled={isLoading} onClick={handleAction} className="rounded-full">
                    {isLoading ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Plus className="mr-1 h-4 w-4" />}
                    {isLoading ? "Adding" : "Add"}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="relative h-auto w-28 flex-shrink-0">
          <Image src={item.image || "/placeholder.svg"} alt={item.name} fill className={"object-cover " + (unavailable ? "grayscale opacity-60" : "")} />
          <AnimatePresence>
            {unavailable && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="absolute left-1 top-1 rounded bg-black/70 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white"
              >
                Unavailable
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  )
}
