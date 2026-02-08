/**
 * Alarm Model - System alerts when thresholds are crossed
 */

import mongoose, { Schema, Document, Model, Types } from "mongoose"
import { AlarmType, SeverityCode } from "@/lib/enums"

export interface IAlarm extends Document {
  _id: Types.ObjectId
  deviceId: string
  userId: Types.ObjectId
  datetime: Date
  alarmType: AlarmType
  severityCode: SeverityCode
  message: string
  value: number
  threshold: number
  acknowledged: boolean
  acknowledgedAt: Date | null
  acknowledgedBy: Types.ObjectId | null
  createdAt: Date
}

const AlarmSchema = new Schema<IAlarm>(
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
    datetime: {
      type: Date,
      required: [true, "Datetime is required"],
      index: true,
    },
    alarmType: {
      type: String,
      enum: Object.values(AlarmType),
      required: [true, "Alarm type is required"],
      index: true,
    },
    severityCode: {
      type: Number,
      enum: [1, 2, 3, 4],
      required: [true, "Severity code is required"],
      index: true,
    },
    message: {
      type: String,
      required: [true, "Message is required"],
    },
    value: {
      type: Number,
      required: true,
    },
    threshold: {
      type: Number,
      required: true,
    },
    acknowledged: {
      type: Boolean,
      default: false,
      index: true,
    },
    acknowledgedAt: {
      type: Date,
      default: null,
    },
    acknowledgedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
)

// Compound indexes
AlarmSchema.index({ deviceId: 1, datetime: -1 })
AlarmSchema.index({ userId: 1, acknowledged: 1, datetime: -1 })
AlarmSchema.index({ createdAt: -1 })

const Alarm: Model<IAlarm> = mongoose.models.Alarm || mongoose.model<IAlarm>("Alarm", AlarmSchema)

export default Alarm
