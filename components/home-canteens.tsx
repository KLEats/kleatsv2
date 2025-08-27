"use client"

import Link from "next/link"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { LazyMotion, domAnimation, m } from "framer-motion"
import { Utensils } from "lucide-react"
import { isOpenNow } from "@/lib/utils"

export default function CanteensSection({ canteens }: { canteens: any[] }) {
  return (
    <LazyMotion features={domAnimation} strict>
      <m.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.5, ease: "easeOut" }}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold tracking-tight">Our Canteens</h2>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-1">
          {canteens.map((canteen: any) => {
            const open = isOpenNow(canteen.fromTime, canteen.ToTime)
            const closed = open === false
            return (
              <Link href={`/canteen/${canteen.canteenId}`} key={canteen.canteenId} className="min-w-[320px] max-w-[320px]" passHref>
                <m.div whileHover={{ y: -5, boxShadow: "0px 10px 20px rgba(0,0,0,0.1)" }} transition={{ type: "spring", stiffness: 300 }} className="h-full">
                  <Card className="overflow-hidden h-full">
                    <CardContent className="p-0">
                      <div className="relative h-44">
                        <Image
                          src={
                            canteen.poster
                              ? `${(process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "")}${canteen.poster.startsWith("/") ? canteen.poster : `/${canteen.poster}`}`
                              : "/placeholder.svg"
                          }
                          alt={canteen.CanteenName}
                          fill
                          className={`object-cover${closed ? " grayscale opacity-70" : ""}`}
                          sizes="(max-width: 640px) 320px, 400px"
                          priority={false}
                          decoding="async"
                        />
                        <Badge className={`absolute right-2 top-2 shadow-md ${open === true ? "bg-green-500 text-white" : "bg-muted text-foreground"}`}>
                          {open === true ? "Open" : open === false ? "Not available" : "Timing N/A"}
                        </Badge>
                      </div>
                      <div className="p-4">
                        <h3 className="text-lg font-semibold truncate">{canteen.CanteenName}</h3>
                        {canteen.Location && (
                          <p className="text-sm text-muted-foreground truncate">{canteen.Location}</p>
                        )}
                        <div className="mt-2 flex justify-between">
                          <p className="text-xs text-muted-foreground">
                            {(canteen.fromTime || canteen.ToTime) ? `${canteen.fromTime || "?"} - ${canteen.ToTime || "?"}` : "Timing info not available"}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </m.div>
              </Link>
            )
          })}
          {/* View All canteens tile */}
          <Link href="/canteens" className="min-w-[320px] max-w-[320px]" aria-label="View all canteens">
            <m.div whileHover={{ y: -5, boxShadow: "0px 10px 20px rgba(0,0,0,0.1)" }} transition={{ type: "spring", stiffness: 300 }} className="h-full">
              <Card className="overflow-hidden h-full border-dashed">
                <CardContent className="h-44 flex items-center justify-center p-4">
                  <div className="flex flex-col items-center justify-center text-center gap-2">
                    <div className="h-12 w-12 rounded-full bg-secondary/10 text-primary flex items-center justify-center">
                      <Utensils className="h-6 w-6" />
                    </div>
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <span>View All Canteens</span>
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M5 12h14"/>
                        <path d="M12 5l7 7-7 7"/>
                      </svg>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </m.div>
          </Link>
        </div>
      </m.div>
    </LazyMotion>
  )
}
