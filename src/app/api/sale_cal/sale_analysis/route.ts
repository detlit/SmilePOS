import { NextRequest } from 'next/server'
import { receivedQty, saleStockQty } from '@/lib/stockBalance'
import { lotUnitCost } from '@/lib/lotCost'

async function getPrisma() {
  const { prisma } = await import('@/lib/prisma');
  if (!prisma) throw new Error("Prisma is not available during build.");
  return prisma;
}


export async function GET(request: NextRequest) {
  const searchParam = request.nextUrl.searchParams
  const company = searchParam.get('company')
  const startMonth = searchParam.get('startMonth') || ''
  const current = searchParam.get('current') || ''
  const daysParam = searchParam.get('days') || ''
  const sort = searchParam.get('sort') || 'desc'
  const d = new Date(current + "T23:59:59.999+07:00");
  const d1 = new Date(startMonth + "T00:00:00.000+07:00");

  //   console.log(d1)

  const prisma = await getPrisma();
  const get = await prisma.sale.findMany({
    where:
    // whereCondition as any
    {
      company,
      statuss: "OK",
      createDate: {

        lte: d,
        gte: d1,
      },
    }
    ,
    orderBy: {
      id: sort,  //เรียงลำดับ
    } as any,

  })

  const getRC = await prisma.rCitemlist.findMany({
    where:
    // whereCondition as any
    {
      company
    }
    ,
    orderBy: {
      id: sort,  //เรียงลำดับ
    } as any,

  })

  const getDatalist = await prisma.datalist.findMany({
    where: {
      company
    }
  })

  // ดึงยอดขายทั้งหมด (ไม่จำกัดช่วงเวลา) สำหรับคำนวณยอดคงเหลือแบบเดียวกับหน้าสรุปยอดคงเหลือ
  const allSales = await prisma.sale.findMany({
    where: { company, statuss: "OK" },
    select: { code_product: true, qty: true, subqty: true }
  })

  // ดึง StockTransaction เพื่อคำนวณยอดคงเหลือแบบเดียวกับหน้าสรุปยอดคงเหลือ
  const stockTransactions = await prisma.stockTransaction.findMany({
    where: { company },
    select: { itemcode: true, transaction_type: true, quantity_change: true }
  })

  // Pre-compute balance per product (สูตรเดียวกับ stock-balance-summary)
  const balanceMap = new Map<string, number>()
  // 1) รวมยอดรับจาก RCitemlist (ไม่นับรายการ "โอนสินค้า" เพราะนับใน TRANSFER_IN แล้ว)
  for (const rc of getRC) {
    if ((rc as any).statuss === "โอนสินค้า") continue;
    const code = String(rc.itemcode)
    balanceMap.set(code, (balanceMap.get(code) || 0) + receivedQty(rc as any)) // นับ qty + ของแถม (freebaht)
  }
  // 2) หักยอดขายจาก Sale ทั้งหมด (ใช้ subqty ถ้ามี, ไม่งั้นใช้ qty)
  for (const s of allSales) {
    const code = String((s as any).code_product)
    balanceMap.set(code, (balanceMap.get(code) || 0) - saleStockQty(s as any))
  }
  // 3) รวม StockTransaction (โอนออก, โอนเข้า, ปรับยอด)
  for (const tx of stockTransactions) {
    const code = String(tx.itemcode)
    const type = (tx.transaction_type || '').toUpperCase()
    const qtyChange = tx.quantity_change || 0
    if (type === 'TRANSFER_OUT') {
      balanceMap.set(code, (balanceMap.get(code) || 0) - Math.abs(qtyChange))
    } else if (type === 'TRANSFER_IN') {
      balanceMap.set(code, (balanceMap.get(code) || 0) + Math.abs(qtyChange))
    } else if (type === 'ADJUST') {
      balanceMap.set(code, (balanceMap.get(code) || 0) + qtyChange)
    }
  }

  const db = prisma as any;
  const getPendingOrders = await db.orderDetail.findMany({
    where: {
      status: "Pending",
      orderMain: {
        company: company
      }
    },
    select: {
      itemcode: true
    }
  })
  const pendingProductCodes = new Set(getPendingOrders.map((o: any) => o.itemcode))
  /********************************************************** */
  type AnyObject = Record<string, any>;

  /**
   * ลบข้อมูลซ้ำใน array ของ object โดยอิงตามหลาย key
   * @param arr - array ของ object
   * @param keys - รายชื่อ key ที่ต้องการใช้ตรวจซ้ำ
   */
  function uniqueByKeys<T extends AnyObject>(arr: T[], keys: (keyof T)[]): T[] {
    return [
      ...new Map(
        arr.map(item => [
          keys.map(k => String(item[k])).join("|"), // รวมค่าของ keys เป็น unique key
          item
        ])
      ).values()
    ];
  }
  const resRC1 = uniqueByKeys(getRC, ["itemcode", "namevender"]);
  // ใบเสนอราคาต่อผู้ขายที่ส่งกลับไปแสดงในหน้าสั่งซื้อ — ทับ newCost ด้วย "ทุนสุทธิหลังหักส่วนลด"
  // เพื่อให้ทั้งการเรียงหาผู้ขายที่ถูกที่สุดและตัวเลขที่แสดงบนหน้าจอเป็นทุนที่จ่ายจริง
  // (หน้าสั่งซื้ออ่านฟิลด์ชื่อ newCost อยู่แล้ว จึงไม่ต้องแก้ฝั่งหน้าจอ — ดู src/lib/lotCost.ts)
  const resRC = resRC1
    .map((rc: any) => ({ ...rc, newCost: lotUnitCost(rc) }))
    .sort((a: any, b: any) => a.newCost - b.newCost)

  //  console.log(res)
  /***************************************************************** */
  const diffInMs = d.getTime() - d1.getTime();
  const diffInDays = daysParam ? Number(daysParam) : Math.round(diffInMs / (1000 * 60 * 60 * 24));
  // console.log(diffInDays)


  var result: String[] = [];

  get.reduce(function (res: any, value: any, name: any) {
    if (!res[value.code_product]) {
      res[value.code_product] = { Id: value.code_product, total: 0, qty: 0 };
      result.push(res[value.code_product]);

    }
    res[value.code_product].id = value.id;
    res[value.code_product].code = value.code_product;
    res[value.code_product].name = value.name_product;
    res[value.code_product].total += value.total;
    // นับเป็น "หน่วยสต็อก" (subqty) ไม่ใช่ qty ดิบ — ขาย 1 กล่อง (3 ซอง) ต้องนับ 3 ซอง
    // ไม่งั้นจะเอากล่องไปบวกกับซอง และ avg ที่ใช้คำนวณจำนวนสั่งซื้อจะต่ำกว่าจริง
    res[value.code_product].qty += saleStockQty(value);
    res[value.code_product].balance = balanceMap.get(String(value.code_product)) || 0;
    res[value.code_product].avg = (Number(res[value.code_product].qty) / (Number(diffInDays))).toFixed(2);
    res[value.code_product].rc = resRC.filter((a: any) => a.itemcode === value.code_product).slice(0, 3);
    res[value.code_product].isPending = pendingProductCodes.has(String(value.code_product));
    const dlItem = getDatalist.find((d: any) => d.code === String(value.code_product));
    res[value.code_product].Min = dlItem?.Min ?? 0;
    res[value.code_product].Max = dlItem?.Max ?? 0;
    res[value.code_product].ROP = dlItem?.ROP ?? 0;
    return res;
  }, {});

  const filteredResult = result.filter((item: any) => {
    const product = getDatalist.find((d: any) => d.code === String(item.code));
    return product?.Show?.toLowerCase() === 'false';
  });

  const ranksales = filteredResult.sort((a: any, b: any) => {
    // 1. Sort by Balance (Ascending: Low -> High)
    if (a.balance !== b.balance) {
      return a.balance - b.balance;
    }
    // 2. Sort by Total Sales (Descending: High -> Low)
    return b.total - a.total;
  });

  // เพิ่มเลขลำดับ (เริ่มจาก 1)
  const withIndex = ranksales.map((item: any, index: any) => ({
    ...item,
    no: index + 1
  }));

  const ranksaleE = withIndex.slice(0, 2000)
  const ranksale = ranksaleE.filter((s: any) => s.Id != null)


  console.log(ranksale)
  return Response.json(ranksale)

}