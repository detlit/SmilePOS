'use client'

/**
 * ปุ่ม "ค้นหาลูกค้า" + ป้ายข้อมูลลูกค้าของบิล
 * (มาแทนการ์ด "ข้อมูลลูกค้า" ในแผงขวา — ดู SHOW_CUSTOMER_SIDE_CARD ใน salesUiFlags)
 *
 * state จริงของลูกค้าอยู่ที่ body_sale.tsx — ที่นี่แค่อ่าน saleCustomer มาแสดง
 * แล้วยิงคำสั่งกลับผ่าน request counter ของ useMessageStore
 *
 * แยกเป็นไฟล์ของตัวเองเพราะทั้ง body_pro_cus.tsx (แถบเครื่องมือ) และ body_sale.tsx
 * (คอลัมน์ขวา) ต้องใช้ได้ทั้งคู่ — สองไฟล์นั้น import กันอยู่แล้ว ถ้าวางไว้ในไฟล์ใดไฟล์หนึ่งจะเกิด circular import
 */

import React from 'react'
import { AlertTriangle, HeartPulse, Search, UserPlus, UserRound, X } from 'lucide-react'
import styles from "../componant/mystyle.module.css"
import { useMessageStore } from "./useMessageStore"

type Props = {
  /**
   * bar   = เรียงแนวนอน สำหรับวางบนแถบเครื่องมือด้านบน
   * stack = เรียงแนวตั้งเต็มความกว้าง สำหรับวางในคอลัมน์แคบ ๆ ด้านขวา
   */
  layout?: "bar" | "stack"
}

function CustomerCommand({ layout = "bar" }: Props) {
  const customer = useMessageStore((state) => state.saleCustomer)
  const requestCustomerSearch = useMessageStore((state) => state.requestCustomerSearch)
  const requestCustomerRegister = useMessageStore((state) => state.requestCustomerRegister)
  const requestCustomerClear = useMessageStore((state) => state.requestCustomerClear)
  const requestCustomerFollowUp = useMessageStore((state) => state.requestCustomerFollowUp)

  const stacked = layout === "stack"

  // ป้ายเตือนรวม แพ้สินค้า + โรคประจำตัว ไว้จุดเดียว (รายละเอียดเต็มอยู่ใน tooltip)
  const alertTitle = customer
    ? [
      customer.allergyCount > 0 ? `แพ้สินค้า ${customer.allergyCount} รายการ\n${customer.allergyText}` : "",
      customer.congenital ? `โรคประจำตัว : ${customer.congenital}` : "",
    ].filter(Boolean).join("\n\n")
    : ""

  return (
    <div className={`${styles.customerCommand} ${stacked ? styles.customerCommandStack : ""}`}>
      <div className={styles.customerCommandTop}>
        <button
          type="button"
          title="ค้นหาข้อมูลลูกค้า (F2)"
          onClick={requestCustomerSearch}
          className={styles.customerCommandSearch}
        >
          <Search size={15} strokeWidth={2.4} />
          <span>{customer ? "เปลี่ยนลูกค้า" : "ค้นหาลูกค้า"}</span>
          <span className={styles.customerCommandShortcut}>F2</span>
        </button>

        {!customer && (
          <button
            type="button"
            title="สมัครสมาชิกลูกค้าใหม่"
            aria-label="สมัครสมาชิกลูกค้าใหม่"
            onClick={requestCustomerRegister}
            className={styles.customerCommandAdd}
          >
            <UserPlus size={15} strokeWidth={2.4} />
          </button>
        )}
      </div>

      {customer && (
        <div className={styles.customerCommandChip}>
          <span className={styles.customerCommandAvatar}>
            <UserRound size={15} strokeWidth={2.3} />
          </span>

          <span className={styles.customerCommandIdentity}>
            <span className={styles.customerCommandName} title={customer.name}>{customer.name}</span>
            <span className={styles.customerCommandSub}>
              <span className={styles.customerCommandCode}>{customer.code || "-"}</span>
              {customer.tel ? <span className={styles.customerCommandTel}>{customer.tel}</span> : null}
            </span>
          </span>

          <span
            className={`${styles.customerCommandTier} ${customer.hasLevelPrice ? styles.customerCommandTierSet : ""}`}
            title={`ระดับราคา : ${customer.levelPrice}`}
          >
            {customer.levelPrice}
          </span>

          <span className={styles.customerCommandPoints} title={`แต้มสะสม : ${customer.points} แต้ม`}>
            {customer.points.toLocaleString("en-US")}
            <small>แต้ม</small>
          </span>

          {alertTitle && (
            <span className={styles.customerCommandAlert} title={alertTitle}>
              <AlertTriangle size={13} strokeWidth={2.5} />
              {customer.allergyCount > 0 ? customer.allergyCount : ""}
            </span>
          )}

          <span className={styles.customerCommandDivider} />

          <button
            type="button"
            title="ติดตามอาการ"
            aria-label="ติดตามอาการ"
            onClick={requestCustomerFollowUp}
            className={styles.customerCommandAction}
          >
            <HeartPulse size={14} strokeWidth={2.3} />
          </button>

          <button
            type="button"
            title="ล้างลูกค้าออกจากบิล"
            aria-label="ล้างลูกค้าออกจากบิล"
            onClick={requestCustomerClear}
            className={`${styles.customerCommandAction} ${styles.customerCommandActionClear}`}
          >
            <X size={14} strokeWidth={2.6} />
          </button>
        </div>
      )}
    </div>
  )
}

export default React.memo(CustomerCommand)
