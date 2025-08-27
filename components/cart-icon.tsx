"use client"

import { ShoppingBag } from "lucide-react"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useCart } from "@/hooks/use-cart"

export default function CartIcon() {
  const { items, totalPrice, totalItems } = useCart()
  const [isMounted, setIsMounted] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [hasBottomNav, setHasBottomNav] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (totalItems > 0) {
      setIsAnimating(true)
      const timer = setTimeout(() => setIsAnimating(false), 1000)
      return () => clearTimeout(timer)
    }
  }, [totalItems])

  // Detect presence of bottom navigation (on home only)
  useEffect(() => {
    if (typeof window === "undefined") return
    const el = document.querySelector('[data-bottom-nav]')
    setHasBottomNav(!!el)
    const observer = new MutationObserver(() => {
      const exists = !!document.querySelector('[data-bottom-nav]')
      setHasBottomNav(exists)
    })
    observer.observe(document.body, { childList: true, subtree: true })
    return () => observer.disconnect()
  }, [])

  if (!isMounted) return null
  if (totalItems === 0) return null

  return (
    <Link href="/cart">
      <Button
        variant="default"
        size="lg"
        className={`fixed right-4 z-30 h-16 w-auto rounded-full shadow-lg flex items-center gap-2 px-4 ${isAnimating ? "pulse" : ""} bg-primary/60 hover:bg-primary/75 backdrop-blur-md border border-white/20 ${hasBottomNav ? 'bottom-[5.25rem]' : 'bottom-[max(1rem,env(safe-area-inset-bottom))]'}`}
      >
        <ShoppingBag className="h-6 w-6" />
        <div className="flex flex-col items-start">
          <span className="text-xs font-medium">₹{totalPrice}</span>
          <span className="text-xs">View Cart</span>
        </div>
    {totalItems > 0 && (
          <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-white text-xs font-bold text-primary border-2 border-primary">
      {totalItems}
          </span>
        )}
      </Button>
    </Link>
  )
}
