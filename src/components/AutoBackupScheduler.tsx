"use client"
import { useEffect, useRef, useCallback } from "react"
import { runBackupNow } from "@/lib/backupRunner"

// How often we wake up to check whether a backup is due (ms).
// Cheap: just compares timestamps. 60s survives background timer throttling.
const CHECK_INTERVAL_MS = 60 * 1000

export default function AutoBackupScheduler() {
  const checkRef = useRef<any>(null)
  const isRunningRef = useRef(false)

  // Resolve the configured interval (in hours). Returns 0 when disabled.
  const getIntervalHours = useCallback(() => {
    let autoInterval = localStorage.getItem("autoBackupInterval") || "off"
    // Migrate legacy "5m" (every 5 minutes) → "1" (every 1 hour)
    // to reduce disk/CPU load on low-spec machines.
    if (autoInterval.endsWith("m")) {
      autoInterval = "1"
      localStorage.setItem("autoBackupInterval", autoInterval)
    }
    if (autoInterval === "off") return 0
    const hours = Number(autoInterval)
    return hours > 0 ? hours : 0
  }, [])

  const scheduleNext = useCallback((hours: number) => {
    const next = Date.now() + hours * 60 * 60 * 1000
    localStorage.setItem("nextAutoBackupAt", String(next))
    return next
  }, [])

  const runAutoBackup = useCallback(async () => {
    if (isRunningRef.current) return
    isRunningRef.current = true
    try {
      // runBackupNow handles the API call, folder mirroring, pruning and history.
      await runBackupNow({ kind: "auto" })
    } finally {
      isRunningRef.current = false
    }
  }, [])

  // Timestamp-based scheduler: wake up periodically and run a backup if the
  // next-due time has passed. This survives app restarts (timestamp persisted
  // in localStorage) and catches up a missed backup on the next launch.
  const checkAndRun = useCallback(async () => {
    if (isRunningRef.current) return

    const hours = getIntervalHours()
    if (hours === 0) {
      // Disabled: drop any pending schedule so it doesn't fire if re-enabled later.
      localStorage.removeItem("nextAutoBackupAt")
      return
    }

    const nextAt = Number(localStorage.getItem("nextAutoBackupAt") || "0")
    if (!nextAt) {
      // First time enabled (or schedule was cleared): arm for the future,
      // don't fire immediately on enable.
      scheduleNext(hours)
      return
    }

    if (Date.now() >= nextAt) {
      // Claim the slot first (write next-due time) so a second window/tab
      // waking at the same time won't run a duplicate backup.
      scheduleNext(hours)
      await runAutoBackup()
    }
  }, [getIntervalHours, scheduleNext, runAutoBackup])

  const setup = useCallback(() => {
    if (checkRef.current) {
      clearInterval(checkRef.current)
      checkRef.current = null
    }
    // Run a check right away (handles catch-up on launch), then every minute.
    checkAndRun()
    checkRef.current = setInterval(checkAndRun, CHECK_INTERVAL_MS)
  }, [checkAndRun])

  useEffect(() => {
    setup()

    const handleConfigChanged = () => {
      // Re-arm the schedule from "now" using the (possibly changed) interval.
      const hours = getIntervalHours()
      if (hours === 0) {
        localStorage.removeItem("nextAutoBackupAt")
      } else {
        scheduleNext(hours)
      }
    }
    window.addEventListener("autoBackupConfigChanged", handleConfigChanged)

    return () => {
      if (checkRef.current) clearInterval(checkRef.current)
      window.removeEventListener("autoBackupConfigChanged", handleConfigChanged)
    }
  }, [setup, getIntervalHours, scheduleNext])

  return null
}
