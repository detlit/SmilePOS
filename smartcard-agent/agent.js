/*
 * Thai National ID Card - Local HTTP Bridge (Windows-only, no compile needed)
 * ---------------------------------------------------------------------------
 *  Uses koffi to call Windows WinSCard.dll directly.
 *  No native module compilation required - works with any Node.js version.
 *
 *  Endpoints:
 *    GET /ping  -> { ok:true, readers:[...] }
 *    GET /read  -> Thai ID card JSON matching the web app schema
 *
 *  Listens on http://127.0.0.1:8182 (loopback only)
 */

const express = require("express");
const cors = require("cors");
const iconv = require("iconv-lite");
const koffi = require("koffi");

const PORT = Number(process.env.PORT) || 8182;
// bind ทุก interface เป็นค่าเริ่มต้น เพื่อให้ Podman/Docker container เรียกผ่าน
// host.containers.internal / host.docker.internal ได้โดยตรง โดยไม่ต้องตั้ง portproxy
// ผู้ใช้สามารถบังคับ loopback อย่างเดียวได้ด้วย env HOST=127.0.0.1
const HOST = process.env.HOST || "0.0.0.0";

// ---------- WinSCard bindings ----------
const winscard = koffi.load("WinSCard.dll");

const SCARD_IO_REQUEST = koffi.struct("SCARD_IO_REQUEST", {
    dwProtocol: "uint32",
    cbPciLength: "uint32",
});

const SCardEstablishContext = winscard.func(
    "long __stdcall SCardEstablishContext(uint32 dwScope, void *pvReserved1, void *pvReserved2, _Out_ uintptr_t *phContext)"
);
const SCardReleaseContext = winscard.func(
    "long __stdcall SCardReleaseContext(uintptr_t hContext)"
);
const SCardListReadersW = winscard.func(
    "long __stdcall SCardListReadersW(uintptr_t hContext, str16 mszGroups, _Inout_ void *mszReaders, _Inout_ uint32 *pcchReaders)"
);
const SCardConnectW = winscard.func(
    "long __stdcall SCardConnectW(uintptr_t hContext, str16 szReader, uint32 dwShareMode, uint32 dwPreferredProtocols, _Out_ uintptr_t *phCard, _Out_ uint32 *pdwActiveProtocol)"
);
const SCardDisconnect = winscard.func(
    "long __stdcall SCardDisconnect(uintptr_t hCard, uint32 dwDisposition)"
);
const SCardTransmit = winscard.func(
    "long __stdcall SCardTransmit(uintptr_t hCard, SCARD_IO_REQUEST *pioSendPci, _In_ uint8 *pbSendBuffer, uint32 cbSendLength, _Inout_ SCARD_IO_REQUEST *pioRecvPci, _Out_ uint8 *pbRecvBuffer, _Inout_ uint32 *pcbRecvLength)"
);
const SCardStatusW = winscard.func(
    "long __stdcall SCardStatusW(uintptr_t hCard, _Inout_ void *szReaderName, _Inout_ uint32 *pcchReaderLen, _Out_ uint32 *pdwState, _Out_ uint32 *pdwProtocol, _Inout_ uint8 *pbAtr, _Inout_ uint32 *pcbAtrLen)"
);

// WinSCard constants
const SCARD_SCOPE_USER = 0;
const SCARD_SHARE_SHARED = 2;
const SCARD_PROTOCOL_T0 = 1;
const SCARD_PROTOCOL_T1 = 2;
const SCARD_LEAVE_CARD = 0;
const SCARD_S_SUCCESS = 0;
const SCARD_E_NO_READERS_AVAILABLE = 0x8010002E;

const hex = (n) => "0x" + (n >>> 0).toString(16);

// ---------- APDU commands ----------
const SELECT_APPLET = [
    0x00, 0xA4, 0x04, 0x00, 0x08,
    0xA0, 0x00, 0x00, 0x00, 0x54, 0x48, 0x00, 0x01,
];

const CMD = {
    CID:         [0x80, 0xB0, 0x00, 0x04, 0x02, 0x00, 0x0D],
    NAME_TH:     [0x80, 0xB0, 0x00, 0x11, 0x02, 0x00, 0x64],
    NAME_EN:     [0x80, 0xB0, 0x01, 0x75, 0x02, 0x00, 0x64],
    BIRTH:       [0x80, 0xB0, 0x00, 0xD9, 0x02, 0x00, 0x08],
    GENDER:      [0x80, 0xB0, 0x00, 0xE1, 0x02, 0x00, 0x01],
    ISSUE_DATE:  [0x80, 0xB0, 0x01, 0x67, 0x02, 0x00, 0x08],
    EXPIRE_DATE: [0x80, 0xB0, 0x01, 0x6F, 0x02, 0x00, 0x08],
    ADDRESS:     [0x80, 0xB0, 0x15, 0x79, 0x02, 0x00, 0x64],
};

function photoCmds() {
    const out = [];
    let p1 = 0x01, p2 = 0x7B;
    for (let i = 0; i < 20; i++) {
        out.push([0x80, 0xB0, p1, p2, 0x02, 0x00, 0xFF]);
        p2 += 0xFF;
        if (p2 > 0xFF) { p1 += 1; p2 = p2 & 0xFF; }
    }
    return out;
}

// ---------- WinSCard helpers ----------
function establishContext() {
    const ctx = [0n];
    const rc = SCardEstablishContext(SCARD_SCOPE_USER, null, null, ctx);
    if (rc !== SCARD_S_SUCCESS) throw new Error("SCardEstablishContext failed " + hex(rc));
    return ctx[0];
}

function releaseContext(ctx) {
    try { SCardReleaseContext(ctx); } catch { /* ignore */ }
}

function listReaders(ctx) {
    const buf = Buffer.alloc(4096);
    const lenRef = [buf.length / 2];
    const rc = SCardListReadersW(ctx, null, buf, lenRef);
    if (rc !== SCARD_S_SUCCESS) {
        if ((rc >>> 0) === SCARD_E_NO_READERS_AVAILABLE) return [];
        throw new Error("SCardListReadersW failed " + hex(rc));
    }
    const byteLen = lenRef[0] * 2;
    const names = [];
    let start = 0;
    for (let i = 0; i + 1 < byteLen; i += 2) {
        if (buf[i] === 0 && buf[i + 1] === 0) {
            if (i > start) names.push(buf.slice(start, i).toString("utf16le"));
            start = i + 2;
        }
    }
    return names.filter(Boolean);
}

function connectReader(ctx, readerName) {
    const hCard = [0n];
    const proto = [0];
    const rc = SCardConnectW(ctx, readerName, SCARD_SHARE_SHARED,
        SCARD_PROTOCOL_T0 | SCARD_PROTOCOL_T1, hCard, proto);
    if (rc !== SCARD_S_SUCCESS) {
        throw new Error("SCardConnectW failed " + hex(rc) + " (card inserted?)");
    }
    return { hCard: hCard[0], protocol: proto[0] };
}

function disconnect(hCard) {
    try { SCardDisconnect(hCard, SCARD_LEAVE_CARD); } catch { /* ignore */ }
}

function getAtr(hCard) {
    const nameBuf = Buffer.alloc(256);
    const nameLen = [128];
    const stateRef = [0];
    const protoRef = [0];
    const atrBuf = Buffer.alloc(33);
    const atrLen = [33];
    const rc = SCardStatusW(hCard, nameBuf, nameLen, stateRef, protoRef, atrBuf, atrLen);
    if (rc !== SCARD_S_SUCCESS) return Buffer.alloc(0);
    return Buffer.from(atrBuf.slice(0, atrLen[0]));
}

function transmit(hCard, protocol, apduBytes, expectedLen) {
    const send = Buffer.from(apduBytes);
    const recv = Buffer.alloc((expectedLen || 256) + 2);
    const recvLen = [recv.length];
    const pioSend = { dwProtocol: protocol, cbPciLength: 8 };
    const rc = SCardTransmit(hCard, pioSend, send, send.length, null, recv, recvLen);
    if (rc !== SCARD_S_SUCCESS) throw new Error("SCardTransmit failed " + hex(rc));
    return Buffer.from(recv.slice(0, recvLen[0]));
}

// Thai ID: data cmd returns SW 61 XX -> must GET RESPONSE.
//   new card (ATR 3B78/3B79): GET RESPONSE p2 = 0x00
//   old card (ATR 3B67):      GET RESPONSE p2 = 0x01
function makeApduFn(hCard, protocol, atrIsOld) {
    const getRespP2 = atrIsOld ? 0x01 : 0x00;
    return function apdu(cmd) {
        const le = cmd[cmd.length - 1];
        transmit(hCard, protocol, cmd, le);
        const getResp = [0x00, 0xC0, 0x00, getRespP2, le];
        const data = transmit(hCard, protocol, getResp, le);
        return data.slice(0, data.length - 2);
    };
}

// ---------- text helpers ----------
const decodeTh = (buf) => iconv.decode(buf, "tis-620").replace(/\u0000/g, "").trim();

function splitName(raw) {
    const parts = raw.split("#").map((s) => s.trim()).filter(Boolean);
    const [title = "", first = "", last = ""] = parts.length >= 3
        ? [parts[0], parts[1], parts[parts.length - 1]]
        : parts;
    return {
        titleTH: title,
        firstNameTH: first,
        lastNameTH: last,
        fullNameTH: [title, first, last].filter(Boolean).join(" "),
    };
}

const cleanAddress = (raw) => raw.split("#").map((s) => s.trim()).filter(Boolean).join(" ");
const cleanDate = (raw) => raw.replace(/\D/g, "");

// ---------- read card ----------
function readCardSync() {
    const ctx = establishContext();
    try {
        const readers = listReaders(ctx);
        if (!readers.length) throw new Error("No smart card reader detected on this system");

        const readerName = readers[0];
        const conn = connectReader(ctx, readerName);
        try {
            const atr = getAtr(conn.hCard);
            const atrHex = atr.toString("hex");
            const atrIsOld = atrHex.startsWith("3b67");

            transmit(conn.hCard, conn.protocol, SELECT_APPLET, 0);

            const apdu = makeApduFn(conn.hCard, conn.protocol, atrIsOld);
            const cidB = apdu(CMD.CID);
            const nameThB = apdu(CMD.NAME_TH);
            const birthB = apdu(CMD.BIRTH);
            const genderB = apdu(CMD.GENDER);
            const addrB = apdu(CMD.ADDRESS);
            const issueB = apdu(CMD.ISSUE_DATE);
            const expireB = apdu(CMD.EXPIRE_DATE);

            const photoParts = [];
            for (const c of photoCmds()) photoParts.push(apdu(c));
            const photo = Buffer.concat(photoParts).toString("base64");

            const name = splitName(decodeTh(nameThB));
            return {
                cid: cidB.toString("ascii").trim(),
                ...name,
                birthDate: cleanDate(birthB.toString("ascii")),
                gender: genderB.toString("ascii").trim(),
                address: cleanAddress(decodeTh(addrB)),
                issueDate: cleanDate(issueB.toString("ascii")),
                expireDate: cleanDate(expireB.toString("ascii")),
                photo,
                _reader: readerName,
                _atr: atrHex,
            };
        } finally {
            disconnect(conn.hCard);
        }
    } finally {
        releaseContext(ctx);
    }
}

function readCard() {
    return new Promise((resolve, reject) => {
        setImmediate(() => {
            try { resolve(readCardSync()); }
            catch (e) { reject(e); }
        });
    });
}

function listReadersSafe() {
    try {
        const ctx = establishContext();
        try { return listReaders(ctx); }
        finally { releaseContext(ctx); }
    } catch { return []; }
}

// ---------- HTTP ----------
const app = express();
// รองรับ CORS ทุก origin
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }
    next();
});
// ถ้าต้องการจำกัด origin เฉพาะ production สามารถแก้ไข '*' เป็น origin ที่ต้องการได้
// app.use(cors({ origin: 'http://localhost:4000', credentials: false }));
app.disable("x-powered-by");

app.get("/", (_req, res) => {
    res.type("text/plain").send(
        "Thai SmartCard Agent (koffi + WinSCard.dll)\n" +
        "  GET /ping  - health check\n" +
        "  GET /read  - read inserted Thai ID card\n"
    );
});

app.get("/ping", (_req, res) => {
    const readers = listReadersSafe();
    res.json({
        ok: true,
        name: "thai-smartcard-agent",
        engine: "koffi+WinSCard",
        version: "1.0.0",
        readers,
    });
});

app.get("/read", async (_req, res) => {
    try {
        const data = await readCard();
        res.json(data);
    } catch (e) {
        res.status(500).json({ error: (e && e.message) ? e.message : String(e) });
    }
});

app.listen(PORT, HOST, () => {
    console.log("");
    console.log("Thai SmartCard Agent running (engine: koffi + WinSCard.dll)");
    console.log("  Listen : http://" + HOST + ":" + PORT + (HOST === "0.0.0.0" ? "  (all interfaces)" : ""));
    console.log("  Health : http://127.0.0.1:" + PORT + "/ping");
    console.log("  Read   : http://127.0.0.1:" + PORT + "/read");
    if (HOST === "0.0.0.0") {
        try {
            const os = require("os");
            const ifs = os.networkInterfaces();
            const ips = [];
            for (const name of Object.keys(ifs)) {
                for (const a of ifs[name] || []) {
                    if (a.family === "IPv4" && !a.internal) ips.push(a.address);
                }
            }
            if (ips.length) {
                console.log("  Reachable from LAN/container at:");
                ips.forEach((ip) => console.log("    http://" + ip + ":" + PORT));
            }
        } catch { /* ignore */ }
    }
    const readers = listReadersSafe();
    if (readers.length) {
        console.log("");
        console.log("Readers detected:");
        readers.forEach((r, i) => console.log("  [" + i + "] " + r));
    } else {
        console.log("");
        console.log("(No reader detected yet - plug in USB and hit /ping again)");
    }
    console.log("");
    console.log("(Press Ctrl+C to stop)");
    console.log("");
});
