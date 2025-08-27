"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Search, SlidersHorizontal, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import BottomNavigation from "@/components/bottom-navigation"
import CartIcon from "@/components/cart-icon"
import Footer from "@/components/footer"
import FoodItemCard from "@/components/food-item-card"
import SearchBar from "@/components/search-bar"
import type { MenuItem } from "@/services/canteen-service"
import { motion } from "framer-motion"
import { useCart } from "@/hooks/use-cart"
import { useAuth } from "@/hooks/use-auth"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "@/hooks/use-toast"
import { isTimeWithinWindow } from "@/lib/utils"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

function SearchPageContent() {
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get("q") || ""
  const { addItem, items: cartItems, clearCart, updateQuantity, removeItem } = useCart()
  const { isAuthenticated } = useAuth()
  const router = useRouter()

  const [query, setQuery] = useState(initialQuery)
  const [results, setResults] = useState<MenuItem[]>([])
  const [filteredResults, setFilteredResults] = useState<MenuItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [categories, setCategories] = useState<string[]>([])
  const [busyItemId, setBusyItemId] = useState<number | null>(null)
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [pendingAddItem, setPendingAddItem] = useState<any | null>(null)

  const baseUrl = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "")
  // Cache canteenId->name to avoid repeated fetches across searches
  const [canteenNameCache, setCanteenNameCache] = useState<Record<number, string>>(() => {
    try {
      if (typeof window !== "undefined") {
        const s = sessionStorage.getItem("canteenNameCache")
        return s ? JSON.parse(s) : {}
      }
    } catch {}
    return {}
  })
  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        sessionStorage.setItem("canteenNameCache", JSON.stringify(canteenNameCache))
      }
    } catch {}
  }, [canteenNameCache])
  const getToken = () =>
    (typeof window !== "undefined" && (localStorage.getItem("auth_token") || localStorage.getItem("token"))) || null

  // Filter states
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 200])
  const [sortBy, setSortBy] = useState<string>("relevance")

  // Load categories (from backend) and perform initial search
  useEffect(() => {
    const loadData = async () => {
      try {
        const base = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || ""
        const res = await fetch(`${base}/api/explore/categories`, { cache: "no-store" })
        if (!res.ok) throw new Error(`Categories HTTP ${res.status}`)
        const json: { code: number; message: string; data: { name: string }[] } = await res.json()
        if (json.code !== 1 || !Array.isArray(json.data)) throw new Error(json.message || "Failed categories fetch")
        setCategories(json.data.map((cat) => cat.name))

        if (initialQuery) {
          performSearch(initialQuery)
        }
      } catch (error) {
        console.error("Failed to load data:", error)
      }
    }

    loadData()
  }, [initialQuery])

  // Apply filters and sorting
  useEffect(() => {
    let filtered = [...results]

    // Category filter
    if (selectedCategory !== "all") {
      filtered = filtered.filter((item) => item.category === selectedCategory)
    }

    // Price filter
    filtered = filtered.filter((item) => item.price >= priceRange[0] && item.price <= priceRange[1])

    // Sorting
    switch (sortBy) {
      case "price-low":
        filtered.sort((a, b) => a.price - b.price)
        break
      case "price-high":
        filtered.sort((a, b) => b.price - a.price)
        break
      case "rating":
        filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0))
        break
      case "name":
        filtered.sort((a, b) => a.name.localeCompare(b.name))
        break
      default: // relevance
        // Keep original order from search
        break
    }

    setFilteredResults(filtered)
  }, [results, selectedCategory, priceRange, sortBy])

  // Ensure canteen names are available in cache; returns merged cache
  const ensureCanteenNames = async (items: MenuItem[]) => {
    const needed = Array.from(
      new Set(
        items
          .map((it) => Number(it.canteenId))
          .filter((n) => Number.isFinite(n))
      )
    ) as number[]
    const toFetch = needed.filter((id) => !canteenNameCache[id])
    if (toFetch.length === 0) return canteenNameCache
    const entries: Array<[number, string]> = []
    await Promise.all(
      toFetch.map(async (id) => {
        try {
          const res = await fetch(`${baseUrl}/api/explore/canteen/details/${id}`, { cache: "no-store" })
          const json = await res.json().catch(() => ({} as any))
          const name = json?.data?.CanteenName || `Canteen ${id}`
          entries.push([id, name])
        } catch {
          entries.push([id, `Canteen ${id}`])
        }
      })
    )
    const merged: Record<number, string> = { ...canteenNameCache }
    for (const [id, name] of entries) merged[id] = name
    return merged
  }

  const performSearch = async (searchQuery: string) => {
    const q = searchQuery.trim()
    if (!q) {
      setResults([])
      return
    }

    setIsLoading(true)
    try {
      const url = `${baseUrl}/api/explore/search/items?q=${encodeURIComponent(q)}&available_now=true&offset=0&limit=50`
      const res = await fetch(url, { cache: "no-store" })
      if (!res.ok) throw new Error(`Search HTTP ${res.status}`)
      const json = await res.json()
      const rawArr: any[] = Array.isArray(json?.data) ? json.data : []
      const buildImageUrl = (path?: string | null) => {
        if (!path) return "/placeholder.svg"
        return `${baseUrl}${String(path).startsWith("/") ? path : `/${path}`}`
      }
      const rate = (seed: string) => {
        let h = 0
        for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0
        const inc = ((h % 50) + 1) / 100
        return Number((4.5 + inc).toFixed(2))
      }
      let mapped: MenuItem[] = rawArr
        // include unavailable too; UI will gray out and allow add
        .map((it) => {
          const id = Number(it.ItemId)
          const cId = String(it.canteenId ?? "")
          const name = String(it.ItemName || "Item")
          return {
            id,
            name,
            description: String(it.Description || ""),
            price: Number(it.Price || 0),
            image: buildImageUrl(it.ImagePath),
            category: String(it.category || ""),
            canteenId: cId,
            canteenName: `Canteen ${it.canteenId}`,
            available: it.ava !== false,
            rating: rate(`${id}-${name}`),
            preparationTime: undefined,
            ingredients: undefined,
            nutritionInfo: undefined as any,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
        })
      // Attach real canteen names and cache them for reuse
      const mergedCache = await ensureCanteenNames(mapped)
      setCanteenNameCache(mergedCache)
      mapped = mapped.map((it) => {
        const cidNum = Number(it.canteenId)
        return {
          ...it,
          canteenName: Number.isFinite(cidNum) ? (mergedCache[cidNum] || it.canteenName) : it.canteenName,
        }
      })
      setResults(mapped)
    } catch (error) {
      console.error("Search failed:", error)
      setResults([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = (searchQuery: string) => {
    setQuery(searchQuery)
    performSearch(searchQuery)
  }

  const clearBackendCart = async () => {
    const token = getToken()
    if (!token) return
    try {
      await fetch(`${baseUrl}/api/user/cart/clearCart`, { method: "DELETE", headers: { Authorization: token } })
    } catch {}
  }

  const addBackendToCart = async (itemId: number, quantity = 1) => {
    const token = getToken()
    if (!token) throw new Error("Not authenticated")
    const url = `${baseUrl}/api/user/cart/addToCart?id=${encodeURIComponent(String(itemId))}&quantity=${encodeURIComponent(String(quantity))}`
    const res = await fetch(url, { method: "GET", headers: { Authorization: token }, cache: "no-store" })
    if (!res.ok) throw new Error(await res.text())
  }

  const updateBackendCartQuantity = async (itemId: number, quantity: number) => {
    const token = getToken()
    if (!token) throw new Error("Not authenticated")
    const res = await fetch(`${baseUrl}/api/user/cart/updateCart`, {
      method: "POST",
      headers: {
        Authorization: token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ itemId, quantity }),
    })
    if (!res.ok) throw new Error(await res.text())
  }

  const syncLocalCartFromBackend = async () => {
    const token = getToken()
    if (!token) return
    try {
      const res = await fetch(`${baseUrl}/api/user/cart/getCartItems`, {
        method: "GET",
        headers: { Authorization: token },
        cache: "no-store",
      })
      if (!res.ok) return
      const data = await res.json()
      const payload = data?.data
      if (!payload) return
      clearCart()
      const canteenName = payload.CanteenName || ""
      const itemsArr: any[] = Array.isArray(payload.cart) ? payload.cart : []
      itemsArr.forEach((it) => {
        const img = it.ImagePath
          ? `${baseUrl}${String(it.ImagePath).startsWith("/") ? it.ImagePath : `/${it.ImagePath}`}`
          : "/placeholder.svg"
        const qty = Number(it.quantity ?? 1) || 1
  addItem({ id: Number(it.ItemId), name: it.ItemName, price: Number(it.Price) || 0, quantity: qty, canteen: canteenName, image: img, category: String(it.category || "") })
      })
    } catch {}
  }

  const handleAddToCart = async (item: any) => {
    if (!isAuthenticated) {
      const cid = (item as any).canteenId
      const isNumeric = typeof cid === "number" || (typeof cid === "string" && /^\d+$/.test(cid))
      router.push(isNumeric ? `/canteen/${cid}` : "/canteens")
      return
    }
    try {
      let different = false
      const token = getToken()
      if (token) {
        try {
          const res = await fetch(`${baseUrl}/api/user/cart/getCartItems`, { method: "GET", headers: { Authorization: token }, cache: "no-store" })
          if (res.ok) {
            const data = await res.json()
            const meta = data?.data
            if (meta && Array.isArray(meta.cart) && meta.cart.length > 0) {
              const backendCanteenId = Number(meta.canteenId)
              const currentCanteenId = Number((item as any).canteenId)
              if (!Number.isNaN(backendCanteenId) && !Number.isNaN(currentCanteenId)) {
                different = backendCanteenId !== currentCanteenId
              } else {
                const backendName = String(meta.CanteenName || meta.canteenName || "").toLowerCase()
                const currentName = String(item.canteen || "").toLowerCase()
                if (backendName && currentName) different = backendName !== currentName
              }
            }
          }
        } catch {}
      } else if (cartItems.length > 0) {
        different = cartItems[0].canteen !== item.canteen
      }
      if (different) {
        setPendingAddItem(item)
        setShowClearConfirm(true)
        return
      }
      await handleIncrement(item)
    } catch {
  addItem({ id: item.id, name: item.name, price: item.price, quantity: 1, canteen: item.canteen, image: item.image, category: item.category })
    }
  }

  const handleIncrement = async (item: any) => {
    const token = getToken()
    const current = cartItems.find((i) => i.id === item.id)?.quantity || 0
    if (current === 0) {
  addItem({ id: item.id, name: item.name, price: item.price, quantity: 1, canteen: item.canteen, image: item.image, category: item.category })
    } else {
      updateQuantity(item.id, current + 1)
    }
    setBusyItemId(item.id)
    if (!token) {
      setBusyItemId(null)
      return
    }
    try {
      let existingQty = 0
      try {
        const res = await fetch(`${baseUrl}/api/user/cart/getCartItems`, { method: "GET", headers: { Authorization: token }, cache: "no-store" })
        if (res.ok) {
          const data = await res.json()
          const arr: any[] = Array.isArray(data?.data?.cart) ? data.data.cart : []
          const found = arr.find((it) => Number(it.ItemId) === Number(item.id))
          if (found) existingQty = Number(found.quantity ?? 1) || 1
        }
      } catch {}
      if (existingQty > 0) await updateBackendCartQuantity(Number(item.id), existingQty + 1)
      else await addBackendToCart(item.id, 1)
  await syncLocalCartFromBackend()
  try { await postAddScheduleCheck(item) } catch {}
    } catch {
      // keep optimistic state
    } finally {
      setBusyItemId(null)
    }
  }

  const handleDecrement = async (item: any) => {
    const token = getToken()
    const current = cartItems.find((i) => i.id === item.id)?.quantity || 0
    const next = Math.max(0, current - 1)
    if (next === 0) removeItem(item.id)
    else updateQuantity(item.id, next)
    setBusyItemId(item.id)
    if (!token) {
      setBusyItemId(null)
      return
    }
    try {
      if (next > 0) {
        await updateBackendCartQuantity(Number(item.id), next)
      } else {
        try {
          await fetch(`${baseUrl}/api/user/cart/removeItemCart?id=${encodeURIComponent(String(item.id))}`, {
            method: "DELETE",
            headers: { Authorization: token },
          })
        } catch {}
      }
      await syncLocalCartFromBackend()
    } catch {
      // keep optimistic state
    } finally {
      setBusyItemId(null)
    }
  }

  function getSelectedTimeHHMM(): string | null {
    try {
      const mode = (localStorage.getItem("kleats_schedule_mode") || "asap").toLowerCase()
      if (mode === "slot") {
        const slot = localStorage.getItem("kleats_schedule_slot") || ""
        const m = slot.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i)
        if (m) {
          let h = parseInt(m[1], 10)
          const minutes = parseInt(m[2], 10)
          const ampm = m[3].toUpperCase()
          if (ampm === "PM" && h !== 12) h += 12
          if (ampm === "AM" && h === 12) h = 0
          const hh = String(h).padStart(2, "0")
          const mm = String(minutes).padStart(2, "0")
          return `${hh}:${mm}`
        }
        return null
      }
      if (mode === "custom") {
        const mins = parseInt(localStorage.getItem("kleats_schedule_mins") || "0", 10)
        const t = new Date(Date.now() + Math.max(0, mins) * 60000)
        const hh = String(t.getHours()).padStart(2, "0")
        const mm = String(t.getMinutes()).padStart(2, "0")
        return `${hh}:${mm}`
      }
      const now = new Date()
      const hh = String(now.getHours()).padStart(2, "0")
      const mm = String(now.getMinutes()).padStart(2, "0")
      return `${hh}:${mm}`
    } catch {
      return null
    }
  }

  const postAddScheduleCheck = async (item: any) => {
    const base = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || ""
    const targetHHMM = getSelectedTimeHHMM()
    if (!targetHHMM) return
    try {
      const res = await fetch(`${base}/api/explore/item?item_id=${encodeURIComponent(String(item.id))}`, { cache: "no-store" })
      if (!res.ok) return
      const data = await res.json()
      const raw = data?.data
      const st: string | undefined = (raw?.startTime ? String(raw.startTime).slice(0, 5) : (item as any).startTime) || undefined
      const et: string | undefined = (raw?.endTime ? String(raw.endTime).slice(0, 5) : (item as any).endTime) || undefined
      if (!st || !et) return
      const ok = isTimeWithinWindow(targetHHMM, st, et)
      if (!ok) {
        toast({
          title: "Timing mismatch",
          description: `${item.name} is available ${st}–${et}. Your selected time ${targetHHMM} is outside this window. You can keep it for later or adjust time in cart.`,
        })
      }
    } catch {}
  }

  const clearFilters = () => {
    setSelectedCategory("all")
    setPriceRange([0, 200])
    setSortBy("relevance")
  }

  const activeFiltersCount =
    (selectedCategory !== "all" ? 1 : 0) +
    (priceRange[0] !== 0 || priceRange[1] !== 200 ? 1 : 0) +
    (sortBy !== "relevance" ? 1 : 0)

  return (
    <main className="min-h-screen pb-24 page-transition">
      <div className="sticky top-0 z-10 bg-background p-4 shadow-sm">
        <div className="flex items-center space-x-2">
          <Link href="/">
            <Button variant="ghost" size="icon" aria-label="Back to home">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex-1">
            <SearchBar value={query} onChange={setQuery} onSearch={handleSearch} showSuggestions={false} />
          </div>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="relative bg-transparent">
                <SlidersHorizontal className="h-4 w-4" />
                {activeFiltersCount > 0 && (
                  <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 text-xs">
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Filters</SheetTitle>
              </SheetHeader>
              <div className="space-y-6 mt-6">
                {/* Category Filter */}
                <div>
                  <Label className="text-sm font-medium">Category</Label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Price Range Filter */}
                <div>
                  <Label className="text-sm font-medium">
                    Price Range: ₹{priceRange[0]} - ₹{priceRange[1]}
                  </Label>
                  <Slider
                    value={priceRange}
                    onValueChange={(value) => setPriceRange(value as [number, number])}
                    max={200}
                    min={0}
                    step={10}
                    className="mt-2"
                  />
                </div>

                {/* Sort By */}
                <div>
                  <Label className="text-sm font-medium">Sort By</Label>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="relevance">Relevance</SelectItem>
                      <SelectItem value="price-low">Price: Low to High</SelectItem>
                      <SelectItem value="price-high">Price: High to Low</SelectItem>
                      <SelectItem value="rating">Rating</SelectItem>
                      <SelectItem value="name">Name</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                <Button variant="outline" onClick={clearFilters} className="w-full bg-transparent">
                  Clear All Filters
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <div className="container px-4 py-6">
        {/* Search Info */}
        <div className="mb-6">
          {query && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {isLoading ? "Searching..." : `${filteredResults.length} results for "${query}"`}
              </p>
              {activeFiltersCount > 0 && (
                <Badge variant="secondary">
                  {activeFiltersCount} filter{activeFiltersCount > 1 ? "s" : ""} applied
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Results */}
  {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="h-32 bg-muted rounded mb-4"></div>
                  <div className="h-4 bg-muted rounded mb-2"></div>
                  <div className="h-3 bg-muted rounded w-2/3"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredResults.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredResults.map((raw, index) => {
              const item = {
                id: raw.id,
                name: raw.name,
                price: raw.price,
                image: raw.image,
                description: raw.description,
                rating: raw.rating,
                preparationTime: raw.preparationTime,
                canteen: (raw as any).canteen ?? (raw as MenuItem).canteenName,
                canteenId: ((): number | undefined => { const n = Number((raw as any).canteenId); return Number.isFinite(n) ? n : undefined })(),
              }
              const unavailable = (raw as any).available === false
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <FoodItemCard
                    item={item as any}
                    quantity={cartItems.find((i) => i.id === item.id)?.quantity || 0}
                    isLoading={busyItemId === item.id}
                    unavailable={unavailable}
                    onAddToCart={() => handleAddToCart(item)}
                    onIncrement={() => handleIncrement(item)}
                    onDecrement={() => handleDecrement(item)}
                  />
                </motion.div>
              )
            })}
          </div>
        ) : query ? (
          <div className="text-center py-12">
            <Search className="mx-auto h-12 w-12 text-muted-foreground opacity-50 mb-4" />
            <h3 className="text-lg font-medium mb-2">No results found</h3>
            <p className="text-muted-foreground mb-4">We couldn't find any items matching "{query}"</p>
            <Button variant="outline" onClick={() => setQuery("")}>
              Clear Search
            </Button>
          </div>
        ) : (
          <div className="text-center py-12">
            <Search className="mx-auto h-12 w-12 text-muted-foreground opacity-50 mb-4" />
            <h3 className="text-lg font-medium mb-2">Start searching</h3>
            <p className="text-muted-foreground">Enter a search term to find your favorite food items</p>
          </div>
        )}
      </div>

      <AlertDialog open={showClearConfirm} onOpenChange={setShowClearConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Switch canteen?</AlertDialogTitle>
            <AlertDialogDescription>
              Adding this item will clear the items from your current cart. Do you want to continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setPendingAddItem(null) }}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                try { await clearBackendCart() } catch {}
                clearCart()
                const toAdd = pendingAddItem
                setPendingAddItem(null)
                setShowClearConfirm(false)
                if (toAdd) await handleIncrement(toAdd)
              }}
            >
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Footer />
      <CartIcon />
      <BottomNavigation />
    </main>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SearchPageContent />
    </Suspense>
  )
}
