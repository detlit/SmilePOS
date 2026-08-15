"use client"
import axios from "axios"
import { loadDirHandle } from "@/lib/backupDirStore"

// Shared backup routine used by both the interval scheduler (AutoBackupScheduler)
// and event-driven triggers such as closing the daily bill (ปิดบิลประจำวัน).
// Keeps one code path for: calling the API, writing to the user-selected folder,
// pruning old files and recording history.

export type BackupKind = "auto" | "dailyclose"

export interface BackupRunResult {
  ok: boolean
  file: string
  folder: string
  records: number
  at: string
  /** true when the file landed in the user-selected folder (not only on the server) */
  savedToFolder: boolean
  error?: string
}

export const BACKUP_FILE_PREFIX: Record<BackupKind, string> = {
  auto: "auto_backup_",
  dailyclose: "dailyclose_backup_",
}

// Daily-close snapshots are audit checkpoints — keep them far longer than the
// rolling hourly backups.
const RETENTION_HOURS: Record<BackupKind, number> = {
  auto: 48,
  dailyclose: 90 * 24,
}

const LAST_RUN_KEY: Record<BackupKind, string> = {
  auto: "lastAutoBackup",
  dailyclose: "lastDailyCloseBackup",
}

const SERVER_FOLDER_LABEL = "เซิร์ฟเวอร์ (uploads/backups)"

function fileStamp(now: Date) {
  const p = (n: number) => String(n).padStart(2, "0")
  return `${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())}_${p(now.getHours())}${p(now.getMinutes())}${p(now.getSeconds())}`
}

function pushHistory(entry: Record<string, any>) {
  let history: any[] = []
  try { history = JSON.parse(localStorage.getItem("backupHistory") || "[]") } catch {}
  localStorage.setItem("backupHistory", JSON.stringify([entry, ...history].slice(0, 50)))
  window.dispatchEvent(new CustomEvent("autoBackupUpdated"))
}

/** Remove backup files of the same kind that are past their retention window. */
async function pruneFolder(dirHandle: any, kind: BackupKind) {
  try {
    const prefix = BACKUP_FILE_PREFIX[kind]
    const cutoff = Date.now() - RETENTION_HOURS[kind] * 60 * 60 * 1000
    for await (const [name, handle] of dirHandle.entries()) {
      if (typeof name !== "string") continue
      if (!name.startsWith(prefix) || !name.endsWith(".json")) continue
      try {
        const file = await handle?.getFile?.()
        const mtime = file?.lastModified ?? 0
        if (mtime && mtime < cutoff) {
          await dirHandle.removeEntry(name).catch(() => {})
        }
      } catch {}
    }
  } catch {}
}

/**
 * Create a backup now. Never throws — the caller (e.g. the daily-close flow)
 * must not be blocked by a backup problem; failures are reported in the result
 * and recorded in the backup history.
 */
export async function runBackupNow(opts: { kind?: BackupKind; note?: string } = {}): Promise<BackupRunResult> {
  const kind = opts.kind || "auto"
  const now = new Date()
  const at = now.toLocaleString("th-TH")
  const fallbackName = `${BACKUP_FILE_PREFIX[kind]}${fileStamp(now)}.json`

  try {
    const company = localStorage.getItem("company_") || ""
    if (!company) throw new Error("ไม่พบรหัสร้าน (company) ในเครื่องนี้")

    let selectedTables: string[] | undefined
    try {
      const saved = JSON.parse(localStorage.getItem("autoBackupTables") || "[]")
      if (Array.isArray(saved) && saved.length > 0) selectedTables = saved
    } catch {}

    const res = await axios.post("/api/backup/create", {
      company,
      selectedTables,
      saveOnServer: true,
      kind,
    })
    if (res.data?.error) throw new Error(res.data.error)

    const savedOnServer = Boolean(res.data?.savedFile)
    const fname = res.data?.savedFile || fallbackName

    // Mirror into the folder the user picked in ตั้งค่า → แบ็คอัพข้อมูล (if still granted)
    let savedToFolder = false
    let folderName = ""
    try {
      const dirHandle: any = await loadDirHandle()
      if (dirHandle) {
        const perm = await dirHandle.queryPermission({ mode: "readwrite" })
        if (perm === "granted") {
          const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: "application/json" })
          const fileHandle = await dirHandle.getFileHandle(fname, { create: true })
          const writable = await fileHandle.createWritable()
          await writable.write(blob)
          await writable.close()
          savedToFolder = true
          folderName = dirHandle.name
          await pruneFolder(dirHandle, kind)
        }
      }
    } catch (dirErr) {
      console.warn("Backup folder write skipped:", dirErr)
    }

    if (!savedOnServer && !savedToFolder) {
      throw new Error(res.data?.saveError || "บันทึกไฟล์สำรองไม่สำเร็จ")
    }

    const folder = savedToFolder ? folderName : SERVER_FOLDER_LABEL
    const records = Object.values(res.data?.metadata?.recordCounts || {})
      .reduce((a: number, b: any) => a + Number(b || 0), 0)

    localStorage.setItem(LAST_RUN_KEY[kind], at)
    pushHistory({ date: at, file: fname, folder, status: "สำเร็จ", records, kind, note: opts.note || "" })

    return { ok: true, file: fname, folder, records, at, savedToFolder }
  } catch (err: any) {
    const message = err?.response?.data?.error || err?.message || "Unknown"
    console.error(`Backup (${kind}) failed:`, err)
    pushHistory({
      date: at, file: "-", folder: SERVER_FOLDER_LABEL,
      status: "ล้มเหลว: " + message, records: 0, kind, note: opts.note || "",
    })
    return { ok: false, file: "-", folder: SERVER_FOLDER_LABEL, records: 0, at, savedToFolder: false, error: message }
  }
}
