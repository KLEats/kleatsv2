"use client"

import { use as usePromise, useEffect, useMemo, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useCart } from "@/hooks/use-cart"
import CartIcon from "@/components/cart-icon"
import FoodItemCard from "@/components/food-item-card"

type CanteenDetails = {
  CanteenName: string
  Location: string
  fromTime: string
  ToTime: string
  accessTo: string
  poster: string
}

type CategoryItem = {
  name: string
  no_of_items: number
  poster: string
  startTime: string
  endTime: string
}

type ApiResponse<T> = { code: number; message: string; data: T }

type ApiItem = {
  ItemId: number
  ItemName: string
  tags: string[]
  Description: string
  Price: number
  ava: boolean
  ImagePath: string
  category: string
  startTime: string
  endTime: string
  canteenId: number
}

export default function CanteenPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug: canteenId } = usePromise(params)
  const { addItem } = useCart()

  const [canteen, setCanteen] = useState<CanteenDetails | null>(null)
  const [categories, setCategories] = useState<string[]>([])
  const [items, setItems] = useState<ApiItem[]>([])
  const [activeTab, setActiveTab] = useState<string>("all")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || ""
    const load = async () => {
      try {
        setLoading(true)
        setError(null)
        const [detailsRes, categoriesRes, itemsRes] = await Promise.all([
          fetch(`${baseUrl}/api/explore/canteen/details/${canteenId}`, { signal: controller.signal }),
          fetch(`${baseUrl}/api/explore/canteen/categories/${canteenId}`, { signal: controller.signal }),
          fetch(`${baseUrl}/api/explore/items?canteen_id=${canteenId}&offset=0`, { signal: controller.signal }),
        ])

        if (!detailsRes.ok) throw new Error(`Failed to fetch canteen details (${detailsRes.status})`)
        if (!categoriesRes.ok) throw new Error(`Failed to fetch categories (${categoriesRes.status})`)
        if (!itemsRes.ok) throw new Error(`Failed to fetch items (${itemsRes.status})`)

        const detailsJson: ApiResponse<CanteenDetails> = await detailsRes.json()
        const categoriesJson: ApiResponse<CategoryItem[]> = await categoriesRes.json()
        const itemsJson: ApiResponse<ApiItem[] | { data: ApiItem[] }> = await itemsRes.json()

        if (detailsJson.code !== 1) throw new Error(detailsJson.message || "Failed to load canteen")
        if (categoriesJson.code !== 1) throw new Error(categoriesJson.message || "Failed to load categories")

        setCanteen(detailsJson.data)
        setCategories(["all", ...categoriesJson.data.map((c) => c.name)])

        // Items API returns { code, message, data: ApiItem[], meta: ... }
        const itemsData = (itemsJson as any).data?.data || (itemsJson as any).data || []
        setItems(Array.isArray(itemsData) ? itemsData : [])
      } catch (e: any) {
        if (e.name !== "AbortError") setError(e.message || "Failed to load data")
      } finally {
        setLoading(false)
      }
    }
    load()
    return () => controller.abort()
  }, [canteenId])

  const filteredItems = useMemo(() => {
    if (activeTab === "all") return items
    return items.filter((i) => i.category === activeTab)
  }, [items, activeTab])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading menu...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">{error}</p>
          <Link href="/">
            <button className="px-4 py-2 bg-primary text-white rounded-md">Go Home</button>
          </Link>
        </div>
      </div>
    )
  }

  if (!canteen) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Canteen not found</p>
          <Link href="/">
            <button className="px-4 py-2 bg-primary text-white rounded-md">Go Home</button>
          </Link>
        </div>
      </div>
    )
  }

  const baseUrl = process.env.NEXT_PUBLIC_API_URL || ""
  const posterUrl = canteen.poster ? `${baseUrl}${canteen.poster}` : "/placeholder.svg"
  const hours = [canteen.fromTime, canteen.ToTime].filter(Boolean).join(" - ")

  const handleAddToCart = (item: any) => {
    addItem({
      id: item.id,
      name: item.name,
      price: item.price,
      quantity: 1,
      canteen: canteen.CanteenName,
      image: item.image,
    })
  }

  return (
    <div className="min-h-screen pb-16">
      <div className="relative h-48">
        <Link href="/" className="absolute left-4 top-4 z-10 rounded-full bg-background/80 p-2">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <Image src={posterUrl} alt={canteen.CanteenName} fill className="object-cover" />
      </div>

      <div className="container px-4 py-6">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">{canteen.CanteenName}</h1>
            {canteen.accessTo ? <Badge className="bg-primary">{canteen.accessTo}</Badge> : null}
          </div>
          <p className="text-sm text-muted-foreground">{canteen.Location}</p>
          <p className="text-sm text-muted-foreground">{hours ? `Hours: ${hours}` : ""}</p>
        </div>

        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6 w-full overflow-x-auto">
            {categories.map((category) => (
              <TabsTrigger key={category} value={category} className="capitalize">
                {category}
              </TabsTrigger>
            ))}
          </TabsList>
          <TabsContent value={activeTab} className="mt-0">
            <div className="grid gap-4">
              {filteredItems.length > 0 ? (
                filteredItems.map((apiItem) => {
                  const mapped = {
                    id: apiItem.ItemId,
                    name: apiItem.ItemName,
                    price: apiItem.Price,
                    canteen: canteen.CanteenName,
                    image: apiItem.ImagePath ? `${baseUrl}${apiItem.ImagePath}` : "/placeholder.svg",
                    category: apiItem.category,
                    description: apiItem.Description,
                  }
                  return <FoodItemCard key={mapped.id} item={mapped} onAddToCart={handleAddToCart} />
                })
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No items available in this category</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <CartIcon />
    </div>
  )
}
