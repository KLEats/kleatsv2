"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import CartIcon from "@/components/cart-icon"
import FoodItemCard from "@/components/food-item-card"
import { useCart } from "@/hooks/use-cart"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
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
import { isOpenNow } from "@/lib/utils"

type CanteenDetails = {
  CanteenName: string
  Location?: string
  fromTime?: string | null
  ToTime?: string | null
  accessTo?: string
  poster?: string | null
}

type ApiResponse<T> = {
  code: number
  message: string
  data: T
}

type Category = {
  name: string
  no_of_items: number
  poster?: string | null
  startTime?: string | null
  endTime?: string | null
}


// Deterministic rating > 4.5 based on id
function pseudoRating(id: string): string {
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0
  const increment = ((hash % 50) + 1) / 100 // 0.01..0.50
  const rating = 4.5 + increment // 4.51..5.0
  return rating.toFixed(2)
}

// Item API types
type RawItem = {
  ItemId: number
  ItemName: string
  tags?: string[]
  Description?: string
  Price: number
  ava?: boolean
  ImagePath?: string
  category?: string
  startTime?: string
  endTime?: string
  canteenId: number
}

type ItemsResponse = {
  code: number
  message: string
  data: RawItem[]
  meta?: {
    offset: number
    limit: number
    total: number
    hasMore: boolean
  }
}

function mapToCardItem(raw: RawItem, canteenName: string, baseUrl: string) {
  const img = raw.ImagePath
    ? `${baseUrl}${raw.ImagePath.startsWith("/") ? raw.ImagePath : `/${raw.ImagePath}`}`
    : "/placeholder.svg"
  // Deterministic rating > 4.5 for items too
  const ratingSeed = `${raw.ItemId}-${raw.ItemName}`
  const rating = Number(pseudoRating(ratingSeed))
  return {
    id: raw.ItemId,
    name: raw.ItemName,
    price: raw.Price,
    canteen: canteenName,
    image: img,
    category: raw.category,
    description: raw.Description,
    rating,
  }
}

export default function CanteenPage() {
  const { slug } = useParams<{ slug: string }>()
  const canteenId = slug
  const canteenIdNum = Number(canteenId)
  const { addItem, items, clearCart, updateQuantity, removeItem } = useCart()
  const [busyItemId, setBusyItemId] = useState<number | null>(null)
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [pendingAddItem, setPendingAddItem] = useState<any | null>(null)

  const [details, setDetails] = useState<CanteenDetails | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<string>("all")
  const [itemsAll, setItemsAll] = useState<RawItem[]>([])
  const [itemsHasMore, setItemsHasMore] = useState<boolean>(false)
  const [itemsNextOffset, setItemsNextOffset] = useState<number>(0)
  const [itemsFetchingMore, setItemsFetchingMore] = useState<boolean>(false)
  const [observerEnabled, setObserverEnabled] = useState<boolean>(true)
  const [catItemsMap, setCatItemsMap] = useState<Record<string, RawItem[]>>({})
  const [itemsLoading, setItemsLoading] = useState<boolean>(true)
  const [categoryLoading, setCategoryLoading] = useState<boolean>(false)

  // Remember this canteen so other pages can navigate back
  useEffect(() => {
    try {
      if (typeof window !== "undefined" && canteenId) {
        localStorage.setItem("last_canteen_id", String(canteenId))
      }
    } catch {}
  }, [canteenId])

  useEffect(() => {
    let mounted = true
  const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const base = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || ""
        const [dRes, cRes, iRes] = await Promise.all([
          fetch(`${base}/api/explore/canteen/details/${canteenId}`, { cache: "no-store" }),
          fetch(`${base}/api/explore/canteen/categories/${canteenId}`, { cache: "no-store" }),
          fetch(`${base}/api/explore/items?canteen_id=${encodeURIComponent(canteenId)}&offset=0`, {
            cache: "no-store",
          }),
        ])
        if (!dRes.ok) throw new Error(`Details HTTP ${dRes.status}`)
        if (!cRes.ok) throw new Error(`Categories HTTP ${cRes.status}`)
        if (!iRes.ok) throw new Error(`Items HTTP ${iRes.status}`)
        const dJson: ApiResponse<CanteenDetails> = await dRes.json()
        const cJson: ApiResponse<Category[]> = await cRes.json()
        const iJson: ItemsResponse = await iRes.json()
        if (dJson.code !== 1 || !dJson.data) throw new Error(dJson.message || "Failed details fetch")
        if (cJson.code !== 1 || !Array.isArray(cJson.data)) throw new Error(cJson.message || "Failed categories fetch")
        if (iJson.code !== 1 || !Array.isArray(iJson.data)) throw new Error(iJson.message || "Failed items fetch")
        if (mounted) {
          setDetails(dJson.data)
          setCategories(cJson.data)
          const firstPage = iJson.data.filter((it) => it.ava !== false && it.canteenId === canteenIdNum)
          setItemsAll(firstPage)
          // Determine hasMore using meta if provided, else infer from page length
          const limitFromMeta = typeof iJson.meta?.limit === 'number' ? iJson.meta!.limit : 50
          const nextOffset = (typeof iJson.meta?.offset === 'number' ? iJson.meta!.offset + (iJson.meta!.limit || 50) : firstPage.length)
          const hasMore = typeof iJson.meta?.hasMore === 'boolean' ? iJson.meta!.hasMore : firstPage.length >= limitFromMeta
          setItemsHasMore(hasMore)
          setItemsNextOffset(nextOffset)
          setItemsLoading(false)
        }
      } catch (e: any) {
        console.error("Failed to load canteen", e)
        if (mounted) setError("Unable to load canteen details.")
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => {
      mounted = false
    }
  }, [canteenId])

  // Load more items for the All tab
  const loadMoreAll = async () => {
    if (itemsFetchingMore || !itemsHasMore) return
    setItemsFetchingMore(true)
    try {
      const base = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || ""
      const res = await fetch(`${base}/api/explore/items?canteen_id=${encodeURIComponent(canteenId)}&offset=${encodeURIComponent(String(itemsNextOffset))}`,
        { cache: "no-store" })
      if (!res.ok) throw new Error(`Items HTTP ${res.status}`)
      const json: ItemsResponse = await res.json()
      if (json.code !== 1 || !Array.isArray(json.data)) throw new Error(json.message || "Failed items fetch")
      const newBatch = json.data.filter((it) => it.ava !== false && it.canteenId === canteenIdNum)
      // Dedupe by ItemId when appending
      setItemsAll((prev) => {
        const seen = new Set(prev.map((i) => i.ItemId))
        const deduped = newBatch.filter((i) => !seen.has(i.ItemId))
        return [...prev, ...deduped]
      })
      const limitFromMeta = typeof json.meta?.limit === 'number' ? json.meta!.limit : 50
      const nextOffset = typeof json.meta?.offset === 'number' ? json.meta!.offset + (json.meta!.limit || 50) : itemsNextOffset + newBatch.length
      const hasMore = typeof json.meta?.hasMore === 'boolean' ? json.meta!.hasMore : newBatch.length >= limitFromMeta
      setItemsNextOffset(nextOffset)
      setItemsHasMore(hasMore)
    } catch (e) {
      console.error('All tab load more failed', e)
      // If failure, disable auto observer to avoid loops; user can tap button to retry
      setObserverEnabled(false)
    } finally {
      setItemsFetchingMore(false)
    }
  }

  // Auto-load on scroll using IntersectionObserver for All tab
  const [sentinelEl, setSentinelEl] = useState<HTMLDivElement | null>(null)
  useEffect(() => {
    if (!sentinelEl) return
    if (activeTab !== 'all') return
    if (!observerEnabled) return
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          loadMoreAll()
        }
      })
    }, { rootMargin: '200px 0px' })
    io.observe(sentinelEl)
    return () => io.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sentinelEl, activeTab, observerEnabled, itemsNextOffset, itemsHasMore])

  const baseUrl = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "")

  const posterSrc = useMemo(() => {
    if (!details?.poster) return "/placeholder.svg"
    return `${baseUrl}${details.poster.startsWith("/") ? details.poster : `/${details.poster}`}`
  }, [details, baseUrl])

  const openBadge = useMemo(() => {
    const status = isOpenNow(details?.fromTime, details?.ToTime)
    if (status === true) return "Open Now"
    if (status === false) return "Closed"
    return "Hours N/A"
  }, [details])

  // Fetch items by category on demand (must be before any early returns)
  useEffect(() => {
    const fetchByCategory = async () => {
      if (activeTab === "all" || catItemsMap[activeTab]) return
      setCategoryLoading(true)
      try {
        const base = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || ""
        const res = await fetch(`${base}/api/explore/get/items-by-category/${encodeURIComponent(activeTab)}`, {
          cache: "no-store",
        })
        if (!res.ok) throw new Error(`Category HTTP ${res.status}`)
        const json: ItemsResponse = await res.json()
        if (json.code !== 1 || !Array.isArray(json.data)) throw new Error(json.message || "Failed category fetch")
        const filtered = json.data.filter((it) => it.ava !== false && it.canteenId === canteenIdNum)
        setCatItemsMap((prev) => ({ ...prev, [activeTab]: filtered }))
      } catch (e) {
        console.error("Category fetch failed", e)
        setCatItemsMap((prev) => ({ ...prev, [activeTab]: [] }))
      } finally {
        setCategoryLoading(false)
      }
    }
    fetchByCategory()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, canteenIdNum])

  const displayedItems = useMemo(() => {
    if (!details) return []
    const items = activeTab === "all" ? itemsAll : catItemsMap[activeTab] || []
    return items.map((it) => mapToCardItem(it, details.CanteenName, baseUrl))
  }, [activeTab, itemsAll, catItemsMap, details, baseUrl])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading canteen...</p>
        </div>
      </div>
    )
  }

  if (error || !details) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error || "Canteen not found"}</AlertDescription>
          </Alert>
          <div className="mt-4 text-center">
            <Link href="/canteens" className="underline text-primary">
              Back to canteens
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const tabKeys = ["all", ...categories.map((c) => c.name)]

  // Helpers for backend cart integration
  const getToken = () =>
    (typeof window !== "undefined" && (localStorage.getItem("auth_token") || localStorage.getItem("token"))) || null

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
        addItem({ id: Number(it.ItemId), name: it.ItemName, price: Number(it.Price) || 0, quantity: qty, canteen: canteenName, image: img })
      })
    } catch {}
  }

  const handleAddToCart = async (item: any) => {
    // Route through increment logic after cross-canteen check for consistency
    try {
      // Prefer backend canteenId comparison
      let differentCanteen = false
      const token = getToken()
      if (token) {
        try {
          const res = await fetch(`${baseUrl}/api/user/cart/getCartItems`, { method: "GET", headers: { Authorization: token }, cache: "no-store" })
          if (res.ok) {
            const data = await res.json()
            const meta = data?.data
            if (meta && Array.isArray(meta.cart) && meta.cart.length > 0) {
              const backendCanteenId = Number(meta.canteenId)
              const routeCanteenIdNum = Number(canteenId)
              const haveNumeric = !Number.isNaN(backendCanteenId) && !Number.isNaN(routeCanteenIdNum)
              if (haveNumeric) differentCanteen = backendCanteenId !== routeCanteenIdNum
              else {
                const backendName = String(meta.CanteenName || meta.canteenName || "").toLowerCase()
                const currentName = String(item.canteen || details?.CanteenName || "").toLowerCase()
                if (backendName && currentName) differentCanteen = backendName !== currentName
              }
            }
          }
        } catch {}
      } else {
        differentCanteen = items.length > 0 && items[0].canteen !== item.canteen
      }
      if (differentCanteen) {
        setPendingAddItem(item)
        setShowClearConfirm(true)
        return
      }
      await handleIncrement(item)
    } catch {
      // fallback already handled in handleIncrement
    }
  }

  const handleIncrement = async (item: any) => {
    const token = getToken()
    // Optimistic local update: if item not present, add it; else increment
    const current = items.find((i) => i.id === item.id)?.quantity || 0
  try { if (typeof window !== "undefined") localStorage.setItem("last_canteen_id", String(canteenId)) } catch {}
    if (current === 0) {
      addItem({ id: item.id, name: item.name, price: item.price, quantity: 1, canteen: item.canteen, image: item.image })
    } else {
      updateQuantity(item.id, current + 1)
    }
    setBusyItemId(item.id)
    if (!token) {
      setBusyItemId(null)
      return
    }
    try {
      // increment on backend via updateCart (existing) or addToCart
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
    } catch {
      // keep optimistic state
    } finally {
      setBusyItemId(null)
    }
  }

  const handleDecrement = async (item: any) => {
    const token = getToken()
    const current = items.find((i) => i.id === item.id)?.quantity || 0
    const next = Math.max(0, current - 1)
    // Optimistic local update
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

  return (
    <div className="min-h-screen pb-16">
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
                try {
                  await clearBackendCart()
                } catch {}
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
      <div className="relative h-48">
        <Link href="/canteens" className="absolute left-4 top-4 z-10 rounded-full bg-background/80 p-2">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <Image src={posterSrc} alt={details.CanteenName} fill className="object-cover" />
      </div>

      <div className="container px-4 py-6">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">{details.CanteenName}</h1>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{openBadge}</Badge>
              <Badge className="bg-primary">★ {pseudoRating(canteenId)}</Badge>
            </div>
          </div>
          {details.Location && <p className="text-sm text-muted-foreground">{details.Location}</p>}
          <p className="text-sm text-muted-foreground">
            {details.fromTime || "?"} - {details.ToTime || "?"}
          </p>
        </div>

        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
          {/* Centered, horizontally scrollable categories for mobile */}
          <div className="-mx-4 mb-6 overflow-x-auto px-4 scroll-smooth snap-x snap-mandatory [scrollbar-width:none] [-ms-overflow-style:none]">
            <style jsx>{`
              div::-webkit-scrollbar { display: none; }
            `}</style>
            <div className="mx-auto w-max">
              <TabsList className="w-max flex-nowrap justify-center gap-2">
                {tabKeys.map((key) => {
                  const cat = categories.find((c) => c.name === key)
                  return (
                    <TabsTrigger
                      key={key}
                      value={key}
                      className="shrink-0 whitespace-nowrap rounded-full px-4 capitalize snap-start"
                    >
                      {key}
                      {cat && (
                        <span className="ml-2 rounded bg-muted px-2 py-0.5 text-xs">{cat.no_of_items}</span>
                      )}
                    </TabsTrigger>
                  )
                })}
              </TabsList>
            </div>
          </div>
          <TabsContent value={activeTab} className="mt-0">
            {activeTab === "all" && itemsLoading ? (
              <div className="grid gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-24 w-full animate-pulse rounded-lg bg-muted" />
                ))}
              </div>
            ) : categoryLoading && activeTab !== "all" && !catItemsMap[activeTab] ? (
              <div className="grid gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-24 w-full animate-pulse rounded-lg bg-muted" />
                ))}
              </div>
            ) : displayedItems.length > 0 ? (
              <div className="grid gap-4">
                {displayedItems.map((item) => {
                  const localQty = items.find((i) => i.id === item.id)?.quantity || 0
                  return (
                    <FoodItemCard
                      key={item.id}
                      item={item}
                      quantity={localQty}
                      isLoading={busyItemId === item.id}
                      onAddToCart={handleAddToCart}
                      onIncrement={() => handleIncrement(item)}
                      onDecrement={() => handleDecrement(item)}
                    />
                  )
                })}
                {activeTab === 'all' && (
                  <div className="flex flex-col items-center gap-3 py-4">
                    {itemsHasMore && (
                      <button
                        className="px-4 py-2 rounded-md border hover:bg-muted text-sm"
                        disabled={itemsFetchingMore}
                        onClick={() => {
                          setObserverEnabled(false)
                          loadMoreAll()
                        }}
                      >
                        {itemsFetchingMore ? 'Loading…' : 'Load more'}
                      </button>
                    )}
                    <div ref={setSentinelEl as any} aria-hidden className="h-1 w-full" />
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No items available in this category</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <CartIcon />
    </div>
  )
}
