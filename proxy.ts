import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { verifySession } from "@/lib/auth"

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Public routes that don't require authentication
  const publicRoutes = ["/", "/auth/login"]

  // Check if the current path is public
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next()
  }

  // Protected routes - check for session
  const token = request.cookies.get("auth-session")?.value

  if (!token) {
    // Redirect to login if no token
    return NextResponse.redirect(new URL("/auth/login", request.url))
  }

  // Verify the session
  const session = await verifySession(token)

  if (!session) {
    // Invalid session - redirect to login
    const response = NextResponse.redirect(new URL("/auth/login", request.url))
    response.cookies.delete("auth-session")
    return response
  }

  // Valid session - allow access
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (authentication endpoints are public)
     * - api/ota (OTA endpoint must be public for ESP32 access)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!api/auth|api/ota|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
