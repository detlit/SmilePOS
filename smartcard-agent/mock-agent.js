/*
 * Mock agent - ใช้ทดสอบระบบฝั่งเว็บ โดยไม่ต้องเสียบเครื่องอ่านบัตรจริง
 * Run: node mock-agent.js
 */
const http = require("http");

const mockData = {
  cid: "1100800123456",
  titleTH: "นาย",
  firstNameTH: "สมชาย",
  lastNameTH: "ใจดี",
  fullNameTH: "นาย สมชาย ใจดี",
  titleEN: "Mr.",
  firstNameEN: "Somchai",
  lastNameEN: "Jaidee",
  birthDate: "25250115", // YYYYMMDD พ.ศ.
  gender: "1",
  address: "123 หมู่ 1 ต.บางรัก อ.บางรัก จ.กรุงเทพมหานคร",
  issueDate: "25630101",
  expireDate: "25730101",
  photo: "",
};

const PORT = 8182;

http.createServer((req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Cache-Control", "no-store");

  if (req.method === "OPTIONS") { res.statusCode = 204; res.end(); return; }

  if (req.url === "/ping") {
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ ok: true, name: "mock-agent", readers: ["Mock Reader"] }));
    return;
  }
  if (req.url === "/read") {
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(JSON.stringify(mockData));
    return;
  }
  res.statusCode = 404;
  res.end("Not Found");
}).listen(PORT, "127.0.0.1", () => {
  console.log(`Mock SmartCard agent on http://127.0.0.1:${PORT}`);
  console.log("  GET /ping , GET /read");
});
