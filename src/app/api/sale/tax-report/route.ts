import { NextRequest } from 'next/server'

async function getPrisma() {
  const { prisma } = await import('@/lib/prisma');
  if (!prisma) throw new Error("Prisma is not available during build.");
  return prisma;
}

const roundCurrency = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100

const toNumber = (value: number | string | null | undefined) => Number(value || 0)

const toCustomerLookupKey = (value: string | null | undefined) => String(value || '').trim()

const DEBIT_NOTE_VAT_RATE = 7

const CREDIT_NOTE_VAT_RATE = 7

const isHiddenTaxReportNoteStatus = (status: string | null | undefined) => {
  const normalizedStatus = String(status || '').trim()
  return normalizedStatus === 'รออนุมัติ' || normalizedStatus === 'ยกเลิก'
}

const getDebitNoteAmounts = (source: {
  debit_original_amount?: number | null
  debit_correct_amount?: number | null
  debit_difference_amount?: number | null
  debit_vat_rate?: number | null
  debit_vat_amount?: number | null
  debit_grand_total?: number | null
}) => {
  const originalAmount = roundCurrency(toNumber(source.debit_original_amount))
  const correctAmount = roundCurrency(toNumber(source.debit_correct_amount))
  const hasStoredDifference = source.debit_difference_amount !== undefined
    && source.debit_difference_amount !== null
  const differenceAmount = roundCurrency(
    hasStoredDifference
      ? toNumber(source.debit_difference_amount)
      : correctAmount - originalAmount
  )
  const vatRate = Math.max(toNumber(source.debit_vat_rate || DEBIT_NOTE_VAT_RATE), 0)
  const hasStoredVat = source.debit_vat_amount !== undefined
    && source.debit_vat_amount !== null
  const vatAmount = roundCurrency(
    hasStoredVat
      ? toNumber(source.debit_vat_amount)
      : differenceAmount > 0 ? (differenceAmount * vatRate) / 100 : 0
  )
  const hasStoredGrandTotal = source.debit_grand_total !== undefined
    && source.debit_grand_total !== null
  const grandTotal = roundCurrency(
    hasStoredGrandTotal
      ? toNumber(source.debit_grand_total)
      : differenceAmount > 0 ? differenceAmount + vatAmount : 0
  )

  return {
    differenceAmount,
    vatAmount,
    grandTotal,
  }
}

const getCreditNoteAmounts = (source: {
  credit_difference_amount?: number | null
  credit_reduce_amount?: number | null
  credit_vat_rate?: number | null
  credit_vat_amount?: number | null
  credit_net_total?: number | null
}) => {
  const hasStoredDifference = source.credit_difference_amount !== undefined
    && source.credit_difference_amount !== null
  const reduceAmount = roundCurrency(
    hasStoredDifference
      ? toNumber(source.credit_difference_amount)
      : toNumber(source.credit_reduce_amount)
  )
  const vatRate = Math.max(toNumber(source.credit_vat_rate || CREDIT_NOTE_VAT_RATE), 0)
  const hasStoredVat = source.credit_vat_amount !== undefined
    && source.credit_vat_amount !== null
  const vatAmount = roundCurrency(
    hasStoredVat
      ? toNumber(source.credit_vat_amount)
      : reduceAmount > 0 ? (reduceAmount * vatRate) / 100 : 0
  )
  const hasStoredNetTotal = source.credit_net_total !== undefined
    && source.credit_net_total !== null
  const netTotal = roundCurrency(
    hasStoredNetTotal
      ? toNumber(source.credit_net_total)
      : reduceAmount > 0 ? reduceAmount + vatAmount : 0
  )

  return {
    reduceAmount,
    vatAmount,
    netTotal,
  }
}

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

  const [saleMainRows, docMainRows, customers] = await Promise.all([
    prisma.saleMain.findMany({
      where: {
        companyall: company,
        createDate: { gte: startDate, lte: endDate },
        NOT: [
          { taxInvoiceNo: null },
          { taxInvoiceNo: '' },
        ],
      },
      orderBy: { createDate: 'asc' },
      select: {
        id: true,
        createDate: true,
        id_costomer: true,
        code_costomer: true,
        beforeVat: true,
        vatAmount: true,
        sumtotal: true,
        totalall: true,
        discount: true,
        usereward: true,
        statussall: true,
        personall: true,
        pay: true,
        taxInvoiceNo: true,
      },
    }),
    prisma.docMain.findMany({
      where: {
        companyall: company,
        OR: [
          { tax_date: { gte: startDate, lte: endDate } },
          { debit_date: { gte: startDate, lte: endDate } },
          { credit_date: { gte: startDate, lte: endDate } },
        ],
      },
      orderBy: { createDate: 'asc' },
      select: {
        id: true,
        createDate: true,
        id_costomer: true,
        code_costomer: true,
        name_costomer: true,
        sumtotal: true,
        totalall: true,
        discount: true,
        usereward: true,
        taxnumber: true,
        tax_date: true,
        tax_orderfull: true,
        tax_status: true,
        tax_person: true,
        debit_date: true,
        debit_orderfull: true,
        debit_status: true,
        debit_person: true,
        debit_reference_no: true,
        debit_original_amount: true,
        debit_correct_amount: true,
        debit_difference_amount: true,
        debit_vat_rate: true,
        debit_vat_amount: true,
        debit_grand_total: true,
        credit_date: true,
        credit_orderfull: true,
        credit_status: true,
        credit_person: true,
        credit_reference_no: true,
        credit_difference_amount: true,
        credit_reduce_amount: true,
        credit_vat_rate: true,
        credit_vat_amount: true,
        credit_net_total: true,
        pay: true,
      },
    }),
    prisma.customer.findMany({
      where: { company },
      select: {
        id: true,
        code: true,
        names: true,
        numbertax: true,
      },
    }),
  ])

  const customerById = new Map(
    customers.map((customer) => [customer.id, customer])
  )
  const customerByCode = new Map(
    customers
      .filter((customer) => toCustomerLookupKey(customer.code) !== '')
      .map((customer) => [toCustomerLookupKey(customer.code), customer])
  )

  const getCustomer = (id: number | null, code: string | null) => {
    const customerByCodeHit = customerByCode.get(toCustomerLookupKey(code))
    if (customerByCodeHit) {
      return customerByCodeHit
    }

    if (id === null || id === undefined) {
      return null
    }

    return customerById.get(id) || null
  }

  const normalizedSaleRows = saleMainRows.map((row) => {
    const customer = getCustomer(row.id_costomer, row.code_costomer)

    return {
      id: `sale-${row.id}`,
      sourceId: row.id,
      sourceType: 'sale',
      documentLabel: 'ใบกำกับภาษี',
      referenceNo: '',
      createDate: row.createDate,
      taxInvoiceNo: row.taxInvoiceNo || '',
      code_costomer: row.code_costomer || '',
      customerName: customer?.names || row.code_costomer || '',
      customerTaxNo: customer?.numbertax || '',
      beforeVat: roundCurrency(toNumber(row.beforeVat)),
      vatAmount: roundCurrency(toNumber(row.vatAmount)),
      sumtotal: roundCurrency(toNumber(row.sumtotal || row.totalall)),
      totalall: roundCurrency(toNumber(row.totalall || row.sumtotal)),
      discount: roundCurrency(toNumber(row.discount)),
      usereward: roundCurrency(toNumber(row.usereward)),
      statussall: row.statussall === 'ยกเลิก' ? 'ยกเลิก' : 'ปกติ',
      personall: row.personall || '',
      pay: row.pay || '',
    }
  })

  const normalizedTaxRows = docMainRows
    .filter((row) => row.tax_date && row.tax_date >= startDate && row.tax_date <= endDate && String(row.tax_orderfull || '').trim() !== '')
    .map((row) => {
      const customer = getCustomer(row.id_costomer, row.code_costomer)
      const beforeVat = roundCurrency(toNumber(row.sumtotal || row.totalall))
      const vatRate = Math.max(toNumber(row.taxnumber), 0)
      const vatAmount = roundCurrency(beforeVat > 0 ? (beforeVat * vatRate) / 100 : 0)
      const grandTotal = roundCurrency(beforeVat + vatAmount)

      return {
        id: `doc-tax-${row.id}`,
        sourceId: row.id,
        sourceType: 'tax',
        documentLabel: 'ใบกำกับภาษี',
        referenceNo: '',
        createDate: row.tax_date || row.createDate,
        taxInvoiceNo: row.tax_orderfull || '',
        code_costomer: row.code_costomer || '',
        customerName: row.name_costomer || customer?.names || row.code_costomer || '',
        customerTaxNo: customer?.numbertax || '',
        beforeVat,
        vatAmount,
        sumtotal: grandTotal,
        totalall: grandTotal,
        discount: roundCurrency(toNumber(row.discount)),
        usereward: roundCurrency(toNumber(row.usereward)),
        statussall: row.tax_status === 'ยกเลิก' ? 'ยกเลิก' : 'ปกติ',
        personall: row.tax_person || '',
        pay: row.pay || '',
      }
    })

  const normalizedDebitRows = docMainRows
    .filter((row) => row.debit_date && row.debit_date >= startDate && row.debit_date <= endDate && String(row.debit_orderfull || '').trim() !== '' && !isHiddenTaxReportNoteStatus(row.debit_status))
    .map((row) => {
      const customer = getCustomer(row.id_costomer, row.code_costomer)
      const debitAmounts = getDebitNoteAmounts(row)

      return {
        id: `doc-debit-${row.id}`,
        sourceId: row.id,
        sourceType: 'debit',
        documentLabel: 'ใบเพิ่มหนี้',
        referenceNo: row.debit_reference_no || row.tax_orderfull || '',
        createDate: row.debit_date || row.createDate,
        taxInvoiceNo: row.debit_orderfull || '',
        code_costomer: row.code_costomer || '',
        customerName: row.name_costomer || customer?.names || row.code_costomer || '',
        customerTaxNo: customer?.numbertax || '',
        beforeVat: debitAmounts.differenceAmount,
        vatAmount: debitAmounts.vatAmount,
        sumtotal: debitAmounts.grandTotal,
        totalall: debitAmounts.grandTotal,
        discount: 0,
        usereward: 0,
        statussall: row.debit_status === 'ยกเลิก' ? 'ยกเลิก' : 'ปกติ',
        personall: row.debit_person || '',
        pay: row.pay || '',
      }
    })

  const normalizedCreditRows = docMainRows
    .filter((row) => row.credit_date && row.credit_date >= startDate && row.credit_date <= endDate && String(row.credit_orderfull || '').trim() !== '' && !isHiddenTaxReportNoteStatus(row.credit_status))
    .map((row) => {
      const customer = getCustomer(row.id_costomer, row.code_costomer)
      const creditAmounts = getCreditNoteAmounts(row)

      return {
        id: `doc-credit-${row.id}`,
        sourceId: row.id,
        sourceType: 'credit',
        documentLabel: 'ใบลดหนี้',
        referenceNo: row.credit_reference_no || row.debit_reference_no || row.tax_orderfull || '',
        createDate: row.credit_date || row.createDate,
        taxInvoiceNo: row.credit_orderfull || '',
        code_costomer: row.code_costomer || '',
        customerName: row.name_costomer || customer?.names || row.code_costomer || '',
        customerTaxNo: customer?.numbertax || '',
        beforeVat: roundCurrency(creditAmounts.reduceAmount * -1),
        vatAmount: roundCurrency(creditAmounts.vatAmount * -1),
        sumtotal: roundCurrency(creditAmounts.netTotal * -1),
        totalall: roundCurrency(creditAmounts.netTotal * -1),
        discount: 0,
        usereward: 0,
        statussall: row.credit_status === 'ยกเลิก' ? 'ยกเลิก' : 'ปกติ',
        personall: row.credit_person || '',
        pay: row.pay || '',
      }
    })

  const result = [...normalizedSaleRows, ...normalizedTaxRows, ...normalizedDebitRows, ...normalizedCreditRows].sort((left, right) => {
    const leftTime = left.createDate ? new Date(left.createDate).getTime() : 0
    const rightTime = right.createDate ? new Date(right.createDate).getTime() : 0
    return leftTime - rightTime
  })

  return Response.json(result)
}
