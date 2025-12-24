import { db } from "./db"
import type { User, UserWithoutPassword } from "./db"
import { SignJWT, jwtVerify } from "jose"
import { cookies } from "next/headers"
import bcrypt from "bcryptjs"

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "your-secret-key-change-in-production")
const SESSION_COOKIE = "auth-session"

// Initialize master user on first load
// Username: MasterSRK, Password: Open@002
const MASTER_PASSWORD = "Open@002"
let initialized = false

async function ensureMasterUser() {
  if (!initialized) {
    const masterHash = await bcrypt.hash(MASTER_PASSWORD, 10)
    await db.initializeMasterUser(masterHash)
    initialized = true
  }
}

export interface SessionData {
  userId: number
  username: string
  role: string
  canCreateUsers: boolean
}

// Hash a password using bcrypt
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

// Verify a password against a hash
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

// Create a JWT session token
export async function createSession(user: UserWithoutPassword): Promise<string> {
  const token = await new SignJWT({
    userId: user.id,
    username: user.username,
    role: user.role,
    canCreateUsers: user.can_create_users,
  } as SessionData)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET)

  return token
}

// Verify and decode a JWT token
export async function verifySession(token: string): Promise<SessionData | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload as SessionData
  } catch {
    return null
  }
}

// Get current session from cookies
export async function getSession(): Promise<SessionData | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)

  if (!token?.value) {
    return null
  }

  return verifySession(token.value)
}

// Set session cookie
export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  })
}

// Clear session cookie
export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE)
}

// Authenticate user with username and password
export async function authenticateUser(username: string, password: string): Promise<UserWithoutPassword | null> {
  // Ensure master user exists
  await ensureMasterUser()

  const user = await db.findUserByUsername(username)

  if (!user) {
    return null
  }

  const isValid = await verifyPassword(password, user.password_hash)

  if (!isValid) {
    return null
  }

  // Update last login
  await db.updateLastLogin(user.id)

  // Return user without password hash
  const { password_hash, ...userWithoutPassword } = user
  return userWithoutPassword as UserWithoutPassword
}

// Get user by ID
export async function getUserById(id: number): Promise<UserWithoutPassword | null> {
  const user = await db.findUserById(id)

  if (!user) {
    return null
  }

  const { password_hash, ...userWithoutPassword } = user
  return userWithoutPassword as UserWithoutPassword
}

// Get all users (admin only)
export async function getAllUsers(): Promise<UserWithoutPassword[]> {
  const users = await db.getAllUsers()

  return users.map(user => {
    const { password_hash, ...userWithoutPassword } = user
    return userWithoutPassword as UserWithoutPassword
  })
}

// Create a new user
export async function createUser(
  username: string,
  password: string,
  fullName: string,
  role: "user" | "master" = "user",
  canCreateUsers = false,
): Promise<UserWithoutPassword> {
  const passwordHash = await hashPassword(password)

  const newUser = await db.createUser({
    username,
    password_hash: passwordHash,
    full_name: fullName,
    role,
    can_create_users: canCreateUsers,
  })

  const { password_hash, ...userWithoutPassword } = newUser
  return userWithoutPassword as UserWithoutPassword
}

// Delete a user
export async function deleteUser(id: number): Promise<boolean> {
  return db.deleteUser(id)
}
