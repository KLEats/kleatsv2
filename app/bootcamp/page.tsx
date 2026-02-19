"use client"

import type React from "react"
import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import {
    ArrowLeft,
    ArrowRight,
    Check,
    User,
    Bus,
    Home,
    Languages,
    Sparkles,
    AlertTriangle,
    Info,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { useAuth } from "@/hooks/use-auth"
import { useToast } from "@/hooks/use-toast"
import PageHeader from "@/components/page-header"

// Configurable IDs — set NEXT_PUBLIC_BOOTCAMP_CANTEEN_ID and NEXT_PUBLIC_BOOTCAMP_ITEM_ID in .env.local
const BOOTCAMP_CANTEEN_ID = process.env.NEXT_PUBLIC_BOOTCAMP_CANTEEN_ID || ""
const BOOTCAMP_ITEM_ID = process.env.NEXT_PUBLIC_BOOTCAMP_ITEM_ID || ""

const STEPS_DAY_SCHOLAR = [
    { id: 1, title: "Accommodation", icon: Home },
    { id: 2, title: "Personal Info", icon: User },
    { id: 3, title: "Transport & Skills", icon: Bus },
]

const STEPS_HOSTLER = [
    { id: 1, title: "Accommodation", icon: Home },
    { id: 2, title: "Personal Info", icon: User },
    { id: 3, title: "Skills", icon: Languages },
]

const TRANSPORT_OPTIONS = [
    { value: "bus_vijayawada", label: "Bus — Vijayawada" },
    { value: "bus_tenali", label: "Bus — Tenali" },
    { value: "bus_guntur", label: "Bus — Guntur" },
    { value: "own_transport", label: "Own Transport" },
]

const TELUGU_OPTIONS = [
    { value: "can_read_write", label: "Can Read & Write" },
    { value: "can_only_read", label: "Can Only Read" },
    { value: "can_only_understand", label: "Can Only Understand" },
    { value: "cannot_understand", label: "Cannot Understand" },
]

const PYTHON_LEVELS = [1, 2, 3, 4, 5]

export default function BootcampPage() {
    const { user, isAuthenticated, isInitialized } = useAuth()
    const router = useRouter()
    const { toast } = useToast()
    const [mounted, setMounted] = useState(false)

    // Form state
    const [step, setStep] = useState(1)
    const [accommodation, setAccommodation] = useState<"hostler" | "dayScholar" | "">("")
    const [name, setName] = useState("")
    const [idNumber, setIdNumber] = useState("")
    const [transport, setTransport] = useState("")

    // Determine steps based on accommodation type
    const isHostler = accommodation === "hostler"
    const steps = isHostler ? STEPS_HOSTLER : STEPS_DAY_SCHOLAR
    const [teluguSkill, setTeluguSkill] = useState("")
    const [pythonSkill, setPythonSkill] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isSuccess, setIsSuccess] = useState(false)
    const [direction, setDirection] = useState(1) // 1 = forward, -1 = backward

    useEffect(() => {
        setMounted(true)
    }, [])

    // Pre-fill name from auth
    useEffect(() => {
        if (user?.name && !name) {
            setName(user.name)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user])

    // Auth gate — check both hook state AND actual token in localStorage
    useEffect(() => {
        if (!mounted || !isInitialized) return
        const token = typeof window !== "undefined" && (localStorage.getItem("auth_token") || localStorage.getItem("token"))
        if (!isAuthenticated || !token) {
            router.push("/login?returnTo=/bootcamp")
        }
    }, [isAuthenticated, isInitialized, mounted, router])

    // Check if user is already registered
    useEffect(() => {
        if (!mounted || !isInitialized || !user?.id) return
            ; (async () => {
                try {
                    const res = await fetch(`/api/bootcamp/register?userId=${encodeURIComponent(user.id)}`)
                    const data = await res.json()
                    if (data.found && data.data) {
                        const reg = data.data
                        // Only show success if payment is confirmed or not required
                        if (reg.paymentStatus === "paid" || reg.paymentStatus === "not_required") {
                            setName(reg.name || "")
                            setIdNumber(reg.idNumber || "")
                            setAccommodation(reg.accommodation || "")
                            setTransport(reg.transport || "")
                            setTeluguSkill(reg.teluguSkill || "")
                            setPythonSkill(reg.pythonSkill ? String(reg.pythonSkill) : "")
                            setIsSuccess(true)
                        }
                        // If status is "pending", let the user see the form to retry payment
                    }
                } catch {
                    // Silently fail — user can still register if check fails
                }
            })()
    }, [mounted, isInitialized, user?.id])

    // Auto-set transport for hostelers
    useEffect(() => {
        if (accommodation === "hostler") {
            setTransport("hostler")
        } else if (transport === "hostler") {
            setTransport("")
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [accommodation])

    // Step validation
    const canProceed = useMemo(() => {
        switch (step) {
            case 1:
                return accommodation !== ""
            case 2:
                return name.trim().length > 0 && idNumber.trim().length === 10
            case 3:
                // Telugu + Python required; transport also required for day scholars
                const skillsOk = teluguSkill !== "" && pythonSkill !== ""
                return isHostler ? skillsOk : (transport !== "" && skillsOk)
            default:
                return false
        }
    }, [step, accommodation, name, idNumber, transport, teluguSkill, pythonSkill, isHostler])

    const goNext = useCallback(() => {
        if (step < steps.length && canProceed) {
            setDirection(1)
            setStep((s) => s + 1)
        }
    }, [step, canProceed])

    const goBack = useCallback(() => {
        if (step > 1) {
            setDirection(-1)
            setStep((s) => s - 1)
        }
    }, [step])

    // (Team management removed — payments are individual)

    // Backend API helpers (match existing payment page pattern)
    const baseUrl = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "")
    const getToken = () =>
        (typeof window !== "undefined" && (localStorage.getItem("auth_token") || localStorage.getItem("token"))) || null

    const CASHFREE_ENABLED = (process.env.NEXT_PUBLIC_CASHFREE || "").toString().toUpperCase() === "TRUE"
    const CASHFREE_MODE = (process.env.NEXT_PUBLIC_CASHFREE_MODE || "production").toString().toLowerCase() === "sandbox" ? "sandbox" : "production"

    // Lazy-load Cashfree SDK (same pattern as payment page)
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
        const cashfree = CashfreeFn({ mode: CASHFREE_MODE })
        await cashfree.checkout({ paymentSessionId, redirectTarget: "_self" })
    }

    // On mount: check if returning from payment with pending registration.
    // We verify the payment actually went through by checking order status via the backend
    // before completing the registration.
    useEffect(() => {
        if (!mounted) return
        const pendingRaw = sessionStorage.getItem("bootcamp_registration")
        const paymentInitiated = sessionStorage.getItem("bootcamp_payment_initiated")
        if (!pendingRaw || !paymentInitiated) return

        const storedOrderId = sessionStorage.getItem("bootcamp_order_id") || ""

            // Verify payment before completing registration
            ; (async () => {
                try {
                    const registrationData = JSON.parse(pendingRaw)
                    const token = getToken()
                    if (!token) {
                        // No auth token — can't verify, clean up and let user retry
                        sessionStorage.removeItem("bootcamp_registration")
                        sessionStorage.removeItem("bootcamp_payment_initiated")
                        sessionStorage.removeItem("bootcamp_order_id")
                        toast({ title: "Session Expired", description: "Please log in and try again.", variant: "destructive" })
                        return
                    }

                    // Call backend to check if the order was actually paid
                    const ordersRes = await fetch(`${baseUrl}/api/User/order/getOrders?requestOffset=0`, {
                        method: "GET",
                        headers: { Authorization: token },
                        cache: "no-store",
                    })

                    if (!ordersRes.ok) {
                        // Can't verify — don't auto-register, let user retry
                        toast({ title: "Verification failed", description: "Could not verify payment. Please try registering again.", variant: "destructive" })
                        sessionStorage.removeItem("bootcamp_registration")
                        sessionStorage.removeItem("bootcamp_payment_initiated")
                        sessionStorage.removeItem("bootcamp_order_id")
                        return
                    }

                    const ordersData = await ordersRes.json()
                    // Normalise the orders array from various response shapes
                    let ordersList: any[] = []
                    if (Array.isArray(ordersData)) ordersList = ordersData
                    else if (Array.isArray(ordersData?.data)) ordersList = ordersData.data
                    else if (Array.isArray(ordersData?.data?.items)) ordersList = ordersData.data.items
                    else if (Array.isArray(ordersData?.items)) ordersList = ordersData.items
                    else if (Array.isArray(ordersData?.orders)) ordersList = ordersData.orders

                    // Find the matching order and check payment status
                    const isPaid = ordersList.some((o: any) => {
                        const oid = String(o.id ?? o.orderId ?? o.OrderId ?? o._id ?? o.pid ?? "")
                        const txnId = String(o.transactionId ?? o.transaction_id ?? o.cf_order_id ?? "")
                        const status = String(o.status ?? o.orderStatus ?? o.OrderStatus ?? o.paymentStatus ?? "").toLowerCase()
                        const paidStatuses = ["paid", "completed", "success", "delivered", "preparing", "ready", "active", "confirmed", "order_confirmed"]
                        if (storedOrderId && (oid === storedOrderId || txnId === storedOrderId)) {
                            return paidStatuses.some(s => status.includes(s))
                        }
                        return false
                    })

                    // If no storedOrderId or no match found, also check if the most recent order
                    // (created in the last 10 min) for the bootcamp item is paid
                    const recentPaid = !isPaid && ordersList.some((o: any) => {
                        const status = String(o.status ?? o.orderStatus ?? o.OrderStatus ?? o.paymentStatus ?? "").toLowerCase()
                        const paidStatuses = ["paid", "completed", "success", "delivered", "preparing", "ready", "active", "confirmed", "order_confirmed"]
                        const statusOk = paidStatuses.some(s => status.includes(s))
                        if (!statusOk) return false
                        // Check if this order is recent (within last 10 minutes)
                        const createdAt = o.createdAt ?? o.orderDate ?? o.OrderDate ?? o.orderTime ?? ""
                        if (!createdAt) return false
                        try {
                            const orderTime = new Date(createdAt).getTime()
                            const tenMinAgo = Date.now() - 10 * 60 * 1000
                            return orderTime > tenMinAgo
                        } catch { return false }
                    })

                    if (!isPaid && !recentPaid) {
                        // Payment NOT verified — do NOT register
                        toast({
                            title: "Payment not completed",
                            description: "Your payment was not confirmed. Please try registering again.",
                            variant: "destructive",
                        })
                        sessionStorage.removeItem("bootcamp_registration")
                        sessionStorage.removeItem("bootcamp_payment_initiated")
                        sessionStorage.removeItem("bootcamp_order_id")
                        return
                    }

                    // Payment verified — update registration status to "paid" via PATCH
                    const res = await fetch("/api/bootcamp/register", {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ idNumber: registrationData.idNumber, paymentStatus: "paid" }),
                    })
                    const data = await res.json()
                    if (res.ok && data.code === 1) {
                        sessionStorage.removeItem("bootcamp_registration")
                        sessionStorage.removeItem("bootcamp_payment_initiated")
                        sessionStorage.removeItem("bootcamp_order_id")
                        setName(registrationData.name || "")
                        setIdNumber(registrationData.idNumber || "")
                        setAccommodation(registrationData.accommodation || "")
                        setTransport(registrationData.transport || "")
                        setTeluguSkill(registrationData.teluguSkill || "")
                        setIsSuccess(true)
                        toast({ title: "Registration Successful! 🎉", description: "Payment verified. You're all set for the bootcamp." })
                    } else {
                        sessionStorage.removeItem("bootcamp_registration")
                        sessionStorage.removeItem("bootcamp_payment_initiated")
                        sessionStorage.removeItem("bootcamp_order_id")
                        toast({ title: "Registration issue", description: data.message || "Could not update registration. Please contact support.", variant: "destructive" })
                    }
                } catch {
                    sessionStorage.removeItem("bootcamp_registration")
                    sessionStorage.removeItem("bootcamp_payment_initiated")
                    sessionStorage.removeItem("bootcamp_order_id")
                    toast({ title: "Error", description: "Failed to finalize registration. Please try again.", variant: "destructive" })
                }
            })()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mounted])

    const handleSubmit = async () => {
        setIsSubmitting(true)
        try {
            const registrationData = {
                name: name.trim(),
                email: user?.email || "",
                userId: user?.id || "",
                idNumber: idNumber.trim().toUpperCase(),
                accommodation,
                transport: isHostler ? "hostler" : transport,
                teluguSkill,
                pythonSkill: Number(pythonSkill),
                paymentStatus: isHostler ? "not_required" : "pending",
            }

            if (accommodation === "dayScholar") {
                // Day scholar: initiate payment via backend cart + placeOrder
                const token = getToken()
                if (!token) {
                    toast({
                        title: "Session Expired",
                        description: "Please log in again to continue registration.",
                        variant: "destructive",
                    })
                    router.push("/login?returnTo=/bootcamp")
                    return
                }
                if (!BOOTCAMP_CANTEEN_ID || !BOOTCAMP_ITEM_ID) {
                    // Fallback: save registration without payment if IDs not configured
                    const res = await fetch("/api/bootcamp/register", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(registrationData),
                    })
                    const data = await res.json()
                    if (!res.ok || data.code !== 1) {
                        throw new Error(data.message || "Registration failed")
                    }
                    setIsSuccess(true)
                    toast({
                        title: "Registered!",
                        description: "Payment link for food will be shared separately.",
                    })
                    return
                }

                // Save registration to backend BEFORE payment (with paymentStatus: "pending")
                // This ensures data is captured even if Cashfree redirects elsewhere after payment
                console.log("[Bootcamp] Saving registration before payment:", registrationData)
                const preRegRes = await fetch("/api/bootcamp/register", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(registrationData),
                })
                const preRegData = await preRegRes.json()
                console.log("[Bootcamp] Pre-registration response:", preRegRes.status, preRegData)
                if (preRegRes.status === 409) {
                    // Already registered — check payment status
                    if (preRegData.data?.paymentStatus === "paid" || preRegData.data?.paymentStatus === "not_required") {
                        setIsSuccess(true)
                        toast({ title: "Already Registered", description: "You're already registered for the bootcamp." })
                        return
                    }
                    // Payment still pending — proceed to payment flow below
                    console.log("[Bootcamp] Existing pending registration found, proceeding to payment")
                }
                if (preRegRes.status !== 409 && (!preRegRes.ok || preRegData.code !== 1)) {
                    throw new Error(preRegData.message || "Registration failed")
                }

                toast({ title: "Initiating Payment...", description: "Setting up ₹150 payment for Dinner & Breakfast." })

                // Save to sessionStorage so we can update status on return
                sessionStorage.setItem("bootcamp_registration", JSON.stringify(registrationData))

                // Step 1: Clear backend cart
                try {
                    await fetch(`${baseUrl}/api/user/cart/clearCart`, {
                        method: "DELETE",
                        headers: { Authorization: token },
                    })
                } catch { }

                // Step 2: Add bootcamp food item to backend cart
                const addUrl = `${baseUrl}/api/user/cart/addToCart?id=${encodeURIComponent(BOOTCAMP_ITEM_ID)}&quantity=1`
                const addRes = await fetch(addUrl, {
                    method: "GET",
                    headers: { Authorization: token },
                    cache: "no-store",
                })
                if (!addRes.ok) {
                    throw new Error("Failed to add bootcamp item to cart. Please try again.")
                }

                // Step 3: Place order via placeOrder API
                const now = new Date()
                const deliveryTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`
                const orderRes = await fetch(`${baseUrl}/api/User/order/placeOrder`, {
                    method: "POST",
                    headers: {
                        Authorization: token,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        orderType: "dinein",
                        deliveryTime,
                        coupons: ["GLUG"],
                        gateway: "cashfree",
                    }),
                })

                if (!orderRes.ok) {
                    const errText = await orderRes.text().catch(() => "")
                    throw new Error(`Order failed (${orderRes.status}) ${errText}`)
                }

                const orderData = await orderRes.json()
                const apiCode = typeof orderData?.code === "number" ? orderData.code : 1
                if (apiCode !== 1) {
                    const msg = (orderData?.message as string) || "Could not initiate payment."
                    throw new Error(msg)
                }

                // Store order ID so we can verify payment on return
                const bootcampOrderId = String(orderData?.orderId ?? orderData?.order_id ?? orderData?.id ?? orderData?.cf_order_id ?? orderData?.raw?.order_id ?? "")
                if (bootcampOrderId) {
                    sessionStorage.setItem("bootcamp_order_id", bootcampOrderId)
                }

                // Step 4: Redirect to payment gateway
                const provider = (orderData?.provider || orderData?.gateway || "").toString().toLowerCase()
                const webLink: string | undefined = orderData?.payment_links?.web || orderData?.payment_link || orderData?.redirect_url || orderData?.raw?.redirect_url
                const sessionId: string | undefined = orderData?.raw?.payment_session_id || orderData?.payment_session_id

                console.log("[Bootcamp] placeOrder response:", { provider, webLink: !!webLink, sessionId: !!sessionId, CASHFREE_ENABLED, bootcampOrderId, orderData })

                // Cashfree-specific handling (matching payment page logic exactly)
                if (CASHFREE_ENABLED && (provider === "cashfree" || !!sessionId)) {
                    if (webLink && typeof window !== "undefined") {
                        // Set flag ONLY right before actual redirect
                        sessionStorage.setItem("bootcamp_payment_initiated", "true")
                        window.location.href = webLink
                        return
                    }
                    if (sessionId) {
                        try {
                            sessionStorage.setItem("bootcamp_payment_initiated", "true")
                            await loadCashfreeAndCheckout(sessionId)
                            return
                        } catch (e) {
                            sessionStorage.removeItem("bootcamp_payment_initiated")
                            sessionStorage.removeItem("bootcamp_registration")
                            sessionStorage.removeItem("bootcamp_order_id")
                            throw new Error("Unable to start Cashfree checkout. Please try again.")
                        }
                    }
                    // Cashfree expected but no redirect — clean up and block
                    sessionStorage.removeItem("bootcamp_registration")
                    sessionStorage.removeItem("bootcamp_order_id")
                    throw new Error("Payment gateway did not return a redirect. Please try again or contact support.")
                }

                // Generic hosted payment page redirect (other gateways)
                if (webLink && typeof window !== "undefined") {
                    sessionStorage.setItem("bootcamp_payment_initiated", "true")
                    window.location.href = webLink
                    return
                }

                // If we reach here, payment wasn't initiated — clean up and error
                sessionStorage.removeItem("bootcamp_registration")
                sessionStorage.removeItem("bootcamp_order_id")
                throw new Error("Payment could not be initiated. Please try again or contact support.")
            } else {
                // Hostler: save immediately (no payment needed)
                const res = await fetch("/api/bootcamp/register", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(registrationData),
                })
                const data = await res.json()
                if (!res.ok || data.code !== 1) {
                    throw new Error(data.message || "Registration failed")
                }
                setIsSuccess(true)
                toast({ title: "Registration Successful! 🎉", description: "You're all set for the bootcamp." })
            }
        } catch (err: any) {
            toast({
                title: "Registration Failed",
                description: err?.message || "Something went wrong. Please try again.",
                variant: "destructive",
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    // Wait for initialization
    if (!mounted || !isInitialized) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
                    <p className="text-muted-foreground">Loading...</p>
                </div>
            </div>
        )
    }

    if (!isAuthenticated) return null

    // Success screen
    if (isSuccess) {
        return (
            <div className="min-h-screen pb-16 page-transition">
                <PageHeader title="Bootcamp Registration" />
                <div className="container px-4 py-12">
                    <motion.div
                        className="mx-auto max-w-md text-center"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.5 }}
                    >
                        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                            <Check className="h-10 w-10 text-green-600 dark:text-green-400" />
                        </div>
                        <h2 className="mb-2 text-2xl font-bold">You're Registered! 🎉</h2>
                        <p className="mb-2 text-muted-foreground">
                            KLGLUG Agentic AI Overnight Bootcamp
                        </p>
                        <div className="my-6 rounded-lg border bg-card p-4 text-left text-sm space-y-1">
                            <p><span className="font-medium">Name:</span> {name}</p>
                            <p><span className="font-medium">ID:</span> {idNumber.toUpperCase()}</p>
                            <p><span className="font-medium">Type:</span> {accommodation === "hostler" ? "Hostler" : "Day Scholar"}</p>
                            {!isHostler && (
                                <p><span className="font-medium">Transport:</span> {TRANSPORT_OPTIONS.find((t) => t.value === transport)?.label}</p>
                            )}

                        </div>
                        {accommodation === "hostler" && (
                            <Alert className="mb-6 text-left">
                                <Info className="h-4 w-4" />
                                <AlertTitle>Food Tokens</AlertTitle>
                                <AlertDescription>
                                    Please collect your food token from your respective hostel warden.
                                </AlertDescription>
                            </Alert>
                        )}
                        <div className="flex flex-col gap-3">
                            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                                <Link href="/">
                                    <Button className="w-full">Back to Home</Button>
                                </Link>
                            </motion.div>
                        </div>
                    </motion.div>
                </div>
            </div>
        )
    }

    // Slide animation variants
    const slideVariants = {
        enter: (dir: number) => ({
            x: dir > 0 ? 80 : -80,
            opacity: 0,
        }),
        center: {
            x: 0,
            opacity: 1,
        },
        exit: (dir: number) => ({
            x: dir > 0 ? -80 : 80,
            opacity: 0,
        }),
    }

    return (
        <div className="min-h-screen pb-16 page-transition">
            <PageHeader title="Bootcamp Registration" />

            <div className="container px-4 py-6">
                {/* Hero Section */}
                <motion.div
                    className="mb-8 text-center"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/90 to-primary shadow-lg shadow-primary/25">
                        <Sparkles className="h-7 w-7 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                        KLGLUG Agentic AI
                    </h1>
                    <p className="text-lg font-semibold text-primary">
                        Overnight Bootcamp
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Register below to secure your spot
                    </p>
                </motion.div>

                {/* Step Progress */}
                <div className="mx-auto mb-8 max-w-lg px-2">
                    <div className="flex items-center">
                        {steps.map((s, i) => {
                            const IconComp = s.icon
                            const isActive = step === s.id
                            const isCompleted = step > s.id
                            return (
                                <div key={s.id} className="flex flex-1 items-center">
                                    <div className="flex w-full flex-col items-center">
                                        <motion.div
                                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 transition-colors duration-300 ${isCompleted
                                                ? "border-primary bg-primary text-white"
                                                : isActive
                                                    ? "border-primary bg-primary/10 text-primary"
                                                    : "border-muted bg-muted/50 text-muted-foreground"
                                                }`}
                                            animate={isActive ? { scale: [1, 1.1, 1] } : {}}
                                            transition={{ duration: 0.5 }}
                                        >
                                            {isCompleted ? (
                                                <Check className="h-5 w-5" />
                                            ) : (
                                                <IconComp className="h-5 w-5" />
                                            )}
                                        </motion.div>
                                        <span
                                            className={`mt-1.5 w-full text-center text-[11px] font-medium leading-tight ${isActive
                                                ? "text-primary"
                                                : isCompleted
                                                    ? "text-foreground"
                                                    : "text-muted-foreground"
                                                }`}
                                        >
                                            {s.title}
                                        </span>
                                    </div>
                                    {i < steps.length - 1 && (
                                        <div
                                            className={`mx-1 mt-[-18px] h-0.5 w-full min-w-[20px] flex-1 rounded-full transition-colors duration-300 ${step > s.id ? "bg-primary" : "bg-muted"
                                                }`}
                                        />
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Form Card */}
                <div className="mx-auto max-w-lg">
                    <Card className="overflow-hidden">
                        <AnimatePresence mode="wait" custom={direction}>
                            <motion.div
                                key={step}
                                custom={direction}
                                variants={slideVariants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={{ duration: 0.3, ease: "easeInOut" }}
                            >
                                {/* Step 1: Accommodation */}
                                {step === 1 && (
                                    <>
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2">
                                                <Home className="h-5 w-5 text-primary" />
                                                Accommodation Type
                                            </CardTitle>
                                            <CardDescription>
                                                Are you a hostler or a day scholar?
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <RadioGroup
                                                value={accommodation}
                                                onValueChange={(v) => setAccommodation(v as any)}
                                                className="space-y-3"
                                            >
                                                <label
                                                    htmlFor="acc-hostler"
                                                    className={`flex cursor-pointer items-start gap-4 rounded-xl border-2 p-4 transition-all ${accommodation === "hostler"
                                                        ? "border-primary bg-primary/5 shadow-sm"
                                                        : "border-muted hover:border-muted-foreground/30"
                                                        }`}
                                                >
                                                    <RadioGroupItem value="hostler" id="acc-hostler" className="mt-1" />
                                                    <div className="flex-1">
                                                        <div className="font-medium">Hostler</div>
                                                        <p className="mt-0.5 text-sm text-muted-foreground">
                                                            I stay in the college hostel
                                                        </p>
                                                    </div>
                                                </label>
                                                <label
                                                    htmlFor="acc-dayScholar"
                                                    className={`flex cursor-pointer items-start gap-4 rounded-xl border-2 p-4 transition-all ${accommodation === "dayScholar"
                                                        ? "border-primary bg-primary/5 shadow-sm"
                                                        : "border-muted hover:border-muted-foreground/30"
                                                        }`}
                                                >
                                                    <RadioGroupItem value="dayScholar" id="acc-dayScholar" className="mt-1" />
                                                    <div className="flex-1">
                                                        <div className="font-medium">Day Scholar</div>
                                                        <p className="mt-0.5 text-sm text-muted-foreground">
                                                            I commute from outside campus
                                                        </p>
                                                    </div>
                                                </label>
                                            </RadioGroup>

                                            <AnimatePresence>
                                                {accommodation === "hostler" && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: "auto", opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        transition={{ duration: 0.3 }}
                                                    >
                                                        <Alert className="border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/30">
                                                            <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                                            <AlertTitle className="text-blue-800 dark:text-blue-300">Food Tokens</AlertTitle>
                                                            <AlertDescription className="text-blue-700 dark:text-blue-400">
                                                                Food tokens should be collected from your respective hostel warden.
                                                            </AlertDescription>
                                                        </Alert>
                                                    </motion.div>
                                                )}

                                                {accommodation === "dayScholar" && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: "auto", opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        transition={{ duration: 0.3 }}
                                                    >
                                                        <Alert className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30">
                                                            <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                                                            <AlertTitle className="text-amber-800 dark:text-amber-300">Payment Required — ₹150</AlertTitle>
                                                            <AlertDescription className="text-amber-700 dark:text-amber-400">
                                                                Day scholars need to pay ₹150 for Dinner & Breakfast. You will be redirected to pay after registration.
                                                            </AlertDescription>
                                                        </Alert>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </CardContent>
                                    </>
                                )}

                                {/* Step 2: Personal Info */}
                                {step === 2 && (
                                    <>
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2">
                                                <User className="h-5 w-5 text-primary" />
                                                Personal Information
                                            </CardTitle>
                                            <CardDescription>
                                                Enter your name and university ID number
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="reg-name">Full Name</Label>
                                                <Input
                                                    id="reg-name"
                                                    value={name}
                                                    onChange={(e) => setName(e.target.value)}
                                                    placeholder="Your full name"
                                                    className="h-12"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="reg-id">ID Number</Label>
                                                <Input
                                                    id="reg-id"
                                                    value={idNumber}
                                                    onChange={(e) =>
                                                        setIdNumber(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10))
                                                    }
                                                    placeholder="e.g. 2300030001"
                                                    className="h-12 font-mono tracking-wider"
                                                    maxLength={10}
                                                />
                                                <p className="text-xs text-muted-foreground">
                                                    Your 10-digit university ID number
                                                </p>
                                            </div>
                                        </CardContent>
                                    </>
                                )}

                                {/* Step 3: Skills (Transport for day scholars + Telugu + Python) */}
                                {step === 3 && (
                                    <>
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2">
                                                {isHostler ? (
                                                    <Languages className="h-5 w-5 text-primary" />
                                                ) : (
                                                    <Bus className="h-5 w-5 text-primary" />
                                                )}
                                                {isHostler ? "Skills" : "Transport & Skills"}
                                            </CardTitle>
                                            <CardDescription>
                                                {isHostler
                                                    ? "Your Telugu and Python proficiency"
                                                    : "How you're getting to campus, and your skill levels"}
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent className="space-y-6">
                                            {/* Transport section — only for day scholars */}
                                            {!isHostler && (
                                                <>
                                                    <div className="space-y-3">
                                                        <Label className="text-base font-semibold">Mode of Transport</Label>
                                                        <RadioGroup
                                                            value={transport}
                                                            onValueChange={setTransport}
                                                            className="grid grid-cols-2 gap-2"
                                                        >
                                                            {TRANSPORT_OPTIONS.map((opt) => (
                                                                <label
                                                                    key={opt.value}
                                                                    htmlFor={`transport-${opt.value}`}
                                                                    className={`flex cursor-pointer items-center gap-2 rounded-lg border-2 p-3 text-sm transition-all ${transport === opt.value
                                                                        ? "border-primary bg-primary/5 font-medium shadow-sm"
                                                                        : "border-muted hover:border-muted-foreground/30"
                                                                        }`}
                                                                >
                                                                    <RadioGroupItem value={opt.value} id={`transport-${opt.value}`} />
                                                                    <span>{opt.label}</span>
                                                                </label>
                                                            ))}
                                                        </RadioGroup>
                                                    </div>
                                                    <Separator />
                                                </>
                                            )}

                                            <div className="space-y-3">
                                                <Label className="text-base font-semibold flex items-center gap-2">
                                                    <Languages className="h-4 w-4" />
                                                    Telugu Proficiency
                                                </Label>
                                                <RadioGroup
                                                    value={teluguSkill}
                                                    onValueChange={setTeluguSkill}
                                                    className="grid grid-cols-2 gap-2"
                                                >
                                                    {TELUGU_OPTIONS.map((opt) => (
                                                        <label
                                                            key={opt.value}
                                                            htmlFor={`telugu-${opt.value}`}
                                                            className={`flex cursor-pointer items-center gap-2 rounded-lg border-2 p-3 text-sm transition-all ${teluguSkill === opt.value
                                                                ? "border-primary bg-primary/5 font-medium shadow-sm"
                                                                : "border-muted hover:border-muted-foreground/30"
                                                                }`}
                                                        >
                                                            <RadioGroupItem value={opt.value} id={`telugu-${opt.value}`} />
                                                            <span>{opt.label}</span>
                                                        </label>
                                                    ))}
                                                </RadioGroup>
                                            </div>

                                            <Separator />

                                            <div className="space-y-3">
                                                <Label className="text-base font-semibold">Rate your Python programming skills (1-5)</Label>
                                                <p className="text-sm text-muted-foreground">1 being beginner and 5 being expert</p>
                                                <RadioGroup
                                                    value={pythonSkill}
                                                    onValueChange={setPythonSkill}
                                                    className="flex gap-2"
                                                >
                                                    {PYTHON_LEVELS.map((level) => (
                                                        <label
                                                            key={level}
                                                            htmlFor={`python-${level}`}
                                                            className={`flex h-12 w-12 cursor-pointer items-center justify-center rounded-xl border-2 text-lg font-bold transition-all ${pythonSkill === String(level)
                                                                ? "border-primary bg-primary text-white shadow-sm"
                                                                : "border-muted hover:border-muted-foreground/30"
                                                                }`}
                                                        >
                                                            <RadioGroupItem value={String(level)} id={`python-${level}`} className="sr-only" />
                                                            {level}
                                                        </label>
                                                    ))}
                                                </RadioGroup>
                                            </div>
                                        </CardContent>
                                    </>
                                )}

                                {/* Team step removed — payments are individual */}

                                {/* Navigation Footer */}
                                <CardFooter className="flex justify-between border-t bg-muted/20 px-6 py-4">
                                    <Button
                                        variant="ghost"
                                        onClick={goBack}
                                        disabled={step === 1}
                                        className="gap-1"
                                    >
                                        <ArrowLeft className="h-4 w-4" />
                                        Back
                                    </Button>

                                    {step < steps.length ? (
                                        <Button
                                            onClick={goNext}
                                            disabled={!canProceed}
                                            className="gap-1"
                                        >
                                            Next
                                            <ArrowRight className="h-4 w-4" />
                                        </Button>
                                    ) : (
                                        <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                                            <Button
                                                onClick={handleSubmit}
                                                disabled={isSubmitting}
                                                className="gap-1 bg-gradient-to-r from-primary to-primary/80 px-6"
                                            >
                                                {isSubmitting ? (
                                                    <>
                                                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                                        Registering...
                                                    </>
                                                ) : accommodation === "dayScholar" ? (
                                                    <>
                                                        Register & Pay ₹150
                                                        <ArrowRight className="h-4 w-4" />
                                                    </>
                                                ) : (
                                                    <>
                                                        Register
                                                        <Check className="h-4 w-4" />
                                                    </>
                                                )}
                                            </Button>
                                        </motion.div>
                                    )}
                                </CardFooter>
                            </motion.div>
                        </AnimatePresence>
                    </Card>
                </div>
            </div>
        </div>
    )
}
