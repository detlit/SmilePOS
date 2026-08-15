import VideoCallRoom from "./VideoCallRoom"

/**
 * roomId ถูกสร้างตอนผู้ใช้เริ่มโทร จึงไม่มีทางรู้ล่วงหน้าตอน build
 *
 *   - build โหมด web/Electron: คืนอาร์เรย์ว่าง = ไม่ prerender อะไรเลย
 *     ห้องทุกห้องยัง render ตอนเรียกใช้ตามปกติ (dynamicParams ค่าเริ่มต้นเป็น true)
 *
 *   - build โหมด mobile (output: export): Next ถือว่าอาร์เรย์ว่าง = "ไม่ได้ประกาศ"
 *     แล้ว build ไม่ผ่าน จึงต้องคืนค่าหลอกไว้หนึ่งค่าให้ผ่านขั้นตอนนี้
 *     ไม่กระทบการใช้งานจริง เพราะวิดีโอคอลต้องมี signaling server อยู่แล้ว
 *     จึงไม่ใช่ฟีเจอร์ที่ใช้ได้ในโหมดออฟไลน์
 */
export function generateStaticParams() {
  return process.env.BUILD_TARGET === "mobile" ? [{ roomId: "offline" }] : []
}

export default function VideoCallPage({ params }: { params: Promise<{ roomId: string }> }) {
  return <VideoCallRoom params={params} />
}
