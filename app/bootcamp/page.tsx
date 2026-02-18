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
    Plus,
    Trash2,
    Users,
    User,
    Bus,
    Home,
    Languages,
    Crown,
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
import { Badge } from "@/components/ui/badge"
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
    { id: 4, title: "Team", icon: Users },
]

const STEPS_HOSTLER = [
    { id: 1, title: "Accommodation", icon: Home },
    { id: 2, title: "Personal Info", icon: User },
    { id: 3, title: "Telugu Skill", icon: Languages },
    { id: 4, title: "Team", icon: Users },
]

const TRANSPORT_OPTIONS = [
    { value: "bus_vijayawada", label: "Bus — Vijayawada" },
    { value: "bus_tenali", label: "Bus — Tenali" },
    { value: "bus_guntur", label: "Bus — Guntur" },
    { value: "own_transport", label: "Own Transport" },
    { value: "others", label: "Others" },
]

const TELUGU_OPTIONS = [
    { value: "can_read", label: "Can Read" },
    { value: "can_write", label: "Can Write" },
    { value: "can_understand", label: "Can Understand" },
    { value: "cannot_understand", label: "Cannot Understand" },
]

type TeamMember = {
    idNumber: string
    isLeader: boolean
}

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
    const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
    const [newMemberId, setNewMemberId] = useState("")
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
                return name.trim().length > 0 && idNumber.trim().length > 0
            case 3:
                // Hostlers only need Telugu skill (transport auto-set)
                return isHostler ? teluguSkill !== "" : (transport !== "" && teluguSkill !== "")
            case 4:
                return true // team is optional
            default:
                return false
        }
    }, [step, accommodation, name, idNumber, transport, teluguSkill, isHostler])

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

    // Team member management
    const addTeamMember = useCallback(() => {
        const trimmed = newMemberId.trim().toUpperCase()
        if (!trimmed) return
        if (trimmed === idNumber.trim().toUpperCase()) {
            toast({
                title: "Invalid",
                description: "You cannot add your own ID number as a team member.",
                variant: "destructive",
            })
            return
        }
        if (teamMembers.some((m) => m.idNumber === trimmed)) {
            toast({
                title: "Duplicate",
                description: "This ID number is already in your team.",
                variant: "destructive",
            })
            return
        }
        setTeamMembers((prev) => [
            ...prev,
            { idNumber: trimmed, isLeader: false },
        ])
        setNewMemberId("")
    }, [newMemberId, idNumber, teamMembers, toast])

    const removeTeamMember = useCallback((id: string) => {
        setTeamMembers((prev) => prev.filter((m) => m.idNumber !== id))
    }, [])

    const toggleLeader = useCallback((id: string) => {
        setTeamMembers((prev) =>
            prev.map((m) => ({
                ...m,
                isLeader: m.idNumber === id ? !m.isLeader : false,
            }))
        )
    }, [])

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

    // On mount: check if returning from payment with pending registration
    useEffect(() => {
        if (!mounted) return
        const pendingRaw = sessionStorage.getItem("bootcamp_registration")
        if (!pendingRaw) return

            // We're back from payment — save the registration
            ; (async () => {
                try {
                    const registrationData = JSON.parse(pendingRaw)
                    registrationData.paymentStatus = "paid"
                    const res = await fetch("/api/bootcamp/register", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(registrationData),
                    })
                    const data = await res.json()
                    if (res.ok && data.code === 1) {
                        sessionStorage.removeItem("bootcamp_registration")
                        // Restore form state for success screen
                        setName(registrationData.name || "")
                        setIdNumber(registrationData.idNumber || "")
                        setAccommodation(registrationData.accommodation || "")
                        setTransport(registrationData.transport || "")
                        setTeluguSkill(registrationData.teluguSkill || "")
                        setTeamMembers(registrationData.teamMembers || [])
                        setIsSuccess(true)
                        toast({ title: "Registration Successful! 🎉", description: "Payment received. You're all set for the bootcamp." })
                    } else if (res.status === 409) {
                        // Already registered — clear pending and show success
                        sessionStorage.removeItem("bootcamp_registration")
                        setName(registrationData.name || "")
                        setIdNumber(registrationData.idNumber || "")
                        setAccommodation(registrationData.accommodation || "")
                        setIsSuccess(true)
                        toast({ title: "Already Registered", description: "You're already registered for the bootcamp." })
                    } else {
                        toast({ title: "Registration issue", description: data.message || "Could not save registration. Please contact support.", variant: "destructive" })
                    }
                } catch {
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
                idNumber: idNumber.trim().toUpperCase(),
                accommodation,
                transport: isHostler ? "hostler" : transport,
                teluguSkill,
                teamMembers,
                paymentStatus: isHostler ? "not_required" : "pending",
            }

            if (accommodation === "dayScholar") {
                // Day scholar: initiate payment via backend cart + placeOrder
                const token = getToken()
                if (!token) {
                    // Token missing — redirect to login instead of showing error
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

                toast({ title: "Initiating Payment...", description: "Setting up ₹150 payment for Dinner & Breakfast." })

                // Save to sessionStorage BEFORE payment so it persists across redirect
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
                        coupons: [],
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

                // Step 4: Redirect to payment gateway
                const provider = (orderData?.provider || orderData?.gateway || "").toString().toLowerCase()
                const webLink: string | undefined = orderData?.payment_links?.web || orderData?.payment_link || orderData?.redirect_url || orderData?.raw?.redirect_url
                const sessionId: string | undefined = orderData?.raw?.payment_session_id || orderData?.payment_session_id

                console.log("[Bootcamp] placeOrder response:", { provider, webLink: !!webLink, sessionId: !!sessionId, CASHFREE_ENABLED, orderData })

                // Cashfree-specific handling (matching payment page logic exactly)
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
                            throw new Error("Unable to start Cashfree checkout. Please try again.")
                        }
                    }
                    // Cashfree expected but no redirect — block, don't silently save
                    throw new Error("Payment gateway did not return a redirect. Please try again or contact support.")
                }

                // Generic hosted payment page redirect (other gateways)
                if (webLink && typeof window !== "undefined") {
                    window.location.href = webLink
                    return
                }

                // If we reach here, payment wasn't initiated — throw error, don't save
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
                            {teamMembers.length > 0 && (
                                <p><span className="font-medium">Team:</span> {teamMembers.map((m) => m.idNumber).join(", ")}</p>
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
                                                        setIdNumber(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))
                                                    }
                                                    placeholder="e.g. 2300030001"
                                                    className="h-12 font-mono tracking-wider"
                                                    maxLength={20}
                                                />
                                                <p className="text-xs text-muted-foreground">
                                                    Your university ID number
                                                </p>
                                            </div>
                                        </CardContent>
                                    </>
                                )}

                                {/* Step 3: Transport & Telugu Skill (or just Telugu for hostelers) */}
                                {step === 3 && (
                                    <>
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2">
                                                {isHostler ? (
                                                    <Languages className="h-5 w-5 text-primary" />
                                                ) : (
                                                    <Bus className="h-5 w-5 text-primary" />
                                                )}
                                                {isHostler ? "Telugu Proficiency" : "Transport & Language"}
                                            </CardTitle>
                                            <CardDescription>
                                                {isHostler
                                                    ? "How well can you understand Telugu?"
                                                    : "How are you getting to campus and your Telugu proficiency"}
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
                                                    Telugu Skill
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
                                        </CardContent>
                                    </>
                                )}

                                {/* Step 4: Team */}
                                {step === 4 && (
                                    <>
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2">
                                                <Users className="h-5 w-5 text-primary" />
                                                Team Management
                                            </CardTitle>
                                            <CardDescription>
                                                Add your team members' ID numbers. Only the team leader needs to fill this form for the whole team.
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <Alert className="border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/30">
                                                <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                                <AlertDescription className="text-blue-700 dark:text-blue-400 text-sm">
                                                    Only the team leader needs to add other members here. Members don't need to fill this section separately.
                                                </AlertDescription>
                                            </Alert>

                                            {/* Your card */}
                                            <div className="rounded-lg border bg-muted/30 p-3">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white text-sm font-bold">
                                                            {name.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-medium">{name || "You"}</p>
                                                            <p className="text-xs text-muted-foreground font-mono">{idNumber || "Your ID"}</p>
                                                        </div>
                                                    </div>
                                                    <Badge variant="secondary" className="gap-1">
                                                        <Crown className="h-3 w-3" />
                                                        You
                                                    </Badge>
                                                </div>
                                            </div>

                                            {/* Team members */}
                                            <AnimatePresence>
                                                {teamMembers.map((member) => (
                                                    <motion.div
                                                        key={member.idNumber}
                                                        initial={{ opacity: 0, height: 0 }}
                                                        animate={{ opacity: 1, height: "auto" }}
                                                        exit={{ opacity: 0, height: 0 }}
                                                        transition={{ duration: 0.2 }}
                                                        className="rounded-lg border p-3"
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-2">
                                                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-sm font-bold">
                                                                    {member.idNumber.charAt(0)}
                                                                </div>
                                                                <p className="text-sm font-mono font-medium">{member.idNumber}</p>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <Button
                                                                    variant={member.isLeader ? "default" : "ghost"}
                                                                    size="sm"
                                                                    className="h-8 gap-1 text-xs"
                                                                    onClick={() => toggleLeader(member.idNumber)}
                                                                >
                                                                    <Crown className="h-3 w-3" />
                                                                    {member.isLeader ? "Leader" : "Set Leader"}
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-8 w-8 text-destructive hover:text-destructive"
                                                                    onClick={() => removeTeamMember(member.idNumber)}
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                ))}
                                            </AnimatePresence>

                                            {/* Add member input */}
                                            <div className="flex gap-2">
                                                <Input
                                                    value={newMemberId}
                                                    onChange={(e) =>
                                                        setNewMemberId(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))
                                                    }
                                                    placeholder="Team member's ID number"
                                                    className="flex-1 font-mono"
                                                    maxLength={20}
                                                    onKeyDown={(e) => {
                                                        if (e.key === "Enter") {
                                                            e.preventDefault()
                                                            addTeamMember()
                                                        }
                                                    }}
                                                />
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    onClick={addTeamMember}
                                                    disabled={!newMemberId.trim()}
                                                    className="shrink-0"
                                                >
                                                    <Plus className="h-4 w-4" />
                                                </Button>
                                            </div>
                                            <p className="text-xs text-muted-foreground">
                                                {teamMembers.length === 0
                                                    ? "No team members added yet. This is optional."
                                                    : `${teamMembers.length} team member${teamMembers.length > 1 ? "s" : ""} added`}
                                            </p>
                                        </CardContent>
                                    </>
                                )}

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
