'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Home, ShoppingCart, DollarSign, Box, ClipboardList, LogIn, Camera, Search, X, Plus, Minus, Check, AlertTriangle, BarChart3, FileText, RefreshCw, PackagePlus, MessageSquare } from "lucide-react"
import { useNavLevel } from '../useNavLevel'
import axios from 'axios'
import { usePermission } from '@/utils/usePermission'
import { Scanner } from '@yudiel/react-qr-scanner'
import { isNativeScannerAvailable, scanBarcode } from '@/lib/runtime/scanner'
import { toThaiDateString } from '@/utils/dateUtils'
import { DEFAULT_STOCK_ADJUST_REASON, STOCK_ADJUST_REASON_OPTIONS } from '@/lib/stockAdjustReasons'
import { isLotRequired, allocateFromLots, sortLotsForConsumption, NO_LOT_LABEL } from '@/lib/lotPolicy'

const apidatalist = "datalist"
const apibalance = "sale_cal/sale_balance"

// Mobile Stock Counting Styles
const mobileStockStyles = `
  @font-face {
    font-family: 'Kanit';
    src: url('/fonts/Kanit-Regular.ttf') format('truetype');
    font-weight: 400;
    font-style: normal;
  }
  
  @font-face {
    font-family: 'Kanit';
    src: url('/fonts/Kanit-SemiBold.ttf') format('truetype');
    font-weight: 600;
    font-style: normal;
  }

  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  .mobile-stock-app {
    font-family: 'Kanit', sans-serif;
    background: linear-gradient(180deg, #F3F8FC 0%, #f8fafc 100%);
    min-height: 100vh;
    max-width: 100vw;
    overflow-x: hidden;
    padding-bottom: 90px;
  }

  /* Header */
  .stock-header {
    background: linear-gradient(135deg, #3E86C7 0%, #2A6AAA 100%);
    padding: 16px 16px 20px;
    border-radius: 0 0 24px 24px;
    position: sticky;
    top: 0;
    z-index: 100;
    box-shadow: 0 4px 20px rgba(62, 134, 199, 0.3);
  }

  .header-title {
    color: white;
    font-size: 20px;
    font-weight: 600;
    text-align: center;
    margin-bottom: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    position: relative;
  }

  .header-btn {
    position: absolute;
    right: 0;
    top: 50%;
    transform: translateY(-50%);
    background: rgba(255,255,255,0.2);
    border: 1px solid rgba(255,255,255,0.3);
    border-radius: 10px;
    color: white;
    padding: 6px 12px;
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 4px;
    transition: all 0.2s ease;
    backdrop-filter: blur(4px);
  }

  .header-btn:active {
    transform: translateY(-50%) scale(0.95);
    background: rgba(255,255,255,0.3);
  }

  /* Search Container */
  .search-container {
    display: flex;
    gap: 10px;
    align-items: center;
  }

  .search-input-wrapper {
    flex: 1;
    position: relative;
  }

  .search-input {
    width: 100%;
    padding: 12px 16px 12px 44px;
    border: none;
    border-radius: 16px;
    background: rgba(255,255,255,0.95);
    font-size: 14px;
    font-family: 'Kanit', sans-serif;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    outline: none;
  }

  .search-input:focus {
    box-shadow: 0 4px 20px rgba(0,0,0,0.15);
  }

  .search-icon {
    position: absolute;
    left: 14px;
    top: 50%;
    transform: translateY(-50%);
    color: #9ca3af;
  }

  .camera-btn {
    width: 48px;
    height: 48px;
    border-radius: 16px;
    background: rgba(255,255,255,0.2);
    backdrop-filter: blur(10px);
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .camera-btn:active {
    transform: scale(0.95);
    background: rgba(255,255,255,0.3);
  }

  /* Tab Navigation */
  .tab-container {
    display: flex;
    background: white;
    margin: 16px;
    border-radius: 16px;
    padding: 4px;
    box-shadow: 0 2px 12px rgba(0,0,0,0.06);
    overflow-x: auto;
    scrollbar-width: none;
    -webkit-overflow-scrolling: touch;
  }

  .tab-container::-webkit-scrollbar {
    display: none;
  }

  .tab-btn {
    flex: 1;
    min-width: max-content;
    padding: 10px 16px;
    border: none;
    border-radius: 12px;
    background: transparent;
    font-family: 'Kanit', sans-serif;
    font-size: 13px;
    font-weight: 500;
    color: #6b7280;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    white-space: nowrap;
  }

  .tab-btn.active {
    background: linear-gradient(135deg, #3E86C7 0%, #2A6AAA 100%);
    color: white;
    box-shadow: 0 4px 12px rgba(62, 134, 199, 0.3);
  }

  /* Product Card */
  .product-card {
    background: white;
    border-radius: 16px;
    margin: 0 16px 12px;
    padding: 16px;
    box-shadow: 0 2px 12px rgba(0,0,0,0.06);
    border: 1px solid #f0f0f0;
    transition: all 0.2s ease;
  }

  .product-card:active {
    transform: scale(0.99);
  }

  .product-id {
    color: #3E86C7;
    font-size: 13px;
    font-weight: 600;
    margin-bottom: 4px;
  }

  .product-name {
    color: #1f2937;
    font-size: 15px;
    font-weight: 500;
    margin-bottom: 12px;
    line-height: 1.4;
  }

  .product-info-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-top: 12px;
    border-top: 1px solid #f3f4f6;
  }

  .product-unit {
    background: #F3F8FC;
    color: #3E86C7;
    padding: 6px 12px;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 500;
  }

  .product-balance {
    color: #3E86C7;
    font-size: 13px;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .quantity-control {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .qty-btn {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    border: 2px solid #e5e7eb;
    background: white;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
    color: #6b7280;
  }

  .qty-btn:active {
    transform: scale(0.95);
    background: #F3F8FC;
    border-color: #3E86C7;
    color: #3E86C7;
  }

  .qty-input {
    width: 50px;
    text-align: center;
    border: 2px solid #e5e7eb;
    border-radius: 8px;
    padding: 6px;
    font-size: 14px;
    font-family: 'Kanit', sans-serif;
    font-weight: 600;
    color: #1f2937;
    outline: none;
  }

  .qty-input:focus {
    border-color: #3E86C7;
  }

  /* Save Button */
  .save-item-btn {
    width: 100%;
    padding: 12px;
    margin-top: 12px;
    border: none;
    border-radius: 12px;
    background: linear-gradient(135deg, #3E86C7 0%, #2A6AAA 100%);
    color: white;
    font-family: 'Kanit', sans-serif;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }

  .save-item-btn:active {
    transform: scale(0.98);
  }

  .save-item-btn.saved {
    background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%);
  }

  /* Diff Badge - Compact pill style */
  .diff-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 36px;
    padding: 3px 10px;
    border-radius: 16px;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.3px;
  }

  .diff-badge.positive {
    background: #E5EEF8;
    color: #2A6AAA;
  }

  .diff-badge.negative {
    background: #fee2e2;
    color: #dc2626;
  }

  .diff-badge.neutral {
    background: #f3f4f6;
    color: #6b7280;
  }

  /* Compact Result Card - 60% height, ultra-compact design */
  .result-card {
    background: white;
    border-radius: 10px;
    margin: 0 16px 6px;
    padding: 8px 12px;
    box-shadow: 0 1px 4px rgba(0,0,0,0.04);
    border-left: 3px solid #3E86C7;
    transition: all 0.2s ease;
  }

  .result-card:active {
    transform: scale(0.99);
    background: #fafafa;
  }

  .result-card.has-diff {
    border-left-color: #3E86C7;
  }

  .result-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 4px;
  }

  .result-header .product-id {
    font-size: 11px;
    margin-bottom: 1px;
  }

  .result-header .product-name {
    font-size: 12px;
    margin-bottom: 0;
    line-height: 1.2;
  }

  .result-status {
    padding: 2px 6px;
    border-radius: 8px;
    font-size: 9px;
    font-weight: 600;
    white-space: nowrap;
  }

  .result-status.pending {
    background: #fef3c7;
    color: #d97706;
  }

  .result-status.approved {
    background: #E5EEF8;
    color: #2A6AAA;
  }

  /* Compact Stats Row */
  .result-details {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0;
    margin-top: 4px;
    padding-top: 6px;
    border-top: 1px solid #f0f0f0;
    background: linear-gradient(180deg, #f8fafb 0%, #f3f4f6 100%);
    margin-left: -12px;
    margin-right: -12px;
    margin-bottom: -8px;
    padding: 6px 12px;
    border-radius: 0 0 7px 7px;
  }

  .result-detail-item {
    text-align: center;
    flex: 1;
  }

  .result-detail-label {
    font-size: 9px;
    color: #6b7280;
    margin-bottom: 0;
  }

  .result-detail-value {
    font-size: 13px;
    font-weight: 700;
    color: #1f2937;
  }

  /* Professional mobile Diff cards */
  .diff-card {
    background: #ffffff;
    border-radius: 8px;
    margin: 0 16px 7px;
    padding: 8px 10px;
    border: 1px solid #e5e7eb;
    border-left: 4px solid #3E86C7;
    box-shadow: 0 2px 10px rgba(15, 23, 42, 0.06);
  }

  .diff-card.positive {
    border-left-color: #2A6AAA;
  }

  .diff-card.negative {
    border-left-color: #dc2626;
  }

  .diff-card-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 8px;
  }

  .diff-card-title {
    min-width: 0;
    flex: 1;
  }

  .diff-card-code {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    color: #1E5088;
    background: #F3F8FC;
    border: 1px solid #CCDFF1;
    border-radius: 999px;
    padding: 1px 7px;
    font-size: 9px;
    font-weight: 700;
    margin-bottom: 4px;
  }

  .diff-card-name {
    color: #111827;
    font-size: 12px;
    font-weight: 600;
    line-height: 1.25;
    word-break: break-word;
  }

  .diff-card-meta {
    color: #94a3b8;
    font-size: 9px;
    margin-top: 2px;
    line-height: 1.2;
  }

  .diff-card .diff-badge {
    min-width: 30px;
    padding: 2px 8px;
    font-size: 11px;
  }

  .diff-metric-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 6px;
    margin-top: 7px;
  }

  .diff-metric {
    border: 1px solid #e5e7eb;
    background: #f8fafc;
    border-radius: 7px;
    padding: 4px 5px;
    text-align: center;
    min-width: 0;
  }

  .diff-metric-label {
    color: #64748b;
    font-size: 9px;
    margin-bottom: 1px;
  }

  .diff-metric-value {
    color: #0f172a;
    font-size: 13px;
    font-weight: 800;
    line-height: 1.2;
    word-break: break-word;
  }

  .diff-action-row {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 7px;
    margin-top: 8px;
  }

  .diff-action-btn {
    border: none;
    border-radius: 8px;
    height: 32px;
    font-family: 'Kanit', sans-serif;
    font-size: 12px;
    font-weight: 700;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 5px;
    cursor: pointer;
    transition: transform 0.15s ease, box-shadow 0.15s ease;
  }

  .diff-action-btn:active {
    transform: scale(0.98);
  }

  .diff-action-btn.lot {
    background: #E5EEF8;
    color: #173F6B;
    border: 1px solid #A6C8E7;
  }

  .diff-action-btn.adjust {
    background: #fef3c7;
    color: #92400e;
    border: 1px solid #fcd34d;
  }

  /* Stock action bottom sheet */
  .stock-action-overlay {
    position: fixed;
    inset: 0;
    z-index: 900;
    background: rgba(15, 23, 42, 0.48);
    display: flex;
    align-items: flex-end;
  }

  .stock-action-sheet {
    width: 100%;
    max-height: calc(100vh - 76px);
    background: #ffffff;
    border-radius: 18px 18px 0 0;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    box-shadow: 0 -18px 40px rgba(15, 23, 42, 0.18);
    animation: slideUp 0.24s ease;
  }

  .stock-action-header {
    padding: 10px 16px 12px;
    border-bottom: 1px solid #e5e7eb;
    background: #ffffff;
  }

  .stock-action-handle {
    width: 40px;
    height: 4px;
    border-radius: 999px;
    background: #d1d5db;
    margin: 0 auto 10px;
  }

  .stock-action-title-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  .stock-action-title {
    color: #0f172a;
    font-size: 16px;
    font-weight: 800;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .stock-action-close {
    width: 34px;
    height: 34px;
    border-radius: 8px;
    border: 1px solid #e5e7eb;
    background: #f8fafc;
    color: #475569;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }

  .stock-action-body {
    overflow-y: auto;
    padding: 14px 16px calc(18px + env(safe-area-inset-bottom));
  }

  .stock-action-product {
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 10px;
    background: #f8fafc;
    margin-bottom: 12px;
  }

  .stock-action-product-code {
    color: #1E5088;
    font-size: 11px;
    font-weight: 800;
    margin-bottom: 4px;
  }

  .stock-action-product-name {
    color: #111827;
    font-size: 13px;
    font-weight: 600;
    line-height: 1.35;
  }

  .stock-action-stats {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 6px;
    margin-top: 10px;
  }

  .stock-action-stat {
    background: #ffffff;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 7px 4px;
    text-align: center;
  }

  .stock-action-stat-label {
    color: #64748b;
    font-size: 9px;
    margin-bottom: 2px;
  }

  .stock-action-stat-value {
    color: #0f172a;
    font-size: 14px;
    font-weight: 800;
  }

  .sheet-loading {
    padding: 34px 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    color: #64748b;
    font-size: 13px;
  }

  .sheet-section-title {
    color: #334155;
    font-size: 12px;
    font-weight: 800;
    margin: 4px 0 10px;
  }

  .lot-edit-card {
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 10px;
    background: #ffffff;
    margin-bottom: 10px;
  }

  .lot-edit-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    margin-bottom: 8px;
  }

  .lot-edit-title {
    color: #0f172a;
    font-size: 12px;
    font-weight: 800;
  }

  .lot-calc-pill {
    color: #1E5088;
    background: #E5EEF8;
    border: 1px solid #CCDFF1;
    border-radius: 999px;
    padding: 2px 8px;
    font-size: 10px;
    font-weight: 700;
    white-space: nowrap;
  }

  .lot-field-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
  }

  .sheet-field {
    display: flex;
    flex-direction: column;
    gap: 4px;
    color: #475569;
    font-size: 10px;
    font-weight: 700;
  }

  .sheet-input,
  .sheet-select,
  .sheet-textarea {
    width: 100%;
    border: 1.5px solid #dbe3ea;
    border-radius: 8px;
    background: #ffffff;
    color: #0f172a;
    font-family: 'Kanit', sans-serif;
    font-size: 13px;
    padding: 9px 10px;
    outline: none;
  }

  .sheet-input:focus,
  .sheet-select:focus,
  .sheet-textarea:focus {
    border-color: #3E86C7;
    box-shadow: 0 0 0 3px rgba(62, 134, 199, 0.12);
  }

  .sheet-textarea {
    min-height: 74px;
    resize: vertical;
  }

  .lot-sync-note {
    color: #92400e;
    background: #fffbeb;
    border: 1px solid #fde68a;
    border-radius: 8px;
    padding: 6px 8px;
    font-size: 10px;
    margin-top: 8px;
  }

  .lot-save-btn,
  .sheet-primary-btn {
    width: 100%;
    min-height: 40px;
    border: none;
    border-radius: 8px;
    background: linear-gradient(135deg, #3E86C7 0%, #2A6AAA 100%);
    color: #ffffff;
    font-family: 'Kanit', sans-serif;
    font-size: 13px;
    font-weight: 800;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    margin-top: 10px;
    cursor: pointer;
  }

  .lot-save-btn:disabled,
  .sheet-primary-btn:disabled {
    background: #d1d5db;
    color: #94a3b8;
    cursor: not-allowed;
  }

  .adjust-type-toggle {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    overflow: hidden;
    margin-bottom: 12px;
  }

  .adjust-type-option {
    border: none;
    background: #f8fafc;
    color: #64748b;
    font-family: 'Kanit', sans-serif;
    font-size: 13px;
    font-weight: 800;
    padding: 10px 0;
    cursor: pointer;
  }

  .adjust-type-option.active.increase {
    background: #2A6AAA;
    color: #ffffff;
  }

  .adjust-type-option.active.decrease {
    background: #dc2626;
    color: #ffffff;
  }

  .adjust-preview {
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    background: #f8fafc;
    padding: 10px;
    margin-top: 12px;
  }

  .adjust-preview-row {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: center;
    gap: 8px;
    text-align: center;
  }

  .adjust-preview-label {
    color: #64748b;
    font-size: 10px;
  }

  .adjust-preview-value {
    color: #0f172a;
    font-size: 18px;
    font-weight: 800;
  }

  .sheet-error {
    color: #dc2626;
    background: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 8px;
    padding: 8px 10px;
    font-size: 12px;
    margin-top: 10px;
  }

  /* Summary Cards */
  .summary-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
    padding: 0 16px;
    margin-bottom: 16px;
  }

  .summary-card {
    background: white;
    border-radius: 16px;
    padding: 16px;
    box-shadow: 0 2px 12px rgba(0,0,0,0.06);
    text-align: center;
  }

  .summary-card.full-width {
    grid-column: span 2;
  }

  .summary-icon {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 12px;
  }

  .summary-icon.green {
    background: #E5EEF8;
    color: #2A6AAA;
  }

  .summary-icon.blue {
    background: #E5EEF8;
    color: #2A6AAA;
  }

  .summary-icon.orange {
    background: #ffedd5;
    color: #ea580c;
  }

  .summary-icon.purple {
    background: #f3e8ff;
    color: #9333ea;
  }

  .summary-value {
    font-size: 28px;
    font-weight: 700;
    color: #1f2937;
  }

  .summary-label {
    font-size: 13px;
    color: #6b7280;
    margin-top: 4px;
  }

  /* QR Scanner Modal */
  .qr-scanner-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.95);
    z-index: 1000;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }

  .qr-scanner-header {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    padding: 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: linear-gradient(180deg, rgba(0,0,0,0.8) 0%, transparent 100%);
  }

  .qr-scanner-title {
    color: white;
    font-size: 18px;
    font-weight: 600;
  }

  .qr-close-btn {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: rgba(255,255,255,0.2);
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }

  .qr-scanner-frame {
    width: 280px;
    height: 280px;
    border: 3px solid #3E86C7;
    border-radius: 24px;
    position: relative;
    overflow: hidden;
  }

  .qr-scanner-hint {
    color: rgba(255,255,255,0.7);
    font-size: 14px;
    text-align: center;
    margin-top: 24px;
    padding: 0 40px;
  }

  /* Search Modal */
  .search-modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.5);
    z-index: 500;
    display: flex;
    flex-direction: column;
  }

  .search-modal {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    background: white;
    border-radius: 24px 24px 0 0;
    max-height: 80vh;
    display: flex;
    flex-direction: column;
    animation: slideUp 0.3s ease;
  }

  @keyframes slideUp {
    from { transform: translateY(100%); }
    to { transform: translateY(0); }
  }

  .search-modal-header {
    padding: 16px;
    border-bottom: 1px solid #f0f0f0;
    position: sticky;
    top: 0;
    background: white;
    border-radius: 24px 24px 0 0;
  }

  .search-modal-handle {
    width: 40px;
    height: 4px;
    background: #e5e7eb;
    border-radius: 2px;
    margin: 0 auto 12px;
  }

  .search-modal-input {
    width: 100%;
    padding: 14px 16px;
    border: 2px solid #e5e7eb;
    border-radius: 12px;
    font-size: 15px;
    font-family: 'Kanit', sans-serif;
    outline: none;
    transition: border-color 0.2s;
  }

  .search-modal-input:focus {
    border-color: #3E86C7;
  }

  .search-modal-list {
    flex: 1;
    overflow-y: auto;
    padding: 8px 0;
  }

  .product-search-item {
    padding: 14px 16px;
    display: flex;
    align-items: center;
    gap: 12px;
    border-bottom: 1px solid #f5f5f5;
    cursor: pointer;
    transition: background 0.2s;
  }

  .product-search-item:active {
    background: #F3F8FC;
  }

  .product-code {
    background: #F3F8FC;
    color: #3E86C7;
    padding: 4px 8px;
    border-radius: 6px;
    font-size: 11px;
    font-weight: 600;
    min-width: 60px;
    text-align: center;
  }

  .product-details {
    flex: 1;
    min-width: 0;
  }

  .product-search-name {
    font-size: 14px;
    color: #1f2937;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .product-barcode {
    font-size: 11px;
    color: #9ca3af;
    margin-top: 2px;
  }

  /* Bottom Navigation */
  .bottom-nav {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background: white;
    border-top: 1px solid #e5e7eb;
    display: flex;
    justify-content: space-around;
    padding: 12px 0 calc(12px + env(safe-area-inset-bottom));
    box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.08);
    z-index: 100;
  }

  .nav-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    color: #9ca3af;
    font-size: 11px;
    transition: color 0.2s;
    cursor: pointer;
    padding: 4px 12px;
  }

  .nav-item.active {
    color: #3E86C7;
  }

  .nav-icon {
    width: 24px;
    height: 24px;
  }

  /* Loading */
  .loading-overlay {
    position: fixed;
    inset: 0;
    background: white;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  .loading-spinner {
    width: 48px;
    height: 48px;
    border: 4px solid #e5e7eb;
    border-top-color: #3E86C7;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .loading-text {
    margin-top: 16px;
    color: #6b7280;
    font-size: 14px;
  }

  /* Empty State */
  .empty-state {
    text-align: center;
    padding: 48px 24px;
    color: #9ca3af;
  }

  .empty-state-icon {
    width: 64px;
    height: 64px;
    margin: 0 auto 16px;
    color: #d1d5db;
  }

  .empty-state-title {
    font-size: 16px;
    font-weight: 600;
    color: #6b7280;
    margin-bottom: 8px;
  }

  .empty-state-text {
    font-size: 14px;
  }

  /* Inline Search Bar - Compact & Professional */
  .inline-search-container {
    padding: 0 16px;
    margin-bottom: 12px;
  }

  .inline-search-wrapper {
    position: relative;
    display: flex;
    align-items: center;
  }

  .inline-search-input {
    width: 100%;
    padding: 8px 36px 8px 32px;
    border: 1px solid #e5e7eb;
    border-radius: 20px;
    background: white;
    font-size: 13px;
    font-family: 'Kanit', sans-serif;
    outline: none;
    transition: all 0.2s ease;
    box-shadow: 0 1px 3px rgba(0,0,0,0.04);
  }

  .inline-search-input::placeholder {
    color: #9ca3af;
  }

  .inline-search-input:focus {
    border-color: #3E86C7;
    box-shadow: 0 2px 8px rgba(62, 134, 199, 0.15);
  }

  .inline-search-icon {
    position: absolute;
    left: 10px;
    top: 50%;
    transform: translateY(-50%);
    color: #9ca3af;
    pointer-events: none;
  }

  .inline-search-clear {
    position: absolute;
    right: 8px;
    top: 50%;
    transform: translateY(-50%);
    width: 18px;
    height: 18px;
    border: none;
    border-radius: 50%;
    background: #e5e7eb;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .inline-search-clear:hover {
    background: #d1d5db;
  }

  .inline-search-clear:active {
    transform: translateY(-50%) scale(0.95);
    background: #9ca3af;
  }

  /* Month Selector */
  .month-selector {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 0 16px;
    margin-bottom: 16px;
  }

  .month-input {
    flex: 1;
    padding: 12px 16px;
    border: 2px solid #e5e7eb;
    border-radius: 12px;
    font-size: 14px;
    font-family: 'Kanit', sans-serif;
    outline: none;
    background: white;
  }

  .month-input:focus {
    border-color: #3E86C7;
  }

  /* Toast notification */
  .toast {
    position: fixed;
    bottom: 100px;
    left: 50%;
    transform: translateX(-50%);
    background: #1f2937;
    color: white;
    padding: 12px 24px;
    border-radius: 12px;
    font-size: 14px;
    z-index: 1000;
    animation: toastIn 0.3s ease;
  }

  @keyframes toastIn {
    from { opacity: 0; transform: translateX(-50%) translateY(20px); }
    to { opacity: 1; transform: translateX(-50%) translateY(0); }
  }
`;

interface ProductItem {
  id: number;
  code: string;
  ProductName: string;
  Unit: string;
  Barcode: string;
  itembalance?: number;
}

interface CountedItem {
  id_product: number;
  code: string;
  name_product: string;
  unit: string;
  balance: number;
  actual: number;
  diff: number;
  saved: boolean;
}

interface CheckstockRecord {
  id: number;
  date: string;
  month: string;
  idcompany: string;
  id_product: number;
  name_product: string;
  balance: number;
  actual: number;
  diff: number;
  person: string;
  status: string;
}

interface StockLot {
  id: number;
  lot?: string | null;
  dateExp?: string | null;
  qty?: number | null;
  balance?: number | null;
  rawBalance?: number | null;
  newCost?: number | null;
  totalcost?: number | null;
  namevender?: string | null;
  dateRC?: string | null;
  createDate?: string | null;
}

interface StockSummaryData {
  product?: {
    code?: string;
    ProductName?: string;
    Unit?: string;
    Barcode?: string;
  };
  lots?: StockLot[];
  calculatedBalance?: number;
  totalBalance?: number;
  rawTotalBalance?: number;
  /** นโยบาย lot ของสินค้า — false = ปรับยอดโดยไม่ต้องเลือก lot */
  requireLot?: boolean;
}

type LotEditValues = {
  lot: string;
  dateExp: string;
  balance: string;
  dateRC: string;
};

function MobileStockPage() {
  const router = useRouter();
  const { isNavVisible } = useNavLevel();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('count');
  const [activeNavTab, setActiveNavTab] = useState('count');
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [dataProduct, setDataProduct] = useState<ProductItem[]>([]);
  const [countedItems, setCountedItems] = useState<CountedItem[]>([]);
  const [checkstockRecords, setCheckstockRecords] = useState<CheckstockRecord[]>([]);
  const [toast, setToast] = useState('');
  const [diffSearchQuery, setDiffSearchQuery] = useState('');
  const [resultsSearchQuery, setResultsSearchQuery] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [companyS, setCompanyS] = useState('');
  const [personS, setPersonS] = useState('');
  const [l, setlevel] = useState([])
  const { hasPermission, levelData, empPermissions } = usePermission()
  const [liveBalanceMap, setLiveBalanceMap] = useState<{ [code: string]: number }>({});
  const [selectedDiffRecord, setSelectedDiffRecord] = useState<CheckstockRecord | null>(null);
  const [stockSummary, setStockSummary] = useState<StockSummaryData | null>(null);
  const [lotSheetMode, setLotSheetMode] = useState<'lot' | 'adjust' | null>(null);
  const [lotLoading, setLotLoading] = useState(false);
  const [lotEditValues, setLotEditValues] = useState<Record<number, LotEditValues>>({});
  const [lotSavingId, setLotSavingId] = useState<number | null>(null);
  const [adjustLotId, setAdjustLotId] = useState('');
  const [adjustQty, setAdjustQty] = useState('');
  const [adjustReasonMain, setAdjustReasonMain] = useState('');
  const [adjustReason, setAdjustReason] = useState('');
  const [adjustType, setAdjustType] = useState<'increase' | 'decrease'>('increase');
  const [adjustSubmitting, setAdjustSubmitting] = useState(false);
  const [adjustError, setAdjustError] = useState('');

  const canShowDiffStockActions = (() => {
    if (typeof window === 'undefined') return false;
    const userLevel = localStorage.getItem("level_") || "";
    if (userLevel === "level2") return true;

    const override = empPermissions.find((permission: any) => permission.codename === "P8");
    if (override) return Boolean(override.allowed);

    const globalPermission = levelData.find((permission: any) => permission.codename === "P8");
    if (globalPermission) {
      if (userLevel === "level1") return globalPermission.level1 !== false;
      if (userLevel === "level3") return globalPermission.level3 !== false;
      return true;
    }

    return userLevel !== "level1" && hasPermission("P8");
  })();


  useEffect(() => {
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    document.body.style.background = '#f8fafc';
  }, []);

  useEffect(() => {
    setLoading(false);
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCompanyS(localStorage.getItem("company_") || "");
      setPersonS(localStorage.getItem("person_") || "");
    }
  }, []);

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      if (typeof window === "undefined") return;
      let company = localStorage.getItem("company_") || "";
      try {
        const [res, balanceRes] = await Promise.all([
          axios.get(`/api/${apidatalist}?company=${company}`),
          axios.get(`/api/${apibalance}?company=${company}`)
        ]);

        const productsWithBalance = res.data.map((product: any) => {
          const balanceItem = balanceRes.data.find((b: any) => b.code === product.code);
          return {
            ...product,
            itembalance: balanceItem ? balanceItem.balance : 0
          };
        });

        setDataProduct(productsWithBalance);
      } catch (error) {
        console.error(error);
      }
    };
    fetchProducts();
  }, []);

  const fetchCheckstockRecords = async (company = companyS) => {
    if (!company) return;
    try {
      const res = await axios.get(`/api/checkstock?idcompany=${encodeURIComponent(company)}`);
      setCheckstockRecords(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  // Fetch checkstock records
  useEffect(() => {
    if (companyS) fetchCheckstockRecords(companyS);
  }, [companyS, countedItems]);

  // Show toast
  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(''), 2500);
  };

  const fmtStockNumber = (value: any) => {
    const numberValue = Number(value);
    if (!Number.isFinite(numberValue)) return '-';
    return numberValue.toLocaleString('th-TH', { maximumFractionDigits: 2 });
  };

  const getProductForRecord = (record: CheckstockRecord | null) => {
    if (!record) return undefined;
    return dataProduct.find(p => p.id === record.id_product);
  };

  const getLiveBalanceForRecord = (record: CheckstockRecord) => {
    const product = getProductForRecord(record);
    if (product?.code && liveBalanceMap[product.code] !== undefined) {
      return liveBalanceMap[product.code];
    }
    return record.balance;
  };

  const getLiveDiffForRecord = (record: CheckstockRecord) => {
    return Number(record.actual || 0) - Number(getLiveBalanceForRecord(record) || 0);
  };

  const buildLotEditValues = (lots: StockLot[] = []) => {
    const values: Record<number, LotEditValues> = {};
    lots.forEach((lot) => {
      values[lot.id] = {
        lot: String(lot.lot || ''),
        dateExp: lot.dateExp ? toThaiDateString(lot.dateExp) : '',
        balance: lot.rawBalance !== null && lot.rawBalance !== undefined
          ? String(lot.rawBalance)
          : lot.balance !== null && lot.balance !== undefined ? String(lot.balance) : '',
        dateRC: lot.dateRC || lot.createDate ? toThaiDateString(lot.dateRC || lot.createDate || '') : ''
      };
    });
    setLotEditValues(values);
  };

  const fetchStockSummaryForRecord = async (record: CheckstockRecord, silent = false) => {
    const product = getProductForRecord(record);
    const company = companyS || localStorage.getItem("company_") || "";

    if (!product?.code || !company) {
      showToast('ไม่พบรหัสสินค้า');
      return null;
    }

    if (!silent) setLotLoading(true);
    try {
      const res = await axios.get(`/api/stock-balance-summary?itemcode=${encodeURIComponent(product.code)}&company=${encodeURIComponent(company)}&id=${product.id}`);
      const summary = res.data as StockSummaryData;
      setStockSummary(summary);
      buildLotEditValues(summary.lots || []);
      if (summary.calculatedBalance !== undefined) {
        setLiveBalanceMap(prev => ({ ...prev, [product.code]: Number(summary.calculatedBalance || 0) }));
      }
      return summary;
    } catch (error) {
      console.error(error);
      showToast('โหลดข้อมูล Lot ไม่สำเร็จ');
      return null;
    } finally {
      if (!silent) setLotLoading(false);
    }
  };

  const syncDiffRecordBalance = async (record: CheckstockRecord, nextBalance: number) => {
    const nextDiff = Number(record.actual || 0) - Number(nextBalance || 0);
    await axios.put(`/api/checkstock/${record.id}`, {
      idcompany: record.idcompany,
      id_product: record.id_product,
      name_product: record.name_product,
      balance: nextBalance,
      actual: record.actual,
      diff: nextDiff,
      person: personS || record.person,
      status: nextDiff === 0 ? 'approved' : 'pending'
    });
    await fetchCheckstockRecords(record.idcompany || companyS);
  };

  const openLotSheet = async (record: CheckstockRecord) => {
    setSelectedDiffRecord(record);
    setLotSheetMode('lot');
    setStockSummary(null);
    setAdjustError('');
    await fetchStockSummaryForRecord(record);
  };

  const openAdjustSheet = async (record: CheckstockRecord) => {
    const diff = getLiveDiffForRecord(record);
    setSelectedDiffRecord(record);
    setLotSheetMode('adjust');
    setStockSummary(null);
    setAdjustError('');
    setAdjustType(diff < 0 ? 'decrease' : 'increase');
    setAdjustQty(diff !== 0 ? String(Math.abs(diff)) : '');
    setAdjustReasonMain(DEFAULT_STOCK_ADJUST_REASON);
    setAdjustReason('ปรับยอดจาก Diff นับสต็อก');
    setAdjustLotId('');

    const summary = await fetchStockSummaryForRecord(record);
    const lots = summary?.lots || [];
    const requiredQty = Math.abs(diff);
    const preferredLot = diff < 0
      ? lots.find(lot => Number(lot.balance || 0) >= requiredQty && Number(lot.balance || 0) > 0) || lots.find(lot => Number(lot.balance || 0) > 0) || lots[0]
      : lots.find(lot => Number(lot.balance || 0) > 0) || lots[0];
    if (preferredLot) setAdjustLotId(String(preferredLot.id));
  };

  const closeStockActionSheet = () => {
    setLotSheetMode(null);
    setSelectedDiffRecord(null);
    setStockSummary(null);
    setLotEditValues({});
    setAdjustError('');
    setAdjustLotId('');
    setAdjustQty('');
    setAdjustReasonMain('');
    setAdjustReason('');
  };

  const updateLotEditValue = (lotId: number, field: keyof LotEditValues, value: string) => {
    setLotEditValues(prev => ({
      ...prev,
      [lotId]: {
        ...(prev[lotId] || { lot: '', dateExp: '', balance: '', dateRC: '' }),
        [field]: value
      }
    }));
  };

  const saveLotEdit = async (lot: StockLot) => {
    if (!selectedDiffRecord) return;
    const values = lotEditValues[lot.id];
    if (!values) return;

    const balanceValue = values.balance !== '' ? Number(values.balance) : undefined;
    if (values.balance !== '' && !Number.isFinite(balanceValue)) {
      showToast('ยอดคงเหลือต้องเป็นตัวเลข');
      return;
    }

    setLotSavingId(lot.id);
    try {
      await axios.put('/api/lot-edit', {
        lotId: lot.id,
        lot: values.lot,
        dateExp: values.dateExp || null,
        balance: balanceValue,
        dateRC: values.dateRC || null,
        person: personS || localStorage.getItem("person_") || ''
      });
      const refreshed = await fetchStockSummaryForRecord(selectedDiffRecord, true);
      if (refreshed?.calculatedBalance !== undefined) {
        await syncDiffRecordBalance(selectedDiffRecord, Number(refreshed.calculatedBalance || 0));
      }
      showToast('บันทึก Lot สำเร็จ');
    } catch (error: any) {
      console.error(error);
      showToast(error?.response?.data?.error || 'บันทึก Lot ไม่สำเร็จ');
    } finally {
      setLotSavingId(null);
    }
  };

  const handleAdjustSubmit = async () => {
    if (!selectedDiffRecord || !stockSummary) return;
    // สินค้าที่ตั้งค่า "ไม่มี Lot" ไม่ต้องเลือก lot — ระบบปันส่วนให้เอง (ดู src/lib/lotPolicy.ts)
    const requireLot = isLotRequired(stockSummary);
    if (!adjustQty || !adjustReasonMain || (requireLot && !adjustLotId)) {
      setAdjustError(requireLot
        ? 'กรุณาเลือก Lot ระบุจำนวน และเลือกเหตุผลหลัก'
        : 'กรุณาระบุจำนวน และเลือกเหตุผลหลัก');
      return;
    }

    const qty = Number(adjustQty);
    if (!Number.isFinite(qty) || qty <= 0) {
      setAdjustError('จำนวนต้องเป็นตัวเลขที่มากกว่า 0');
      return;
    }

    let adjustTargets: { lot: any; qty: number }[] = [];

    if (requireLot) {
      const selectedLot = (stockSummary.lots || []).find(lot => String(lot.id) === adjustLotId);
      if (!selectedLot) {
        setAdjustError('ไม่พบ Lot ที่เลือก');
        return;
      }
      if (adjustType === 'decrease' && qty > Number(selectedLot.balance || 0)) {
        setAdjustError(`ยอดคงเหลือไม่เพียงพอ (มี ${fmtStockNumber(selectedLot.balance || 0)})`);
        return;
      }
      adjustTargets = [{ lot: selectedLot, qty }];
    } else {
      const lots = stockSummary.lots || [];
      if (lots.length === 0) {
        setAdjustError('ยังไม่มีรายการรับเข้าของสินค้านี้ จึงปรับยอดไม่ได้ (ต้องรับสินค้าเข้าก่อน 1 ครั้ง)');
        return;
      }
      if (adjustType === 'increase') {
        const sorted = sortLotsForConsumption(lots as any[]);
        const target = sorted.find((lot: any) => Number(lot.balance || 0) > 0) || sorted[0];
        adjustTargets = [{ lot: target, qty }];
      } else {
        const { allocations, shortage } = allocateFromLots(lots as any[], qty);
        if (shortage > 0) {
          setAdjustError(`ยอดคงเหลือไม่เพียงพอ (ขาดอีก ${fmtStockNumber(shortage)})`);
          return;
        }
        adjustTargets = allocations;
      }
    }

    const product = getProductForRecord(selectedDiffRecord);

    setAdjustSubmitting(true);
    setAdjustError('');
    try {
      // ปรับยอดทีละ lot — สินค้าที่ใช้ lot จะมีเป้าหมายเดียวเสมอ
      for (const target of adjustTargets) {
        await axios.post('/api/stock-adjust', {
          lotId: String(target.lot.id),
          itemcode: product?.code || stockSummary.product?.code || '',
          itemName: stockSummary.product?.ProductName || selectedDiffRecord.name_product || '',
          lot: target.lot.lot || '',
          dateExp: target.lot.dateExp || null,
          adjustQty: adjustType === 'decrease' ? -target.qty : target.qty,
          adjustReasonMain,
          reason: adjustReason,
          company: companyS || localStorage.getItem("company_") || '',
          person: personS || localStorage.getItem("person_") || ''
        });
      }
      const refreshed = await fetchStockSummaryForRecord(selectedDiffRecord, true);
      if (refreshed?.calculatedBalance !== undefined) {
        await syncDiffRecordBalance(selectedDiffRecord, Number(refreshed.calculatedBalance || 0));
      }
      showToast('ปรับยอดสำเร็จ');
      closeStockActionSheet();
    } catch (error: any) {
      console.error(error);
      setAdjustError(error?.response?.data?.error || 'ปรับยอดไม่สำเร็จ');
    } finally {
      setAdjustSubmitting(false);
    }
  };

  // QR Scanner Functions - Using @yudiel/react-qr-scanner
  // บนแอป Android ใช้ ML Kit ของระบบแทน overlay ตัวเดิม (เร็วและโฟกัสดีกว่ามาก)
  const startQRScanner = async () => {
    if (isNativeScannerAvailable()) {
      try {
        const result = await scanBarcode();
        if (result?.value) handleQRCodeScanned(result.value);
      } catch (error: any) {
        showToast(error?.message || 'เปิดกล้องไม่สำเร็จ');
      }
      return;
    }

    setShowQRScanner(true);
  };

  const stopQRScanner = () => {
    setShowQRScanner(false);
  };

  const handleScanResult = (result: any) => {
    if (result && result.length > 0) {
      const scannedCode = result[0].rawValue;
      handleQRCodeScanned(scannedCode);
      stopQRScanner();
    }
  };

  const handleQRCodeScanned = async (code: string) => {
    const product = dataProduct.find((p) => p.Barcode === code);
    if (product) {
      let balance = 0;
      try {
        const company = localStorage.getItem("company_") || "";
        const res = await axios.get(`/api/stock-balance-summary?itemcode=${product.code}&company=${company}&id=${product.id}`);
        balance = res.data?.calculatedBalance ?? 0;
      } catch (e) { console.error(e); }
      const productWithBalance = { ...product, itembalance: balance };
      const canAdd = addProductToCount(productWithBalance);
      if (canAdd) {
        showToast(`เพิ่ม ${product.ProductName}`);
      }
    } else {
      showToast('ไม่พบสินค้า');
    }
  };

  const handleProductSelect = async (product: ProductItem) => {
    let balance = 0;
    try {
      const company = localStorage.getItem("company_") || "";
      const res = await axios.get(`/api/stock-balance-summary?itemcode=${product.code}&company=${company}&id=${product.id}`);
      balance = res.data?.calculatedBalance ?? 0;
    } catch (e) { console.error(e); }
    const productWithBalance = { ...product, itembalance: balance };
    const canAdd = addProductToCount(productWithBalance);
    setShowSearchModal(false);
    setSearchQuery('');
    if (canAdd) {
      showToast(`เพิ่ม ${product.ProductName}`);
    }
  };

  const addProductToCount = (product: ProductItem): boolean => {
    // Check if already in current counting list
    const existingInCurrent = countedItems.findIndex(item => item.id_product === product.id);
    if (existingInCurrent !== -1) {
      showToast('สินค้านี้อยู่ในรายการนับแล้ว');
      return false;
    }

    // Check if already counted in checkstockRecords
    const existingRecord = checkstockRecords.find(r => r.id_product === product.id);
    if (existingRecord) {
      // If diff = 0, already completed - don't allow re-count
      if (existingRecord.diff === 0) {
        alert(`สินค้า "${product.ProductName}" มีการนับไปแล้ว และผลต่างเป็น 0`);
        return false;
      }
      // If diff != 0, allow re-counting
    }

    setCountedItems([...countedItems, {
      id_product: product.id,
      code: product.code,
      name_product: product.ProductName,
      unit: product.Unit,
      balance: product.itembalance || 0,
      actual: 0,
      diff: -(product.itembalance || 0),
      saved: false
    }]);
    return true;
  };

  const updateActualCount = (id_product: number, actual: number) => {
    setCountedItems(countedItems.map(item => {
      if (item.id_product === id_product) {
        const diff = actual - item.balance;
        return { ...item, actual, diff, saved: false };
      }
      return item;
    }));
  };

  const incrementActual = (id_product: number) => {
    const item = countedItems.find(i => i.id_product === id_product);
    if (item) {
      updateActualCount(id_product, item.actual + 1);
    }
  };

  const decrementActual = (id_product: number) => {
    const item = countedItems.find(i => i.id_product === id_product);
    if (item && item.actual > 0) {
      updateActualCount(id_product, item.actual - 1);
    }
  };

  const saveCountItem = async (item: CountedItem) => {
    try {
      // Set status based on diff: if diff = 0, status = 'เรียบร้อย', else 'pending'
      const status = item.diff === 0 ? 'approved' : 'pending';

      await axios.post('/api/checkstock', {
        idcompany: companyS,
        id_product: item.id_product,
        month: selectedMonth,
        name_product: item.name_product,
        balance: item.balance,
        actual: item.actual,
        diff: item.diff,
        person: personS,
        status: status
      });

      setCountedItems(countedItems.map(i =>
        i.id_product === item.id_product ? { ...i, saved: true } : i
      ));

      showToast(status === 'approved' ? 'บันทึกสำเร็จ (เรียบร้อย)' : 'บันทึกสำเร็จ (รอตรวจสอบ)');
    } catch (error) {
      console.error(error);
      showToast('เกิดข้อผิดพลาด');
    }
  };

  const filteredProducts = dataProduct.filter((product) => {
    const query = searchQuery.toLowerCase();
    return (
      product.ProductName?.toLowerCase().includes(query) ||
      product.code?.toLowerCase().includes(query) ||
      product.Barcode?.toLowerCase().includes(query)
    );
  });

  // Fetch live stock balance for Diff/Results so the card reflects current stock after adjustments.
  useEffect(() => {
    if (activeTab !== 'diff' && activeTab !== 'results') return;
    if (!companyS || dataProduct.length === 0 || checkstockRecords.length === 0) return;

    const records = checkstockRecords.filter(r => r.month === selectedMonth);
    const seen = new Set<number>();
    const uniqueProducts = records
      .map(record => dataProduct.find(product => product.id === record.id_product))
      .filter((product): product is ProductItem => Boolean(product?.code))
      .filter(product => {
        if (seen.has(product.id)) return false;
        seen.add(product.id);
        return true;
      });

    if (uniqueProducts.length === 0) return;

    let cancelled = false;
    const fetchLiveBalances = async () => {
      const nextMap: { [code: string]: number } = {};
      await Promise.all(uniqueProducts.map(async (product) => {
        try {
          const res = await axios.get(`/api/stock-balance-summary?itemcode=${encodeURIComponent(product.code)}&company=${encodeURIComponent(companyS)}&id=${product.id}`);
          nextMap[product.code] = Number(res.data?.calculatedBalance ?? 0);
        } catch (error) {
          console.error(error);
        }
      }));

      if (!cancelled) {
        setLiveBalanceMap(prev => ({ ...prev, ...nextMap }));
      }
    };

    fetchLiveBalances();
    return () => { cancelled = true; };
  }, [activeTab, checkstockRecords, selectedMonth, dataProduct, companyS]);

  // Filter records for diff view (only items with diff != 0, filtered by month)
  // Hide products if their latest record (by date) has status 'approved'
  const filteredDiffRecords = checkstockRecords.filter(r => {
    const currentDiff = getLiveDiffForRecord(r);
    if (currentDiff === 0) return false;
    // Filter by selected month
    if (r.month !== selectedMonth) return false;

    // Find all records for this product and get the latest one by date
    const productRecords = checkstockRecords.filter(pr => pr.id_product === r.id_product);
    const latestRecord = productRecords.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
    // If the latest record is approved, hide from diff
    if (latestRecord && latestRecord.status === 'approved') return false;

    if (!diffSearchQuery) return true;
    const query = diffSearchQuery.toLowerCase();
    return (
      r.name_product?.toLowerCase().includes(query) ||
      r.id_product?.toString().includes(query)
    );
  });

  // Filter records for results view (filtered by month)
  const filteredResultsRecords = checkstockRecords.filter(r => {
    // Filter by selected month
    if (r.month !== selectedMonth) return false;
    if (!resultsSearchQuery) return true;
    const query = resultsSearchQuery.toLowerCase();
    return (
      r.name_product?.toLowerCase().includes(query) ||
      r.id_product?.toString().includes(query)
    );
  });

  // Original diff records (unfiltered by search, only diff != 0, filtered by month)
  const diffRecords = checkstockRecords.filter(r => r.diff !== 0 && r.month === selectedMonth);

  // Records filtered by month for summary
  const monthFilteredRecords = checkstockRecords.filter(r => r.month === selectedMonth);

  // Summary calculations (based on selected month)
  const totalCounted = monthFilteredRecords.length;
  const totalDiffPositive = monthFilteredRecords.filter(r => r.diff > 0).reduce((sum, r) => sum + r.diff, 0);
  const totalDiffNegative = monthFilteredRecords.filter(r => r.diff < 0).reduce((sum, r) => sum + r.diff, 0);
  const pendingCount = monthFilteredRecords.filter(r => r.status === 'pending').length;

  const handleNavigation = (tab: string) => {
    setActiveNavTab(tab);
    if (tab === 'home') router.push('/web/mobile/index/');
    if (tab === 'checkin') router.push('/web/mobile/checkin/');
    if (tab === 'sale') router.push('/web/mobile/sale/');
    if (tab === 'product') router.push('/web/mobile/product/');
    if (tab === 'stockchange') router.push('/web/mobile/stockchange/');
    if (tab === 'receive') router.push('/web/mobile/rc/');
    if (tab === 'pickup') router.push('/web/mobile/gift/');
    if (tab === 'voice') router.push('/web/mobile/voice/');
  };

  // การมองเห็น
  useEffect(() => {
  }, []);

  if (loading) {
    return (
      <>
        <style dangerouslySetInnerHTML={{ __html: mobileStockStyles }} />
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <div className="loading-text">กำลังโหลด...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: mobileStockStyles }} />
      <div className="mobile-stock-app">
        {/* Header */}
        <div className="stock-header">
          <div className="header-title">
            <ClipboardList size={24} />
            นับ Stock

          </div>

          <div className="search-container">
            <div className="search-input-wrapper">
              <Search size={20} className="search-icon" />
              <input
                type="text"
                className="search-input"
                placeholder="ค้นหาสินค้า..."
                readOnly
                onClick={() => setShowSearchModal(true)}
              />
            </div>
            <button className="camera-btn" onClick={startQRScanner}>
              <Camera size={24} color="white" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="tab-container">
          <button
            className={`tab-btn ${activeTab === 'count' ? 'active' : ''}`}
            onClick={() => setActiveTab('count')}
          >
            <Box size={16} />
            นับ Stock
          </button>
          <button
            className={`tab-btn ${activeTab === 'diff' ? 'active' : ''}`}
            onClick={() => setActiveTab('diff')}
          >
            <AlertTriangle size={16} />
            Diff
          </button>
          <button
            className={`tab-btn ${activeTab === 'results' ? 'active' : ''}`}
            onClick={() => setActiveTab('results')}
          >
            <FileText size={16} />
            ผลการนับ
          </button>
          <button
            className={`tab-btn ${activeTab === 'summary' ? 'active' : ''}`}
            onClick={() => setActiveTab('summary')}
          >
            <BarChart3 size={16} />
            สรุปผล
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'count' && (
          <>
            {countedItems.filter(item => !item.saved).length === 0 ? (
              <div className="empty-state">
                <Box className="empty-state-icon" />
                <div className="empty-state-title">ยังไม่มีรายการนับ</div>
                <div className="empty-state-text">ค้นหาหรือสแกนสินค้าเพื่อเริ่มนับ</div>
              </div>
            ) : (
              countedItems.filter(item => !item.saved).map((item) => (
                <div key={item.id_product} className="product-card">
                  <div className="product-id">{item.code}</div>
                  <div className="product-name">{item.name_product}</div>
                  <div className="product-info-row">
                    <div className="product-unit">{item.unit}</div>
                    <div className="product-balance">คงเหลือ {item.balance}</div>
                    <div className="quantity-control">
                      <button className="qty-btn" onClick={() => decrementActual(item.id_product)}>
                        <Minus size={16} />
                      </button>
                      <input
                        type="number"
                        className="qty-input"
                        value={item.actual}
                        onChange={(e) => updateActualCount(item.id_product, parseInt(e.target.value) || 0)}
                      />
                      <button className="qty-btn" onClick={() => incrementActual(item.id_product)}>
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>
                  <button
                    className={`save-item-btn ${item.saved ? 'saved' : ''}`}
                    onClick={() => saveCountItem(item)}
                    disabled={item.saved}
                  >
                    <Check size={18} />
                    {item.saved ? 'บันทึกแล้ว' : 'บันทึก'}
                  </button>
                </div>
              ))
            )}
          </>
        )}

        {activeTab === 'diff' && (
          <>
            {/* Search Bar for Diff Tab */}
            <div className="inline-search-container">
              <div className="inline-search-wrapper">
                <Search size={14} className="inline-search-icon" />
                <input
                  type="text"
                  className="inline-search-input"
                  placeholder="ค้นหาสินค้า..."
                  value={diffSearchQuery}
                  onChange={(e) => setDiffSearchQuery(e.target.value)}
                />
                {diffSearchQuery && (
                  <button
                    className="inline-search-clear"
                    onClick={() => setDiffSearchQuery('')}
                  >
                    <X size={10} color="#6b7280" />
                  </button>
                )}
              </div>
            </div>

            {filteredDiffRecords.length === 0 ? (
              <div className="empty-state">
                <Check className="empty-state-icon" />
                <div className="empty-state-title">{diffSearchQuery ? 'ไม่พบรายการที่ค้นหา' : 'ไม่มีรายการที่ต่างกัน'}</div>
                <div className="empty-state-text">{diffSearchQuery ? 'ลองค้นหาด้วยคำอื่น' : 'ยอดนับตรงกับคงเหลือในระบบ'}</div>
              </div>
            ) : (
              filteredDiffRecords.map((record) => {
                const product = getProductForRecord(record);
                const liveBalance = getLiveBalanceForRecord(record);
                const liveDiff = getLiveDiffForRecord(record);
                const diffClass = liveDiff > 0 ? 'positive' : 'negative';

                return (
                  <div key={record.id} className={`diff-card ${diffClass}`}>
                    <div className="diff-card-header">
                      <div className="diff-card-title">
                        <div className="diff-card-code">
                          <Box size={11} />
                          {product?.code || record.id_product}
                        </div>
                        <div className="diff-card-name">{record.name_product}</div>
                        <div className="diff-card-meta">
                          {new Date(record.date).toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: 'numeric' })} {new Date(record.date).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} • {record.person || '-'}
                        </div>
                      </div>
                      <div className={`diff-badge ${diffClass}`}>
                        {liveDiff > 0 ? '+' : ''}{fmtStockNumber(liveDiff)}
                      </div>
                    </div>

                    <div className="diff-metric-grid">
                      <div className="diff-metric">
                        <div className="diff-metric-label">ระบบ</div>
                        <div className="diff-metric-value">{fmtStockNumber(liveBalance)}</div>
                      </div>
                      <div className="diff-metric">
                        <div className="diff-metric-label">นับได้</div>
                        <div className="diff-metric-value">{fmtStockNumber(record.actual)}</div>
                      </div>
                      <div className="diff-metric">
                        <div className="diff-metric-label">ต่าง</div>
                        <div className="diff-metric-value" style={{ color: liveDiff > 0 ? '#147F56' : '#dc2626' }}>
                          {liveDiff > 0 ? '+' : ''}{fmtStockNumber(liveDiff)}
                        </div>
                      </div>
                    </div>

                    {canShowDiffStockActions && (
                      <div className="diff-action-row">
                        <button className="diff-action-btn lot" onClick={() => openLotSheet(record)}>
                          <Box size={16} />
                          ปรับ lot
                        </button>
                        <button className="diff-action-btn adjust" onClick={() => openAdjustSheet(record)}>
                          <RefreshCw size={16} />
                          ปรับยอด
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </>
        )}

        {activeTab === 'results' && (
          <>
            {/* Search Bar for Results Tab */}
            <div className="inline-search-container">
              <div className="inline-search-wrapper">
                <Search size={14} className="inline-search-icon" />
                <input
                  type="text"
                  className="inline-search-input"
                  placeholder="ค้นหาสินค้า..."
                  value={resultsSearchQuery}
                  onChange={(e) => setResultsSearchQuery(e.target.value)}
                />
                {resultsSearchQuery && (
                  <button
                    className="inline-search-clear"
                    onClick={() => setResultsSearchQuery('')}
                  >
                    <X size={10} color="#6b7280" />
                  </button>
                )}
              </div>
            </div>

            {filteredResultsRecords.length === 0 ? (
              <div className="empty-state">
                <FileText className="empty-state-icon" />
                <div className="empty-state-title">{resultsSearchQuery ? 'ไม่พบรายการที่ค้นหา' : 'ยังไม่มีผลการนับ'}</div>
                <div className="empty-state-text">{resultsSearchQuery ? 'ลองค้นหาด้วยคำอื่น' : 'เริ่มนับ stock เพื่อดูผลลัพธ์'}</div>
              </div>
            ) : (
              filteredResultsRecords.map((record) => (
                <div key={record.id} className={`result-card ${record.diff !== 0 ? 'has-diff' : ''}`}>
                  <div className="result-header">
                    <div>
                      <div className="product-id">{dataProduct.find(p => p.id === record.id_product)?.code || record.id_product}</div>
                      <div className="product-name">{record.name_product}</div>
                      <div style={{ fontSize: '10px', color: '#9ca3af', marginTop: '2px' }}>
                        {new Date(record.date).toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: 'numeric' })} {new Date(record.date).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} • {record.person}
                      </div>
                    </div>
                    <div className={`result-status ${record.status}`}>
                      {record.status === 'pending' ? 'Diff' : 'Complete'}
                    </div>
                  </div>
                  <div className="result-details">
                    <div className="result-detail-item">
                      <div className="result-detail-label">คงเหลือ</div>
                      <div className="result-detail-value">{record.balance}</div>
                    </div>
                    <div className="result-detail-item">
                      <div className="result-detail-label">นับได้</div>
                      <div className="result-detail-value">{record.actual}</div>
                    </div>
                    <div className="result-detail-item">
                      <div className="result-detail-label">ผลต่าง</div>
                      <div className="result-detail-value" style={{
                        color: record.diff > 0 ? '#147F56' : record.diff < 0 ? '#dc2626' : '#6b7280'
                      }}>
                        {record.diff > 0 ? '+' : ''}{record.diff}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </>
        )}

        {activeTab === 'summary' && (
          <>
            <div className="summary-grid">
              <div className="summary-card">
                <div className="summary-icon green">
                  <ClipboardList size={24} />
                </div>
                <div className="summary-value">{totalCounted}</div>
                <div className="summary-label">รายการนับทั้งหมด</div>
              </div>
              <div className="summary-card">
                <div className="summary-icon orange">
                  <AlertTriangle size={24} />
                </div>
                <div className="summary-value">{pendingCount}</div>
                <div className="summary-label">รอตรวจสอบ</div>
              </div>
              <div className="summary-card">
                <div className="summary-icon blue">
                  <Plus size={24} />
                </div>
                <div className="summary-value" style={{ color: '#2A6AAA' }}>+{totalDiffPositive}</div>
                <div className="summary-label">ผลต่างบวก</div>
              </div>
              <div className="summary-card">
                <div className="summary-icon purple">
                  <Minus size={24} />
                </div>
                <div className="summary-value" style={{ color: '#dc2626' }}>{totalDiffNegative}</div>
                <div className="summary-label">ผลต่างลบ</div>
              </div>
              <div className="summary-card full-width">
                <div className="summary-icon green">
                  <BarChart3 size={28} />
                </div>
                <div className="summary-value" style={{
                  color: (totalDiffPositive + totalDiffNegative) >= 0 ? '#147F56' : '#dc2626'
                }}>
                  {(totalDiffPositive + totalDiffNegative) >= 0 ? '+' : ''}{totalDiffPositive + totalDiffNegative}
                </div>
                <div className="summary-label">ผลต่างสุทธิ</div>
              </div>
            </div>
          </>
        )}

        {/* QR Scanner Modal */}
        {showQRScanner && (
          <div className="qr-scanner-overlay">
            <div className="qr-scanner-header">
              <div className="qr-scanner-title">สแกน QR Code</div>
              <button className="qr-close-btn" onClick={stopQRScanner}>
                <X size={24} color="white" />
              </button>
            </div>
            <div className="qr-scanner-frame">
              <Scanner
                onScan={handleScanResult}
                onError={(error) => console.log('Scanner error:', error)}
                formats={['qr_code', 'ean_13', 'ean_8', 'code_128', 'code_39', 'code_93', 'upc_a', 'upc_e']}
                paused={!showQRScanner}
                components={{
                  finder: true
                }}
                styles={{
                  container: { width: '100%', height: '100%' },
                  video: { width: '100%', height: '100%', objectFit: 'cover' }
                }}
              />
            </div>
            <div className="qr-scanner-hint">
              วางกรอบ QR Code หรือ Barcode ไว้ในกรอบ<br />
              ระบบจะสแกนอัตโนมัติ
            </div>
          </div>
        )}

        {/* Search Modal */}
        {showSearchModal && (
          <div className="search-modal-overlay" onClick={() => setShowSearchModal(false)}>
            <div className="search-modal" onClick={(e) => e.stopPropagation()}>
              <div className="search-modal-header">
                <div className="search-modal-handle"></div>
                <input
                  type="text"
                  className="search-modal-input"
                  placeholder="ค้นหาชื่อ, รหัส, Barcode สินค้า"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="search-modal-list">
                {filteredProducts.slice(0, 50).map((product) => (
                  <div
                    key={product.id}
                    className="product-search-item"
                    onClick={() => handleProductSelect(product)}
                  >
                    <div className="product-code">{product.code}</div>
                    <div className="product-details">
                      <div className="product-search-name">{product.ProductName}</div>
                      <div className="product-barcode">{product.Barcode}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {lotSheetMode && selectedDiffRecord && (
          <div className="stock-action-overlay" onClick={closeStockActionSheet}>
            <div className="stock-action-sheet" onClick={(e) => e.stopPropagation()}>
              <div className="stock-action-header">
                <div className="stock-action-handle"></div>
                <div className="stock-action-title-row">
                  <div className="stock-action-title">
                    {lotSheetMode === 'lot' ? <Box size={18} /> : <RefreshCw size={18} />}
                    {lotSheetMode === 'lot' ? 'ปรับ lot' : 'ปรับยอด'}
                  </div>
                  <button className="stock-action-close" onClick={closeStockActionSheet}>
                    <X size={18} />
                  </button>
                </div>
              </div>

              <div className="stock-action-body">
                {(() => {
                  const product = getProductForRecord(selectedDiffRecord);
                  const liveBalance = getLiveBalanceForRecord(selectedDiffRecord);
                  const liveDiff = getLiveDiffForRecord(selectedDiffRecord);

                  return (
                    <div className="stock-action-product">
                      <div className="stock-action-product-code">{product?.code || selectedDiffRecord.id_product}</div>
                      <div className="stock-action-product-name">{selectedDiffRecord.name_product}</div>
                      <div className="stock-action-stats">
                        <div className="stock-action-stat">
                          <div className="stock-action-stat-label">ระบบ</div>
                          <div className="stock-action-stat-value">{fmtStockNumber(liveBalance)}</div>
                        </div>
                        <div className="stock-action-stat">
                          <div className="stock-action-stat-label">นับได้</div>
                          <div className="stock-action-stat-value">{fmtStockNumber(selectedDiffRecord.actual)}</div>
                        </div>
                        <div className="stock-action-stat">
                          <div className="stock-action-stat-label">ต่าง</div>
                          <div className="stock-action-stat-value" style={{ color: liveDiff > 0 ? '#147F56' : '#dc2626' }}>
                            {liveDiff > 0 ? '+' : ''}{fmtStockNumber(liveDiff)}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {lotLoading ? (
                  <div className="sheet-loading">
                    <div className="loading-spinner" style={{ width: 30, height: 30, borderWidth: 3 }}></div>
                    <div>กำลังโหลดข้อมูล Lot...</div>
                  </div>
                ) : lotSheetMode === 'lot' ? (
                  <>
                    <div className="sheet-section-title">แก้ไข Lot / วันหมดอายุ / ยอดคงเหลือ</div>
                    {(stockSummary?.lots || []).length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '24px 0', color: '#94a3b8', fontSize: 13 }}>ไม่มีข้อมูล Lot</div>
                    ) : (
                      (stockSummary?.lots || []).map((lot, index) => {
                        const values = lotEditValues[lot.id] || { lot: '', dateExp: '', balance: '', dateRC: '' };
                        return (
                          <div key={lot.id} className="lot-edit-card">
                            <div className="lot-edit-head">
                              <div className="lot-edit-title">Lot {index + 1}: {lot.lot || '-'}</div>
                              <div className="lot-calc-pill">คำนวณ {fmtStockNumber(lot.balance || 0)}</div>
                            </div>
                            <div className="lot-field-grid">
                              <label className="sheet-field">
                                Lot
                                <input
                                  className="sheet-input"
                                  value={values.lot}
                                  onChange={(e) => updateLotEditValue(lot.id, 'lot', e.target.value)}
                                  placeholder="Lot"
                                />
                              </label>
                              <label className="sheet-field">
                                วันหมดอายุ
                                <input
                                  type="date"
                                  className="sheet-input"
                                  value={values.dateExp}
                                  onChange={(e) => updateLotEditValue(lot.id, 'dateExp', e.target.value)}
                                />
                              </label>
                              <label className="sheet-field">
                                ยอดคงเหลือ
                                <input
                                  type="number"
                                  inputMode="decimal"
                                  className="sheet-input"
                                  value={values.balance}
                                  onChange={(e) => updateLotEditValue(lot.id, 'balance', e.target.value)}
                                  placeholder="0"
                                />
                              </label>
                              <label className="sheet-field">
                                วันที่รับ
                                <input
                                  type="date"
                                  className="sheet-input"
                                  value={values.dateRC}
                                  onChange={(e) => updateLotEditValue(lot.id, 'dateRC', e.target.value)}
                                />
                              </label>
                            </div>
                            {lot.rawBalance !== undefined && lot.rawBalance !== null && Number(lot.rawBalance) !== Number(lot.balance || 0) && (
                              <div className="lot-sync-note">
                                ยอดบันทึกเดิม {fmtStockNumber(lot.rawBalance)} / ยอดคำนวณ {fmtStockNumber(lot.balance || 0)}
                              </div>
                            )}
                            <button
                              className="lot-save-btn"
                              onClick={() => saveLotEdit(lot)}
                              disabled={lotSavingId === lot.id}
                            >
                              <Check size={16} />
                              {lotSavingId === lot.id ? 'กำลังบันทึก...' : 'บันทึก Lot นี้'}
                            </button>
                          </div>
                        );
                      })
                    )}
                  </>
                ) : (
                  <>
                    <div className="sheet-section-title">เลือกวิธีปรับยอดสินค้า</div>
                    <div className="adjust-type-toggle">
                      <button
                        className={`adjust-type-option ${adjustType === 'increase' ? 'active increase' : ''}`}
                        onClick={() => setAdjustType('increase')}
                      >
                        <Plus size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                        เพิ่มยอด
                      </button>
                      <button
                        className={`adjust-type-option ${adjustType === 'decrease' ? 'active decrease' : ''}`}
                        onClick={() => setAdjustType('decrease')}
                      >
                        <Minus size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                        ลดยอด
                      </button>
                    </div>

                    {isLotRequired(stockSummary) ? (
                      <label className="sheet-field" style={{ marginBottom: 10 }}>
                        เลือก Lot
                        <select className="sheet-select" value={adjustLotId} onChange={(e) => setAdjustLotId(e.target.value)}>
                          <option value="">เลือก Lot</option>
                          {(stockSummary?.lots || []).map((lot) => (
                            <option key={lot.id} value={String(lot.id)}>
                              {lot.lot || '-'} | คงเหลือ {fmtStockNumber(lot.balance || 0)}
                            </option>
                          ))}
                        </select>
                      </label>
                    ) : (
                      <div style={{
                        marginBottom: 10, padding: '9px 12px', borderRadius: 10,
                        background: '#fffbeb', border: '1px solid #fcd34d', color: '#b45309', fontSize: 12
                      }}>
                        🏷️ {NO_LOT_LABEL} — ระบุแค่จำนวน ระบบจะเลือกล็อตให้อัตโนมัติ
                        <div style={{ fontSize: 11, color: '#92400e', marginTop: 2 }}>
                          คงเหลือรวม {fmtStockNumber(stockSummary?.calculatedBalance || 0)}
                        </div>
                      </div>
                    )}

                    <label className="sheet-field" style={{ marginBottom: 10 }}>
                      จำนวนที่ต้องการ{adjustType === 'increase' ? 'เพิ่ม' : 'ลด'}
                      <input
                        type="number"
                        inputMode="decimal"
                        min="0"
                        className="sheet-input"
                        value={adjustQty}
                        onChange={(e) => setAdjustQty(e.target.value)}
                        placeholder="0"
                      />
                    </label>

                    <label className="sheet-field" style={{ marginBottom: 10 }}>
                      เหตุผลหลัก
                      <select
                        className="sheet-select"
                        value={adjustReasonMain}
                        onChange={(e) => setAdjustReasonMain(e.target.value)}
                      >
                        <option value="">เลือกเหตุผลหลัก</option>
                        {STOCK_ADJUST_REASON_OPTIONS.map((option) => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    </label>

                    <label className="sheet-field">
                      รายละเอียดเพิ่มเติม
                      <textarea
                        className="sheet-textarea"
                        value={adjustReason}
                        onChange={(e) => setAdjustReason(e.target.value)}
                        placeholder="ระบุรายละเอียดเพิ่มเติม"
                      />
                    </label>

                    {(isLotRequired(stockSummary) ? !!adjustLotId : true) && adjustQty && Number(adjustQty) > 0 && (() => {
                      const requireLot = isLotRequired(stockSummary);
                      const selectedLot = requireLot
                        ? (stockSummary?.lots || []).find(lot => String(lot.id) === adjustLotId)
                        : null;
                      if (requireLot && !selectedLot) return null;
                      // สินค้าไม่ใช้ lot — ตัวอย่างผลลัพธ์อ้างยอดรวมของสินค้า ไม่ใช่ยอดราย lot
                      const before = requireLot
                        ? Number(selectedLot?.balance || 0)
                        : Number(stockSummary?.calculatedBalance || 0);
                      const change = adjustType === 'decrease' ? -Number(adjustQty) : Number(adjustQty);
                      const after = before + change;
                      return (
                        <div className="adjust-preview">
                          <div className="adjust-preview-row">
                            <div>
                              <div className="adjust-preview-label">ก่อนปรับ</div>
                              <div className="adjust-preview-value">{fmtStockNumber(before)}</div>
                            </div>
                            <div style={{ color: adjustType === 'increase' ? '#147F56' : '#dc2626', fontWeight: 900 }}>→</div>
                            <div>
                              <div className="adjust-preview-label">หลังปรับ</div>
                              <div className="adjust-preview-value" style={{ color: after >= 0 ? '#147F56' : '#dc2626' }}>
                                {fmtStockNumber(after)}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {adjustError && <div className="sheet-error">{adjustError}</div>}

                    <button
                      className="sheet-primary-btn"
                      onClick={handleAdjustSubmit}
                      disabled={adjustSubmitting || !adjustQty || !adjustReasonMain || (isLotRequired(stockSummary) && !adjustLotId)}
                    >
                      <Check size={16} />
                      {adjustSubmitting ? 'กำลังปรับยอด...' : 'ยืนยันปรับยอด'}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Toast */}
        {toast && <div className="toast">{toast}</div>}

        {/* Bottom Navigation */}
        <div className="bottom-nav">
          {isNavVisible('P1') && <div
            className={`nav-item ${activeNavTab === 'home' ? 'active' : ''}`}
            onClick={() => handleNavigation('home')}
          >
            <Home size={20} />
            <span>หน้าหลัก</span>
          </div>}
          {isNavVisible('P2') && <div
            className={`nav-item ${activeNavTab === 'checkin' ? 'active' : ''}`}
            onClick={() => handleNavigation('checkin')}
          >
            <LogIn size={20} />
            <span>เข้างาน</span>
          </div>}
          {isNavVisible('P3') && <div
            className={`nav-item ${activeNavTab === 'sale' ? 'active' : ''}`}
            onClick={() => handleNavigation('sale')}
          >
            <ShoppingCart size={20} />
            <span>ขาย</span>
          </div>}
          {isNavVisible('P4') && <div
            className={`nav-item ${activeNavTab === 'pickup' ? 'active' : ''}`}
            onClick={() => handleNavigation('pickup')}
          >
            <DollarSign size={20} />
            <span>ค่าหยิบ</span>
          </div>}
          {/* {isNavVisible('P5') && <div
            className={`nav-item ${activeNavTab === 'product' ? 'active' : ''}`}
            onClick={() => handleNavigation('product')}
          >
            <Box size={20} />
            <span>สินค้า</span>
          </div>} */}
          {isNavVisible('P6') && <div
            className={`nav-item ${activeNavTab === 'count' ? 'active' : ''}`}
            onClick={() => handleNavigation('count')}
          >
            <ClipboardList size={20} />
            <span>นับสินค้า</span>
          </div>}
          {isNavVisible('P7') && <div
            className={`nav-item ${activeNavTab === 'receive' ? 'active' : ''}`}
            onClick={() => handleNavigation('receive')}
          >
            <PackagePlus size={20} />
            <span>รับ</span>
          </div>}
          <div
            className={`nav-item ${activeNavTab === 'voice' ? 'active' : ''}`}
            onClick={() => handleNavigation('voice')}
          >
            <MessageSquare size={20} />
            <span>สื่อสาร</span>
          </div>

        </div>
      </div>
    </>
  );
}

export default MobileStockPage;