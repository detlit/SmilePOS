import type { PriceTier } from "./priceTier";

/**
 * ราคาขายของสินค้าตามระดับราคาที่ระบุ (ราคาสมาชิกที่ยังไม่ตั้งค่า → ใช้ราคาหน้าร้าน)
 *
 * ย้ายมาไว้ที่นี่เพื่อให้ "ราคาที่แสดงบนการ์ดสินค้า" (โหมดร้านอาหาร/คาเฟ่)
 * กับ "ราคาที่ถูกเพิ่มลงบิลจริง" ใน body_sale.tsx ใช้สูตรเดียวกันเสมอ
 */
export const productPriceByTier = (product: any, tier: PriceTier): number => {
  if (!product) return 0;
  switch (tier) {
    case "ขายส่ง": return Number(product.wholesaleprice || 0);
    case "สมาชิก": return Number(product.online || 0) > 0 ? Number(product.online) : Number(product.price || 0);
    case "ราคา A": return Number(product.PriceA || 0);
    case "ราคา B": return Number(product.PriceB || 0);
    case "ราคา C": return Number(product.PriceC || 0);
    case "ราคา D": return Number(product.PriceD || 0);
    case "ราคา E": return Number(product.PriceE || 0);
    case "ราคา F": return Number(product.PriceF || 0);
    case "ราคา G": return Number(product.PriceG || 0);
    case "ราคา H": return Number(product.PriceH || 0);
    default: return Number(product.price || 0);
  }
};

/** ราคาขายของหน่วยแปลงตามระดับราคาที่ระบุ (UnitConversion ใช้ priceRetail เป็นราคาหน้าร้าน) */
export const unitConversionPriceByTier = (unitConv: any, tier: PriceTier): number => {
  if (!unitConv) return 0;
  switch (tier) {
    case "ขายส่ง": return Number(unitConv.priceWholesale || 0);
    case "สมาชิก": return Number(unitConv.priceOnline || 0) > 0 ? Number(unitConv.priceOnline) : Number(unitConv.priceRetail || 0);
    case "ราคา A": return Number(unitConv.priceA || 0);
    case "ราคา B": return Number(unitConv.priceB || 0);
    case "ราคา C": return Number(unitConv.priceC || 0);
    case "ราคา D": return Number(unitConv.priceD || 0);
    case "ราคา E": return Number(unitConv.priceE || 0);
    case "ราคา F": return Number(unitConv.priceF || 0);
    case "ราคา G": return Number(unitConv.priceG || 0);
    case "ราคา H": return Number(unitConv.priceH || 0);
    default: return Number(unitConv.priceRetail || 0);
  }
};
