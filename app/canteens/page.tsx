"use client"

import { useState } from "react"
import BottomNavigation from "@/components/bottom-navigation"
import CartIcon from "@/components/cart-icon"
import Footer from "@/components/footer"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"
import Link from "next/link"
import { motion } from "framer-motion"

// Import SearchBar
import SearchBar from "@/components/search-bar"

// Sample canteens data
const canteens = [
  {
    CanteenName: "Tree",
    Location: "Tree Block",
    fromTime: "08:00",
    ToTime: "20:00",
    accessTo: "ALL",
    poster: "/placeholder.svg?height=200&width=300",
  },
  {
    CanteenName: "KLU",
    Location: "Tulip Hostel",
    fromTime: "09:00",
    ToTime: "21:00",
    accessTo: "ALL",
    poster: "/placeholder.svg?height=200&width=300",
  },
  {
    CanteenName: "Satish",
    Location: "Engineering Block",
    fromTime: "08:30",
    ToTime: "19:30",
    accessTo: "ALL",
    poster: "/placeholder.svg?height=200&width=300",
  },
]

export default function CanteensPage() {
  const [searchQuery, setSearchQuery] = useState("")

  // Filter canteens based on search query
  const filteredCanteens = canteens.filter(
    (canteen) =>
      canteen.CanteenName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      canteen.Location.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <main className="min-h-screen pb-24 page-transition">
      <div className="sticky top-0 z-10 bg-background p-4 shadow-sm">
        <h1 className="text-xl font-bold">Canteens</h1>
      </div>

      <div className="container px-4 py-6">
        <div className="mb-6">
          <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Search for canteens..." />
        </div>

        <div className="grid gap-4">
          {filteredCanteens.map((canteen, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Link href={`/canteen/${canteen.CanteenName.toLowerCase().replace(/\s+/g, '-')}`}>
                <Card className="card-hover overflow-hidden">
                  <CardContent className="p-0">
                    <div className="relative h-40">
                      <Image
                        src={canteen.poster || "/placeholder.svg"}
                        alt={canteen.CanteenName}
                        fill
                        className="object-cover"
                      />
                      <Badge className="absolute right-2 top-2 bg-primary">★ 4.5+</Badge>
                    </div>
                    <div className="p-4">
                      <h3 className="text-lg font-semibold">{canteen.CanteenName}</h3>
                      <div className="mt-2 flex justify-between">
                        <p className="text-xs text-muted-foreground">Location: {canteen.Location}</p>
                        <p className="text-xs text-muted-foreground">
                          {canteen.fromTime && canteen.ToTime ? `${canteen.fromTime} - ${canteen.ToTime}` : "Hours not specified"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>

      <Footer />
      <CartIcon />
      <BottomNavigation />
    </main>
  )
}
