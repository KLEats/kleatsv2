import { NextRequest, NextResponse } from "next/server"
import fs from "fs"
import path from "path"

const DATA_DIR = path.join(process.cwd(), "data")
const DATA_FILE = path.join(DATA_DIR, "bootcamp-registrations.json")

type TeamMember = {
  idNumber: string
  isLeader: boolean
}

type Registration = {
  timestamp: string
  name: string
  idNumber: string
  accommodation: "hostler" | "dayScholar"
  transport: string
  teluguSkill: string
  teamMembers: TeamMember[]
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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const {
      name,
      idNumber,
      accommodation,
      transport,
      teluguSkill,
      teamMembers,
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
      idNumber: String(idNumber).trim().toUpperCase(),
      accommodation,
      transport,
      teluguSkill,
      teamMembers: Array.isArray(teamMembers) ? teamMembers : [],
      paymentStatus: paymentStatus || (accommodation === "hostler" ? "not_required" : "pending"),
    }

    // Check for duplicate ID number
    const existing = readRegistrations()
    const duplicate = existing.find(
      (r) => r.idNumber === registration.idNumber
    )
    if (duplicate) {
      return NextResponse.json(
        { code: 0, message: "This ID number is already registered for the bootcamp." },
        { status: 409 }
      )
    }

    existing.push(registration)
    writeRegistrations(existing)

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

// GET: List all registrations (admin/debug)
export async function GET() {
  try {
    const data = readRegistrations()
    return NextResponse.json({ code: 1, data, total: data.length })
  } catch (err: any) {
    return NextResponse.json(
      { code: 0, message: err?.message || "Failed to read registrations" },
      { status: 500 }
    )
  }
}
