import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const ALLOWED_STATUSES = new Set(["clicked", "success", "failed", "cancelled", "blocked"]);
const SENSITIVE_KEY_PATTERN = /(password|pass|token|secret|apiKey|apiToken|authorization|id_card|idcard|citizen|cardno|faceDescriptor|image|base64|file|blob)/i;

function toSafeString(value: unknown, fallback = "") {
  if (value === null || value === undefined) return fallback;
  return String(value).trim();
}

function toNullableString(value: unknown) {
  const text = toSafeString(value);
  return text ? text : null;
}

function toNullableInt(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.trunc(parsed) : null;
}

function normalizeStatus(value: unknown) {
  const status = toSafeString(value, "success").toLowerCase();
  return ALLOWED_STATUSES.has(status) ? status : "failed";
}

function sanitizeMetadata(value: unknown, depth = 0): unknown {
  if (value === null || value === undefined) return value;
  if (depth > 4) return "[truncated]";

  if (typeof value === "string") {
    return value.length > 800 ? `${value.slice(0, 800)}...` : value;
  }

  if (typeof value === "number" || typeof value === "boolean") return value;

  if (Array.isArray(value)) {
    return value.slice(0, 50).map((item) => sanitizeMetadata(item, depth + 1));
  }

  if (typeof value === "object") {
    const output: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value as Record<string, unknown>).slice(0, 80)) {
      if (SENSITIVE_KEY_PATTERN.test(key)) {
        output[key] = "[redacted]";
      } else {
        output[key] = sanitizeMetadata(item, depth + 1);
      }
    }
    return output;
  }

  return String(value);
}

function buildDateRange(from: string | null, to: string | null) {
  const range: Record<string, Date> = {};

  if (from) {
    const start = new Date(from);
    if (!Number.isNaN(start.getTime())) range.gte = start;
  }

  if (to) {
    const end = new Date(to);
    if (!Number.isNaN(end.getTime())) {
      if (/^\d{4}-\d{2}-\d{2}$/.test(to)) {
        end.setHours(23, 59, 59, 999);
      }
      range.lte = end;
    }
  }

  return Object.keys(range).length > 0 ? range : undefined;
}

type LogbookCompactRow = {
  id: number;
  actionType?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  entityCode?: string | null;
  status?: string | null;
};

function getLogReference(log: LogbookCompactRow) {
  const entityCode = toSafeString(log.entityCode);
  if (entityCode) return entityCode;
  return toSafeString(log.entityId);
}

function getCancelCompactKey(log: LogbookCompactRow) {
  if (toSafeString(log.actionType).toLowerCase() !== "cancel") return "";

  const reference = getLogReference(log);
  if (!reference) return "";

  const moduleName = toSafeString(log.entityType, "unknown").toLowerCase();
  return `${moduleName}:${reference.toLowerCase()}`;
}

function compactCancelLogs<T extends LogbookCompactRow>(logs: T[]) {
  const seenCancelReferences = new Set<string>();
  return logs.filter((log) => {
    const compactKey = getCancelCompactKey(log);
    if (!compactKey) return true;
    if (seenCancelReferences.has(compactKey)) return false;

    seenCancelReferences.add(compactKey);
    return true;
  });
}

function buildStatusSummary(logs: LogbookCompactRow[]) {
  return logs.reduce((acc: Record<string, number>, row) => {
    const status = row.status || "unknown";
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const company = toSafeString(data.company);
    const actionType = toSafeString(data.actionType).toLowerCase();
    const entityType = toSafeString(data.entityType).toLowerCase();

    if (!company) {
      return NextResponse.json({ error: "company is required" }, { status: 400 });
    }

    if (!actionType || !entityType) {
      return NextResponse.json({ error: "actionType and entityType are required" }, { status: 400 });
    }

    const log = await prisma.userActionLog.create({
      data: {
        company,
        personId: toNullableInt(data.personId),
        personName: toNullableString(data.personName) || "ไม่ทราบผู้ใช้",
        actionType,
        entityType,
        entityId: toNullableString(data.entityId),
        entityCode: toNullableString(data.entityCode),
        route: toNullableString(data.route),
        buttonLabel: toNullableString(data.buttonLabel),
        status: normalizeStatus(data.status),
        message: toNullableString(data.message),
        errorMessage: toNullableString(data.errorMessage),
        metadata: data.metadata === undefined ? undefined : sanitizeMetadata(data.metadata) as any,
        durationMs: toNullableInt(data.durationMs),
        sessionId: toNullableString(data.sessionId),
      },
    });

    return NextResponse.json({ ok: true, log });
  } catch (error: any) {
    console.error("[Logbook] POST error:", error);
    return NextResponse.json({ error: error?.message || "Failed to create logbook entry" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const company = toSafeString(searchParams.get("company"));

    if (!company) {
      return NextResponse.json({ error: "company is required" }, { status: 400 });
    }

    const limitParam = Number(searchParams.get("limit") || 100);
    const pageParam = Number(searchParams.get("page") || 1);
    const limit = Math.min(Math.max(Number.isFinite(limitParam) ? limitParam : 100, 1), 500);
    const page = Math.max(Number.isFinite(pageParam) ? pageParam : 1, 1);
    const skip = (page - 1) * limit;
    const dateRange = buildDateRange(searchParams.get("from"), searchParams.get("to"));
    const actionType = toNullableString(searchParams.get("actionType"));
    const entityType = toNullableString(searchParams.get("entityType"));
    const status = toNullableString(searchParams.get("status"));
    const personName = toNullableString(searchParams.get("personName"));
    const keyword = toNullableString(searchParams.get("keyword"));

    const whereParts: any[] = [
      { company },
      {
        NOT: [
          { actionType: "confirm", status: "clicked" },
          { actionType: "cancel", entityType: "sale", status: "clicked", buttonLabel: "ยกเลิกบิล" },
        ],
      },
    ];
    if (dateRange) whereParts.push({ createdAt: dateRange });
    if (actionType && actionType !== "all") whereParts.push({ actionType });
    if (entityType && entityType !== "all") whereParts.push({ entityType });
    if (status && status !== "all") whereParts.push({ status });
    if (personName && personName !== "all") {
      whereParts.push({ personName: { contains: personName, mode: "insensitive" } });
    }
    if (keyword) {
      whereParts.push({
        OR: [
          { buttonLabel: { contains: keyword, mode: "insensitive" } },
          { message: { contains: keyword, mode: "insensitive" } },
          { errorMessage: { contains: keyword, mode: "insensitive" } },
          { route: { contains: keyword, mode: "insensitive" } },
          { entityCode: { contains: keyword, mode: "insensitive" } },
          { entityId: { contains: keyword, mode: "insensitive" } },
        ],
      });
    }

    const where = whereParts.length > 1 ? { AND: whereParts } : whereParts[0];

    const [matchingLogs, actors] = await Promise.all([
      prisma.userActionLog.findMany({
        where,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        select: {
          id: true,
          actionType: true,
          entityType: true,
          entityId: true,
          entityCode: true,
          status: true,
        },
      }),
      prisma.userActionLog.findMany({
        where: { company },
        select: { personName: true },
        distinct: ["personName"],
        orderBy: { personName: "asc" },
        take: 200,
      }),
    ]);

    const compactedLogs = compactCancelLogs(matchingLogs);
    const pageIds = compactedLogs.slice(skip, skip + limit).map((log) => log.id);
    const pageLogRows = pageIds.length > 0 ? await prisma.userActionLog.findMany({
      where: { id: { in: pageIds } },
    }) : [];
    const pageLogById = new Map(pageLogRows.map((log) => [log.id, log]));
    const logs = pageIds.map((id) => pageLogById.get(id)).filter(Boolean);
    const total = compactedLogs.length;
    const summary = buildStatusSummary(compactedLogs);

    return NextResponse.json({
      logs,
      total,
      page,
      limit,
      summary,
      actors: actors.map((actor) => actor.personName).filter(Boolean),
    });
  } catch (error: any) {
    console.error("[Logbook] GET error:", error);
    return NextResponse.json({ error: error?.message || "Failed to fetch logbook entries" }, { status: 500 });
  }
}
