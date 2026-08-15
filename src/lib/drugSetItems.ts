// ทำข้อมูล "สินค้าในชุดยา" ให้เป็นรูปแบบเดียวกันก่อนบันทึกลง DrugSetItem
// ใช้ร่วมกันทั้ง POST /api/drug-set และ PUT /api/drug-set/[id] เพื่อไม่ให้ logic แตกกัน
//
// กติกาสำคัญ
// - เลือกหน่วยแปลง (UnitConversion) ได้ → unit/saleUnit ยึดหน่วยขายของหน่วยแปลง, subQty = จำนวนหน่วยย่อยต่อ 1 หน่วยขาย
// - qty เป็นทศนิยมได้ (เช่น 0.5 แผง)
// - priceOverride = ราคาขายที่ผู้ใช้กำหนดเองเฉพาะชุดนี้ (null = ใช้ราคาปกติตอนขาย)

export const drugSetProductSelect = {
  id: true,
  code: true,
  ProductName: true,
  Barcode: true,
  Unit: true,
  price: true,
  wholesaleprice: true,
  online: true,
  PriceA: true,
  PriceB: true,
  CostActual: true,
  fixname: true,
  group: true,
  Category: true,
  Show: true,
}

export const drugSetInclude = {
  items: {
    orderBy: { sortOrder: 'asc' as const },
    include: { product: { select: drugSetProductSelect } },
  },
}

export const cleanText = (value: unknown) => String(value ?? '').trim()

export const normalizeStatus = (value: unknown) => cleanText(value) || 'active'

// จำนวนในชุดเป็นทศนิยมได้ แต่ต้องมากกว่า 0 เสมอ
const cleanQty = (value: unknown) => {
  const qty = Number(value)
  return Number.isFinite(qty) && qty > 0 ? qty : 1
}

const cleanSubQty = (value: unknown) => {
  const subQty = Number(value)
  return Number.isFinite(subQty) && subQty > 0 ? subQty : 1
}

// null = ไม่กำหนดราคาเอง (ให้หน้าขายคิดราคาปกติตามระดับราคา)
const cleanPriceOverride = (value: unknown) => {
  if (value === null || value === undefined || value === '') return null
  const price = Number(value)
  return Number.isFinite(price) && price >= 0 ? price : null
}

export async function normalizeDrugSetItems(prisma: any, rawItems: any[]): Promise<any[]> {
  const sourceItems = Array.isArray(rawItems) ? rawItems : []

  const productIds = [...new Set(sourceItems
    .map((item) => Number(item.productId ?? item.id_product ?? item.id))
    .filter((id) => Number.isFinite(id) && id > 0))]
  const products = productIds.length > 0
    ? await prisma.datalist.findMany({ where: { id: { in: productIds } }, select: drugSetProductSelect })
    : []
  const productById = new Map<number, any>(products.map((product: any) => [Number(product.id), product]))

  const unitConversionIds = [...new Set(sourceItems
    .map((item) => Number(item.unitConversionId))
    .filter((id) => Number.isFinite(id) && id > 0))]
  const unitConversions = unitConversionIds.length > 0
    ? await prisma.unitConversion.findMany({ where: { id: { in: unitConversionIds } } })
    : []
  const unitConversionById = new Map<number, any>(unitConversions.map((uc: any) => [Number(uc.id), uc]))

  const normalizedItems: any[] = []
  sourceItems.forEach((item, index) => {
    const productId = Number(item.productId ?? item.id_product ?? item.id)
    const product = productById.get(productId)
    if (!product && (!Number.isFinite(productId) || productId <= 0)) return

    const rawUnitConversionId = Number(item.unitConversionId)
    const unitConversion = Number.isFinite(rawUnitConversionId) && rawUnitConversionId > 0
      ? unitConversionById.get(rawUnitConversionId)
      : null
    // หน่วยแปลงต้องเป็นของสินค้าตัวเดียวกันเท่านั้น ไม่งั้นถือว่าใช้หน่วยฐาน
    const productCode = cleanText(product?.code ?? item.code ?? item.code_product)
    const usableUnitConversion = unitConversion && cleanText(unitConversion.productCode) === productCode
      ? unitConversion
      : null

    const subQty = usableUnitConversion ? cleanSubQty(usableUnitConversion.subQty) : 1
    const saleUnit = usableUnitConversion ? cleanText(usableUnitConversion.saleUnit) : ''
    const baseUnit = cleanText(product?.Unit ?? item.unit ?? item.Unit)
    const priceOverride = cleanPriceOverride(item.priceOverride)

    // ราคา/ทุนที่เก็บไว้ใช้แสดงผลและสรุปยอดในหน้าจัดชุด (หน้าขายจะคิดใหม่ตามระดับราคาถ้าไม่ได้กำหนดราคาเอง)
    const productPrice = Number(product?.price ?? item.salePrice ?? item.price ?? 0) || 0
    const unitPrice = usableUnitConversion ? Number(usableUnitConversion.priceRetail ?? 0) || 0 : 0
    // หน่วยแปลงที่ยังไม่ได้ตั้งราคาขาย → ประมาณจากราคาหน่วยฐาน x subQty แทนการเก็บ 0
    const basePrice = usableUnitConversion ? (unitPrice > 0 ? unitPrice : productPrice * subQty) : productPrice
    const baseCost = (Number(product?.CostActual ?? item.cost ?? item.CostActual ?? 0) || 0) * subQty

    normalizedItems.push({
      productId: product ? Number(product.id) : productId,
      code: productCode,
      name: cleanText(product?.ProductName ?? item.name ?? item.ProductName ?? item.name_product),
      fixname: cleanText(product?.fixname ?? item.fixname),
      drugGroup: cleanText(product?.group ?? item.drugGroup ?? item.group),
      barcode: usableUnitConversion
        ? cleanText(usableUnitConversion.Barcode || product?.Barcode || item.barcode)
        : cleanText(product?.Barcode ?? item.barcode ?? item.Barcode),
      unit: saleUnit || baseUnit,
      unitConversionId: usableUnitConversion ? Number(usableUnitConversion.id) : null,
      saleUnit,
      subQty,
      qty: cleanQty(item.qty),
      priceOverride,
      salePrice: priceOverride !== null ? priceOverride : basePrice,
      cost: baseCost,
      sortOrder: Number.isFinite(Number(item.sortOrder)) ? Number(item.sortOrder) : index,
    })
  })
  return normalizedItems
}
