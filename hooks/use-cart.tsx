"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"

export type CartItem = {
  id: number
  name: string
  price: number
  quantity: number
  canteen: string
  image?: string
  packaging?: boolean
  category?: string
}

type CartContextType = {
  items: CartItem[]
  addItem: (item: CartItem) => void
  removeItem: (id: number) => void
  updateQuantity: (id: number, quantity: number) => void
  togglePackaging: (id: number) => void
  clearCart: () => void
  totalItems: number
  totalPrice: number
  canteenName: string | null
  canClearCart: boolean
}

const CartContext = createContext<CartContextType>({
  items: [],
  addItem: () => {},
  removeItem: () => {},
  updateQuantity: () => {},
  togglePackaging: () => {},
  clearCart: () => {},
  totalItems: 0,
  totalPrice: 0,
  canteenName: null,
  canClearCart: false,
})

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [isInitialized, setIsInitialized] = useState(false)

  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const storedCart = localStorage.getItem("cart")
      if (storedCart) {
        setItems(JSON.parse(storedCart))
      }
      setIsInitialized(true)
    } catch (error) {
      console.error("Failed to load cart from localStorage", error)
      setIsInitialized(true)
    }
  }, [])

  // Save cart to localStorage when it changes
  useEffect(() => {
    if (isInitialized) {
      try {
        localStorage.setItem("cart", JSON.stringify(items))
      } catch (error) {
        console.error("Failed to save cart to localStorage", error)
      }
    }
  }, [items, isInitialized])

  // Get the current canteen name (if any items in cart)
  const canteenName = items.length > 0 ? items[0].canteen : null

  const addItem = (item: CartItem) => {
    setItems((prevItems) => {
      // If cart is empty or item is from the same canteen, add it
      if (prevItems.length === 0 || prevItems[0].canteen === item.canteen) {
        const existingItem = prevItems.find((i) => i.id === item.id)
        if (existingItem) {
          return prevItems.map((i) => (i.id === item.id ? { ...i, quantity: i.quantity + item.quantity } : i))
        }
        return [...prevItems, item]
      } else {
        // Item is from a different canteen, show error
        alert("You can only order from one canteen at a time. Please clear your cart first.")
        return prevItems
      }
    })
  }

  const removeItem = (id: number) => {
    setItems((prevItems) => prevItems.filter((item) => item.id !== id))
  }

  const updateQuantity = (id: number, quantity: number) => {
    setItems((prevItems) => prevItems.map((item) => (item.id === id ? { ...item, quantity } : item)))
  }

  const togglePackaging = (id: number) => {
    setItems((prevItems) => {
      const target = prevItems.find((i) => i.id === id)
      const newVal = !target?.packaging
      return prevItems.map((item) => ({ ...item, packaging: newVal }))
    })
  }

  const clearCart = () => {
    setItems([])
  }

  const totalItems = items.reduce((acc, item) => acc + item.quantity, 0)

  const totalPrice = items.reduce((acc, item) => {
    const itemPrice = item.price * item.quantity
  const packagingPrice = item.packaging ? 10 * item.quantity : 0
    return acc + itemPrice + packagingPrice
  }, 0)

  // Determine if we can clear the cart (only if there are items)
  const canClearCart = items.length > 0

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        togglePackaging,
        clearCart,
        totalItems,
        totalPrice,
        canteenName,
        canClearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => useContext(CartContext)
