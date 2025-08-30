"use client"

import { useEffect, useMemo, useState } from "react"
import LoadingScreen from "@/components/loading-screen"
import type { MenuItem } from "@/services/canteen-service"
import FoodItemCard from "@/components/food-item-card"
import { useAuth } from "@/hooks/use-auth"
import { useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import Logo from "@/components/logo"
const ThemeToggle = dynamic(() => import("@/components/theme-toggle"), { ssr: false, loading: () => null })
import { motion } from "framer-motion"
import { Utensils, Copy, Check, CupSoda, Info } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"
import Link from "next/link"
const SearchBar = dynamic(() => import("@/components/search-bar"), { ssr: false, loading: () => null })
import { isOpenNow, isTimeWithinWindow } from "@/lib/utils"
import { authRedirectWithIntent, isAuthMessage } from "@/lib/auth"
import LockOverlay from "@/components/lock-overlay"
import CartIcon from "@/components/cart-icon"
import { useCart } from "@/hooks/use-cart"
import { toast } from "@/hooks/use-toast"
// import ContactUs from "./contact/page"

// Defer non-critical UI to reduce initial main-thread work (no UX change)
const Footer = dynamic(() => import("@/components/footer"), { loading: () => null })
const BottomNavigation = dynamic(() => import("@/components/bottom-navigation"), { loading: () => null })
const PopularSection = dynamic(() => import("@/components/home-popular"), { ssr: false, loading: () => null })
const CanteensSection = dynamic(() => import("@/components/home-canteens"), { ssr: false, loading: () => null })

export default function Home() {
  const [isLoading, setIsLoading] = useState(() => {
    if (typeof window !== "undefined") {
      const hasLoadedBefore = sessionStorage.getItem("hasLoadedBefore")
      return !hasLoadedBefore
    }
    return true
  })
  const [locked, setLocked] = useState<boolean>(() => {
    const v = process.env.NEXT_PUBLIC_LOCK
    return typeof v === "string" && /LOCK/i.test(v)
  })
  const [searchQuery, setSearchQuery] = useState("")
  // SearchBar handles its own suggestions; we don't fetch results here anymore
  // No motion hooks in hero anymore for smoother, static layout

  // backend-driven state
  const [homeLoading, setHomeLoading] = useState(true)
  const [homeError, setHomeError] = useState<string | null>(null)
  const [apiCanteens, setApiCanteens] = useState<{
    canteenId: number
    CanteenName: string
    Location?: string
    fromTime?: string | null
    ToTime?: string | null
    accessTo?: string
    poster?: string | null
  }[]>([])
  const [apiCategories, setApiCategories] = useState<{ name: string; poster?: string | null }[]>([])
  const [popularItems, setPopularItems] = useState<MenuItem[]>([])
  const { isAuthenticated } = useAuth()
  const router = useRouter()
  const { addItem, clearCart } = useCart()
  const [copiedOffer, setCopiedOffer] = useState<number | null>(null)
  const [categoriesExpanded, setCategoriesExpanded] = useState(false)
  // number of columns matching the grid classes below (mobile 3, sm 4, md+ 6)
  const [categoryCols, setCategoryCols] = useState(3)
  const shuffledCategories = useMemo(() => {
    const arr = [...apiCategories]
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[arr[i], arr[j]] = [arr[j], arr[i]]
    }
    return arr
  }, [apiCategories])

  // Track viewport width to decide how many category tiles fit in one row
  useEffect(() => {
    const computeCols = () => {
      if (typeof window === "undefined") return 3
      const w = window.innerWidth
      if (w >= 768) return 6 // md and up
      if (w >= 640) return 4 // sm
      return 3 // base
    }
    const onResize = () => setCategoryCols(computeCols())
    setCategoryCols(computeCols())
    window.addEventListener("resize", onResize)
    return () => window.removeEventListener("resize", onResize)
  }, [])

  // helper to check open status moved to lib/utils as isOpenNow

  useEffect(() => {
    let mounted = true
    const loadHome = async () => {
      setHomeLoading(true)
      setHomeError(null)
      try {
        const base = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || ""
        const [cRes, catRes] = await Promise.all([
          fetch(`${base}/api/explore/canteens`, { cache: "no-store" }),
          fetch(`${base}/api/explore/categories`, { cache: "no-store" }),
        ])
        if (!cRes.ok) throw new Error(`Canteens HTTP ${cRes.status}`)
        if (!catRes.ok) throw new Error(`Categories HTTP ${catRes.status}`)
        const cJson: { code: number; message: string; data: typeof apiCanteens } = await cRes.json()
        const catJson: { code: number; message: string; data: typeof apiCategories } = await catRes.json()
        if (cJson.code !== 1 || !Array.isArray(cJson.data)) throw new Error(cJson.message || "Failed canteens fetch")
        if (catJson.code !== 1 || !Array.isArray(catJson.data)) throw new Error(catJson.message || "Failed categories fetch")
        if (mounted) {
          setApiCanteens(cJson.data)
          setApiCategories(catJson.data)
        }
      } catch (e: any) {
        console.error("Home API failed", e)
        if (mounted) setHomeError("Unable to load homepage data.")
      } finally {
        if (mounted) setHomeLoading(false)
      }
    }
    loadHome()
    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    if (isLoading) {
      sessionStorage.setItem("hasLoadedBefore", "true")
      const timer = setTimeout(() => {
        setIsLoading(false)
      }, 1500) // Reduced loading time

      return () => clearTimeout(timer)
    }
  }, [isLoading])

  // Load real popular items from backend
  useEffect(() => {
    let mounted = true
  const loadPopular = async () => {
      try {
    const base = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "http://188.245.112.188:3000"
        const res = await fetch(`${base}/api/explore/get/popular-items`, { cache: "no-store" })
        if (!res.ok) throw new Error(`Popular HTTP ${res.status}`)
        const json = await res.json()
        const rawArr: any[] = Array.isArray(json?.data) ? json.data : Array.isArray(json) ? json : []
        // New API wraps the item under `item`; fall back to entry itself
        const avail = rawArr
          .map((entry) => ({ entry, base: entry?.item ?? entry }))
          .filter(({ base }) => base?.ava !== false)
        // fetch canteen names for display
        const uniqueCIds: number[] = Array.from(
          new Set(
            avail
              .map(({ base }) => Number(base?.canteenId))
              .filter((n) => !Number.isNaN(n))
          )
        )
        const nameEntries = await Promise.all(
          uniqueCIds.map(async (id) => {
            try {
              const d = await fetch(`${base}/api/explore/canteen/details/${id}`, { cache: "no-store" })
              if (!d.ok) throw new Error()
              const dJson = await d.json()
              const cname = dJson?.data?.CanteenName || `Canteen ${id}`
              return [id, cname] as const
            } catch {
              return [id, `Canteen ${id}`] as const
            }
          })
        )
        const nameMap = Object.fromEntries(nameEntries) as Record<number, string>
        const buildImageUrl = (path?: string | null) => {
          if (!path) return "/placeholder.svg"
          return `${base}${String(path).startsWith("/") ? path : `/${path}`}`
        }
        const rate = (seed: string) => {
          let h = 0
          for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0
          const inc = ((h % 50) + 1) / 100
          return Number((4.5 + inc).toFixed(2))
        }
        const mapped: MenuItem[] = avail.map(({ base }) => {
          const id = Number(base.ItemId)
          const cIdNum = Number(base.canteenId)
          const canteenName = nameMap[cIdNum] || String(base.CanteenName || base.canteenName || `Canteen ${cIdNum}`)
          return {
            id,
            name: String(base.ItemName || base.name || "Item"),
            description: String(base.Description || base.description || ""),
            price: Number(base.Price || 0),
            image: buildImageUrl(base.ImagePath),
            category: String(base.category || ""),
            canteenId: String(base.canteenId ?? ""),
            canteenName,
            available: base.ava !== false,
            rating: rate(`${id}-${base.ItemName || base.name || ""}`),
            preparationTime: undefined,
            ingredients: undefined,
            nutritionInfo: undefined as any,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
        })
        if (mounted) setPopularItems(mapped)
      } catch (e) {
        console.warn("Popular items load failed", e)
      }
    }
    loadPopular()
    return () => {
      mounted = false
    }
  }, [])

  const baseUrl = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "")


  type DisplayItem = Pick<MenuItem, "id" | "name" | "price" | "image" | "description" | "rating" | "preparationTime"> & {
    canteen?: string
    canteenName?: string
  }

  // Removed legacy search and post-login continuation logic from Home; handled in SearchBar and complete-profile

  // Helper to copy coupon codes
  const copyCoupon = async (code: string, id: number) => {
    try {
      await navigator.clipboard.writeText(code)
      setCopiedOffer(id)
      setTimeout(() => setCopiedOffer(null), 1500)
    } catch (e) {
      console.error("Failed to copy coupon", e)
    }
  }

  // Keep splash animation but don’t block initial render; we overlay it instead

  if (homeError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-4">Failed to load data: {homeError}</p>
          <button onClick={() => window.location.reload()} className="px-4 py-2 bg-primary text-white rounded-md">
            Retry
          </button>
        </div>
      </div>
    )
  }

  // Helpers for backend cart integration from the homepage Popular list
  const getToken = () =>
    (typeof window !== "undefined" && (localStorage.getItem("auth_token") || localStorage.getItem("token"))) || null

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

  const addBackendToCart = async (itemId: number, quantity = 1) => {
    const token = getToken()
    if (!token) throw new Error("Not authenticated")
    const url = `${baseUrl}/api/user/cart/addToCart?id=${encodeURIComponent(String(itemId))}&quantity=${encodeURIComponent(String(quantity))}`
  const res = await fetch(url, { method: "GET", headers: { Authorization: token }, cache: "no-store" })
  if (res.status === 401 || res.status === 403) throw new Error("Unauthorized: invalid token")
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
  if (res.status === 401 || res.status === 403) throw new Error("Unauthorized: invalid token")
  if (!res.ok) throw new Error(await res.text())
    const json = await safeJson(res)
    if (json && typeof json.code === "number" && json.code !== 1) {
      throw new Error(String(json.message || "Failed to update cart"))
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

  const handlePopularAdd = async (it: any) => {
    const cid = (it as any).canteenId
    const isNumeric = typeof cid === "number" || (typeof cid === "string" && /^\d+$/.test(cid))
    const canteenHref = isNumeric ? `/canteen/${cid}` : "/canteens"
    const token = getToken()
    if (!token) {
      // fallback to canteen page when not authenticated
      router.push(canteenHref)
      return
    }
    try {
      // Check cross-canteen conflict via backend
      let different = false
      try {
        const res = await fetch(`${baseUrl}/api/user/cart/getCartItems`, { method: "GET", headers: { Authorization: token }, cache: "no-store" })
        if (res.ok) {
          const data = await res.json()
          const meta = data?.data
          if (meta && Array.isArray(meta.cart) && meta.cart.length > 0) {
            const backendCanteenId = Number(meta.canteenId)
            const currentCanteenId = Number((it as any).canteenId)
            if (!Number.isNaN(backendCanteenId) && !Number.isNaN(currentCanteenId)) {
              different = backendCanteenId !== currentCanteenId
            } else {
              const backendName = String(meta.CanteenName || meta.canteenName || "").toLowerCase()
              const currentName = String((it as any).canteen || (it as any).canteenName || "").toLowerCase()
              if (backendName && currentName) different = backendName !== currentName
            }
          }
        }
      } catch {}
      if (different) {
        // Open canteen for explicit switch/confirmation UX
        router.push(canteenHref)
        return
      }
      // Add or increment on backend then sync
      try {
        // probe existing qty
        let existingQty = 0
        try {
          const res = await fetch(`${baseUrl}/api/user/cart/getCartItems`, { method: "GET", headers: { Authorization: token }, cache: "no-store" })
          if (res.ok) {
            const data = await safeJson(res)
            const arr: any[] = Array.isArray(data?.data?.cart) ? data.data.cart : []
            const found = arr.find((x) => Number(x.ItemId) === Number(it.id))
            if (found) existingQty = Number(found.quantity ?? 1) || 1
          }
        } catch {}
        if (existingQty > 0) await updateBackendCartQuantity(Number(it.id), existingQty + 1)
        else await addBackendToCart(it.id, 1)
        await syncLocalCartFromBackend()
        try { await postAddScheduleCheck(it) } catch {}
      } catch (e: any) {
        const msg = String(e?.message || "")
        if (isAuthMessage(msg)) {
          authRedirectWithIntent({ itemId: Number(it.id), canteenId: (it as any).canteenId, returnTo: typeof window !== "undefined" ? window.location.pathname + window.location.search : "/" })
          return
        }
        // Backend refused; fallback to canteen page
        toast({ title: "Opening canteen", description: msg || "We’ll open the canteen to finish adding." })
        router.push(canteenHref)
      }
    } catch {
      router.push(canteenHref)
    }
  }

  return (
    <>
    <LockOverlay open={locked} onUnlock={() => setLocked(false)} />
    <main className={`min-h-screen pb-24 page-transition ${locked ? "blur-sm pointer-events-none select-none" : ""}`}>
      {/* Top Bar */}
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-4 border-b">
        <div className="container mx-auto flex items-center justify-between">
          <Logo imgClassName="h-10 w-auto md:h-11" />
          <div className="hidden md:block md:w-1/3">
            <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Search for food..." />
          </div>
          <div className="hidden md:flex md:items-center md:gap-2">
            <ThemeToggle />
            {!isAuthenticated ? (
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <button
                  onClick={() => router.push("/login")}
                  className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white"
                >
                  Login
                </button>
              </motion.div>
            ) : (
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <button
                  onClick={() => router.push("/account")}
                  className="rounded-md bg-primary/10 px-4 py-2 text-sm font-medium text-primary"
                >
                  My Account
                </button>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Static, clean hero without parallax/animations */}
      <section className="relative overflow-hidden bg-gradient-to-b from-background via-background to-transparent">
        <div className="hero-bg-animation" />
        <div className="container px-4 pt-10 pb-6 md:pt-16 md:pb-12 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10 items-center">
            <div className="hero-animate will-change-transform">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight">
                Quick, tasty meals from your campus canteens
              </h1>
              <p className="mt-3 md:mt-4 text-muted-foreground text-sm md:text-base max-w-xl">
                Discover popular items, browse categories, and order in seconds. Fresh, fast, and right around the corner.
              </p>
              <motion.div
                className="mt-6 flex items-center gap-3"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: "easeOut", delay: 0.3 }}
              >
                <Link href="/canteens" passHref>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="inline-flex rounded-md bg-primary px-5 py-2.5 text-white text-sm font-medium shadow-lg shadow-primary/20"
                  >
                    Browse Canteens
                  </motion.button>
                </Link>
                <Link href="#popular" passHref>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="inline-flex rounded-md px-5 py-2.5 text-sm font-medium border bg-card hover:bg-muted"
                  >
                    Explore Popular
                  </motion.button>
                </Link>
              </motion.div>
            </div>
            <div className="md:pl-6">
              <motion.div
                className="flex gap-3 md:gap-4 overflow-x-auto no-scrollbar snap-x snap-mandatory sm:grid sm:grid-cols-2 sm:overflow-visible"
                initial="hidden"
                animate="visible"
                variants={{
                  visible: {
                    transition: { staggerChildren: 0.1, delayChildren: 0.5 },
                  },
                }}
              >
                {/* Limited Time Offer card to keep the section balanced and attractive */}
                <motion.div
                  variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
                  className="rounded-xl border bg-card/60 backdrop-blur-sm overflow-hidden snap-start min-w-[85%] sm:min-w-0"
                >
                  <div className="flex items-center gap-3 p-3 sm:p-4 bg-gradient-to-br from-primary/10 to-transparent">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center" aria-hidden="true">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27z"/>
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold leading-tight clamp-2">Limited-time campus specials</p>
                      <p className="text-[11px] text-muted-foreground clamp-2">Hot picks, fresh deals — updated weekly. Don’t miss out.</p>
                    </div>
                  </div>
                  <div className="p-3 pt-2 flex items-center justify-between">
                    <Badge variant="secondary" className="uppercase tracking-wide">Limited Time</Badge>
                    <Link href="#popular" passHref>
                      <button className="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs sm:text-sm hover:bg-secondary">
                        Shop now
                        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M5 12h14"/>
                          <path d="M12 5l7 7-7 7"/>
                        </svg>
                      </button>
                    </Link>
                  </div>
                </motion.div>

                {/* GLUG coupon temporarily disabled — original block kept for reference */}
                {/**
                <motion.div ...> ...GLUG content... </motion.div>
                **/}

                {/* Coupon: Free Sugarcane with every meal (auto-applies) */}
                <motion.div
                  variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
                  className="rounded-xl border bg-card/60 backdrop-blur-sm overflow-hidden snap-start min-w-[85%] sm:min-w-0"
                >
                  <div className="flex items-center gap-3 p-3 sm:p-4 bg-gradient-to-br from-accent/20 to-transparent">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                      <CupSoda className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold leading-tight clamp-2">Free Sugarcane with every meal</p>
                      <p className="text-[11px] text-muted-foreground clamp-2">
                        Enter FREECANE at checkout (available after 12:00 PM). One complimentary sugarcane with eligible meal combos. Limited time.
                      </p>
                    </div>
                  </div>
                  <div className="p-3 pt-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <code className="rounded bg-muted px-2.5 py-1 text-xs sm:text-sm font-mono font-bold">FREECANE</code>
                      <button
                        onClick={() => copyCoupon("FREECANE", 200)}
                        className="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs sm:text-sm hover:bg-secondary"
                        aria-label="Copy coupon FREECANE"
                      >
                        {copiedOffer === 200 ? (<><Check className="h-4 w-4 text-green-500" />Copied</>) : (<><Copy className="h-4 w-4" />Copy</>)}
                      </button>
                    </div>
                    <Dialog>
                      <DialogTrigger
                        className="inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs hover:bg-secondary"
                        aria-label="View details"
                      >
                        <Info className="h-3 w-3" />
                        <span className="hidden md:inline">Details</span>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>Free Sugarcane with every meal</DialogTitle>
                          <DialogDescription>
                            Enter <strong>FREECANE</strong> at checkout after <strong>12:00 PM</strong> to enjoy one complimentary sugarcane juice with every eligible item.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="text-sm space-y-2">
                          <ul className="list-disc pl-5 space-y-1">
                            <li>Code must be entered before payment and qualifying items must be in cart.</li>
                            <li>Eligible items: Starters (Veg & Non-Veg), Fried Rice, Noodles, Chinese, Pizza, Burgers, Lunch</li>
                            <li>One free sugarcane per item. Cannot be exchanged or transferred.</li>
                            <li>Not valid with other “free item” promotions unless stated.</li>
                            <li>Subject to availability. While supplies last.</li>
                          </ul>
                          <p className="text-xs text-muted-foreground">Full terms may be updated. Check the cart before payment.</p>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </motion.div>
              </motion.div>
              {/* Students' favorites -> scroll to Popular Items (kept as-is, outside scroller) */}
              <Link href="#popular" className="block mt-3" aria-label="Go to Students’ favorites (Popular Items)">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className="rounded-xl border p-4 bg-card/60 backdrop-blur-sm flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center" aria-hidden="true">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27z"/>
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold">Students’ favorites</p>
                      <p className="text-xs text-muted-foreground">Tap to view popular items</p>
                    </div>
                  </div>
                  <svg className="h-4 w-4 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M5 12h14"/>
                    <path d="M12 5l7 7-7 7"/>
                  </svg>
                </motion.div>
              </Link>
            </div>
          </div>
        </div>
      </section>

  <div className="container px-4 py-6 [content-visibility:auto] [contain-intrinsic-size:1000px]">
        <div className="md:hidden mb-6 flex items-center gap-2">
          <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Search for food..." />
          <ThemeToggle />
        </div>

  {/* Inline results removed; suggestions appear in the search dropdown only */}

  {/* Always show regular content; search suggestions live in the dropdown */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            transition={{ staggerChildren: 0.1 }}
          >
            <motion.section
              className="mb-8"
              variants={{
                hidden: { opacity: 0, y: 40 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
              }}
            >
              <h2 className="mb-4 text-xl font-bold tracking-tight">Food Categories</h2>
              {!categoriesExpanded ? (
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
                  {shuffledCategories.slice(0, Math.max(0, categoryCols - 1)).map((category) => (
                    <Link href={`/category/${encodeURIComponent(category.name)}`} key={category.name}>
                      <motion.div
                        whileHover={{ y: -5, boxShadow: "0px 10px 20px rgba(0,0,0,0.1)" }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        <Card className="overflow-hidden bg-card/60 backdrop-blur supports-[backdrop-filter]:bg-card/40 h-full">
                          <CardContent className="flex flex-col items-center justify-center p-2 text-center h-28">
                            <div className="mb-2 rounded-full bg-secondary/10 p-2">
                              <Image
                                src={
                                  category.poster
                                    ? `${(process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "")}${category.poster.startsWith("/") ? category.poster : `/${category.poster}`}`
                                    : "/placeholder.svg"
                                }
                                alt={category.name}
                                width={48}
                                height={48}
                                className="h-12 w-12 rounded-full object-cover"
                                sizes="(max-width: 639px) 48px, 48px"
                                priority={false}
                                decoding="async"
                              />
                            </div>
                            <h3 className="text-xs font-semibold leading-tight truncate w-full">{category.name}</h3>
                          </CardContent>
                        </Card>
                      </motion.div>
                    </Link>
                  ))}
                  {/* View All tile occupies the last slot */}
                  <button onClick={() => setCategoriesExpanded(true)} aria-label="View all categories">
                    <motion.div
                      whileHover={{ y: -5, boxShadow: "0px 10px 20px rgba(0,0,0,0.1)" }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <Card className="overflow-hidden h-full border-dashed">
                        <CardContent className="flex flex-col items-center justify-center p-2 text-center h-28">
                          <div className="mb-2 rounded-full bg-secondary/10 p-2">
                            <Utensils className="h-6 w-6" />
                          </div>
                          <span className="text-xs font-semibold leading-tight">View All</span>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </button>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                    {shuffledCategories.map((category) => (
                      <Link href={`/category/${encodeURIComponent(category.name)}`} key={category.name} passHref>
                        <motion.div
                          whileHover={{ y: -5, boxShadow: "0px 10px 20px rgba(0,0,0,0.1)" }}
                          transition={{ type: "spring", stiffness: 300 }}
                        >
                          <Card className="overflow-hidden bg-card/60 backdrop-blur supports-[backdrop-filter]:bg-card/40 h-full">
                            <CardContent className="flex flex-col items-center justify-center p-2 text-center h-28">
                              <div className="mb-2 rounded-full bg-secondary/10 p-2">
                                <Image
                                  src={
                                    category.poster
                                      ? `${(process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "")}${category.poster.startsWith("/") ? category.poster : `/${category.poster}`}`
                                      : "/placeholder.svg"
                                  }
                                  alt={category.name}
                                  width={48}
                                  height={48}
                                  className="h-12 w-12 rounded-full object-cover"
                                  sizes="(max-width: 639px) 48px, 48px"
                                  decoding="async"
                                />
                              </div>
                              <h3 className="text-xs font-semibold leading-tight truncate w-full">{category.name}</h3>
                            </CardContent>
                          </Card>
                        </motion.div>
                      </Link>
                    ))}

                    {/* Show Less tile as a grid item */}
                    <button onClick={() => setCategoriesExpanded(false)} aria-label="Show fewer categories">
                      <motion.div
                        whileHover={{ y: -5, boxShadow: "0px 10px 20px rgba(0,0,0,0.1)" }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        <Card className="overflow-hidden bg-card/60 backdrop-blur supports-[backdrop-filter]:bg-card/40 h-full">
                          <CardContent className="flex flex-col items-center justify-center p-2 text-center h-28">
                            <div className="mb-2 rounded-full bg-secondary/10 p-2">
                              <svg className="h-6 w-6 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <path d="M18 15l-6-6-6 6" />
                              </svg>
                            </div>
                            <h3 className="text-xs font-semibold leading-tight">Show Less</h3>
                          </CardContent>
                        </Card>
                      </motion.div>
                    </button>
                  </div>
                  
                </>
              )}
            </motion.section>

            {/* Today's Offers section removed as offers are now highlighted in the hero */}

            <section className="mb-8 scroll-mt-16 md:scroll-mt-20" id="popular">
              <PopularSection popularItems={popularItems} onAdd={handlePopularAdd} />
            </section>

            <section className="mb-8" id="canteens">
              <CanteensSection canteens={apiCanteens} />
            </section>
          </motion.div>
        
      </div>

      <Footer />
      <BottomNavigation />
  {isAuthenticated && <CartIcon />}
    </main>
  {(isLoading || homeLoading) && (
      <div className="fixed inset-0 z-50 bg-background">
        <LoadingScreen />
      </div>
    )}
    </>
  )
}
