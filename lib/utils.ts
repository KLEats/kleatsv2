import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Determine if current time is within a start-end time window.
// Supports formats like "HH:mm" or "H:mm" and "H:mm AM/PM".
// Returns true if open, false if closed, and null if timing is unknown/invalid.
export function isOpenNow(fromTime?: string | null, toTime?: string | null): boolean | null {
  const start = (fromTime || "").trim()
  const end = (toTime || "").trim()
  if (!start || !end) return null

  const parseTime = (t: string) => {
    const ampmMatch = t.match(/^\s*(\d{1,2}):(\d{2})\s*(AM|PM)\s*$/i)
    let hours: number, minutes: number
    if (ampmMatch) {
      hours = parseInt(ampmMatch[1], 10) % 12
      if (ampmMatch[3].toUpperCase() === "PM") hours += 12
      minutes = parseInt(ampmMatch[2], 10)
    } else {
      const match = t.match(/^\s*(\d{1,2}):(\d{2})\s*$/)
      if (!match) return NaN
      hours = parseInt(match[1], 10)
      minutes = parseInt(match[2], 10)
    }
    return hours * 60 + minutes
  }

  const startMin = parseTime(start)
  const endMin = parseTime(end)
  if (isNaN(startMin) || isNaN(endMin)) return null

  const now = new Date()
  const nowMin = now.getHours() * 60 + now.getMinutes()

  // Handle overnight windows (e.g., 22:00 - 06:00)
  if (startMin <= endMin) {
    return nowMin >= startMin && nowMin <= endMin
  } else {
    return nowMin >= startMin || nowMin <= endMin
  }
}

// Coupon feature flags (client-safe; NEXT_PUBLIC_ is inlined at build time)
export const FREECANE_ENABLED = (process.env.NEXT_PUBLIC_FREECANE_ENABLED ?? "true").toLowerCase() !== "false"

// Check if a specific HH:mm time lies within a start-end window (HH:mm). Handles overnight windows too.
export function isTimeWithinWindow(targetHHMM: string, fromTime?: string | null, toTime?: string | null): boolean {
  const target = (targetHHMM || "").trim()
  const start = (fromTime || "").trim()
  const end = (toTime || "").trim()
  if (!target || !start || !end) return true
  const toMin = (t: string) => {
    const m = t.match(/^(\d{1,2}):(\d{2})$/)
    if (!m) return NaN
    const h = parseInt(m[1], 10)
    const mm = parseInt(m[2], 10)
    return h * 60 + mm
  }
  const tMin = toMin(target)
  const sMin = toMin(start)
  const eMin = toMin(end)
  if ([tMin, sMin, eMin].some((v) => isNaN(v))) return true
  if (sMin <= eMin) return tMin >= sMin && tMin <= eMin
  return tMin >= sMin || tMin <= eMin
}
