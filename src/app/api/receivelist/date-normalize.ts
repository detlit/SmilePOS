const DAY_MS = 24 * 60 * 60 * 1000
const EXCEL_EPOCH = new Date(1899, 11, 30)

function excelSerialToDate(serial: number) {
  return new Date(EXCEL_EPOCH.getTime() + serial * DAY_MS)
}

function isNumericString(value: string) {
  return /^\d+(?:\.\d+)?$/.test(value)
}

function normalizeYear(year: number) {
  return year >= 2400 && year <= 2700 ? year - 543 : year
}

function validLocalDate(year: number, month: number, day: number) {
  const date = new Date(year, month - 1, day)
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null
  }
  return date
}

function highYearIsoToExcelDate(value: string) {
  const match = value.match(/^\+?0?(\d{5,6})-(\d{2})-(\d{2})/)
  if (!match) return null

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  if (year <= 9999 || year >= 100000) return null

  const serial = month === 12 && day >= 30 ? year + 1 : year
  return excelSerialToDate(serial)
}

export function normalizeRcDate(value: unknown): Date | null | undefined {
  if (value === undefined) return undefined
  if (value === null) return null

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null
    if (value.getFullYear() > 9999 && value.getFullYear() < 100000) {
      return excelSerialToDate(value.getFullYear())
    }
    return value
  }

  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return null
    return excelSerialToDate(value)
  }

  const text = String(value).trim()
  if (!text) return null

  if (isNumericString(text)) {
    return excelSerialToDate(Number(text))
  }

  const thaiOrSlashDate = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (thaiOrSlashDate) {
    const day = Number(thaiOrSlashDate[1])
    const month = Number(thaiOrSlashDate[2])
    const year = normalizeYear(Number(thaiOrSlashDate[3]))
    return validLocalDate(year, month, day)
  }

  const recoveredExcelDate = highYearIsoToExcelDate(text)
  if (recoveredExcelDate) return recoveredExcelDate

  const date = new Date(text)
  if (Number.isNaN(date.getTime())) return null
  if (date.getFullYear() > 9999 || date.getFullYear() < 1900) return null
  return date
}

export function normalizeRcItemDates<T extends { dateExp?: unknown; dateRC?: unknown }>(item: T) {
  return {
    ...item,
    dateExp: normalizeRcDate(item.dateExp),
    dateRC: normalizeRcDate(item.dateRC),
  }
}