"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import BottomNavigation from "@/components/bottom-navigation"
import { format } from "date-fns"
import PageHeader from "@/components/page-header"

type AnyOrder = Record<string, any>

export default function OrdersPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<AnyOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    const run = async () => {
      try {
        setLoading(true)
        setError(null)
        const token =
          (typeof window !== "undefined" && (localStorage.getItem("auth_token") || localStorage.getItem("token"))) ||
          null
        if (!token) {
          router.push("/login")
          return
        }
        const base = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "")
        const url = `${base}/api/User/order/getOrders?requestOffset=0`
        const res = await fetch(url, {
          method: "GET",
          headers: {
            // Backend expects raw token (no Bearer prefix)
            Authorization: token,
          },
          cache: "no-store",
        })
        const text = await res.text()
        if (!res.ok) {
          throw new Error(text || `HTTP ${res.status}`)
        }
        let data: any
        try {
          data = JSON.parse(text)
        } catch {
          throw new Error("Invalid JSON response")
        }
        // Support multiple shapes: [..], { data: [...] }, { data: { items: [...] } }, { items: [...] }, { orders: [...] }
        let list: AnyOrder[] = []
        if (Array.isArray(data)) {
          list = data
        } else if (Array.isArray(data?.data)) {
          list = data.data
        } else if (Array.isArray(data?.data?.items)) {
          list = data.data.items
        } else if (Array.isArray(data?.items)) {
          list = data.items
        } else if (Array.isArray(data?.orders)) {
          list = data.orders
        }
        if (active) setOrders(list)
      } catch (e: any) {
        console.error("Failed to load orders", e)
        if (active) setError(e?.message || "Failed to load orders")
      } finally {
        if (active) setLoading(false)
      }
    }
    run()
    return () => {
      active = false
    }
  }, [router])

  // Auto-update bootcamp registration payment status if returning from Cashfree payment
  useEffect(() => {
    if (loading || orders.length === 0) return
    const pendingRaw = sessionStorage.getItem("bootcamp_registration")
    const paymentInitiated = sessionStorage.getItem("bootcamp_payment_initiated")
    if (!pendingRaw || !paymentInitiated) return

    const storedOrderId = sessionStorage.getItem("bootcamp_order_id") || ""

      ; (async () => {
        try {
          const registrationData = JSON.parse(pendingRaw)

          // Check if any order is paid (match by stored ID or recent timestamp)
          const paidStatuses = ["paid", "completed", "success", "delivered", "preparing", "ready", "active"]
          const isPaid = orders.some((o: any) => {
            const oid = String(o.id ?? o.orderId ?? o.OrderId ?? o._id ?? o.pid ?? "")
            const status = String(o.status ?? o.orderStatus ?? o.OrderStatus ?? o.paymentStatus ?? "").toLowerCase()
            if (storedOrderId && oid === storedOrderId) {
              return paidStatuses.some(s => status.includes(s))
            }
            return false
          })

          const recentPaid = !isPaid && orders.some((o: any) => {
            const status = String(o.status ?? o.orderStatus ?? o.OrderStatus ?? o.paymentStatus ?? "").toLowerCase()
            const statusOk = paidStatuses.some(s => status.includes(s))
            if (!statusOk) return false
            const createdAt = o.createdAt ?? o.orderDate ?? o.OrderDate ?? o.orderTime ?? ""
            if (!createdAt) return false
            try {
              return new Date(createdAt).getTime() > Date.now() - 10 * 60 * 1000
            } catch { return false }
          })

          if (isPaid || recentPaid) {
            // Payment verified — update registration to "paid"
            await fetch("/api/bootcamp/register", {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ idNumber: registrationData.idNumber, paymentStatus: "paid" }),
            })
          }

          // Clean up sessionStorage regardless (user is now on orders page)
          sessionStorage.removeItem("bootcamp_registration")
          sessionStorage.removeItem("bootcamp_payment_initiated")
          sessionStorage.removeItem("bootcamp_order_id")
        } catch {
          // Silent cleanup on error
          sessionStorage.removeItem("bootcamp_registration")
          sessionStorage.removeItem("bootcamp_payment_initiated")
          sessionStorage.removeItem("bootcamp_order_id")
        }
      })()
  }, [loading, orders])

  const normalized = useMemo(() => orders.map(normalizeOrder), [orders])

  return (
    <div className="min-h-screen pb-16 page-transition">
      <PageHeader title="My Orders" />

      <div className="container px-4 py-6">
        {loading ? (
          <div className="text-center text-muted-foreground">Loading orders…</div>
        ) : error ? (
          <div className="rounded-md border p-4 text-sm text-red-600">{error}</div>
        ) : normalized.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">No orders yet</CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {normalized.map((o) => (
              <Card key={o.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Order #{o.id}</CardTitle>
                    {o.status && (
                      <Badge variant={o.status === "Completed" ? "default" : o.status === "Cancelled" ? "destructive" : "secondary"}>
                        {o.status}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {o.date ? `${format(new Date(o.date), "MMM d, yyyy 'at' h:mm a")}` : ""}
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">{o.canteenName || "Canteen"}</p>
                      {typeof o.total === "number" && <p className="text-sm font-medium">₹{o.total}</p>}
                    </div>
                    {o.itemsLabel && (
                      <p className="text-sm text-muted-foreground truncate" title={o.itemsLabel}>
                        {o.itemsLabel}
                      </p>
                    )}
                    <div className="pt-2 flex justify-end gap-2">
                      {o.canteenId && (
                        <Link href={`/canteen/${encodeURIComponent(String(o.canteenId))}`}>
                          <Button size="sm" variant="outline">Explore Canteen</Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <BottomNavigation />
    </div>
  )
}

function normalizeOrder(src: AnyOrder) {
  const id = src.id ?? src.orderId ?? src.OrderId ?? src._id ?? src.pid ?? "-"
  const canteenId =
    src.canteenId ?? src.CanteenId ?? src.canteen_id ?? src.canteen?.id ?? src.canteen?.canteenId ?? null
  const canteenName = src.canteenName ?? src.CanteenName ?? src.canteen?.name ?? src.canteen?.CanteenName ?? ""
  const date = src.createdAt ?? src.orderDate ?? src.OrderDate ?? src.orderTime ?? null
  let total = src.totalAmount ?? src.total ?? src.TotalAmount ?? null
  const status = src.status ?? src.orderStatus ?? src.OrderStatus ?? null

  const rawItems = src.items ?? src.orderItems ?? src.Items ?? []
  // Compute a total if missing
  if (total == null && Array.isArray(rawItems)) {
    try {
      const itemsTotal = rawItems.reduce((sum: number, it: any) => {
        const price = Number(it.Price ?? it.price ?? it.amount ?? 0)
        const qty = Number(it.Quantity ?? it.quantity ?? it.qty ?? 1)
        return sum + price * qty
      }, 0)
      const extras = Number(src.parcelPrice ?? src.deliveryFee ?? 0)
      total = Math.max(0, Math.round((itemsTotal + extras) * 100) / 100)
    } catch { }
  }
  const itemsLabel = Array.isArray(rawItems)
    ? rawItems
      .map((it: any) => {
        const name = it.name ?? it.itemName ?? it.ItemName ?? it.foodName ?? it.title ?? "Item"
        const qty = it.quantity ?? it.qty ?? it.Quantity ?? 1
        return `${name} (x${qty})`
      })
      .join(", ")
    : typeof rawItems === "string"
      ? rawItems
      : ""

  return { id, canteenId, canteenName, date, total, status, itemsLabel }
}
