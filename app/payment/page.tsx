"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, CheckCircle, CreditCard, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { useCart } from "@/hooks/use-cart"
import { useOrders } from "@/hooks/use-orders"
import { useToast } from "@/hooks/use-toast"
import { Progress } from "@/components/ui/progress"
import { useAuth } from "@/hooks/use-auth"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Slider } from "@/components/ui/slider"

export default function PaymentPage() {
  const { items, totalPrice, clearCart, canteenName, canClearCart } = useCart()
  const { addOrder } = useOrders()
  const { toast } = useToast()
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()

  const [tipPercentage, setTipPercentage] = useState(0)
  const [customTip, setCustomTip] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentSuccess, setPaymentSuccess] = useState(false)
  const [progress, setProgress] = useState(0)
  const [pickupMode, setPickupMode] = useState<"asap" | "slot" | "custom">("asap")
  const [selectedSlot, setSelectedSlot] = useState<string>("")
  const [customMinutes, setCustomMinutes] = useState<number>(20)

  // Cashfree toggle (client-side env must be prefixed with NEXT_PUBLIC_)
  const CASHFREE_ENABLED = (process.env.NEXT_PUBLIC_CASHFREE || "").toString().toUpperCase() === "TRUE"
  const CASHFREE_MODE = (process.env.NEXT_PUBLIC_CASHFREE_MODE || "production").toString().toLowerCase() === "sandbox" ? "sandbox" : "production"

  // Lazy-load Cashfree SDK (v3) and trigger checkout when session id is provided
  const loadCashfreeAndCheckout = async (paymentSessionId: string) => {
    if (!paymentSessionId) return
    const ensureScript = () =>
      new Promise<void>((resolve, reject) => {
        if (typeof window !== "undefined" && (window as any).Cashfree) {
          resolve()
          return
        }
        const s = document.createElement("script")
        s.src = "https://sdk.cashfree.com/js/v3/cashfree.js"
        s.async = true
        s.onload = () => resolve()
        s.onerror = () => reject(new Error("Failed to load Cashfree SDK"))
        document.head.appendChild(s)
      })
    await ensureScript()
    const CashfreeFn = (window as any).Cashfree
    try {
      const cashfree = CashfreeFn({ mode: CASHFREE_MODE })
      await cashfree.checkout({ paymentSessionId, redirectTarget: "_self" })
    } catch (err) {
      // As a fallback, let caller handle alternate redirects or show error
      throw err
    }
  }

  useEffect(() => {
    // Redirect if not authenticated or cart is empty
    if (!isAuthenticated) {
      router.push("/login")
      return
    }

    if (items.length === 0 && !paymentSuccess) {
      router.push("/")
    }
  }, [items, paymentSuccess, isAuthenticated, router])

  const handleTipSelection = (percentage: number) => {
    setTipPercentage(percentage)
    setCustomTip("")
  }

  const handleCustomTipChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (value === "" || /^\d+$/.test(value)) {
      setCustomTip(value)
      setTipPercentage(0)
    }
  }

  const calculateTip = () => {
    if (customTip) {
      return Number.parseInt(customTip, 10)
    }
    return Math.round((totalPrice * tipPercentage) / 100)
  }

  const tipAmount = calculateTip()
  const platformFee = 5
  const totalAmount = totalPrice + platformFee + tipAmount

  // Generate pickup time options (15-min slots for next 2 hours)
  const generateTimeOptions = () => {
    const options = []
    const now = new Date()
    for (let i = 1; i <= 8; i++) {
      const time = new Date(now.getTime() + i * 15 * 60000)
      const hours = time.getHours()
      const minutes = time.getMinutes()
      const ampm = hours >= 12 ? "PM" : "AM"
      const formattedHours = hours % 12 || 12
      const formattedMinutes = minutes.toString().padStart(2, "0")
      const timeString = `${formattedHours}:${formattedMinutes} ${ampm}`
      options.push({ value: timeString, label: timeString })
    }
    return options
  }

  // Initialize first slot
  useEffect(() => {
    const slots = generateTimeOptions()
    if (slots.length > 0) setSelectedSlot((prev) => prev || slots[0].value)
  }, [])

  const formatMinutesFromNow = (mins: number) => {
    const t = new Date(Date.now() + mins * 60000)
    const h = t.getHours()
    const m = t.getMinutes()
    const ampm = h >= 12 ? "PM" : "AM"
    const hh = h % 12 || 12
    const mm = m.toString().padStart(2, "0")
    return `${hh}:${mm} ${ampm}`
  }

  const displayPickupTime = pickupMode === "asap"
    ? "As soon as possible"
    : pickupMode === "slot"
    ? selectedSlot || ""
    : formatMinutesFromNow(customMinutes)

  // Backend cart helpers (ensure server cart matches local before placing order)
  const baseUrl = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "")
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
    if (!token) return
    try {
      const url = `${baseUrl}/api/user/cart/addToCart?id=${encodeURIComponent(String(itemId))}&quantity=${encodeURIComponent(String(quantity))}`
      await fetch(url, { method: "GET", headers: { Authorization: token }, cache: "no-store" })
    } catch {}
  }

  const handlePayment = () => {
    if (!user) return

    setIsProcessing(true)

    // Simulate payment processing with progress
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          return 100
        }
        return prev + 10
      })
    }, 200)

    // Simulate payment completion plus backend order placement
    ;(async () => {
  try {
        // Progress for UX
        await new Promise((r) => setTimeout(r, 1800))
        clearInterval(interval)
        setProgress(100)

        // Build deliveryTime from chosen pickup option
        let deliveryTime = ""
        if (pickupMode === "asap") {
          // 20 minutes from now as approximate ASAP window
          const t = new Date(Date.now() + 20 * 60000)
          const hh = String(t.getHours()).padStart(2, "0")
          const mm = String(t.getMinutes()).padStart(2, "0")
          deliveryTime = `${hh}:${mm}`
        } else if (pickupMode === "slot") {
          // selectedSlot already formatted like 03:15 PM; convert to 24h HH:mm
          try {
            const match = selectedSlot.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i)
            if (match) {
              let h = parseInt(match[1], 10)
              const m = match[2]
              const ampm = match[3].toUpperCase()
              if (ampm === "PM" && h !== 12) h += 12
              if (ampm === "AM" && h === 12) h = 0
              deliveryTime = `${String(h).padStart(2, "0")}:${m}`
            }
          } catch {}
        } else {
          // custom minutes from now
          const t = new Date(Date.now() + customMinutes * 60000)
          const hh = String(t.getHours()).padStart(2, "0")
          const mm = String(t.getMinutes()).padStart(2, "0")
          deliveryTime = `${hh}:${mm}`
        }

        // Ensure backend cart mirrors local cart for this user
        const token = getToken()
        if (!baseUrl) {
          throw new Error("Missing NEXT_PUBLIC_API_URL; cannot reach backend.")
        }
        if (token) {
          try {
            // push local items
            await clearBackendCart()
            for (const it of items) {
              await addBackendToCart(it.id, it.quantity)
            }
          } catch {}

          // Determine orderType based on packaging selection
          const isPackagingSelected = items.some((it) => !!it.packaging)
          const orderType = isPackagingSelected ? "pickup" : "dinein"
          const gateway = "cashfree"

          const res = await fetch(`${baseUrl}/api/User/order/placeOrder`, {
            method: "POST",
            headers: {
              Authorization: token,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ orderType, deliveryTime, gateway }),
          })
          if (!res.ok) {
            const errText = await res.text().catch(() => "")
            throw new Error(`placeOrder failed (${res.status}) ${errText}`)
          }
          try {
            const data = await res.json()

            // Extract provider and links once
            const provider = (data?.provider || data?.gateway || "").toString().toLowerCase()
            const webLink: string | undefined = data?.payment_links?.web || data?.payment_link || data?.redirect_url || data?.raw?.redirect_url
            const sessionId: string | undefined = data?.raw?.payment_session_id || data?.payment_session_id

            // Cashfree-specific handling when enabled
            if (CASHFREE_ENABLED && (provider === "cashfree" || !!sessionId)) {
              if (webLink && typeof window !== "undefined") {
                window.location.href = webLink
                return
              }
              if (sessionId) {
                try {
                  await loadCashfreeAndCheckout(sessionId)
                  return
                } catch (e) {
                  throw new Error("Unable to start Cashfree checkout. Please try again or contact support.")
                }
              }
              // If Cashfree expected but we couldn't start, block local success
              throw new Error("Cashfree is enabled but no redirect/session was provided.")
            }

            // Generic hosted payment page redirect (works for other gateways like HDFC)
            if ((data?.payment_links?.web as string | undefined) && typeof window !== "undefined") {
              window.location.href = data.payment_links.web
              return
            }
          } catch {}
        } else {
          throw new Error("Missing auth token; please log in again.")
        }

        // Create local order record for tracking (frontend tip shown, ignore in API)
        const orderId = `ORD${Math.floor(100000 + Math.random() * 900000)}`
        const now = new Date()
        const estimatedReadyTime = new Date(now.getTime() + 20 * 60000)
        const canteenId = ""
        addOrder({
          id: orderId,
          items: [...items],
          totalAmount,
          tipAmount,
          paymentMethod: "Online",
          status: "Preparing",
          canteen: canteenName || "Multiple",
          canteenId,
          orderTime: now.toISOString(),
          pickupTime: displayPickupTime,
          estimatedReadyTime: estimatedReadyTime.toISOString(),
          userId: user.id,
          userName: user.name,
        })

        clearCart()
        setPaymentSuccess(true)
        toast({ title: "Payment Successful!", description: "Your order has been placed successfully." })
      } catch (e: any) {
        clearInterval(interval)
        setIsProcessing(false)
        toast({
          title: "Payment failed",
          description: e?.message || "Please try again.",
          variant: "destructive",
        })
      }
    })()
  }

  if (paymentSuccess) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <motion.div
          className="payment-success w-full max-w-md text-center"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <CheckCircle className="mx-auto mb-4 h-16 w-16 text-primary" />
          <h1 className="mb-2 text-2xl font-bold">Payment Successful!</h1>
          <p className="mb-6 text-muted-foreground">
            Your order has been placed successfully. You can track your order status in the Orders section.
          </p>
          <div className="flex flex-col gap-3">
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Link href="/orders">
                <Button className="w-full">Track Order</Button>
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Link href="/">
                <Button variant="outline" className="w-full">
                  Back to Home
                </Button>
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-16 page-transition">
      <div className="sticky top-0 z-10 flex items-center bg-background p-4 shadow-sm">
        <Link href="/cart" className="mr-2">
          <ArrowLeft className="h-5 w-5" />
        </Link>
  <h1 className="text-xl font-bold">Checkout</h1>
      </div>

      <div className="container px-4 py-6">
        {isProcessing ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <Card className="mb-6">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="mb-6 w-full max-w-xs">
                  <Progress value={progress} className="h-2" />
                </div>
                <div className={`${progress === 100 ? "spin" : ""} mb-4 rounded-full bg-primary/10 p-4`}>
                  <CreditCard className="h-8 w-8 text-primary" />
                </div>
                <h2 className="mb-2 text-xl font-semibold">Processing Payment</h2>
                <p className="text-center text-muted-foreground">Please wait while we process your payment...</p>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Pickup Time</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="mb-4 flex gap-2">
                    <Button
                      variant={pickupMode === "asap" ? "default" : "outline"}
                      onClick={() => setPickupMode("asap")}
                    >
                      ASAP
                    </Button>
                    <Button
                      variant={pickupMode === "slot" ? "default" : "outline"}
                      onClick={() => setPickupMode("slot")}
                    >
                      Slots
                    </Button>
                    <Button
                      variant={pickupMode === "custom" ? "default" : "outline"}
                      onClick={() => setPickupMode("custom")}
                    >
                      Custom
                    </Button>
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
                          size="sm"
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
                      <Slider
                        value={[customMinutes]}
                        onValueChange={(val) => setCustomMinutes(val[0] as number)}
                        min={5}
                        max={120}
                        step={5}
                      />
                      <div className="mt-1 flex items-center gap-2 rounded-md border p-3">
                        <Clock className="h-4 w-4" />
                        <span>Pickup at {formatMinutesFromNow(customMinutes)}</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Payment methods removed intentionally */}

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Add a Tip</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-2">
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button
                        variant={tipPercentage === 5 ? "default" : "outline"}
                        onClick={() => handleTipSelection(5)}
                        className="w-full"
                      >
                        5% (₹{Math.round(totalPrice * 0.05)})
                      </Button>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button
                        variant={tipPercentage === 10 ? "default" : "outline"}
                        onClick={() => handleTipSelection(10)}
                        className="w-full"
                      >
                        10% (₹{Math.round(totalPrice * 0.1)})
                      </Button>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button
                        variant={tipPercentage === 15 ? "default" : "outline"}
                        onClick={() => handleTipSelection(15)}
                        className="w-full"
                      >
                        15% (₹{Math.round(totalPrice * 0.15)})
                      </Button>
                    </motion.div>
                  </div>
                  <div className="mt-3">
                    <Label htmlFor="custom-tip">Custom Tip (₹)</Label>
                    <Input
                      id="custom-tip"
                      type="text"
                      placeholder="Enter amount"
                      value={customTip}
                      onChange={handleCustomTipChange}
                      className="mt-1"
                    />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span>Subtotal</span>
                    <span>₹{totalPrice}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Platform fee</span>
                    <span>₹{platformFee}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Tip</span>
                    <span>₹{tipAmount}</span>
                  </div>
                  <Separator className="my-2" />
                  <div className="flex items-center justify-between font-medium">
                    <span>Total</span>
                    <span>₹{totalAmount}</span>
                  </div>
                </CardContent>
                <CardFooter>
                  <motion.div className="w-full" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button className="w-full" onClick={handlePayment}>
                      Pay ₹{totalAmount}
                    </Button>
                  </motion.div>
                </CardFooter>
              </Card>
            </motion.div>
          </>
        )}
      </div>
    </div>
  )
}
