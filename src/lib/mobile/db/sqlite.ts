// การเชื่อมต่อ SQLite ในเครื่อง (Android) — ชั้นล่างสุดของ data layer ฝั่งมือถือ
//
// ทุกอย่างเหนือขึ้นไป (migrate, prismaLite, route handler เดิม) คุยผ่านอินเทอร์เฟซ SqliteDriver
// ตัวเดียวนี้ ทำให้สลับ backend ได้โดยไม่กระทบโค้ดส่วนอื่น:
//   - Android/iOS -> @capacitor-community/sqlite (ไฟล์จริงในเครื่อง)
//   - เบราว์เซอร์ตอน dev -> jeep-sqlite (sql.js + IndexedDB) ถ้าติดตั้งไว้
//
// หมายเหตุเรื่อง transaction: ปลั๊กอินจะ auto-commit ทุก run() ถ้าไม่บอกเป็นอย่างอื่น
// เวลาอยู่ใน transaction ของเราเองจึงต้องส่ง transaction=false ไปด้วยทุกครั้ง
// ไม่งั้นคำสั่งข้างในจะถูก commit ทีละคำสั่งและ rollback ไม่ได้จริง

export const DB_NAME = "smilepos"

export type SqlValue = string | number | null

export interface SqliteDriver {
  /** คำสั่งที่คืนแถว (SELECT) */
  query<T = any>(sql: string, params?: SqlValue[]): Promise<T[]>
  /** คำสั่งที่ไม่คืนแถว (INSERT/UPDATE/DELETE) */
  run(sql: string, params?: SqlValue[]): Promise<{ changes: number; lastId: number }>
  /** DDL หลายคำสั่งรวดเดียว */
  executeScript(sql: string): Promise<void>
  beginTransaction(): Promise<void>
  commitTransaction(): Promise<void>
  rollbackTransaction(): Promise<void>
  close(): Promise<void>
}

let driverPromise: Promise<SqliteDriver> | null = null

/**
 * ใส่ driver จากภายนอก — ใช้ตอนทดสอบบน Node (scripts/test-prisma-lite.ts) ซึ่งไม่มีปลั๊กอิน
 * Capacitor ให้เรียก ทำให้ตรวจความถูกต้องของ prismaLite ได้โดยไม่ต้องมีเครื่อง Android
 */
export function setDriver(driver: SqliteDriver): void {
  driverPromise = Promise.resolve(driver)
}

/** เปิดฐานข้อมูล (ครั้งแรกจะสร้างไฟล์ให้) — เรียกซ้ำได้ ใช้ connection เดิมเสมอ */
export function getDriver(): Promise<SqliteDriver> {
  if (!driverPromise) {
    driverPromise = createDriver().catch((err) => {
      // ไม่ cache ความล้มเหลว ไม่งั้นพลาดครั้งเดียวแล้วแอปพังถาวรจนกว่าจะปิดแอป
      driverPromise = null
      throw err
    })
  }
  return driverPromise
}

/** ปิดและลืม connection — ใช้ตอน restore ไฟล์ฐานข้อมูลทับ */
export async function resetDriver(): Promise<void> {
  const current = driverPromise
  driverPromise = null
  if (!current) return
  try {
    const driver = await current
    await driver.close()
  } catch {
    // ปิดไม่ได้ก็ปล่อย — ตัวใหม่จะเปิด connection ใหม่อยู่แล้ว
  }
}

async function createDriver(): Promise<SqliteDriver> {
  const { CapacitorSQLite, SQLiteConnection } = await import("@capacitor-community/sqlite")
  const isNative = Boolean((window as any).Capacitor?.isNativePlatform?.())

  const connection = new SQLiteConnection(CapacitorSQLite)

  if (!isNative) {
    // เบราว์เซอร์: ปลั๊กอินต้องมี custom element <jeep-sqlite> อยู่ใน DOM ก่อน
    await initWebStore(connection)
  }

  // แอปอาจถูก reload (live reload ตอน dev) โดยที่ปลั๊กอินฝั่ง native ยังจำ connection เดิมไว้
  // สองบรรทัดนี้กันไม่ให้ createConnection ระเบิดเพราะชื่อซ้ำ
  await connection.checkConnectionsConsistency().catch(() => undefined)
  const already = await connection.isConnection(DB_NAME, false).catch(() => ({ result: false }))

  const db = already?.result
    ? await connection.retrieveConnection(DB_NAME, false)
    : await connection.createConnection(DB_NAME, false, "no-encryption", 1, false)

  await db.open()

  // เปิด foreign key + WAL เพื่อให้เขียนเร็วขึ้นและ onDelete ทำงานจริง
  await db.execute("PRAGMA foreign_keys = ON;").catch(() => undefined)
  if (isNative) {
    await db.execute("PRAGMA journal_mode = WAL;").catch(() => undefined)
  }

  return {
    async query<T = any>(sql: string, params: SqlValue[] = []): Promise<T[]> {
      const res = await db.query(sql, params as any[])
      return (res.values || []) as T[]
    },

    async run(sql: string, params: SqlValue[] = []) {
      // transaction=false เสมอ เพราะ transaction จัดการเองที่ชั้นบน (prismaLite.$transaction)
      const res = await db.run(sql, params as any[], false)
      return {
        changes: res.changes?.changes ?? 0,
        lastId: res.changes?.lastId ?? 0,
      }
    },

    async executeScript(sql: string) {
      await db.execute(sql, false)
    },

    async beginTransaction() {
      await db.beginTransaction()
    },

    async commitTransaction() {
      await db.commitTransaction()
    },

    async rollbackTransaction() {
      await db.rollbackTransaction()
    },

    async close() {
      try {
        await db.close()
      } finally {
        await connection.closeConnection(DB_NAME, false).catch(() => undefined)
      }
    },
  }
}

/**
 * เตรียม jeep-sqlite สำหรับรันในเบราว์เซอร์ตอน dev
 * ไม่ได้ติดตั้งไว้ก็ไม่เป็นไร — โยน error ที่อ่านรู้เรื่องแทนที่จะพังแบบงง ๆ
 */
async function initWebStore(connection: any): Promise<void> {
  try {
    const jeep = await import(/* webpackIgnore: true */ "jeep-sqlite/loader" as any)
    await jeep.defineCustomElements(window)

    if (!document.querySelector("jeep-sqlite")) {
      const el = document.createElement("jeep-sqlite")
      document.body.appendChild(el)
    }
    await customElements.whenDefined("jeep-sqlite")
    await connection.initWebStore()
  } catch (err) {
    throw new Error(
      "SQLite ในเบราว์เซอร์ต้องติดตั้ง jeep-sqlite ก่อน (npm i jeep-sqlite) — " +
        "บนแอป Android จริงไม่ต้องใช้ตัวนี้: " +
        (err instanceof Error ? err.message : String(err))
    )
  }
}

/** เบราว์เซอร์เท่านั้น: บันทึกฐานข้อมูลลง IndexedDB (native เขียนลงไฟล์ให้อยู่แล้ว) */
export async function saveWebStore(): Promise<void> {
  // ไม่มี window = รันอยู่บน Node (ตอนทดสอบ) — ไม่มีอะไรต้องบันทึก
  if (typeof window === "undefined") return
  if ((window as any).Capacitor?.isNativePlatform?.()) return
  try {
    const { CapacitorSQLite, SQLiteConnection } = await import("@capacitor-community/sqlite")
    await new SQLiteConnection(CapacitorSQLite).saveToStore(DB_NAME)
  } catch {
    // ไม่ critical — ข้อมูลยังอยู่ใน memory ของ session ปัจจุบัน
  }
}
