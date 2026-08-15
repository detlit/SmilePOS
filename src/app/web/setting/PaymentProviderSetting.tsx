'use client'
import React, { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import {
  Building2,
  CheckCircle2,
  CircleOff,
  CreditCard,
  Landmark,
  PencilLine,
  Plus,
  QrCode,
  Settings2,
  Smartphone,
  Trash2,
  Upload,
  Wallet,
  X,
  type LucideIcon,
} from 'lucide-react'

interface PaymentProviderSettingProps {
  AlertComplete: () => void
  promptPayContent?: React.ReactNode
}

type ProviderMeta = {
  key: string
  name: string
  color: string
  Icon: LucideIcon
  staticQr?: boolean
  manualOnly?: boolean
}

type PaymentProviderRow = {
  id: number
  company?: string | null
  provider: string
  enabled: boolean
  displayName?: string | null
  apiKey?: string | null
  secretKey?: string | null
  merchantId?: string | null
  accountId?: string | null
  qrImageUrl?: string | null
  webhookUrl?: string | null
  serviceChargePercent?: number | null
}

type PaymentChannelGroup = 'transfer' | 'other'

const providerList: ProviderMeta[] = [
  { key: 'promptpay', name: 'PromptPay', color: '#0f4c81', Icon: QrCode },
  { key: 'maemanee', name: 'แม่มณี (SCB)', color: '#4c1d95', Icon: Smartphone, staticQr: true },
  { key: 'kshop', name: 'K-Shop (KBank)', color: '#1E5088', Icon: Building2, staticQr: true },
  { key: 'alipay', name: 'Alipay', color: '#1677ff', Icon: Wallet, staticQr: true },
  { key: 'wechat', name: 'WeChat Pay', color: '#07a35a', Icon: Wallet, staticQr: true },
  { key: 'truemoney', name: 'TrueMoney Wallet', color: '#f97316', Icon: Smartphone, staticQr: true },
  { key: 'bbl', name: 'ธนาคารกรุงเทพ (BBL)', color: '#1E5088', Icon: Landmark, staticQr: true },
  { key: 'krungsri', name: 'ธนาคารกรุงศรี (BAY)', color: '#ca8a04', Icon: Landmark, staticQr: true },
  { key: 'tmb', name: 'ธนาคารทหารไทย (ttb)', color: '#2A6AAA', Icon: Landmark, staticQr: true },
  { key: 'thanachart', name: 'ธนาคารธนชาติ', color: '#ea580c', Icon: Landmark, staticQr: true },
  { key: 'paotang', name: 'เป๋าตัง (Paotang)', color: '#6d28d9', Icon: Smartphone, staticQr: true },
  { key: 'edc', name: 'EDC (บัตร)', color: '#334155', Icon: CreditCard, manualOnly: true },
]

const providerMap = new Map(providerList.map((provider) => [provider.key, provider]))

const buildCustomProviderKey = (group: PaymentChannelGroup) => `custom_${group}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`

const isTransferCustomProvider = (providerKey: string) => providerKey.startsWith('custom_transfer_')

const fieldStyle: React.CSSProperties = {
  fontFamily: 'kanit',
  fontSize: 11,
  borderColor: '#dbe3ec',
  minHeight: 30,
}

const buttonBase: React.CSSProperties = {
  fontFamily: 'kanit',
  fontSize: 11,
  minHeight: 28,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 6,
}

export default function PaymentProviderSetting({ AlertComplete, promptPayContent }: PaymentProviderSettingProps) {
  const [providers, setProviders] = useState<PaymentProviderRow[]>([])
  const [editingProvider, setEditingProvider] = useState<string | null>(null)
  const [addingCustom, setAddingCustom] = useState(false)
  const [customGroup, setCustomGroup] = useState<PaymentChannelGroup>('transfer')
  const [customName, setCustomName] = useState('')
  const [customAccount, setCustomAccount] = useState('')
  const [savingCustom, setSavingCustom] = useState(false)

  const customProviders = useMemo(
    () => providers.filter((provider) => !providerMap.has(provider.provider)),
    [providers]
  )

  const customTransferProviders = useMemo(
    () => customProviders.filter((provider) => isTransferCustomProvider(provider.provider)),
    [customProviders]
  )

  const customOtherProviders = useMemo(
    () => customProviders.filter((provider) => !isTransferCustomProvider(provider.provider)),
    [customProviders]
  )

  const enabledCount = useMemo(
    () => providers.filter((provider) => provider.enabled).length,
    [providers]
  )

  const missingMainProvider = useMemo(
    () => providerList.some((provider) => !providers.some((row) => row.provider === provider.key)),
    [providers]
  )

  const totalVisibleProviders = providerList.length + customProviders.length

  const fetchProviders = async () => {
    const companyS = localStorage.getItem('company_') || ''
    try {
      const res = await axios.get(`/api/setting/payment-provider?company=${companyS}`)
      setProviders(Array.isArray(res.data) ? res.data : [])
    } catch (error) {
      console.error(error)
    }
  }

  useEffect(() => {
    fetchProviders()
  }, [])

  const initProviders = async () => {
    const companyS = localStorage.getItem('company_') || ''
    for (const provider of providerList) {
      const exists = providers.find((row) => row.provider === provider.key)
      if (!exists) {
        try {
          await axios.post('/api/setting/payment-provider', {
            company: companyS,
            provider: provider.key,
            enabled: provider.key === 'promptpay',
            displayName: provider.name,
          })
        } catch (error) {
          console.error(error)
        }
      }
    }
    await fetchProviders()
    AlertComplete()
  }

  const addCustomProvider = async () => {
    const companyS = localStorage.getItem('company_') || ''
    const name = customName.trim()
    if (!name || savingCustom) return

    setSavingCustom(true)
    try {
      const res = await axios.post('/api/setting/payment-provider', {
        company: companyS,
        provider: buildCustomProviderKey(customGroup),
        enabled: true,
        displayName: name,
        accountId: customAccount.trim() || null,
      })
      setCustomName('')
      setCustomAccount('')
      setCustomGroup('transfer')
      setAddingCustom(false)
      setEditingProvider(res.data?.provider || null)
      await fetchProviders()
      AlertComplete()
    } catch (error) {
      console.error(error)
    } finally {
      setSavingCustom(false)
    }
  }

  const toggleProvider = async (id: number, currentEnabled: boolean) => {
    try {
      await axios.put(`/api/setting/payment-provider/${id}`, { enabled: !currentEnabled })
      await fetchProviders()
      AlertComplete()
    } catch (error) {
      console.error(error)
    }
  }

  const updateProviderField = async (id: number, field: string, value: string) => {
    try {
      await axios.put(`/api/setting/payment-provider/${id}`, { [field]: value })
      AlertComplete()
      await fetchProviders()
    } catch (error) {
      console.error(error)
    }
  }

  const updateServiceCharge = async (id: number, rawValue: string) => {
    const trimmed = rawValue.trim()
    const percent = trimmed === '' ? null : Number(trimmed)
    if (percent !== null && (!Number.isFinite(percent) || percent < 0 || percent > 100)) return
    try {
      await axios.put(`/api/setting/payment-provider/${id}`, { serviceChargePercent: percent })
      AlertComplete()
      await fetchProviders()
    } catch (error) {
      console.error(error)
    }
  }

  const deleteCustomProvider = async (provider: PaymentProviderRow) => {
    if (providerMap.has(provider.provider)) return
    if (!window.confirm(`ลบช่องทางชำระเงิน "${provider.displayName || provider.provider}" ?`)) return

    try {
      await axios.delete(`/api/setting/payment-provider/${provider.id}`)
      if (editingProvider === provider.provider) setEditingProvider(null)
      await fetchProviders()
      AlertComplete()
    } catch (error) {
      console.error(error)
    }
  }

  const handleQrUpload = async (providerId: number, providerKey: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onloadend = async () => {
      const base64 = reader.result as string
      const companyS = localStorage.getItem('company_') || ''
      try {
        const res = await fetch('/api/setting/store/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: base64, company: companyS, hard: 'qr_' + providerKey }),
        })
        const data = await res.json()
        if (data.file) {
          await axios.put(`/api/setting/payment-provider/${providerId}`, { qrImageUrl: data.file })
          AlertComplete()
          await fetchProviders()
        }
      } catch (error) {
        console.error(error)
      }
    }
    reader.readAsDataURL(file)
  }

  const renderProviderCard = (meta: ProviderMeta, dbRow?: PaymentProviderRow, isCustom = false) => {
    const isEnabled = Boolean(dbRow?.enabled)
    const isEditing = editingProvider === meta.key
    const Icon = meta.Icon
    const canUploadQr = Boolean(dbRow) && !meta.manualOnly && meta.key !== 'promptpay'
    const canEditDetails = Boolean(dbRow) && meta.key !== 'promptpay'

    return (
      <div key={meta.key} className="col-sm-6 col-md-4 col-xl-3">
        <div
          className="border shadow-sm"
          style={{
            backgroundColor: isEnabled ? '#f8fffb' : '#ffffff',
            borderColor: isEnabled ? '#9be7bd' : '#dde5ee',
            borderRadius: 8,
            minHeight: 132,
            height: '100%',
            padding: 10,
            transition: 'border-color 0.15s, box-shadow 0.15s',
          }}
        >
          <div className="d-flex justify-content-between align-items-start" style={{ gap: 8 }}>
            <div className="d-flex align-items-start" style={{ gap: 8, minWidth: 0 }}>
              <div
                className="d-flex align-items-center justify-content-center"
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  backgroundColor: `${meta.color}14`,
                  color: meta.color,
                  flex: '0 0 auto',
                }}
              >
                <Icon size={15} strokeWidth={2.2} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontFamily: 'kanit',
                    fontSize: 13,
                    fontWeight: 700,
                    color: '#162033',
                    lineHeight: 1.25,
                    wordBreak: 'break-word',
                  }}
                >
                  {dbRow?.displayName || meta.name}
                </div>
                <div className="d-flex align-items-center" style={{ gap: 4, marginTop: 2, color: isEnabled ? '#10945b' : '#8a96a8', fontFamily: 'kanit', fontSize: 10 }}>
                  {isEnabled ? <CheckCircle2 size={11} /> : <CircleOff size={11} />}
                  {isEnabled ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                </div>
              </div>
            </div>

            {dbRow && (
              <button
                type="button"
                aria-label={isEnabled ? 'ปิดใช้งาน' : 'เปิดใช้งาน'}
                onClick={() => toggleProvider(dbRow.id, isEnabled)}
                style={{
                  width: 38,
                  height: 22,
                  borderRadius: 999,
                  border: 0,
                  backgroundColor: isEnabled ? '#3E86C7' : '#cbd5e1',
                  cursor: 'pointer',
                  position: 'relative',
                  flex: '0 0 auto',
                }}
              >
                <span
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: 999,
                    backgroundColor: '#fff',
                    position: 'absolute',
                    top: 2,
                    left: isEnabled ? 18 : 2,
                    transition: 'left 0.2s',
                    boxShadow: '0 1px 4px rgba(15, 23, 42, 0.25)',
                  }}
                />
              </button>
            )}
          </div>

          {dbRow ? (
            <>
              <div style={{ marginTop: 8, minHeight: 48 }}>
                {meta.key === 'promptpay' && (
                  promptPayContent || (
                    <div style={{ fontFamily: 'kanit', fontSize: 11, color: '#607087', lineHeight: 1.35 }}>
                      ใช้เลข PromptPay
                      <div style={{ fontSize: 10, color: '#8a96a8', marginTop: 1 }}>Auto Generate QR</div>
                    </div>
                  )
                )}

                {meta.manualOnly && (
                  <div>
                    <div style={{ fontFamily: 'kanit', fontSize: 11, color: '#607087', lineHeight: 1.35 }}>
                      ยืนยันยอดจากเครื่องรูดบัตร
                      <div style={{ fontSize: 10, color: '#8a96a8', marginTop: 1 }}>Manual confirmation</div>
                    </div>
                    <div
                      style={{
                        marginTop: 8,
                        padding: '7px 8px',
                        borderRadius: 8,
                        border: '1px solid #fde68a',
                        background: 'linear-gradient(135deg, #fffbeb, #fef9ec)',
                      }}
                    >
                      <div className="d-flex justify-content-between align-items-center" style={{ gap: 6, marginBottom: 4 }}>
                        <label
                          htmlFor={`service-charge-${meta.key}`}
                          style={{ fontFamily: 'kanit', fontSize: 11, fontWeight: 600, color: '#92400e', marginBottom: 0 }}
                        >
                          Service charge (%)
                        </label>
                        {Number(dbRow.serviceChargePercent || 0) > 0 && (
                          <span
                            style={{
                              fontFamily: 'kanit',
                              fontSize: 9,
                              color: '#b45309',
                              backgroundColor: '#fde68a',
                              borderRadius: 999,
                              padding: '1px 7px',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            +{Number(dbRow.serviceChargePercent)}% ต่อบิล
                          </span>
                        )}
                      </div>
                      <div className="input-group input-group-sm">
                        <input
                          type="number"
                          id={`service-charge-${meta.key}`}
                          className="form-control form-control-sm"
                          min={0}
                          max={100}
                          step={0.01}
                          defaultValue={dbRow.serviceChargePercent ?? ''}
                          onBlur={(e) => updateServiceCharge(dbRow.id, e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }}
                          style={fieldStyle}
                          placeholder="เช่น 1.5"
                        />
                        <span className="input-group-text" style={{ fontFamily: 'kanit', fontSize: 11, color: '#92400e', backgroundColor: '#fef3c7', borderColor: '#dbe3ec' }}>
                          %
                        </span>
                      </div>
                      <div style={{ fontFamily: 'kanit', fontSize: 9.5, color: '#a16207', marginTop: 4, lineHeight: 1.4 }}>
                        เรียกเก็บเพิ่มจากลูกค้าเมื่อชำระผ่านบัตร — ระบบคำนวณและแสดงยอดรวมให้ผู้ขายในหน้าชำระสินค้าอัตโนมัติ
                        {Number(dbRow.serviceChargePercent || 0) > 0 && (
                          <div style={{ marginTop: 2, color: '#854d0e' }}>
                            ตัวอย่าง: ยอด 1,000 บาท → เรียกเก็บ {(1000 + (1000 * Number(dbRow.serviceChargePercent)) / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} บาท
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {canUploadQr && (
                  <div className="d-flex align-items-center" style={{ gap: 8 }}>
                    <div
                      className="d-flex align-items-center justify-content-center"
                      style={{
                        width: 46,
                        height: 46,
                        borderRadius: 8,
                        border: '1px solid #dbe3ec',
                        backgroundColor: '#f8fafc',
                        overflow: 'hidden',
                        flex: '0 0 auto',
                      }}
                    >
                      {dbRow.qrImageUrl ? (
                        <img src={dbRow.qrImageUrl} alt="QR" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                      ) : (
                        <QrCode size={20} color="#9aa7b8" />
                      )}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontFamily: 'kanit', fontSize: 10, color: '#64748b', marginBottom: 4 }}>
                        {dbRow.qrImageUrl ? 'QR พร้อมใช้งาน' : 'ยังไม่มีรูป QR'}
                      </div>
                      <label htmlFor={`qr-upload-${meta.key}`} className="btn btn-outline-secondary btn-sm" style={{ ...buttonBase, minHeight: 24, padding: '1px 8px' }}>
                        <Upload size={12} />
                        อัปโหลด
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        id={`qr-upload-${meta.key}`}
                        style={{ display: 'none' }}
                        onChange={(e) => handleQrUpload(dbRow.id, meta.key, e)}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="d-flex" style={{ gap: 6, marginTop: 8 }}>
                {canEditDetails && (
                  <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm flex-grow-1"
                    onClick={() => setEditingProvider(isEditing ? null : meta.key)}
                    style={buttonBase}
                  >
                    <Settings2 size={12} />
                    {isEditing ? 'ปิดการตั้งค่า' : 'ตั้งค่า'}
                  </button>
                )}
                {isCustom && (
                  <button
                    type="button"
                    className="btn btn-outline-danger btn-sm"
                    onClick={() => deleteCustomProvider(dbRow)}
                    style={{ ...buttonBase, width: 36, padding: 0 }}
                    aria-label="ลบช่องทาง"
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </div>

              {isEditing && canEditDetails && (
                <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid #e5edf5' }}>
                  {isCustom && (
                    <div className="mb-2">
                      <label style={{ fontFamily: 'kanit', fontSize: 11, color: '#64748b' }}>ชื่อช่องทาง</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        defaultValue={dbRow.displayName || ''}
                        onBlur={(e) => updateProviderField(dbRow.id, 'displayName', e.target.value)}
                        style={fieldStyle}
                      />
                    </div>
                  )}
                  <div className="mb-2">
                    <label style={{ fontFamily: 'kanit', fontSize: 11, color: '#64748b' }}>Merchant ID</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      defaultValue={dbRow.merchantId || ''}
                      onBlur={(e) => updateProviderField(dbRow.id, 'merchantId', e.target.value)}
                      style={fieldStyle}
                      placeholder="Merchant ID"
                    />
                  </div>
                  <div className="mb-2">
                    <label style={{ fontFamily: 'kanit', fontSize: 11, color: '#64748b' }}>Account / Reference</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      defaultValue={dbRow.accountId || ''}
                      onBlur={(e) => updateProviderField(dbRow.id, 'accountId', e.target.value)}
                      style={fieldStyle}
                      placeholder="เลขบัญชี หรือรหัสอ้างอิง"
                    />
                  </div>
                  <div className="mb-2">
                    <label style={{ fontFamily: 'kanit', fontSize: 11, color: '#64748b' }}>API Key</label>
                    <input
                      type="password"
                      className="form-control form-control-sm"
                      defaultValue={dbRow.apiKey || ''}
                      onBlur={(e) => updateProviderField(dbRow.id, 'apiKey', e.target.value)}
                      style={fieldStyle}
                      placeholder="API Key"
                    />
                  </div>
                  <div>
                    <label style={{ fontFamily: 'kanit', fontSize: 11, color: '#64748b' }}>Secret Key</label>
                    <input
                      type="password"
                      className="form-control form-control-sm"
                      defaultValue={dbRow.secretKey || ''}
                      onBlur={(e) => updateProviderField(dbRow.id, 'secretKey', e.target.value)}
                      style={fieldStyle}
                      placeholder="Secret Key"
                    />
                  </div>
                </div>
              )}
            </>
          ) : (
            <div
              className="d-flex align-items-center justify-content-center text-center"
              style={{ fontFamily: 'kanit', fontSize: 12, color: '#8a96a8', minHeight: 126 }}
            >
              ยังไม่ได้เริ่มต้นรายการนี้
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div style={{ borderTop: '1px solid #dde5ee', paddingTop: 18, marginTop: 16 }}>
      <div className="d-flex justify-content-between align-items-start flex-wrap mb-3" style={{ gap: 12 }}>
        <div>
          <div style={{ fontFamily: 'kanit', fontSize: 17, fontWeight: 700, color: '#182334' }}>
            ตั้งค่า Payment Provider
          </div>
          <div style={{ fontFamily: 'kanit', fontSize: 12, color: '#708094', marginTop: 3 }}>
            เปิดใช้งาน {enabledCount} ช่องทาง / ทั้งหมด {totalVisibleProviders} ช่องทาง
          </div>
        </div>
        <div className="d-flex flex-wrap" style={{ gap: 8 }}>
          {missingMainProvider && (
            <button className="btn btn-outline-primary btn-sm" onClick={initProviders} style={buttonBase}>
              <CheckCircle2 size={14} />
              {providers.length === customProviders.length ? 'เริ่มต้น Provider หลัก' : 'เพิ่ม Provider หลักที่ขาด'}
            </button>
          )}
          <button className="btn btn-success btn-sm" onClick={() => setAddingCustom(true)} style={buttonBase}>
            <Plus size={14} />
            เพิ่มช่องทางชำระ
          </button>
        </div>
      </div>

      {addingCustom && (
        <div
          className="border shadow-sm mb-3"
          style={{
            borderRadius: 8,
            borderColor: '#cbd5e1',
            backgroundColor: '#fbfdff',
            padding: 14,
          }}
        >
          <div className="row g-2 align-items-end">
            <div className="col-md-3">
              <label style={{ fontFamily: 'kanit', fontSize: 12, color: '#4b5c70', fontWeight: 600 }}>ประเภทช่องทาง</label>
              <select
                value={customGroup}
                onChange={(e) => setCustomGroup(e.target.value as PaymentChannelGroup)}
                className="form-select form-select-sm"
                style={fieldStyle}
              >
                <option value="transfer">ชำระแบบโอน</option>
                <option value="other">ช่องทางอื่น</option>
              </select>
            </div>
            <div className="col-md-4">
              <label style={{ fontFamily: 'kanit', fontSize: 12, color: '#4b5c70', fontWeight: 600 }}>ชื่อช่องทาง</label>
              <input
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                className="form-control form-control-sm"
                style={fieldStyle}
                placeholder="เช่น เงินสดปลายทาง, LINE Pay, โอนบัญชีสำรอง"
              />
            </div>
            <div className="col-md-3">
              <label style={{ fontFamily: 'kanit', fontSize: 12, color: '#4b5c70', fontWeight: 600 }}>Account / Reference</label>
              <input
                value={customAccount}
                onChange={(e) => setCustomAccount(e.target.value)}
                className="form-control form-control-sm"
                style={fieldStyle}
                placeholder="เลขบัญชี หรือรหัสอ้างอิง"
              />
            </div>
            <div className="col-md-2 d-flex" style={{ gap: 8 }}>
              <button
                type="button"
                className="btn btn-success btn-sm flex-grow-1"
                onClick={addCustomProvider}
                disabled={!customName.trim() || savingCustom}
                style={buttonBase}
              >
                <Plus size={14} />
                เพิ่ม
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm"
                onClick={() => {
                  setAddingCustom(false)
                  setCustomGroup('transfer')
                  setCustomName('')
                  setCustomAccount('')
                }}
                style={{ ...buttonBase, width: 36, padding: 0 }}
                aria-label="ยกเลิก"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="d-flex align-items-center mb-2" style={{ gap: 8 }}>
        <Settings2 size={16} color="#526174" />
        <div style={{ fontFamily: 'kanit', fontSize: 14, fontWeight: 700, color: '#263449' }}>ชำระแบบโอน</div>
      </div>
      <div className="row g-2">
        {providerList.map((meta) => renderProviderCard(meta, providers.find((row) => row.provider === meta.key)))}
        {customTransferProviders.map((provider) => renderProviderCard({
          key: provider.provider,
          name: provider.displayName || 'ชำระแบบโอน',
          color: '#0f766e',
          Icon: Landmark,
          staticQr: true,
        }, provider, true))}
      </div>

      {customOtherProviders.length > 0 && (
        <>
          <div className="d-flex align-items-center mb-2 mt-4" style={{ gap: 8 }}>
            <PencilLine size={16} color="#526174" />
            <div style={{ fontFamily: 'kanit', fontSize: 14, fontWeight: 700, color: '#263449' }}>ช่องทางอื่น</div>
          </div>
          <div className="row g-2">
            {customOtherProviders.map((provider) => renderProviderCard({
              key: provider.provider,
              name: provider.displayName || 'ช่องทางอื่น',
              color: '#0f766e',
              Icon: Wallet,
              staticQr: true,
            }, provider, true))}
          </div>
        </>
      )}
    </div>
  )
}