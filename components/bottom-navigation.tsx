"use client"

import { Home, Clock, User, Utensils } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useAuth } from "@/hooks/use-auth"
import { motion } from "framer-motion"

export default function BottomNavigation() {
  const pathname = usePathname()
  const { isAuthenticated, isCanteenOwner } = useAuth()

  const navItems = [
    {
      name: "Home",
      href: "/",
      icon: Home,
    },
    {
      name: "Canteens",
      href: "/canteens",
      icon: Utensils,
    },
    {
      name: isCanteenOwner ? "Dashboard" : "Orders",
      href: isCanteenOwner ? "/dashboard" : "/orders",
      icon: Clock,
    },
    {
      name: "Account",
      href: "/account",
      icon: User,
    },
  ]

  return (
    <div data-bottom-nav className="fixed bottom-0 left-0 z-20 w-full border-t bg-background">
      <div className="grid h-16 grid-cols-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center relative",
                isActive ? "text-primary" : "text-muted-foreground",
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="bottomNavIndicator"
                  className="absolute top-0 h-1 w-10 rounded-full bg-primary"
                  initial={false}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
              <item.icon className="h-5 w-5" />
              <span className="mt-1 text-xs">{item.name}</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
