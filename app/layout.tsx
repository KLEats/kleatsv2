import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Providers } from "./providers"
import { Toaster } from "@/components/ui/toaster"
import Script from "next/script"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "KL-Eats",
  description: "Food pre-ordering app for college students",
  generator: 'v0.dev',
  icons: {
    icon: '/logo.jpg',
    shortcut: '/logo.jpg',
    apple: '/logo.jpg',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Performance: preconnect to GA and API origin for faster handshakes (no functional change) */}
        <link rel="preconnect" href="https://www.googletagmanager.com" crossOrigin="" />
        <link rel="dns-prefetch" href="//www.googletagmanager.com" />
        <link rel="preconnect" href="https://www.google-analytics.com" crossOrigin="" />
        <link rel="dns-prefetch" href="//www.google-analytics.com" />
        {/* Conditionally preconnect to the public API origin if configured */}
        {(() => {
          try {
            const raw = process.env.NEXT_PUBLIC_API_URL
            if (!raw) return null
            const u = new URL(raw)
            return (
              <>
                <link rel="preconnect" href={u.origin} crossOrigin="" />
                <link rel="dns-prefetch" href={`//${u.host}`} />
              </>
            )
          } catch {
            return null
          }
        })()}
      </head>
  {/* Google Analytics 4 */}
  <Script src="https://www.googletagmanager.com/gtag/js?id=G-Y3TDH790Z7" strategy="lazyOnload" />
  <Script id="ga4-init" strategy="lazyOnload">
    {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);} 
gtag('js', new Date());
gtag('config', 'G-Y3TDH790Z7', { anonymize_ip: true });`}
  </Script>
  {/* End Google Analytics 4 */}
      <body className={inter.className}>
  <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <Providers>
            {children}
            <Toaster />
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  )
}
