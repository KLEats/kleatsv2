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

  if (!isMounted) return null
  if (totalItems === 0) return null

  return (
    <Link href="/cart">
      <Button
        variant="default"
        size="lg"
        className={`fixed bottom-20 right-4 z-20 h-16 w-auto rounded-full shadow-lg flex items-center gap-2 px-4 ${isAnimating ? "pulse" : ""}`}
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
