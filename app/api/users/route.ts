import { type NextRequest, NextResponse } from "next/server"
import { getSession, getAllUsers, createUser } from "@/lib/auth"

// Get all users (requires authentication and master role)
export async function GET() {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    if (!session.canCreateUsers) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const users = await getAllUsers()

    return NextResponse.json({ users })
  } catch (error) {
    console.error("[API] Get users error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Create a new user (requires authentication and master role)
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    if (!session.canCreateUsers) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const { username, password, fullName } = await request.json()

    if (!username || !password) {
      return NextResponse.json({ error: "Username and password are required" }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 })
    }

    // Regular users cannot create users, only master can
    const user = await createUser(username, password, fullName || "", "user", false)

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        role: user.role,
        canCreateUsers: user.canCreateUsers,
      },
    })
  } catch (error: unknown) {
    console.error("[API] Create user error:", error)

    const errorMessage = error instanceof Error ? error.message : ""
    if (errorMessage.includes("duplicate") || errorMessage.includes("E11000")) {
      return NextResponse.json({ error: "Username already exists" }, { status: 409 })
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
