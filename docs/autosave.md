# Git Autosave — สำรองงานขึ้น GitHub อัตโนมัติทุก 30 นาที

สำรอง snapshot ของโปรเจกต์ขึ้น GitHub เป็นระยะ เพื่อกันงานหายจากไฟดับ / ดิสก์เสีย / แก้พังแล้วย้อนไม่ได้

## หลักการออกแบบ

ข้อกำหนดข้อแรกคือ **ต้องไม่รบกวนงานที่กำลังทำอยู่** สคริปต์จึงไม่ใช้ `git commit` ตามปกติ
แต่ใช้ plumbing command สร้าง commit ขึ้นมาตรง ๆ

| ของที่คุณใช้อยู่ | autosave แตะไหม |
|---|---|
| staging area (`git add` ที่คุณทำค้างไว้) | ❌ ไม่แตะ — ใช้ index ชั่วคราวคนละไฟล์ |
| working tree / ไฟล์ในเครื่อง | ❌ ไม่แตะ — ไม่มี checkout, stash, reset |
| branch ที่คุณอยู่ + HEAD | ❌ ไม่แตะ — เขียน `refs/heads/autosave/<เครื่อง>` ตรง ๆ |
| ประวัติบน `main` | ❌ ไม่แตะ — autosave อยู่คนละ branch |

ลำดับการทำงาน:

```
git read-tree     ← เริ่ม index ชั่วคราวจาก commit ล่าสุด
git add -A        ← stage ลง index ชั่วคราว (เคารพ .gitignore)
git write-tree    ← ได้ tree hash
   └─ ถ้า tree เท่าเดิม = ไม่มีอะไรเปลี่ยน → จบ ไม่ commit
git commit-tree   ← สร้าง commit object
git update-ref    ← เลื่อน branch autosave
git push          ← ส่งขึ้น GitHub (retry 3 ครั้ง)
```

## ติดตั้ง

```powershell
powershell -ExecutionPolicy Bypass -File scripts\install-autosave-task.ps1
```

สร้าง Windows Scheduled Task ชื่อ `SmileStore-GitAutosave` รันทุก 30 นาที
ไม่ต้องเป็น Administrator และไม่ต้องเก็บรหัสผ่าน (ทำงานตอนล็อกอินอยู่เท่านั้น)

เปลี่ยนความถี่ / ถอนการติดตั้ง:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\install-autosave-task.ps1 -IntervalMinutes 15
powershell -ExecutionPolicy Bypass -File scripts\install-autosave-task.ps1 -Uninstall
```

## คำสั่งที่ใช้บ่อย

ทางลัดผ่าน npm:

```powershell
npm run autosave        # สำรองเดี๋ยวนี้
npm run autosave:dry    # ลองดูว่าจะเก็บอะไร โดยไม่ push จริง
npm run autosave:log    # ดู log 30 บรรทัดล่าสุด
```

## บันทึกเอง (manual save)

ใช้เมื่อทำงานเสร็จเป็นช่วง ๆ ต้องการ commit และ push ไปยัง branch ปัจจุบันทันที:

```powershell
npm run save -- "feat: ปรับปรุงหน้าขายยา"
```

ถ้าไม่ส่งข้อความ ระบบจะสร้างข้อความตามเวลาปัจจุบันให้อัตโนมัติ
ถ้าต้องการ commit ไว้ในเครื่องก่อนโดยยังไม่ push:

```powershell
npm run save -- "จัดเก็บงานระหว่างวัน" -NoPush
```

manual save ใช้ `.gitignore` และกฎป้องกันไฟล์ต้องห้ามชุดเดียวกับ autosave

แบบเต็ม:

```powershell
# สั่งสำรองเดี๋ยวนี้
Start-ScheduledTask -TaskName 'SmileStore-GitAutosave'

# ดูว่ารันครั้งล่าสุดเมื่อไหร่ / ผลเป็นยังไง
Get-ScheduledTaskInfo -TaskName 'SmileStore-GitAutosave'

# ดู log
Get-Content "$env:LOCALAPPDATA\SmileStoreAutosave\autosave.log" -Tail 30

# ทดสอบโดยไม่ push จริง
powershell -ExecutionPolicy Bypass -File scripts\git-autosave.ps1 -DryRun
```

## กู้งานคืน

```powershell
# ดูรายการ snapshot
git log --oneline autosave/$env:COMPUTERNAME

# ดึงไฟล์เดียวกลับมาจาก snapshot
git checkout <commit> -- path/to/file.tsx

# เทียบว่างานตอนนี้ต่างจาก snapshot ยังไง
git diff autosave/$env:COMPUTERNAME
```

## ด่านความปลอดภัย

สคริปต์จะ **ยกเลิกทั้งรอบ** (ไม่ commit ไม่ push) เมื่อเจอกรณีเหล่านี้ แล้วเขียนลง log:

1. **ไฟล์ต้องห้ามหลุดเข้า staging** — `.env`, `pg-data/`, `backups/`, `data/`, `uploads/`,
   `*.dump`, `*.sqlite`, `*.pem`, `*.key`, `auto_backup_*.json`
   (ด่านที่สองถัดจาก `.gitignore` เผื่อมีคนแก้ `.gitignore` ผิด)
2. **ไฟล์ใหญ่เกิน 90 MB** — GitHub ไม่รับไฟล์เกิน 100 MB
3. **repo อยู่ระหว่าง merge / rebase / cherry-pick / bisect** — state ไม่นิ่ง ข้ามรอบไปก่อน
4. **รอบก่อนยังทำงานค้าง** — lock file กันรันซ้อน

กรณี push ไม่ผ่าน (เน็ตหลุด) ถือว่าไม่ร้ายแรง — commit ถูกเก็บไว้ในเครื่องแล้ว รอบถัดไปจะ push ให้เอง

## ⚠️ สิ่งที่ autosave ไม่ได้สำรองให้

`.gitignore` กันข้อมูลลูกค้าไว้โดยตั้งใจ ของพวกนี้ **ไม่มีอยู่บน GitHub**:

- `pg-data/` — ฐานข้อมูล PostgreSQL
- `data/`, `uploads/` — backup และไฟล์เอกสารลูกค้า
- `.env` — ข้อมูลลับ

ฐานข้อมูลต้องสำรองแยกต่างหาก (repo นี้เก็บแค่ซอร์สโค้ด)
