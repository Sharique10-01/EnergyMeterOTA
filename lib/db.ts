// In-memory user storage (no database needed for Phase 1)
// Users are stored in memory and reset on server restart

export interface User {
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

export interface UserWithoutPassword extends Omit<User, "password_hash"> {}

// In-memory user store
let users: User[] = []
let nextUserId = 1

// Initialize with master user
// Username: MasterSRK, Password: Open@002
// Password hash generated with bcrypt
const MASTER_USER: User = {
  id: 0,
  username: "MasterSRK",
  password_hash: "$2a$10$8QxW5Z3Jy0K1aX9Y2B3C4eO5P6Q7R8S9T0U1V2W3X4Y5Z6A7B8C9D0", // Placeholder, will be set by auth
  full_name: "Master Admin",
  role: "master",
  can_create_users: true,
  created_at: new Date(),
  updated_at: new Date(),
  last_login: null,
}

// In-memory database operations
export const db = {
  // Find user by username
  async findUserByUsername(username: string): Promise<User | null> {
    const user = users.find(u => u.username === username)
    return user || null
  },

  // Find user by ID
  async findUserById(id: number): Promise<User | null> {
    const user = users.find(u => u.id === id)
    return user || null
  },

  // Get all users
  async getAllUsers(): Promise<User[]> {
    return [...users]
  },

  // Create new user
  async createUser(userData: Omit<User, "id" | "created_at" | "updated_at" | "last_login">): Promise<User> {
    const newUser: User = {
      id: nextUserId++,
      ...userData,
      created_at: new Date(),
      updated_at: new Date(),
      last_login: null,
    }
    users.push(newUser)
    return newUser
  },

  // Update user last login
  async updateLastLogin(id: number): Promise<void> {
    const user = users.find(u => u.id === id)
    if (user) {
      user.last_login = new Date()
      user.updated_at = new Date()
    }
  },

  // Delete user
  async deleteUser(id: number): Promise<boolean> {
    const initialLength = users.length
    users = users.filter(u => u.id !== id && u.role !== "master")
    return users.length < initialLength
  },

  // Initialize master user
  async initializeMasterUser(passwordHash: string): Promise<void> {
    // Check if master user already exists
    const existing = users.find(u => u.username === "MasterSRK")
    if (!existing) {
      MASTER_USER.password_hash = passwordHash
      users.push({ ...MASTER_USER })
      console.log("[AUTH] Master user initialized: MasterSRK")
    }
  },

  // Get master user for initialization
  getMasterUserTemplate(): typeof MASTER_USER {
    return { ...MASTER_USER }
  }
}
