Thai SmartCard Agent
====================

Local HTTP bridge สำหรับเครื่องอ่านบัตรประชาชน (PC/SC) เช่น Zoweetek Zw-12026-3
รันที่ http://127.0.0.1:8182 ให้เว็บ POS เรียกใช้

โครงสร้าง
---------
  agent.js        - ตัวจริง อ่านบัตรผ่าน pcsclite
  mock-agent.js   - ตัวปลอม (ทดสอบฝั่งเว็บ ไม่ต้องเสียบเครื่องอ่าน)
  start.bat       - ดับเบิลคลิกรันตัวจริง (จะลง dependencies อัตโนมัติครั้งแรก)
  start-mock.bat  - ดับเบิลคลิกรัน mock

ความต้องการ (สำหรับตัวจริง agent.js)
-----------
  1. Node.js 18 ขึ้นไป  https://nodejs.org/
  2. Visual Studio Build Tools 2022 + Python (สำหรับ build native module pcsclite)
     ติดตั้งง่ายสุด:  npm install --global windows-build-tools
     หรือดาวน์โหลด: https://visualstudio.microsoft.com/visual-cpp-build-tools/
  3. Smart Card service ของ Windows ทำงานอยู่ (Get-Service SCardSvr ต้อง Running)

ใช้งาน
------
  ดับเบิลคลิก start.bat
  จะเห็นข้อความ:
    Thai SmartCard Agent running
      Listen : http://127.0.0.1:8182
      Health : http://127.0.0.1:8182/ping
      Read   : http://127.0.0.1:8182/read

  จากนั้นเปิดเว็บ POS -> หน้าตั้งค่า -> เครื่องอ่านบัตรประชาชน
  ระบบจะตรวจพบและเชื่อมต่ออัตโนมัติ

ทดสอบเร็ว ๆ ด้วย PowerShell
---------------------------
  curl.exe http://127.0.0.1:8182/ping
  curl.exe http://127.0.0.1:8182/read

หากติดตั้ง pcsclite ไม่ผ่าน
---------------------------
  ลองใช้ตัว fallback:
    npm uninstall @pokusew/pcsclite
    npm install pcsclite
  agent.js จะ fallback ให้อัตโนมัติ
