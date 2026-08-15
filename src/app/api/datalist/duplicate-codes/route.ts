import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import fs from 'fs/promises'
import path from 'path'

export const maxDuration = 300

/* ---------------------------------------------------------------- *
 *  Duplicate Codes / Barcodes Admin Tool
 *  GET  -> scan & preview (read-only)
 *  POST -> apply fix (transactional)
 * ---------------------------------------------------------------- */

interface DupRow {
  id: number
  code: string
  ProductName: string
  Barcode: string
  isKeeper: boolean
  newCode?: string
}

interface CodeGroup {
  code: string
  rows: DupRow[]
}

interface BarcodeGroup {
  Barcode: string
  rows: DupRow[]
}

/* -------- Helpers ---------------------------------------------- */

function pickKeeperIndex(rows: { id: number }[]): number {
  // keeper = lowest id (oldest). Returns the index inside `rows`.
  let idx = 0
  for (let i = 1; i < rows.length; i++) {
    if (rows[i].id < rows[idx].id) idx = i
  }
  return idx
}

function computeNextStart(allCodes: string[]): number {
  let max = 9999
  for (const c of allCodes) {
    const n = parseInt(c || '', 10)
    if (Number.isFinite(n) && n > max) max = n
  }
  return max + 1
}

/* -------- GET: Scan & Preview ---------------------------------- */

export async function GET(request: NextRequest) {
  try {
    const company = request.nextUrl.searchParams.get('company') || ''
    if (!company) {
      return NextResponse.json({ error: 'company is required' }, { status: 400 })
    }

    const list = await prisma.datalist.findMany({
      where: { company },
      select: { id: true, code: true, ProductName: true, Barcode: true },
      orderBy: { id: 'asc' },
    })

    const allCodes = list.map((r) => r.code || '').filter(Boolean)
    const nextStart = computeNextStart(allCodes)
    const usedCodes = new Set(allCodes)

    // ----- Group by code -----
    const byCode = new Map<string, typeof list>()
    for (const row of list) {
      const c = (row.code || '').trim()
      if (!c) continue
      if (!byCode.has(c)) byCode.set(c, [])
      byCode.get(c)!.push(row)
    }

    let cursor = nextStart
    const duplicateCodes: CodeGroup[] = []
    for (const [code, rows] of byCode) {
      if (rows.length < 2) continue
      const keeperIdx = pickKeeperIndex(rows)
      const groupRows: DupRow[] = rows.map((r, i) => {
        const isKeeper = i === keeperIdx
        let newCode: string | undefined
        if (!isKeeper) {
          while (usedCodes.has(String(cursor))) cursor++
          newCode = String(cursor)
          usedCodes.add(newCode)
          cursor++
        }
        return {
          id: r.id,
          code: r.code || '',
          ProductName: r.ProductName || '',
          Barcode: r.Barcode || '',
          isKeeper,
          newCode,
        }
      })
      duplicateCodes.push({ code, rows: groupRows })
    }

    // ----- Group by Barcode (non-empty, non-"0" only — those are handled by Section C) -----
    const byBarcode = new Map<string, typeof list>()
    for (const row of list) {
      const b = (row.Barcode || '').trim()
      if (!b || b === '0') continue
      if (!byBarcode.has(b)) byBarcode.set(b, [])
      byBarcode.get(b)!.push(row)
    }

    const duplicateBarcodes: BarcodeGroup[] = []
    for (const [bc, rows] of byBarcode) {
      if (rows.length < 2) continue
      const keeperIdx = pickKeeperIndex(rows)
      duplicateBarcodes.push({
        Barcode: bc,
        rows: rows.map((r, i) => ({
          id: r.id,
          code: r.code || '',
          ProductName: r.ProductName || '',
          Barcode: r.Barcode || '',
          isKeeper: i === keeperIdx,
        })),
      })
    }

    // ----- Empty / zero barcode rows (to fill with code) -----
    // Build set of existing barcodes (after planned dedup, those are still 'in use')
    const existingBarcodes = new Set<string>()
    for (const row of list) {
      const b = (row.Barcode || '').trim()
      if (b && b !== '0') existingBarcodes.add(b)
    }
    const emptyBarcodeRows: Array<{
      id: number
      code: string
      ProductName: string
      Barcode: string
      newBarcode: string | null
      conflict?: string
    }> = []
    const plannedFillBarcodes = new Set<string>()
    for (const row of list) {
      const b = (row.Barcode || '').trim()
      const c = (row.code || '').trim()
      const isEmpty = !b || b === '0'
      if (!isEmpty) continue
      if (!c) {
        emptyBarcodeRows.push({
          id: row.id,
          code: c,
          ProductName: row.ProductName || '',
          Barcode: row.Barcode || '',
          newBarcode: null,
          conflict: 'no product code',
        })
        continue
      }
      // Conflict if another product already uses this code as barcode, or another empty row will fill the same code (cannot happen since codes are unique within the renamed plan, but check anyway)
      const conflict =
        existingBarcodes.has(c) || plannedFillBarcodes.has(c)
          ? 'duplicate with existing Barcode'
          : undefined
      emptyBarcodeRows.push({
        id: row.id,
        code: c,
        ProductName: row.ProductName || '',
        Barcode: row.Barcode || '',
        newBarcode: conflict ? null : c,
        conflict,
      })
      if (!conflict) plannedFillBarcodes.add(c)
    }

    return NextResponse.json({
      ok: true,
      company,
      totalProducts: list.length,
      nextCodeStart: nextStart,
      duplicateCodes,
      duplicateBarcodes,
      emptyBarcodeRows,
      summary: {
        codeGroups: duplicateCodes.length,
        codeRowsToRename: duplicateCodes.reduce(
          (s, g) => s + g.rows.filter((r) => !r.isKeeper).length,
          0
        ),
        barcodeGroups: duplicateBarcodes.length,
        barcodeRowsToClear: duplicateBarcodes.reduce(
          (s, g) => s + g.rows.filter((r) => !r.isKeeper).length,
          0
        ),
        emptyBarcodes: emptyBarcodeRows.length,
        emptyBarcodesToFill: emptyBarcodeRows.filter((r) => r.newBarcode).length,
      },
    })
  } catch (e: any) {
    console.error('[duplicate-codes][GET]', e)
    return NextResponse.json(
      { error: e?.message || 'internal error' },
      { status: 500 }
    )
  }
}

/* -------- POST: Apply fix (transactional) ---------------------- */

interface ApplyBody {
  company: string
  applyCodes?: boolean
  applyBarcodes?: boolean
  applyFillBarcodes?: boolean
  /** Optional: explicit list of Datalist.id rows to clear Barcode on.
   *  When provided (and applyBarcodes=true), the API uses these ids instead of
   *  re-computing duplicate groups. Empty array = do not clear any barcode. */
  barcodeClearIds?: number[]
  dryRun?: boolean
}

export async function POST(request: NextRequest) {
  const startedAt = new Date()
  try {
    const body = (await request.json()) as ApplyBody
    const { company, applyCodes = true, applyBarcodes = true, applyFillBarcodes = true, barcodeClearIds, dryRun = false } = body || ({} as ApplyBody)

    if (!company) {
      return NextResponse.json({ error: 'company is required' }, { status: 400 })
    }

    const log: string[] = []
    const warnings: string[] = []
    let codesFixed = 0
    let barcodesFixed = 0
    let barcodesFilled = 0
    let historyUpdates = {
      Sale: 0,
      Gifts: 0,
      StockTransaction: 0,
      RCitemlist: 0,
      RCstockchange: 0,
      StockTransferItem: 0,
      Labeldata: 0,
      LabeldataDeleted: 0,
      UnitConversion: 0,
      SaleBarcodeFilled: 0,
      RCitemlistBarcodeFilled: 0,
      StockTransferItemBarcodeFilled: 0,
    }

    // pre-scan (mirror GET logic but only what we need)
    const list = await prisma.datalist.findMany({
      where: { company },
      select: { id: true, code: true, ProductName: true, Barcode: true },
      orderBy: { id: 'asc' },
    })
    const allCodes = list.map((r) => r.code || '').filter(Boolean)
    let cursor = computeNextStart(allCodes)
    const usedCodes = new Set(allCodes)

    // Plan code renames first (so we have a deterministic mapping)
    interface RenameOp {
      pid: number
      oldCode: string
      newCode: string
      productName: string
    }
    const codeRenames: RenameOp[] = []
    if (applyCodes) {
      const byCode = new Map<string, typeof list>()
      for (const row of list) {
        const c = (row.code || '').trim()
        if (!c) continue
        if (!byCode.has(c)) byCode.set(c, [])
        byCode.get(c)!.push(row)
      }
      for (const [code, rows] of byCode) {
        if (rows.length < 2) continue
        const keeperIdx = pickKeeperIndex(rows)
        rows.forEach((r, i) => {
          if (i === keeperIdx) return
          while (usedCodes.has(String(cursor))) cursor++
          const newCode = String(cursor)
          usedCodes.add(newCode)
          cursor++
          codeRenames.push({
            pid: r.id,
            oldCode: code,
            newCode,
            productName: r.ProductName || '',
          })
        })
      }
    }

    // Plan barcode clears
    interface BarcodeClearOp {
      pid: number
      Barcode: string
      code: string
    }
    const barcodeClears: BarcodeClearOp[] = []
    // Map pid -> final code (post-rename) so Labeldata cleanup uses the up-to-date code.
    const finalCodeByPid = new Map<number, string>()
    for (const row of list) finalCodeByPid.set(row.id, (row.code || '').trim())
    for (const op of codeRenames) finalCodeByPid.set(op.pid, op.newCode)

    if (applyBarcodes) {
      if (Array.isArray(barcodeClearIds)) {
        // Explicit user-curated list: only clear these ids (must belong to this company
        // and currently have a non-empty, non-"0" Barcode).
        const idSet = new Set(barcodeClearIds.filter((n) => Number.isFinite(n)))
        for (const row of list) {
          if (!idSet.has(row.id)) continue
          const b = (row.Barcode || '').trim()
          if (!b || b === '0') continue
          barcodeClears.push({
            pid: row.id,
            Barcode: b,
            code: finalCodeByPid.get(row.id) || (row.code || '').trim(),
          })
        }
      } else {
        // Legacy/default behaviour: auto pick non-keeper rows in each duplicate group.
        const byBarcode = new Map<string, typeof list>()
        for (const row of list) {
          const b = (row.Barcode || '').trim()
          if (!b || b === '0') continue
          if (!byBarcode.has(b)) byBarcode.set(b, [])
          byBarcode.get(b)!.push(row)
        }
        for (const [bc, rows] of byBarcode) {
          if (rows.length < 2) continue
          const keeperIdx = pickKeeperIndex(rows)
          rows.forEach((r, i) => {
            if (i === keeperIdx) return
            barcodeClears.push({
              pid: r.id,
              Barcode: bc,
              code: finalCodeByPid.get(r.id) || (r.code || '').trim(),
            })
          })
        }
      }
    }

    // Plan empty/zero barcode fills (use product code as new Barcode).
    // Computed AFTER codeRenames so we know the final code per pid.
    interface BarcodeFillOp {
      pid: number
      newBarcode: string
      productName: string
    }
    const barcodeFills: BarcodeFillOp[] = []
    if (applyFillBarcodes) {
      // Set of barcodes that will be "in use" after dedup step
      const willClearPids = new Set(barcodeClears.map((o) => o.pid))
      const inUseBarcodes = new Set<string>()
      for (const row of list) {
        const b = (row.Barcode || '').trim()
        if (!b || b === '0') continue
        if (willClearPids.has(row.id)) continue
        inUseBarcodes.add(b)
      }

      for (const row of list) {
        const b = (row.Barcode || '').trim()
        const isEmpty = !b || b === '0'
        if (!isEmpty) continue
        const finalCode = finalCodeByPid.get(row.id) || ''
        if (!finalCode) {
          warnings.push(`Fill skipped for pid=${row.id}: empty product code.`)
          continue
        }
        if (inUseBarcodes.has(finalCode)) {
          warnings.push(
            `Fill skipped for pid=${row.id} ("${row.ProductName || ''}"): code ${finalCode} would collide with existing Barcode.`
          )
          continue
        }
        barcodeFills.push({ pid: row.id, newBarcode: finalCode, productName: row.ProductName || '' })
        inUseBarcodes.add(finalCode)
      }
    }

    log.push(
      `Plan ready: ${codeRenames.length} code rename(s), ${barcodeClears.length} barcode clear(s), ${barcodeFills.length} barcode fill(s) (dryRun=${dryRun})`
    )

    if (!dryRun && (codeRenames.length > 0 || barcodeClears.length > 0 || barcodeFills.length > 0)) {
      await prisma.$transaction(
        async (tx) => {
          // --- Code renames ---
          for (const op of codeRenames) {
            const { pid, oldCode, newCode, productName } = op

            // Datalist
            await tx.datalist.update({
              where: { id: pid },
              data: { code: newCode },
            })

            // Sale (safe: id_product disambiguates)
            const sale = await tx.sale.updateMany({
              where: { company, id_product: pid, code_product: oldCode },
              data: { code_product: newCode },
            })
            historyUpdates.Sale += sale.count

            // Gifts
            const gifts = await tx.gifts.updateMany({
              where: { company, id_product: pid, code_product: oldCode },
              data: { code_product: newCode },
            })
            historyUpdates.Gifts += gifts.count

            // StockTransaction
            const stx = await tx.stockTransaction.updateMany({
              where: { company, product_id: pid, itemcode: oldCode },
              data: { itemcode: newCode },
            })
            historyUpdates.StockTransaction += stx.count

            // ---- Heuristic-based renames (no id_product FK) ----
            // Check ambiguity first: count rows that share oldCode for this company
            const rcCount = await tx.rCitemlist.count({
              where: { company, itemcode: oldCode },
            })
            if (rcCount > 0) {
              if (productName) {
                const rc = await tx.rCitemlist.updateMany({
                  where: { company, itemcode: oldCode, itemName: productName },
                  data: { itemcode: newCode },
                })
                historyUpdates.RCitemlist += rc.count
                const remaining = rcCount - rc.count
                if (remaining > 0) {
                  warnings.push(
                    `RCitemlist: ${remaining} row(s) with code=${oldCode} did not match productName "${productName}" (left on keeper).`
                  )
                }
              } else {
                warnings.push(
                  `RCitemlist: ${rcCount} row(s) with code=${oldCode} skipped (Datalist row has empty ProductName).`
                )
              }
            }

            const rcsCount = await tx.rCstockchange.count({
              where: { company, itemcode: oldCode },
            })
            if (rcsCount > 0) {
              if (productName) {
                const rcs = await tx.rCstockchange.updateMany({
                  where: { company, itemcode: oldCode, itemName: productName },
                  data: { itemcode: newCode },
                })
                historyUpdates.RCstockchange += rcs.count
                const remaining = rcsCount - rcs.count
                if (remaining > 0) {
                  warnings.push(
                    `RCstockchange: ${remaining} row(s) with code=${oldCode} did not match productName "${productName}" (left on keeper).`
                  )
                }
              }
            }

            // StockTransferItem has no `company` column. Use itemcode + itemName.
            const stiCount = await tx.stockTransferItem.count({
              where: { itemcode: oldCode },
            })
            if (stiCount > 0) {
              if (productName) {
                const sti = await tx.stockTransferItem.updateMany({
                  where: { itemcode: oldCode, itemName: productName },
                  data: { itemcode: newCode },
                })
                historyUpdates.StockTransferItem += sti.count
                const remaining = stiCount - sti.count
                if (remaining > 0) {
                  warnings.push(
                    `StockTransferItem: ${remaining} row(s) with code=${oldCode} did not match productName "${productName}" (cross-company or different name; left on keeper).`
                  )
                }
              }
            }

            // Labeldata (company, code) — rename if non-ambiguous; warn otherwise
            const lbCount = await tx.labeldata.count({
              where: { company, code: oldCode },
            })
            if (lbCount > 0) {
              const lb = await tx.labeldata.updateMany({
                where: { company, code: oldCode },
                data: { code: newCode },
              })
              historyUpdates.Labeldata += lb.count
              if (lbCount > 1) {
                warnings.push(
                  `Labeldata: ${lbCount} rows shared code=${oldCode} for company; all renamed to ${newCode} (manual review recommended).`
                )
              }
            }

            // UnitConversion (company, productCode)
            const ucCount = await tx.unitConversion.count({
              where: { company, productCode: oldCode },
            })
            if (ucCount > 0) {
              const uc = await tx.unitConversion.updateMany({
                where: { company, productCode: oldCode },
                data: { productCode: newCode },
              })
              historyUpdates.UnitConversion += uc.count
              if (ucCount > 1) {
                warnings.push(
                  `UnitConversion: ${ucCount} rows shared productCode=${oldCode}; all renamed to ${newCode} (manual review recommended).`
                )
              }
            }

            codesFixed++
            log.push(
              `Renamed pid=${pid} "${productName}" : ${oldCode} -> ${newCode}`
            )
          }

          // --- Barcode soft clears (also delete the product's Labeldata record) ---
          for (const op of barcodeClears) {
            await tx.datalist.update({
              where: { id: op.pid },
              data: { Barcode: '' },
            })
            // Delete Labeldata for this product (ข้อมูลฉลากยา) so the cleared
            // duplicate stops printing/using stale label content.
            if (op.code) {
              const del = await tx.labeldata.deleteMany({
                where: { company, code: op.code },
              })
              historyUpdates.LabeldataDeleted += del.count
              if (del.count > 0) {
                log.push(
                  `Deleted Labeldata for code=${op.code} (pid=${op.pid}): ${del.count} row(s)`
                )
              }
            }
            barcodesFixed++
            log.push(`Cleared duplicate Barcode "${op.Barcode}" on pid=${op.pid}`)
          }

          // --- Fill empty/zero barcodes with product code ---
          // IMPORTANT: also propagate the new Barcode into historical rows that have
          // empty/"0" Barcode (Sale, RCitemlist, StockTransferItem). The stock-balance
          // summary API filters by Barcode when present; without this propagation
          // ยอดขาย/ยอดรับ/ยอดโอน would drop to 0 after fill.
          for (const op of barcodeFills) {
            const { pid, newBarcode, productName } = op

            // Datalist (the product itself)
            await tx.datalist.update({
              where: { id: pid },
              data: { Barcode: newBarcode },
            })

            // Sale: safe — id_product disambiguates
            const saleFill = await tx.sale.updateMany({
              where: {
                company,
                id_product: pid,
                OR: [{ barcode: '' }, { barcode: '0' }, { barcode: null }],
              },
              data: { barcode: newBarcode },
            })
            historyUpdates.SaleBarcodeFilled += saleFill.count

            // RCitemlist: heuristic via (company, itemcode, itemName)
            if (productName) {
              const rcFill = await tx.rCitemlist.updateMany({
                where: {
                  company,
                  itemcode: newBarcode,
                  itemName: productName,
                  OR: [{ Barcode: '' }, { Barcode: '0' }, { Barcode: null }],
                },
                data: { Barcode: newBarcode },
              })
              historyUpdates.RCitemlistBarcodeFilled += rcFill.count
            } else {
              warnings.push(
                `Barcode-fill (RCitemlist): pid=${pid} skipped (empty ProductName).`
              )
            }

            // StockTransferItem: heuristic via (itemcode, itemName) — no company column
            if (productName) {
              const stiFill = await tx.stockTransferItem.updateMany({
                where: {
                  itemcode: newBarcode,
                  itemName: productName,
                  OR: [{ barcode: '' }, { barcode: '0' }, { barcode: null }],
                },
                data: { barcode: newBarcode },
              })
              historyUpdates.StockTransferItemBarcodeFilled += stiFill.count
            }

            barcodesFilled++
            log.push(`Filled empty Barcode with code "${newBarcode}" on pid=${pid}`)
          }
        },
        { timeout: 120_000, maxWait: 30_000 }
      )

      // Persist audit log JSON (non-fatal)
      try {
        const dir = path.join(process.cwd(), 'data', 'backups', 'duplicate-fix')
        await fs.mkdir(dir, { recursive: true })
        const stamp = startedAt
          .toISOString()
          .replace(/[:.]/g, '-')
          .slice(0, 19)
        const fp = path.join(dir, `${company}_${stamp}.json`)
        await fs.writeFile(
          fp,
          JSON.stringify(
            {
              company,
              startedAt,
              finishedAt: new Date(),
              codesFixed,
              barcodesFixed,
              barcodesFilled,
              historyUpdates,
              warnings,
              codeRenames,
              barcodeClears,
              barcodeFills,
              log,
            },
            null,
            2
          ),
          'utf8'
        )
        log.push(`Audit log saved: ${fp}`)
      } catch (e: any) {
        warnings.push(`Audit log write failed: ${e?.message || e}`)
      }
    }

    return NextResponse.json({
      ok: true,
      dryRun,
      summary: {
        codesFixed,
        barcodesFixed,
        barcodesFilled,
        plannedCodeRenames: codeRenames.length,
        plannedBarcodeClears: barcodeClears.length,
        plannedBarcodeFills: barcodeFills.length,
        historyUpdates,
        warnings,
      },
      log,
    })
  } catch (e: any) {
    console.error('[duplicate-codes][POST]', e)
    return NextResponse.json(
      { error: e?.message || 'internal error' },
      { status: 500 }
    )
  }
}
