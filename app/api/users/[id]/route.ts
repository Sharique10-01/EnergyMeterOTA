import { type NextRequest, NextResponse } from "next/server"
import { getSession, deleteUser } from "@/lib/auth"

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    if (!session.canCreateUsers) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const { id } = await params

    if (!id) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 })
    }

    // Prevent deleting yourself
    if (id === session.userId) {
      return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 })
    }

    const success = await deleteUser(id)

    if (!success) {
      return NextResponse.json({ error: "User not found or cannot be deleted" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[API] Delete user error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
