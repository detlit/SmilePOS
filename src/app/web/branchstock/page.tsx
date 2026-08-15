"use client"

import React, { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from "recharts";
import MenuTab_Small from "../componant/menutab_small.tsx"
import HeadTab from "../componant/headtab.jsx"
import axios from 'axios'
import { jwtDecode } from "jwt-decode";
import PermissionGuard from '@/components/PermissionGuard'

const ST_COLORS = ['#2A6AAA', '#E0762A', '#1F9D6B', '#8B5CF6', '#0E9BB5', '#DB2777', '#B45309', '#65A30D'];

const BranchStockPageInner = () => {
  const [stBranches, setStBranches] = useState<any[]>([]);
  const [stCurrentUser, setStCurrentUser] = useState<any>(null);
  const [stLoading, setStLoading] = useState(true);
  const [searchQ, setSearchQ] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selProduct, setSelProduct] = useState<any>(null);
  const [stockData, setStockData] = useState<any>(null);
  const [stockLoading, setStockLoading] = useState(false);
  const [stBranchFilter, setStBranchFilter] = useState('all');

  useEffect(() => {
    const init = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const payload = jwtDecode<any>(token);
        const userId = Number(payload.idcompany);
        const userRes = await axios.get(`/api/login/logins/${userId}`);
        setStCurrentUser(userRes.data);
        const connRes = await axios.get(`/api/branchconnection?userId=${userId}&type=all`);
        const accepted = connRes.data.filter((c: any) => c.status === "accepted");
        const branches = accepted.map((c: any) => {
          const isFromUs = c.fromUserId === userId;
          const branch = isFromUs ? c.toUser : c.fromUser;
          const localBranchId = Number(branch?.id);
          const isRemote = !localBranchId || Number.isNaN(localBranchId) || !branch;
          const bid = isRemote ? c.remoteUserId : localBranchId;
          if (!bid || (!isRemote && localBranchId === userId)) return null;
          return {
            id: bid, companyId: isRemote ? String(c.remoteUserId) : String(localBranchId),
            dataKey: isRemote ? `remote_${c.id}` : `local_${localBranchId}`,
            branchName: c.branchName || branch?.company || branch?.name || c.remoteCompany || 'ไม่ทราบชื่อ',
            isRemote, tunnelUrl: c.tunnelUrl || '', remoteUserId: c.remoteUserId || null,
            apiToken: c.apiToken || '', remoteCompany: c.remoteCompany || '',
          };
        }).filter(Boolean);
        const self = {
          id: userId, companyId: String(userId), dataKey: `self_${userId}`,
          branchName: userRes.data.company || 'สาขาปัจจุบัน',
          isRemote: false, tunnelUrl: '', remoteUserId: null, apiToken: '', remoteCompany: '',
        };
        setStBranches([self, ...branches]);
      } catch (e) { console.error('BranchStock init error:', e); }
      setStLoading(false);
    };
    init();
  }, []);

  const doSearch = async () => {
    if (!searchQ.trim() || !stCurrentUser) return;
    setSearchLoading(true);
    try {
      const cid = String(stCurrentUser.id);
      const res = await axios.get(`/api/datalist?company=${cid}&ProductName=${encodeURIComponent(searchQ.trim())}&fields=list`);
      let items = res.data || [];
      if (items.length === 0) {
        const res2 = await axios.get(`/api/datalist?company=${cid}&Barcode=${encodeURIComponent(searchQ.trim())}&fields=list`);
        items = res2.data || [];
      }
      if (items.length === 0) {
        const res3 = await axios.get(`/api/datalist?company=${cid}&code=${encodeURIComponent(searchQ.trim())}&fields=list`);
        items = res3.data || [];
      }
      setSearchResults(items.slice(0, 50));
    } catch (e) { console.error('Search error:', e); setSearchResults([]); }
    setSearchLoading(false);
  };

  const selectProduct = async (product: any) => {
    setSelProduct(product);
    setStockLoading(true);
    setStockData(null);
    try {
      const mainId = String(stCurrentUser.id);
      const localBranches = stBranches.filter(b => !b.isRemote && b.dataKey !== `self_${stCurrentUser.id}`).map(b => b.companyId);
      const remoteBranches = stBranches.filter(b => b.isRemote).map(b => ({
        branchId: b.dataKey, tunnelUrl: b.tunnelUrl, apiToken: b.apiToken,
        remoteUserId: b.remoteUserId, branchName: b.branchName, remoteCompany: b.remoteCompany,
      }));
      const query = product.Barcode || product.code || product.ProductName;
      const res = await axios.post('/api/stocktransfer/branch-lookup', {
        query, mainCompanyId: mainId, branchIds: localBranches, remoteBranches,
      });
      const data = res.data;
      const match = Array.isArray(data) ? data.find((d: any) => String(d.code) === String(product.code)) || data[0] : data;
      setStockData(match || null);
    } catch (e) { console.error('Stock lookup error:', e); setStockData(null); }
    setStockLoading(false);
  };

  const fmtS = (n: number) => Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 2 });

  const getBranchStockList = () => {
    if (!stockData) return [];
    const list: any[] = [];
    const selfBranch = stBranches.find(b => b.dataKey.startsWith('self_'));
    if (selfBranch) list.push({ branchName: selfBranch.branchName + ' ⭐', dataKey: selfBranch.dataKey, balance: stockData.mainTotalBalance || 0, isMain: true });
    (stockData.branchBalances || []).forEach((bb: any) => {
      const br = stBranches.find(b => b.dataKey === bb.branchId || b.companyId === String(bb.branchId));
      list.push({ branchName: br?.branchName || bb.branchId, dataKey: bb.branchId, balance: bb.totalBalance || 0, isMain: false, isRemote: bb.isRemote, hasProduct: bb.hasProduct, error: bb.remoteError });
    });
    return list;
  };

  const branchStockList = selProduct && stockData ? getBranchStockList() : [];
  const filteredStock = stBranchFilter === 'all' ? branchStockList : branchStockList.filter(b => b.dataKey === stBranchFilter);
  const totalAllBranch = branchStockList.reduce((s, b) => s + (b.balance || 0), 0);

  return (
    <div style={{ paddingLeft: 15, paddingRight: 15 }}>
      <div className="row justify-content-start">
        <HeadTab />
      </div>
      <div className="row justify-content-start">
        <div className="col-sm-1">
          <MenuTab_Small />
        </div>
        <div className="col-sm-11">
          {stLoading ? (
            <div style={{ textAlign: 'center', padding: 60, fontFamily: 'Kanit', color: '#94a3b8' }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>กำลังโหลดข้อมูลสาขา...
            </div>
          ) : (
            <div style={{ padding: '16px 20px' }}>
              <div style={{ fontFamily: 'Kanit', fontSize: 20, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>📦 Stock สาขา</div>
              <div style={{ fontFamily: 'Kanit', fontSize: 12, color: '#94a3b8', marginBottom: 16 }}>ค้นหาสินค้าและดูยอดคงเหลือทุกสาขาที่เชื่อมต่อ ({stBranches.length} สาขา)</div>

              <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 16, alignItems: 'start' }}>
                {/* COL 1: Product Search */}
                <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', overflow: 'hidden' }}>
                  <div style={{ padding: '12px 14px', background: 'linear-gradient(135deg, #F3F8FC, #fff)', borderBottom: '2px solid #f1f5f9' }}>
                    <div style={{ fontFamily: 'Kanit', fontSize: 13, fontWeight: 700, color: '#1E5088', marginBottom: 8 }}>🔍 ค้นหาสินค้า</div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <input value={searchQ} onChange={e => setSearchQ(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') doSearch(); }}
                        placeholder="รหัส, ชื่อ, หรือ Barcode..."
                        style={{ flex: 1, fontFamily: 'Kanit', fontSize: 12, padding: '8px 10px', borderRadius: 8, border: '1px solid #e2e8f0', outline: 'none' }} />
                      <button onClick={doSearch} disabled={searchLoading}
                        style={{ fontFamily: 'Kanit', fontSize: 11, padding: '8px 14px', borderRadius: 8, border: 'none', background: '#3E86C7', color: '#fff', cursor: 'pointer', fontWeight: 600, whiteSpace: 'nowrap' }}>
                        {searchLoading ? '...' : 'ค้นหา'}
                      </button>
                    </div>
                  </div>
                  <div style={{ maxHeight: 'calc(100vh - 280px)', overflowY: 'auto' }}>
                    {searchResults.length === 0 ? (
                      <div style={{ padding: '40px 16px', textAlign: 'center', fontFamily: 'Kanit', fontSize: 12, color: '#94a3b8' }}>
                        {searchQ ? 'ไม่พบสินค้า' : 'พิมพ์ชื่อหรือรหัสสินค้าเพื่อค้นหา'}
                      </div>
                    ) : (
                      searchResults.map((p: any, i: number) => {
                        const isActive = selProduct?.id === p.id;
                        return (
                          <div key={p.id} onClick={() => selectProduct(p)}
                            style={{ padding: '10px 14px', borderBottom: '1px solid #f8fafc', cursor: 'pointer', background: isActive ? '#F3F8FC' : i % 2 === 0 ? '#fff' : '#fafbfc', transition: 'all 0.15s', borderLeft: isActive ? '3px solid #3E86C7' : '3px solid transparent' }}
                            onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLDivElement).style.background = '#F3F8FC'; }}
                            onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLDivElement).style.background = i % 2 === 0 ? '#fff' : '#fafbfc'; }}>
                            <div style={{ fontFamily: 'Kanit', fontSize: 11, fontWeight: 600, color: '#1E5088', marginBottom: 2 }}>{p.code}</div>
                            <div style={{ fontFamily: 'Kanit', fontSize: 11, color: '#334155', lineHeight: 1.3 }}>{p.ProductName}</div>
                            {p.Barcode && <div style={{ fontFamily: 'Kanit', fontSize: 10, color: '#94a3b8', marginTop: 2 }}>BC: {p.Barcode}</div>}
                            <div style={{ display: 'flex', gap: 6, marginTop: 3 }}>
                              {p.type && <span style={{ fontFamily: 'Kanit', fontSize: 9, background: '#f1f5f9', color: '#64748b', padding: '1px 6px', borderRadius: 4 }}>{p.type}</span>}
                              {p.Show === 'show' && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#3E86C7', marginTop: 3 }} />}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                  {searchResults.length > 0 && (
                    <div style={{ padding: '8px 14px', borderTop: '1px solid #f1f5f9', fontFamily: 'Kanit', fontSize: 10, color: '#94a3b8', textAlign: 'center' }}>
                      แสดง {searchResults.length} รายการ
                    </div>
                  )}
                </div>

                {/* COL 2: Stock Details */}
                <div>
                  {!selProduct ? (
                    <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', padding: '80px 20px', textAlign: 'center' }}>
                      <div style={{ fontSize: 48, marginBottom: 12, opacity: 0.2 }}>📦</div>
                      <div style={{ fontFamily: 'Kanit', fontSize: 14, color: '#94a3b8' }}>เลือกสินค้าจากรายการด้านซ้ายเพื่อดูยอดคงเหลือแต่ละสาขา</div>
                    </div>
                  ) : (
                    <div>
                      {/* Product Info Card */}
                      <div style={{ background: 'linear-gradient(135deg, #F3F8FC, #fff)', borderRadius: 14, border: '1px solid #CCDFF1', padding: '14px 18px', marginBottom: 14 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
                          <div>
                            <div style={{ fontFamily: 'Kanit', fontSize: 10, color: '#64748b', marginBottom: 2 }}>รหัสสินค้า</div>
                            <div style={{ fontFamily: 'Kanit', fontSize: 16, fontWeight: 700, color: '#1E5088' }}>{selProduct.code}</div>
                            <div style={{ fontFamily: 'Kanit', fontSize: 13, color: '#334155', marginTop: 2 }}>{selProduct.ProductName}</div>
                            {(stockData?.Barcode || selProduct.Barcode) && (
                              <div style={{ fontFamily: 'Kanit', fontSize: 11, color: '#64748b', marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span style={{ background: '#f1f5f9', padding: '2px 8px', borderRadius: 4, fontWeight: 500 }}>Barcode: {stockData?.Barcode || selProduct.Barcode}</span>
                              </div>
                            )}
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontFamily: 'Kanit', fontSize: 10, color: '#64748b', marginBottom: 2 }}>ยอดรวมทุกสาขา</div>
                            <div style={{ fontFamily: 'Kanit', fontSize: 28, fontWeight: 700, color: totalAllBranch > 0 ? '#147F56' : totalAllBranch < 0 ? '#dc2626' : '#64748b' }}>
                              {stockLoading ? '...' : fmtS(totalAllBranch)}
                            </div>
                            <div style={{ fontFamily: 'Kanit', fontSize: 10, color: '#94a3b8' }}>{stockData?.Unit || ''}</div>
                          </div>
                        </div>
                      </div>

                      {stockLoading ? (
                        <div style={{ textAlign: 'center', padding: 40, fontFamily: 'Kanit', color: '#94a3b8' }}>
                          <div style={{ fontSize: 24, marginBottom: 8 }}>⏳</div>กำลังดึงข้อมูลสต็อกจากทุกสาขา...</div>
                      ) : stockData ? (
                        <>
                          {/* Summary KPI per branch */}
                          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(branchStockList.length, 5)}, 1fr)`, gap: 10, marginBottom: 14 }}>
                            {branchStockList.slice(0, 5).map((b, i) => (
                              <div key={i} style={{ background: '#fff', borderRadius: 12, padding: '12px 14px', border: `1px solid ${ST_COLORS[i % ST_COLORS.length]}25`, borderLeft: `4px solid ${ST_COLORS[i % ST_COLORS.length]}` }}>
                                <div style={{ fontFamily: 'Kanit', fontSize: 10, color: '#64748b', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.branchName}</div>
                                <div style={{ fontFamily: 'Kanit', fontSize: 20, fontWeight: 700, color: b.balance > 0 ? '#147F56' : b.balance < 0 ? '#dc2626' : '#94a3b8' }}>{fmtS(b.balance)}</div>
                                {b.error && <div style={{ fontFamily: 'Kanit', fontSize: 9, color: '#f59e0b', marginTop: 2 }}>⚠ {b.error}</div>}
                              </div>
                            ))}
                          </div>

                          {/* Chart + Table */}
                          <div style={{ display: 'grid', gridTemplateColumns: branchStockList.length > 1 ? '1fr 1fr' : '1fr', gap: 14, marginBottom: 14 }}>
                            {branchStockList.length > 1 && (
                              <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', padding: 16 }}>
                                <div style={{ fontFamily: 'Kanit', fontSize: 12, fontWeight: 600, color: '#7c3aed', marginBottom: 10 }}>📊 เปรียบเทียบยอดคงเหลือ</div>
                                <ResponsiveContainer width="100%" height={Math.max(140, branchStockList.length * 40)}>
                                  <BarChart data={branchStockList.map((b, i) => ({ name: b.branchName.replace(' ⭐', ''), stock: b.balance, fill: ST_COLORS[i % ST_COLORS.length] }))} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                    <XAxis type="number" tick={{ fontFamily: 'Kanit', fontSize: 10, fill: '#94a3b8' }} axisLine={false} />
                                    <YAxis type="category" dataKey="name" tick={{ fontFamily: 'Kanit', fontSize: 10, fill: '#334155' }} width={90} axisLine={false} />
                                    <Tooltip content={({ active, payload }: any) => {
                                      if (!active || !payload?.length) return null;
                                      return (
                                        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '8px 12px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
                                          <div style={{ fontFamily: 'Kanit', fontSize: 11, fontWeight: 600, color: '#334155' }}>{payload[0].payload.name}</div>
                                          <div style={{ fontFamily: 'Kanit', fontSize: 12, fontWeight: 700, color: payload[0].value >= 0 ? '#147F56' : '#dc2626' }}>{fmtS(payload[0].value)} ชิ้น</div>
                                        </div>
                                      );
                                    }} />
                                    <Bar dataKey="stock" radius={[0, 4, 4, 0]} maxBarSize={22}>
                                      {branchStockList.map((_, i) => <Cell key={i} fill={ST_COLORS[i % ST_COLORS.length]} />)}
                                    </Bar>
                                  </BarChart>
                                </ResponsiveContainer>
                              </div>
                            )}

                            <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                              <div style={{ padding: '10px 14px', background: 'linear-gradient(135deg, #F3F8FC, #fff)', borderBottom: '2px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontFamily: 'Kanit', fontSize: 12, fontWeight: 700, color: '#2A6AAA' }}>📋 รายละเอียดสต็อก</span>
                                {branchStockList.length > 1 && (
                                  <select value={stBranchFilter} onChange={e => setStBranchFilter(e.target.value)}
                                    style={{ fontFamily: 'Kanit', fontSize: 10, padding: '4px 8px', borderRadius: 6, border: '1px solid #e2e8f0', background: '#fff' }}>
                                    <option value="all">ทุกสาขา</option>
                                    {branchStockList.map((b, i) => <option key={i} value={b.dataKey}>{b.branchName}</option>)}
                                  </select>
                                )}
                              </div>
                              <div style={{ maxHeight: 360, overflowY: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                  <thead>
                                    <tr style={{ background: '#f8fafc', position: 'sticky', top: 0, zIndex: 1 }}>
                                      <th style={{ padding: '6px 10px', fontFamily: 'Kanit', fontSize: 10, fontWeight: 600, color: '#64748b', textAlign: 'left', borderBottom: '2px solid #e2e8f0' }}>สาขา</th>
                                      <th style={{ padding: '6px 10px', fontFamily: 'Kanit', fontSize: 10, fontWeight: 600, color: '#64748b', textAlign: 'left', borderBottom: '2px solid #e2e8f0' }}>Barcode</th>
                                      <th style={{ padding: '6px 10px', fontFamily: 'Kanit', fontSize: 10, fontWeight: 600, color: '#64748b', textAlign: 'right', borderBottom: '2px solid #e2e8f0' }}>คงเหลือ</th>
                                      <th style={{ padding: '6px 10px', fontFamily: 'Kanit', fontSize: 10, fontWeight: 600, color: '#64748b', textAlign: 'center', borderBottom: '2px solid #e2e8f0' }}>สถานะ</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {filteredStock.map((b, i) => (
                                      <tr key={i} style={{ borderBottom: '1px solid #f8fafc' }}>
                                        <td style={{ padding: '5px 10px', fontFamily: 'Kanit', fontSize: 10, color: '#334155' }}>
                                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: ST_COLORS[branchStockList.indexOf(b) % ST_COLORS.length], flexShrink: 0 }} />
                                            <div>
                                              <div style={{ fontFamily: 'Kanit', fontSize: 11, fontWeight: 600, color: '#334155' }}>{b.branchName}</div>
                                              {b.isRemote && <span style={{ fontFamily: 'Kanit', fontSize: 9, color: '#94a3b8' }}>🌐 Remote</span>}
                                            </div>
                                          </div>
                                        </td>
                                        <td style={{ padding: '5px 10px', fontFamily: 'Kanit', fontSize: 10, color: '#64748b', textAlign: 'left' }}>{stockData?.Barcode || selProduct?.Barcode || '-'}</td>
                                        <td style={{ padding: '5px 10px', fontFamily: 'Kanit', fontSize: 10, fontWeight: 600, color: b.balance > 0 ? '#147F56' : b.balance < 0 ? '#dc2626' : '#94a3b8', textAlign: 'right' }}>{fmtS(b.balance)}</td>
                                        <td style={{ padding: '5px 10px', fontFamily: 'Kanit', fontSize: 10, color: '#64748b', textAlign: 'center' }}>
                                          {b.error ? (
                                            <span style={{ fontFamily: 'Kanit', fontSize: 9, background: '#fef3c7', color: '#b45309', padding: '2px 8px', borderRadius: 10 }}>⚠ ข้อผิดพลาด</span>
                                          ) : b.balance > 10 ? (
                                            <span style={{ fontFamily: 'Kanit', fontSize: 9, background: '#E5EEF8', color: '#2A6AAA', padding: '2px 8px', borderRadius: 10 }}>เพียงพอ</span>
                                          ) : b.balance > 0 ? (
                                            <span style={{ fontFamily: 'Kanit', fontSize: 9, background: '#fef3c7', color: '#b45309', padding: '2px 8px', borderRadius: 10 }}>ใกล้หมด</span>
                                          ) : (
                                            <span style={{ fontFamily: 'Kanit', fontSize: 9, background: '#fecaca', color: '#dc2626', padding: '2px 8px', borderRadius: 10 }}>หมด</span>
                                          )}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                  <tfoot>
                                    <tr style={{ background: '#F3F8FC', borderTop: '2px solid #CCDFF1' }}>
                                      <td style={{ padding: '8px 10px', fontFamily: 'Kanit', fontSize: 11, fontWeight: 700, color: '#1E5088' }}>รวมทุกสาขา</td>
                                      <td style={{ padding: '8px 10px' }}></td>
                                      <td style={{ padding: '8px 10px', fontFamily: 'Kanit', fontSize: 14, fontWeight: 700, color: totalAllBranch > 0 ? '#147F56' : '#dc2626', textAlign: 'right' }}>{fmtS(totalAllBranch)}</td>
                                      <td style={{ padding: '8px 10px', fontFamily: 'Kanit', fontSize: 10, color: '#64748b', textAlign: 'center' }}>{branchStockList.length} สาขา</td>
                                    </tr>
                                  </tfoot>
                                </table>
                              </div>
                            </div>
                          </div>

                          {/* Lot Details */}
                          {stockData.mainLots && stockData.mainLots.length > 0 && (
                            <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                              <div style={{ padding: '10px 14px', background: 'linear-gradient(135deg, #fdf4ff, #fff)', borderBottom: '2px solid #f1f5f9' }}>
                                <span style={{ fontFamily: 'Kanit', fontSize: 12, fontWeight: 700, color: '#9333ea' }}>📋 Lot สาขาหลัก ({stockData.mainLots.length} lots)</span>
                              </div>
                              <div style={{ maxHeight: 260, overflowY: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                  <thead>
                                    <tr style={{ background: '#f8fafc', position: 'sticky', top: 0, zIndex: 1 }}>
                                      {['Lot', 'วันหมดอายุ', 'รับเข้า', 'คงเหลือ', 'ต้นทุน'].map((h, hi) => (
                                        <th key={hi} style={{ padding: '6px 10px', fontFamily: 'Kanit', fontSize: 10, fontWeight: 600, color: '#64748b', textAlign: hi >= 2 ? 'right' : 'left', borderBottom: '2px solid #e2e8f0' }}>{h}</th>
                                      ))}
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {stockData.mainLots.map((lot: any, li: number) => (
                                      <tr key={li} style={{ borderBottom: '1px solid #f8fafc' }}>
                                        <td style={{ padding: '5px 10px', fontFamily: 'Kanit', fontSize: 10, color: '#334155' }}>{lot.lot || '-'}</td>
                                        <td style={{ padding: '5px 10px', fontFamily: 'Kanit', fontSize: 10, color: '#64748b' }}>{lot.dateExp ? new Date(lot.dateExp).toLocaleDateString('th-TH') : '-'}</td>
                                        <td style={{ padding: '5px 10px', fontFamily: 'Kanit', fontSize: 10, color: '#334155', textAlign: 'right' }}>{fmtS(Number(lot.qty) || 0)}</td>
                                        <td style={{ padding: '5px 10px', fontFamily: 'Kanit', fontSize: 10, fontWeight: 600, color: (lot.balance || 0) > 0 ? '#147F56' : '#dc2626', textAlign: 'right' }}>{fmtS(lot.balance || 0)}</td>
                                        <td style={{ padding: '5px 10px', fontFamily: 'Kanit', fontSize: 10, color: '#64748b', textAlign: 'right' }}>{lot.newCost ? fmtS(Number(lot.newCost)) : '-'}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #fecaca', padding: '30px 20px', textAlign: 'center' }}>
                          <div style={{ fontFamily: 'Kanit', fontSize: 13, color: '#dc2626' }}>❌ ไม่พบข้อมูลสต็อกสำหรับสินค้านี้</div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

function BranchStockPage() {
  return <PermissionGuard codename="S1"><BranchStockPageInner /></PermissionGuard>
}

export default BranchStockPage;
