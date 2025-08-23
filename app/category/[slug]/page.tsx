"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { useCart } from "@/hooks/use-cart"
import { useAuth } from "@/hooks/use-auth"
import { useRouter, useParams } from "next/navigation"
import FoodItemCard from "@/components/food-item-card"
import { motion } from "framer-motion"
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
import CartIcon from "@/components/cart-icon"

type RawItem = {
  ItemId: number
  ItemName: string
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
}

type CanteenDetails = {
  canteenId?: number
  CanteenName: string
}

type CanteenResponse = {
  code: number
  message: string
  data: CanteenDetails
}

function buildImageUrl(path?: string | null) {
  if (!path) return "/placeholder.svg"
  const base = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "")
  return `${base}${path.startsWith("/") ? path : `/${path}`}`
}

export default function CategoryPage() {
  const { slug } = useParams<{ slug: string }>()
  const categoryName = decodeURIComponent(slug)
  const { addItem, items: cartItems, clearCart, updateQuantity, removeItem } = useCart()
  const { isAuthenticated } = useAuth()
  const router = useRouter()

  const [categoryItems, setCategoryItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [backHref, setBackHref] = useState<string>("/canteens")
  const [busyItemId, setBusyItemId] = useState<number | null>(null)
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [pendingAddItem, setPendingAddItem] = useState<any | null>(null)

  const baseUrl = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "")
  const getToken = () =>
    (typeof window !== "undefined" && (localStorage.getItem("auth_token") || localStorage.getItem("token"))) || null

  useEffect(() => {
    try {
      const id = typeof window !== "undefined" ? localStorage.getItem("last_canteen_id") : null
      setBackHref(id ? `/canteen/${id}` : "/canteens")
    } catch {
      setBackHref("/canteens")
    }
  }, [])

  useEffect(() => {
    let mounted = true
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const base = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || ""
        const res = await fetch(`${base}/api/explore/get/items-by-category/${encodeURIComponent(categoryName)}`, {
          cache: "no-store",
        })
        if (!res.ok) throw new Error(`Items HTTP ${res.status}`)
        const json: ItemsResponse = await res.json()
        if (json.code !== 1 || !Array.isArray(json.data)) throw new Error(json.message || "Failed items fetch")
  const avail = json.data.filter((it) => it.ava !== false)
        const uniqueCIds = Array.from(new Set(avail.map((it) => it.canteenId)))
        // fetch canteen names
        const nameEntries = await Promise.all(
          uniqueCIds.map(async (id) => {
            try {
              const d = await fetch(`${base}/api/explore/canteen/details/${id}`, { cache: "no-store" })
              if (!d.ok) throw new Error()
              const dJson: CanteenResponse = await d.json()
              return [id, dJson.data?.CanteenName || `Canteen ${id}`] as const
            } catch {
              return [id, `Canteen ${id}`] as const
            }
          }),
        )
        const nameMap = Object.fromEntries(nameEntries) as Record<number, string>
  const mapped = avail.map((it) => ({
          id: it.ItemId,
          name: it.ItemName,
          price: it.Price,
          image: buildImageUrl(it.ImagePath || undefined),
          category: it.category,
          description: it.Description,
          canteenId: it.canteenId,
          canteen: nameMap[it.canteenId] || `Canteen ${it.canteenId}`,
        }))
  if (mounted) setCategoryItems(mapped)
      } catch (e) {
        console.error("Category load failed", e)
        if (mounted) setError("Unable to load category items.")
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => {
      mounted = false
    }
  }, [categoryName])

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
      router.push("/login")
      return
    }
    // check single-canteen constraint against backend
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
              if (!Number.isNaN(backendCanteenId) && !Number.isNaN(Number(item.canteenId))) {
                different = backendCanteenId !== Number(item.canteenId)
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
      // fallback to simple local add
  addItem({ id: item.id, name: item.name, price: item.price, quantity: 1, canteen: item.canteen, image: item.image, category: item.category })
    }
  }

  const handleIncrement = async (item: any) => {
    const token = getToken()
  const current = cartItems.find((i) => i.id === item.id)?.quantity || 0
    try { if (typeof window !== "undefined") localStorage.setItem("last_canteen_id", String(item.canteenId || "")) } catch {}
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
      // check existing qty from backend
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading category...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-destructive mb-4">{error}</p>
          <Link href="/canteens" className="underline text-primary">
            Back
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-16 page-transition">
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
      <div className="sticky top-0 z-10 flex items-center bg-background p-4 shadow-sm">
        <Link href={backHref} className="mr-2">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-xl font-bold">{categoryName}</h1>
      </div>

      <div className="container px-4 py-6">
        <div className="mb-6">
          <p className="text-sm text-muted-foreground mt-2">{categoryItems.length} items available</p>
        </div>

        <div className="grid gap-4">
          {categoryItems.length > 0 ? (
            categoryItems.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <FoodItemCard
                  item={item}
                  quantity={cartItems.find((i) => i.id === item.id)?.quantity || 0}
                  isLoading={busyItemId === item.id}
                  onAddToCart={() => handleAddToCart(item)}
                  onIncrement={() => handleIncrement(item)}
                  onDecrement={() => handleDecrement(item)}
                />
              </motion.div>
            ))
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No items available in this category</p>
            </div>
          )}
        </div>
      </div>
  <CartIcon />
    </div>
  )
}
