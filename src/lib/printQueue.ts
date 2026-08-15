// คิวงานพิมพ์ข้ามเครื่องสำหรับแท็บเล็ต Android
//
// แท็บเล็ตไม่มีเครื่องพิมพ์ต่ออยู่ ตัวที่ต่อคือเครื่องเคาน์เตอร์ที่รัน Electron
// ไฟล์นี้เป็นตัวกลาง: แท็บเล็ตส่งงานเข้ามา -> agent ฝั่ง Electron ที่ subscribe อยู่รับไปพิมพ์
// ด้วย printSilent() ตัวเดิม -> รายงานผลกลับมา -> แท็บเล็ตได้รู้ว่าพิมพ์สำเร็จจริงไหม
//
// เก็บในหน่วยความจำของ process เดียวกับ Next server ตามแบบเดียวกับ src/lib/sse.ts
// (งานพิมพ์มีอายุไม่กี่วินาที ไม่ต้องอยู่รอดข้ามการรีสตาร์ท)

export type PrintJobPayload = {
  content: string;
  printerName?: string;
  horizontalOffset?: number;
};

export type PrintJobResult = { success: boolean; error?: string };

type PendingJob = {
  id: string;
  payload: PrintJobPayload;
  resolve: (result: PrintJobResult) => void;
  timer: ReturnType<typeof setTimeout>;
};

type AgentWriter = WritableStreamDefaultWriter<any>;

/** งานพิมพ์ควรเสร็จในไม่กี่วินาที ถ้าเกินนี้แปลว่า agent ค้างหรือหลุดไปแล้ว */
const JOB_TIMEOUT_MS = 30000;

/** agent ที่ subscribe อยู่ — ปกติมีเครื่องเดียวคือเครื่องเคาน์เตอร์ */
let agents: AgentWriter[] = [];

/** งานที่ส่งออกไปแล้วรอผลตอบกลับ */
const pending = new Map<string, PendingJob>();

/** รายชื่อเครื่องพิมพ์ล่าสุดที่ agent รายงานเข้ามา */
let cachedPrinters: any[] = [];
let printersUpdatedAt = 0;

const encoder = new TextEncoder();

function writeEvent(writer: AgentWriter, data: unknown) {
  return writer.write(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
}

/* ------------------------------------------------------------------ agents */

export function addAgent(writer: AgentWriter) {
  agents.push(writer);
}

export function removeAgent(writer: AgentWriter) {
  agents = agents.filter((agent) => agent !== writer);
}

export function hasAgent(): boolean {
  return agents.length > 0;
}

export function getAgentCount(): number {
  return agents.length;
}

/* ---------------------------------------------------------------- printers */

export function setPrinters(printers: any[]) {
  cachedPrinters = Array.isArray(printers) ? printers : [];
  printersUpdatedAt = Date.now();
}

export function getPrinters(): { printers: any[]; updatedAt: number } {
  return { printers: cachedPrinters, updatedAt: printersUpdatedAt };
}

/** ขอให้ agent ส่งรายชื่อเครื่องพิมพ์ล่าสุดกลับมา */
export async function requestPrinterRefresh() {
  await broadcast({ type: "printers:refresh" });
}

async function broadcast(data: unknown) {
  const dead: AgentWriter[] = [];

  await Promise.all(
    agents.map(async (agent) => {
      try {
        await writeEvent(agent, data);
      } catch {
        dead.push(agent);
      }
    }),
  );

  dead.forEach(removeAgent);
}

/* -------------------------------------------------------------------- jobs */

function createJobId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * ส่งงานพิมพ์ให้ agent แล้วรอผลจริง
 * โยน error เมื่อไม่มี agent ต่ออยู่ เพื่อให้แท็บเล็ตเสนอทางเลือกอื่นได้ทันที
 */
export function submitJob(payload: PrintJobPayload): Promise<PrintJobResult> {
  if (!hasAgent()) {
    return Promise.reject(
      new Error(
        "ไม่พบเครื่องพิมพ์ที่เคาน์เตอร์ — ตรวจว่าเปิดโปรแกรมบนเครื่อง Server ในโหมด Server แล้ว",
      ),
    );
  }

  const id = createJobId();

  return new Promise<PrintJobResult>((resolve, reject) => {
    const timer = setTimeout(() => {
      pending.delete(id);
      reject(new Error("เครื่องพิมพ์ที่เคาน์เตอร์ไม่ตอบกลับ (หมดเวลา)"));
    }, JOB_TIMEOUT_MS);

    pending.set(id, { id, payload, resolve, timer });

    broadcast({ type: "print:job", id, payload }).catch(() => {
      clearTimeout(timer);
      pending.delete(id);
      reject(new Error("ส่งงานพิมพ์ไปยังเครื่องเคาน์เตอร์ไม่สำเร็จ"));
    });
  });
}

/** agent เรียกกลับมาบอกผลของงานพิมพ์ */
export function completeJob(id: string, result: PrintJobResult): boolean {
  const job = pending.get(id);
  if (!job) return false;

  clearTimeout(job.timer);
  pending.delete(id);
  job.resolve(result);

  return true;
}
