// เครื่องยนต์ "ไล่บัญชี lot ใหม่ทั้งเส้น" (lot ledger rebuild)
//
// ปัญหาที่แก้:
//   ตัวซ่อมเดิมผูกเฉพาะ "รายการกำพร้า" (ไม่มี lot) เข้ากับ lot ที่ยังมีของ แต่ไม่เคยแตะรายการ
//   ที่ผูก lot ไว้แล้วแบบเกินจริง เช่นใบโอนออก 400 หน่วยที่ไปตัด lot ซึ่งมีของจริงแค่ 20 หน่วย
//   ส่วนเกิน 380 หน่วยจะหายไปจากบัญชี lot (โดนตัดจบที่ 0) ทำให้ "ยอดคงเหลือรวมของ lot"
//   ไม่มีทางเท่ากับ "ยอดคำนวณ" ของสินค้าไม่ว่าจะกดซ่อมกี่ครั้ง — เพราะหน้าสรุปยอดคงเหลือ
//   คำนวณคงเหลือของแต่ละ lot จาก transaction ใหม่ทุกครั้ง ไม่ได้อ่านค่า balance ที่บันทึกไว้
//
// วิธีใหม่ — ไล่เหตุการณ์ทั้งหมดตามเวลาจริงแล้วจัดสรรใหม่:
//   ของเข้า  = ยอดรับเข้าของ lot + TRANSFER_IN + TRANSFER_RETURN + RETURN + ADJUST(+)
//   ของออก   = SALE + TRANSFER_OUT + ADJUST(−)
//   ของออกแต่ละรายการจะตัดจาก lot ที่ "มีของอยู่จริง ณ เวลานั้น" โดยเคารพ lot เดิมที่รายการ
//   ระบุไว้ก่อน (ถ้าของพอ) แล้วค่อยไล่ FEFO — รายการไหนที่ lot เดิมพอ จะไม่ถูกแตะเลย
//
// ผลลัพธ์ที่การันตี:
//   • ไม่มี lot ไหนติดลบ และไม่มี lot ไหนถูกตัดเกินจำนวนที่รับเข้า/รับโอนมาจริง
//   • ผลรวมคงเหลือทุก lot = ของเข้าทั้งหมด − ของออกทั้งหมด (เท่ายอดคำนวณของสินค้าเป๊ะ ๆ
//     เมื่อยอดขายจาก transaction ตรงกับยอดขายจากบิลแล้ว)
//
// เครื่องยนต์นี้เป็นฟังก์ชันบริสุทธิ์ (ไม่แตะฐานข้อมูล) — ผู้เรียกคือ src/lib/lotRelink.ts

const EPS = 1e-9;

export type LedgerDirection = "in" | "out";

export interface LedgerLot {
    /** ติดลบ = lot ที่แผนจะสร้างใหม่ (ยังไม่มีในฐานข้อมูล) */
    id: number;
    lot: string | null;
    dateExp: Date | null;
    /** เวลาที่ของเข้าสต็อก (ms) — ใช้จัดลำดับกับรายการขาย/โอนออก */
    receivedAt: number;
    /** ยอดรับเข้าตั้งต้น (lot รับโอน = 0 เพราะยอดมาจากรายการ TRANSFER_IN) */
    baseIn: number;
    /**
     * ยอดออกที่ "ตรึงไว้กับ lot นี้" ห้ามย้าย — หักออกตั้งแต่ก่อนเริ่มไล่เหตุการณ์
     * ใช้กับสินค้ายุคเก่าที่ยอดขายยังผูก lot อยู่ในตัวบิล (ไม่มี SALE transaction)
     * ซึ่งหน้าสรุปยอดคงเหลือยังคำนวณจากบิลอยู่ จึงย้าย lot ให้ไม่ได้
     */
    pinnedOut?: number;
}

export interface LedgerTx<TRef = unknown> {
    /** ติดลบ = รายการที่แผนจะสร้างใหม่ (ยังไม่มีในฐานข้อมูล) */
    id: number;
    type: string;
    direction: LedgerDirection;
    /** จำนวน (บวกเสมอ) */
    qty: number;
    /** เวลาของรายการ (ms) */
    at: number;
    /** lot ที่ผูกอยู่ตอนนี้ — null = กำพร้า หรือชี้ lot ที่ไม่มีอยู่จริง */
    lotId: number | null;
    /** lot ที่ควรลองก่อนถ้า lotId ใช้ไม่ได้ (เช่นเลข lot ในรายการตรงกับหลาย lot) */
    preferLotIds?: number[];
    /** ข้อมูลของผู้เรียก — เครื่องยนต์ไม่แตะ ส่งกลับมาให้ตอนแปลงเป็นคำสั่งเขียน DB */
    ref?: TRef;
}

export interface LedgerPiece {
    lotId: number;
    lot: string | null;
    dateExp: Date | null;
    qty: number;
    /** คงเหลือของ lot นั้นหลังรายการนี้ */
    balanceAfter: number;
}

export interface LedgerMove<TRef = unknown> {
    tx: LedgerTx<TRef>;
    pieces: LedgerPiece[];
    /** ส่วนที่ไม่มี lot ไหนรองรับ — คงเป็นรายการไม่มี lot ต่อไป */
    leftover: number;
    /** true = การผูก lot ต่างจากเดิม ต้องเขียนกลับฐานข้อมูล */
    changed: boolean;
}

export interface LedgerLotResult {
    lotId: number;
    lot: string | null;
    dateExp: Date | null;
    /** ของเข้าทั้งหมดของ lot นี้ (รับเข้า + รับโอน + คืน + ปรับเพิ่ม) */
    totalIn: number;
    /** ของออกทั้งหมดที่จัดสรรลง lot นี้ (ขาย + โอนออก + ปรับลด) */
    totalOut: number;
    /** คงเหลือปลายทาง — ติดลบได้เฉพาะกรณี pinnedOut (ยอดขายยุคเก่าที่ย้าย lot ไม่ได้) */
    endBalance: number;
}

export interface LedgerResult<TRef = unknown> {
    lots: LedgerLotResult[];
    moves: LedgerMove<TRef>[];
    /** ของออกที่ไม่มี lot ไหนรองรับเลย (ขาย/โอนออกเกินของที่รับเข้ามาจริง) */
    unallocatedOut: number;
    /** ของเข้าที่ไม่รู้ว่าเข้า lot ไหน และไม่มี lot ให้ฝากเลย */
    unattachedIn: number;
    totalIn: number;
    totalOut: number;
    endTotal: number;
}

/**
 * ประเภทรายการนี้นับเป็นของเข้าหรือของออก — ต้องตรงกับชุดที่ calculateLotBalances ใช้
 * (TRANSFER_RETURN = ผู้รับยืนยันไม่ครบ ของกลับเข้า lot ผู้ส่ง / RETURN = คืนสินค้า-ยกเลิกบิล)
 */
export function ledgerDirectionOf(type: string | null | undefined, signedQty: number): LedgerDirection | null {
    const t = String(type || "").toUpperCase();
    if (t === "SALE" || t === "TRANSFER_OUT") return "out";
    if (t === "TRANSFER_IN" || t === "TRANSFER_RETURN" || t === "RETURN") return "in";
    if (t === "ADJUST") return signedQty < -EPS ? "out" : signedQty > EPS ? "in" : null;
    return null;
}

interface LotState {
    lot: LedgerLot;
    remaining: number;
    totalIn: number;
    totalOut: number;
}

/** ปัดเศษทศนิยมลอย (0.1+0.2) ทิ้งตอนสรุปผล — จำนวนยาไม่มีทางละเอียดกว่า 6 ตำแหน่ง */
const r6 = (n: number) => Math.round(n * 1e6) / 1e6;

const timeOf = (v: unknown): number => {
    if (v == null) return 0;
    const t = new Date(v as any).getTime();
    return Number.isFinite(t) ? t : 0;
};

/** FEFO: หมดอายุใกล้สุดก่อน, ไม่มีวันหมดอายุไว้ท้าย, เท่ากันเรียงตาม id */
const fefoCompare = (a: LotState, b: LotState) => {
    const ta = a.lot.dateExp ? timeOf(a.lot.dateExp) : Infinity;
    const tb = b.lot.dateExp ? timeOf(b.lot.dateExp) : Infinity;
    if (ta !== tb) return ta - tb;
    return a.lot.id - b.lot.id;
};

/**
 * ไล่บัญชี lot ใหม่ทั้งเส้นตามลำดับเวลา
 * @param lots  lot ทั้งหมดของสินค้า (รวม lot ที่แผนจะสร้างใหม่ ใช้ id ติดลบ)
 * @param txs   รายการเคลื่อนไหวทั้งหมด (รวมรายการที่แผนจะสร้างใหม่ ใช้ id ติดลบ)
 */
export function rebuildLotLedger<TRef = unknown>(
    lots: LedgerLot[],
    txs: LedgerTx<TRef>[]
): LedgerResult<TRef> {
    const states = new Map<number, LotState>();
    for (const lot of lots) {
        // pinnedOut = ของออกที่ย้าย lot ไม่ได้ หักทิ้งตั้งแต่ต้น (ทำให้ remaining ติดลบได้)
        const pinned = lot.pinnedOut || 0;
        states.set(lot.id, { lot, remaining: -pinned, totalIn: 0, totalOut: pinned });
    }

    const fefoOrder = Array.from(states.values()).sort(fefoCompare);
    // ของเข้าที่ไม่รู้ lot จะฝากไว้กับ lot ที่รับเข้าล่าสุด (ก่อนเวลาของรายการนั้น)
    const newestFirst = Array.from(states.values())
        .sort((a, b) => b.lot.receivedAt - a.lot.receivedAt || b.lot.id - a.lot.id);

    interface Event {
        at: number;
        seq: number;
        kind: "receipt" | "tx";
        lotId?: number;
        qty?: number;
        tx?: LedgerTx<TRef>;
    }

    const events: Event[] = [];
    let seq = 0;
    for (const lot of lots) {
        if (lot.baseIn > EPS) {
            events.push({ at: lot.receivedAt, seq: seq++, kind: "receipt", lotId: lot.id, qty: lot.baseIn });
        }
    }
    for (const tx of txs) {
        if (tx.qty <= EPS) continue;
        events.push({ at: tx.at, seq: seq++, kind: "tx", tx });
    }

    // เรียงตามเวลา — เวลาเดียวกันให้ "ของเข้า" มาก่อน "ของออก" (ของที่รับวันเดียวกันขายได้ทันที)
    const rank = (e: Event) => (e.kind === "tx" && e.tx!.direction === "out" ? 1 : 0);
    events.sort((a, b) => (a.at - b.at) || (rank(a) - rank(b)) || (a.seq - b.seq));

    const give = (st: LotState, qty: number) => {
        st.remaining += qty;
        st.totalIn += qty;
    };
    const take = (st: LotState, want: number) => {
        const qty = Math.min(st.remaining, want);
        if (qty <= EPS) return 0;
        st.remaining -= qty;
        st.totalOut += qty;
        return qty;
    };
    const pieceOf = (st: LotState, qty: number): LedgerPiece => ({
        lotId: st.lot.id,
        lot: st.lot.lot,
        dateExp: st.lot.dateExp,
        qty: r6(qty),
        balanceAfter: r6(st.remaining)
    });

    /** ลำดับ lot ที่จะลองตัดของรายการหนึ่ง: lot เดิมของรายการก่อน แล้วค่อย FEFO */
    const candidatesFor = (tx: LedgerTx<TRef>): LotState[] => {
        const seen = new Set<number>();
        const order: LotState[] = [];
        const push = (id: number | null | undefined) => {
            if (id == null || seen.has(id)) return;
            const st = states.get(id);
            if (!st) return;
            seen.add(id);
            order.push(st);
        };
        push(tx.lotId);
        for (const id of tx.preferLotIds || []) push(id);
        for (const st of fefoOrder) push(st.lot.id);
        return order;
    };

    /** lot ที่ควรรับ "ของเข้าที่ไม่รู้ lot" — lot ที่รับเข้าล่าสุดก่อนเวลานั้น */
    const inflowHomeFor = (tx: LedgerTx<TRef>): LotState | null => {
        if (tx.lotId != null && states.has(tx.lotId)) return states.get(tx.lotId)!;
        for (const id of tx.preferLotIds || []) {
            if (states.has(id)) return states.get(id)!;
        }
        return newestFirst.find(st => st.lot.receivedAt <= tx.at) || newestFirst[0] || null;
    };

    const moves: LedgerMove<TRef>[] = [];
    const deferred: LedgerMove<TRef>[] = [];
    let unallocatedOut = 0;
    let unattachedIn = 0;

    for (const ev of events) {
        if (ev.kind === "receipt") {
            const st = states.get(ev.lotId!);
            if (st) give(st, ev.qty!);
            continue;
        }

        const tx = ev.tx!;
        if (tx.direction === "in") {
            const home = inflowHomeFor(tx);
            if (!home) {
                unattachedIn += tx.qty;
                moves.push({ tx, pieces: [], leftover: tx.qty, changed: false });
                continue;
            }
            give(home, tx.qty);
            moves.push({
                tx,
                pieces: [pieceOf(home, tx.qty)],
                leftover: 0,
                changed: home.lot.id !== tx.lotId
            });
            continue;
        }

        let left = tx.qty;
        const pieces: LedgerPiece[] = [];
        for (const st of candidatesFor(tx)) {
            if (left <= EPS) break;
            const qty = take(st, left);
            if (qty > EPS) {
                pieces.push(pieceOf(st, qty));
                left -= qty;
            }
        }
        const move: LedgerMove<TRef> = { tx, pieces, leftover: left > EPS ? r6(left) : 0, changed: false };
        moves.push(move);
        if (move.leftover > EPS) deferred.push(move);
    }

    // รอบสอง: ของออกที่ตอนนั้นยังไม่มีของรองรับ (วันที่ในข้อมูลเพี้ยน / ของมาถึงทีหลัง)
    // ให้ตัดจากของที่เหลืออยู่ตอนจบแบบ FEFO — ยอดรวมจึงตรงเสมอแม้ลำดับเวลาไม่สมบูรณ์
    for (const move of deferred) {
        let left = move.leftover;
        for (const st of fefoOrder) {
            if (left <= EPS) break;
            const qty = take(st, left);
            if (qty > EPS) {
                move.pieces.push(pieceOf(st, qty));
                left -= qty;
            }
        }
        move.leftover = left > EPS ? r6(left) : 0;
        unallocatedOut += move.leftover;
    }

    // รายการไหนที่ยังตัดจาก lot เดิมเต็มจำนวน = ไม่ต้องแตะฐานข้อมูล
    for (const move of moves) {
        if (move.tx.direction !== "out") continue;
        if (move.pieces.length === 0) {
            move.changed = move.tx.lotId != null;
            continue;
        }
        move.changed = !(
            move.pieces.length === 1 &&
            move.pieces[0].lotId === move.tx.lotId &&
            move.leftover <= EPS
        );
    }

    const lotResults: LedgerLotResult[] = lots.map(lot => {
        const st = states.get(lot.id)!;
        return {
            lotId: lot.id,
            lot: lot.lot,
            dateExp: lot.dateExp,
            totalIn: r6(st.totalIn),
            totalOut: r6(st.totalOut),
            endBalance: r6(st.remaining)
        };
    });

    const totalIn = lotResults.reduce((s, l) => s + l.totalIn, 0);
    const totalOut = lotResults.reduce((s, l) => s + l.totalOut, 0);

    return {
        lots: lotResults,
        moves,
        unallocatedOut,
        unattachedIn,
        totalIn,
        totalOut,
        endTotal: lotResults.reduce((s, l) => s + l.endBalance, 0)
    };
}
