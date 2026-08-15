import { NextRequest } from 'next/server'

async function getPrisma() {
  const { prisma } = await import('@/lib/prisma');
  if (!prisma) throw new Error("Prisma is not available during build.");
  return prisma;
}

const roundCurrency = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100

const toNumber = (value: number | string | null | undefined) => Number(value || 0)

const PURCHASE_DEBIT_VAT_RATE = 7

const PURCHASE_CREDIT_VAT_RATE = 7

const getPurchaseDebitNoteAmounts = (source: {
  purchase_debit_original_amount?: number | null
  purchase_debit_correct_amount?: number | null
  purchase_debit_difference_amount?: number | null
  purchase_debit_vat_rate?: number | null
  purchase_debit_vat_amount?: number | null
  purchase_debit_grand_total?: number | null
}) => {
  const originalAmount = roundCurrency(toNumber(source.purchase_debit_original_amount))
  const correctAmount = roundCurrency(toNumber(source.purchase_debit_correct_amount))
  const hasStoredDifference = source.purchase_debit_difference_amount !== undefined
    && source.purchase_debit_difference_amount !== null
  const differenceAmount = roundCurrency(
    hasStoredDifference
      ? toNumber(source.purchase_debit_difference_amount)
      : correctAmount - originalAmount
  )
  const vatRate = Math.max(toNumber(source.purchase_debit_vat_rate || PURCHASE_DEBIT_VAT_RATE), 0)
  const hasStoredVat = source.purchase_debit_vat_amount !== undefined
    && source.purchase_debit_vat_amount !== null
  const vatAmount = roundCurrency(
    hasStoredVat
      ? toNumber(source.purchase_debit_vat_amount)
      : differenceAmount > 0 ? (differenceAmount * vatRate) / 100 : 0
  )
  const hasStoredGrandTotal = source.purchase_debit_grand_total !== undefined
    && source.purchase_debit_grand_total !== null
  const grandTotal = roundCurrency(
    hasStoredGrandTotal
      ? toNumber(source.purchase_debit_grand_total)
      : differenceAmount > 0 ? differenceAmount + vatAmount : 0
  )

  return {
    differenceAmount,
    vatAmount,
    grandTotal,
  }
}

const getPurchaseCreditNoteAmounts = (source: {
  purchase_credit_difference_amount?: number | null
  purchase_credit_reduce_amount?: number | null
  purchase_credit_vat_rate?: number | null
  purchase_credit_vat_amount?: number | null
  purchase_credit_net_total?: number | null
}) => {
  const hasStoredDifference = source.purchase_credit_difference_amount !== undefined
    && source.purchase_credit_difference_amount !== null
  const reduceAmount = roundCurrency(
    hasStoredDifference
      ? toNumber(source.purchase_credit_difference_amount)
      : toNumber(source.purchase_credit_reduce_amount)
  )
  const vatRate = Math.max(toNumber(source.purchase_credit_vat_rate || PURCHASE_CREDIT_VAT_RATE), 0)
  const hasStoredVat = source.purchase_credit_vat_amount !== undefined
    && source.purchase_credit_vat_amount !== null
  const vatAmount = roundCurrency(
    hasStoredVat
      ? toNumber(source.purchase_credit_vat_amount)
      : reduceAmount > 0 ? (reduceAmount * vatRate) / 100 : 0
  )
  const hasStoredNetTotal = source.purchase_credit_net_total !== undefined
    && source.purchase_credit_net_total !== null
  const netTotal = roundCurrency(
    hasStoredNetTotal
      ? toNumber(source.purchase_credit_net_total)
      : reduceAmount > 0 ? reduceAmount + vatAmount : 0
  )

  return {
    reduceAmount,
    vatAmount,
    netTotal,
  }
}

const getDocumentTime = (value: Date | string | null | undefined) => (
  value ? new Date(value).getTime() : 0
)

export async function GET(request: NextRequest) {
  const searchParam = request.nextUrl.searchParams
  const company = searchParam.get('company')
  const startDateStr = searchParam.get('startDate') || ''
  const endDateStr = searchParam.get('endDate') || ''

  if (!company || !startDateStr || !endDateStr) {
    return Response.json({ error: 'Missing company, startDate or endDate parameter' }, { status: 400 })
  }

  const startDate = new Date(startDateStr + "T00:00:00.000+07:00")
  const endDate = new Date(endDateStr + "T23:59:59.999+07:00")

  const prisma = await getPrisma();

  const [rows, suppliers] = await Promise.all([
    prisma.receive.findMany({
      where: {
        company,
        OR: [
          { pay_date: { gte: startDate, lte: endDate } },
          { purchase_debit_date: { gte: startDate, lte: endDate } },
          { purchase_credit_date: { gte: startDate, lte: endDate } },
        ],
      },
      select: {
        id: true,
        orderfull: true,
        names: true,
        invoice_No: true,
        statuss: true,
        receive_date: true,
        tax_date: true,
        tax_no: true,
        pay_date: true,
        codenames: true,
        persons: true,
        totalRC: true,
        vatRC: true,
        totalRCAll: true,
        purchase_debit_date: true,
        purchase_debit_orderfull: true,
        purchase_debit_status: true,
        purchase_debit_person: true,
        purchase_debit_reference_no: true,
        purchase_debit_original_amount: true,
        purchase_debit_correct_amount: true,
        purchase_debit_difference_amount: true,
        purchase_debit_vat_rate: true,
        purchase_debit_vat_amount: true,
        purchase_debit_grand_total: true,
        purchase_credit_date: true,
        purchase_credit_orderfull: true,
        purchase_credit_status: true,
        purchase_credit_person: true,
        purchase_credit_reference_no: true,
        purchase_credit_difference_amount: true,
        purchase_credit_reduce_amount: true,
        purchase_credit_vat_rate: true,
        purchase_credit_vat_amount: true,
        purchase_credit_net_total: true,
      },
    }),
    prisma.supplier.findMany({
      where: { company },
      select: { code: true, idcode: true },
    }),
  ])

  const supplierMap = new Map(suppliers.map((supplier) => [supplier.code, supplier.idcode || '']))

  const normalizedTaxRows = rows
    .filter((row) => row.pay_date && row.pay_date >= startDate && row.pay_date <= endDate)
    .map((row) => ({
      id: `purchase-tax-${row.id}`,
      sourceId: row.id,
      sourceType: 'tax',
      documentLabel: 'ใบกำกับภาษีซื้อ',
      referenceNo: row.invoice_No || '',
      createDate: row.tax_date || row.pay_date || row.receive_date,
      payDate: row.pay_date,
      documentNo: row.tax_no || row.invoice_No || (row.orderfull ? `RC${row.orderfull}` : `RC-${row.id}`),
      supplierCode: row.codenames || '',
      supplierName: row.names || '',
      supplierIdcode: supplierMap.get(row.codenames || '') || '',
      person: row.persons || '',
      beforeVat: roundCurrency(toNumber(row.totalRC)),
      vatAmount: roundCurrency(toNumber(row.vatRC)),
      totalAmount: roundCurrency(toNumber(row.totalRCAll)),
      status: row.statuss === 'ยกเลิก' ? 'ยกเลิก' : String(row.statuss || 'ปกติ').trim() || 'ปกติ',
    }))

  const normalizedDebitRows = rows
    .filter((row) => row.purchase_debit_date && row.purchase_debit_date >= startDate && row.purchase_debit_date <= endDate && String(row.purchase_debit_orderfull || '').trim() !== '')
    .map((row) => {
      const debitAmounts = getPurchaseDebitNoteAmounts(row)

      return {
        id: `purchase-debit-${row.id}`,
        sourceId: row.id,
        sourceType: 'debit',
        documentLabel: 'ใบเพิ่มหนี้ซื้อ',
        referenceNo: row.purchase_debit_reference_no || row.tax_no || row.invoice_No || '',
        createDate: row.purchase_debit_date,
        payDate: row.pay_date,
        documentNo: row.purchase_debit_orderfull || '',
        supplierCode: row.codenames || '',
        supplierName: row.names || '',
        supplierIdcode: supplierMap.get(row.codenames || '') || '',
        person: row.purchase_debit_person || row.persons || '',
        beforeVat: debitAmounts.differenceAmount,
        vatAmount: debitAmounts.vatAmount,
        totalAmount: debitAmounts.grandTotal,
        status: row.purchase_debit_status === 'ยกเลิก' ? 'ยกเลิก' : String(row.purchase_debit_status || 'ปกติ').trim() || 'ปกติ',
      }
    })

  const normalizedCreditRows = rows
    .filter((row) => row.purchase_credit_date && row.purchase_credit_date >= startDate && row.purchase_credit_date <= endDate && String(row.purchase_credit_orderfull || '').trim() !== '')
    .map((row) => {
      const creditAmounts = getPurchaseCreditNoteAmounts(row)

      return {
        id: `purchase-credit-${row.id}`,
        sourceId: row.id,
        sourceType: 'credit',
        documentLabel: 'ใบลดหนี้ซื้อ',
        referenceNo: row.purchase_credit_reference_no || row.tax_no || row.invoice_No || '',
        createDate: row.purchase_credit_date,
        payDate: row.pay_date,
        documentNo: row.purchase_credit_orderfull || '',
        supplierCode: row.codenames || '',
        supplierName: row.names || '',
        supplierIdcode: supplierMap.get(row.codenames || '') || '',
        person: row.purchase_credit_person || row.persons || '',
        beforeVat: roundCurrency(creditAmounts.reduceAmount * -1),
        vatAmount: roundCurrency(creditAmounts.vatAmount * -1),
        totalAmount: roundCurrency(creditAmounts.netTotal * -1),
        status: row.purchase_credit_status === 'ยกเลิก' ? 'ยกเลิก' : String(row.purchase_credit_status || 'ปกติ').trim() || 'ปกติ',
      }
    })

  const result = [...normalizedTaxRows, ...normalizedDebitRows, ...normalizedCreditRows]
    .sort((left, right) => getDocumentTime(left.createDate) - getDocumentTime(right.createDate))

  return Response.json(result)
}
