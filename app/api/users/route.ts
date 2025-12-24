import { type NextRequest, NextResponse } from "next/server"
import { getSession, getAllUsers, createUser } from "@/lib/auth"

// Get all users (requires authentication and create user permission)
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
    console.error("[v0] Get users error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Create a new user (requires authentication and create user permission)
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

    // Regular users cannot create users, only master can
    const user = await createUser(username, password, fullName || "", "user", false)

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        fullName: user.full_name,
        role: user.role,
        canCreateUsers: user.can_create_users,
      },
    })
  } catch (error: any) {
    console.error("[v0] Create user error:", error)

    if (error?.message?.includes("duplicate key")) {
      return NextResponse.json({ error: "Username already exists" }, { status: 409 })
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
