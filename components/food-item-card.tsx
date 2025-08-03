"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { Plus } from "lucide-react"
import FavoriteButton from "./favorite-button"
import { Badge } from "@/components/ui/badge"

interface FoodItemCardProps {
  item: {
    id: number
    name: string
    price: number
    canteen?: string
    canteenName?: string
    image?: string
    category?: string
    description?: string
    rating?: number
    preparationTime?: string
  }
  onAddToCart: (item: any) => void
}

export default function FoodItemCard({ item, onAddToCart }: FoodItemCardProps) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="flex p-0">
        <div className="flex-1 p-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-semibold">{item.name}</h3>
              <p className="mb-1 text-xs text-muted-foreground">{item.canteen || item.canteenName}</p>
            </div>
            {item.rating && (
              <Badge variant="outline" className="bg-primary/10 text-primary">
                ★ {item.rating}
              </Badge>
            )}
          </div>
          <p className="mb-2 text-sm text-muted-foreground line-clamp-2">{item.description}</p>
          {item.preparationTime && (
            <p className="text-xs text-muted-foreground mb-2">Prep time: {item.preparationTime}</p>
          )}
          <div className="flex items-center justify-between">
            <span className="font-medium">₹{item.price}</span>
            <Button size="sm" onClick={() => onAddToCart(item)}>
              <Plus className="mr-1 h-4 w-4" />
              Add
            </Button>
          </div>
        </div>
        <div className="relative h-auto w-24">
          <FavoriteButton item={item} />
          <Image src={item.image || "/placeholder.svg"} alt={item.name} fill className="object-cover" />
        </div>
      </CardContent>
    </Card>
  )
}
