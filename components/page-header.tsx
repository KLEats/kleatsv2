"use client"

import { ArrowLeft, Home } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

interface PageHeaderProps {
  title: string
}

export default function PageHeader({ title }: PageHeaderProps) {
  const pathname = usePathname()
  
  // A simple map to determine the back button's destination
  const getBackLink = () => {
    if (pathname.startsWith('/canteen/')) {
      return '/canteens'
    }
    // Default back to home
    return '/'
  }

  return (
    <div className="sticky top-0 z-20 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-4 border-b">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center">
          <Link href={getBackLink()} className="mr-4 p-2 -ml-2 rounded-full hover:bg-muted">
            <ArrowLeft className="h-5 w-5" />
            <span className="sr-only">Back</span>
          </Link>
          <h1 className="text-xl font-bold tracking-tight">{title}</h1>
        </div>
        <Link href="/" className="p-2 rounded-full hover:bg-muted">
          <Home className="h-5 w-5" />
          <span className="sr-only">Home</span>
        </Link>
      </div>
    </div>
  )
}
