/**
 * Monthly Profile Model - Monthly aggregated consumption data
 */

import mongoose, { Schema, Document, Model, Types } from "mongoose"

export interface IMonthlyProfile extends Document {
  _id: Types.ObjectId
  deviceId: string
  userId: Types.ObjectId
  month: Date // First day of month
  monthString: string // "2026-01"
  totalConsumptionWh: number
  totalConsumptionKwh: number
  daysRecorded: number
  peakDayConsumptionKwh: number
  peakDayDate: Date | null
  avgDailyConsumptionKwh: number
  createdAt: Date
  updatedAt: Date
}

const MonthlyProfileSchema = new Schema<IMonthlyProfile>(
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
    month: {
      type: Date,
      required: [true, "Month is required"],
      index: true,
    },
    monthString: {
      type: String,
      required: [true, "Month string is required"],
      index: true,
    },
    totalConsumptionWh: {
      type: Number,
      default: 0,
    },
    totalConsumptionKwh: {
      type: Number,
      default: 0,
    },
    daysRecorded: {
      type: Number,
      default: 0,
    },
    peakDayConsumptionKwh: {
      type: Number,
      default: 0,
    },
    peakDayDate: {
      type: Date,
      default: null,
    },
    avgDailyConsumptionKwh: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
)

// Compound unique index
MonthlyProfileSchema.index({ deviceId: 1, monthString: 1 }, { unique: true })
MonthlyProfileSchema.index({ userId: 1, month: -1 })

const MonthlyProfile: Model<IMonthlyProfile> =
  mongoose.models.MonthlyProfile || mongoose.model<IMonthlyProfile>("MonthlyProfile", MonthlyProfileSchema)

export default MonthlyProfile
