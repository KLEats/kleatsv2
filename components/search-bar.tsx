"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Search, X, Clock, TrendingUp } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"
// Backend-powered search; no local service needed
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import { isOpenNow } from "@/lib/utils"

interface SearchBarProps {
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  showSuggestions?: boolean
  onSearch?: (query: string) => void
}

export default function SearchBar({
  value = "",
  onChange,
  placeholder = "Search for food items...",
  showSuggestions = true,
  onSearch,
}: SearchBarProps) {
  const [query, setQuery] = useState(value)
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const searchRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const baseUrl = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "")

  // Cache canteenId -> canteenName to avoid repeated detail fetches
  const [canteenNameCache, setCanteenNameCache] = useState<Record<number, string>>(() => {
    try {
      if (typeof window !== "undefined") {
        const s = sessionStorage.getItem("canteenNameCache")
        return s ? JSON.parse(s) : {}
      }
    } catch {}
    return {}
  })
  useEffect(() => {
    try {
      if (typeof window !== "undefined") sessionStorage.setItem("canteenNameCache", JSON.stringify(canteenNameCache))
    } catch {}
  }, [canteenNameCache])

  // Popular search terms
  const popularSearches = ["Dosa", "Coffee", "Chicken Rice", "Idli", "Noodles", "Samosa", "Ice Cream", "Juice"]

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("recentSearches")
    if (saved) {
      setRecentSearches(JSON.parse(saved))
    }
  }, [])

  // Handle input changes with debouncing
  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      if (query.trim() && showSuggestions) {
        setIsLoading(true)
        try {
          const url = `${baseUrl}/api/explore/search/items?q=${encodeURIComponent(query)}&offset=0&limit=50`
          const res = await fetch(url, { cache: "no-store" })
          if (!res.ok) throw new Error(`Search HTTP ${res.status}`)
          const json = await res.json()
          const raw = (Array.isArray(json?.data) ? json.data : []) as any[]
          // Exclude items with ava === false; include those outside time windows
          let mapped = raw.filter((it) => it?.ava !== false).map((it: any) => ({
            id: it.ItemId,
            name: it.ItemName,
            price: it.Price,
            image: it.ImagePath ? `${baseUrl}${it.ImagePath.startsWith("/") ? it.ImagePath : `/${it.ImagePath}`}` : "/placeholder.svg",
            description: it.Description,
            canteenId: it.canteenId,
            canteenName: `Canteen ${it.canteenId}`,
            startTime: it.startTime || null,
            endTime: it.endTime || null,
          }))
          // Resolve real canteen names
          const neededIds: number[] = Array.from(
            new Set(
              mapped
                .map((m: any) => Number(m.canteenId))
                .filter((n: number) => Number.isFinite(n))
            )
          )
          const toFetch = neededIds.filter((id) => !canteenNameCache[id])
          if (toFetch.length > 0) {
            const entries: Array<[number, string]> = []
            await Promise.all(
              toFetch.map(async (id) => {
                try {
                  const d = await fetch(`${baseUrl}/api/explore/canteen/details/${id}`, { cache: "no-store" })
                  const j = await d.json().catch(() => ({} as any))
                  const name = j?.data?.CanteenName || `Canteen ${id}`
                  entries.push([id, name])
                } catch {
                  entries.push([id, `Canteen ${id}`])
                }
              })
            )
            const merged: Record<number, string> = { ...canteenNameCache }
            for (const [id, name] of entries) merged[id] = name
            setCanteenNameCache(merged)
            mapped = mapped.map((m: any) => {
              const cid = Number(m.canteenId)
              return { ...m, canteenName: Number.isFinite(cid) ? (merged[cid] || m.canteenName) : m.canteenName }
            })
          } else {
            mapped = mapped.map((m: any) => {
              const cid = Number(m.canteenId)
              return { ...m, canteenName: Number.isFinite(cid) ? (canteenNameCache[cid] || m.canteenName) : m.canteenName }
            })
          }
          setSuggestions(mapped.slice(0, 6))
        } catch (error) {
          console.error("Search error:", error)
          setSuggestions([])
        } finally {
          setIsLoading(false)
        }
      } else {
        setSuggestions([])
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [query, showSuggestions])

  // Handle clicks outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setQuery(newValue)
    onChange?.(newValue)
    setIsOpen(true)
  }

  const handleSearch = (searchQuery: string = query) => {
    if (!searchQuery.trim()) return

    // Save to recent searches
    const updatedRecent = [searchQuery, ...recentSearches.filter((s) => s !== searchQuery)].slice(0, 5)
    setRecentSearches(updatedRecent)
    localStorage.setItem("recentSearches", JSON.stringify(updatedRecent))

    // Close suggestions
    setIsOpen(false)

    // Call onSearch callback or navigate to search page
    if (onSearch) {
      onSearch(searchQuery)
    } else {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`)
    }
  }

  // Backend cart helpers
  const getToken = () =>
    (typeof window !== "undefined" && (localStorage.getItem("auth_token") || localStorage.getItem("token"))) || null

  const addBackendToCart = async (itemId: number, quantity = 1) => {
    const token = getToken()
    if (!token) throw new Error("Not authenticated")
    const url = `${baseUrl}/api/user/cart/addToCart?id=${encodeURIComponent(String(itemId))}&quantity=${encodeURIComponent(String(quantity))}`
    const res = await fetch(url, { method: "GET", headers: { Authorization: token }, cache: "no-store" })
    if (!res.ok) throw new Error(await res.text())
  }

  const clearBackendCart = async () => {
    const token = getToken()
    if (!token) return
    await fetch(`${baseUrl}/api/user/cart/clearCart`, { method: "DELETE", headers: { Authorization: token } })
  }

  const getBackendCartMeta = async (): Promise<{ hasItems: boolean; canteenId?: number } | null> => {
    const token = getToken()
    if (!token) return null
    try {
      const res = await fetch(`${baseUrl}/api/user/cart/getCartItems`, { method: "GET", headers: { Authorization: token }, cache: "no-store" })
      if (!res.ok) return null
      const data = await res.json().catch(() => ({}))
      const arr: any[] = Array.isArray(data?.data?.cart) ? data.data.cart : []
      const cid = Number(data?.data?.canteenId)
      const hasItems = arr.length > 0
      return { hasItems, canteenId: Number.isNaN(cid) ? undefined : cid }
    } catch {
      return null
    }
  }

  const handleAddClick = async (e: React.MouseEvent, item: any) => {
    e.stopPropagation()
    const { id: itemId, canteenId } = item
    if (!itemId || !canteenId) return
    const token = getToken()
    if (!token) {
      try {
        sessionStorage.setItem("pendingAddToCart", JSON.stringify({ itemId, canteenId }))
        const rt = typeof window !== "undefined" ? window.location.pathname + window.location.search : "/"
        // Prefer staying on page; login returns here and Home page will handle continuation
        window.location.href = `/login?returnTo=${encodeURIComponent(rt)}`
      } catch {
        window.location.href = "/login"
      }
      return
    }
    try {
      // Enforce single-canteen rule when already logged in
      const meta = await getBackendCartMeta()
      const targetCidNum = Number(canteenId)
      const cartCidNum = Number(meta?.canteenId)
      if (meta?.hasItems && !Number.isNaN(cartCidNum) && !Number.isNaN(targetCidNum) && cartCidNum !== targetCidNum) {
        const proceed = window.confirm("Your cart has items from another canteen. Clear cart and add this item?")
        if (!proceed) return
        try { await clearBackendCart() } catch {}
      }
      await addBackendToCart(itemId, 1)
      try { if (typeof window !== 'undefined') localStorage.setItem('last_canteen_id', String(canteenId)) } catch {}
      // Navigate to the canteen page
      window.location.href = `/canteen/${canteenId}`
    } catch (err) {
      console.error("Add from search failed", err)
      try {
        sessionStorage.setItem("pendingAddToCart", JSON.stringify({ itemId, canteenId }))
      } catch {}
      window.location.href = "/login"
    }
  }

  const handleRecentSearchClick = (search: string) => {
    setQuery(search)
    onChange?.(search)
    handleSearch(search)
  }

  const clearRecentSearches = () => {
    setRecentSearches([])
    localStorage.removeItem("recentSearches")
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch()
    } else if (e.key === "Escape") {
      setIsOpen(false)
    }
  }

  return (
    <div ref={searchRef} className="relative w-full">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsOpen(true)}
          className="pl-9 pr-10"
        />
        {query && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 h-6 w-6 -translate-y-1/2 p-0"
            onClick={() => {
              setQuery("")
              onChange?.("")
              inputRef.current?.focus()
            }}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      <AnimatePresence>
        {isOpen && showSuggestions && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full z-50 mt-1 w-full"
          >
            <Card className="shadow-lg">
              <CardContent className="p-0">
                {/* Search Results */}
                {suggestions.length > 0 && (
                  <div className="border-b">
                    <div className="p-3">
                      <h4 className="text-sm font-medium text-muted-foreground mb-2">Search Results</h4>
                      <div className="space-y-2">
                        {suggestions.map((item: any) => {
                          const st = item.startTime ? String(item.startTime).slice(0, 5) : undefined
                          const et = item.endTime ? String(item.endTime).slice(0, 5) : undefined
                          const open = isOpenNow(st, et)
                          const outside = open === false
                          return (
                          <motion.div
                            key={item.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex items-center justify-between p-2 rounded-md hover:bg-muted"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{item.name}</p>
                              <div className="flex items-center gap-2 text-xs">
                                <span className="text-muted-foreground truncate">{item.canteenName}</span>
                                <Badge variant="outline" className="text-xs">₹{item.price}</Badge>
                                {outside && (
                                  <Badge variant="outline" className="text-[10px] px-2 py-0.5">Pre-Order</Badge>
                                )}
                              </div>
                            </div>
                            <Button size="sm" className="rounded-full" onClick={(e) => handleAddClick(e, item)}>
                              Add
                            </Button>
                          </motion.div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* Loading State */}
                {isLoading && (
                  <div className="p-3 border-b">
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                      <span className="text-sm text-muted-foreground">Searching...</span>
                    </div>
                  </div>
                )}

                {/* Recent Searches */}
                {recentSearches.length > 0 && !query && (
                  <div className="border-b">
                    <div className="p-3">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-medium text-muted-foreground flex items-center">
                          <Clock className="mr-1 h-3 w-3" />
                          Recent Searches
                        </h4>
                        <Button variant="ghost" size="sm" className="text-xs h-auto p-1" onClick={clearRecentSearches}>
                          Clear
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {recentSearches.map((search, index) => (
                          <Badge
                            key={index}
                            variant="secondary"
                            className="cursor-pointer hover:bg-secondary/80"
                            onClick={() => handleRecentSearchClick(search)}
                          >
                            {search}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Popular Searches */}
                {!query && (
                  <div className="p-3">
                    <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center">
                      <TrendingUp className="mr-1 h-3 w-3" />
                      Popular Searches
                    </h4>
                    <div className="flex flex-wrap gap-1">
                      {popularSearches.map((search, index) => (
                        <Badge
                          key={index}
                          variant="outline"
                          className="cursor-pointer hover:bg-muted"
                          onClick={() => handleRecentSearchClick(search)}
                        >
                          {search}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* No Results */}
                {query && !isLoading && suggestions.length === 0 && (
                  <div className="p-3 text-center">
                    <p className="text-sm text-muted-foreground">No results found for "{query}"</p>
                    <p className="text-xs text-muted-foreground mt-1">Try searching for something else</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
