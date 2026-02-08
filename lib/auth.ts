/**
 * Authentication module with MongoDB integration
 */

import { db, ensureInitialized } from "./db"
import type { IUser } from "./models"
import { SignJWT, jwtVerify } from "jose"
import { cookies } from "next/headers"
import bcrypt from "bcryptjs"

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "your-secret-key-change-in-production")
const SESSION_COOKIE = "auth-session"

export interface SessionData {
  userId: string
  username: string
  role: string
  canCreateUsers: boolean
}

export interface UserPublic {
  id: string
  username: string
  fullName: string | null
  role: string
  canCreateUsers: boolean
  createdAt: Date
  lastLogin: Date | null
}

// Hash a password using bcrypt
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

// Verify a password against a hash
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

// Convert IUser to public user object
function toPublicUser(user: IUser): UserPublic {
  return {
    id: user._id.toString(),
    username: user.username,
    fullName: user.fullName,
    role: user.role,
    canCreateUsers: user.canCreateUsers,
    createdAt: user.createdAt,
    lastLogin: user.lastLogin,
  }
}

// Create a JWT session token
export async function createSession(user: UserPublic): Promise<string> {
  const token = await new SignJWT({
    userId: user.id,
    username: user.username,
    role: user.role,
    canCreateUsers: user.canCreateUsers,
  })
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
    return {
      userId: payload.userId as string,
      username: payload.username as string,
      role: payload.role as string,
      canCreateUsers: payload.canCreateUsers as boolean,
    }
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
export async function authenticateUser(username: string, password: string): Promise<UserPublic | null> {
  await ensureInitialized()

  const user = await db.findUserByUsername(username)

  if (!user) {
    return null
  }

  const isValid = await verifyPassword(password, user.passwordHash)

  if (!isValid) {
    return null
  }

  // Update last login
  await db.updateLastLogin(user._id.toString())

  return toPublicUser(user)
}

// Get user by ID
export async function getUserById(id: string): Promise<UserPublic | null> {
  await ensureInitialized()

  const user = await db.findUserById(id)

  if (!user) {
    return null
  }

  return toPublicUser(user)
}

// Get all users (admin only)
export async function getAllUsers(): Promise<UserPublic[]> {
  await ensureInitialized()

  const users = await db.getAllUsers()

  return users.map(toPublicUser)
}

// Create a new user
export async function createUser(
  username: string,
  password: string,
  fullName: string,
  role: "user" | "master" = "user",
  canCreateUsers = false
): Promise<UserPublic> {
  await ensureInitialized()

  const passwordHash = await hashPassword(password)

  const newUser = await db.createUser({
    username,
    password_hash: passwordHash,
    full_name: fullName,
    role,
    can_create_users: canCreateUsers,
  })

  return toPublicUser(newUser)
}

// Delete a user
export async function deleteUser(id: string): Promise<boolean> {
  await ensureInitialized()
  return db.deleteUser(id)
}
