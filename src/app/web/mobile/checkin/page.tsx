'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Home, ShoppingCart, DollarSign, Box, ClipboardList, LogIn,
  Settings, MapPin, Clock, CheckCircle, XCircle, AlertTriangle,
  ChevronLeft, ChevronRight, Calendar, User, X, RefreshCw, PackagePlus, MessageSquare
} from "lucide-react"
import { useNavLevel } from '../useNavLevel'
import axios from 'axios'
import { toThaiDateString } from '@/utils/dateUtils'
import Webcam from 'react-webcam'
import { FaceLandmarker, ImageEmbedder, FilesetResolver } from "@mediapipe/tasks-vision";
import { jwtDecode } from 'jwt-decode';

const MEDIAPIPE_VERSION = '0.10.22-rc.20250304';
const MEDIAPIPE_WASM_BASE = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MEDIAPIPE_VERSION}/wasm`;
const FACE_LANDMARKER_MODEL = 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task';
const IMAGE_EMBEDDER_MODEL = 'https://storage.googleapis.com/mediapipe-models/image_embedder/mobilenet_v3_small/float32/1/mobilenet_v3_small.tflite';
const FACE_DESCRIPTOR_MIN_LENGTH = 16;

type MobileTokenPayload = {
  id?: number | string;
  company?: string;
  level?: string;
  idcompany?: number | string;
};

type MediaPipeDelegate = 'GPU' | 'CPU';
type CameraProfile = 'desktop' | 'ios' | 'basic';
type MediaPipeEmbedding = {
  floatEmbedding?: ArrayLike<number>;
  quantizedEmbedding?: ArrayLike<number>;
};

const isIOSLikeBrowser = () => {
  if (typeof navigator === 'undefined') return false;
  const userAgent = navigator.userAgent || '';
  const platform = navigator.platform || '';
  return /iPad|iPhone|iPod/i.test(userAgent) || (platform === 'MacIntel' && navigator.maxTouchPoints > 1);
};

const isInAppBrowser = () => {
  if (typeof navigator === 'undefined') return false;
  return /(Line|FBAN|FBAV|Instagram|CriOS|FxiOS)/i.test(navigator.userAgent || '');
};

const getMediaPipeDelegateOrder = (): MediaPipeDelegate[] => (
  isIOSLikeBrowser() || isInAppBrowser() ? ['CPU', 'GPU'] : ['GPU', 'CPU']
);

const getInitialCameraProfile = (): CameraProfile => (isIOSLikeBrowser() ? 'ios' : 'desktop');

const getNextCameraProfile = (profile: CameraProfile): CameraProfile | null => {
  if (profile === 'desktop') return 'ios';
  if (profile === 'ios') return 'basic';
  return null;
};

const getCameraConstraints = (profile: CameraProfile): MediaTrackConstraints => {
  if (profile === 'desktop') {
    return {
      facingMode: { ideal: 'user' },
      width: { ideal: 640 },
      height: { ideal: 480 },
      frameRate: { ideal: 24 }
    };
  }

  if (profile === 'ios') return { facingMode: 'user' };
  return {};
};

const extractEmbeddingVector = (embedding?: MediaPipeEmbedding): number[] => {
  const floatEmbedding = embedding?.floatEmbedding ? Array.from(embedding.floatEmbedding) : [];
  if (floatEmbedding.length > 0) return floatEmbedding;

  const quantizedEmbedding = embedding?.quantizedEmbedding ? Array.from(embedding.quantizedEmbedding) : [];
  if (quantizedEmbedding.length === 0) return [];

  const hasSignedValues = quantizedEmbedding.some(value => value < 0);
  return quantizedEmbedding.map(value => hasSignedValues ? value / 128 : (value - 128) / 128);
};

const createWithDelegateFallback = async <T,>(
  label: string,
  factory: (delegate: MediaPipeDelegate) => Promise<T>,
  delegates: MediaPipeDelegate[] = getMediaPipeDelegateOrder()
): Promise<T> => {
  let lastError: unknown;
  for (const delegate of delegates) {
    try {
      return await factory(delegate);
    } catch (error) {
      lastError = error;
      console.warn(`${label} failed with ${delegate} delegate`, error);
    }
  }
  throw lastError instanceof Error ? lastError : new Error(`${label} failed to initialize`);
};

// Mobile Check-in Styles
const mobileCheckinStyles = `
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

  .mobile-checkin-app {
    font-family: 'Kanit', sans-serif;
    background: linear-gradient(180deg, #ecfeff 0%, #F3F8FC 50%, #f8fafc 100%);
    min-height: 100vh;
    max-width: 100vw;
    overflow-x: hidden;
    padding-bottom: 90px;
  }

  /* Header */
  .checkin-header {
    background: linear-gradient(135deg, #0891b2 0%, #0e7490 50%, #155e75 100%);
    padding: 16px 16px 24px;
    border-radius: 0 0 28px 28px;
    position: sticky;
    top: 0;
    z-index: 100;
    box-shadow: 0 4px 24px rgba(8, 145, 178, 0.35);
  }

  .header-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
  }

  .header-title {
    color: white;
    font-size: 22px;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .settings-btn {
    width: 44px;
    height: 44px;
    border-radius: 14px;
    background: rgba(255,255,255,0.2);
    backdrop-filter: blur(10px);
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .settings-btn:active {
    transform: scale(0.95);
    background: rgba(255,255,255,0.3);
  }

  .header-date {
    color: rgba(255,255,255,0.85);
    font-size: 14px;
    text-align: center;
  }

  /* GPS Status Card */
  .gps-status-card {
    margin: 10px 16px;
    background: white;
    border-radius: 16px;
    padding: 10px 12px;
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
    border: 1px solid rgba(8, 145, 178, 0.1);
  }

  .gps-status-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 6px;
  }

  .gps-icon {
    width: 30px;
    height: 30px;
    border-radius: 9px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .gps-icon.in-range {
    background: linear-gradient(135deg, #3E86C7, #2A6AAA);
  }

  .gps-icon.out-range {
    background: linear-gradient(135deg, #ef4444, #dc2626);
  }

  .gps-icon.loading {
    background: linear-gradient(135deg, #f59e0b, #d97706);
  }

  .gps-title {
    font-size: 14px;
    font-weight: 600;
    color: #1f2937;
    line-height: 1.2;
  }

  .gps-subtitle {
    font-size: 11px;
    color: #6b7280;
    line-height: 1.2;
  }

  .gps-distance {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 6px 10px;
    background: #f8fafc;
    border-radius: 10px;
    margin-top: 5px;
  }

  .distance-value {
    font-size: 17px;
    font-weight: 700;
    color: #0891b2;
  }

  .distance-unit {
    font-size: 12px;
    color: #6b7280;
  }

  /* Big Check-in Button */
  .checkin-button-container {
    display: flex;
    justify-content: center;
    gap: 20px;
    padding: 20px 16px 30px;
    flex-wrap: wrap;
  }

  .checkin-button {
    width: 150px;
    height: 150px;
    border-radius: 50%;
    border: none;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 6px;
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
  }

  .checkin-button.checkin {
    background: linear-gradient(145deg, #3E86C7 0%, #2A6AAA 100%);
    box-shadow: 0 8px 32px rgba(62, 134, 199, 0.4), inset 0 2px 4px rgba(255,255,255,0.2);
  }

  .checkin-button.checkout {
    background: linear-gradient(145deg, #f97316 0%, #ea580c 100%);
    box-shadow: 0 8px 32px rgba(249, 115, 22, 0.4), inset 0 2px 4px rgba(255,255,255,0.2);
  }

  .checkin-button.disabled {
    background: linear-gradient(145deg, #9ca3af 0%, #6b7280 100%);
    box-shadow: 0 8px 32px rgba(107, 114, 128, 0.3);
    cursor: not-allowed;
  }

  .checkin-button:active:not(.disabled) {
    transform: scale(0.95);
  }

  .checkin-button::before {
    content: '';
    position: absolute;
    inset: 6px;
    border-radius: 50%;
    border: 3px solid rgba(255,255,255,0.3);
  }

  .checkin-button-time {
    font-size: 24px;
    font-weight: 600;
    color: white;
  }

  .checkin-button-text {
    font-size: 14px;
    font-weight: 600;
    color: white;
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  /* Today Status */
  .today-status-card {
    margin: 0 16px 16px;
    background: white;
    border-radius: 20px;
    padding: 18px;
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
    border: 1px solid rgba(8, 145, 178, 0.1);
  }

  .today-title {
    font-size: 15px;
    font-weight: 600;
    color: #1f2937;
    margin-bottom: 12px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .today-times {
    display: flex;
    gap: 16px;
  }

  .time-item {
    flex: 1;
    text-align: center;
    padding: 14px;
    border-radius: 14px;
    background: #f8fafc;
  }

  .time-item.checkin {
    background: linear-gradient(135deg, #F3F8FC, #E5EEF8);
    border: 1px solid #A6C8E7;
  }

  .time-item.checkout {
    background: linear-gradient(135deg, #fff7ed, #ffedd5);
    border: 1px solid #fdba74;
  }

  .time-label {
    font-size: 12px;
    color: #6b7280;
    margin-bottom: 4px;
  }

  .time-value {
    font-size: 22px;
    font-weight: 600;
    color: #1f2937;
  }

  /* Monthly History */
  .history-card {
    margin: 0 16px 16px;
    background: white;
    border-radius: 20px;
    padding: 18px;
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
    border: 1px solid rgba(8, 145, 178, 0.1);
  }

  .history-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
  }

  .history-title {
    font-size: 15px;
    font-weight: 600;
    color: #1f2937;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .month-nav {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .month-nav-btn {
    width: 32px;
    height: 32px;
    border-radius: 10px;
    border: 1px solid #e5e7eb;
    background: white;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s;
  }

  .month-nav-btn:active {
    background: #f3f4f6;
  }

  .month-name {
    font-size: 14px;
    font-weight: 500;
    color: #374151;
    min-width: 120px;
    text-align: center;
  }

  /* History Table */
  .history-table {
    width: 100%;
    border-collapse: collapse;
  }

  .history-table th {
    font-size: 12px;
    font-weight: 600;
    color: #6b7280;
    padding: 10px 6px;
    text-align: center;
    background: #f8fafc;
    border-bottom: 1px solid #e5e7eb;
  }

  .history-table th:first-child {
    border-radius: 10px 0 0 0;
  }

  .history-table th:last-child {
    border-radius: 0 10px 0 0;
  }

  .history-table td {
    font-size: 13px;
    color: #374151;
    padding: 12px 6px;
    text-align: center;
    border-bottom: 1px solid #f3f4f6;
  }

  .history-table tr:last-child td {
    border-bottom: none;
  }

  .status-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border-radius: 8px;
  }

  .status-badge.approved {
    background: #E5EEF8;
    color: #2A6AAA;
  }

  .status-badge.pending {
    background: #fef3c7;
    color: #d97706;
  }

  .status-badge.rejected {
    background: #fee2e2;
    color: #dc2626;
  }

  /* Settings Modal */
  .modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.6);
    z-index: 1000;
    display: flex;
    align-items: flex-end;
    justify-content: center;
    animation: fadeIn 0.2s ease;
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  .settings-modal {
    width: 100%;
    max-width: 500px;
    background: white;
    border-radius: 24px 24px 0 0;
    padding: 20px;
    animation: slideUp 0.3s ease;
    max-height: 80vh;
    overflow-y: auto;
  }

  @keyframes slideUp {
    from { transform: translateY(100%); }
    to { transform: translateY(0); }
  }

  .modal-handle {
    width: 40px;
    height: 4px;
    background: #e5e7eb;
    border-radius: 2px;
    margin: 0 auto 16px;
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }

  .modal-title {
    font-size: 18px;
    font-weight: 600;
    color: #1f2937;
  }

  .modal-close {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    border: none;
    background: #f3f4f6;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }

  .setting-item {
    margin-bottom: 20px;
  }

  .setting-label {
    font-size: 14px;
    font-weight: 500;
    color: #374151;
    margin-bottom: 8px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .setting-input {
    width: 100%;
    padding: 14px 16px;
    border: 2px solid #e5e7eb;
    border-radius: 12px;
    font-size: 15px;
    font-family: 'Kanit', sans-serif;
    outline: none;
    transition: border-color 0.2s;
  }

  .setting-input:focus {
    border-color: #0891b2;
  }

  .radius-slider-container {
    padding: 10px 0;
  }

  .radius-display {
    text-align: center;
    font-size: 24px;
    font-weight: 600;
    color: #0891b2;
    margin-bottom: 10px;
  }

  .radius-slider {
    width: 100%;
    height: 8px;
    -webkit-appearance: none;
    appearance: none;
    background: linear-gradient(to right, #0891b2, #22d3ee);
    border-radius: 4px;
    outline: none;
  }

  .radius-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: white;
    border: 3px solid #0891b2;
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  }

  .save-settings-btn {
    width: 100%;
    padding: 16px;
    background: linear-gradient(135deg, #0891b2, #0e7490);
    border: none;
    border-radius: 14px;
    color: white;
    font-size: 16px;
    font-weight: 600;
    font-family: 'Kanit', sans-serif;
    cursor: pointer;
    transition: all 0.2s;
    margin-top: 10px;
  }

  .save-settings-btn:active {
    transform: scale(0.98);
  }

  /* Alert Toast */
  .alert-toast {
    position: fixed;
    top: 100px;
    left: 16px;
    right: 16px;
    padding: 16px;
    border-radius: 14px;
    display: flex;
    align-items: center;
    gap: 12px;
    z-index: 2000;
    animation: slideDown 0.3s ease;
  }

  @keyframes slideDown {
    from { transform: translateY(-100%); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }

  .alert-toast.error {
    background: linear-gradient(135deg, #fee2e2, #fecaca);
    border: 1px solid #fca5a5;
  }

  .alert-toast.success {
    background: linear-gradient(135deg, #E5EEF8, #CCDFF1);
    border: 1px solid #A6C8E7;
  }

  .alert-toast.info {
    background: linear-gradient(135deg, #E5EEF8, #CCDFF1);
    border: 1px solid #A6C8E7;
  }

  .alert-text {
    flex: 1;
    font-size: 14px;
    color: #1f2937;
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
    color: #0891b2;
  }

  /* Loading */
  .loading-overlay {
    position: fixed;
    inset: 0;
    background: linear-gradient(180deg, #ecfeff 0%, #f8fafc 100%);
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
    border-top-color: #0891b2;
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
    padding: 30px 20px;
    color: #9ca3af;
  }

  .empty-state-icon {
    margin-bottom: 10px;
    opacity: 0.5;
  }

  /* GPS Data Display Card */
  .gps-data-card {
    background: linear-gradient(135deg, #F3F8FC, #E5EEF8);
    border: 1px solid #A6C8E7;
    border-radius: 14px;
    padding: 16px;
    margin-bottom: 20px;
  }

  .gps-data-title {
    font-size: 14px;
    font-weight: 600;
    color: #1E5088;
    margin-bottom: 12px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .gps-data-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }

  .gps-data-item {
    background: white;
    padding: 10px 12px;
    border-radius: 10px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.08);
  }

  .gps-data-item.full-width {
    grid-column: 1 / -1;
  }

  .gps-data-label {
    font-size: 11px;
    color: #6b7280;
    margin-bottom: 4px;
  }

  .gps-data-value {
    font-size: 14px;
    font-weight: 600;
    color: #1f2937;
    word-break: break-all;
  }

  .gps-data-value.highlight {
    color: #0891b2;
  }

  .no-data-msg {
    text-align: center;
    padding: 20px;
    color: #9ca3af;
    font-size: 13px;
  }
  /* Face Scan Modal */
  .face-scan-modal {
    width: 90%;
    max-width: 400px;
    background: white;
    border-radius: 24px;
    padding: 24px;
    position: relative;
    box-shadow: 0 10px 40px rgba(0,0,0,0.3);
    text-align: center;
  }

  .webcam-container {
    width: 100%;
    aspect-ratio: 3/4;
    background: #000;
    border-radius: 16px;
    overflow: hidden;
    position: relative;
    margin: 16px 0;
    border: 4px solid #f3f4f6;
  }

  .webcam-overlay {
    position: absolute;
    inset: 0;
    border: 2px dashed rgba(255,255,255,0.5);
    border-radius: 16px;
    pointer-events: none;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .face-indicator {
    width: 200px;
    height: 250px;
    border: 2px solid #3E86C7;
    border-radius: 50% 50% 45% 45%;
    box-shadow: 0 0 0 1000px rgba(0,0,0,0.3);
  }

  .scan-btn {
    width: 100%;
    padding: 14px;
    background: linear-gradient(135deg, #0891b2, #0e7490);
    border: none;
    border-radius: 12px;
    color: white;
    font-weight: 600;
    font-family: 'Kanit', sans-serif;
    cursor: pointer;
    margin-top: 12px;
  }

  .scanning-loader {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    color: white;
    font-size: 14px;
    background: rgba(0,0,0,0.6);
    padding: 8px 16px;
    border-radius: 20px;
    backdrop-filter: blur(4px);
  }

  .similarity-badge {
    position: absolute;
    top: 16px;
    right: 16px;
    background: rgba(0,0,0,0.6);
    color: white;
    padding: 4px 10px;
    border-radius: 10px;
    font-size: 12px;
    backdrop-filter: blur(4px);
    border: 1px solid rgba(255,255,255,0.2);
    display: flex;
    align-items: center;
    gap: 4px;
    z-index: 10;
  }

  .similarity-bar {
    position: absolute;
    bottom: 0;
    left: 0;
    height: 4px;
    background: #3E86C7;
    transition: width 0.3s ease;
  }

  /* Leave Statistics */
  .leave-card {
    margin: 0 16px 16px;
    background: white;
    border-radius: 20px;
    padding: 16px;
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
    border: 1px solid rgba(8, 145, 178, 0.1);
  }

  .leave-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }

  .leave-title {
    font-size: 15px;
    font-weight: 600;
    color: #1f2937;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .leave-actions {
    display: flex;
    gap: 6px;
  }

  .leave-action-btn {
    padding: 6px 10px;
    border-radius: 10px;
    border: 1px solid #e5e7eb;
    background: white;
    font-family: 'Kanit', sans-serif;
    font-size: 11px;
    font-weight: 500;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 4px;
    transition: all 0.2s;
  }

  .leave-action-btn:active {
    transform: scale(0.96);
  }

  .leave-action-btn.add {
    color: #6366f1;
    border-color: #c7d2fe;
    background: #eef2ff;
  }

  .leave-action-btn.settings {
    color: #b45309;
    border-color: #fde68a;
    background: #fffbeb;
  }

  .leave-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }

  .leave-stat-item {
    border-radius: 14px;
    padding: 10px 12px;
    position: relative;
    overflow: hidden;
  }

  .leave-stat-item.vacation { background: linear-gradient(135deg, #F3F8FC, #E5EEF8); border: 1px solid #CCDFF1; }
  .leave-stat-item.personal { background: linear-gradient(135deg, #fefce8, #fef9c3); border: 1px solid #fde68a; }
  .leave-stat-item.sick { background: linear-gradient(135deg, #fef2f2, #fecaca); border: 1px solid #fca5a5; }
  .leave-stat-item.late { background: linear-gradient(135deg, #fdf4ff, #f5d0fe); border: 1px solid #e9d5ff; }

  .leave-stat-label {
    font-size: 12px;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 5px;
    margin-bottom: 6px;
  }

  .leave-stat-nums {
    display: flex;
    justify-content: space-between;
    gap: 2px;
  }

  .leave-num-box {
    text-align: center;
    flex: 1;
  }

  .leave-num-val {
    font-size: 18px;
    font-weight: 700;
    line-height: 1.2;
  }

  .leave-num-lbl {
    font-size: 9px;
    color: #64748b;
  }

  .leave-progress {
    margin-top: 6px;
    height: 4px;
    background: rgba(0,0,0,0.08);
    border-radius: 2px;
    overflow: hidden;
  }

  .leave-progress-bar {
    height: 100%;
    border-radius: 2px;
    transition: width 0.4s ease;
  }

  /* Leave Records List */
  .leave-records-list {
    margin-top: 10px;
    border-top: 1px solid #f1f5f9;
    padding-top: 8px;
  }

  .leave-record-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 6px 0;
    border-bottom: 1px solid #f8fafc;
  }

  .leave-record-info {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 1;
  }

  .leave-type-badge {
    font-size: 10px;
    padding: 2px 8px;
    border-radius: 8px;
    font-weight: 500;
    white-space: nowrap;
  }

  .leave-type-badge.vacation { background: #E5EEF8; color: #1E5088; }
  .leave-type-badge.personal { background: #fef9c3; color: #b45309; }
  .leave-type-badge.sick { background: #fee2e2; color: #dc2626; }

  .leave-record-date {
    font-size: 12px;
    color: #475569;
  }

  .leave-record-reason {
    font-size: 11px;
    color: #94a3b8;
    max-width: 80px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .leave-del-btn {
    background: none;
    border: none;
    color: #ef4444;
    cursor: pointer;
    padding: 4px;
    border-radius: 6px;
    display: flex;
    align-items: center;
  }

  .leave-del-btn:active {
    background: #fee2e2;
  }

  /* Leave Modal (bottom sheet) */
  .leave-modal-body {
    width: 100%;
    max-width: 500px;
    background: white;
    border-radius: 24px 24px 0 0;
    padding: 20px;
    animation: slideUp 0.3s ease;
    max-height: 85vh;
    overflow-y: auto;
  }

  .leave-form-group {
    margin-bottom: 14px;
  }

  .leave-form-label {
    font-size: 13px;
    font-weight: 500;
    color: #374151;
    margin-bottom: 6px;
    display: block;
  }

  .leave-form-select,
  .leave-form-input {
    width: 100%;
    padding: 12px 14px;
    border: 2px solid #e5e7eb;
    border-radius: 12px;
    font-size: 14px;
    font-family: 'Kanit', sans-serif;
    outline: none;
    transition: border-color 0.2s;
    background: white;
  }

  .leave-form-select:focus,
  .leave-form-input:focus {
    border-color: #6366f1;
  }

  .leave-save-btn {
    width: 100%;
    padding: 14px;
    background: linear-gradient(135deg, #6366f1, #4f46e5);
    border: none;
    border-radius: 14px;
    color: white;
    font-size: 15px;
    font-weight: 600;
    font-family: 'Kanit', sans-serif;
    cursor: pointer;
    margin-top: 8px;
    transition: all 0.2s;
  }

  .leave-save-btn:active {
    transform: scale(0.98);
  }

  .leave-save-btn:disabled {
    opacity: 0.5;
  }

  .leave-settings-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 0;
    border-bottom: 1px solid #f1f5f9;
  }

  .leave-settings-label {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    color: #334155;
  }

  .leave-settings-input {
    width: 70px;
    padding: 8px;
    border: 2px solid #e5e7eb;
    border-radius: 10px;
    text-align: center;
    font-size: 15px;
    font-weight: 600;
    font-family: 'Kanit', sans-serif;
    outline: none;
  }

  .leave-settings-input:focus {
    border-color: #6366f1;
  }

  /* OT Request */
  .ot-request-card {
    margin: 0 16px 16px;
    background: white;
    border-radius: 20px;
    padding: 16px;
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
    border: 1px solid rgba(234, 88, 12, 0.15);
  }

  .ot-request-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }

  .ot-request-title {
    font-size: 15px;
    font-weight: 600;
    color: #1f2937;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .ot-request-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 20px;
    border-radius: 14px;
    border: none;
    background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
    color: white;
    font-family: 'Kanit', sans-serif;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 4px 16px rgba(249, 115, 22, 0.3);
    width: 100%;
    justify-content: center;
  }

  .ot-request-btn:active {
    transform: scale(0.97);
    box-shadow: 0 2px 8px rgba(249, 115, 22, 0.2);
  }

  .ot-request-btn svg {
    flex-shrink: 0;
  }

  .ot-records-list {
    margin-top: 10px;
    border-top: 1px solid #f1f5f9;
    padding-top: 8px;
  }

  .ot-record-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 0;
    border-bottom: 1px solid #f8fafc;
  }

  .ot-record-info {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 1;
    flex-wrap: wrap;
  }

  .ot-date-badge {
    font-size: 11px;
    padding: 2px 8px;
    border-radius: 8px;
    font-weight: 500;
    background: #fff7ed;
    color: #c2410c;
    border: 1px solid #fed7aa;
  }

  .ot-time-text {
    font-size: 11px;
    color: #64748b;
  }

  .ot-hours-badge {
    font-size: 10px;
    padding: 2px 6px;
    border-radius: 6px;
    font-weight: 600;
    background: linear-gradient(135deg, #fef3c7, #fde68a);
    color: #92400e;
  }

  .ot-status-badge {
    font-size: 9px;
    padding: 2px 8px;
    border-radius: 6px;
    font-weight: 500;
  }

  .ot-status-badge.pending {
    background: #fef3c7;
    color: #b45309;
  }

  .ot-status-badge.approved {
    background: #E5EEF8;
    color: #2A6AAA;
  }

  .ot-status-badge.rejected {
    background: #fee2e2;
    color: #dc2626;
  }

  .ot-form-group {
    margin-bottom: 14px;
  }

  .ot-form-label {
    font-size: 13px;
    font-weight: 500;
    color: #374151;
    margin-bottom: 6px;
    display: block;
  }

  .ot-form-input {
    width: 100%;
    padding: 12px 14px;
    border: 2px solid #e5e7eb;
    border-radius: 12px;
    font-size: 14px;
    font-family: 'Kanit', sans-serif;
    outline: none;
    transition: border-color 0.2s;
    background: white;
  }

  .ot-form-input:focus {
    border-color: #f97316;
  }

  .ot-time-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }

  .ot-hours-display {
    text-align: center;
    padding: 12px;
    background: linear-gradient(135deg, #fff7ed, #ffedd5);
    border: 1px solid #fed7aa;
    border-radius: 12px;
    margin-bottom: 14px;
  }

  .ot-hours-value {
    font-size: 28px;
    font-weight: 700;
    color: #ea580c;
  }

  .ot-hours-label {
    font-size: 12px;
    color: #9a3412;
  }

  .ot-save-btn {
    width: 100%;
    padding: 14px;
    background: linear-gradient(135deg, #f97316, #ea580c);
    border: none;
    border-radius: 14px;
    color: white;
    font-size: 15px;
    font-weight: 600;
    font-family: 'Kanit', sans-serif;
    cursor: pointer;
    margin-top: 8px;
    transition: all 0.2s;
    box-shadow: 0 4px 16px rgba(249, 115, 22, 0.25);
  }

  .ot-save-btn:active {
    transform: scale(0.98);
  }

  .ot-save-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .ot-del-btn {
    background: none;
    border: none;
    color: #ef4444;
    cursor: pointer;
    padding: 4px;
    border-radius: 6px;
    display: flex;
    align-items: center;
  }

  .ot-del-btn:active {
    background: #fee2e2;
  }

  .ot-summary-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 14px;
    background: linear-gradient(135deg, #fff7ed, #ffedd5);
    border: 1px solid #fed7aa;
    border-radius: 12px;
    margin-bottom: 10px;
  }

  .ot-summary-label {
    font-size: 12px;
    color: #9a3412;
    font-weight: 500;
  }

  .ot-summary-value {
    font-size: 18px;
    font-weight: 700;
    color: #ea580c;
  }
`;

// Thai month names
const thaiMonths = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

interface CheckinRecord {
  id: number;
  company: string;
  personId: number;
  person: string;
  status: string;
  checkin: string | null;
  checkout: string | null;
  checkinLat: number | null;
  checkinLng: number | null;
  checkoutLat: number | null;
  checkoutLng: number | null;
  gpsRadius: number | null;
  targetLat: number | null;
  targetLng: number | null;
  approve: string;
  approveDate: string | null;
  approvePerson: string;
  remark: string;
}

interface GPSSettings {
  id?: number;
  names?: string;
  radius: number;
  latitude: number;
  longitude: number;
}

interface WorkShift { id: string; name: string; start: string; end: string }

// remark ที่ผูกกับกะ
const remarkOfShift = (s: WorkShift | null | undefined) => (s ? `กะ${s.name}` : '');

// หากะปัจจุบันจากเวลา (รองรับกะข้ามคืน เช่น 22:00-07:00)
const detectShiftByTime = (list: WorkShift[], now: Date): WorkShift | null => {
  if (!list || list.length === 0) return null;
  const cur = now.getHours() * 60 + now.getMinutes();
  const toMin = (hhmm: string) => {
    const [h, m] = String(hhmm || '').split(':').map((n) => parseInt(n, 10));
    return (Number.isNaN(h) ? 0 : h) * 60 + (Number.isNaN(m) ? 0 : m);
  };
  for (const s of list) {
    const a = toMin(s.start);
    const b = toMin(s.end);
    if (a < b) { if (cur >= a && cur < b) return s; }
    else if (a > b) { if (cur >= a || cur < b) return s; }
  }
  return null;
};

function MobileCheckinPage() {
  const router = useRouter();
  const { navLevel, isNavVisible, isLoading: isNavLoading } = useNavLevel();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('checkin');
  const [showSettings, setShowSettings] = useState(false);

  // GPS State
  const [currentLat, setCurrentLat] = useState<number | null>(null);
  const [currentLng, setCurrentLng] = useState<number | null>(null);
  const [gpsLoading, setGpsLoading] = useState(true);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [isInRange, setIsInRange] = useState(false);

  // Settings - Multiple GPS Locations
  const [gpsLocations, setGpsLocations] = useState<GPSSettings[]>([]);
  const [editingLocation, setEditingLocation] = useState<GPSSettings | null>(null);
  const [closestDistance, setClosestDistance] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [tempRadius, setTempRadius] = useState<number>(100);

  // Check-in State
  const [todayRecords, setTodayRecords] = useState<CheckinRecord[]>([]);
  const [historyRecords, setHistoryRecords] = useState<CheckinRecord[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Shift selection (เลือกกะ) — ลงเวลาได้หลายกะใน 1 วัน ตราบใดที่กะไม่ซ้ำ
  const [shifts, setShifts] = useState<WorkShift[]>([]);
  const [manualShiftId, setManualShiftId] = useState('');
  const [, setShiftTick] = useState(0); // บังคับ re-render เพื่อ re-evaluate กะอัตโนมัติทุก 1 นาที

  // กะที่กำลังทำงานอยู่ (เข้าแล้วยังไม่ออก) เพื่อให้ default ค้างที่กะนั้น
  const inProgressRecord = todayRecords.find((r) => r.checkin && !r.checkout) || null;
  const inProgressShift = inProgressRecord ? (shifts.find((s) => remarkOfShift(s) === inProgressRecord.remark) || null) : null;
  const autoShift = detectShiftByTime(shifts, new Date());
  const selectedShift: WorkShift | null =
    (manualShiftId ? shifts.find((s) => s.id === manualShiftId) || null : null) || inProgressShift || autoShift;

  // record ของกะที่เลือกอยู่ (ใช้แทน todayCheckin เดิม)
  const todayCheckin: CheckinRecord | null = selectedShift
    ? (todayRecords.find((r) => (r.remark || '') === remarkOfShift(selectedShift)) || null)
    : (todayRecords[0] || null);

  const upsertTodayRecord = (rec: CheckinRecord | null) => {
    if (!rec) return;
    setTodayRecords((prev) => [...prev.filter((r) => r.id !== rec.id), rec]);
  };

  // Alert State
  const [alert, setAlert] = useState<{ type: 'error' | 'success' | 'info', message: string } | null>(null);

  // User Info
  const [company, setCompany] = useState('');
  const [companyId, setCompanyId] = useState("");
  const [personId, setPersonId] = useState(0);
  const [personName, setPersonName] = useState('');
  const [level, setLevel] = useState('');
  const [storedFaceDescriptor, setStoredFaceDescriptor] = useState<string | null>(null);

  // Face Recognition State
  const [showFaceScan, setShowFaceScan] = useState(false);
  const [isFaceScanning, setIsFaceScanning] = useState(false);
  const [scanType, setScanType] = useState<'checkin' | 'checkout' | 'register'>('checkin');
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [modelsError, setModelsError] = useState<string | null>(null);
  const [webcamReady, setWebcamReady] = useState(false);
  const [cameraProfile, setCameraProfile] = useState<CameraProfile>(() => getInitialCameraProfile());
  const webcamRef = React.useRef<any>(null);
  const [isAddingLocation, setIsAddingLocation] = useState(false);
  const [livenessStatus, setLivenessStatus] = useState<'waiting' | 'blink_detected' | 'passed'>('waiting');
  const [isLivenessProcessing, setIsLivenessProcessing] = useState(false);
  const livenessRef = React.useRef<{ lastEAR: number; blinkStep: number }>({ lastEAR: 0.3, blinkStep: 0 });
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);
  const [isFaceDetected, setIsFaceDetected] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const visionTasksRef = React.useRef<any>(null);
  const faceLandmarkerRef = React.useRef<FaceLandmarker | null>(null);
  const faceLandmarkerImageRef = React.useRef<FaceLandmarker | null>(null);
  const imageEmbedderImageRef = React.useRef<ImageEmbedder | null>(null);
  const [currentSimilarity, setCurrentSimilarity] = useState<number | null>(null);
  const recognitionFrameRef = React.useRef<number>(0);
  const lastMatchTimeRef = React.useRef<number>(0);
  const detectionErrorCountRef = React.useRef<number>(0);
  const faceVisibleSinceRef = React.useRef<number | null>(null);
  const showFaceScanRef = React.useRef(false);
  const livenessStatusRef = React.useRef<'waiting' | 'blink_detected' | 'passed'>('waiting');

  const updateLivenessStatus = useCallback((status: 'waiting' | 'blink_detected' | 'passed') => {
    livenessStatusRef.current = status;
    setLivenessStatus(status);
  }, []);

  // Leave states
  const [leaveConfig, setLeaveConfig] = useState<any>({ vacationDays: 6, personalDays: 3, sickDays: 30, lateLimit: 3, workStartTime: '08:30' })
  const [leaveRecords, setLeaveRecords] = useState<any[]>([])
  const [showAddLeave, setShowAddLeave] = useState(false)
  const [addLeaveForm, setAddLeaveForm] = useState({ leaveType: 'vacation', leaveDate: '', reason: '' })
  const [showLeaveSettings, setShowLeaveSettings] = useState(false)
  const [leaveSettingsForm, setLeaveSettingsForm] = useState<any>({ vacationDays: 6, personalDays: 3, sickDays: 30, lateLimit: 3, workStartTime: '08:30' })

  // OT Request states
  const [otRecords, setOtRecords] = useState<any[]>([])
  const [showAddOt, setShowAddOt] = useState(false)
  const [addOtForm, setAddOtForm] = useState({ otDate: '', startTime: '', endTime: '', reason: '' })

  // Redirect immediately if checkin (P2) is not visible for this user
  useEffect(() => {
    if (isNavLoading) return; // Wait for navLevel to finish loading
    // Check if P2 is not visible, then redirect to first allowed page
    if (!isNavVisible('P2')) {
      const navMap = [
        { code: 'P1', path: '/web/mobile/index/' },
        { code: 'P3', path: '/web/mobile/sale/' },
        { code: 'P4', path: '/web/mobile/gift/' },
        { code: 'P5', path: '/web/mobile/product/' },
        { code: 'P6', path: '/web/mobile/stock/' },
      ];
      const first = navMap.find(n => isNavVisible(n.code));
      router.replace(first ? first.path : '/web/mobile/index/');
    }
  }, [isNavLoading, isNavVisible, router]);

  // Load face data - Now returns a boolean indicating success/existence
  const fetchFaceData = async (pid: number) => {
    if (!pid) return false;
    try {
      const res = await axios.get(`/api/checkinface/${pid}`);
      if (res.data && res.data.faceDescriptor) {
        setStoredFaceDescriptor(res.data.faceDescriptor);
        return true;
      }
      return false;
    } catch (error: any) {
      // 404 means face data not found - this is expected for new users
      if (error.response?.status === 404) {
        console.log('Face data not found for person:', pid);
        return false;
      }
      // Log actual errors but don't throw
      console.error('Error fetching face data:', error);
      return false;
    }
  };

  useEffect(() => {
    showFaceScanRef.current = showFaceScan;
  }, [showFaceScan]);

  useEffect(() => {
    livenessStatusRef.current = livenessStatus;
  }, [livenessStatus]);

  const ensureImageFaceLandmarker = useCallback(async () => {
    if (faceLandmarkerImageRef.current) return faceLandmarkerImageRef.current;

    const vision = visionTasksRef.current || await FilesetResolver.forVisionTasks(MEDIAPIPE_WASM_BASE);
    visionTasksRef.current = vision;

    faceLandmarkerImageRef.current = await createWithDelegateFallback('FaceLandmarker IMAGE', (delegate) =>
      FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: FACE_LANDMARKER_MODEL,
          delegate
        },
        outputFaceBlendshapes: false,
        runningMode: "IMAGE",
        numFaces: 1
      })
    );

    return faceLandmarkerImageRef.current;
  }, []);

  // Initialize
  useEffect(() => {
    document.body.style.margin = '0';
    document.body.style.padding = '0';

    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      let payload: MobileTokenPayload | null = null;
      try {
        payload = token ? jwtDecode<MobileTokenPayload>(token) : null;
      } catch (error) {
        console.error('Token decode failed:', error);
      }

      const storedCompanyId = localStorage.getItem('ci_') || String(payload?.idcompany || '');
      const storedCompany = localStorage.getItem('cp_') || payload?.company || '';
      const storedPersonId = Number(localStorage.getItem('pi_') || payload?.id || 0);
      const storedPersonName = localStorage.getItem('person_') || '';
      const storedLevel = localStorage.getItem('level_') || payload?.level || '';

      if (storedCompanyId && !localStorage.getItem('ci_')) localStorage.setItem('ci_', storedCompanyId);
      if (storedCompany && !localStorage.getItem('cp_')) localStorage.setItem('cp_', storedCompany);
      if (storedPersonId && !localStorage.getItem('pi_')) localStorage.setItem('pi_', String(storedPersonId));
      if (storedLevel && !localStorage.getItem('level_')) localStorage.setItem('level_', storedLevel);

      setCompanyId(storedCompanyId);
      setCompany(storedCompany);
      setPersonId(storedPersonId);
      setPersonName(storedPersonName);
      setLevel(storedLevel);

      // Load GPS settings from API (multiple locations)
      const fetchGpsSettings = async () => {
        try {
          const res = await axios.get(`/api/checkinset?idcompany=${storedCompanyId}`);
          if (res.data && Array.isArray(res.data)) {
            setGpsLocations(res.data);
          }
        } catch (error) {
          console.error('Error fetching GPS settings:', error);
        }
      };
      if (storedCompanyId) {
        fetchGpsSettings();
      }

      if (storedPersonId) {
        fetchFaceData(storedPersonId);
      }
    }

    // Load MediaPipe models
    const loadModels = async () => {
      try {
        setModelsError(null);
        const vision = await FilesetResolver.forVisionTasks(MEDIAPIPE_WASM_BASE);
        visionTasksRef.current = vision;

        faceLandmarkerRef.current = await createWithDelegateFallback('FaceLandmarker VIDEO', (delegate) =>
          FaceLandmarker.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath: FACE_LANDMARKER_MODEL,
              delegate
            },
            outputFaceBlendshapes: true,
            runningMode: "VIDEO",
            numFaces: 1
          })
        );

        imageEmbedderImageRef.current = await createWithDelegateFallback('ImageEmbedder IMAGE', (delegate) =>
          ImageEmbedder.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath: IMAGE_EMBEDDER_MODEL,
              delegate
            },
            runningMode: "IMAGE"
          })
        );

        setModelsLoaded(true);
      } catch (error) {
        console.error('Error loading MediaPipe models:', error);
        setModelsLoaded(false);
        setModelsError('ไม่สามารถโหลดระบบสแกนใบหน้าได้ กรุณารีเฟรชหรือลองเปิดด้วย Safari/Chrome');
      }
    };
    loadModels();

    const timer = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  // Leave: fetch config
  const fetchLeaveConfig = async () => {
    const idc = localStorage.getItem('id_company') || localStorage.getItem('ci_') || '0'
    try {
      const res = await axios.get(`/api/leave-config?idcompany=${idc}`)
      if (res.data) { setLeaveConfig(res.data); setLeaveSettingsForm(res.data) }
    } catch (e) { console.error('fetchLeaveConfig:', e) }
  }

  // Leave: save config
  const saveLeaveConfig = async () => {
    const idc = localStorage.getItem('id_company') || localStorage.getItem('ci_') || '0'
    try {
      await axios.post('/api/leave-config', { idcompany: idc, ...leaveSettingsForm })
      setLeaveConfig(leaveSettingsForm)
      setShowLeaveSettings(false)
      setAlert({ type: 'success', message: 'บันทึกตั้งค่าการลาสำเร็จ' })
      setTimeout(() => setAlert(null), 2000)
    } catch (e) { console.error('saveLeaveConfig:', e) }
  }

  // Leave: fetch records for current year
  const fetchLeaveRecords = async () => {
    if (!personId) return
    const idc = localStorage.getItem('id_company') || localStorage.getItem('ci_') || '0'
    const year = String(new Date().getFullYear())
    try {
      const res = await axios.get(`/api/leave-record?idcompany=${idc}&personId=${personId}&year=${year}`)
      setLeaveRecords(Array.isArray(res.data) ? res.data : [])
    } catch (e) { console.error('fetchLeaveRecords:', e) }
  }

  // Leave: add record
  const handleAddLeave = async () => {
    if (!personId || !addLeaveForm.leaveDate) return
    const idc = localStorage.getItem('id_company') || localStorage.getItem('ci_') || '0'
    try {
      await axios.post('/api/leave-record', {
        idcompany: idc, personId, person: personName,
        leaveType: addLeaveForm.leaveType, leaveDate: addLeaveForm.leaveDate,
        reason: addLeaveForm.reason, status: 'pending'
      })
      setShowAddLeave(false)
      setAddLeaveForm({ leaveType: 'vacation', leaveDate: '', reason: '' })
      fetchLeaveRecords()
      setAlert({ type: 'success', message: 'บันทึกการลาสำเร็จ' })
      setTimeout(() => setAlert(null), 2000)
    } catch (e) { console.error('handleAddLeave:', e) }
  }

  // Leave: delete record
  const handleDeleteLeave = async (id: number) => {
    if (!confirm('ต้องการลบรายการลานี้?')) return
    try {
      await axios.delete(`/api/leave-record?id=${id}`)
      fetchLeaveRecords()
    } catch (e) { console.error('handleDeleteLeave:', e) }
  }

  // OT: fetch records for current year
  const fetchOtRecords = async () => {
    if (!personId) return
    const idc = localStorage.getItem('id_company') || localStorage.getItem('ci_') || '0'
    const year = String(new Date().getFullYear())
    try {
      const res = await axios.get(`/api/ot-request?idcompany=${idc}&personId=${personId}&year=${year}`)
      setOtRecords(Array.isArray(res.data) ? res.data : [])
    } catch (e) { console.error('fetchOtRecords:', e) }
  }

  // OT: add record
  const handleAddOt = async () => {
    if (!personId || !addOtForm.otDate || !addOtForm.startTime || !addOtForm.endTime) return
    const idc = localStorage.getItem('id_company') || localStorage.getItem('ci_') || '0'
    const hours = calcOtHours(addOtForm.startTime, addOtForm.endTime)
    if (hours <= 0) {
      setAlert({ type: 'error', message: 'เวลาสิ้นสุดต้องมากกว่าเวลาเริ่มต้น' })
      setTimeout(() => setAlert(null), 2000)
      return
    }
    try {
      await axios.post('/api/ot-request', {
        idcompany: idc, personId, person: personName,
        otDate: addOtForm.otDate, startTime: addOtForm.startTime,
        endTime: addOtForm.endTime, hours, reason: addOtForm.reason
      })
      setShowAddOt(false)
      setAddOtForm({ otDate: '', startTime: '', endTime: '', reason: '' })
      fetchOtRecords()
      setAlert({ type: 'success', message: 'ส่งคำขอโอทีสำเร็จ' })
      setTimeout(() => setAlert(null), 2000)
    } catch (e) { console.error('handleAddOt:', e) }
  }

  // OT: delete record
  const handleDeleteOt = async (id: number) => {
    if (!confirm('ต้องการลบคำขอโอทีนี้?')) return
    try {
      await axios.delete(`/api/ot-request?id=${id}`)
      fetchOtRecords()
    } catch (e) { console.error('handleDeleteOt:', e) }
  }

  // OT: calculate hours between two time strings
  const calcOtHours = (start: string, end: string): number => {
    if (!start || !end) return 0
    const [sh, sm] = start.split(':').map(Number)
    const [eh, em] = end.split(':').map(Number)
    const diff = (eh * 60 + em) - (sh * 60 + sm)
    return diff > 0 ? Math.round((diff / 60) * 100) / 100 : 0
  }

  // Leave: count late days from history records
  const countLateDays = useCallback(() => {
    const startTime = leaveConfig.workStartTime || '08:30'
    const [startH, startM] = startTime.split(':').map(Number)
    return historyRecords.filter(r => {
      if (!r.checkin) return false
      const d = new Date(r.checkin)
      const h = d.getHours(), m = d.getMinutes()
      return h > startH || (h === startH && m > startM)
    }).length
  }, [historyRecords, leaveConfig.workStartTime])

  // Leave: calculate stats
  const getLeaveStats = useCallback(() => {
    const year = new Date().getFullYear()
    const yearRecords = leaveRecords.filter(r => {
      const rd = new Date(r.leaveDate)
      return rd.getFullYear() === year && r.status === 'approved'
    })
    const vacUsed = yearRecords.filter(r => r.leaveType === 'vacation').length
    const perUsed = yearRecords.filter(r => r.leaveType === 'personal').length
    const sickUsed = yearRecords.filter(r => r.leaveType === 'sick').length
    const lateDays = countLateDays()
    return {
      vacation: { entitled: leaveConfig.vacationDays || 0, used: vacUsed, remaining: Math.max(0, (leaveConfig.vacationDays || 0) - vacUsed) },
      personal: { entitled: leaveConfig.personalDays || 0, used: perUsed, remaining: Math.max(0, (leaveConfig.personalDays || 0) - perUsed) },
      sick: { entitled: leaveConfig.sickDays || 0, used: sickUsed, remaining: Math.max(0, (leaveConfig.sickDays || 0) - sickUsed) },
      late: { limit: leaveConfig.lateLimit || 0, count: lateDays, over: Math.max(0, lateDays - (leaveConfig.lateLimit || 0)) }
    }
  }, [leaveRecords, leaveConfig, countLateDays])

  // Fetch leave data when personId is ready
  useEffect(() => {
    if (personId) { fetchLeaveConfig(); fetchLeaveRecords(); fetchOtRecords() }
  }, [personId])

  // Calculate distance between two GPS points (Haversine formula)
  const calculateDistance = useCallback((lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371000; // Earth's radius in meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }, []);

  // Cosine Similarity for Face Comparison
  const cosineSimilarity = (vecA: number[], vecB: number[]): number => {
    if (!vecA.length || vecA.length !== vecB.length) return 0;
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  };

  // Helper to crop face from source (video or image)
  const cropFaceFromLandmarks = (source: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement, landmarks: any[]) => {
    if (!landmarks || landmarks.length === 0) return null;

    // Find bounding box
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    landmarks.forEach(pt => {
      minX = Math.min(minX, pt.x);
      minY = Math.min(minY, pt.y);
      maxX = Math.max(maxX, pt.x);
      maxY = Math.max(maxY, pt.y);
    });

    // Add minimal padding (5%) to reduce background influence
    // This helps face matching work across different backgrounds
    const width = maxX - minX;
    const height = maxY - minY;
    minX = Math.max(0, minX - width * 0.05);
    minY = Math.max(0, minY - height * 0.05);
    maxX = Math.min(1, maxX + width * 0.05);
    maxY = Math.min(1, maxY + height * 0.05);

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const sourceWidth = source instanceof HTMLVideoElement ? source.videoWidth : source instanceof HTMLImageElement ? source.naturalWidth || source.width : source.width;
    const sourceHeight = source instanceof HTMLVideoElement ? source.videoHeight : source instanceof HTMLImageElement ? source.naturalHeight || source.height : source.height;
    if (!sourceWidth || !sourceHeight) return null;

    canvas.width = 224; // Standard size for MobileNet
    canvas.height = 224;

    ctx.drawImage(
      source,
      minX * sourceWidth,
      minY * sourceHeight,
      (maxX - minX) * sourceWidth,
      (maxY - minY) * sourceHeight,
      0, 0, 224, 224
    );

    return canvas;
  };

  // Get current GPS location
  // 1. Geolocation Watcher (Independent of other state)
  useEffect(() => {
    if (!navigator.geolocation) {
      setGpsError('GPS ไม่พร้อมใช้งาน');
      setGpsLoading(false);
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setCurrentLat(position.coords.latitude);
        setCurrentLng(position.coords.longitude);
        setGpsLoading(false);
        setGpsError(null);
      },
      (error) => {
        let msg = 'ไม่สามารถระบุตำแหน่งได้';
        if (error.code === 1) msg = 'กรุณาอนุญาตการเข้าถึง GPS';
        else if (error.code === 2) msg = 'ไม่สามารถระบุตำแหน่งได้ (Signal lost)';
        else if (error.code === 3) msg = 'ค้นหาตำแหน่งล่าสุดไม่สำเร็จ (Timeout)';

        setGpsError(msg);
        setGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  // 2. Range Validation (Calculates distance when GPS or locations change)
  useEffect(() => {
    if (currentLat === null || currentLng === null) return;

    if (gpsLocations.length > 0) {
      let minDist = Infinity;
      let inRange = false;
      gpsLocations.forEach(loc => {
        if (loc.latitude && loc.longitude) {
          const dist = calculateDistance(
            currentLat,
            currentLng,
            loc.latitude,
            loc.longitude
          );
          if (dist < minDist) minDist = dist;
          if (dist <= (loc.radius || 100)) inRange = true;
        }
      });
      setClosestDistance(Math.round(minDist));
      setIsInRange(inRange);
      setDistance(Math.round(minDist));
    } else {
      setIsInRange(true); // No locations configured, allow check-in
    }
  }, [currentLat, currentLng, gpsLocations, calculateDistance]);

  // Fetch today's check-in
  useEffect(() => {
    if (!companyId || !personId) return;

    const fetchToday = async () => {
      try {
        const today = new Date();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const year = today.getFullYear();

        const res = await axios.get(`/api/checkin?idcompany=${companyId}&personId=${personId}&month=${month}&year=${year}`);
        const records = res.data as CheckinRecord[];

        // เก็บทุก record ของวันนี้ (รองรับหลายกะ) ใช้ Thai timezone ทั้งสองฝั่ง
        const todayStr = toThaiDateString();
        setTodayRecords(records.filter(r => r.checkin && toThaiDateString(r.checkin) === todayStr));
      } catch (error) {
        console.error('Error fetching today checkin:', error);
      }
    };

    fetchToday();
  }, [companyId, personId]);

  // โหลดกะการทำงานของบริษัท
  useEffect(() => {
    if (!companyId) return;
    let alive = true;
    (async () => {
      try {
        const res = await axios.get(`/api/report-shifts?company=${encodeURIComponent(companyId)}`);
        if (alive) setShifts(Array.isArray(res.data?.shifts) ? res.data.shifts : []);
      } catch {
        if (alive) setShifts([]);
      }
    })();
    return () => { alive = false; };
  }, [companyId]);

  // re-evaluate กะอัตโนมัติทุก 1 นาที
  useEffect(() => {
    const t = setInterval(() => setShiftTick((v) => v + 1), 60000);
    return () => clearInterval(t);
  }, []);

  // Fetch monthly history
  const fetchHistory = useCallback(async () => {
    if (!companyId || !personId) return;
    try {
      const month = String(currentMonth.getMonth() + 1).padStart(2, '0');
      const year = currentMonth.getFullYear();

      const res = await axios.get(`/api/checkin?idcompany=${companyId}&personId=${personId}&month=${month}&year=${year}`);
      setHistoryRecords(res.data as CheckinRecord[]);
    } catch (error) {
      console.error('Error fetching history:', error);
    }
  }, [companyId, personId, currentMonth]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const getFaceSaveErrorMessage = (error: any) => {
    const code = error?.response?.data?.code;
    if (code === 'INVALID_EMPLOYEE_ID') return '❌ ไม่พบรหัสพนักงาน กรุณาออกจากระบบแล้วเข้าสู่ระบบใหม่';
    if (code === 'EMPLOYEE_NOT_FOUND') return '❌ ไม่พบข้อมูลพนักงานในระบบ กรุณาตรวจสอบบัญชีผู้ใช้';
    if (code === 'INVALID_FACE_DESCRIPTOR') return '❌ สร้างข้อมูลใบหน้าไม่สมบูรณ์ กรุณาลองใหม่ในที่สว่าง';
    if (error?.response?.status === 413) return '❌ ข้อมูลใบหน้ามีขนาดใหญ่เกินไป กรุณาลองใหม่';
    return '❌ ลงทะเบียนไม่สำเร็จ กรุณาลองใหม่';
  };

  const resetFaceScanState = () => {
    setIsFaceScanning(false);
    setWebcamReady(false);
    setCameraProfile(getInitialCameraProfile());
    setIsFaceDetected(false);
    setCurrentSimilarity(null);
    updateLivenessStatus('waiting');
    livenessRef.current = { lastEAR: 0.3, blinkStep: 0 };
    recognitionFrameRef.current = 0;
    lastMatchTimeRef.current = 0;
    detectionErrorCountRef.current = 0;
    faceVisibleSinceRef.current = null;
  };

  const openFaceScan = (type: 'checkin' | 'checkout' | 'register') => {
    if (!personId) {
      setAlert({ type: 'error', message: '❌ ไม่พบข้อมูลผู้ใช้งาน กรุณาเข้าสู่ระบบใหม่' });
      setTimeout(() => setAlert(null), 3000);
      return;
    }
    if (modelsError) {
      setAlert({ type: 'error', message: modelsError });
      setTimeout(() => setAlert(null), 4000);
      return;
    }
    resetFaceScanState();
    setScanType(type);
    showFaceScanRef.current = true;
    setShowFaceScan(true);
  };

  const closeFaceScan = () => {
    showFaceScanRef.current = false;
    setShowFaceScan(false);
    resetFaceScanState();
  };

  // Handle Check-in Trigger
  const startCheckin = async () => {
    if (!personId) {
      setAlert({ type: 'error', message: '❌ ไม่พบข้อมูลผู้ใช้งาน กรุณาเข้าสู่ระบบใหม่' });
      setTimeout(() => setAlert(null), 3000);
      return;
    }

    if (!isInRange && gpsLocations.length > 0) {
      setAlert({ type: 'error', message: '⚠️ คุณอยู่นอกพื้นที่! ไม่สามารถเช็คอินได้' });
      setTimeout(() => setAlert(null), 3000);
      return;
    }

    // Always fetch latest face data before starting scan
    setAlert({ type: 'info', message: '⏳ กำลังเตรียมข้อมูลใบหน้า...' });
    const hasFace = await fetchFaceData(personId);
    setAlert(null);

    if (!hasFace) {
      setAlert({ type: 'error', message: '❌ ไม่พบข้อมูลใบหน้า! กรุณาลงทะเบียนใบหน้าก่อน' });
      setTimeout(() => setAlert(null), 3000);
      return;
    }

    openFaceScan('checkin');
  };

  // Perform actual check-in after face validation
  const handleCheckin = async () => {
    try {
      const now = new Date();
      const res = await axios.post('/api/checkin', {
        idcompany: companyId,
        company: company,
        personId: personId,
        person: personName,
        status: 'checked-in',
        checkin: now.toISOString(),
        checkinLat: currentLat,
        checkinLng: currentLng,
        gpsRadius: gpsLocations[0]?.radius || 100,
        targetLat: gpsLocations[0]?.latitude || 0,
        targetLng: gpsLocations[0]?.longitude || 0,
        approve: 'pending',
        remark: remarkOfShift(selectedShift),
      });

      setShowFaceScan(false);
      upsertTodayRecord(res.data);
      fetchHistory();
      setAlert({ type: 'success', message: selectedShift ? `✅ เช็คอินกะ${selectedShift.name}สำเร็จ!` : '✅ เช็คอินสำเร็จ!' });
      setTimeout(() => setAlert(null), 3000);
    } catch (error: any) {
      setShowFaceScan(false);
      if (error?.response?.status === 409) {
        upsertTodayRecord(error.response.data.existing);
        fetchHistory();
        setAlert({ type: 'error', message: selectedShift ? `⚠️ คุณเช็คอินกะ${selectedShift.name}ไปแล้ว` : '⚠️ คุณเช็คอินวันนี้ไปแล้ว' });
      } else {
        setAlert({ type: 'error', message: '❌ เกิดข้อผิดพลาด กรุณาลองใหม่' });
      }
      setTimeout(() => setAlert(null), 3000);
    }
  };

  // Handle Checkout Trigger
  const startCheckout = async () => {
    if (!todayCheckin) return;

    if (!personId) {
      setAlert({ type: 'error', message: '❌ ไม่พบข้อมูลผู้ใช้งาน กรุณาเข้าสู่ระบบใหม่' });
      setTimeout(() => setAlert(null), 3000);
      return;
    }

    if (!isInRange && gpsLocations.length > 0) {
      setAlert({ type: 'error', message: '⚠️ คุณอยู่นอกพื้นที่! ไม่สามารถเช็คเอาท์ได้' });
      setTimeout(() => setAlert(null), 3000);
      return;
    }

    // Always fetch latest face data before starting scan
    setAlert({ type: 'info', message: '⏳ กำลังเตรียมข้อมูลใบหน้า...' });
    const hasFace = await fetchFaceData(personId);
    setAlert(null);

    if (!hasFace) {
      setAlert({ type: 'error', message: '❌ ไม่พบข้อมูลใบหน้า! กรุณาลงทะเบียนใบหน้าก่อน' });
      setTimeout(() => setAlert(null), 3000);
      return;
    }

    openFaceScan('checkout');
  };

  // Perform actual checkout after face validation
  const handleCheckout = async () => {
    if (!todayCheckin) return;
    try {
      const now = new Date();
      const res = await axios.put(`/api/checkin/${todayCheckin.id}`, {
        status: 'checked-out',
        checkout: now.toISOString(),
        checkoutLat: currentLat,
        checkoutLng: currentLng
      });

      setShowFaceScan(false);
      upsertTodayRecord(res.data);
      fetchHistory();
      setAlert({ type: 'success', message: selectedShift ? `✅ เช็คเอาท์กะ${selectedShift.name}สำเร็จ!` : '✅ เช็คเอาท์สำเร็จ!' });
      setTimeout(() => setAlert(null), 3000);
    } catch (error) {
      setAlert({ type: 'error', message: '❌ เกิดข้อผิดพลาด กรุณาลองใหม่' });
      setTimeout(() => setAlert(null), 3000);
    }
  };

  // Face Scan Recognition & Liveness Logic (MediaPipe)
  const handleFaceScan = async () => {
    if (!webcamRef.current || !modelsLoaded || isFaceScanning || !faceLandmarkerRef.current || !imageEmbedderImageRef.current) return;
    setIsFaceScanning(true);
    updateLivenessStatus('waiting');
    setCurrentSimilarity(null);
    livenessRef.current = { lastEAR: 0.3, blinkStep: 0 };
    recognitionFrameRef.current = 0;
    lastMatchTimeRef.current = 0;
    detectionErrorCountRef.current = 0;
    faceVisibleSinceRef.current = null;
    const allowStableLivenessFallback = isIOSLikeBrowser() || isInAppBrowser();
    const stableLivenessMs = allowStableLivenessFallback ? 1600 : 0;

    const runDetection: () => Promise<void> = async () => {
      if (!webcamRef.current || !showFaceScanRef.current || !faceLandmarkerRef.current) {
        setIsFaceScanning(false);
        return;
      }

      try {
        const video = webcamRef.current.video;
        if (!video || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA || !video.videoWidth || !video.videoHeight || video.paused || video.ended) {
          requestAnimationFrame(runDetection);
          return;
        }

        const startTimeMs = performance.now();
        const results = faceLandmarkerRef.current.detectForVideo(video, startTimeMs);
        detectionErrorCountRef.current = 0;

        if (!results || results.faceLandmarks.length === 0) {
          setIsFaceDetected(false);
          faceVisibleSinceRef.current = null;
          // Keep liveness status if already passed, but reset blink step if lost face
          if (livenessStatusRef.current !== 'passed' && livenessStatusRef.current !== 'blink_detected') {
            livenessRef.current = { lastEAR: 0.3, blinkStep: 0 };
          }
          requestAnimationFrame(runDetection);
          return;
        }

        setIsFaceDetected(true);
        if (faceVisibleSinceRef.current === null) faceVisibleSinceRef.current = startTimeMs;
        const faceStableEnough = stableLivenessMs > 0 && startTimeMs - faceVisibleSinceRef.current >= stableLivenessMs;

        // --- 1. Blink Detection (Liveness) ---
        // Only run if not already passed
        if (livenessStatusRef.current !== 'passed' && livenessStatusRef.current !== 'blink_detected') {
          const blendshapes = results.faceBlendshapes[0];
          if (blendshapes?.categories?.length) {
            const blinkLeft = blendshapes.categories.find(c => c.categoryName === 'eyeBlinkLeft')?.score || 0;
            const blinkRight = blendshapes.categories.find(c => c.categoryName === 'eyeBlinkRight')?.score || 0;
            const avgBlink = (blinkLeft + blinkRight) / 2;

            const BLINK_THRESHOLD = 0.4; // More lenient (was 0.45)
            const OPEN_THRESHOLD = 0.3;   // More lenient (was 0.15)

            if (livenessRef.current.blinkStep === 0 && avgBlink < OPEN_THRESHOLD) {
              livenessRef.current.blinkStep = 1;
            } else if (livenessRef.current.blinkStep === 1 && avgBlink > BLINK_THRESHOLD) {
              livenessRef.current.blinkStep = 2;
            } else if (livenessRef.current.blinkStep === 2 && avgBlink < OPEN_THRESHOLD) {
              updateLivenessStatus('blink_detected');
              livenessRef.current.blinkStep = 3;
              // Short delay only for UI, but allows logic to proceed
              setTimeout(() => {
                if (showFaceScanRef.current && livenessRef.current.blinkStep === 3) {
                  updateLivenessStatus('passed');
                }
              }, 300);
            }
          }
        }

        if (faceStableEnough && livenessStatusRef.current !== 'passed') {
          updateLivenessStatus('passed');
        }

        const livenessSatisfied = livenessStatusRef.current === 'passed' || livenessRef.current.blinkStep === 3 || faceStableEnough;

        // --- 2. Face Matching & Registration (Real-time) ---
        // For registration: Captured immediately upon blink or every 2 frames
        // For matching: We run every 4 frames to save CPU
        const shouldRunMatching = (scanType === 'register' && (livenessSatisfied || recognitionFrameRef.current % 2 === 0)) ||
          (scanType !== 'register' && recognitionFrameRef.current % 4 === 0);
        recognitionFrameRef.current++;

        if (shouldRunMatching) {
          const faceCanvas = cropFaceFromLandmarks(video, results.faceLandmarks[0]);
          if (faceCanvas && imageEmbedderImageRef.current) {
            const embeddingResult = imageEmbedderImageRef.current.embed(faceCanvas);
            if (embeddingResult && embeddingResult.embeddings.length > 0) {
              const currentEmbedding = extractEmbeddingVector(embeddingResult.embeddings[0] as MediaPipeEmbedding);
              if (currentEmbedding.length < FACE_DESCRIPTOR_MIN_LENGTH) {
                if (scanType === 'register' && livenessSatisfied) {
                  setAlert({ type: 'error', message: '❌ สร้างข้อมูลใบหน้าไม่สมบูรณ์ กรุณาลองใหม่ในที่สว่าง' });
                  livenessRef.current.blinkStep = 0;
                  faceVisibleSinceRef.current = null;
                  updateLivenessStatus('waiting');
                  setTimeout(() => setAlert(null), 3000);
                }
                requestAnimationFrame(runDetection);
                return;
              }

              if (scanType === 'register') {
                // If blink just happened (or already passed)
                if (livenessSatisfied) {
                  const descriptorStr = JSON.stringify(currentEmbedding);
                  try {
                    await axios.post('/api/checkinface', {
                      employeeId: personId,
                      faceDescriptor: descriptorStr
                    });
                    setStoredFaceDescriptor(descriptorStr);
                    showFaceScanRef.current = false;
                    setShowFaceScan(false);
                    setAlert({ type: 'success', message: '✅ ลงทะเบียนใบหน้าสำเร็จ!' });
                    setIsFaceScanning(false);
                    setTimeout(() => setAlert(null), 2000);
                    return;
                  } catch (err) {
                    console.error('Registration error:', err);
                    setAlert({ type: 'error', message: getFaceSaveErrorMessage(err) });
                    livenessRef.current.blinkStep = 0;
                    faceVisibleSinceRef.current = null;
                    updateLivenessStatus('waiting');
                  }
                }
              } else if (storedFaceDescriptor) {
                let storedEmbedding: unknown;
                try {
                  storedEmbedding = JSON.parse(storedFaceDescriptor);
                } catch {
                  storedEmbedding = null;
                }
                if (!Array.isArray(storedEmbedding) || storedEmbedding.length !== currentEmbedding.length) {
                  setAlert({ type: 'error', message: '❌ ข้อมูลใบหน้าที่ลงทะเบียนไว้ไม่สมบูรณ์ กรุณาลงทะเบียนใหม่' });
                  setIsFaceScanning(false);
                  setTimeout(() => setAlert(null), 3000);
                  return;
                }
                const similarity = cosineSimilarity(currentEmbedding, storedEmbedding);
                setCurrentSimilarity(similarity);

                // --- 3. Combined Success Condition ---
                // Match threshold is now 70% for stricter face matching security
                const THRESHOLD = 0.70;
                if (similarity >= THRESHOLD && livenessSatisfied) {
                  showFaceScanRef.current = false;
                  setShowFaceScan(false);
                  setIsFaceScanning(false);
                  if (scanType === 'checkin') await handleCheckin();
                  else await handleCheckout();
                  return;
                }
              }
            }
          }
        }

        // Continue the animation loop
        requestAnimationFrame(runDetection);
      } catch (error) {
        console.error('Face scan error:', error);
        detectionErrorCountRef.current += 1;
        if (detectionErrorCountRef.current >= 6) {
          setIsFaceScanning(false);
          setAlert({ type: 'error', message: '❌ ระบบสแกนสะดุด กรุณาปิดหน้าต่างแล้วลองใหม่' });
          setTimeout(() => setAlert(null), 3000);
          return;
        }
        if (showFaceScanRef.current) requestAnimationFrame(runDetection);
      }
    };

    runDetection();
  };

  // Auto-start Face Scan when modal opens and models are ready
  useEffect(() => {
    if (showFaceScan && modelsLoaded && webcamReady && !isFaceScanning) {
      handleFaceScan();
    }
  }, [showFaceScan, modelsLoaded, webcamReady, isFaceScanning]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !modelsLoaded || !imageEmbedderImageRef.current) return;
    if (!personId) {
      setAlert({ type: 'error', message: '❌ ไม่พบข้อมูลผู้ใช้งาน กรุณาเข้าสู่ระบบใหม่' });
      setTimeout(() => setAlert(null), 3000);
      return;
    }

    setIsProcessingPhoto(true);
    setAlert({ type: 'info', message: '⏳ กำลังวิเคราะห์ใบหน้าจากรูปถ่าย...' });
    let imageUrl: string | null = null;

    try {
      const img = new Image();
      imageUrl = URL.createObjectURL(file);
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Image load failed'));
        img.src = imageUrl!;
      });

      // Detect face and crop from image
      const imageFaceLandmarker = await ensureImageFaceLandmarker();
      const results = imageFaceLandmarker.detect(img);
      let targetSource: HTMLImageElement | HTMLCanvasElement = img;

      if (results && results.faceLandmarks.length > 0) {
        const faceCanvas = cropFaceFromLandmarks(img, results.faceLandmarks[0]);
        if (faceCanvas) targetSource = faceCanvas;
      }

      const embeddingResult = imageEmbedderImageRef.current!.embed(targetSource);

      if (!embeddingResult || embeddingResult.embeddings.length === 0) {
        setAlert({ type: 'error', message: '❌ ไม่พบใบหน้าในรูปภาพ หรือรูปภาพไม่ชัดเจน' });
        setTimeout(() => setAlert(null), 3000);
        return;
      }

      const photoEmbedding = extractEmbeddingVector(embeddingResult.embeddings[0] as MediaPipeEmbedding);
      if (photoEmbedding.length < FACE_DESCRIPTOR_MIN_LENGTH) {
        setAlert({ type: 'error', message: '❌ สร้างข้อมูลใบหน้าไม่สมบูรณ์ กรุณาเลือกรูปที่ชัดกว่าเดิม' });
        setTimeout(() => setAlert(null), 3000);
        return;
      }

      const descriptorStr = JSON.stringify(photoEmbedding);
      await axios.post('/api/checkinface', {
        employeeId: personId,
        faceDescriptor: descriptorStr
      });

      setStoredFaceDescriptor(descriptorStr);
      showFaceScanRef.current = false;
      setShowFaceScan(false);
      setAlert({ type: 'success', message: '✅ ลงทะเบียนใบหน้าจากรูปถ่ายสำเร็จ!' });
      setTimeout(() => setAlert(null), 3000);
    } catch (error) {
      console.error('Photo upload error:', error);
      setAlert({ type: 'error', message: getFaceSaveErrorMessage(error) });
      setTimeout(() => setAlert(null), 3000);
    } finally {
      if (imageUrl) URL.revokeObjectURL(imageUrl);
      setIsProcessingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Month navigation
  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  // Format time
  const formatTime = (dateStr: string | null): string => {
    if (!dateStr) return '--:--';
    const date = new Date(dateStr);
    return date.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
  };

  // Format date for table
  const formatDay = (dateStr: string | null): number => {
    if (!dateStr) return 0;
    return new Date(dateStr).getDate();
  };

  // Navigation
  const handleNavigation = (tab: string) => {
    setActiveTab(tab);
    if (tab === 'home') router.push('/web/mobile/index/');
    if (tab === 'sale') router.push('/web/mobile/sale/');
    if (tab === 'product') router.push('/web/mobile/product/');
    if (tab === 'count') router.push('/web/mobile/stock/');
    if (tab === 'stockchange') router.push('/web/mobile/stockchange/');
    if (tab === 'receive') router.push('/web/mobile/rc/');
    if (tab === 'pickup') router.push('/web/mobile/gift/');
  };

  // Get current time
  const getCurrentTime = () => {
    return new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
  };

  // Get current date
  const getCurrentDate = () => {
    const now = new Date();
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };
    return now.toLocaleDateString('th-TH', options);
  };

  if (loading) {
    return (
      <>
        <style dangerouslySetInnerHTML={{ __html: mobileCheckinStyles }} />
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <div className="loading-text">กำลังโหลด...</div>
        </div>
      </>
    );
  }

  const hasCheckedIn = todayCheckin?.checkin != null;
  const hasCheckedOut = todayCheckin?.checkout != null;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: mobileCheckinStyles }} />
      <div className="mobile-checkin-app">
        {/* Alert Toast */}
        {alert && (
          <div className={`alert-toast ${alert.type}`}>
            <span className="alert-text">{alert.message}</span>
          </div>
        )}

        {/* Header */}
        <div className="checkin-header">
          <div className="header-top">
            <div className="header-title">
              <Clock size={24} />
              เข้างาน
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                className="register-face-btn"
                onClick={() => openFaceScan('register')}
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white'
                }}
                title="ลงทะเบียนใบหน้า"
              >
                <User size={22} />
              </button>
              {level === 'level2' && (
                <button
                  className="settings-btn"
                  onClick={() => setShowSettings(true)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.2)',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '8px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Settings size={22} color="white" />
                </button>
              )}
            </div>
          </div>
          <div className="header-date">{getCurrentDate()}</div>
        </div>

        {/* GPS Status Card */}
        <div className="gps-status-card">
          <div className="gps-status-header">
            <div className={`gps-icon ${gpsLoading ? 'loading' : isInRange ? 'in-range' : 'out-range'}`}>
              <MapPin size={22} color="white" />
            </div>
            <div>
              <div className="gps-title">
                {gpsLoading ? 'กำลังค้นหาตำแหน่ง...' :
                  gpsError ? gpsError :
                    gpsLocations.length === 0 ? 'ยังไม่ได้ตั้งค่าตำแหน่ง' :
                      isInRange ? '✅ อยู่ในพื้นที่' : '⚠️ อยู่นอกพื้นที่'}
              </div>
              <div className="gps-subtitle">
                จุดตั้งค่า: {gpsLocations.length} จุด
              </div>
            </div>
          </div>
          {distance !== null && gpsLocations.length > 0 && (
            <div className="gps-distance">
              <MapPin size={18} color="#0891b2" />
              <span className="distance-value">{distance}</span>
              <span className="distance-unit">เมตร จากจุดใกล้สุด</span>
            </div>
          )}
        </div>

        {/* Shift Selector — เลือกกะการทำงาน */}
        {shifts.length > 0 && (
          <div style={{ background: '#ffffff', borderRadius: 14, padding: '8px 12px', margin: '0 16px 10px', boxShadow: '0 2px 10px rgba(8,145,178,0.07)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12.5, fontWeight: 700, color: '#0e7490' }}>
                <Clock size={13} /> เลือกกะการทำงาน
              </div>
              {selectedShift && (
                <span style={{ fontSize: 11, color: '#0891b2', background: '#ecfeff', borderRadius: 100, padding: '2px 9px', fontWeight: 600 }}>
                  {selectedShift.name} · {selectedShift.start}-{selectedShift.end}
                </span>
              )}
            </div>
            <div style={{ display: 'flex', gap: 7, overflowX: 'auto', paddingBottom: 1, WebkitOverflowScrolling: 'touch' }}>
              {shifts.map((s) => {
                const rec = todayRecords.find((r) => (r.remark || '') === remarkOfShift(s));
                const active = selectedShift?.id === s.id;
                const state: 'none' | 'in' | 'done' = rec ? (rec.checkout ? 'done' : 'in') : 'none';
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setManualShiftId(s.id)}
                    style={{
                      flex: '0 0 auto', minWidth: 86, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1,
                      padding: '6px 10px', borderRadius: 11, cursor: 'pointer', position: 'relative',
                      border: active ? '2px solid #0891b2' : '1px solid #e2e8f0',
                      background: active ? 'linear-gradient(135deg,#ecfeff,#cffafe)' : '#f8fafc',
                      boxShadow: active ? '0 3px 9px rgba(8,145,178,0.16)' : 'none',
                      transition: 'all .15s ease',
                    }}
                  >
                    <span style={{ fontSize: 14, fontWeight: 700, color: active ? '#0e7490' : '#334155', lineHeight: 1.15 }}>{s.name}</span>
                    <span style={{ fontSize: 10, color: '#94a3b8', lineHeight: 1.15 }}>{s.start}-{s.end}</span>
                    {state === 'in' && (
                      <span style={{ fontSize: 9, color: '#2A6AAA', background: '#E5EEF8', borderRadius: 100, padding: '0px 7px', fontWeight: 600, marginTop: 1 }}>กำลังทำงาน</span>
                    )}
                    {state === 'done' && (
                      <span style={{ fontSize: 9, color: '#64748b', background: '#e2e8f0', borderRadius: 100, padding: '0px 7px', fontWeight: 600, marginTop: 1 }}>เสร็จแล้ว</span>
                    )}
                    {state === 'none' && (
                      <span style={{ fontSize: 9, color: active ? '#0891b2' : '#cbd5e1', background: active ? '#cffafe' : '#f1f5f9', borderRadius: 100, padding: '0px 7px', fontWeight: 600, marginTop: 1 }}>
                        {active ? 'พร้อมลงเวลา' : 'ยังไม่ลงเวลา'}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Big Check-in & Check-out Buttons */}
        <div className="checkin-button-container">
          {/* Check In Button */}
          <button
            className={`checkin-button checkin ${(hasCheckedIn || (!isInRange && gpsLocations.length > 0)) ? 'disabled' : ''}`}
            onClick={startCheckin}
            disabled={hasCheckedIn || (!isInRange && gpsLocations.length > 0)}
          >
            {hasCheckedIn ? (
              <CheckCircle size={32} color="white" />
            ) : (
              <span className="checkin-button-time">{getCurrentTime()}</span>
            )}
            <span className="checkin-button-text">{hasCheckedIn ? 'Checked In' : 'Check In'}</span>
          </button>

          {/* Check Out Button */}
          <button
            className={`checkin-button checkout ${(!hasCheckedIn || hasCheckedOut || (!isInRange && gpsLocations.length > 0)) ? 'disabled' : ''}`}
            onClick={startCheckout}
            disabled={!hasCheckedIn || hasCheckedOut || (!isInRange && gpsLocations.length > 0)}
          >
            {hasCheckedOut ? (
              <CheckCircle size={32} color="white" />
            ) : (
              <span className="checkin-button-time">{getCurrentTime()}</span>
            )}
            <span className="checkin-button-text">{hasCheckedOut ? 'Checked Out' : 'Check Out'}</span>
          </button>
        </div>

        {/* Today Status */}
        <div className="today-status-card">
          <div className="today-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <User size={18} color="#0891b2" />
              สถานะวันนี้ - {personName || 'ไม่ระบุ'}
            </span>
            {selectedShift && (
              <span style={{ fontSize: 12, fontWeight: 700, color: '#0e7490', background: '#ecfeff', borderRadius: 100, padding: '3px 12px', whiteSpace: 'nowrap' }}>
                กะ{selectedShift.name}
              </span>
            )}
          </div>
          <div className="today-times">
            <div className="time-item checkin">
              <div className="time-label">เข้างาน</div>
              <div className="time-value">{formatTime(todayCheckin?.checkin || null)}</div>
            </div>
            <div className="time-item checkout">
              <div className="time-label">ออกงาน</div>
              <div className="time-value">{formatTime(todayCheckin?.checkout || null)}</div>
            </div>
          </div>
        </div>

        {/* Leave Statistics */}
        {(() => {
          const st = getLeaveStats()
          return (
            <div className="leave-card">
              <div className="leave-header">
                <div className="leave-title">
                  <Calendar size={16} color="#6366f1" />
                  สถิติการลา {new Date().getFullYear() + 543}
                </div>
                <div className="leave-actions">
                  <button className="leave-action-btn add" onClick={() => setShowAddLeave(true)}>
                    <ClipboardList size={12} /> ลา
                  </button>
                  {level === 'level2' && (
                    <button className="leave-action-btn settings" onClick={() => { setLeaveSettingsForm({...leaveConfig}); setShowLeaveSettings(true) }}>
                      <Settings size={12} />
                    </button>
                  )}
                </div>
              </div>

              <div className="leave-grid">
                <div className="leave-stat-item vacation">
                  <div className="leave-stat-label" style={{color:'#1E5088'}}>🌴 ลาพักร้อน</div>
                  <div className="leave-stat-nums">
                    <div className="leave-num-box"><div className="leave-num-val" style={{color:'#3E86C7'}}>{st.vacation.entitled}</div><div className="leave-num-lbl">สิทธิ์</div></div>
                    <div className="leave-num-box"><div className="leave-num-val" style={{color:'#ef4444'}}>{st.vacation.used}</div><div className="leave-num-lbl">ลาแล้ว</div></div>
                    <div className="leave-num-box"><div className="leave-num-val" style={{color:'#2A6AAA'}}>{st.vacation.remaining}</div><div className="leave-num-lbl">เหลือ</div></div>
                  </div>
                  <div className="leave-progress"><div className="leave-progress-bar" style={{width:`${st.vacation.entitled>0?Math.min((st.vacation.used/st.vacation.entitled)*100,100):0}%`,background:'#3E86C7'}} /></div>
                </div>

                <div className="leave-stat-item personal">
                  <div className="leave-stat-label" style={{color:'#b45309'}}>💼 ลากิจ</div>
                  <div className="leave-stat-nums">
                    <div className="leave-num-box"><div className="leave-num-val" style={{color:'#f59e0b'}}>{st.personal.entitled}</div><div className="leave-num-lbl">สิทธิ์</div></div>
                    <div className="leave-num-box"><div className="leave-num-val" style={{color:'#ef4444'}}>{st.personal.used}</div><div className="leave-num-lbl">ลาแล้ว</div></div>
                    <div className="leave-num-box"><div className="leave-num-val" style={{color:'#2A6AAA'}}>{st.personal.remaining}</div><div className="leave-num-lbl">เหลือ</div></div>
                  </div>
                  <div className="leave-progress"><div className="leave-progress-bar" style={{width:`${st.personal.entitled>0?Math.min((st.personal.used/st.personal.entitled)*100,100):0}%`,background:'#f59e0b'}} /></div>
                </div>

                <div className="leave-stat-item sick">
                  <div className="leave-stat-label" style={{color:'#dc2626'}}>🤒 ลาป่วย</div>
                  <div className="leave-stat-nums">
                    <div className="leave-num-box"><div className="leave-num-val" style={{color:'#ef4444'}}>{st.sick.entitled}</div><div className="leave-num-lbl">สิทธิ์</div></div>
                    <div className="leave-num-box"><div className="leave-num-val" style={{color:'#ef4444'}}>{st.sick.used}</div><div className="leave-num-lbl">ลาแล้ว</div></div>
                    <div className="leave-num-box"><div className="leave-num-val" style={{color:'#2A6AAA'}}>{st.sick.remaining}</div><div className="leave-num-lbl">เหลือ</div></div>
                  </div>
                  <div className="leave-progress"><div className="leave-progress-bar" style={{width:`${st.sick.entitled>0?Math.min((st.sick.used/st.sick.entitled)*100,100):0}%`,background:'#ef4444'}} /></div>
                </div>

                <div className="leave-stat-item late">
                  <div className="leave-stat-label" style={{color:'#7c3aed'}}>⏰ สาย</div>
                  <div className="leave-stat-nums">
                    <div className="leave-num-box"><div className="leave-num-val" style={{color:'#a855f7'}}>{st.late.limit}</div><div className="leave-num-lbl">อนุโลม</div></div>
                    <div className="leave-num-box"><div className="leave-num-val" style={{color:st.late.count>st.late.limit?'#ef4444':'#334155'}}>{st.late.count}</div><div className="leave-num-lbl">สายจริง</div></div>
                    <div className="leave-num-box"><div className="leave-num-val" style={{color:st.late.over>0?'#ef4444':'#147F56'}}>{st.late.over}</div><div className="leave-num-lbl">เกิน</div></div>
                  </div>
                  <div className="leave-progress"><div className="leave-progress-bar" style={{width:`${st.late.limit>0?Math.min((st.late.count/st.late.limit)*100,100):0}%`,background:st.late.count>st.late.limit?'#ef4444':'#a855f7'}} /></div>
                </div>
              </div>

              {leaveRecords.length > 0 && (
                <div className="leave-records-list">
                  {leaveRecords.slice(0, 5).map((lr: any) => (
                    <div key={lr.id} className="leave-record-item">
                      <div className="leave-record-info">
                        <span className={`leave-type-badge ${lr.leaveType}`}>
                          {lr.leaveType === 'vacation' ? 'พักร้อน' : lr.leaveType === 'personal' ? 'ลากิจ' : 'ป่วย'}
                        </span>
                        <span className="leave-record-date">
                          {lr.leaveDate ? new Date(lr.leaveDate).toLocaleDateString('th-TH', {day:'numeric',month:'short'}) : '-'}
                        </span>
                        <span style={{
                          fontSize: '9px', padding: '1px 6px', borderRadius: 6, fontWeight: 500,
                          background: lr.status === 'approved' ? '#D3F0E2' : lr.status === 'rejected' ? '#fee2e2' : '#fef3c7',
                          color: lr.status === 'approved' ? '#147F56' : lr.status === 'rejected' ? '#dc2626' : '#b45309'
                        }}>
                          {lr.status === 'approved' ? 'อนุมัติ' : lr.status === 'rejected' ? 'ไม่อนุมัติ' : 'รอ'}
                        </span>
                      </div>
                      {lr.status === 'pending' && (
                        <button className="leave-del-btn" onClick={() => handleDeleteLeave(lr.id)}>
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })()}

        {/* OT Request Card */}
        <div className="ot-request-card">
          <div className="ot-request-header">
            <div className="ot-request-title">
              <Clock size={16} color="#ea580c" />
              ขอทำโอที
            </div>
            {otRecords.filter(r => r.status === 'approved').length > 0 && (
              <div className="ot-hours-badge" style={{ fontSize: '12px', padding: '4px 10px' }}>
                รวม {otRecords.filter(r => r.status === 'approved').reduce((s: number, r: any) => s + (r.hours || 0), 0).toFixed(1)} ชม.
              </div>
            )}
          </div>

          <button className="ot-request-btn" onClick={() => setShowAddOt(true)}>
            <Clock size={18} />
            เขียนขอโอที
          </button>

          {otRecords.length > 0 && (
            <div className="ot-records-list">
              {otRecords.slice(0, 5).map((ot: any) => (
                <div key={ot.id} className="ot-record-item">
                  <div className="ot-record-info">
                    <span className="ot-date-badge">
                      {ot.otDate ? new Date(ot.otDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' }) : '-'}
                    </span>
                    <span className="ot-time-text">
                      {ot.startTime} - {ot.endTime}
                    </span>
                    <span className="ot-hours-badge">{ot.hours} ชม.</span>
                    <span className={`ot-status-badge ${ot.status}`}>
                      {ot.status === 'approved' ? 'อนุมัติ' : ot.status === 'rejected' ? 'ไม่อนุมัติ' : 'รออนุมัติ'}
                    </span>
                  </div>
                  {ot.status === 'pending' && (
                    <button className="ot-del-btn" onClick={() => handleDeleteOt(ot.id)}>
                      <X size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* OT Request Modal */}
        {showAddOt && (
          <div className="modal-overlay" onClick={() => setShowAddOt(false)}>
            <div className="leave-modal-body" onClick={(e) => e.stopPropagation()}>
              <div className="modal-handle" />
              <div className="modal-header">
                <div className="modal-title">⏰ เขียนขอโอที</div>
                <button className="modal-close" onClick={() => setShowAddOt(false)}>
                  <X size={20} color="#6b7280" />
                </button>
              </div>

              <div className="ot-form-group">
                <label className="ot-form-label">วันที่ทำโอที</label>
                <input
                  type="date"
                  className="ot-form-input"
                  value={addOtForm.otDate}
                  onChange={(e) => setAddOtForm({ ...addOtForm, otDate: e.target.value })}
                />
              </div>

              <div className="ot-time-row">
                <div className="ot-form-group">
                  <label className="ot-form-label">เวลาเริ่ม</label>
                  <select className="ot-form-input" value={addOtForm.startTime}
                    onChange={(e) => setAddOtForm({ ...addOtForm, startTime: e.target.value })}>
                    <option value="">-- เลือก --</option>
                    {Array.from({ length: 48 }, (_, i) => {
                      const h = String(Math.floor(i / 2)).padStart(2, '0')
                      const m = i % 2 === 0 ? '00' : '30'
                      return <option key={i} value={`${h}:${m}`}>{h}:{m}</option>
                    })}
                  </select>
                </div>
                <div className="ot-form-group">
                  <label className="ot-form-label">เวลาสิ้นสุด</label>
                  <select className="ot-form-input" value={addOtForm.endTime}
                    onChange={(e) => setAddOtForm({ ...addOtForm, endTime: e.target.value })}>
                    <option value="">-- เลือก --</option>
                    {Array.from({ length: 48 }, (_, i) => {
                      const h = String(Math.floor(i / 2)).padStart(2, '0')
                      const m = i % 2 === 0 ? '00' : '30'
                      return <option key={i} value={`${h}:${m}`}>{h}:{m}</option>
                    })}
                  </select>
                </div>
              </div>

              {addOtForm.startTime && addOtForm.endTime && calcOtHours(addOtForm.startTime, addOtForm.endTime) > 0 && (
                <div className="ot-hours-display">
                  <div className="ot-hours-value">{calcOtHours(addOtForm.startTime, addOtForm.endTime)}</div>
                  <div className="ot-hours-label">ชั่วโมง</div>
                </div>
              )}

              <div className="ot-form-group">
                <label className="ot-form-label">เหตุผล / รายละเอียดงาน</label>
                <input type="text" className="ot-form-input" placeholder="ระบุเหตุผลในการขอโอที..."
                  value={addOtForm.reason}
                  onChange={(e) => setAddOtForm({ ...addOtForm, reason: e.target.value })} />
              </div>

              <button className="ot-save-btn" onClick={handleAddOt}
                disabled={!addOtForm.otDate || !addOtForm.startTime || !addOtForm.endTime}>
                ส่งคำขอโอที
              </button>
            </div>
          </div>
        )}

        {/* Add Leave Modal */}
        {showAddLeave && (
          <div className="modal-overlay" onClick={() => setShowAddLeave(false)}>
            <div className="leave-modal-body" onClick={(e) => e.stopPropagation()}>
              <div className="modal-handle" />
              <div className="modal-header">
                <div className="modal-title">📝 บันทึกการลา</div>
                <button className="modal-close" onClick={() => setShowAddLeave(false)}>
                  <X size={20} color="#6b7280" />
                </button>
              </div>
              <div className="leave-form-group">
                <label className="leave-form-label">ประเภทการลา</label>
                <select className="leave-form-select" value={addLeaveForm.leaveType}
                  onChange={(e) => setAddLeaveForm({...addLeaveForm, leaveType: e.target.value})}>
                  <option value="vacation">🌴 ลาพักร้อน</option>
                  <option value="personal">💼 ลากิจ</option>
                  <option value="sick">🤒 ลาป่วย</option>
                </select>
              </div>
              <div className="leave-form-group">
                <label className="leave-form-label">วันที่ลา</label>
                <input type="date" className="leave-form-input" value={addLeaveForm.leaveDate}
                  onChange={(e) => setAddLeaveForm({...addLeaveForm, leaveDate: e.target.value})} />
              </div>
              <div className="leave-form-group">
                <label className="leave-form-label">เหตุผล (ไม่บังคับ)</label>
                <input type="text" className="leave-form-input" placeholder="ระบุเหตุผล..."
                  value={addLeaveForm.reason}
                  onChange={(e) => setAddLeaveForm({...addLeaveForm, reason: e.target.value})} />
              </div>
              <button className="leave-save-btn" onClick={handleAddLeave} disabled={!addLeaveForm.leaveDate}>
                บันทึก
              </button>
            </div>
          </div>
        )}

        {/* Leave Settings Modal */}
        {showLeaveSettings && (
          <div className="modal-overlay" onClick={() => setShowLeaveSettings(false)}>
            <div className="leave-modal-body" onClick={(e) => e.stopPropagation()}>
              <div className="modal-handle" />
              <div className="modal-header">
                <div className="modal-title">⚙️ ตั้งค่าสิทธิ์การลา</div>
                <button className="modal-close" onClick={() => setShowLeaveSettings(false)}>
                  <X size={20} color="#6b7280" />
                </button>
              </div>
              {[
                { key: 'vacationDays', label: '🌴 ลาพักร้อน (วัน/ปี)', color: '#3E86C7' },
                { key: 'personalDays', label: '💼 ลากิจ (วัน/ปี)', color: '#f59e0b' },
                { key: 'sickDays', label: '🤒 ลาป่วย (วัน/ปี)', color: '#ef4444' },
                { key: 'lateLimit', label: '⏰ สายไม่เกิน (ครั้ง/เดือน)', color: '#a855f7' },
              ].map((item) => (
                <div key={item.key} className="leave-settings-row">
                  <div className="leave-settings-label">{item.label}</div>
                  <input type="number" min={0} className="leave-settings-input"
                    style={{borderColor: item.color}}
                    value={leaveSettingsForm[item.key] || 0}
                    onChange={(e) => setLeaveSettingsForm({...leaveSettingsForm, [item.key]: Number(e.target.value)})} />
                </div>
              ))}
              <div className="leave-settings-row">
                <div className="leave-settings-label">🕐 เวลาเข้างาน</div>
                <input type="time" className="leave-settings-input" style={{width:100,borderColor:'#6366f1'}}
                  value={leaveSettingsForm.workStartTime || '08:30'}
                  onChange={(e) => setLeaveSettingsForm({...leaveSettingsForm, workStartTime: e.target.value})} />
              </div>
              <button className="leave-save-btn" onClick={saveLeaveConfig} style={{background:'linear-gradient(135deg, #f59e0b, #d97706)'}}>
                บันทึกตั้งค่า
              </button>
            </div>
          </div>
        )}

        {/* Monthly History */}
        <div className="history-card">
          <div className="history-header">
            <div className="history-title">
              <Calendar size={18} color="#0891b2" />
              ประวัติรายเดือน
            </div>
            <div className="month-nav">
              <button className="month-nav-btn" onClick={prevMonth}>
                <ChevronLeft size={18} color="#6b7280" />
              </button>
              <span className="month-name">
                {thaiMonths[currentMonth.getMonth()]} {currentMonth.getFullYear() + 543}
              </span>
              <button className="month-nav-btn" onClick={nextMonth}>
                <ChevronRight size={18} color="#6b7280" />
              </button>
            </div>
          </div>
          {historyRecords.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '6px 12px' }}>
              <span style={{ fontFamily: 'Kanit', fontSize: '13px', color: '#4338ca', fontWeight: 600, backgroundColor: '#e0e7ff', padding: '4px 12px', borderRadius: '8px' }}>
                รวม {(() => {
                  const total = historyRecords.reduce((sum, r) => {
                    if (!r.checkin || !r.checkout) return sum;
                    const inT = new Date(r.checkin).getTime();
                    const outT = new Date(r.checkout).getTime();
                    if (isNaN(inT) || isNaN(outT) || outT <= inT) return sum;
                    return sum + (outT - inT);
                  }, 0);
                  return (total / (1000 * 60 * 60)).toFixed(1);
                })()} ชั่วโมง
              </span>
            </div>
          )}

          {historyRecords.length > 0 ? (
            <table className="history-table">
              <thead>
                <tr>
                  <th>วัน</th>
                  <th>เข้า</th>
                  <th>ออก</th>
                  <th>ชม.รวม</th>
                  <th>สถานะ</th>
                  <th>ผู้อนุมัติ</th>
                </tr>
              </thead>
              <tbody>
                {[...historyRecords].sort((a, b) => new Date(a.checkin || 0).getTime() - new Date(b.checkin || 0).getTime()).map((record) => (
                  <tr key={record.id}>
                    <td>{formatDay(record.checkin)}</td>
                    <td>{formatTime(record.checkin)}</td>
                    <td>{formatTime(record.checkout)}</td>
                    <td style={{ fontWeight: 600, color: '#4338ca' }}>
                      {(() => {
                        if (!record.checkin || !record.checkout) return '-';
                        const inT = new Date(record.checkin).getTime();
                        const outT = new Date(record.checkout).getTime();
                        if (isNaN(inT) || isNaN(outT) || outT <= inT) return '-';
                        return ((outT - inT) / (1000 * 60 * 60)).toFixed(1);
                      })()}
                    </td>
                    <td>
                      <div className={`status-badge ${record.approve === 'approved' ? 'approved' :
                        record.approve === 'rejected' ? 'rejected' : 'pending'
                        }`}>
                        {record.approve === 'approved' ? <CheckCircle size={16} /> :
                          record.approve === 'rejected' ? <XCircle size={16} /> :
                            <Clock size={16} />}
                      </div>
                    </td>
                    <td style={{ fontSize: '11px', color: '#6b7280' }}>
                      {record.approvePerson || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="empty-state">
              <Calendar size={40} className="empty-state-icon" color="#9ca3af" />
              <div>ไม่มีข้อมูลในเดือนนี้</div>
            </div>
          )}
        </div>

        {/* Face Scan Modal */}
        {showFaceScan && (
          <div className="modal-overlay" onClick={closeFaceScan}>
            <div className="face-scan-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <div className="modal-title">
                  {scanType === 'register' ? '👤 ลงทะเบียนใบหน้า' : '🤳 กรุณาสแกนใบหน้า'}
                </div>
                <button className="modal-close" onClick={closeFaceScan}>
                  <X size={20} color="#6b7280" />
                </button>
              </div>

              <div className="webcam-container">
                <Webcam
                  key={cameraProfile}
                  audio={false}
                  ref={webcamRef}
                  screenshotFormat="image/jpeg"
                  videoConstraints={getCameraConstraints(cameraProfile)}
                  autoPlay
                  playsInline
                  muted
                  mirrored={true}
                  onUserMedia={() => {
                    setWebcamReady(true);
                    setAlert(null);
                  }}
                  onUserMediaError={(error) => {
                    console.error('Webcam error:', error);
                    setWebcamReady(false);
                    setIsFaceScanning(false);
                    const nextProfile = getNextCameraProfile(cameraProfile);
                    if (nextProfile) {
                      setCameraProfile(nextProfile);
                      setAlert({ type: 'info', message: '⏳ กำลังลองเปิดกล้องอีกครั้ง...' });
                      return;
                    }
                    const isSecure = typeof window !== 'undefined' && (window.location.protocol === 'https:' || window.location.hostname === 'localhost');
                    const message = isSecure
                      ? '❌ ไม่สามารถเปิดกล้องได้ กรุณาอนุญาตการเข้าถึงกล้อง'
                      : '❌ กล้องบน iPhone ต้องเปิดผ่าน HTTPS เท่านั้น';
                    setAlert({ type: 'error', message });
                    setTimeout(() => setAlert(null), 3000);
                  }}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <div className="webcam-overlay">
                  <div className="face-indicator"></div>
                </div>
                {isFaceScanning && (livenessStatus === 'blink_detected' || (scanType === 'register' && livenessRef.current.blinkStep === 3)) && (
                  <div className="scanning-loader">{scanType === 'register' ? 'กำลังบันทึกข้อมูล...' : 'กำลังยืนยันตัวตน...'}</div>
                )}
                {currentSimilarity !== null && (
                  <div className="similarity-badge">
                    <User size={14} />
                    {(currentSimilarity * 100).toFixed(1)}% Match
                    <div
                      className="similarity-bar"
                      style={{
                        width: `${currentSimilarity * 100}%`,
                        background: currentSimilarity >= 0.55 ? '#1F9D6B' : '#f59e0b'
                      }}
                    />
                  </div>
                )}
              </div>

              <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '16px', fontWeight: (isFaceScanning && isFaceDetected) ? '600' : 'normal' }}>
                {!isFaceScanning ? '⏳ กำลังเตรียมการ...' :
                  !isFaceDetected ? '❌ ไม่พบใบหน้า กรุณาขยับหน้าให้ตรงกรอบ' :
                    livenessStatus === 'waiting' ? '👀 พบใบหน้าแล้ว! "กรุณากระพริบตา" เพื่อสแกน' :
                      livenessRef.current.blinkStep === 3 ? '✅ ตรวจพบการกระพริบตา...' :
                        livenessStatus === 'blink_detected' ? '✅ ยืนยัน Liveness สำเร็จ...' :
                          livenessStatus === 'passed' ? (scanType === 'register' ? '💾 กำลังบันทึกข้อมูล...' : (currentSimilarity && currentSimilarity > 0.3 ? '🔍 กำลังจับคู่ใบหน้า...' : '🎉 ผ่านการทดสอบ Liveness แล้ว')) :
                            'กรุณาวางใบหน้าให้ตรงกับกรอบสีเขียว'}
              </p>

              <button
                className="scan-btn"
                onClick={handleFaceScan}
                disabled={isFaceScanning || !modelsLoaded || !webcamReady || !!modelsError}
              >
                {modelsError ? modelsError : !modelsLoaded ? '⏳ กำลังโหลด MediaPipe...' : !webcamReady ? '⏳ กำลังเปิดกล้อง...' : isFaceScanning ? '👀 กำลังสแกน...' : 'สแกนใบหน้า'}
              </button>

              {scanType === 'register' && (
                <div style={{ marginTop: '12px', width: '100%' }}>
                  <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={handlePhotoUpload}
                    style={{ display: 'none' }}
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isProcessingPhoto || !modelsLoaded || !!modelsError}
                    style={{
                      background: 'none',
                      border: '1px solid #0891b2',
                      color: '#0891b2',
                      borderRadius: '8px',
                      padding: '8px 16px',
                      fontSize: '14px',
                      width: '100%',
                      cursor: 'pointer',
                      fontWeight: '500'
                    }}
                  >
                    {isProcessingPhoto ? '⏳ กำลังประมวลผล...' : !modelsLoaded ? '⏳ กำลังโหลดระบบสแกน...' : '📁 เลือกรูปภาพจากเครื่อง'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Settings Modal */}
        {showSettings && (
          <div className="modal-overlay" onClick={() => setShowSettings(false)}>
            <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-handle"></div>
              <div className="modal-header">
                <div className="modal-title">⚙️ ตั้งค่า GPS ({gpsLocations.length}/5 จุด)</div>
                <button className="modal-close" onClick={() => setShowSettings(false)}>
                  <X size={20} color="#6b7280" />
                </button>
              </div>

              {/* GPS Locations List */}
              <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {gpsLocations.length > 0 ? (
                  gpsLocations.map((loc, index) => (
                    <div key={loc.id} className="gps-data-card" style={{ marginBottom: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <div className="gps-data-title" style={{ margin: 0 }}>
                          📍 {loc.names || `จุดที่ ${index + 1}`}
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          {editingId === loc.id ? (
                            <>
                              <button
                                onClick={async () => {
                                  try {
                                    const res = await axios.post('/api/checkinset', {
                                      idcompany: companyId,
                                      id: loc.id,
                                      radius: tempRadius,
                                      names: loc.names,
                                      latitude: loc.latitude,
                                      longitude: loc.longitude
                                    });
                                    setGpsLocations(gpsLocations.map(l => l.id === loc.id ? res.data : l));
                                    setEditingId(null);
                                    setAlert({ type: 'success', message: '✅ บันทึกรัศมีสำเร็จ!' });
                                    setTimeout(() => setAlert(null), 3000);
                                  } catch (error) {
                                    setAlert({ type: 'error', message: '❌ ไม่สามารถบันทึกได้' });
                                    setTimeout(() => setAlert(null), 3000);
                                  }
                                }}
                                style={{
                                  background: '#E5EEF8',
                                  border: 'none',
                                  borderRadius: '8px',
                                  padding: '6px 12px',
                                  cursor: 'pointer',
                                  color: '#173F6B',
                                  fontSize: '12px'
                                }}
                              >
                                บันทึก
                              </button>
                              <button
                                onClick={() => setEditingId(null)}
                                style={{
                                  background: '#f3f4f6',
                                  border: 'none',
                                  borderRadius: '8px',
                                  padding: '6px 12px',
                                  cursor: 'pointer',
                                  color: '#374151',
                                  fontSize: '12px'
                                }}
                              >
                                ยกเลิก
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => {
                                  setEditingId(loc.id || null);
                                  setTempRadius(loc.radius || 100);
                                }}
                                style={{
                                  background: '#E5EEF8',
                                  border: 'none',
                                  borderRadius: '8px',
                                  padding: '6px 12px',
                                  cursor: 'pointer',
                                  color: '#1E5088',
                                  fontSize: '12px'
                                }}
                              >
                                แก้ไข
                              </button>
                              <button
                                onClick={async () => {
                                  try {
                                    await axios.delete(`/api/checkinset?id=${loc.id}`);
                                    setGpsLocations(gpsLocations.filter(l => l.id !== loc.id));
                                    setAlert({ type: 'success', message: '✅ ลบจุดสำเร็จ!' });
                                    setTimeout(() => setAlert(null), 3000);
                                  } catch (error) {
                                    setAlert({ type: 'error', message: '❌ ไม่สามารถลบได้' });
                                    setTimeout(() => setAlert(null), 3000);
                                  }
                                }}
                                style={{
                                  background: '#fee2e2',
                                  border: 'none',
                                  borderRadius: '8px',
                                  padding: '6px 12px',
                                  cursor: 'pointer',
                                  color: '#dc2626',
                                  fontSize: '12px'
                                }}
                              >
                                ลบ
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="gps-data-grid">
                        <div className="gps-data-item">
                          <div className="gps-data-label">รัศมี</div>
                          {editingId === loc.id ? (
                            <input
                              type="number"
                              value={tempRadius}
                              onChange={(e) => setTempRadius(Number(e.target.value))}
                              style={{
                                width: '60px',
                                border: '1px solid #e5e7eb',
                                borderRadius: '4px',
                                padding: '2px 4px',
                                fontSize: '14px'
                              }}
                            />
                          ) : (
                            <div className="gps-data-value">{loc.radius || 100} m</div>
                          )}
                        </div>
                        <div className="gps-data-item">
                          <div className="gps-data-label">Lat</div>
                          <div className="gps-data-value">{loc.latitude?.toFixed(4) || '-'}</div>
                        </div>
                        <div className="gps-data-item">
                          <div className="gps-data-label">Lng</div>
                          <div className="gps-data-value">{loc.longitude?.toFixed(4) || '-'}</div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="no-data-msg">
                    ⚠️ ยังไม่มีการตั้งค่า GPS สำหรับบริษัทนี้
                  </div>
                )}
              </div>

              {/* Add New Location Button */}
              {gpsLocations.length < 5 && (
                <button
                  className={`save-settings-btn ${isAddingLocation ? 'disabled' : ''}`}
                  style={{ marginTop: '16px', background: 'linear-gradient(135deg, #3E86C7, #2A6AAA)', opacity: isAddingLocation ? 0.7 : 1 }}
                  disabled={isAddingLocation}
                  onClick={async () => {
                    setIsAddingLocation(true);

                    // Internal function to perform the POST
                    const performAdd = async (lat: number, lng: number) => {
                      try {
                        const res = await axios.post('/api/checkinset', {
                          idcompany: companyId || localStorage.getItem('ci_'),
                          names: `จุดที่ ${gpsLocations.length + 1}`,
                          radius: 100,
                          latitude: lat,
                          longitude: lng
                        });
                        setGpsLocations([...gpsLocations, res.data]);
                        setAlert({ type: 'success', message: '✅ เพิ่มจุดสำเร็จ!' });
                        setTimeout(() => setAlert(null), 3000);
                      } catch (error: any) {
                        const errorMsg = error.response?.data?.error || error.response?.data || error.message || 'เกิดข้อผิดพลาดในการบันทึก';
                        setAlert({ type: 'error', message: `❌ ${errorMsg}` });
                        setTimeout(() => setAlert(null), 3000);
                      } finally {
                        setIsAddingLocation(false);
                      }
                    };

                    // Try to get current position if state is missing
                    if (currentLat === null || currentLng === null) {
                      navigator.geolocation.getCurrentPosition(
                        (pos) => performAdd(pos.coords.latitude, pos.coords.longitude),
                        (err) => {
                          setAlert({ type: 'error', message: '❌ ไม่สามารถระบุตำแหน่งได้ กรุณาลองใหม่' });
                          setTimeout(() => setAlert(null), 3000);
                          setIsAddingLocation(false);
                        },
                        { enableHighAccuracy: true, timeout: 10000 }
                      );
                    } else {
                      await performAdd(currentLat, currentLng);
                    }
                  }}
                >
                  {isAddingLocation ? '⏳ กำลังค้นหาตำแหน่ง...' : '➕ เพิ่มจุดใหม่ (ใช้ตำแหน่งปัจจุบัน)'}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Bottom Navigation */}
        <div className="bottom-nav">
          {isNavVisible('P1') && <div
            className={`nav-item ${activeTab === 'home' ? 'active' : ''}`}
            onClick={() => handleNavigation('home')}
          >
            <Home size={20} />
            <span>หน้าหลัก</span>
          </div>}
          {isNavVisible('P2') && <div
            className={`nav-item ${activeTab === 'checkin' ? 'active' : ''}`}
            onClick={() => handleNavigation('checkin')}
          >
            <LogIn size={20} />
            <span>เข้างาน</span>
          </div>}
          {isNavVisible('P3') && <div
            className={`nav-item ${activeTab === 'sale' ? 'active' : ''}`}
            onClick={() => handleNavigation('sale')}
          >
            <ShoppingCart size={20} />
            <span>ขาย</span>
          </div>}
          {isNavVisible('P4') && <div
            className={`nav-item ${activeTab === 'pickup' ? 'active' : ''}`}
            onClick={() => handleNavigation('pickup')}
          >
            <DollarSign size={20} />
            <span>ค่าหยิบ</span>
          </div>}
          {/* {isNavVisible('P5') && <div
            className={`nav-item ${activeTab === 'product' ? 'active' : ''}`}
            onClick={() => handleNavigation('product')}
          >
            <Box size={20} />
            <span>สินค้า</span>
          </div>} */}
          {isNavVisible('P6') && <div
            className={`nav-item ${activeTab === 'count' ? 'active' : ''}`}
            onClick={() => handleNavigation('count')}
          >
            <ClipboardList size={20} />
            <span>นับสินค้า</span>
          </div>}
          {isNavVisible('P7') && <div
            className={`nav-item ${activeTab === 'receive' ? 'active' : ''}`}
            onClick={() => handleNavigation('receive')}
          >
            <PackagePlus size={20} />
            <span>รับ</span>
          </div>}
          <div
            className={`nav-item ${activeTab === 'voice' ? 'active' : ''}`}
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

export default MobileCheckinPage;
