"use client"

import { useEffect, useMemo, useState } from "react"
import BottomNavigation from "@/components/bottom-navigation"
import CartIcon from "@/components/cart-icon"
import Footer from "@/components/footer"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"
import Link from "next/link"
import { motion } from "framer-motion"
import SearchBar from "@/components/search-bar"
import { isCanteenOpen } from "@/services/canteen-service"

type CanteenApiItem = {
  canteenId: number
  CanteenName: string
  Location: string
  fromTime: string
  ToTime: string
  accessTo: string
  poster: string
}

type ExploreCanteensResponse = {
  code: number
  message: string
  data: CanteenApiItem[]
}

export default function CanteensPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [canteens, setCanteens] = useState<CanteenApiItem[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    const load = async () => {
      try {
        setLoading(true)
        setError(null)
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || ""
        const res = await fetch(`${baseUrl}/api/explore/canteens`, {
          signal: controller.signal,
          headers: { "Content-Type": "application/json" },
        })
        if (!res.ok) throw new Error(`Failed to fetch canteens (${res.status})`)
        const json: ExploreCanteensResponse = await res.json()
        if (json.code !== 1 || !Array.isArray(json.data)) {
          throw new Error(json.message || "Unexpected API response")
        }
        setCanteens(json.data)
      } catch (e: any) {
        if (e.name !== "AbortError") setError(e.message || "Failed to load canteens")
      } finally {
        setLoading(false)
      }
    }
    load()
    return () => controller.abort()
  }, [])

  const filteredCanteens = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return canteens
    return canteens.filter(
      (c) =>
        c.CanteenName.toLowerCase().includes(q) ||
        (c.Location || "").toLowerCase().includes(q),
    )
  }, [canteens, searchQuery])

  return (
    <main className="min-h-screen pb-24 page-transition">
      <div className="sticky top-0 z-10 bg-background p-4 shadow-sm">
        <h1 className="text-xl font-bold">Canteens</h1>
      </div>

      <div className="container px-4 py-6">
        <div className="mb-6">
          <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Search for canteens..." />
        </div>

        {loading ? (
          <div className="py-10 text-center text-sm text-muted-foreground">Loading canteens...</div>
        ) : error ? (
          <div className="py-10 text-center text-sm text-destructive">{error}</div>
        ) : (
          <div className="grid gap-4">
            {filteredCanteens.map((canteen, index) => {
              const imageUrl = canteen.poster
                ? `${process.env.NEXT_PUBLIC_API_URL || ""}${canteen.poster}`
                : "/placeholder.svg"
              const hours = [canteen.fromTime, canteen.ToTime].filter(Boolean).join(" - ")
              const isOpen = isCanteenOpen(canteen.fromTime, canteen.ToTime)

              const canteenCard = (
                <Card className={`overflow-hidden ${isOpen ? "card-hover" : "opacity-50 cursor-not-allowed"}`}>
                  <CardContent className="p-0">
                    <div className="relative h-40">
                      <Image src={imageUrl} alt={canteen.CanteenName} fill className="object-cover" />
                      {canteen.accessTo ? (
                        <Badge className="absolute right-2 top-2 bg-primary">{canteen.accessTo}</Badge>
                      ) : null}
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
                      <p className="text-sm text-muted-foreground">{canteen.Location || ""}</p>
                      <div className="mt-2 flex justify-between">
                        <p className="text-xs text-muted-foreground">{hours ? `Hours: ${hours}` : ""}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )

              return (
                <motion.div
                  key={canteen.canteenId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  {isOpen ? (
                    <Link href={`/canteen/${canteen.canteenId}`}>{canteenCard}</Link>
                  ) : (
                    <div className="cursor-not-allowed">{canteenCard}</div>
                  )}
                </motion.div>
              )
            })}
          </div>
        )}
      </div>

      <Footer />
      <CartIcon />
      <BottomNavigation />
    </main>
  )
}