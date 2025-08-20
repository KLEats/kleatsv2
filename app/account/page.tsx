"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useTheme } from "next-themes"
import BottomNavigation from "@/components/bottom-navigation"
import { ArrowLeft, History, Moon, Sun, User, LogOut, Edit, Star, Package } from "lucide-react"
import Link from "next/link"
import { useOrders } from "@/hooks/use-orders"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { useAuth } from "@/hooks/use-auth"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useSubscription } from "@/hooks/use-subscription"
import PageHeader from "@/components/page-header"

export default function AccountPage() {
  const { theme, setTheme } = useTheme()
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { orders } = useOrders()
  const { user, logout, updateUser } = useAuth()
  const { currentSubscription, plans, isSubscribed } = useSubscription()
  const router = useRouter()
  const [backendProfile, setBackendProfile] = useState<
    | null
    | {
        userId: number
        googleId: string
        phoneNo: number
        role: string
        DayOrHos: string
        name: string
        email: string
      }
  >(null)
  const fetchedRef = useRef(false)
  const [isSaving, setIsSaving] = useState(false)

  // Edit profile state
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false)
  const [editName, setEditName] = useState("")
  const [editEmail, setEditEmail] = useState("")
  const [editStudentId, setEditStudentId] = useState("")
  const [editPhoneNo, setEditPhoneNo] = useState("")
  const [editRole, setEditRole] = useState<"student" | "staff">("student")
  // Backend expects DayOrHos to be either "hostel" or "DayScoller"
  const [editDayOrHos, setEditDayOrHos] = useState<"hostel" | "DayScoller">("hostel")

  // Wait until mounted to avoid hydration mismatch
  useEffect(() => {
    setMounted(true)
    setIsDarkMode(theme === "dark")
  }, [theme])

  // Redirect if not authenticated
  useEffect(() => {
    if (!user && mounted) {
      router.push("/login")
    }
  }, [user, router, mounted])

  // Fetch backend user data once
  useEffect(() => {
    if (!mounted || fetchedRef.current) return
    fetchedRef.current = true
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null
      if (!token) return
      const run = async () => {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/User/auth/get-user-data`, {
          method: "GET",
          headers: { Authorization: token },
        })
        if (!res.ok) return
        const data = await res.json()
        if (data?.data) setBackendProfile(data.data)
      }
      void run()
    } catch {}
  }, [mounted])

  // Set initial values for edit form (prefer backend values when available)
  useEffect(() => {
    if (user) {
      setEditName(backendProfile?.name || user.name)
      setEditEmail(backendProfile?.email || user.email)
      setEditStudentId(user.studentId || "")
      setEditPhoneNo(backendProfile?.phoneNo ? String(backendProfile.phoneNo) : "")
      setEditRole((backendProfile?.role as any) === "staff" ? "staff" : "student")
      setEditDayOrHos((backendProfile?.DayOrHos as any) === "DayScoller" ? "DayScoller" : "hostel")
    }
  }, [user, backendProfile])

  const handleThemeToggle = () => {
    const newTheme = isDarkMode ? "light" : "dark"
    setIsDarkMode(!isDarkMode)
    setTheme(newTheme)
  }

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  const handleSaveProfile = async () => {
    if (!user) return
    try {
      setIsSaving(true)
      const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null
      if (!token) return
      const payload: any = {
        name: editName,
        email: editEmail,
        phoneNo: editPhoneNo ? Number(editPhoneNo) : undefined,
        role: editRole,
        DayOrHos: editDayOrHos,
        studentId: editStudentId || undefined,
      }
      // prune undefined
      Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k])

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/User/auth/edit-user-data`, {
        method: "PUT",
        headers: {
          Authorization: token,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })
      const text = await res.text()
      if (!res.ok) {
        console.error("Edit failed", res.status, text)
        throw new Error(text || `Edit failed (${res.status})`)
      }
      try {
        const json = JSON.parse(text)
        if (json?.data) setBackendProfile(json.data)
      } catch {}
      setIsEditProfileOpen(false)
    } catch (e) {
      console.error("Edit error:", e)
    } finally {
      setIsSaving(false)
    }
  }

  // Sort orders by date (newest first)
  const sortedOrders = [...orders].sort((a, b) => {
    return new Date(b.orderTime).getTime() - new Date(a.orderTime).getTime()
  })

  // Get current subscription plan details
  const currentPlan = currentSubscription ? plans.find((plan) => plan.id === currentSubscription.planId) : null

  if (!mounted || !user) {
    return null
  }

  return (
    <div className="min-h-screen pb-16 page-transition">
      <PageHeader title="My Account" />

      <div className="container px-4 py-6">
        <Card className="mb-6">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-xl font-bold text-white">
              {user.name.charAt(0)}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">{backendProfile?.name || user.name}</h2>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsEditProfileOpen(true)}>
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">ID: {user.studentId}</p>
              {backendProfile && (
                <div className="mt-1 space-y-0.5 text-sm text-muted-foreground">
                  <p>Phone: {backendProfile.phoneNo}</p>
                  <p>
                    Role: {backendProfile.role} · {backendProfile.DayOrHos}
                  </p>
                </div>
              )}
              {isSubscribed && currentPlan && (
                <Badge className="mt-2" variant="secondary">
                  {currentPlan.name} Subscriber
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="profile" className="mb-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile">
              <User className="mr-2 h-4 w-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="subscription">
              <Star className="mr-2 h-4 w-4" />
              Subscription
            </TabsTrigger>
            <TabsTrigger value="history">
              <History className="mr-2 h-4 w-4" />
              History
            </TabsTrigger>
          </TabsList>
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Profile Settings</CardTitle>
                <CardDescription>Manage your account settings and preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <Label htmlFor="personal-info">Personal Information</Label>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setIsEditProfileOpen(true)}>
                    Edit
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {isDarkMode ? (
                      <Moon className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Sun className="h-4 w-4 text-muted-foreground" />
                    )}
                    <Label htmlFor="dark-mode">Dark Mode</Label>
                  </div>
                  <Switch id="dark-mode" checked={isDarkMode} onCheckedChange={handleThemeToggle} />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <LogOut className="h-4 w-4 text-muted-foreground" />
                    <Label>Logout</Label>
                  </div>
                  <Button variant="ghost" size="sm" onClick={handleLogout}>
                    Logout
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="subscription">
            <Card>
              <CardHeader>
                <CardTitle>Subscription Plans</CardTitle>
                <CardDescription>
                  {isSubscribed ? "Manage your current subscription" : "Subscribe to get exclusive benefits"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isSubscribed && currentPlan ? (
                  <div className="rounded-md border p-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">{currentPlan.name}</h3>
                      <Badge>Active</Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{currentPlan.description}</p>
                    <div className="mt-2">
                      <p className="text-sm font-medium">Benefits:</p>
                      <ul className="mt-1 list-inside list-disc text-sm text-muted-foreground">
                        {currentPlan.features.map((feature, index) => (
                          <li key={index}>{feature}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="mt-4 flex justify-between">
                      <p className="text-sm">
                        <span className="font-medium">₹{currentPlan.price}</span>
                        <span className="text-muted-foreground"> / {currentPlan.duration}</span>
                      </p>
                      <Button variant="outline" size="sm">
                        Cancel Subscription
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {plans.map((plan) => (
                      <div key={plan.id} className="rounded-md border p-4">
                        <h3 className="font-medium">{plan.name}</h3>
                        <p className="text-sm text-muted-foreground">{plan.description}</p>
                        <div className="mt-2">
                          <p className="text-sm font-medium">Benefits:</p>
                          <ul className="mt-1 list-inside list-disc text-sm text-muted-foreground">
                            {plan.features.map((feature, index) => (
                              <li key={index}>{feature}</li>
                            ))}
                          </ul>
                        </div>
                        <div className="mt-4 flex justify-between items-center">
                          <p className="text-sm">
                            <span className="font-medium">₹{plan.price}</span>
                            <span className="text-muted-foreground"> / {plan.duration}</span>
                          </p>
                          <Link href={`/subscription/${plan.id}`}>
                            <Button size="sm">Subscribe</Button>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Order History</CardTitle>
                <CardDescription>View your past orders and transactions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {sortedOrders.length > 0 ? (
                  <div className="space-y-4">
                    {sortedOrders.map((order) => (
                      <div key={order.id} className="rounded-md border p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Order #{order.id}</p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(order.orderTime), "MMM d, yyyy 'at' h:mm a")}
                            </p>
                          </div>
                          <Badge
                            variant={
                              order.status === "Completed"
                                ? "default"
                                : order.status === "Cancelled"
                                  ? "destructive"
                                  : "secondary"
                            }
                          >
                            {order.status}
                          </Badge>
                        </div>
                        <div className="mt-2">
                          <p className="text-sm">{order.canteen}</p>
                          <p className="text-sm text-muted-foreground">
                            {order.items.map((item) => `${item.name} (x${item.quantity})`).join(", ")}
                          </p>
                        </div>
                        <div className="mt-2 flex items-center justify-between">
                          <p className="text-sm font-medium">₹{order.totalAmount}</p>
                          <p className="text-xs text-muted-foreground">Paid via {order.paymentMethod}</p>
                        </div>
                        <div className="mt-3 flex justify-end">
                          <Link href={`/order/${order.id}`}>
                            <Button variant="ghost" size="sm">
                              View Details
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-md border p-4 text-center">
                    <p className="text-sm text-muted-foreground">No order history yet.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={isEditProfileOpen} onOpenChange={setIsEditProfileOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Your name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                placeholder="Your email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-phone">Phone Number</Label>
              <Input
                id="edit-phone"
                inputMode="numeric"
                value={editPhoneNo}
                onChange={(e) => setEditPhoneNo(e.target.value.replace(/[^\d]/g, "").slice(0, 10))}
                placeholder="10-digit phone number"
              />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <RadioGroup value={editRole} onValueChange={(v) => setEditRole(v as "student" | "staff")} className="flex gap-4">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="student" id="role-student" />
                  <Label htmlFor="role-student">Student</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="staff" id="role-staff" />
                  <Label htmlFor="role-staff">Staff</Label>
                </div>
              </RadioGroup>
            </div>
            <div className="space-y-2">
              <Label>Day Scholar or Hosteller</Label>
              <RadioGroup value={editDayOrHos} onValueChange={(v) => setEditDayOrHos(v as any)} className="flex gap-4">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="DayScoller" id="day-scholar" />
                  <Label htmlFor="day-scholar">Day Scholar</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="hostel" id="hosteller" />
                  <Label htmlFor="hosteller">Hosteller</Label>
                </div>
              </RadioGroup>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-student-id">Student ID</Label>
              <Input
                id="edit-student-id"
                value={editStudentId}
                onChange={(e) => setEditStudentId(e.target.value)}
                placeholder="Your student ID"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditProfileOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveProfile} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BottomNavigation />
    </div>
  )
}
