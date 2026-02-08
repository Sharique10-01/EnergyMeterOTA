/**
 * Billing Profile Model - Daily power consumption summary
 */

import mongoose, { Schema, Document, Model, Types } from "mongoose"

export interface IBillingProfile extends Document {
  _id: Types.ObjectId
  deviceId: string
  userId: Types.ObjectId
  date: Date
  dateString: string // "2026-01-31"
  powerConsumedWh: number
  powerConsumedKwh: number
  maxVoltage: number
  minVoltage: number
  maxCurrent: number
  avgVoltage: number
  avgCurrent: number
  entryCount: number
  createdAt: Date
}

const BillingProfileSchema = new Schema<IBillingProfile>(
  {
    deviceId: {
      type: String,
      required: [true, "Device ID is required"],
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
      index: true,
    },
    date: {
      type: Date,
      required: [true, "Date is required"],
      index: true,
    },
    dateString: {
      type: String,
      required: [true, "Date string is required"],
      index: true,
    },
    powerConsumedWh: {
      type: Number,
      required: true,
      default: 0,
    },
    powerConsumedKwh: {
      type: Number,
      required: true,
      default: 0,
    },
    maxVoltage: {
      type: Number,
      default: 0,
    },
    minVoltage: {
      type: Number,
      default: 0,
    },
    maxCurrent: {
      type: Number,
      default: 0,
    },
    avgVoltage: {
      type: Number,
      default: 0,
    },
    avgCurrent: {
      type: Number,
      default: 0,
    },
    entryCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
)

// Compound unique index
BillingProfileSchema.index({ deviceId: 1, dateString: 1 }, { unique: true })
BillingProfileSchema.index({ userId: 1, date: -1 })

const BillingProfile: Model<IBillingProfile> =
  mongoose.models.BillingProfile || mongoose.model<IBillingProfile>("BillingProfile", BillingProfileSchema)

export default BillingProfile
