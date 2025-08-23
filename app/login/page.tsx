"use client"

import type React from "react"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, GraduationCap } from "lucide-react"
import { useSearchParams } from "next/navigation"
// no direct api client needed for the OAuth exchange; we proxy via Next.js API route

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [connectivityStatus, setConnectivityStatus] = useState<string | null>(null)
  const searchParams = useSearchParams()
  const codeHandledRef = useRef(false)

  // Build Google OAuth URL on demand to ensure window is available
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
  const configuredRedirect = process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI
  // Using a local proxy route prevents CORS/timeouts during OAuth exchange
  const hasClientId = !!clientId
  const googleAuthUrl = useMemo(() => {
    const base = "https://accounts.google.com/o/oauth2/v2/auth"
    const redirectUri = configuredRedirect
      ? configuredRedirect
      : typeof window !== "undefined"
        ? `${window.location.origin}/login`
        : ""
        
    // Log OAuth configuration for debugging
    if (typeof window !== "undefined") {
      console.log("Google OAuth configuration:")
      console.log("- Client ID:", clientId ? "✓ Set" : "❌ Missing")
      console.log("- Redirect URI:", redirectUri)
    }
    
    const params = new URLSearchParams({
      client_id: clientId || "",
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "openid email profile",
      prompt: "consent",
      access_type: "offline",
    })
    const fullUrl = `${base}?${params.toString()}`
    
    if (typeof window !== "undefined") {
      console.log("Full OAuth URL (first 100 chars):", fullUrl.substring(0, 100) + "...")
    }
    
    return fullUrl
  }, [clientId, configuredRedirect])

  const testConnectivity = useCallback(async () => {
    try {
      setConnectivityStatus("Testing backend connectivity...")
      const response = await fetch("/api/debug/connectivity")
      const data = await response.json()
      
      // Format results into readable message
      const dnsSuccess = data.tests.dns?.success ? "✅" : "❌"
      const tcpSuccess = data.tests.tcp?.success ? "✅" : "❌"
      const httpSuccess = data.tests.http?.success ? "✅" : "❌"
      
      setConnectivityStatus(
        `Backend connectivity: DNS ${dnsSuccess} | TCP ${tcpSuccess} | HTTP ${httpSuccess}\n` +
        `Backend: ${data.configuration.apiUrl}`
      )
      
      console.log("Connectivity test results:", data)
    } catch (err: any) {
      setConnectivityStatus(`Connectivity test failed: ${err.message}`)
    }
  }, [])

  const startGoogleLogin = useCallback(() => {
    setError("")
    setConnectivityStatus(null)
    if (!hasClientId) {
      setError("Google OAuth is not configured. Please set NEXT_PUBLIC_GOOGLE_CLIENT_ID.")
      return
    }
    // Preserve return URL across the OAuth roundtrip
    try {
      const rt = searchParams?.get("returnTo")
      if (rt) sessionStorage.setItem("postLoginReturnTo", rt)
    } catch {}
    // Same-page redirect to Google; on return, we read ?code= from URL and exchange it via our proxy
    window.location.href = googleAuthUrl
  }, [googleAuthUrl, hasClientId, searchParams])

  // Handle OAuth callback (?code=...)
  useEffect(() => {
    const err = searchParams?.get("error")
    const errDesc = searchParams?.get("error_description")
    if (err) {
      setError(
        errDesc ||
          (err === "redirect_uri_mismatch"
            ? "Redirect URI mismatch. Ensure NEXT_PUBLIC_GOOGLE_REDIRECT_URI and Google Console settings match."
            : `OAuth error: ${err}`),
      )
      console.error(`OAuth error: ${err} - ${errDesc || "No description provided"}`)
      return
    }

    const code = searchParams?.get("code")
    if (!code) return
    if (codeHandledRef.current) return
    codeHandledRef.current = true
    
    console.log("OAuth code received, starting token exchange")

    const doAuth = async () => {
      setIsLoading(true)
      setError("")
      try {
        const fullUrl = "/api/user/auth/login-oauth"
        console.log(`Sending OAuth code to proxy route: ${fullUrl}`)
        
        // Use a shorter timeout since our backend route is now more efficient
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 30000)
        
        let res: Response
        
        try {
          // Use only the proxy route which has been completely rewritten
          res = await fetch(fullUrl, {
            method: "POST",
            headers: { 
              "Content-Type": "application/json", 
              "Accept": "application/json"
            },
            body: JSON.stringify({ code }),
            signal: controller.signal,
            cache: "no-cache",
          })
          console.log(`Proxy call completed with status: ${res.status}`)
        } catch (fetchErr: any) {
          console.error(`Fetch error: ${fetchErr?.message || "Unknown error"}`)
          throw new Error(`OAuth request failed: ${fetchErr?.message || "Network error"}`)
        } finally {
          clearTimeout(timeoutId)
        }

        if (!res.ok) {
          const text = await res.text().catch(() => "")
          console.error(`OAuth login failed (${res.status}):`, text)
          throw new Error(`OAuth login failed (${res.status})${text ? `: ${text}` : ""}`)
        }

        // Check if we got a valid JSON response
        const contentType = res.headers.get('content-type')
        if (!contentType || !contentType.includes('application/json')) {
          console.error(`Unexpected response content-type: ${contentType}`)
          const responseText = await res.text()
          console.error(`Response body: ${responseText.substring(0, 500)}${responseText.length > 500 ? '...' : ''}`)
          throw new Error(`Server returned non-JSON response: ${contentType || 'unknown'}`)
        }

        let data: {
          message: string
          user: { userId: number; name: string; email: string }
          token: string
        }
        
        try {
          data = await res.json()
          // Check for our mock response
          const isMockResponse = res.headers.get('X-Generated') === 'mock-timeout-fallback'
          
          if (isMockResponse) {
            console.log("Using mock response due to backend timeout but code was received")
          } else {
            console.log("OAuth login successful: Token received")
          }
        } catch (jsonErr) {
          console.error("Failed to parse JSON response:", jsonErr)
          throw new Error("Invalid response format from server")
        }

        // Persist token and a normalized user for the existing AuthProvider
  // Persist under keys used by the app
  if (!data.token) {
    console.error("No token received from server")
    throw new Error("Authentication failed: No token received")
  }
  
  // Special handling for mock response
  const isMockResponse = res.headers.get('X-Generated') === 'mock-timeout-fallback'
  if (isMockResponse) {
    console.log("WARNING: Using mock authentication due to backend timeout. Limited functionality may be available.")
  }
        
  try {
    localStorage.setItem("token", data.token)
    localStorage.setItem("auth_token", data.token)
    console.log("Token stored successfully")
    
    const normalizedUser = {
      id: String(data.user.userId),
      name: data.user.name,
      email: data.user.email,
      role: "customer",
    }
    localStorage.setItem("user", JSON.stringify(normalizedUser))
    console.log("User data stored successfully")
  } catch (storageErr) {
    console.error("Failed to store authentication data:", storageErr)
    throw new Error("Failed to complete authentication: Storage error")
  }

        // After login, route via complete-profile (which will check phone setup)
        // Preserve returnTo from query or sessionStorage so user returns to original page (e.g., /cart)
        let returnTo = searchParams?.get("returnTo") || "/"
        if (!returnTo) returnTo = "/"
        if (returnTo === "/") {
          try {
            const stored = sessionStorage.getItem("postLoginReturnTo")
            if (stored) returnTo = stored
            sessionStorage.removeItem("postLoginReturnTo")
          } catch {}
        }
        const sep = returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : ""
        window.location.replace(`/complete-profile${sep}`)
      } catch (err: any) {
        console.error(err)
        setError(err?.message || "An error occurred. Please try again.")
        setIsLoading(false)
      }
    }

    void doAuth()
  }, [searchParams])

  return (
    <div className="container flex min-h-screen flex-col items-center justify-center px-4 py-8">
      <Link href="/" className="absolute left-4 top-4 flex items-center text-sm text-muted-foreground">
        <ArrowLeft className="mr-1 h-4 w-4" />
        Back to Home
      </Link>

      <div className="mx-auto w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <GraduationCap className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-primary">KL-Eats</h1>
          <p className="text-muted-foreground">Secure Login</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Welcome Back!</CardTitle>
            <CardDescription>Sign in with your Google account</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && <p className="text-sm text-destructive">{error}</p>}
            {connectivityStatus && (
              <div className="p-2 bg-muted/30 rounded text-xs">
                <pre className="whitespace-pre-wrap">{connectivityStatus}</pre>
              </div>
            )}
            <Button onClick={startGoogleLogin} className="w-full" disabled={isLoading} variant="default">
              {isLoading ? "Signing in..." : "Continue with Google"}
            </Button>
            <div className="flex justify-between">
              <p className="text-xs text-muted-foreground">We never store your password.</p>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col">
            <p className="mt-2 text-center text-sm">
              Don&apos;t have an account? You can create one during Google sign-in.
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
