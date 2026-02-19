import { NextRequest, NextResponse } from "next/server"
import fs from "fs"
import path from "path"

const DATA_DIR = path.join(process.cwd(), "data")
const DATA_FILE = path.join(DATA_DIR, "bootcamp-registrations.json")

type Registration = {
  timestamp: string
  name: string
  email: string
  userId: string
  idNumber: string
  accommodation: "hostler" | "dayScholar"
  transport: string
  teluguSkill: string
  pythonSkill: number
  paymentStatus: "pending" | "paid" | "not_required"
}

function readRegistrations(): Registration[] {
  try {
    if (!fs.existsSync(DATA_FILE)) return []
    const raw = fs.readFileSync(DATA_FILE, "utf-8")
    return JSON.parse(raw)
  } catch {
    return []
  }
}

function writeRegistrations(data: Registration[]) {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true })
  }
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf-8")
}

// POST: Create a new registration
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    console.log("[Bootcamp API] POST received:", JSON.stringify(body))

    const {
      name,
      email,
      userId,
      idNumber,
      accommodation,
      transport,
      teluguSkill,
      pythonSkill,
      paymentStatus,
    } = body

    // Basic validation
    if (!name || !idNumber || !accommodation || !transport || !teluguSkill) {
      return NextResponse.json(
        { code: 0, message: "Missing required fields" },
        { status: 400 }
      )
    }

    const registration: Registration = {
      timestamp: new Date().toISOString(),
      name: String(name).trim(),
      email: String(email || "").trim(),
      userId: String(userId || "").trim(),
      idNumber: String(idNumber).trim().toUpperCase(),
      accommodation,
      transport,
      teluguSkill,
      pythonSkill: Number(pythonSkill) || 0,
      paymentStatus: paymentStatus || (accommodation === "hostler" ? "not_required" : "pending"),
    }

    // Check for duplicate ID number or userId
    const existing = readRegistrations()
    const duplicateId = existing.find(
      (r) => r.idNumber === registration.idNumber
    )
    if (duplicateId) {
      return NextResponse.json(
        { code: 0, message: "This ID number is already registered for the bootcamp.", data: duplicateId },
        { status: 409 }
      )
    }
    if (registration.userId) {
      const duplicateUser = existing.find(
        (r) => r.userId && r.userId === registration.userId
      )
      if (duplicateUser) {
        return NextResponse.json(
          { code: 0, message: "This account is already registered for the bootcamp.", data: duplicateUser },
          { status: 409 }
        )
      }
    }

    existing.push(registration)
    writeRegistrations(existing)
    console.log("[Bootcamp API] Registration saved for:", registration.idNumber, "status:", registration.paymentStatus)

    return NextResponse.json({
      code: 1,
      message: "Registration successful",
      data: registration,
    })
  } catch (err: any) {
    console.error("Bootcamp registration error:", err)
    return NextResponse.json(
      { code: 0, message: err?.message || "Internal server error" },
      { status: 500 }
    )
  }
}

// PATCH: Update payment status for an existing registration
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const { idNumber, paymentStatus } = body

    if (!idNumber || !paymentStatus) {
      return NextResponse.json(
        { code: 0, message: "idNumber and paymentStatus are required" },
        { status: 400 }
      )
    }

    const registrations = readRegistrations()
    const idx = registrations.findIndex(
      (r) => r.idNumber === String(idNumber).trim().toUpperCase()
    )

    if (idx === -1) {
      return NextResponse.json(
        { code: 0, message: "Registration not found" },
        { status: 404 }
      )
    }

    registrations[idx].paymentStatus = paymentStatus
    writeRegistrations(registrations)

    return NextResponse.json({
      code: 1,
      message: "Payment status updated",
      data: registrations[idx],
    })
  } catch (err: any) {
    console.error("Bootcamp PATCH error:", err)
    return NextResponse.json(
      { code: 0, message: err?.message || "Internal server error" },
      { status: 500 }
    )
  }
}

// GET: List all registrations or check by userId
export async function GET(req: NextRequest) {
  try {
    const data = readRegistrations()
    const userId = req.nextUrl.searchParams.get("userId")
    if (userId) {
      const registration = data.find((r) => r.userId === userId)
      if (registration) {
        return NextResponse.json({ code: 1, data: registration, found: true })
      }
      return NextResponse.json({ code: 1, data: null, found: false })
    }
    return NextResponse.json({ code: 1, data, total: data.length })
  } catch (err: any) {
    return NextResponse.json(
      { code: 0, message: err?.message || "Failed to read registrations" },
      { status: 500 }
    )
  }
}
