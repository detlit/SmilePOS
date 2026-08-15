'use client'

/**
 * แผงสถานะคิว — คอลัมน์ขวาสุดของหน้าขาย
 *
 * อ่านคิวของวันนี้จากฐานข้อมูล (useSaleQueueStore) แล้วแสดงเป็นการ์ดเรียงตามเลขคิว
 * แคชเชียร์กดเดินสถานะได้จากตรงนี้เลย: รอทำ → กำลังทำ → พร้อมรับ → รับแล้ว
 */

import React, { useEffect, useMemo } from 'react'
import { Check, ChevronRight, ClipboardList, RotateCcw, Undo2 } from 'lucide-react'
import styles from "../componant/mystyle.module.css"
import {
  ACTIVE_QUEUE_STATUSES,
  NEXT_QUEUE_STATUS,
  QUEUE_STATUS_LABEL,
  formatQueueNo,
  normalizeQueueStatus,
  type QueueStatus,
  type SaleQueueRow,
} from "@/lib/saleQueue"
import { useSaleQueueStore } from "./useSaleQueueStore"

/** คลาส CSS ของแถบสีตามสถานะ — แยกไว้ที่เดียวเพื่อให้สีบนการ์ดกับบนป้ายสรุปตรงกัน */
const STATUS_CLASS: Record<QueueStatus, string> = {
  waiting: styles.queueCardWaiting,
  preparing: styles.queueCardPreparing,
  ready: styles.queueCardReady,
  done: styles.queueCardDone,
  cancelled: styles.queueCardCancelled,
}

/** เวลารอแบบอ่านง่าย — หน้าร้านสนใจแค่ "รอมากี่นาทีแล้ว" ไม่ใช่เวลาที่ออกคิว */
function waitedLabel(createdAt: string): string {
  const started = new Date(createdAt).getTime()
  if (!Number.isFinite(started)) return ""
  const mins = Math.max(0, Math.floor((Date.now() - started) / 60000))
  if (mins < 1) return "เพิ่งสั่ง"
  if (mins < 60) return `รอ ${mins} นาที`
  return `รอ ${Math.floor(mins / 60)} ชม. ${mins % 60} นาที`
}

function QueueCard({ row, highlighted }: { row: SaleQueueRow; highlighted: boolean }) {
  const setStatus = useSaleQueueStore((s) => s.setStatus)
  const status = normalizeQueueStatus(row.status)
  const next = NEXT_QUEUE_STATUS[status]
  const items = Array.isArray(row.items) ? row.items : []

  return (
    <div className={`${styles.queueCard} ${STATUS_CLASS[status]} ${highlighted ? styles.queueCardMine : ""}`}>
      <div className={styles.queueCardHead}>
        <span className={styles.queueCardNo}>{formatQueueNo(row.queueNo)}</span>
        <div className={styles.queueCardHeadMeta}>
          <span className={styles.queueCardStatus}>{QUEUE_STATUS_LABEL[status]}</span>
          <span className={styles.queueCardWaited}>{waitedLabel(row.createdAt)}</span>
        </div>
      </div>

      <div className={styles.queueCardItems}>
        {items.length === 0 ? (
          <span className={styles.queueCardEmptyItems}>{row.itemCount} รายการ</span>
        ) : (
          items.slice(0, 4).map((it, i) => (
            <div key={i} className={styles.queueCardItem}>
              <span className={styles.queueCardItemQty}>{it.qty}</span>
              <span className={styles.queueCardItemName} title={it.name}>{it.name}</span>
            </div>
          ))
        )}
        {items.length > 4 && (
          <div className={styles.queueCardMoreItems}>+ อีก {items.length - 4} รายการ</div>
        )}
      </div>

      <div className={styles.queueCardActions}>
        {status !== "waiting" && (
          <button
            type="button"
            title="ถอยสถานะกลับหนึ่งขั้น"
            aria-label="ถอยสถานะกลับ"
            onClick={() => setStatus(row.id, status === "ready" ? "preparing" : "waiting")}
            className={styles.queueCardBack}
          >
            <Undo2 size={13} strokeWidth={2.4} />
          </button>
        )}

        {next && (
          <button
            type="button"
            onClick={() => setStatus(row.id, next)}
            className={styles.queueCardNext}
          >
            <span>{QUEUE_STATUS_LABEL[next]}</span>
            {next === "done" ? <Check size={14} strokeWidth={2.6} /> : <ChevronRight size={14} strokeWidth={2.6} />}
          </button>
        )}
      </div>
    </div>
  )
}

function SaleQueuePanel({ company }: { company: string }) {
  const rows = useSaleQueueStore((s) => s.rows)
  const loading = useSaleQueueStore((s) => s.loading)
  const error = useSaleQueueStore((s) => s.error)
  const lastIssuedQueueNo = useSaleQueueStore((s) => s.lastIssuedQueueNo)
  const startPolling = useSaleQueueStore((s) => s.startPolling)
  const stopPolling = useSaleQueueStore((s) => s.stopPolling)
  const refresh = useSaleQueueStore((s) => s.refresh)

  useEffect(() => {
    startPolling(company)
    return () => stopPolling()
  }, [company, startPolling, stopPolling])

  // นับแยกตามสถานะไว้โชว์บนหัวแผง — ดูปริมาณงานค้างได้โดยไม่ต้องไล่อ่านการ์ด
  const counts = useMemo(() => {
    const c: Record<string, number> = { waiting: 0, preparing: 0, ready: 0 }
    for (const r of rows) {
      const s = normalizeQueueStatus(r.status)
      if (s in c) c[s] += 1
    }
    return c
  }, [rows])

  return (
    <div className={styles.queuePanel}>
      <div className={styles.queuePanelHead}>
        <span className={styles.queuePanelIcon}><ClipboardList size={14} strokeWidth={2.4} /></span>
        <span className={styles.queuePanelTitle}>คิววันนี้</span>
        <button
          type="button"
          title="โหลดคิวใหม่"
          aria-label="โหลดคิวใหม่"
          onClick={() => refresh(company)}
          className={`${styles.queuePanelRefresh} ${loading ? styles.queuePanelRefreshBusy : ""}`}
        >
          <RotateCcw size={13} strokeWidth={2.4} />
        </button>
      </div>

      <div className={styles.queuePanelStats}>
        {ACTIVE_QUEUE_STATUSES.map((s) => (
          <div key={s} className={`${styles.queueStat} ${STATUS_CLASS[s]}`}>
            <span className={styles.queueStatValue}>{counts[s] ?? 0}</span>
            <span className={styles.queueStatLabel}>{QUEUE_STATUS_LABEL[s]}</span>
          </div>
        ))}
      </div>

      {error !== "" && <div className={styles.queuePanelError}>{error}</div>}

      <div className={styles.queuePanelList}>
        {rows.length === 0 ? (
          <div className={styles.queuePanelEmpty}>
            <ClipboardList size={26} strokeWidth={1.4} />
            <div>ยังไม่มีคิวค้าง</div>
            <span>คิวจะขึ้นที่นี่อัตโนมัติเมื่อชำระเงินเสร็จ</span>
          </div>
        ) : (
          rows.map((row) => (
            <QueueCard key={row.id} row={row} highlighted={row.queueNo === lastIssuedQueueNo} />
          ))
        )}
      </div>
    </div>
  )
}

export default React.memo(SaleQueuePanel)
