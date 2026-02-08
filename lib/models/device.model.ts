/**
 * Device Model - Energy meter device configuration
 */

import mongoose, { Schema, Document, Model, Types } from "mongoose"
import { DeviceStatus, DeviceType, DEFAULT_THRESHOLDS } from "@/lib/enums"
import crypto from "crypto"

export interface IThresholds {
  minVoltage: number
  maxVoltage: number
  maxCurrent: number
}

export interface IRelayConfig {
  id: number              // Relay ID (1, 2, 3...)
  name: string            // User-defined name ("Bedroom Light")
  gpioPin: number         // GPIO pin on ESP32 (13, 14...)
  targetState: boolean    // What dashboard wants (true = ON)
  actualState: boolean    // Last reported state from ESP32
  verified: boolean       // Confirmed to exist on device
  lastStateChange: Date | null
}

export interface IDeviceRelayInfo {
  userConfiguredRelays: IRelayConfig[]
  deviceReportedCount: number      // How many relays ESP32 reports
  deviceReportedPins: number[]     // Which GPIO pins
  lastVerified: Date | null
}

export interface IDevice extends Document {
  _id: Types.ObjectId
  deviceId: string // Unique identifier like "device_001"
  userId: Types.ObjectId // Owner
  deviceName: string
  deviceType: DeviceType
  firmwareVersion: string
  status: DeviceStatus
  apiKey: string // Unique API key for this device
  lastSeen: Date
  thresholds: IThresholds
  relayInfo: IDeviceRelayInfo
  location: string | null
  createdAt: Date
  updatedAt: Date
}

export interface IDevicePublic {
  id: string
  deviceId: string
  deviceName: string
  deviceType: string
  firmwareVersion: string
  status: string
  apiKey: string
  lastSeen: Date
  thresholds: IThresholds
  relayInfo: IDeviceRelayInfo
  location: string | null
  createdAt: Date
}

const ThresholdsSchema = new Schema<IThresholds>(
  {
    minVoltage: {
      type: Number,
      default: DEFAULT_THRESHOLDS.MIN_VOLTAGE,
    },
    maxVoltage: {
      type: Number,
      default: DEFAULT_THRESHOLDS.MAX_VOLTAGE,
    },
    maxCurrent: {
      type: Number,
      default: DEFAULT_THRESHOLDS.MAX_CURRENT,
    },
  },
  { _id: false }
)

const RelayConfigSchema = new Schema<IRelayConfig>(
  {
    id: { type: Number, required: true },
    name: { type: String, required: true, default: "Relay" },
    gpioPin: { type: Number, default: 0 },
    targetState: { type: Boolean, default: false },
    actualState: { type: Boolean, default: false },
    verified: { type: Boolean, default: false },
    lastStateChange: { type: Date, default: null },
  },
  { _id: false }
)

const DeviceRelayInfoSchema = new Schema<IDeviceRelayInfo>(
  {
    userConfiguredRelays: { type: [RelayConfigSchema], default: [] },
    deviceReportedCount: { type: Number, default: 0 },
    deviceReportedPins: { type: [Number], default: [] },
    lastVerified: { type: Date, default: null },
  },
  { _id: false }
)

const DeviceSchema = new Schema<IDevice>(
  {
    deviceId: {
      type: String,
      required: [true, "Device ID is required"],
      unique: true,
      trim: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
      index: true,
    },
    deviceName: {
      type: String,
      required: [true, "Device name is required"],
      trim: true,
    },
    deviceType: {
      type: String,
      enum: Object.values(DeviceType),
      default: DeviceType.SINGLE_PHASE,
    },
    firmwareVersion: {
      type: String,
      default: "1.0.0",
    },
    status: {
      type: String,
      enum: Object.values(DeviceStatus),
      default: DeviceStatus.ACTIVE,
    },
    apiKey: {
      type: String,
      unique: true,
      index: true,
    },
    lastSeen: {
      type: Date,
      default: Date.now,
    },
    thresholds: {
      type: ThresholdsSchema,
      default: () => ({
        minVoltage: DEFAULT_THRESHOLDS.MIN_VOLTAGE,
        maxVoltage: DEFAULT_THRESHOLDS.MAX_VOLTAGE,
        maxCurrent: DEFAULT_THRESHOLDS.MAX_CURRENT,
      }),
    },
    relayInfo: {
      type: DeviceRelayInfoSchema,
      default: () => ({
        userConfiguredRelays: [],
        deviceReportedCount: 0,
        deviceReportedPins: [],
        lastVerified: null,
      }),
    },
    location: {
      type: String,
      trim: true,
      default: null,
    },
  },
  {
    timestamps: true,
  }
)

// Generate API key only for NEW documents
DeviceSchema.pre("save", function () {
  if (this.isNew && !this.apiKey) {
    // Generate a unique API key: prefix + random hex
    this.apiKey = `em_${crypto.randomBytes(24).toString("hex")}`
  }
})

// Convert to public device object
DeviceSchema.methods.toPublic = function (): IDevicePublic {
  return {
    id: this._id.toString(),
    deviceId: this.deviceId,
    deviceName: this.deviceName,
    deviceType: this.deviceType,
    firmwareVersion: this.firmwareVersion,
    status: this.status,
    apiKey: this.apiKey,
    lastSeen: this.lastSeen,
    thresholds: this.thresholds,
    relayInfo: this.relayInfo,
    location: this.location,
    createdAt: this.createdAt,
  }
}

// Compound indexes
DeviceSchema.index({ userId: 1, deviceId: 1 })
DeviceSchema.index({ status: 1, lastSeen: -1 })

const Device: Model<IDevice> = mongoose.models.Device || mongoose.model<IDevice>("Device", DeviceSchema)

export default Device
