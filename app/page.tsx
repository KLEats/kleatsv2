"use client"

import { useEffect, useState } from "react"
import BottomNavigation from "@/components/bottom-navigation"
import LoadingScreen from "@/components/loading-screen"
import CartIcon from "@/components/cart-icon"
import { useCart } from "@/hooks/use-cart"
import { useCanteens } from "@/hooks/use-canteens"
import FoodItemCard from "@/components/food-item-card"
import { useAuth } from "@/hooks/use-auth"
import { useRouter } from "next/navigation"
import Footer from "@/components/footer"
import Logo from "@/components/logo"
import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"
import Link from "next/link"
import SearchBar from "@/components/search-bar"
import ContactUs from "./contact/page"

export default function Home() {
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)

  const { addItem } = useCart()
  const { canteens, categories, popularItems, loading, error, searchItems } = useCanteens()
  const { isAuthenticated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Simulate loading time for initial app load
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 2000)

    return () => clearTimeout(timer)
  }, [])

  // Handle search with better debouncing and state management
  useEffect(() => {
    const performSearch = async () => {
      if (searchQuery.trim().length > 0) {
        setIsSearching(true)
        try {
          const results = await searchItems(searchQuery)
          setSearchResults(results)
        } catch (error) {
          console.error("Search failed:", error)
          setSearchResults([])
        } finally {
          setIsSearching(false)
        }
      } else {
        setSearchResults([])
        setIsSearching(false)
      }
    }

    const debounceTimer = setTimeout(performSearch, 300)
    return () => clearTimeout(debounceTimer)
  }, [searchQuery, searchItems])

  const handleAddToCart = (item: any) => {
    if (!isAuthenticated) {
      router.push("/login")
      return
    }

    addItem({
      id: item.id,
      name: item.name,
      price: item.price,
      quantity: 1,
      canteen: item.canteenName || item.canteen,
      image: item.image,
      packaging: false,
    })
  }

  if (isLoading) {
    return <LoadingScreen />
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading delicious food options...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-4">Failed to load data: {error}</p>
          <button onClick={() => window.location.reload()} className="px-4 py-2 bg-primary text-white rounded-md">
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen pb-24 page-transition">
      <div className="sticky top-0 z-10 bg-background p-4 shadow-sm">
        <div className="container mx-auto flex items-center justify-between">
          <Logo />
          <div className="hidden md:block md:w-1/3">
            <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Search for food or canteen..." />
          </div>
          <div className="hidden md:flex md:items-center md:gap-4">
            {!isAuthenticated ? (
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <button
                  onClick={() => router.push("/login")}
                  className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white"
                >
                  Login
                </button>
              </motion.div>
            ) : (
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <button
                  onClick={() => router.push("/account")}
                  className="rounded-md bg-primary/10 px-4 py-2 text-sm font-medium text-primary"
                >
                  My Account
                </button>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      <div className="container px-4 py-6">
        <div className="md:hidden mb-6">
          <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Search for food or canteen..." />
        </div>

        {/* Search Results */}
        {searchQuery.trim().length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <section className="mb-8">
              <h2 className="mb-4 text-lg font-semibold">
                {isSearching ? (
                  "Searching..."
                ) : (
                  <>
                    Search Results for "{searchQuery}" ({searchResults.length})
                  </>
                )}
              </h2>
              {isSearching ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : searchResults.length > 0 ? (
                <div className="grid gap-4">
                  {searchResults.map((item) => (
                    <FoodItemCard key={`search-${item.id}`} item={item} onAddToCart={handleAddToCart} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No items found matching "{searchQuery}"</p>
                  <p className="text-sm text-muted-foreground mt-2">Try searching for different keywords</p>
                </div>
              )}
            </section>
          </motion.div>
        )}

        {/* Show regular content only when not searching */}
        {searchQuery.trim().length === 0 && (
          <>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <section className="mb-8">
                <h2 className="mb-4 text-lg font-semibold">Food Categories</h2>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
                  {categories.map((category, index) => (
                    <Link href={`/category/${category.name.toLowerCase().replace(/\s+/g, '-')}`} key={index}>
                      <Card className="card-hover overflow-hidden">
                        <CardContent className="flex flex-col items-center p-4">
                          <div className="mb-3 rounded-full bg-secondary/10 p-2">
                            <Image
                              src={category.poster || "/placeholder.svg"}
                              alt={category.name}
                              width={60}
                              height={60}
                              className="h-15 w-15 rounded-full object-cover"
                            />
                          </div>
                          <h3 className="text-center text-sm font-medium">{category.name}</h3>
                          {category.no_of_items > 0 && (
                            <p className="text-xs text-muted-foreground mt-1">{category.no_of_items} items</p>
                          )}
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </section>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <section className="mb-8">
                <h2 className="mb-4 text-lg font-semibold">Popular Items</h2>
                <div className="grid gap-4">
                  {popularItems.map((item) => (
                    <FoodItemCard key={item.id} item={item} onAddToCart={handleAddToCart} />
                  ))}
                </div>
              </section>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <section className="mb-8">
                <h2 className="mb-4 text-lg font-semibold">Canteens</h2>
                <div className="grid gap-4">
                  {canteens.map((canteen, index) => (
                    <Link href={`/canteen/${canteen.CanteenName.toLowerCase().replace(/\s+/g, '-')}`} key={index}>
                      <Card className="card-hover overflow-hidden">
                        <CardContent className="p-0">
                          <div className="relative h-40">
                            <Image
                              src={canteen.poster || "/placeholder.svg"}
                              alt={canteen.CanteenName}
                              fill
                              className="object-cover"
                            />
                            <Badge className="absolute right-2 top-2 bg-primary">★ 4.5+</Badge>
                          </div>
                          <div className="p-4">
                            <h3 className="text-lg font-semibold">{canteen.CanteenName}</h3>
                            <div className="mt-2 flex justify-between">
                              <p className="text-xs text-muted-foreground">Location: {canteen.Location}</p>
                              <p className="text-xs text-muted-foreground">
                                {canteen.fromTime && canteen.ToTime ? `${canteen.fromTime} - ${canteen.ToTime}` : "Hours not specified"}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </section>
            </motion.div>
          </>
        )}
      </div>

      <Footer />
      <CartIcon />
      <BottomNavigation />
    </main>

  )
}
