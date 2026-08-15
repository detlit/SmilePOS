// Smart Card Agent auto-discovery
// Probes common local HTTP bridges used by Thai ID smart card readers.
//
// Strategy: prefer server-side proxy (`/api/smartcard/detect` and
// `/api/smartcard/read`) because browsers often block fetches from
// `http://localhost:3000` to `http://127.0.0.1:<port>` (Private Network
// Access / mixed-origin policies) and produce "Failed to fetch" even
// though the agent is running. Node.js on the server has no such
// restriction.

// host.containers.internal = Podman, host.docker.internal = Docker Desktop / Linux Docker
const _HOST_ALIASES = ["host.containers.internal", "host.docker.internal"]
// 8182 = ค่าเริ่มต้น Agent, 18182 = port-proxy ที่ installer ตั้งให้ (สำหรับ Agent เก่าที่ bind 127.0.0.1)
const _SMARTCARD_PORTS = [8182, 18182, 8189, 8188, 8443, 6543, 5000, 3001, 9182, 9876]

export const SMARTCARD_CANDIDATES: string[] = [
    "http://127.0.0.1:8182",
    "http://localhost:8182",
    "http://127.0.0.1:18182",
    "http://localhost:18182",
    ..._HOST_ALIASES.flatMap((h) => _SMARTCARD_PORTS.map((p) => `http://${h}:${p}`)),
    "http://127.0.0.1:8189",
    "http://127.0.0.1:8443",
    "https://127.0.0.1:8443",
    "http://127.0.0.1:8188",
    "http://127.0.0.1:6543",
    "http://127.0.0.1:5000",
    "http://127.0.0.1:3001",
    "http://127.0.0.1:9182",
    "http://127.0.0.1:9876",
];

export interface DetectResult {
    url: string;
    pingMs: number;
    info?: any;
}

async function directPing(baseUrl: string, timeoutMs: number): Promise<DetectResult | null> {
    const url = baseUrl.replace(/\/+$/, "");
    const start = Date.now();
    try {
        const controller = new AbortController();
        const to = setTimeout(() => controller.abort(), timeoutMs);
        const res = await fetch(`${url}/ping`, { signal: controller.signal, cache: "no-store" }).catch(() => null);
        clearTimeout(to);
        if (!res || !res.ok) return null;
        let info: any = undefined;
        try { info = await res.clone().json(); } catch { /* non-JSON ok */ }
        return { url, pingMs: Date.now() - start, info };
    } catch {
        return null;
    }
}

/**
 * Ping a single URL with a short timeout.
 * Tries the server-side proxy first (to bypass CORS / Private Network Access),
 * then falls back to a direct browser fetch.
 */
export async function pingSmartcardAgent(baseUrl: string, timeoutMs = 1500): Promise<DetectResult | null> {
    const url = baseUrl.replace(/\/+$/, "");
    if (typeof window !== "undefined") {
        try {
            const controller = new AbortController();
            const to = setTimeout(() => controller.abort(), timeoutMs + 500);
            const qs = new URLSearchParams({ preferred: url, timeoutMs: String(timeoutMs) });
            const res = await fetch(`/api/smartcard/detect?${qs.toString()}`, {
                signal: controller.signal,
                cache: "no-store",
            }).catch(() => null);
            clearTimeout(to);
            if (res && res.ok) {
                const j = await res.json().catch(() => null) as any;
                if (j && j.ok && j.url === url) {
                    return { url: j.url, pingMs: j.pingMs ?? 0, info: j.info };
                }
            }
        } catch { /* fall through */ }
    }
    return directPing(url, timeoutMs);
}

/**
 * Probe candidate URLs and return the first that responds.
 * Prefers the server-side proxy which tries all ports in parallel in Node.
 */
export async function detectSmartcardAgent(opts?: {
    preferred?: string | null;
    extra?: string[];
    timeoutMs?: number;
}): Promise<DetectResult | null> {
    const { preferred, extra = [], timeoutMs = 1500 } = opts || {};

    if (typeof window !== "undefined") {
        try {
            const controller = new AbortController();
            const to = setTimeout(() => controller.abort(), timeoutMs * 2 + 1500);
            const qs = new URLSearchParams();
            if (preferred) qs.set("preferred", preferred);
            qs.set("timeoutMs", String(timeoutMs));
            const res = await fetch(`/api/smartcard/detect?${qs.toString()}`, {
                signal: controller.signal,
                cache: "no-store",
            }).catch(() => null);
            clearTimeout(to);
            if (res && res.ok) {
                const j = await res.json().catch(() => null) as any;
                if (j && j.ok && j.url) {
                    return { url: j.url, pingMs: j.pingMs ?? 0, info: j.info };
                }
            }
        } catch { /* fall through to direct probes */ }
    }

    const list = Array.from(new Set([
        ...(preferred ? [preferred] : []),
        ...extra,
        ...SMARTCARD_CANDIDATES,
    ].map((u) => u.replace(/\/+$/, ""))));

    const results = await Promise.all(list.map((u) => directPing(u, timeoutMs)));
    for (let i = 0; i < results.length; i++) {
        if (results[i]) return results[i];
    }
    return null;
}

/**
 * Read from the Smart Card Agent via the server-side proxy.
 * Use this instead of fetching `${url}/read` directly from the browser
 * so that CORS / Private Network Access do not cause "Failed to fetch".
 */
export async function readSmartcardThroughProxy(
    baseUrl: string,
    path: string = "/read",
    timeoutMs: number = 15000,
): Promise<any> {
    const qs = new URLSearchParams({ url: baseUrl, path, timeoutMs: String(timeoutMs) });
    const controller = new AbortController();
    const to = setTimeout(() => controller.abort(), timeoutMs + 1000);
    try {
        const res = await fetch(`/api/smartcard/read?${qs.toString()}`, {
            signal: controller.signal,
            cache: "no-store",
        });
        const ct = res.headers.get("content-type") || "";
        if (ct.includes("application/json")) {
            const j = await res.json();
            if (!res.ok) throw new Error(j?.error || `HTTP ${res.status}`);
            return j;
        }
        const text = await res.text();
        if (!res.ok) throw new Error(text || `HTTP ${res.status}`);
        try { return JSON.parse(text); } catch { return { raw: text }; }
    } finally {
        clearTimeout(to);
    }
}

/**
 * Resolve the working smart card agent URL.
 * 1. Try the URL saved in localStorage first.
 * 2. If it does not respond, auto-detect among common ports.
 * 3. If found, update localStorage so subsequent calls are instant.
 */
export async function resolveSmartcardAgent(opts?: { forceDetect?: boolean }): Promise<DetectResult | null> {
    if (typeof window === "undefined") return null;
    const saved = localStorage.getItem("smartcard_url") || "";

    if (!opts?.forceDetect && saved) {
        const first = await pingSmartcardAgent(saved, 1500);
        if (first) return first;
    }

    const found = await detectSmartcardAgent({ preferred: saved || null });
    if (found) {
        localStorage.setItem("smartcard_url", found.url);
    }
    return found;
}
