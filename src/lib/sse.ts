let clients: WritableStreamDefaultWriter<any>[] = [];
let latestOrder: any[] = [];
let latestSummary: any = null;

// เพิ่ม client
export function addClient(writer: WritableStreamDefaultWriter<any>) {
  clients.push(writer);
}

// ลบ client
export function removeClient(writer: WritableStreamDefaultWriter<any>) {
  clients = clients.filter(c => c !== writer);
}

// ส่งข้อมูลไปทุก client
export function sendAll(data: any) {
  console.log("Sending to clients:", data, "clients:", clients.length);
  clients.forEach(writer => {
    try {
      writer.write(`data: ${JSON.stringify(data)}\n\n`);
    } catch (err) {
      console.error("Failed to send to client:", err);
    }
  });
}

// อัปเดต order
export function updateOrder(order: any[]) {
  latestOrder = order;
  sendAll({ type: "order", data: latestOrder });
}

// อัปเดต summary
export function updateSummary(summary: any) {
  latestSummary = summary;
  sendAll({ type: "summary", data: latestSummary });
}

// อัปเดตสต็อกเรียลไทม์
export function notifyStockChange(itemcode: string) {
  sendAll({ type: "stock_update", itemcode });
}

// คืนค่าล่าสุด
export function getLatestOrder() {
  return latestOrder;
}

export function getLatestSummary() {
  return latestSummary;
}
