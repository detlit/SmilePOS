"use client"
import React, { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, AreaChart, Area, CartesianGrid, PieChart, Pie, Cell, Line, ReferenceLine, ComposedChart } from "recharts";
import axios from 'axios'
import { jwtDecode } from "jwt-decode";

const AnalyzeBranchTab = () => {
  const _n = new Date();
  const [abM, setAbM] = useState(String(_n.getMonth() + 1).padStart(2, '0'));
  const [abY, setAbY] = useState(_n.getFullYear());
  const [abL, setAbL] = useState(false);
  const [branches, setBranches] = useState<any[]>([]);
  const [branchData, setBranchData] = useState<Record<string, { summary: any[]; pl: any }>>({});
  const [selBranch, setSelBranch] = useState('all');
  const [fetchTrigger, setFetchTrigger] = useState(0);
  const MN = ['01','02','03','04','05','06','07','08','09','10','11','12'];
  const MNT = ['\u0e21.\u0e04.','\u0e01.\u0e1e.','\u0e21\u0e35.\u0e04.','\u0e40\u0e21.\u0e22.','\u0e1e.\u0e04.','\u0e21\u0e34.\u0e22.','\u0e01.\u0e04.','\u0e2a.\u0e04.','\u0e01.\u0e22.','\u0e15.\u0e04.','\u0e1e.\u0e22.','\u0e18.\u0e04.'];
  const YRS = [_n.getFullYear(), _n.getFullYear() - 1, _n.getFullYear() - 2];
  const BCOLORS = ['#2A6AAA', '#E0762A', '#1F9D6B', '#8B5CF6', '#0E9BB5', '#DB2777'];

  useEffect(() => {
    const init = async () => {
      try {
        const token = localStorage.getItem("token"); if (!token) return;
        const payload = jwtDecode<any>(token);
        const userId = Number(payload.idcompany);
        const userRes = await axios.get(`/api/login/logins/${userId}`);
        const connRes = await axios.get(`/api/branchconnection?userId=${userId}&type=all`);
        const accepted = connRes.data.filter((c: any) => c.status === "accepted");
        const brs = accepted.map((c: any) => {
          const isFromUs = c.fromUserId === userId;
          const branch = isFromUs ? c.toUser : c.fromUser;
          const localId = Number(branch?.id);
          const isRemote = !localId || Number.isNaN(localId) || !branch;
          const bid = isRemote ? c.remoteUserId : localId;
          if (!bid || (!isRemote && localId === userId)) return null;
          return { id: bid, companyId: isRemote ? String(c.remoteUserId) : String(localId), dataKey: isRemote ? `remote_${c.id}` : `local_${localId}`, branchName: c.branchName || branch?.company || branch?.name || c.remoteCompany || '\u0e44\u0e21\u0e48\u0e17\u0e23\u0e32\u0e1a\u0e0a\u0e37\u0e48\u0e2d', isRemote, tunnelUrl: c.tunnelUrl || "", remoteUserId: c.remoteUserId || null };
        }).filter(Boolean);
        const companyLS = localStorage.getItem('company_') || '';
        const self = { id: userId, companyId: String(userId), dataKey: `self_${userId}`, branchName: userRes.data.company || '\u0e2a\u0e32\u0e02\u0e32\u0e1b\u0e31\u0e08\u0e08\u0e38\u0e1a\u0e31\u0e19', isRemote: false, tunnelUrl: "", remoteUserId: null, companyStr: companyLS || userRes.data.company || '' };
        setBranches([self, ...brs]);
      } catch (e) { console.error("AnalyzeBranch init:", e); }
    };
    init();
  }, []);

  useEffect(() => {
    if (branches.length === 0) return;
    const fetchAll = async () => {
      setAbL(true);
      const monthStr = `${abY}-${abM}`;
      const nd: Record<string, { summary: any[]; pl: any }> = {};
      await Promise.all(branches.map(async (b: any) => {
        try {
          if (b.isRemote && b.tunnelUrl) {
            const base = `/api/sale_cal/branch-proxy?tunnelUrl=${encodeURIComponent(b.tunnelUrl)}`;
            const [sumRes, plRes] = await Promise.all([
              axios.get(`${base}&apiPath=/api/pl/summary&company=${b.remoteUserId || b.companyId}&createDate=${monthStr}`).catch(() => ({ data: [] })),
              axios.get(`${base}&apiPath=/api/pl/pl&company=${b.remoteUserId || b.companyId}&monthyear=${monthStr}`).catch(() => ({ data: [] })),
            ]);
            nd[b.dataKey] = { summary: sumRes.data || [], pl: plRes.data?.[0] || null };
          } else {
            const cid = b.companyStr || b.companyId;
            const [sumRes, plRes] = await Promise.all([
              axios.get(`/api/pl/summary?company=${cid}&createDate=${monthStr}`),
              axios.get(`/api/pl/pl?company=${cid}&monthyear=${monthStr}`),
            ]);
            nd[b.dataKey] = { summary: sumRes.data || [], pl: plRes.data?.[0] || null };
          }
        } catch { nd[b.dataKey] = { summary: [], pl: null }; }
      }));
      setBranchData(nd);
      setAbL(false);
    };
    fetchAll();
  }, [abM, abY, branches, fetchTrigger]);

  const abGo = () => { setFetchTrigger(prev => prev + 1); };

  const visible = selBranch === 'all' ? branches : branches.filter((b: any) => b.dataKey === selBranch);

  const abD: any[] = (() => {
    const dateMap: Record<string, any> = {};
    visible.forEach((b: any) => {
      const d = branchData[b.dataKey]; if (!d) return;
      (d.summary || []).forEach((r: any) => {
        const dt = r.date || '';
        if (!dateMap[dt]) dateMap[dt] = { date: dt, sale: 0, cost: 0, bill: 0, rc: 0, diff: 0 };
        dateMap[dt].sale += Number(r.sale) || 0;
        dateMap[dt].cost += Number(r.cost) || 0;
        dateMap[dt].bill += Number(r.bill) || 0;
        dateMap[dt].rc += Number(r.rc) || 0;
        dateMap[dt].diff += Number(r.diff) || 0;
      });
    });
    return Object.values(dateMap).sort((a: any, b: any) => a.date.localeCompare(b.date));
  })();

  const abPL: any = (() => {
    const merged: any = {};
    const plKeys = ['R4000','R4001','R4002','C5000','C5001','S6000','S6001','S6002','S6003','S6004','S6005','S6006','S6007','S6008','S6009','S6010','A7000','A7001','A7002','A7003','A7004','A7005','A7006','A7007'];
    let hasData = false;
    visible.forEach((b: any) => {
      const d = branchData[b.dataKey]; if (!d || !d.pl) return;
      hasData = true;
      plKeys.forEach((k: string) => { merged[k] = (merged[k] || 0) + (Number(d.pl[k]) || 0); });
    });
    return hasData ? merged : null;
  })();

  const tS = abD.reduce((a: number, d: any) => a + (Number(d.sale) || 0), 0);
  const tC = abD.reduce((a: number, d: any) => a + (Number(d.cost) || 0), 0);
  const tB = abD.reduce((a: number, d: any) => a + (Number(d.bill) || 0), 0);
  const tR = abD.reduce((a: number, d: any) => a + (Number(d.rc) || 0), 0);
  const gp = tS - tC;
  const gpP = tS > 0 ? (gp / tS * 100) : 0;
  const dW = abD.filter((d: any) => (Number(d.sale) || 0) > 0).length;
  const aS = dW > 0 ? tS / dW : 0;
  const aP = dW > 0 ? gp / dW : 0;
  const sE = abPL ? ['S6000','S6001','S6002','S6003','S6004','S6005','S6006','S6007','S6008','S6009','S6010'].reduce((a: number, k: string) => a + (Number(abPL[k]) || 0), 0) : 0;
  const aE = abPL ? ['A7000','A7001','A7002','A7003','A7004','A7005','A7006','A7007'].reduce((a: number, k: string) => a + (Number(abPL[k]) || 0), 0) : 0;
  const tE = sE + aE;
  const np = gp - tE;
  const npP = tS > 0 ? (np / tS * 100) : 0;
  const cRt = tS > 0 ? tC / tS : 0;
  const beR = cRt < 1 && tE > 0 ? tE / (1 - cRt) : 0;
  const beP = beR > 0 ? Math.min((tS / (beR + beR * cRt)) * 100, 150) : 0;
  const rBE = beR > 0 && tS >= (beR + beR * cRt);
  const bD = abD.filter((d: any) => (Number(d.sale) || 0) > 0).reduce((b: any, d: any) => (Number(d.sale) || 0) > (Number(b?.sale) || 0) ? d : b, null as any);

  const cData = abD.map((d: any) => {
    const s = Number(d.sale) || 0, c = Number(d.cost) || 0;
    return { day: (d.date || '').split('/')[0], revenue: s, cost: c, profit: s - c };
  });
  let _cm = 0;
  const cumData = abD.map((d: any) => {
    _cm += (Number(d.sale) || 0) - (Number(d.cost) || 0);
    return { day: (d.date || '').split('/')[0], v: Math.round(_cm) };
  });
  const mData = abD.map((d: any) => {
    const s = Number(d.sale) || 0, c = Number(d.cost) || 0;
    return { day: (d.date || '').split('/')[0], m: s > 0 ? Math.round((s - c) / s * 100) : 0 };
  });
  const pD: any[] = [
    { name: '\u0e15\u0e49\u0e19\u0e17\u0e38\u0e19\u0e2a\u0e34\u0e19\u0e04\u0e49\u0e32', value: tC, color: '#ef4444' },
    { name: '\u0e04\u0e48\u0e32\u0e43\u0e0a\u0e49\u0e08\u0e48\u0e32\u0e22\u0e02\u0e32\u0e22', value: sE, color: '#f59e0b' },
    { name: '\u0e04\u0e48\u0e32\u0e43\u0e0a\u0e49\u0e08\u0e48\u0e32\u0e22\u0e1a\u0e23\u0e34\u0e2b\u0e32\u0e23', value: aE, color: '#8b5cf6' },
  ].filter((e: any) => e.value > 0);
  if (np > 0) pD.push({ name: '\u0e01\u0e33\u0e44\u0e23\u0e2a\u0e38\u0e17\u0e18\u0e34', value: np, color: '#3E86C7' });

  const ff = (n: number) => n.toLocaleString(undefined, { maximumFractionDigits: 0 });
  const kk = (bc: string): any => ({
    background: '#fff', borderRadius: 12, padding: '14px 16px',
    border: '1px solid #e2e8f0', borderLeft: `4px solid ${bc}`,
    boxShadow: '0 1px 4px rgba(0,0,0,0.03)'
  });

  if (abL) return (
    <div style={{ textAlign: 'center', padding: 60, fontFamily: 'Kanit', color: '#94a3b8' }}>
      <div style={{ fontSize: 32, marginBottom: 12 }}>{'\u23F3'}</div>
      {'\u0e01\u0e33\u0e25\u0e31\u0e07\u0e42\u0e2b\u0e25\u0e14\u0e02\u0e49\u0e2d\u0e21\u0e39\u0e25...'}
    </div>
  );

  return (
    <div style={{ padding: '16px 20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <div style={{ fontFamily: 'Kanit', fontSize: 20, fontWeight: 700, color: '#0f172a' }}>
            {'\uD83D\uDCCA'} {'\u0e27\u0e34\u0e40\u0e04\u0e23\u0e32\u0e30\u0e2b\u0e4c\u0e22\u0e2d\u0e14\u0e02\u0e32\u0e22\u0e2a\u0e32\u0e02\u0e32'}
          </div>
          <div style={{ fontFamily: 'Kanit', fontSize: 11, color: '#94a3b8' }}>
            {'\u0e27\u0e34\u0e40\u0e04\u0e23\u0e32\u0e30\u0e2b\u0e4c\u0e41\u0e19\u0e27\u0e42\u0e19\u0e49\u0e21 \u0e01\u0e33\u0e44\u0e23-\u0e02\u0e32\u0e14\u0e17\u0e38\u0e19 \u0e41\u0e25\u0e30\u0e08\u0e38\u0e14\u0e04\u0e38\u0e49\u0e21\u0e17\u0e38\u0e19'}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <select value={selBranch} onChange={(e: any) => setSelBranch(e.target.value)}
            style={{ fontFamily: 'Kanit', fontSize: 12, padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', color: '#334155', minWidth: 160 }}>
            <option value="all">{'\u0e17\u0e38\u0e01\u0e2a\u0e32\u0e02\u0e32'} ({branches.length})</option>
            {branches.map((b: any, i: number) => (
              <option key={b.dataKey} value={b.dataKey}>{i === 0 ? '\u2B50 ' + b.branchName : b.branchName}{b.isRemote ? ' \uD83C\uDF10' : ''}</option>
            ))}
          </select>
          <select value={abM} onChange={(e: any) => setAbM(e.target.value)} style={{ fontFamily: 'Kanit', fontSize: 12, padding: '6px 10px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff' }}>
            {MN.map((m: string, i: number) => <option key={m} value={m}>{MNT[i]}</option>)}
          </select>
          <select value={abY} onChange={(e: any) => setAbY(Number(e.target.value))} style={{ fontFamily: 'Kanit', fontSize: 12, padding: '6px 10px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff' }}>
            {YRS.map((y: number) => <option key={y} value={y}>{y}</option>)}
          </select>
          <button onClick={abGo} style={{ fontFamily: 'Kanit', fontSize: 12, padding: '6px 16px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg,#3E86C7,#2A6AAA)', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>
            {'\u0e42\u0e2b\u0e25\u0e14\u0e02\u0e49\u0e2d\u0e21\u0e39\u0e25'}
          </button>
        </div>
      </div>

      {/* KPI Cards Row 1 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 16 }}>
        <div style={kk('#3E86C7')}>
          <div style={{ fontFamily: 'Kanit', fontSize: 10, color: '#64748b', marginBottom: 2 }}>{'\uD83D\uDCB0 \u0e22\u0e2d\u0e14\u0e02\u0e32\u0e22\u0e23\u0e27\u0e21'}</div>
          <div style={{ fontFamily: 'Kanit', fontSize: 22, fontWeight: 700, color: '#1E5088', lineHeight: 1.2 }}>{ff(tS)}</div>
          <div style={{ fontFamily: 'Kanit', fontSize: 9, color: '#94a3b8' }}>{'\u0e3f'} ({tB} {'\u0e1a\u0e34\u0e25'})</div>
        </div>
        <div style={kk('#ef4444')}>
          <div style={{ fontFamily: 'Kanit', fontSize: 10, color: '#64748b', marginBottom: 2 }}>{'\uD83D\uDCE6 \u0e15\u0e49\u0e19\u0e17\u0e38\u0e19\u0e02\u0e32\u0e22'}</div>
          <div style={{ fontFamily: 'Kanit', fontSize: 22, fontWeight: 700, color: '#dc2626', lineHeight: 1.2 }}>{ff(tC)}</div>
          <div style={{ fontFamily: 'Kanit', fontSize: 9, color: '#94a3b8' }}>{'\u0e3f'} ({tS > 0 ? (cRt * 100).toFixed(1) : 0}%)</div>
        </div>
        <div style={kk(gp >= 0 ? '#1F9D6B' : '#ef4444')}>
          <div style={{ fontFamily: 'Kanit', fontSize: 10, color: '#64748b', marginBottom: 2 }}>{'\uD83D\uDCC8 \u0e01\u0e33\u0e44\u0e23\u0e02\u0e31\u0e49\u0e19\u0e15\u0e49\u0e19'}</div>
          <div style={{ fontFamily: 'Kanit', fontSize: 22, fontWeight: 700, color: gp >= 0 ? '#147F56' : '#dc2626', lineHeight: 1.2 }}>{ff(gp)}</div>
          <div style={{ fontFamily: 'Kanit', fontSize: 9, color: '#94a3b8' }}>{'\u0e3f'} ({gpP.toFixed(1)}%)</div>
        </div>
        <div style={kk(np >= 0 ? '#1F9D6B' : '#ef4444')}>
          <div style={{ fontFamily: 'Kanit', fontSize: 10, color: '#64748b', marginBottom: 2 }}>{np >= 0 ? '\u2705' : '\u274C'} {'\u0e01\u0e33\u0e44\u0e23\u0e2a\u0e38\u0e17\u0e18\u0e34'}</div>
          <div style={{ fontFamily: 'Kanit', fontSize: 22, fontWeight: 700, color: np >= 0 ? '#147F56' : '#dc2626', lineHeight: 1.2 }}>{ff(np)}</div>
          <div style={{ fontFamily: 'Kanit', fontSize: 9, color: '#94a3b8' }}>{'\u0e3f'} ({npP.toFixed(1)}%)</div>
        </div>
      </div>

      {/* KPI Cards Row 2 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 16 }}>
        <div style={kk('#8b5cf6')}>
          <div style={{ fontFamily: 'Kanit', fontSize: 10, color: '#64748b', marginBottom: 2 }}>{'\uD83D\uDCC5 \u0e27\u0e31\u0e19\u0e17\u0e35\u0e48\u0e21\u0e35\u0e22\u0e2d\u0e14\u0e02\u0e32\u0e22'}</div>
          <div style={{ fontFamily: 'Kanit', fontSize: 22, fontWeight: 700, color: '#7c3aed', lineHeight: 1.2 }}>{dW}</div>
          <div style={{ fontFamily: 'Kanit', fontSize: 9, color: '#94a3b8' }}>{'\u0e08\u0e32\u0e01'} {abD.length} {'\u0e27\u0e31\u0e19'}</div>
        </div>
        <div style={kk('#06b6d4')}>
          <div style={{ fontFamily: 'Kanit', fontSize: 10, color: '#64748b', marginBottom: 2 }}>{'\uD83D\uDCCA \u0e40\u0e09\u0e25\u0e35\u0e48\u0e22/\u0e27\u0e31\u0e19'}</div>
          <div style={{ fontFamily: 'Kanit', fontSize: 22, fontWeight: 700, color: '#0891b2', lineHeight: 1.2 }}>{ff(Math.round(aS))}</div>
          <div style={{ fontFamily: 'Kanit', fontSize: 9, color: '#94a3b8' }}>{'\u0e3f (\u0e01\u0e33\u0e44\u0e23 ' + ff(Math.round(aP)) + ')'}</div>
        </div>
        <div style={kk('#f59e0b')}>
          <div style={{ fontFamily: 'Kanit', fontSize: 10, color: '#64748b', marginBottom: 2 }}>{'\uD83C\uDFC6 \u0e27\u0e31\u0e19\u0e02\u0e32\u0e22\u0e14\u0e35\u0e2a\u0e38\u0e14'}</div>
          <div style={{ fontFamily: 'Kanit', fontSize: 22, fontWeight: 700, color: '#b45309', lineHeight: 1.2 }}>{bD ? ff(Number(bD.sale)) : '-'}</div>
          <div style={{ fontFamily: 'Kanit', fontSize: 9, color: '#94a3b8' }}>{bD ? '\u0e3f (' + bD.date + ')' : '-'}</div>
        </div>
        <div style={kk(rBE ? '#1F9D6B' : '#f59e0b')}>
          <div style={{ fontFamily: 'Kanit', fontSize: 10, color: '#64748b', marginBottom: 2 }}>{rBE ? '\uD83C\uDFAF \u0e16\u0e36\u0e07\u0e08\u0e38\u0e14\u0e04\u0e38\u0e49\u0e21\u0e17\u0e38\u0e19\u0e41\u0e25\u0e49\u0e27!' : '\u23F3 \u0e08\u0e38\u0e14\u0e04\u0e38\u0e49\u0e21\u0e17\u0e38\u0e19'}</div>
          <div style={{ fontFamily: 'Kanit', fontSize: 22, fontWeight: 700, color: rBE ? '#147F56' : '#b45309', lineHeight: 1.2 }}>{beR > 0 ? ff(Math.round(beR)) : '-'}</div>
          <div style={{ fontFamily: 'Kanit', fontSize: 9, color: '#94a3b8' }}>{'\u0e3f'} ({beP.toFixed(0)}%)</div>
        </div>
      </div>

      {/* Break-Even Progress Bar */}
      {beR > 0 && (
        <div style={{ background: '#fff', borderRadius: 12, padding: '14px 18px', border: '1px solid #e2e8f0', marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontFamily: 'Kanit', fontSize: 12, fontWeight: 600, color: '#334155' }}>{'\uD83C\uDFAF Break-Even Analysis'}</span>
            <span style={{ fontFamily: 'Kanit', fontSize: 11, color: rBE ? '#147F56' : '#b45309', fontWeight: 600 }}>
              {rBE ? '\u2705 \u0e1c\u0e48\u0e32\u0e19\u0e08\u0e38\u0e14\u0e04\u0e38\u0e49\u0e21\u0e17\u0e38\u0e19\u0e41\u0e25\u0e49\u0e27!' : '\u0e02\u0e32\u0e14\u0e2d\u0e35\u0e01 ' + ff(Math.max(0, Math.round(beR + beR * cRt - tS))) + ' \u0e3f'}
            </span>
          </div>
          <div style={{ background: '#f1f5f9', borderRadius: 8, height: 20, position: 'relative' as const, overflow: 'hidden' }}>
            <div style={{ width: `${Math.min(beP, 100)}%`, height: '100%', borderRadius: 8, background: rBE ? 'linear-gradient(90deg,#1F9D6B,#43B283)' : 'linear-gradient(90deg,#f59e0b,#fbbf24)', transition: 'width 0.5s' }} />
            <div style={{ position: 'absolute' as const, top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Kanit', fontSize: 10, fontWeight: 600, color: '#334155' }}>{beP.toFixed(1)}%</div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
            <span style={{ fontFamily: 'Kanit', fontSize: 9, color: '#94a3b8' }}>0 {'\u0e3f'}</span>
            <span style={{ fontFamily: 'Kanit', fontSize: 9, color: '#ef4444' }}>{'\u0e08\u0e38\u0e14\u0e04\u0e38\u0e49\u0e21\u0e17\u0e38\u0e19: ' + ff(Math.round(beR)) + ' \u0e3f'}</span>
            <span style={{ fontFamily: 'Kanit', fontSize: 9, color: '#94a3b8' }}>{'\u0e22\u0e2d\u0e14\u0e02\u0e32\u0e22: ' + ff(tS) + ' \u0e3f'}</span>
          </div>
        </div>
      )}

      {/* Charts Row 1: Revenue vs Cost + Cumulative Profit */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
        <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', padding: 16 }}>
          <div style={{ fontFamily: 'Kanit', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 10 }}>{'\uD83D\uDCCA \u0e22\u0e2d\u0e14\u0e02\u0e32\u0e22 vs \u0e15\u0e49\u0e19\u0e17\u0e38\u0e19 \u0e23\u0e32\u0e22\u0e27\u0e31\u0e19'}</div>
          <ResponsiveContainer width="100%" height={220}>
            <ComposedChart data={cData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="day" tick={{ fontFamily: 'Kanit', fontSize: 9, fill: '#94a3b8' }} />
              <YAxis tick={{ fontFamily: 'Kanit', fontSize: 9, fill: '#94a3b8' }} />
              <Tooltip content={({ active, payload, label }: any) => {
                if (!active || !payload?.length) return null;
                return (<div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 12px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
                  <div style={{ fontFamily: 'Kanit', fontSize: 11, fontWeight: 600, color: '#334155', marginBottom: 4 }}>{'\u0e27\u0e31\u0e19\u0e17\u0e35\u0e48 ' + label}</div>
                  {payload.map((e: any, i: number) => <div key={i} style={{ fontFamily: 'Kanit', fontSize: 10, color: e.color }}>{e.name}: {ff(e.value)} {'\u0e3f'}</div>)}
                </div>);
              }} />
              <Legend wrapperStyle={{ fontFamily: 'Kanit', fontSize: 10 }} />
              <Bar dataKey="revenue" name={'\u0e22\u0e2d\u0e14\u0e02\u0e32\u0e22'} fill="#3E86C7" radius={[3, 3, 0, 0]} maxBarSize={16} />
              <Bar dataKey="cost" name={'\u0e15\u0e49\u0e19\u0e17\u0e38\u0e19'} fill="#ef4444" radius={[3, 3, 0, 0]} maxBarSize={16} opacity={0.7} />
              <Line type="monotone" dataKey="profit" name={'\u0e01\u0e33\u0e44\u0e23'} stroke="#1F9D6B" strokeWidth={2} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', padding: 16 }}>
          <div style={{ fontFamily: 'Kanit', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 10 }}>{'\uD83D\uDCC8 \u0e01\u0e33\u0e44\u0e23\u0e02\u0e31\u0e49\u0e19\u0e15\u0e49\u0e19\u0e2a\u0e30\u0e2a\u0e21'}</div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={cumData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="day" tick={{ fontFamily: 'Kanit', fontSize: 9, fill: '#94a3b8' }} />
              <YAxis tick={{ fontFamily: 'Kanit', fontSize: 9, fill: '#94a3b8' }} />
              <Tooltip content={({ active, payload, label }: any) => {
                if (!active || !payload?.length) return null;
                return (<div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 12px' }}>
                  <div style={{ fontFamily: 'Kanit', fontSize: 11, fontWeight: 600, color: '#334155' }}>{'\u0e27\u0e31\u0e19\u0e17\u0e35\u0e48 ' + label}</div>
                  <div style={{ fontFamily: 'Kanit', fontSize: 10, color: '#2A6AAA' }}>{'\u0e01\u0e33\u0e44\u0e23\u0e2a\u0e30\u0e2a\u0e21: ' + ff(payload[0]?.value || 0) + ' \u0e3f'}</div>
                </div>);
              }} />
              <ReferenceLine y={0} stroke="#ef4444" strokeDasharray="4 4" />
              <defs><linearGradient id="cG" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3E86C7" stopOpacity={0.3} /><stop offset="95%" stopColor="#3E86C7" stopOpacity={0} /></linearGradient></defs>
              <Area type="monotone" dataKey="v" stroke="#3E86C7" strokeWidth={2} fill="url(#cG)" name={'\u0e01\u0e33\u0e44\u0e23\u0e2a\u0e30\u0e2a\u0e21'} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2: Margin Trend + Revenue Pie */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
        <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', padding: 16 }}>
          <div style={{ fontFamily: 'Kanit', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 10 }}>{'\uD83D\uDCC9 \u0e2d\u0e31\u0e15\u0e23\u0e32\u0e01\u0e33\u0e44\u0e23 (%) \u0e23\u0e32\u0e22\u0e27\u0e31\u0e19'}</div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={mData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="day" tick={{ fontFamily: 'Kanit', fontSize: 9, fill: '#94a3b8' }} />
              <YAxis tick={{ fontFamily: 'Kanit', fontSize: 9, fill: '#94a3b8' }} domain={[0, 100]} unit="%" />
              <Tooltip content={({ active, payload, label }: any) => {
                if (!active || !payload?.length) return null;
                return (<div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 12px' }}>
                  <div style={{ fontFamily: 'Kanit', fontSize: 11, fontWeight: 600, color: '#334155' }}>{'\u0e27\u0e31\u0e19\u0e17\u0e35\u0e48 ' + label}</div>
                  <div style={{ fontFamily: 'Kanit', fontSize: 10, color: '#8b5cf6' }}>Margin: {payload[0]?.value}%</div>
                </div>);
              }} />
              <ReferenceLine y={gpP} stroke="#f59e0b" strokeDasharray="4 4" />
              <defs><linearGradient id="mG" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} /><stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} /></linearGradient></defs>
              <Area type="monotone" dataKey="m" stroke="#8b5cf6" strokeWidth={2} fill="url(#mG)" name="Margin %" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', padding: 16 }}>
          <div style={{ fontFamily: 'Kanit', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 10 }}>{'\uD83C\uDF69 \u0e2a\u0e31\u0e14\u0e2a\u0e48\u0e27\u0e19\u0e23\u0e32\u0e22\u0e44\u0e14\u0e49'}</div>
          {pD.length === 0
            ? <div style={{ padding: 40, textAlign: 'center', fontFamily: 'Kanit', fontSize: 12, color: '#94a3b8' }}>{'\u0e44\u0e21\u0e48\u0e21\u0e35\u0e02\u0e49\u0e2d\u0e21\u0e39\u0e25'}</div>
            : (<ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={pD} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={80} paddingAngle={2} strokeWidth={2} stroke="#fff">
                    {pD.map((e: any, i: number) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip content={({ active, payload }: any) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0].payload;
                    const t = pD.reduce((s: number, e: any) => s + e.value, 0);
                    return (<div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 12px' }}>
                      <div style={{ fontFamily: 'Kanit', fontSize: 11, fontWeight: 600, color: '#334155' }}>{d.name}</div>
                      <div style={{ fontFamily: 'Kanit', fontSize: 10, color: d.color }}>{ff(d.value)} {'\u0e3f'} ({t > 0 ? (d.value / t * 100).toFixed(1) : 0}%)</div>
                    </div>);
                  }} />
                  <Legend wrapperStyle={{ fontFamily: 'Kanit', fontSize: 10 }} />
                </PieChart>
              </ResponsiveContainer>)
          }
        </div>
      </div>

      {/* Daily Sales Table */}
      <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <div style={{ padding: '12px 18px', background: 'linear-gradient(135deg,#F3F8FC,#fff)', borderBottom: '2px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontFamily: 'Kanit', fontSize: 13, fontWeight: 700, color: '#1E5088' }}>
            {'\uD83D\uDCCB \u0e15\u0e32\u0e23\u0e32\u0e07\u0e22\u0e2d\u0e14\u0e02\u0e32\u0e22\u0e23\u0e32\u0e22\u0e27\u0e31\u0e19 \u2014 ' + MNT[Number(abM) - 1] + ' ' + abY}
          </span>
          <span style={{ fontFamily: 'Kanit', fontSize: 10, color: '#94a3b8' }}>
            {abD.length + ' \u0e27\u0e31\u0e19 | \u0e21\u0e35\u0e22\u0e2d\u0e14\u0e02\u0e32\u0e22 ' + dW + ' \u0e27\u0e31\u0e19'}
          </span>
        </div>
        <div style={{ maxHeight: 480, overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc', position: 'sticky' as const, top: 0, zIndex: 1 }}>
                {['\u0e27\u0e31\u0e19\u0e17\u0e35\u0e48', '\u0e1a\u0e34\u0e25', '\u0e22\u0e2d\u0e14\u0e02\u0e32\u0e22', '\u0e15\u0e49\u0e19\u0e17\u0e38\u0e19', '\u0e01\u0e33\u0e44\u0e23', '%\u0e01\u0e33\u0e44\u0e23', '\u0e22\u0e2d\u0e14\u0e23\u0e31\u0e1a\u0e2a\u0e34\u0e19\u0e04\u0e49\u0e32', '\u0e22\u0e2d\u0e14(\u0e02\u0e32\u0e22-\u0e23\u0e31\u0e1a)'].map((h: string, i: number) => (
                  <th key={i} style={{ padding: '8px 10px', fontFamily: 'Kanit', fontSize: 10, fontWeight: 600, color: '#64748b', textAlign: i === 0 ? 'left' : 'right', borderBottom: '2px solid #e2e8f0' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {abD.map((d: any, i: number) => {
                const sl = Number(d.sale) || 0, co = Number(d.cost) || 0, pr = sl - co;
                const pc = sl > 0 ? ((pr / sl) * 100).toFixed(0) : '0';
                const rc = Number(d.rc) || 0, df = Number(d.diff) || 0, hs = sl > 0;
                return (
                  <tr key={i} style={{ borderBottom: '1px solid #f8fafc', background: hs ? (pr > 0 ? '#EDF9F3' : '#fef2f2') : '#fff' }}>
                    <td style={{ padding: '6px 10px', fontFamily: 'Kanit', fontSize: 11, color: '#334155' }}>{d.date}</td>
                    <td style={{ padding: '6px 10px', fontFamily: 'Kanit', fontSize: 11, textAlign: 'right', color: '#64748b' }}>{Number(d.bill) || 0}</td>
                    <td style={{ padding: '6px 10px', fontFamily: 'Kanit', fontSize: 11, textAlign: 'right', fontWeight: hs ? 600 : 400, color: hs ? '#1E5088' : '#cbd5e1' }}>{hs ? ff(sl) : '-'}</td>
                    <td style={{ padding: '6px 10px', fontFamily: 'Kanit', fontSize: 11, textAlign: 'right', color: hs ? '#dc2626' : '#cbd5e1' }}>{hs ? ff(co) : '-'}</td>
                    <td style={{ padding: '6px 10px', fontFamily: 'Kanit', fontSize: 11, textAlign: 'right', fontWeight: 600, color: pr >= 0 ? '#147F56' : '#dc2626' }}>{hs ? ff(pr) : '-'}</td>
                    <td style={{ padding: '6px 10px', fontFamily: 'Kanit', fontSize: 11, textAlign: 'right', color: Number(pc) >= 20 ? '#147F56' : Number(pc) > 0 ? '#f59e0b' : '#dc2626' }}>{hs ? pc + '%' : '-'}</td>
                    <td style={{ padding: '6px 10px', fontFamily: 'Kanit', fontSize: 11, textAlign: 'right', color: '#64748b' }}>{rc > 0 ? ff(rc) : '-'}</td>
                    <td style={{ padding: '6px 10px', fontFamily: 'Kanit', fontSize: 11, textAlign: 'right', color: df >= 0 ? '#334155' : '#dc2626' }}>{hs || rc > 0 ? ff(df) : '-'}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ background: '#F3F8FC', borderTop: '2px solid #CCDFF1' }}>
                <td style={{ padding: '8px 10px', fontFamily: 'Kanit', fontSize: 12, fontWeight: 700, color: '#1E5088' }}>{'\u0e23\u0e27\u0e21 (' + abD.length + ' \u0e27\u0e31\u0e19)'}</td>
                <td style={{ padding: '8px 10px', fontFamily: 'Kanit', fontSize: 13, fontWeight: 700, textAlign: 'right', color: '#334155' }}>{ff(tB)}</td>
                <td style={{ padding: '8px 10px', fontFamily: 'Kanit', fontSize: 13, fontWeight: 700, textAlign: 'right', color: '#1E5088' }}>{ff(tS)}</td>
                <td style={{ padding: '8px 10px', fontFamily: 'Kanit', fontSize: 13, fontWeight: 700, textAlign: 'right', color: '#dc2626' }}>{ff(tC)}</td>
                <td style={{ padding: '8px 10px', fontFamily: 'Kanit', fontSize: 13, fontWeight: 700, textAlign: 'right', color: gp >= 0 ? '#147F56' : '#dc2626' }}>{ff(gp)}</td>
                <td style={{ padding: '8px 10px', fontFamily: 'Kanit', fontSize: 13, fontWeight: 700, textAlign: 'right', color: gpP >= 20 ? '#147F56' : '#f59e0b' }}>{gpP.toFixed(0)}%</td>
                <td style={{ padding: '8px 10px', fontFamily: 'Kanit', fontSize: 13, fontWeight: 700, textAlign: 'right', color: '#334155' }}>{ff(tR)}</td>
                <td style={{ padding: '8px 10px', fontFamily: 'Kanit', fontSize: 13, fontWeight: 700, textAlign: 'right', color: (tS - tR) >= 0 ? '#334155' : '#dc2626' }}>{ff(tS - tR)}</td>
              </tr>
              <tr style={{ background: '#f8fafc' }}>
                <td style={{ padding: '6px 10px', fontFamily: 'Kanit', fontSize: 11, fontWeight: 600, color: '#64748b' }}>{'\u0e40\u0e09\u0e25\u0e35\u0e48\u0e22/\u0e27\u0e31\u0e19'}</td>
                <td style={{ padding: '6px 10px', fontFamily: 'Kanit', fontSize: 11, fontWeight: 600, textAlign: 'right', color: '#64748b' }}>{dW > 0 ? (tB / dW).toFixed(1) : '-'}</td>
                <td style={{ padding: '6px 10px', fontFamily: 'Kanit', fontSize: 11, fontWeight: 600, textAlign: 'right', color: '#3E86C7' }}>{ff(Math.round(aS))}</td>
                <td style={{ padding: '6px 10px', fontFamily: 'Kanit', fontSize: 11, fontWeight: 600, textAlign: 'right', color: '#ef4444' }}>{dW > 0 ? ff(Math.round(tC / dW)) : '-'}</td>
                <td style={{ padding: '6px 10px', fontFamily: 'Kanit', fontSize: 11, fontWeight: 600, textAlign: 'right', color: '#2A6AAA' }}>{ff(Math.round(aP))}</td>
                <td style={{ padding: '6px 10px', fontFamily: 'Kanit', fontSize: 11, fontWeight: 600, textAlign: 'right', color: '#64748b' }}>{gpP.toFixed(0)}%</td>
                <td colSpan={2} />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* P&L Summary */}
      {abPL && (
        <div style={{ marginTop: 14, background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <div style={{ padding: '12px 18px', background: 'linear-gradient(135deg,#F3F8FC,#fff)', borderBottom: '2px solid #e2e8f0' }}>
            <span style={{ fontFamily: 'Kanit', fontSize: 13, fontWeight: 700, color: '#2A6AAA' }}>
              {'\uD83D\uDCCB \u0e2a\u0e23\u0e38\u0e1b\u0e07\u0e1a\u0e01\u0e33\u0e44\u0e23-\u0e02\u0e32\u0e14\u0e17\u0e38\u0e19 ' + MNT[Number(abM) - 1] + ' ' + abY}
            </span>
          </div>
          <div style={{ padding: '12px 18px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <div style={{ padding: 12, borderRadius: 10, background: '#F3F8FC', border: '1px solid #CCDFF1' }}>
              <div style={{ fontFamily: 'Kanit', fontSize: 11, color: '#3E86C7', fontWeight: 600, marginBottom: 4 }}>{'\u0e23\u0e32\u0e22\u0e44\u0e14\u0e49\u0e23\u0e27\u0e21'}</div>
              <div style={{ fontFamily: 'Kanit', fontSize: 20, fontWeight: 700, color: '#1E5088' }}>{ff(tS)} {'\u0e3f'}</div>
            </div>
            <div style={{ padding: 12, borderRadius: 10, background: '#fef2f2', border: '1px solid #fecaca' }}>
              <div style={{ fontFamily: 'Kanit', fontSize: 11, color: '#ef4444', fontWeight: 600, marginBottom: 4 }}>{'\u0e04\u0e48\u0e32\u0e43\u0e0a\u0e49\u0e08\u0e48\u0e32\u0e22\u0e23\u0e27\u0e21'}</div>
              <div style={{ fontFamily: 'Kanit', fontSize: 20, fontWeight: 700, color: '#dc2626' }}>{ff(tC + tE)} {'\u0e3f'}</div>
              <div style={{ fontFamily: 'Kanit', fontSize: 9, color: '#94a3b8' }}>{'\u0e15\u0e49\u0e19\u0e17\u0e38\u0e19 ' + ff(tC) + ' + \u0e14\u0e33\u0e40\u0e19\u0e34\u0e19\u0e07\u0e32\u0e19 ' + ff(tE)}</div>
            </div>
            <div style={{ padding: 12, borderRadius: 10, background: np >= 0 ? '#EDF9F3' : '#fef2f2', border: `1px solid ${np >= 0 ? '#A9E1C6' : '#fecaca'}` }}>
              <div style={{ fontFamily: 'Kanit', fontSize: 11, color: np >= 0 ? '#147F56' : '#dc2626', fontWeight: 600, marginBottom: 4 }}>
                {np >= 0 ? '\u2705 \u0e01\u0e33\u0e44\u0e23\u0e2a\u0e38\u0e17\u0e18\u0e34' : '\u274C \u0e02\u0e32\u0e14\u0e17\u0e38\u0e19\u0e2a\u0e38\u0e17\u0e18\u0e34'}
              </div>
              <div style={{ fontFamily: 'Kanit', fontSize: 20, fontWeight: 700, color: np >= 0 ? '#147F56' : '#dc2626' }}>{ff(np)} {'\u0e3f'}</div>
              <div style={{ fontFamily: 'Kanit', fontSize: 9, color: '#94a3b8' }}>Margin: {npP.toFixed(1)}%</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyzeBranchTab;
