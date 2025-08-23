"use client"

import { useEffect, useMemo, useState } from "react"
import BottomNavigation from "@/components/bottom-navigation"
import LoadingScreen from "@/components/loading-screen"
import type { MenuItem } from "@/services/canteen-service"
import FoodItemCard from "@/components/food-item-card"
import { useAuth } from "@/hooks/use-auth"
import { useRouter } from "next/navigation"
import Footer from "@/components/footer"
import Logo from "@/components/logo"
import ThemeToggle from "@/components/theme-toggle"
import { motion } from "framer-motion"
import { Star, Clock, Utensils, Copy, Check, ArrowRight, CupSoda, Receipt, Info } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"
import Link from "next/link"
import SearchBar from "@/components/search-bar"
import { isOpenNow } from "@/lib/utils"
import LockOverlay from "@/components/lock-overlay"
// import ContactUs from "./contact/page"

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
  }, [apiCategories, categoriesExpanded])

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

  if (isLoading) {
    return <LoadingScreen />
  }

  if (homeLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading delicious food options...</p>
        </div>
      </div>
    )
  }

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

  return (
    <>
    <LockOverlay open={locked} onUnlock={() => setLocked(false)} />
    <main className={`min-h-screen pb-24 page-transition ${locked ? "blur-sm pointer-events-none select-none" : ""}`}>
      {/* Top Bar */}
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-4 border-b">
        <div className="container mx-auto flex items-center justify-between">
          <Logo imgClassName="h-10 w-auto md:h-11" />
          <div className="hidden md:block md:w-1/3">
            <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Search for food or canteen..." />
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
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
            >
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
            </motion.div>
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
                        Enter FREECANE at checkout. One complimentary sugarcane with eligible meal combos. Limited time.
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
                            Enter <strong>FREECANE</strong> at checkout to enjoy one complimentary sugarcane juice with any eligible meal combo.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="text-sm space-y-2">
                          <ul className="list-disc pl-5 space-y-1">
                            <li>Code must be entered before payment and qualifying items must be in cart.</li>
                            <li>Eligible items: <span className="italic text-muted-foreground">to be provided</span>.</li>
                            <li>One free sugarcane per order. Cannot be exchanged or transferred.</li>
                            <li>Not valid with other “free item” promotions unless stated.</li>
                            <li>Subject to availability. While supplies last.</li>
                          </ul>
                          <p className="text-xs text-muted-foreground">Full terms may be updated. Check the cart before payment.</p>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </motion.div>

                {/* Coupon: GLUG – removes all service charges */}
                <motion.div
                  variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
                  className="rounded-xl border bg-card/60 backdrop-blur-sm overflow-hidden snap-start min-w-[85%] sm:min-w-0"
                >
                  <div className="flex items-center gap-3 p-3 sm:p-4 bg-gradient-to-br from-accent/20 to-transparent">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                      <Receipt className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold leading-tight clamp-2">GLUG — zero service charges</p>
                      <p className="text-[11px] text-muted-foreground clamp-2">Waives platform service charges at checkout. Taxes may still apply.</p>
                    </div>
                  </div>
                  <div className="p-3 pt-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <code className="rounded bg-muted px-2.5 py-1 text-xs sm:text-sm font-mono font-bold">GLUG</code>
                      <button
                        onClick={() => copyCoupon("GLUG", 201)}
                        className="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs sm:text-sm hover:bg-secondary"
                        aria-label="Copy coupon GLUG"
                      >
                        {copiedOffer === 201 ? (<><Check className="h-4 w-4 text-green-500" />Copied</>) : (<><Copy className="h-4 w-4" />Copy</>)}
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
                          <DialogTitle>GLUG — Service charge waiver</DialogTitle>
                          <DialogDescription>
                            Enter <strong>GLUG</strong> at checkout to remove all service charges from your order total.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="text-sm space-y-2">
                          <ul className="list-disc pl-5 space-y-1">
                            <li>Valid for a limited time. One use per order.</li>
                            <li>Removes platform service charges. Government taxes may still apply.</li>
                            <li>Not applicable to delivery fees or tips (if any).</li>
                            <li>Cannot be combined with other service-charge waivers.</li>
                            <li>Applies only when code is entered before payment.</li>
                          </ul>
                          <p className="text-xs text-muted-foreground">If the waiver doesn’t reflect, re-apply the code on the payment step.</p>
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
                    <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                      <Star className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">Students’ favorites</p>
                      <p className="text-xs text-muted-foreground">Tap to view popular items</p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </motion.div>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="container px-4 py-6">
        <div className="md:hidden mb-6 flex items-center gap-2">
          <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Search for food or canteen..." />
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
                          <CardContent className="flex flex-col items-center justify-center p-3 text-center">
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
                              />
                            </div>
                            <h3 className="text-xs font-semibold truncate w-full">{category.name}</h3>
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
                        <CardContent className="flex flex-col items-center justify-center p-3 text-center h-[106px]">
                          <div className="mb-2 rounded-full bg-secondary/10 p-2">
                            <Utensils className="h-6 w-6" />
                          </div>
                          <span className="text-xs font-semibold">View All</span>
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
                            <CardContent className="flex flex-col items-center justify-center p-4 text-center">
                              <div className="mb-3 rounded-full bg-secondary/10 p-2">
                                <Image
                                  src={
                                    category.poster
                                      ? `${(process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "")}${category.poster.startsWith("/") ? category.poster : `/${category.poster}`}`
                                      : "/placeholder.svg"
                                  }
                                  alt={category.name}
                                  width={60}
                                  height={60}
                                  className="h-15 w-15 rounded-full object-cover"
                                />
                              </div>
                              <h3 className="text-sm font-semibold">{category.name}</h3>
                            </CardContent>
                          </Card>
                        </motion.div>
                      </Link>
                    ))}
                  </div>
                  <div className="mt-3 flex justify-center">
                    <button
                      onClick={() => setCategoriesExpanded(false)}
                      className="text-sm font-medium text-primary hover:underline"
                      aria-label="Show fewer categories"
                    >
                      Show less
                    </button>
                  </div>
                </>
              )}
            </motion.section>

            {/* Today's Offers section removed as offers are now highlighted in the hero */}

            <motion.section
              className="mb-8 scroll-mt-16 md:scroll-mt-20"
              id="popular"
              variants={{
                hidden: { opacity: 0, y: 40 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
              }}
            >
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-bold tracking-tight">Popular Items</h2>
                <span className="hidden md:inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                  <Star className="w-3 h-3" />
                  <span>Updated Hourly</span>
                </span>
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {popularItems.slice(0, 3).map((item) => {
                  const normalized = { ...item, canteen: (item as any).canteen ?? item.canteenName }
                  return (
                    <motion.div key={item.id} whileHover={{ y: -5, boxShadow: "0px 10px 20px rgba(0,0,0,0.1)" }} transition={{ type: "spring", stiffness: 300 }}>
                      <FoodItemCard
                        item={normalized as any}
                        onAddToCart={(it: any) => {
                          const cid = (it as any).canteenId
                          const isNumeric = typeof cid === "number" || (typeof cid === "string" && /^\d+$/.test(cid))
                          router.push(isNumeric ? `/canteen/${cid}` : "/canteens")
                        }}
                      />
                    </motion.div>
                  )
                })}
              </div>
            </motion.section>

            <motion.section
              className="mb-8"
              id="canteens"
              variants={{
                hidden: { opacity: 0, y: 40 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
              }}
            >
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-bold tracking-tight">Our Canteens</h2>
              </div>
              <div className="flex gap-4 overflow-x-auto pb-1">
                {apiCanteens
                  .filter((c) => {
                    const open = isOpenNow(c.fromTime, c.ToTime)
                    return open === true || open === null
                  })
                  .map((canteen) => (
                    <Link href={`/canteen/${canteen.canteenId}`} key={canteen.canteenId} className="min-w-[320px] max-w-[320px]" passHref>
                      <motion.div
                        whileHover={{ y: -5, boxShadow: "0px 10px 20px rgba(0,0,0,0.1)" }}
                        transition={{ type: "spring", stiffness: 300 }}
                        className="h-full"
                      >
                        <Card className="overflow-hidden h-full">
                          <CardContent className="p-0">
                            <div className="relative h-44">
                              <Image
                                src={
                                  canteen.poster
                                    ? `${(process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "")}${canteen.poster.startsWith("/") ? canteen.poster : `/${canteen.poster}`}`
                                    : "/placeholder.svg"
                                }
                                alt={canteen.CanteenName}
                                fill
                                className="object-cover"
                              />
                              <Badge className="absolute right-2 top-2 bg-green-500 text-white shadow-md">Open</Badge>
                            </div>
                            <div className="p-4">
                              <h3 className="text-lg font-semibold truncate">{canteen.CanteenName}</h3>
                              {canteen.Location && (
                                <p className="text-sm text-muted-foreground truncate">{canteen.Location}</p>
                              )}
                              <div className="mt-2 flex justify-between">
                                <p className="text-xs text-muted-foreground">
                                  {(canteen.fromTime || canteen.ToTime) ? `${canteen.fromTime || "?"} - ${canteen.ToTime || "?"}` : "Timing info not available"}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    </Link>
                  ))}
                {/* View All canteens tile */}
                <Link href="/canteens" className="min-w-[320px] max-w-[320px]" aria-label="View all canteens">
                  <motion.div
                    whileHover={{ y: -5, boxShadow: "0px 10px 20px rgba(0,0,0,0.1)" }}
                    transition={{ type: "spring", stiffness: 300 }}
                    className="h-full"
                  >
                    <Card className="overflow-hidden h-full border-dashed">
                      <CardContent className="h-44 flex items-center justify-center p-4">
                        <div className="flex flex-col items-center justify-center text-center gap-2">
                          <div className="h-12 w-12 rounded-full bg-secondary/10 text-primary flex items-center justify-center">
                            <Utensils className="h-6 w-6" />
                          </div>
                          <div className="flex items-center gap-2 text-sm font-medium">
                            <span>View All Canteens</span>
                            <ArrowRight className="h-4 w-4" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                </Link>
              </div>
            </motion.section>
          </motion.div>
        
      </div>

      <Footer />
      <BottomNavigation />
    </main>
    </>
  )
}
