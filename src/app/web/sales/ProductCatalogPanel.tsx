'use client'

/**
 * แผงเลือกสินค้าแบบร้านอาหาร/ร้านกาแฟ — กดเลือก "หมวดสินค้า" แล้วกดการ์ดสินค้าเพื่อเพิ่มลงบิล
 *
 * ออกแบบให้ใช้กับจอสัมผัส: ปุ่มใหญ่ กดง่าย เห็นราคาชัด และไม่ต้องพิมพ์
 * แต่ยังมีช่องค้นหาในแผงไว้ตอนสินค้าเยอะ (การสแกนบาร์โค้ด/ค้นหาหลักยังอยู่ที่แถบบนเหมือนเดิม)
 */

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Image as ImageIcon, LayoutGrid, Search, X } from 'lucide-react'
import styles from "../componant/mystyle.module.css"
import { normalizePriceTier, type PriceTier } from "./priceTier"
import { productPriceByTier } from "./salePricing"

/** หมวดของสินค้าที่ยังไม่ได้ระบุหมวดไว้ในข้อมูลสินค้า */
const UNCATEGORIZED = "ไม่ระบุหมวด"
/** จำนวนการ์ดที่แสดงรอบแรก — กดปุ่มด้านล่างเพื่อแสดงเพิ่ม (กันหน่วงตอนสินค้าหลักพันรายการ) */
const PAGE_SIZE = 60

const isHidden = (p: any) =>
  p?.Show === "True" || p?.Show === "true" || p?.Show === "TRUE"

const categoryOf = (p: any) => {
  const raw = String(p?.Category ?? "").trim()
  return raw === "" ? UNCATEGORIZED : raw
}

const formatPrice = (n: number) =>
  Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })

type Props = {
  /** รายการสินค้าทั้งหมดที่โหลดไว้แล้วในหน้าขาย */
  products: any[]
  /** ระดับราคาปัจจุบัน — ราคาบนการ์ดต้องตรงกับราคาที่เพิ่มลงบิล */
  priceTier: PriceTier | string
  /** จำนวนของสินค้าแต่ละตัวที่อยู่ในบิลตอนนี้ (id สินค้า → จำนวนรวมทุกหน่วย) */
  cartQtyByProductId: Map<number, number>
  /** กดการ์ด = เพิ่มสินค้าลงบิล 1 หน่วย */
  onPick: (product: any) => void
  /** ปิดการกดชั่วคราว (เช่น ระหว่างอยู่หน้าชำระเงิน) */
  disabled?: boolean
}

function ProductCatalogPanel({ products, priceTier, cartQtyByProductId, onPick, disabled = false }: Props) {
  const [activeCategory, setActiveCategory] = useState<string>("")   // "" = ทั้งหมด
  const [search, setSearch] = useState("")
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [brokenImages, setBrokenImages] = useState<Set<string>>(() => new Set())
  const gridRef = useRef<HTMLDivElement>(null)
  const catRailRef = useRef<HTMLDivElement>(null)
  const deferredSearch = React.useDeferredValue(search)
  const tier = normalizePriceTier(priceTier)

  // สินค้าที่ขายได้จริง (ตัดสินค้าที่ถูกระงับการใช้งานออกจากกริด — กดไม่ได้อยู่แล้ว)
  const sellableProducts = useMemo(
    () => (Array.isArray(products) ? products.filter((p: any) => !isHidden(p)) : []),
    [products]
  )

  // หมวดสินค้า + จำนวนสินค้าในหมวด เรียงตามตัวอักษรไทย ("ไม่ระบุหมวด" ไปท้ายสุดเสมอ)
  const categories = useMemo(() => {
    const counter = new Map<string, number>()
    for (const p of sellableProducts) {
      const key = categoryOf(p)
      counter.set(key, (counter.get(key) || 0) + 1)
    }
    return Array.from(counter.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => {
        if (a.name === UNCATEGORIZED) return 1
        if (b.name === UNCATEGORIZED) return -1
        return a.name.localeCompare(b.name, 'th')
      })
  }, [sellableProducts])

  // หมวดที่เลือกไว้อาจหายไปหลังข้อมูลสินค้าโหลดใหม่ → กลับไปที่ "ทั้งหมด"
  useEffect(() => {
    if (activeCategory === "") return
    if (!categories.some((c) => c.name === activeCategory)) setActiveCategory("")
  }, [categories, activeCategory])

  const filtered = useMemo(() => {
    const query = deferredSearch.toLowerCase().trim()
    return sellableProducts.filter((p: any) => {
      if (activeCategory !== "" && categoryOf(p) !== activeCategory) return false
      if (query === "") return true
      return (p.ProductName || '').toLowerCase().includes(query)
        || (p.fixname || '').toLowerCase().includes(query)
        || (p.code || '').toLowerCase().startsWith(query)
        || (p.Barcode || '').toLowerCase().startsWith(query)
    })
  }, [sellableProducts, activeCategory, deferredSearch])

  // เปลี่ยนหมวด/คำค้น = เริ่มนับการ์ดใหม่ และเลื่อนกริดกลับขึ้นบนสุด
  useEffect(() => {
    setVisibleCount(PAGE_SIZE)
    if (gridRef.current) gridRef.current.scrollTop = 0
  }, [activeCategory, deferredSearch])

  const visibleProducts = useMemo(() => filtered.slice(0, visibleCount), [filtered, visibleCount])

  // เลื่อนกริดใกล้สุดขอบล่าง = โหลดการ์ดชุดถัดไปให้เอง (ไม่ต้องกดปุ่มทีละครั้ง)
  const handleGridScroll = () => {
    const el = gridRef.current
    if (!el) return
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 220) {
      setVisibleCount((c) => (c >= filtered.length ? c : c + PAGE_SIZE))
    }
  }

  // หมวดสินค้ามีได้หลายสิบหมวด — ถ้าหมวดที่เลือกอยู่นอกจอ ให้เลื่อนแถบหมวดมาให้เห็น
  // (เกิดได้ตอนหมวดถูกเลือกไว้แล้วกลับเข้าหน้าขายใหม่ หรือข้อมูลสินค้าโหลดเสร็จทีหลัง)
  useEffect(() => {
    const el = catRailRef.current
    if (!el) return
    const active = el.querySelector('[aria-selected="true"]')
    active?.scrollIntoView({ block: "nearest" })
  }, [activeCategory, categories])

  const markBroken = (url: string) => {
    if (!url) return
    setBrokenImages((prev) => {
      if (prev.has(url)) return prev
      const next = new Set(prev)
      next.add(url)
      return next
    })
  }

  const imageOf = (p: any) => {
    const url = String(p?.pic ?? "").trim()
    if (!url || url === "null" || url === "undefined" || brokenImages.has(url)) return ""
    return url
  }

  return (
    <div className={styles.posCatalogPanel}>
      <div className={styles.posCatalogHead}>
        <div className={styles.posCatalogBrand}>
          <span className={styles.posCatalogBrandIcon}><LayoutGrid size={15} strokeWidth={2.4} /></span>
          <span className={styles.posCatalogTitle}>เลือกสินค้า</span>
          <span className={styles.posCatalogTierBadge}>{tier}</span>
        </div>

        <div className={styles.posCatalogSearch}>
          <Search size={14} strokeWidth={2.3} className={styles.posCatalogSearchIcon} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="กรองสินค้าในหมวด..."
            className={styles.posCatalogSearchInput}
            autoComplete="off"
            spellCheck={false}
            aria-label="กรองสินค้าในหมวดที่เลือก"
          />
          {search !== "" && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className={styles.posCatalogSearchClear}
              title="ล้างคำค้นหา"
              aria-label="ล้างคำค้นหา">
              <X size={13} strokeWidth={2.6} />
            </button>
          )}
        </div>
      </div>

      {/* ตัวเลือกหมวด (แนวตั้ง ซ้ายมือ) + กริดสินค้า อยู่ในแถวเดียวกัน */}
      <div className={styles.posCatalogBody}>

        {/* แถบหมวดสินค้าแนวตั้ง — ชื่อหมวดยาว ๆ อ่านได้เต็ม และเห็นหลายหมวดพร้อมกันโดยไม่ต้องเลื่อนแนวนอน */}
        <div className={styles.posCatRail}>
          <div className={styles.posCatRailHead}>
            <span className={styles.posCatRailHeadLabel}>หมวดสินค้า</span>
            <span className={styles.posCatRailHeadCount}>{categories.length}</span>
          </div>

          <div className={styles.posCatRailList} ref={catRailRef} role="tablist" aria-orientation="vertical" aria-label="หมวดสินค้า">
            <button
              type="button"
              role="tab"
              aria-selected={activeCategory === ""}
              onClick={() => setActiveCategory("")}
              className={`${styles.posCatItem} ${activeCategory === "" ? styles.posCatItemActive : ""}`}>
              <span className={styles.posCatItemName}>ทั้งหมด</span>
              <span className={styles.posCatItemCount}>{sellableProducts.length}</span>
            </button>

            <span className={styles.posCatRailDivider} aria-hidden="true" />

            {categories.map((cat) => (
              <button
                key={cat.name}
                type="button"
                role="tab"
                aria-selected={activeCategory === cat.name}
                onClick={() => setActiveCategory(cat.name)}
                title={`${cat.name} (${cat.count} รายการ)`}
                className={`${styles.posCatItem} ${activeCategory === cat.name ? styles.posCatItemActive : ""}`}>
                <span className={styles.posCatItemName}>{cat.name}</span>
                <span className={styles.posCatItemCount}>{cat.count}</span>
              </button>
            ))}
          </div>
        </div>

        {/* กริดสินค้า */}
        <div className={styles.posGridScroll} ref={gridRef} onScroll={handleGridScroll}>
        {filtered.length === 0 ? (
          <div className={styles.posCatalogEmpty}>
            <ImageIcon size={30} strokeWidth={1.4} />
            <div>ไม่พบสินค้าในหมวดนี้</div>
            <span>ลองเลือกหมวดอื่น หรือแก้คำค้นหา</span>
          </div>
        ) : (
          <>
            <div className={styles.posGrid}>
              {visibleProducts.map((p: any) => {
                const price = productPriceByTier(p, tier)
                const inCart = cartQtyByProductId.get(Number(p.id)) || 0
                const img = imageOf(p)
                return (
                  <button
                    key={p.id}
                    type="button"
                    disabled={disabled}
                    onClick={() => onPick(p)}
                    title={`${p.ProductName || ''} · ${formatPrice(price)} บาท`}
                    className={`${styles.posCard} ${inCart > 0 ? styles.posCardInCart : ""}`}>
                    <div className={styles.posCardThumb}>
                      {img === "" ? (
                        <span className={styles.posCardInitial}>
                          {String(p.ProductName || "?").trim().charAt(0) || "?"}
                        </span>
                      ) : (
                        <img alt="" src={img} loading="lazy" onError={() => markBroken(img)} />
                      )}
                      {inCart > 0 && <span className={styles.posCardBadge}>{inCart}</span>}
                    </div>

                    <div className={styles.posCardBody}>
                      <div className={styles.posCardName}>{p.ProductName}</div>
                      <div className={styles.posCardFoot}>
                        <span className={styles.posCardPrice}>
                          {formatPrice(price)}<span className={styles.posCardBaht}>฿</span>
                        </span>
                        <span className={styles.posCardUnit}>{p.Unit || '-'}</span>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>

            {visibleCount < filtered.length && (
              <div className={styles.posCatalogMoreWrap}>
                <button
                  type="button"
                  className={styles.posCatalogMore}
                  onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}>
                  แสดงเพิ่ม ({filtered.length - visibleCount} รายการ)
                </button>
              </div>
            )}
          </>
        )}
        </div>
      </div>

      <div className={styles.posCatalogFoot}>
        <span>
          {activeCategory === "" ? "ทุกหมวด" : activeCategory} ·
          &nbsp;<b>{filtered.length.toLocaleString("en-US")}</b> รายการ
        </span>
        <span className={styles.posCatalogHint}>แตะการ์ดเพื่อเพิ่มลงบิล</span>
      </div>
    </div>
  )
}

export default React.memo(ProductCatalogPanel)
