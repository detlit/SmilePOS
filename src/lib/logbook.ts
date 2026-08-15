export type LogbookStatus = "clicked" | "success" | "failed" | "cancelled" | "blocked";
export type LogbookActionType = "save" | "edit" | "delete" | "confirm" | "cancel" | "sync" | "import" | "export" | "submit" | string;
export type LogbookEntityType = "sale" | "receive" | "product" | "label" | "customer" | "supplier" | "employee" | "promotion" | "order" | "document" | "branch_transfer" | "setting" | "sync" | "report" | "management" | string;

export type LogbookPayload = {
  actionType: LogbookActionType;
  entityType: LogbookEntityType;
  buttonLabel?: string;
  status?: LogbookStatus;
  message?: string;
  errorMessage?: string;
  entityId?: string | number | null;
  entityCode?: string | number | null;
  metadata?: Record<string, unknown>;
  durationMs?: number;
  route?: string;
};

type ActorContext = {
  company: string;
  personId: string;
  personName: string;
  sessionId: string;
};

const SENSITIVE_KEY_PATTERN = /(password|pass|token|secret|apiKey|apiToken|authorization|id_card|idcard|citizen|cardno|faceDescriptor|image|base64|file|blob)/i;

function canUseBrowserStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function getOrCreateSessionId() {
  if (!canUseBrowserStorage()) return "server";

  const existing = localStorage.getItem("logbook_session_id");
  if (existing) return existing;

  const randomPart = typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  localStorage.setItem("logbook_session_id", randomPart);
  return randomPart;
}

export function getCurrentLogbookActor(): ActorContext {
  if (!canUseBrowserStorage()) {
    return { company: "", personId: "", personName: "ไม่ทราบผู้ใช้", sessionId: "server" };
  }

  return {
    company: localStorage.getItem("company_") || localStorage.getItem("company") || "",
    personId: localStorage.getItem("pi_") || localStorage.getItem("personid_") || "",
    personName: localStorage.getItem("person_") || "ไม่ทราบผู้ใช้",
    sessionId: getOrCreateSessionId(),
  };
}

function sanitizeClientMetadata(value: unknown, depth = 0): unknown {
  if (value === null || value === undefined) return value;
  if (depth > 3) return "[truncated]";

  if (typeof value === "string") return value.length > 500 ? `${value.slice(0, 500)}...` : value;
  if (typeof value === "number" || typeof value === "boolean") return value;

  if (Array.isArray(value)) {
    return value.slice(0, 30).map((item) => sanitizeClientMetadata(item, depth + 1));
  }

  if (typeof value === "object") {
    const output: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value as Record<string, unknown>).slice(0, 50)) {
      output[key] = SENSITIVE_KEY_PATTERN.test(key) ? "[redacted]" : sanitizeClientMetadata(item, depth + 1);
    }
    return output;
  }

  return String(value);
}

export async function logAction(payload: LogbookPayload): Promise<void> {
  if (typeof window === "undefined") return;

  const actor = getCurrentLogbookActor();
  if (!actor.company) return;

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 2500);

  try {
    await fetch("/api/logbook", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      keepalive: true,
      signal: controller.signal,
      body: JSON.stringify({
        company: actor.company,
        personId: actor.personId,
        personName: actor.personName,
        sessionId: actor.sessionId,
        actionType: payload.actionType,
        entityType: payload.entityType,
        buttonLabel: payload.buttonLabel,
        status: payload.status || "success",
        message: payload.message,
        errorMessage: payload.errorMessage,
        entityId: payload.entityId === null || payload.entityId === undefined ? undefined : String(payload.entityId),
        entityCode: payload.entityCode === null || payload.entityCode === undefined ? undefined : String(payload.entityCode),
        route: payload.route || window.location.pathname,
        durationMs: payload.durationMs,
        metadata: sanitizeClientMetadata({
          clientTimestamp: new Date().toISOString(),
          ...(payload.metadata || {}),
        }),
      }),
    });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[Logbook] failed to write action log", error);
    }
  } finally {
    window.clearTimeout(timeout);
  }
}

export async function trackAction<T>(payload: LogbookPayload, handler: () => Promise<T>): Promise<T> {
  const startedAt = Date.now();
  try {
    const result = await handler();
    void logAction({ ...payload, status: payload.status || "success", durationMs: Date.now() - startedAt });
    return result;
  } catch (error: any) {
    void logAction({
      ...payload,
      status: "failed",
      durationMs: Date.now() - startedAt,
      errorMessage: error?.message || "Action failed",
    });
    throw error;
  }
}
