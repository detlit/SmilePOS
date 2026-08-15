'use client'

import { useEffect, useRef } from "react"
import { logAction } from "@/lib/logbook"

const ACTION_PATTERNS = [
  { actionType: "delete", pattern: /(ลบ|delete|trash|remove)/i },
  { actionType: "confirm", pattern: /(ยืนยัน|confirm|approve|อนุมัติ)/i },
  { actionType: "sync", pattern: /(sync|ซิงค์)/i },
  { actionType: "import", pattern: /(import|นำเข้า)/i },
  { actionType: "export", pattern: /(export|ส่งออก)/i },
  { actionType: "edit", pattern: /(แก้ไข|edit|update)/i },
  { actionType: "save", pattern: /(บันทึก|save)/i },
  { actionType: "cancel", pattern: /(ยกเลิก|cancel|void)/i },
  { actionType: "submit", pattern: /(submit|ส่งข้อมูล)/i },
]

const IGNORED_LABEL_PATTERN = /logbook/i
const CONTEXT_ACTIONS = new Set(["edit", "delete", "cancel"])
const CONTEXT_FIELD_PATTERN = /(รหัส|สินค้า|ชื่อ|เลขที่|เลขบิล|เลขเอกสาร|ใบรับ|ใบสั่งซื้อ|barcode|code|product|name|lot|supplier|customer|ผู้ขาย|ลูกค้า)/i
const CONTEXT_STOP_WORD_PATTERN = /(กำลังบันทึก|กำลังลบ|แก้ไข|ลบ|บันทึก|กลับ|ยกเลิก|ยืนยัน|download|upload|refresh)/ig

function getButtonElement(target: EventTarget | null) {
  if (!(target instanceof Element)) return null
  return target.closest('button, input[type="button"], input[type="submit"], [role="button"], a.btn') as HTMLElement | null
}

function getButtonLabel(element: HTMLElement) {
  const input = element as HTMLInputElement
  return (
    element.getAttribute("data-logbook-label") ||
    element.getAttribute("aria-label") ||
    element.getAttribute("title") ||
    input.value ||
    element.innerText ||
    element.textContent ||
    ""
  ).replace(/\s+/g, " ").trim()
}

function normalizeText(value: string) {
  return value.replace(/\s+/g, " ").trim()
}

function isVisibleElement(element: Element) {
  if (!(element instanceof HTMLElement)) return false
  const style = window.getComputedStyle(element)
  return style.display !== "none" && style.visibility !== "hidden" && style.opacity !== "0"
}

function getFieldLabel(field: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement) {
  const labels = Array.from(field.labels || []).map((label) => label.textContent || "")
  return normalizeText([
    ...labels,
    field.getAttribute("aria-label") || "",
    field.getAttribute("placeholder") || "",
    field.getAttribute("name") || "",
    field.getAttribute("id") || "",
    field.getAttribute("title") || "",
  ].join(" "))
}

function getFieldValue(field: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement) {
  if (field instanceof HTMLInputElement && ["hidden", "password", "file"].includes(field.type)) return ""
  if (field instanceof HTMLSelectElement) return normalizeText(field.selectedOptions[0]?.textContent || field.value || "")
  return normalizeText(field.value || "")
}

function collectContextFieldValues(container: HTMLElement) {
  return Array.from(container.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>("input, select, textarea"))
    .filter((field) => !field.disabled && isVisibleElement(field))
    .map((field) => {
      const label = getFieldLabel(field)
      const value = getFieldValue(field)
      return { label, value }
    })
    .filter((field) => field.value && (CONTEXT_FIELD_PATTERN.test(field.label) || CONTEXT_FIELD_PATTERN.test(field.value)))
    .slice(0, 6)
}

function cleanContextSummary(value: string, buttonLabel: string) {
  return normalizeText(value)
    .replace(CONTEXT_STOP_WORD_PATTERN, " ")
    .replace(buttonLabel, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function extractProductSummary(text: string) {
  const productMatch = text.match(/สินค้า\s*[:：]?\s*(.{2,140}?)(?=\s+(?:คงเหลือ|ทุนล่าสุด|ราคาขาย|ราคาทุนใหม่|จำนวนรับ|ทุนรวม|Lot|หมดอายุ|บาท|ขวด|กล่อง)\b|$)/i)
  if (productMatch?.[1]) return normalizeText(productMatch[1])

  const codeNameMatch = text.match(/\b([A-Za-z0-9][A-Za-z0-9._/-]{2,})\s+([^|,]{2,90}?)(?=\s+(?:คงเหลือ|ทุนล่าสุด|ราคาขาย|จำนวน|Lot|บาท|ขวด|กล่อง)\b|$)/)
  if (codeNameMatch?.[1] && codeNameMatch?.[2]) return normalizeText(`${codeNameMatch[1]} ${codeNameMatch[2]}`)

  return ""
}

function extractDocumentSummary(text: string) {
  const documentMatch = text.match(/(?:เลขที่|เลขบิล|เลขที่บิล|เลขเอกสาร|ใบรับ|ใบสั่งซื้อ|order|bill|invoice)\s*[:：#]?\s*([A-Za-z0-9/_-]{2,50})/i)
  return documentMatch?.[1] ? normalizeText(documentMatch[1]) : ""
}

function splitCodeAndName(summary: string) {
  const match = summary.match(/^([A-Za-z0-9][A-Za-z0-9._/-]{2,})\s+(.{2,})$/)
  if (!match) return { code: "", name: summary }
  return { code: match[1], name: normalizeText(match[2]) }
}

function findContextContainer(element: HTMLElement, buttonLabel: string) {
  let current: HTMLElement | null = element.parentElement
  let fallback: HTMLElement | null = null

  for (let depth = 0; current && depth < 8; depth += 1) {
    const text = cleanContextSummary(current.innerText || current.textContent || "", buttonLabel)
    const fields = collectContextFieldValues(current)
    const hasUsefulText = CONTEXT_FIELD_PATTERN.test(text) || Boolean(extractProductSummary(text)) || Boolean(extractDocumentSummary(text))
    if ((hasUsefulText || fields.length > 0) && text.length > 8 && text.length < 2500) return current
    if (!fallback && text.length > 20 && text.length < 700) fallback = current
    current = current.parentElement
  }

  return fallback
}

function inferActionContext(element: HTMLElement, buttonLabel: string) {
  const explicitSummary = normalizeText(element.getAttribute("data-logbook-context") || "")
  const explicitCode = normalizeText(element.getAttribute("data-logbook-code") || "")
  const explicitName = normalizeText(element.getAttribute("data-logbook-name") || "")
  if (explicitSummary || explicitCode || explicitName) {
    const summary = explicitSummary || [explicitCode, explicitName].filter(Boolean).join(" - ")
    return { summary, code: explicitCode, name: explicitName, contextText: summary }
  }

  const container = findContextContainer(element, buttonLabel)
  if (!container) return null

  const rawText = cleanContextSummary(container.innerText || container.textContent || "", buttonLabel)
  const fields = collectContextFieldValues(container)
  const fieldSummary = fields.map((field) => field.value).filter(Boolean).join(" ")
  const productSummary = extractProductSummary(rawText) || extractProductSummary(fieldSummary)
  const documentSummary = extractDocumentSummary(rawText) || extractDocumentSummary(fieldSummary)
  const summary = normalizeText(productSummary || documentSummary || fieldSummary || rawText).slice(0, 180)

  if (!summary) return null

  const { code, name } = splitCodeAndName(productSummary || summary)
  return {
    summary,
    code,
    name,
    contextText: rawText.slice(0, 500),
  }
}

function isNavigationControl(element: HTMLElement) {
  return Boolean(element.closest('[role="tab"], [data-bs-toggle], .nav-link, nav'))
}

function inferActionType(label: string) {
  const matched = ACTION_PATTERNS.find((item) => item.pattern.test(label))
  return matched?.actionType || "click"
}

function inferEntityType(pathname: string) {
  const path = pathname.toLowerCase()
  if (path.includes("/web/sales")) return "sale"
  if (path.includes("/web/receives")) return "receive"
  if (path.includes("/web/dataproduct/label")) return "label"
  if (path.includes("/web/dataproduct")) return "product"
  if (path.includes("/web/customers")) return "customer"
  if (path.includes("/web/suppliers")) return "supplier"
  if (path.includes("/web/sync")) return "sync"
  if (path.includes("/web/setting")) return "setting"
  if (path.includes("/web/order")) return "order"
  if (path.includes("/web/promotion")) return "promotion"
  if (path.includes("/web/reports")) return "report"
  if (path.includes("/web/managements")) return "management"
  if (path.includes("/web/company") || path.includes("/web/branchtransfer")) return "branch_transfer"
  if (path.includes("/web/document")) return "document"
  if (path.includes("/web/mobile")) return "mobile"
  return "web"
}

export default function LogbookAutoTracker() {
  const lastLogRef = useRef<{ key: string; time: number } | null>(null)

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const element = getButtonElement(event.target)
      if (!element) return
      if (element.getAttribute("data-logbook-ignore") === "true") return
      if (element.hasAttribute("disabled") || element.getAttribute("aria-disabled") === "true") return

      const label = getButtonLabel(element)
      if (!label || IGNORED_LABEL_PATTERN.test(label) || isNavigationControl(element)) return

      const actionType = inferActionType(label)
      if (actionType === "click") return
      const hasExplicitContext = element.hasAttribute("data-logbook-context") || element.hasAttribute("data-logbook-code") || element.hasAttribute("data-logbook-name")
      const actionContext = CONTEXT_ACTIONS.has(actionType) || hasExplicitContext ? inferActionContext(element, label) : null

      const entityType = inferEntityType(window.location.pathname)
      const key = `${window.location.pathname}|${actionType}|${label}|${actionContext?.summary || ""}`
      const now = Date.now()

      if (lastLogRef.current?.key === key && now - lastLogRef.current.time < 900) return
      lastLogRef.current = { key, time: now }

      void logAction({
        actionType,
        entityType,
        buttonLabel: label.slice(0, 120),
        status: "clicked",
        message: actionContext?.summary ? `กดปุ่ม ${label.slice(0, 120)}: ${actionContext.summary}` : `กดปุ่ม ${label.slice(0, 120)}`,
        entityCode: actionContext?.code || undefined,
        metadata: {
          tracker: "auto-click",
          path: window.location.pathname,
          actionContextSummary: actionContext?.summary,
          contextText: actionContext?.contextText,
          productCode: actionContext?.code,
          productName: actionContext?.name,
        },
      })
    }

    document.addEventListener("click", handleClick, true)
    return () => document.removeEventListener("click", handleClick, true)
  }, [])

  return null
}
