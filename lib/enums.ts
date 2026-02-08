/**
 * System Enumerations
 */

// User roles
export enum UserRole {
  MASTER = "master",
  USER = "user",
}

// Device status
export enum DeviceStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
  OFFLINE = "offline",
  MAINTENANCE = "maintenance",
}

// Device type
export enum DeviceType {
  SINGLE_PHASE = "single_phase",
  THREE_PHASE = "three_phase",
}

// Alarm types
export enum AlarmType {
  OVER_VOLTAGE = "OVER_VOLTAGE",
  UNDER_VOLTAGE = "UNDER_VOLTAGE",
  OVER_CURRENT = "OVER_CURRENT",
  POWER_OUTAGE = "POWER_OUTAGE",
  DEVICE_OFFLINE = "DEVICE_OFFLINE",
  ANOMALY_DETECTED = "ANOMALY_DETECTED",
}

export const AlarmTypeLabels: Record<AlarmType, string> = {
  [AlarmType.OVER_VOLTAGE]: "Over Voltage",
  [AlarmType.UNDER_VOLTAGE]: "Under Voltage",
  [AlarmType.OVER_CURRENT]: "Over Current",
  [AlarmType.POWER_OUTAGE]: "Power Outage",
  [AlarmType.DEVICE_OFFLINE]: "Device Offline",
  [AlarmType.ANOMALY_DETECTED]: "Anomaly Detected",
}

// Severity codes
export enum SeverityCode {
  INFO = 1,
  WARNING = 2,
  CRITICAL = 3,
  EMERGENCY = 4,
}

export const SeverityCodeLabels: Record<SeverityCode, string> = {
  [SeverityCode.INFO]: "Info",
  [SeverityCode.WARNING]: "Warning",
  [SeverityCode.CRITICAL]: "Critical",
  [SeverityCode.EMERGENCY]: "Emergency",
}

export const SeverityCodeColors: Record<SeverityCode, string> = {
  [SeverityCode.INFO]: "blue",
  [SeverityCode.WARNING]: "yellow",
  [SeverityCode.CRITICAL]: "orange",
  [SeverityCode.EMERGENCY]: "red",
}

// Event types
export enum EventType {
  VOLTAGE = "VOLTAGE",
  CURRENT = "CURRENT",
  POWER = "POWER",
  ANOMALY = "ANOMALY",
  DEVICE_CONNECTED = "DEVICE_CONNECTED",
  DEVICE_DISCONNECTED = "DEVICE_DISCONNECTED",
  THRESHOLD_UPDATED = "THRESHOLD_UPDATED",
  DAY_RESET = "DAY_RESET",
}

// Time constants
export const TIME_CONSTANTS = {
  READINGS_PER_HOUR: 12, // 5-minute intervals
  READINGS_PER_DAY: 288, // 12 * 24
  INTERVAL_MINUTES: 5,
  INTERVAL_SECONDS: 300,
  SAMPLES_PER_CYCLE: 256, // At 50Hz
  SAMPLING_FREQUENCY_HZ: 12800, // 256 * 50
  AC_FREQUENCY_HZ: 50,
} as const

// Default thresholds (India standard 230V ±10%)
export const DEFAULT_THRESHOLDS = {
  MIN_VOLTAGE: 207, // 230V - 10%
  MAX_VOLTAGE: 253, // 230V + 10%
  MAX_CURRENT: 20, // ACS712-20A max rating
  NOMINAL_VOLTAGE: 230,
} as const
