"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { useCart } from "@/hooks/use-cart"
import { useAuth } from "@/hooks/use-auth"
import { useRouter, useParams } from "next/navigation"
import FoodItemCard from "@/components/food-item-card"
import { motion } from "framer-motion"
import { toast } from "@/hooks/use-toast"
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
import { isOpenNow, isTimeWithinWindow } from "@/lib/utils"

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

function toHHMM(t?: string | null): string | undefined {
  if (!t) return undefined
  const s = String(t).trim()
  if (s.length >= 5 && s[2] === ":") return s.slice(0, 5)
  return s
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
  const avail = Array.isArray(json.data) ? json.data : []
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
        const mapped = avail.map((it) => {
          const st = toHHMM(it.startTime)
          const et = toHHMM(it.endTime)
          const open = isOpenNow(st, et)
          const available = (it.ava !== false) && (open !== false)
          return {
            id: it.ItemId,
            name: it.ItemName,
            price: it.Price,
            image: buildImageUrl(it.ImagePath || undefined),
            category: it.category,
            description: it.Description,
            canteenId: it.canteenId,
            canteen: nameMap[it.canteenId] || `Canteen ${it.canteenId}`,
            startTime: st,
            endTime: et,
            available,
          }
        })
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
    const json = await safeJson(res)
    if (json && typeof json.code === "number" && json.code !== 1) {
      throw new Error(String(json.message || "Failed to add to cart"))
    }
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
    const json = await safeJson(res)
    if (json && typeof json.code === "number" && json.code !== 1) {
      throw new Error(String(json.message || "Failed to update cart"))
    }
  }

  // Helper to safely parse JSON without throwing on empty responses
  async function safeJson(res: Response): Promise<any | null> {
    const ct = res.headers.get("content-type") || ""
    if (!ct.includes("application/json")) return null
    try {
      return await res.json()
    } catch {
      return null
    }
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
  // fallback already handled in handleIncrement
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
          const data = await safeJson(res)
          const arr: any[] = Array.isArray(data?.data?.cart) ? data.data.cart : []
          const found = arr.find((it) => Number(it.ItemId) === Number(item.id))
          if (found) existingQty = Number(found.quantity ?? 1) || 1
        }
      } catch {}
  if (existingQty > 0) await updateBackendCartQuantity(Number(item.id), existingQty + 1)
  else await addBackendToCart(item.id, 1)
  await syncLocalCartFromBackend()
  try { await postAddScheduleCheck(item) } catch {}
    } catch (e: any) {
      // Revert optimistic change and notify user
      if (current === 0) {
        removeItem(item.id)
      } else {
        updateQuantity(item.id, current)
      }
      const msg = String(e?.message || "Could not add this item to cart.")
      toast({ title: "Item not added", description: msg, variant: "destructive" as any })
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

  async function postAddScheduleCheck(item: any) {
    const base = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || ""
    const targetHHMM = getSelectedTimeHHMM()
    if (!targetHHMM) return
    try {
      const res = await fetch(`${base}/api/explore/item?item_id=${encodeURIComponent(String(item.id))}`, { cache: "no-store" })
      if (!res.ok) return
      const data = await res.json()
      const raw = data?.data
      const st: string | undefined = (raw?.startTime ? String(raw.startTime).slice(0, 5) : item.startTime) || undefined
      const et: string | undefined = (raw?.endTime ? String(raw.endTime).slice(0, 5) : item.endTime) || undefined
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
          const res = await fetch(`${baseUrl}/api/user/cart/removeItemCart?id=${encodeURIComponent(String(item.id))}`, {
            method: "DELETE",
            headers: { Authorization: token },
          })
          if (!res.ok) throw new Error(await res.text())
          const json = await safeJson(res)
          if (json && typeof json.code === "number" && json.code !== 1) throw new Error(String(json.message || "Failed to remove item"))
        } catch {}
      }
      await syncLocalCartFromBackend()
    } catch (e: any) {
      // Revert optimistic state and notify user
      if (current > 0) {
        updateQuantity(item.id, current)
      }
      const msg = String(e?.message || "Could not update item quantity.")
      toast({ title: "Cart not updated", description: msg, variant: "destructive" as any })
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
                  unavailable={(item as any).available === false}
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
