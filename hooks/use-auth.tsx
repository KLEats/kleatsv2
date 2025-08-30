"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"

export type UserRole = "customer" | "canteen_owner" | "admin" | "canteen_worker"

export type User = {
  id: string
  name: string
  email: string
  studentId?: string
  role: UserRole
  canteenId?: string
}

type AuthContextType = {
  user: User | null
  login: (email: string, password: string) => Promise<boolean>
  signup: (name: string, email: string, studentId: string, password: string, role?: UserRole) => Promise<boolean>
  logout: () => void
  updateUser: (userData: Partial<User>) => void
  isAuthenticated: boolean
  isCanteenOwner: boolean
  isAdmin: boolean
  isCanteenWorker: boolean
  isInitialized: boolean
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  login: async () => false,
  signup: async () => false,
  logout: () => {},
  updateUser: () => {},
  isAuthenticated: false,
  isCanteenOwner: false,
  isAdmin: false,
  isCanteenWorker: false,
  isInitialized: false,
})

// Mock users for demo
const mockUsers = [
  {
    id: "user_1",
    name: "Raunit",
    email: "student@kl.edu",
    studentId: "2300033572",
    role: "customer" as UserRole,
  },
  {
    id: "user_2",
    name: "KL Adda Owner",
    email: "kl-adda@owner.com",
    role: "canteen_owner" as UserRole,
    canteenId: "kl-adda",
  },
  {
    id: "user_3",
    name: "Satish Owner",
    email: "satish@owner.com",
    role: "canteen_owner" as UserRole,
    canteenId: "satish",
  },
  // New canteen worker account
  {
    id: "worker_1",
    name: "Adda Worker",
    email: "adda@gmail.com",
    role: "canteen_worker" as UserRole,
    canteenId: "kl-adda",
  },
  // New admin account
  {
    id: "admin_1",
    name: "System Administrator",
    email: "admin@gmail.com",
    role: "admin" as UserRole,
  },
]

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  // Track last user id we hydrated for to avoid duplicate fetches
  const [hydratedForUserId, setHydratedForUserId] = useState<string | null>(null)

  // Secure ID generator for demo users (avoids Math.random warnings)
  const generateUserId = () => {
    try {
      // Prefer native UUID when available
      if (typeof crypto !== "undefined" && typeof (crypto as any).randomUUID === "function") {
        return `user_${(crypto as any).randomUUID()}`
      }
      // Fallback to getRandomValues
      if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
        const bytes = new Uint8Array(16)
        crypto.getRandomValues(bytes)
        const hex = Array.from(bytes)
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("")
        return `user_${hex}`
      }
    } catch {}
    // Last resort (non-crypto). Should rarely happen in modern browsers.
    return `user_${Date.now()}_${Math.floor(Math.random() * 1e9)}`
  }

  // Load user from localStorage on mount
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("user")
      if (storedUser) {
        setUser(JSON.parse(storedUser))
      }
      setIsInitialized(true)
    } catch (error) {
      console.error("Failed to load user from localStorage", error)
      setIsInitialized(true)
    }
  }, [])

  // Save user to localStorage when it changes
  useEffect(() => {
    if (isInitialized) {
      try {
        if (user) {
          localStorage.setItem("user", JSON.stringify(user))
        } else {
          localStorage.removeItem("user")
        }
      } catch (error) {
        console.error("Failed to save user to localStorage", error)
      }
    }
  }, [user, isInitialized])

  // Helper to get API base URL and auth token
  const getApiBase = () => (process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "")
  const getToken = () => {
    try {
      if (typeof window === "undefined") return null
      return localStorage.getItem("auth_token") || localStorage.getItem("token")
    } catch {
      return null
    }
  }

  // Hydrate cart from backend once after user logs in (or on refresh with existing user)
  const hydrateCartFromBackend = async () => {
    try {
      const token = getToken()
      const base = getApiBase()
      if (!token || !base) return
      const res = await fetch(`${base}/api/user/cart/getCartItems`, {
        method: "GET",
        headers: { Authorization: token },
        cache: "no-store",
      })
      if (!res.ok) return
      const data = await res.json()
      const payload = data?.data
      if (!payload) return
      const canteenName: string = payload.CanteenName || payload.canteenName || ""
      const itemsArr: any[] = Array.isArray(payload.cart) ? payload.cart : []
      const baseUrl = getApiBase()
      const mapped = itemsArr.map((it) => {
        const img = it.ImagePath
          ? `${baseUrl}${String(it.ImagePath).startsWith("/") ? it.ImagePath : `/${it.ImagePath}`}`
          : "/placeholder.svg"
        const qty = Number(it.quantity ?? 1) || 1
        return {
          id: Number(it.ItemId),
          name: String(it.ItemName),
          price: Number(it.Price) || 0,
          quantity: qty,
          canteen: canteenName,
          image: img,
          category: String(it.category || ""),
        }
      })
      // Broadcast to CartProvider to replace in-memory items immediately
      try {
        window.dispatchEvent(
          new CustomEvent("kleats:cart:set", { detail: { items: mapped } })
        )
      } catch {}
    } catch {}
  }

  // Run hydration when user changes to a new logged-in user
  useEffect(() => {
    if (!user || !isInitialized) return
    if (hydratedForUserId === user.id) return
    setHydratedForUserId(user.id)
    ;(async () => {
      try {
        await hydrateCartFromBackend()
      } catch {}
    })()
  }, [user, isInitialized])

  const login = async (email: string, password: string) => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Check for special worker login
    if (email === "adda@gmail.com" && password === "adda") {
      const workerUser = mockUsers.find((u) => u.email === "adda@gmail.com")
      if (workerUser) {
        setUser(workerUser)
        // Fire and forget cart hydration
        try { hydrateCartFromBackend() } catch {}
        return true
      }
    }

    // Check for admin login
    if (email === "admin@gmail.com" && password === "admin") {
      const adminUser = mockUsers.find((u) => u.email === "admin@gmail.com")
      if (adminUser) {
        setUser(adminUser)
        try { hydrateCartFromBackend() } catch {}
        return true
      }
    }

    // Check if email matches any mock user
    const foundUser = mockUsers.find((u) => u.email.toLowerCase() === email.toLowerCase())

    if (foundUser) {
  setUser(foundUser)
  try { hydrateCartFromBackend() } catch {}
  return true
    }

    // For demo purposes, create a new customer user if not found
    const newUser = {
      id: generateUserId(),
      name: email.split("@")[0],
      email,
      studentId: "2300000000",
      role: "customer" as UserRole,
    }

  setUser(newUser)
  try { hydrateCartFromBackend() } catch {}
    return true
  }

  const signup = async (
    name: string,
    email: string,
    studentId: string,
    password: string,
    role: UserRole = "customer",
  ) => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // For demo purposes, always succeed
    const newUser = {
      id: generateUserId(),
      name,
      email,
      studentId,
      role,
    }

  setUser(newUser)
  try { hydrateCartFromBackend() } catch {}
    return true
  }

  const logout = () => {
    // Best-effort notify backend, then clear local state/storage
    try {
      const token =
        (typeof window !== "undefined" && (localStorage.getItem("auth_token") || localStorage.getItem("token"))) ||
        undefined

      if (token && process.env.NEXT_PUBLIC_API_URL) {
        const url = `${process.env.NEXT_PUBLIC_API_URL}/api/user/auth/logout`
        // Backend expects raw token in Authorization (no Bearer)
        fetch(url, {
          method: "GET",
          headers: { Authorization: token },
        }).catch(() => {
          // Ignore network errors on logout
        })
      }
    } catch (e) {
      // Ignore errors
    } finally {
      try {
        if (typeof window !== "undefined") {
          localStorage.removeItem("auth_token")
          localStorage.removeItem("token")
          localStorage.removeItem("user")
          // Also clear cart and related client-only scheduling state on logout
          localStorage.removeItem("cart")
          localStorage.removeItem("kleats_schedule_mode")
          localStorage.removeItem("kleats_schedule_slot")
          localStorage.removeItem("kleats_schedule_mins")
          // Broadcast a logout event so other providers can reset state
          try { window.dispatchEvent(new CustomEvent("kleats:logout")) } catch {}
        }
      } catch (e) {
        // Ignore storage errors
      }
      setUser(null)
    }
  }

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...userData })
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        signup,
        logout,
        updateUser,
        isAuthenticated: !!user,
  // In this app, we do not perform role-based redirects for owners/admins/workers.
  // Keep flags false to avoid accidental UI redirects; dedicated portals handle those roles.
  isCanteenOwner: false,
  isAdmin: false,
  isCanteenWorker: false,
  isInitialized,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
