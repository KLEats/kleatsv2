"use client"

import { LazyMotion, domAnimation, m } from "framer-motion"
import FoodItemCard from "@/components/food-item-card"
import { Badge } from "@/components/ui/badge"

export default function PopularSection({ popularItems, onAdd }: { popularItems: any[]; onAdd: (it: any) => void }) {
  return (
    <LazyMotion features={domAnimation} strict>
      <m.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.5, ease: "easeOut" }}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold tracking-tight">Popular Items</h2>
          <span className="hidden md:inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
            {/* tiny inline star */}
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27z"/></svg>
            <span>Updated Hourly</span>
          </span>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {popularItems.slice(0, 3).map((item) => {
            const normalized = { ...item, canteen: (item as any).canteen ?? (item as any).canteenName }
            return (
              <m.div key={item.id} whileHover={{ y: -5, boxShadow: "0px 10px 20px rgba(0,0,0,0.1)" }} transition={{ type: "spring", stiffness: 300 }}>
                <FoodItemCard
                  item={normalized as any}
                  unavailable={(item as any).available === false}
                  onAddToCart={(it: any) => onAdd(it)}
                />
              </m.div>
            )
          })}
        </div>
      </m.div>
    </LazyMotion>
  )
}
