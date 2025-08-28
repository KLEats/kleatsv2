// Client-side auth helpers for handling expired/invalid tokens and preserving user intent

// Detects whether an error message from the backend indicates an auth problem
export function isAuthMessage(message: string | undefined | null): boolean {
  if (!message) return false
  const m = String(message).toLowerCase()
  return (
    m.includes("invalid token") ||
    m.includes("token invalid") ||
    m.includes("expired") ||
    m.includes("unauthorized") ||
    m.includes("forbidden") ||
    m.includes("auth required")
  )
}

export function clearStoredAuth() {
  try {
    if (typeof window !== "undefined") {
      localStorage.removeItem("auth_token")
      localStorage.removeItem("token")
      localStorage.removeItem("user")
    }
  } catch {}
}

export function savePendingAddToCart(itemId?: number, canteenId?: unknown) {
  if (!itemId) return
  try {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("pendingAddToCart", JSON.stringify({ itemId, canteenId }))
    }
  } catch {}
}

export function buildReturnTo(): string {
  try {
    if (typeof window !== "undefined") {
      return window.location.pathname + window.location.search
    }
  } catch {}
  return "/"
}

export function redirectToLogin(returnTo?: string) {
  try {
    const rt = returnTo || buildReturnTo()
    if (typeof window !== "undefined") {
      window.location.href = `/login?returnTo=${encodeURIComponent(rt)}`
      return
    }
  } catch {}
  // Fallback
  try { if (typeof window !== "undefined") window.location.href = "/login" } catch {}
}

// Full flow: Clear tokens, preserve pending add intent, and redirect to login
export function authRedirectWithIntent(pending?: { itemId?: number; canteenId?: unknown; returnTo?: string }) {
  if (pending?.itemId) savePendingAddToCart(pending.itemId, pending.canteenId)
  clearStoredAuth()
  redirectToLogin(pending?.returnTo)
}
