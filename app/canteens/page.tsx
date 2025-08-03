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
import { isCanteenOpen } from "@/services/canteen-service"

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
          {filteredCanteens.map((canteen, index) => {
            const isOpen = isCanteenOpen(canteen.fromTime, canteen.ToTime)
            const canteenCard = (
              <Card className={`overflow-hidden ${isOpen ? 'card-hover' : 'opacity-50 cursor-not-allowed'}`}>
                <CardContent className="p-0">
                  <div className="relative h-40">
                    <Image
                      src={canteen.poster || "/placeholder.svg"}
                      alt={canteen.CanteenName}
                      fill
                      className="object-cover"
                    />
                    <Badge className="absolute right-2 top-2 bg-primary">★ 4.5+</Badge>
                    {!isOpen && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <Badge variant="secondary" className="text-white bg-red-500">
                          CLOSED
                        </Badge>
                      </div>
                    )}
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
            )

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                {isOpen ? (
                  <Link href={`/canteen/${canteen.CanteenName.toLowerCase().replace(/\s+/g, '-')}`}>
                    {canteenCard}
                  </Link>
                ) : (
                  <div className="cursor-not-allowed">
                    {canteenCard}
                  </div>
                )}
              </motion.div>
            )
          })}
        </div>
      </div>

      <Footer />
      <CartIcon />
      <BottomNavigation />
    </main>
  )
}
