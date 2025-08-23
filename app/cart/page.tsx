"use client"

import { useEffect } from "react"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, Minus, Plus, ShoppingBag, Trash2, Clock, Package, Gift } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useCart } from "@/hooks/use-cart"
import { useToast } from "@/hooks/use-toast"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { useAuth } from "@/hooks/use-auth"
import { useRouter } from "next/navigation"
import { Slider } from "@/components/ui/slider"
import { motion, AnimatePresence } from "framer-motion"

export default function CartPage() {
  const { items, removeItem, updateQuantity, togglePackaging, totalPrice, clearCart, canClearCart } = useCart()
  const { toast } = useToast()
  const { isAuthenticated, isInitialized } = useAuth()
  const router = useRouter()
  const [pickupMode, setPickupMode] = useState<"asap" | "slot" | "custom">("asap")
  const [selectedSlot, setSelectedSlot] = useState<string>("")
  const [customMinutes, setCustomMinutes] = useState<number>(20)
  const [isProcessing, setIsProcessing] = useState(false)
  const [unavailableMap, setUnavailableMap] = useState<Record<number, string>>({})
  const [appliedCoupons, setAppliedCoupons] = useState<string[]>([])
  const [couponInput, setCouponInput] = useState("")
  const [flashCoupon, setFlashCoupon] = useState<string | null>(null)
  const [celebrate, setCelebrate] = useState(false)
  const baseUrl = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "")

  // Redirect to login only after auth state is initialized, and preserve return URL
  useEffect(() => {
    if (!isInitialized) return
    if (!isAuthenticated) {
      const params = new URLSearchParams()
      params.set("returnTo", "/cart")
      router.push(`/login?${params.toString()}`)
    }
  }, [isAuthenticated, isInitialized, router])

  const handleCheckout = () => {
    if (items.length === 0) return
    if (Object.keys(unavailableMap).length > 0) {
      toast({
        title: "Some items are unavailable",
        description: "Please remove unavailable items or try again during their available time window.",
        variant: "destructive",
      })
      return
    }

    // Navigate to payment page with selected time so user doesn't re-enter
    const mode = pickupMode
    const qs = new URLSearchParams()
    qs.set("mode", mode)
    if (mode === "slot") qs.set("time", selectedSlot)
    if (mode === "custom") qs.set("mins", String(customMinutes))
  if (appliedCoupons.length > 0) qs.set("coupons", appliedCoupons.join(","))
    router.push(`/payment?${qs.toString()}`)
  }

  // Generate pickup time options (8 x 15-min slots starting from next quarter-hour)
  const generateTimeOptions = () => {
    const options: { value: string; label: string }[] = []
    const now = new Date()
    const minutes = now.getMinutes()
    const offset = (15 - (minutes % 15)) % 15
    const firstIncrement = offset === 0 ? 15 : offset
    for (let i = 0; i < 8; i++) {
      const time = new Date(now.getTime() + (firstIncrement + i * 15) * 60000)
      const hours = time.getHours()
      const mins = time.getMinutes()
      const ampm = hours >= 12 ? "PM" : "AM"
      const formattedHours = hours % 12 || 12
      const formattedMinutes = mins.toString().padStart(2, "0")
      const timeString = `${formattedHours}:${formattedMinutes} ${ampm}`
      options.push({ value: timeString, label: timeString })
    }
    return options
  }

  const formatMinutesFromNow = (mins: number) => {
    const t = new Date(Date.now() + mins * 60000)
    const h = t.getHours()
    const m = t.getMinutes()
    const ampm = h >= 12 ? "PM" : "AM"
    const hh = h % 12 || 12
    const mm = m.toString().padStart(2, "0")
    return `${hh}:${mm} ${ampm}`
  }

  // Check availability for each item and surface messages from backend
  useEffect(() => {
    let cancelled = false
    const check = async () => {
      const entries: [number, string][] = []
      await Promise.all(
        items.map(async (it) => {
          try {
            const res = await fetch(`${baseUrl}/api/explore/item?item_id=${encodeURIComponent(String(it.id))}`, { cache: "no-store" })
            const json = await res.json().catch(() => ({} as any))
            const code = typeof json?.code === "number" ? json.code : 1
            if (code !== 1) {
              const msg = (json?.message as string) || "Item unavailable at this time."
              entries.push([it.id, msg])
            }
          } catch {
            // Ignore network errors; assume available
          }
        }),
      )
      if (cancelled) return
      const map: Record<number, string> = {}
      for (const [id, msg] of entries) map[id] = msg
      setUnavailableMap(map)
    }
    if (items.length > 0) check()
    else setUnavailableMap({})
    return () => {
      cancelled = true
    }
  }, [items, baseUrl])

  // Calculate packaging cost
  const packagingCost = items.reduce((total, item) => {
    return total + (item.packaging ? 10 * item.quantity : 0)
  }, 0)

  // Gateway charge: ceil of 3% of the total (including packaging)
  const gatewayCharge = Math.ceil(totalPrice * 0.03)
  const effectiveGateway = appliedCoupons.includes("GLUG") ? 0 : gatewayCharge
  const freebiesCount = appliedCoupons.includes("FREECANE")
    ? items.reduce((sum, it) => sum + it.quantity, 0)
    : 0

  const toggleCoupon = (code: "GLUG" | "FREECANE") => {
    setAppliedCoupons((prev) => {
      const next = prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
      if (!prev.includes(code)) {
        setFlashCoupon(code)
        setCelebrate(true)
        setTimeout(() => setFlashCoupon(null), 900)
        setTimeout(() => setCelebrate(false), 1200)
      }
      return next
    })
  }

  const applyCouponFromInput = () => {
    const code = couponInput.trim().toUpperCase()
    if (!code) return
    if (code !== "GLUG" && code !== "FREECANE") {
      toast({ title: "Invalid coupon", description: "This code isn’t supported.", variant: "destructive" })
      return
    }
    if (appliedCoupons.includes(code)) {
      toast({ title: "Already applied", description: `${code} is already in use.` })
      return
    }
    toggleCoupon(code as "GLUG" | "FREECANE")
    setCouponInput("")
    toast({ title: "Coupon applied", description: `${code} added to your order.` })
  }

  // No remote fetch needed; showing built-in coupons + manual apply

  return (
    <div className="min-h-screen pb-16 page-transition">
      <div className="sticky top-0 z-10 flex items-center justify-between bg-background p-4 shadow-sm">
        <div className="flex items-center">
          <Link href={(typeof window !== "undefined" && (localStorage.getItem("last_canteen_id") ? `/canteen/${localStorage.getItem("last_canteen_id")}` : "/canteens")) || "/canteens"} className="mr-2">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-xl font-bold">Your Cart</h1>
        </div>
        {canClearCart && (
          <Button variant="ghost" size="sm" onClick={clearCart}>
            Clear Cart
          </Button>
        )}
      </div>

      <motion.div className="container px-4 py-6" animate={celebrate ? { scale: [1, 1.01, 1] } : {}} transition={{ duration: 0.4 }}>
        {items.length > 0 ? (
          <>
            {/* Celebration confetti overlay */}
            <AnimatePresence>
              {celebrate && (
                <motion.div
                  className="pointer-events-none fixed inset-0 z-20"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  {Array.from({ length: 26 }).map((_, i) => {
                    const left = Math.random() * 100
                    const duration = 0.9 + Math.random() * 0.6
                    const delay = Math.random() * 0.2
                    const rotate = (Math.random() - 0.5) * 360
                    const colors = ["#22c55e", "#3b82f6", "#f59e0b", "#ef4444", "#a855f7"]
                    const color = colors[i % colors.length]
                    const size = 6 + Math.round(Math.random() * 6)
                    return (
                      <motion.span
                        key={i}
                        className="absolute block rounded"
                        style={{ left: `${left}%`, top: "-5%", width: size, height: size * 1.6, backgroundColor: color }}
                        initial={{ y: 0, opacity: 0, rotate: 0 }}
                        animate={{ y: "110vh", opacity: 1, rotate }}
                        transition={{ duration, ease: "easeOut", delay }}
                      />
                    )
                  })}
                </motion.div>
              )}
            </AnimatePresence>
            {Object.keys(unavailableMap).length > 0 && (
              <motion.div className="mb-4" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
                <Alert variant="destructive">
                  <AlertTitle>Some items aren’t available right now</AlertTitle>
                  <AlertDescription>
                    {(() => {
                      const ids = Object.keys(unavailableMap)
                      const labels = items
                        .filter((it) => ids.includes(String(it.id)))
                        .map((it) => `${it.name}: ${unavailableMap[it.id]}`)
                      const preview = labels.slice(0, 2).join("; ")
                      const more = labels.length > 2 ? ` and ${labels.length - 2} more…` : ""
                      return preview + more
                    })()}
                  </AlertDescription>
                </Alert>
              </motion.div>
            )}

            <div className="mb-6">
              {items.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.18 }}
                >
                  <Card className="mb-4">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        {item.image && (
                          <div className="relative h-16 w-16 overflow-hidden rounded-md">
                            <Image src={item.image || "/placeholder.svg"} alt={item.name} fill className="object-cover" />
                          </div>
                        )}
                        {/* Removed per-item availability message; using top alert only */}
                        <div className="flex-1 flex justify-between gap-3">
                          {/* Left column: details and packaging */}
                          <div className="min-w-0">
                            <h3 className="font-medium leading-tight truncate">{item.name}</h3>
                            <p className="text-sm text-muted-foreground truncate">{item.canteen}</p>
                            <div className="mt-2 flex items-center gap-2">
                              <Switch
                                id={`packaging-${item.id}`}
                                checked={!!item.packaging}
                                onCheckedChange={() => togglePackaging(item.id)}
                              />
                              <Label htmlFor={`packaging-${item.id}`} className="flex items-center text-sm whitespace-nowrap">
                                <Package className="mr-1 h-3 w-3" /> Packaging
                              </Label>
                              {item.packaging && (
                                <span className="ml-2 text-xs text-muted-foreground">+₹{10 * item.quantity}</span>
                              )}
                            </div>
                          </div>

                          {/* Right column: price, delete, quantity */}
                          <div className="flex shrink-0 flex-col items-end gap-2">
                            <p className="font-medium">₹{item.price * item.quantity}</p>
                            <Button
                              variant="destructive"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => removeItem(item.id)}
                              aria-label="Remove item"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                                aria-label="Decrease quantity"
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="w-6 text-center">{item.quantity}</span>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                aria-label="Increase quantity"
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Add more items panel */}
            <div className="mb-6">
              <Card>
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Want to add more items?</h3>
                    <p className="text-sm text-muted-foreground">Go back to the canteen menu to keep shopping.</p>
                  </div>
                  <Link
                    href={
                      (typeof window !== "undefined" &&
                        (localStorage.getItem("last_canteen_id")
                          ? `/canteen/${localStorage.getItem("last_canteen_id")}`
                          : "/canteens")) || "/canteens"
                    }
                  >
                    <Button className="whitespace-nowrap">Add more items</Button>
                  </Link>
                </CardContent>
              </Card>
            </div>

            {/* Coupons */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Coupons</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Entry row */}
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter coupon code"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") applyCouponFromInput()
                    }}
                  />
                  <Button onClick={applyCouponFromInput} className="whitespace-nowrap">Apply</Button>
                </div>

                {/* Static coupon chips */}
                <div className="flex flex-wrap gap-2">
                  <AnimatePresence>
                    {["FREECANE", "GLUG"].map((code, idx) => {
                      const active = appliedCoupons.includes(code)
                      return (
                        <motion.div
                          key={code}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -6 }}
                          transition={{ delay: idx * 0.05 }}
                          className="relative"
                        >
                          <motion.button
                            className={`relative rounded-full px-3 py-1.5 text-sm border ${active ? "bg-primary text-primary-foreground border-transparent" : "bg-background hover:bg-muted border-input"}`}
                            onClick={() => toggleCoupon(code as "GLUG" | "FREECANE")}
                            whileHover={{ scale: 1.04 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <span className="inline-flex items-center">
                              {code === "FREECANE" ? <Gift className="mr-1 h-4 w-4" /> : null}
                              {code}
                            </span>
                            <AnimatePresence>
                              {flashCoupon === code && (
                                <motion.span
                                  key="ring"
                                  className="pointer-events-none absolute inset-0 rounded-full ring-2 ring-primary"
                                  initial={{ opacity: 0, scale: 0.9 }}
                                  animate={{ opacity: 0.6, scale: 1.06 }}
                                  exit={{ opacity: 0 }}
                                  transition={{ duration: 0.6 }}
                                />
                              )}
                            </AnimatePresence>
                          </motion.button>
                        </motion.div>
                      )
                    })}
                  </AnimatePresence>
                </div>
                <p className="text-xs text-muted-foreground">
                  GLUG waives the Gateway Charge. FREECANE adds a free Sugarcane juice for each item in your cart.
                </p>
                <AnimatePresence>
                  {freebiesCount > 0 && (
                    <motion.div
                      key="freebies"
                      className="flex items-center gap-2 rounded-md bg-muted p-2 text-sm"
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                    >
                      <Gift className="h-4 w-4 text-primary" />
                      <span>Free Sugarcane juice × {freebiesCount} will be included</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  {items.some((i) => !!i.packaging) ? "Pickup Time" : "Dining Time"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Label className="mb-2 block">
                  {items.some((i) => !!i.packaging)
                    ? "Select when you want to pick up your order"
                    : "Select when you want to dine-in"}
                </Label>
                <div className="mb-4 flex gap-2">
                  <Button variant={pickupMode === "asap" ? "default" : "outline"} onClick={() => setPickupMode("asap")}>ASAP</Button>
                  <Button variant={pickupMode === "slot" ? "default" : "outline"} onClick={() => setPickupMode("slot")}>Slots</Button>
                  <Button variant={pickupMode === "custom" ? "default" : "outline"} onClick={() => setPickupMode("custom")}>Custom</Button>
                </div>

                {pickupMode === "asap" && (
                  <div className="flex items-center gap-2 rounded-md border p-3">
                    <Clock className="h-4 w-4" />
                    <span>As soon as possible</span>
                  </div>
                )}

                {pickupMode === "slot" && (
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {generateTimeOptions().map((opt) => (
                      <Button
                        key={opt.value}
                        variant={selectedSlot === opt.value ? "default" : "outline"}
                        onClick={() => setSelectedSlot(opt.value)}
                        className="whitespace-nowrap"
                      >
                        {opt.label}
                      </Button>
                    ))}
                  </div>
                )}

                {pickupMode === "custom" && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Minutes from now</span>
                      <span className="text-sm font-medium">{customMinutes} min</span>
                    </div>
                    <Slider value={[customMinutes]} onValueChange={(val) => setCustomMinutes(val[0] as number)} min={5} max={120} step={5} />
                    <div className="mt-1 flex items-center gap-2 rounded-md border p-3">
                      <Clock className="h-4 w-4" />
                      <span>{items.some((i) => !!i.packaging) ? "Pickup" : "Dine-in"} at {formatMinutesFromNow(customMinutes)}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between">
                  <span>Subtotal</span>
                  <span>₹{totalPrice - packagingCost}</span>
                </div>
                {packagingCost > 0 && (
                  <div className="flex items-center justify-between">
                    <span>Packaging</span>
                    <span>₹{packagingCost}</span>
                  </div>
                )}
                {freebiesCount > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1"><Gift className="h-4 w-4" /> Free Sugarcane × {freebiesCount}</span>
                    <span>₹0</span>
                  </div>
                )}
                <motion.div
                  className="flex items-center justify-between"
                  animate={flashCoupon === "GLUG" ? { scale: [1, 1.03, 1] } : {}}
                  transition={{ duration: 0.4 }}
                >
                  <span>Gateway Charge (3%){appliedCoupons.includes("GLUG") ? " — waived by KL-GLUG" : ""}</span>
                  <span>₹{effectiveGateway}</span>
                </motion.div>
                <Separator className="my-2" />
                <div className="flex items-center justify-between font-medium">
                  <span>Total</span>
                  <span>₹{totalPrice + effectiveGateway}</span>
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full" onClick={handleCheckout} disabled={isProcessing}>
                  {isProcessing ? "Processing..." : "Proceed to Payment"}
                </Button>
              </CardFooter>
            </Card>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-12">
            <ShoppingBag className="mb-4 h-16 w-16 text-muted-foreground" />
            <h2 className="mb-2 text-xl font-semibold">Your cart is empty</h2>
            <p className="mb-6 text-center text-muted-foreground">
              Looks like you haven&apos;t added any items to your cart yet.
            </p>
            <Link href="/">
              <Button>Browse Menu</Button>
            </Link>
          </div>
        )}
  </motion.div>
    </div>
  )
}
