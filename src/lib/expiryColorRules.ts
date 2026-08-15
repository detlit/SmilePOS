export type ExpiryColorRule = {
  id: string
  label: string
  days: number
  color: string
  enabled: boolean
}

export const DEFAULT_EXPIRY_COLOR_RULES: ExpiryColorRule[] = [
  { id: "expired", label: "หมดอายุแล้ว / วันนี้", days: 0, color: "#fee2e2", enabled: true },
  { id: "near", label: "ใกล้หมดอายุ", days: 30, color: "#ffedd5", enabled: true },
  { id: "watch", label: "เฝ้าระวัง", days: 90, color: "#fef3c7", enabled: true },
]

const isObject = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value)

const normalizeHexColor = (value: unknown, fallback: string) => {
  const color = String(value || "").trim()
  return /^#[0-9a-f]{6}$/i.test(color) ? color : fallback
}

export const normalizeExpiryColorRules = (value: unknown): ExpiryColorRule[] => {
  let parsed = value
  if (typeof value === "string") {
    try {
      parsed = value.trim() ? JSON.parse(value) : []
    } catch {
      parsed = []
    }
  }

  const source = Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_EXPIRY_COLOR_RULES

  return source
    .filter(isObject)
    .map((rule, index) => {
      const fallback = DEFAULT_EXPIRY_COLOR_RULES[index] || DEFAULT_EXPIRY_COLOR_RULES[DEFAULT_EXPIRY_COLOR_RULES.length - 1]
      const days = Number(rule.days)
      return {
        id: String(rule.id || `rule-${index}-${Date.now()}`),
        label: String(rule.label || fallback.label),
        days: Number.isFinite(days) && days >= 0 ? Math.round(days) : fallback.days,
        color: normalizeHexColor(rule.color, fallback.color),
        enabled: rule.enabled !== false,
      }
    })
    .sort((a, b) => a.days - b.days)
}

const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate())

export const getExpiryDaysLeft = (dateValue: Date | string | null | undefined) => {
  if (!dateValue) return null
  const date = dateValue instanceof Date ? dateValue : new Date(dateValue)
  if (isNaN(date.getTime())) return null
  const diff = startOfDay(date).getTime() - startOfDay(new Date()).getTime()
  return Math.ceil(diff / 86400000)
}

export const getExpiryRuleForDate = (
  dateValue: Date | string | null | undefined,
  rules: ExpiryColorRule[],
) => {
  const daysLeft = getExpiryDaysLeft(dateValue)
  if (daysLeft === null) return null
  return normalizeExpiryColorRules(rules).find((rule) => rule.enabled && daysLeft <= rule.days) || null
}

export const formatExpiryDaysLabel = (daysLeft: number | null) => {
  if (daysLeft === null) return ""
  if (daysLeft < 0) return `เกิน ${Math.abs(daysLeft)} วัน`
  if (daysLeft === 0) return "วันนี้"
  return `เหลือ ${daysLeft} วัน`
}

export const colorWithAlpha = (color: string, alpha: number) => {
  const hex = normalizeHexColor(color, "#ffffff").replace("#", "")
  const red = parseInt(hex.slice(0, 2), 16)
  const green = parseInt(hex.slice(2, 4), 16)
  const blue = parseInt(hex.slice(4, 6), 16)
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`
}

export const getReadableTextColor = (color: string) => {
  const hex = normalizeHexColor(color, "#ffffff").replace("#", "")
  const red = parseInt(hex.slice(0, 2), 16)
  const green = parseInt(hex.slice(2, 4), 16)
  const blue = parseInt(hex.slice(4, 6), 16)
  const luminance = (0.299 * red + 0.587 * green + 0.114 * blue) / 255
  return luminance > 0.62 ? "#334155" : "#ffffff"
}

export const getReadableTintTextColor = (color: string) => {
  const hex = normalizeHexColor(color, "#ffffff").replace("#", "")
  const red = parseInt(hex.slice(0, 2), 16)
  const green = parseInt(hex.slice(2, 4), 16)
  const blue = parseInt(hex.slice(4, 6), 16)
  const luminance = (0.299 * red + 0.587 * green + 0.114 * blue) / 255

  if (luminance > 0.7) return "#334155"

  return `rgb(${Math.round(red * 0.62)}, ${Math.round(green * 0.62)}, ${Math.round(blue * 0.62)})`
}