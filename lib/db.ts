/**
 * Database operations for MongoDB
 * Replaces in-memory storage with persistent MongoDB
 */

import connectToDatabase from "./mongodb"
import { User, Device, DailyLoadProfile, BillingProfile, MonthlyProfile, Alarm } from "./models"
import type { IUser, IDevice, IDailyLoadProfile, IBillingProfile, IMonthlyProfile, IAlarm } from "./models"
import { UserRole } from "./enums"
import bcrypt from "bcryptjs"

// Legacy interface for compatibility
export interface UserLegacy {
  id: number
  username: string
  password_hash: string
  full_name: string | null
  role: "master" | "user"
  can_create_users: boolean
  created_at: Date
  updated_at: Date
  last_login: Date | null
}

export interface UserWithoutPassword extends Omit<UserLegacy, "password_hash"> {}

// Master user credentials
const MASTER_USERNAME = process.env.MASTER_USERNAME || "MasterSRK"
const MASTER_PASSWORD = process.env.MASTER_PASSWORD || "Open@002"

let initialized = false

/**
 * Ensure database is connected and master user exists
 */
export async function ensureInitialized(): Promise<void> {
  if (initialized) return

  await connectToDatabase()

  // Check if master user exists
  const masterUser = await User.findOne({ username: MASTER_USERNAME.toLowerCase() })

  if (!masterUser) {
    const passwordHash = await bcrypt.hash(MASTER_PASSWORD, 10)
    await User.create({
      username: MASTER_USERNAME.toLowerCase(),
      passwordHash,
      fullName: "Master Admin",
      role: UserRole.MASTER,
      canCreateUsers: true,
    })
    console.log("[AUTH] Master user initialized:", MASTER_USERNAME)
  }

  initialized = true
}

/**
 * Database operations object for compatibility with existing code
 */
export const db = {
  // Find user by username
  async findUserByUsername(username: string): Promise<IUser | null> {
    await ensureInitialized()
    return User.findOne({ username: username.toLowerCase() }).select("+passwordHash")
  },

  // Find user by ID
  async findUserById(id: string): Promise<IUser | null> {
    await ensureInitialized()
    return User.findById(id)
  },

  // Get all users
  async getAllUsers(): Promise<IUser[]> {
    await ensureInitialized()
    return User.find({}).sort({ createdAt: -1 })
  },

  // Create new user
  async createUser(userData: {
    username: string
    password_hash: string
    full_name: string | null
    role: "master" | "user"
    can_create_users: boolean
  }): Promise<IUser> {
    await ensureInitialized()
    const newUser = await User.create({
      username: userData.username.toLowerCase(),
      passwordHash: userData.password_hash,
      fullName: userData.full_name,
      role: userData.role === "master" ? UserRole.MASTER : UserRole.USER,
      canCreateUsers: userData.can_create_users,
    })
    return newUser
  },

  // Update user last login
  async updateLastLogin(id: string): Promise<void> {
    await ensureInitialized()
    await User.findByIdAndUpdate(id, { lastLogin: new Date() })
  },

  // Delete user
  async deleteUser(id: string): Promise<boolean> {
    await ensureInitialized()
    const user = await User.findById(id)
    if (!user || user.role === UserRole.MASTER) {
      return false
    }
    await User.findByIdAndDelete(id)
    return true
  },

  // Initialize master user (legacy compatibility)
  async initializeMasterUser(passwordHash: string): Promise<void> {
    await ensureInitialized()
    // Already handled in ensureInitialized
  },

  // Get master user template (legacy compatibility)
  getMasterUserTemplate(): UserLegacy {
    return {
      id: 0,
      username: MASTER_USERNAME,
      password_hash: "",
      full_name: "Master Admin",
      role: "master",
      can_create_users: true,
      created_at: new Date(),
      updated_at: new Date(),
      last_login: null,
    }
  },
}

// Re-export for convenience
export { User, Device, DailyLoadProfile, BillingProfile, MonthlyProfile, Alarm }
export type { IUser, IDevice, IDailyLoadProfile, IBillingProfile, IMonthlyProfile, IAlarm }
