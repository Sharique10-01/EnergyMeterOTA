/**
 * User Model - MongoDB Schema
 */

import mongoose, { Schema, Document, Model, Types } from "mongoose"
import { UserRole } from "@/lib/enums"

export interface IUser extends Document {
  _id: Types.ObjectId
  username: string
  passwordHash: string
  fullName: string | null
  role: UserRole
  canCreateUsers: boolean
  createdAt: Date
  updatedAt: Date
  lastLogin: Date | null
}

export interface IUserPublic {
  id: string
  username: string
  fullName: string | null
  role: string
  canCreateUsers: boolean
  createdAt: Date
  lastLogin: Date | null
}

const UserSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      required: [true, "Username is required"],
      unique: true,
      trim: true,
      lowercase: true,
      minlength: [3, "Username must be at least 3 characters"],
      index: true,
    },
    passwordHash: {
      type: String,
      required: [true, "Password is required"],
      select: false,
    },
    fullName: {
      type: String,
      trim: true,
      default: null,
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.USER,
    },
    canCreateUsers: {
      type: Boolean,
      default: false,
    },
    lastLogin: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
)

// Convert to public user object
UserSchema.methods.toPublic = function (): IUserPublic {
  return {
    id: this._id.toString(),
    username: this.username,
    fullName: this.fullName,
    role: this.role,
    canCreateUsers: this.canCreateUsers,
    createdAt: this.createdAt,
    lastLogin: this.lastLogin,
  }
}

// Prevent model recompilation in development
const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>("User", UserSchema)

export default User
