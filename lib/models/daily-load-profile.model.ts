/**
 * Daily Load Profile Model - Stores 5-minute interval readings
 * Each document contains up to 288 entries (one per 5-minute interval)
 */

import mongoose, { Schema, Document, Model, Types } from "mongoose"

export interface ILoadProfileEntry {
  entryNo: number // 1-288
  timestamp: Date
  accumulatedAvgPower: number // Wh accumulated in 5 min
  maxAvgCurrent: number // Max of 5 one-minute current averages
  maxAvgVoltage: number // Max of 5 one-minute voltage averages
  minAvgVoltage: number // Min of 5 one-minute voltage averages
  avgCurrent?: number // Average current over 5 min
  avgVoltage?: number // Average voltage over 5 min
}

export interface IDailyLoadProfile extends Document {
  _id: Types.ObjectId
  deviceId: string
  date: Date // Start of day (00:00:00 UTC)
  dayProfileId: string // "2026-01-31" format
  entries: ILoadProfileEntry[]
  totalPowerConsumedWh: number
  entryCount: number
  isComplete: boolean
  lastEntryNo: number
  createdAt: Date
  updatedAt: Date
}

const LoadProfileEntrySchema = new Schema<ILoadProfileEntry>(
  {
    entryNo: {
      type: Number,
      required: true,
      min: 1,
      max: 288,
    },
    timestamp: {
      type: Date,
      required: true,
    },
    accumulatedAvgPower: {
      type: Number,
      required: true,
      default: 0,
    },
    maxAvgCurrent: {
      type: Number,
      required: true,
      default: 0,
    },
    maxAvgVoltage: {
      type: Number,
      required: true,
      default: 0,
    },
    minAvgVoltage: {
      type: Number,
      required: true,
      default: 0,
    },
    avgCurrent: Number,
    avgVoltage: Number,
  },
  { _id: false }
)

const DailyLoadProfileSchema = new Schema<IDailyLoadProfile>(
  {
    deviceId: {
      type: String,
      required: [true, "Device ID is required"],
      index: true,
    },
    date: {
      type: Date,
      required: [true, "Date is required"],
      index: true,
    },
    dayProfileId: {
      type: String,
      required: [true, "Day Profile ID is required"],
      index: true,
    },
    entries: {
      type: [LoadProfileEntrySchema],
      default: [],
    },
    totalPowerConsumedWh: {
      type: Number,
      default: 0,
    },
    entryCount: {
      type: Number,
      default: 0,
    },
    isComplete: {
      type: Boolean,
      default: false,
    },
    lastEntryNo: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
)

// Compound unique index
DailyLoadProfileSchema.index({ deviceId: 1, dayProfileId: 1 }, { unique: true })
DailyLoadProfileSchema.index({ deviceId: 1, date: -1 })

const DailyLoadProfile: Model<IDailyLoadProfile> =
  mongoose.models.DailyLoadProfile ||
  mongoose.model<IDailyLoadProfile>("DailyLoadProfile", DailyLoadProfileSchema)

export default DailyLoadProfile
