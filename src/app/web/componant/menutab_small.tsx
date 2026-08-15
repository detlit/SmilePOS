'use client'

import React, { useState, useEffect, useLayoutEffect, useRef } from 'react'
import Link from "next/link";

import axios from 'axios'
import { usePermission } from '@/utils/usePermission'

// Run layout effects on the client (before paint) but fall back to useEffect on the
// server so Next.js doesn't warn during SSR of this client component.
const useIsoLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect

// Visible width of the sidebar card (px). Collapsed shrinks to an icon-only rail.
const SIDEBAR_EXPANDED_WIDTH = 130
const SIDEBAR_COLLAPSED_WIDTH = 56
// Half of the app's row gutter (see `body .row` in globals.css). The wrapping column
// keeps this padding on both sides so the card lines up with the 15px page margin on
// the left and leaves a full gutter (2 x 7.5px = 15px) before the first content card
// — the same gap the content columns use between themselves.
const SIDEBAR_GUTTER = 7.5
const SIDEBAR_TRANSITION = 'flex-basis .28s ease, max-width .28s ease, width .28s ease, padding .28s ease'
const SIDEBAR_STORAGE_KEY = 'sidebarCollapsed'
const SIDEBAR_EVENT = 'sidebarCollapseToggle'

const SIDEBAR_CSS = `
.smSidebar .smNav {
  display: flex;
  flex-direction: column;
  gap: 1px;
  width: 100%;
  padding: 5px 5px 8px;
  background: #ffffff;
  border: 1px solid #E7EFF8;
  border-radius: 14px;
  box-shadow: 0 6px 18px rgba(23, 63, 107, .06);
  position: sticky;
  top: 8px;
  max-height: calc(100vh - 24px);
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-width: thin;
  scrollbar-color: #D7E3F0 transparent;
  transition: padding .28s ease;
}
.smSidebar .smNav::-webkit-scrollbar { width: 5px; }
.smSidebar .smNav::-webkit-scrollbar-track { background: transparent; }
.smSidebar .smNav::-webkit-scrollbar-thumb { background: #DCE7F3; border-radius: 99px; }
.smSidebar .smNav::-webkit-scrollbar-thumb:hover { background: #C5D8EA; }

.smSidebar .smNavHead {
  position: sticky;
  top: 0;
  z-index: 2;
  background: #ffffff;
  padding-bottom: 5px;
  margin-bottom: 1px;
}
.smSidebar .smSidebarToggle {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  width: 100%;
  height: 30px;
  padding: 0 6px;
  border: 1px solid #DCEAF7;
  border-radius: 8px;
  background: linear-gradient(135deg, #F7FBFF, #E9F3FC);
  color: #173F6B;
  font-family: 'Kanit_B', 'Kanit', sans-serif;
  font-size: 12px;
  cursor: pointer;
  transition: background .18s ease, box-shadow .18s ease;
}
.smSidebar .smSidebarToggle:hover {
  background: linear-gradient(135deg, #EAF3FC, #DBE9F7);
  box-shadow: 0 3px 8px rgba(23, 63, 107, .12);
}
.smSidebar .smSidebarToggle svg {
  width: 15px;
  height: 15px;
  fill: currentColor;
  flex: 0 0 auto;
  transition: transform .3s ease;
}
.smSidebarCollapsed .smSidebarToggle svg { transform: rotate(180deg); }

/* Compact single-row item: icon on the left, label on the right. Rows keep a
   fixed 32px min-height so a 2-line label never makes the list ragged. */
.smSidebar .smNavItem {
  position: relative;
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 6px;
  min-height: 32px;
  padding: 4px 6px;
  border-radius: 8px;
  color: #5B6B7C;
  text-decoration: none;
  font-family: 'Kanit', sans-serif;
  transition: background-color .16s ease, color .16s ease, box-shadow .16s ease, transform .12s ease, padding .28s ease;
  -webkit-tap-highlight-color: transparent;
}
.smSidebar .smNavItem:hover { background: #F1F7FD; color: #1E5088; text-decoration: none; }
.smSidebar .smNavItem:active { transform: scale(.98); }
.smSidebar .smNavItem:focus-visible { outline: 2px solid #3E86C7; outline-offset: 1px; }
.smSidebar .smNavIcon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  flex: 0 0 auto;
}
.smSidebar .smNavIcon svg {
  width: 17px;
  height: 17px;
  fill: currentColor;
  transition: transform .16s ease;
}
.smSidebar .smNavItem:hover .smNavIcon svg { transform: scale(1.08); }
.smSidebar .smNavLabel {
  flex: 1 1 auto;
  min-width: 0;
  font-size: 12px;
  line-height: 1.15;
  text-align: left;
  letter-spacing: 0;
  word-break: break-word;
}
.smSidebar .smNavItemActive {
  background: linear-gradient(135deg, #4A90D0, #2A6AAA);
  color: #ffffff;
  font-family: 'Kanit_B', 'Kanit', sans-serif;
  box-shadow: 0 3px 8px rgba(42, 106, 170, .26);
}
.smSidebar .smNavItemActive:hover {
  background: linear-gradient(135deg, #4A90D0, #2A6AAA);
  color: #ffffff;
}
/* thin accent bar so the active row still reads at a glance when collapsed */
.smSidebar .smNavItemActive::before {
  content: "";
  position: absolute;
  left: 3px;
  top: 50%;
  transform: translateY(-50%);
  width: 2px;
  height: 15px;
  border-radius: 2px;
  background: rgba(255, 255, 255, .85);
}

.smSidebar .smNavDivider {
  height: 1px;
  margin: 4px 8px;
  background: linear-gradient(90deg, transparent, #E3EDF7, transparent);
  transition: margin .28s ease;
}

.smSidebar .smNavBadge {
  flex: 0 0 auto;
  margin-left: auto;
  min-width: 17px;
  height: 17px;
  padding: 0 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  color: #ffffff;
  font-family: 'Kanit_B', 'Kanit', sans-serif;
  font-size: 10px;
  font-weight: 700;
}

/* ---- collapsed (icon-only rail) ---- */
.smSidebarCollapsed .smNav { padding: 6px 5px 10px; }
.smSidebarCollapsed .smNavItem { justify-content: center; padding: 7px 4px; gap: 0; }
.smSidebarCollapsed .smNavLabel { display: none; }
.smSidebarCollapsed .smNavDivider { margin: 4px 10px; }
.smSidebarCollapsed .smNavItemActive::before { display: none; }
.smSidebarCollapsed .smNavBadge {
  position: absolute;
  top: 0;
  right: 0;
  margin: 0;
  min-width: 15px;
  height: 15px;
  padding: 0 3px;
  font-size: 9px;
  border: 2px solid #ffffff;
}
`

type NavItem = {
      key: string            // value stored in `showcolor` (kept for backward compatibility)
      perm: string           // permission codename
      href: string
      label: string
      group: number          // items of the same group render together, separated by a divider
      icon: React.ReactNode
      badge?: 'receive' | 'doc' | 'follow'
      badgeColor?: string
      hidden?: boolean       // kept in the list but never rendered
      onClick?: () => void
}

const NAV_ITEMS: NavItem[] = [
      {
            key: "1", perm: "A1", href: "/web/dashboard", label: "หน้าหลัก", group: 1,
            icon: (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><path fillRule="evenodd" d="M0 0h1v15h15v1H0zm10 3.5a.5.5 0 0 1 .5-.5h4a.5.5 0 0 1 .5.5v4a.5.5 0 0 1-1 0V4.9l-3.613 4.417a.5.5 0 0 1-.74.037L7.06 6.767l-3.656 5.027a.5.5 0 0 1-.808-.588l4-5.5a.5.5 0 0 1 .758-.06l2.609 2.61L13.445 4H10.5a.5.5 0 0 1-.5-.5" /></svg>),
      },
      {
            key: "2", perm: "B1", href: "/web/sales", label: "หน้าขาย", group: 1,
            icon: (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><path d="M8 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4" /><path d="M0 4a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H1a1 1 0 0 1-1-1zm3 0a2 2 0 0 1-2 2v4a2 2 0 0 1 2 2h10a2 2 0 0 1 2-2V6a2 2 0 0 1-2-2z" /></svg>),
      },
      {
            key: "3", perm: "C1", href: "/web/dataproduct", label: "ข้อมูลสินค้า", group: 2,
            onClick: () => { localStorage.setItem("bh", "1"); localStorage.setItem("bhs", "1") },
            icon: (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><path d="M4.318 2.687C5.234 2.271 6.536 2 8 2s2.766.27 3.682.687C12.644 3.125 13 3.627 13 4c0 .374-.356.875-1.318 1.313C10.766 5.729 9.464 6 8 6s-2.766-.27-3.682-.687C3.356 4.875 3 4.373 3 4c0-.374.356-.875 1.318-1.313M13 5.698V7c0 .374-.356.875-1.318 1.313C10.766 8.729 9.464 9 8 9s-2.766-.27-3.682-.687C3.356 7.875 3 7.373 3 7V5.698c.271.202.58.378.904.525C4.978 6.711 6.427 7 8 7s3.022-.289 4.096-.777A5 5 0 0 0 13 5.698M14 4c0-1.007-.875-1.755-1.904-2.223C11.022 1.289 9.573 1 8 1s-3.022.289-4.096.777C2.875 2.245 2 2.993 2 4v9c0 1.007.875 1.755 1.904 2.223C4.978 15.71 6.427 16 8 16s3.022-.289 4.096-.777C13.125 14.755 14 14.007 14 13zm-1 4.698V10c0 .374-.356.875-1.318 1.313C10.766 11.729 9.464 12 8 12s-2.766-.27-3.682-.687C3.356 10.875 3 10.373 3 10V8.698c.271.202.58.378.904.525C4.978 9.71 6.427 10 8 10s3.022-.289 4.096-.777A5 5 0 0 0 13 8.698m0 3V13c0 .374-.356.875-1.318 1.313C10.766 14.729 9.464 15 8 15s-2.766-.27-3.682-.687C3.356 13.875 3 13.373 3 13v-1.302c.271.202.58.378.904.525C4.978 12.71 6.427 13 8 13s3.022-.289 4.096-.777c.324-.147.633-.323.904-.525" /></svg>),
      },
      {
            key: "13", perm: "E1", href: "/web/order", label: "วิเคราะห์ สั่งสินค้า", group: 2,
            icon: (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><path d="M12.438 1.668V7H11.39V2.684h-.051l-1.211.859v-.969l1.262-.906h1.046z" /><path fillRule="evenodd" d="M11.36 14.098c-1.137 0-1.708-.657-1.762-1.278h1.004c.058.223.343.45.773.45.824 0 1.164-.829 1.133-1.856h-.059c-.148.39-.57.742-1.261.742-.91 0-1.72-.613-1.72-1.758 0-1.148.848-1.835 1.973-1.835 1.09 0 2.063.636 2.063 2.687 0 1.867-.723 2.848-2.145 2.848zm.062-2.735c.504 0 .933-.336.933-.972 0-.633-.398-1.008-.94-1.008-.52 0-.927.375-.927 1 0 .64.418.98.934.98" /><path d="M4.5 2.5a.5.5 0 0 0-1 0v9.793l-1.146-1.147a.5.5 0 0 0-.708.708l2 1.999.007.007a.497.497 0 0 0 .7-.006l2-2a.5.5 0 0 0-.707-.708L4.5 12.293z" /></svg>),
      },
      {
            key: "4", perm: "F1", href: "/web/receives", label: "รับสินค้า", group: 2,
            badge: 'receive', badgeColor: '#EF4444',
            icon: (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><path d="m.5 3 .04.87a2 2 0 0 0-.342 1.311l.637 7A2 2 0 0 0 2.826 14H9v-1H2.826a1 1 0 0 1-.995-.91l-.637-7A1 1 0 0 1 2.19 4h11.62a1 1 0 0 1 .996 1.09L14.54 8h1.005l.256-2.819A2 2 0 0 0 13.81 3H9.828a2 2 0 0 1-1.414-.586l-.828-.828A2 2 0 0 0 6.172 1H2.5a2 2 0 0 0-2 2m5.672-1a1 1 0 0 1 .707.293L7.586 3H2.19q-.362.002-.683.12L1.5 2.98a1 1 0 0 1 1-.98z" /><path d="M13.5 9a.5.5 0 0 1 .5.5V11h1.5a.5.5 0 1 1 0 1H14v1.5a.5.5 0 1 1-1 0V12h-1.5a.5.5 0 0 1 0-1H13V9.5a.5.5 0 0 1 .5-.5" /></svg>),
      },
      {
            key: "5", perm: "G1", href: "/web/customers", label: "ข้อมูลลูกค้า", group: 3,
            icon: (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><path d="M5 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4m4-2.5a.5.5 0 0 1 .5-.5h4a.5.5 0 0 1 0 1h-4a.5.5 0 0 1-.5-.5M9 8a.5.5 0 0 1 .5-.5h4a.5.5 0 0 1 0 1h-4A.5.5 0 0 1 9 8m1 2.5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 0 1h-3a.5.5 0 0 1-.5-.5" /><path d="M2 2a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2zM1 4a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H8.96q.04-.245.04-.5C9 10.567 7.21 9 5 9c-2.086 0-3.8 1.398-3.984 3.181A1 1 0 0 1 1 12z" /></svg>),
      },
      {
            // ซ่อนเมนูติดตามอาการ (เปิดใช้อีกครั้งได้โดยลบ hidden ออก)
            key: "12", perm: "H1", href: "/web/follow", label: "ติดตามอาการ", group: 3, hidden: true,
            badge: 'follow', badgeColor: '#3E86C7',
            icon: (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><path fillRule="evenodd" d="M10.854 6.146a.5.5 0 0 1 0 .708l-3 3a.5.5 0 0 1-.708 0l-1.5-1.5a.5.5 0 1 1 .708-.708L7.5 8.793l2.646-2.647a.5.5 0 0 1 .708 0" /><path d="M3 0h10a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2v-1h1v1a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v1H1V2a2 2 0 0 1 2-2" /><path d="M1 5v-.5a.5.5 0 0 1 1 0V5h.5a.5.5 0 0 1 0 1h-2a.5.5 0 0 1 0-1zm0 3v-.5a.5.5 0 0 1 1 0V8h.5a.5.5 0 0 1 0 1h-2a.5.5 0 0 1 0-1zm0 3v-.5a.5.5 0 0 1 1 0v.5h.5a.5.5 0 0 1 0 1h-2a.5.5 0 0 1 0-1z" /></svg>),
      },
      {
            key: "6", perm: "I1", href: "/web/suppliers", label: "ข้อมูลผู้ขาย", group: 3,
            icon: (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><path d="M0 3.5A1.5 1.5 0 0 1 1.5 2h9A1.5 1.5 0 0 1 12 3.5V5h1.02a1.5 1.5 0 0 1 1.17.563l1.481 1.85a1.5 1.5 0 0 1 .329.938V10.5a1.5 1.5 0 0 1-1.5 1.5H14a2 2 0 1 1-4 0H5a2 2 0 1 1-3.998-.085A1.5 1.5 0 0 1 0 10.5zm1.294 7.456A2 2 0 0 1 4.732 11h5.536a2 2 0 0 1 .732-.732V3.5a.5.5 0 0 0-.5-.5h-9a.5.5 0 0 0-.5.5v7a.5.5 0 0 0 .294.456M12 10a2 2 0 0 1 1.732 1h.768a.5.5 0 0 0 .5-.5V8.35a.5.5 0 0 0-.11-.312l-1.48-1.85A.5.5 0 0 0 13.02 6H12zm-9 1a1 1 0 1 0 0 2 1 1 0 0 0 0-2m9 0a1 1 0 1 0 0 2 1 1 0 0 0 0-2" /></svg>),
      },
      {
            key: "7", perm: "J1", href: "/web/reports", label: "รายงาน", group: 4,
            icon: (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><path d="M5.5 7a.5.5 0 0 0 0 1h5a.5.5 0 0 0 0-1zM5 9.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5m0 2a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 0 1h-2a.5.5 0 0 1-.5-.5" /><path d="M9.5 0H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V4.5zm0 1v2A1.5 1.5 0 0 0 11 4.5h2V14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1z" /></svg>),
      },
      {
            key: "11", perm: "K1", href: "/web/document", label: "เอกสาร", group: 4,
            badge: 'doc', badgeColor: '#EF4444',
            icon: (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><path fillRule="evenodd" d="M14 4.5V14a2 2 0 0 1-2 2v-1a1 1 0 0 0 1-1V4.5h-2A1.5 1.5 0 0 1 9.5 3V1H4a1 1 0 0 0-1 1v9H2V2a2 2 0 0 1 2-2h5.5zm-7.839 9.166v.522q0 .384-.117.641a.86.86 0 0 1-.322.387.9.9 0 0 1-.469.126.9.9 0 0 1-.471-.126.87.87 0 0 1-.32-.386 1.55 1.55 0 0 1-.117-.642v-.522q0-.386.117-.641a.87.87 0 0 1 .32-.387.87.87 0 0 1 .471-.129q.264 0 .469.13a.86.86 0 0 1 .322.386q.117.255.117.641m.803.519v-.513q0-.565-.205-.972a1.46 1.46 0 0 0-.589-.63q-.381-.22-.917-.22-.533 0-.92.22a1.44 1.44 0 0 0-.589.627q-.204.406-.205.975v.513q0 .563.205.973.205.406.59.627.386.216.92.216.535 0 .916-.216.383-.22.59-.627.204-.41.204-.973M0 11.926v4h1.459q.603 0 .999-.238a1.45 1.45 0 0 0 .595-.689q.196-.45.196-1.084 0-.63-.196-1.075a1.43 1.43 0 0 0-.59-.68q-.395-.234-1.004-.234zm.791.645h.563q.371 0 .609.152a.9.9 0 0 1 .354.454q.118.302.118.753a2.3 2.3 0 0 1-.068.592 1.1 1.1 0 0 1-.196.422.8.8 0 0 1-.334.252 1.3 1.3 0 0 1-.483.082H.79V12.57Zm7.422.483a1.7 1.7 0 0 0-.103.633v.495q0 .369.103.627a.83.83 0 0 0 .298.393.85.85 0 0 0 .478.131.9.9 0 0 0 .401-.088.7.7 0 0 0 .273-.248.8.8 0 0 0 .117-.364h.765v.076a1.27 1.27 0 0 1-.226.674q-.205.29-.55.454a1.8 1.8 0 0 1-.786.164q-.54 0-.914-.216a1.4 1.4 0 0 1-.571-.627q-.194-.408-.194-.976v-.498q0-.568.197-.978.195-.411.571-.633.378-.223.911-.223.328 0 .607.097.28.093.489.272a1.33 1.33 0 0 1 .466.964v.073H9.78a.85.85 0 0 0-.12-.38.7.7 0 0 0-.273-.261.8.8 0 0 0-.398-.097.8.8 0 0 0-.475.138.87.87 0 0 0-.301.398" /></svg>),
      },
      {
            key: "8", perm: "L1", href: "/web/managements", label: "กำไร&ขาดทุน", group: 4,
            icon: (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><path d="M8 4a.5.5 0 0 1 .5.5V6a.5.5 0 0 1-1 0V4.5A.5.5 0 0 1 8 4M3.732 5.732a.5.5 0 0 1 .707 0l.915.914a.5.5 0 1 1-.708.708l-.914-.915a.5.5 0 0 1 0-.707M2 10a.5.5 0 0 1 .5-.5h1.586a.5.5 0 0 1 0 1H2.5A.5.5 0 0 1 2 10m9.5 0a.5.5 0 0 1 .5-.5h1.5a.5.5 0 0 1 0 1H12a.5.5 0 0 1-.5-.5m.754-4.246a.39.39 0 0 0-.527-.02L7.547 9.31a.91.91 0 1 0 1.302 1.258l3.434-4.297a.39.39 0 0 0-.029-.518z" /><path fillRule="evenodd" d="M0 10a8 8 0 1 1 15.547 2.661c-.442 1.253-1.845 1.602-2.932 1.25C11.309 13.488 9.475 13 8 13c-1.474 0-3.31.488-4.615.911-1.087.352-2.49.003-2.932-1.25A8 8 0 0 1 0 10m8-7a7 7 0 0 0-6.603 9.329c.203.575.923.876 1.68.63C4.397 12.533 6.358 12 8 12s3.604.532 4.923.96c.757.245 1.477-.056 1.68-.631A7 7 0 0 0 8 3" /></svg>),
      },
      {
            key: "9", perm: "M1", href: "/web/promotion", label: "โปรโมชั่น", group: 5,
            icon: (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><path d="M3 2.5a2.5 2.5 0 0 1 5 0 2.5 2.5 0 0 1 5 0v.006c0 .07 0 .27-.038.494H15a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1v7.5a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 1 14.5V7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h2.038A3 3 0 0 1 3 2.506zm1.068.5H7v-.5a1.5 1.5 0 1 0-3 0c0 .085.002.274.045.43zM9 3h2.932l.023-.07c.043-.156.045-.345.045-.43a1.5 1.5 0 0 0-3 0zM1 4v2h6V4zm8 0v2h6V4zm5 3H9v8h4.5a.5.5 0 0 0 .5-.5zm-7 8V7H2v7.5a.5.5 0 0 0 .5.5z" /></svg>),
      },
      {
            key: "10", perm: "N1", href: "/web/setting", label: "ตั้งค่า", group: 5,
            icon: (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><path d="M8 4.754a3.246 3.246 0 1 0 0 6.492 3.246 3.246 0 0 0 0-6.492M5.754 8a2.246 2.246 0 1 1 4.492 0 2.246 2.246 0 0 1-4.492 0" /><path d="M9.796 1.343c-.527-1.79-3.065-1.79-3.592 0l-.094.319a.873.873 0 0 1-1.255.52l-.292-.16c-1.64-.892-3.433.902-2.54 2.541l.159.292a.873.873 0 0 1-.52 1.255l-.319.094c-1.79.527-1.79 3.065 0 3.592l.319.094a.873.873 0 0 1 .52 1.255l-.16.292c-.892 1.64.901 3.434 2.541 2.54l.292-.159a.873.873 0 0 1 1.255.52l.094.319c.527 1.79 3.065 1.79 3.592 0l.094-.319a.873.873 0 0 1 1.255-.52l.292.16c1.64.893 3.434-.902 2.54-2.541l-.159-.292a.873.873 0 0 1 .52-1.255l.319-.094c1.79-.527 1.79-3.065 0-3.592l-.319-.094a.873.873 0 0 1-.52-1.255l.16-.292c.893-1.64-.902-3.433-2.541-2.54l-.292.159a.873.873 0 0 1-1.255-.52zm-2.633.283c.246-.835 1.428-.835 1.674 0l.094.319a1.873 1.873 0 0 0 2.693 1.115l.291-.16c.764-.415 1.6.42 1.184 1.185l-.159.292a1.873 1.873 0 0 0 1.116 2.692l.318.094c.835.246.835 1.428 0 1.674l-.319.094a1.873 1.873 0 0 0-1.115 2.693l.16.291c.415.764-.42 1.6-1.185 1.184l-.291-.159a1.873 1.873 0 0 0-2.693 1.116l-.094.318c-.246.835-1.428.835-1.674 0l-.094-.319a1.873 1.873 0 0 0-2.692-1.115l-.292.16c-.764.415-1.6-.42-1.184-1.185l.159-.291A1.873 1.873 0 0 0 1.945 8.93l-.319-.094c-.835-.246-.835-1.428 0-1.674l.319-.094A1.873 1.873 0 0 0 3.06 4.377l-.16-.292c-.415-.764.42-1.6 1.185-1.184l.292.159a1.873 1.873 0 0 0 2.692-1.115z" /></svg>),
      },
      {
            key: "15", perm: "Q1", href: "/web/sync", label: "Sync สาขา", group: 6,
            icon: (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><path d="M11.534 7h3.932a.25.25 0 0 1 .192.41l-1.966 2.36a.25.25 0 0 1-.384 0l-1.966-2.36a.25.25 0 0 1 .192-.41m-11 2h3.932a.25.25 0 0 0 .192-.41L2.692 6.23a.25.25 0 0 0-.384 0L.342 8.59A.25.25 0 0 0 .534 9" /><path fillRule="evenodd" d="M8 3c-1.552 0-2.94.707-3.857 1.818a.5.5 0 1 1-.771-.636A6.002 6.002 0 0 1 13.917 7H12.9A5 5 0 0 0 8 3M3.1 9a5.002 5.002 0 0 0 8.757 2.182.5.5 0 1 1 .771.636A6.002 6.002 0 0 1 2.083 9z" /></svg>),
      },
      {
            key: "14", perm: "O1", href: "/web/company", label: "สาขา", group: 6,
            icon: (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><path d="M4 2.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5zm3 0a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5zm3.5-.5a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5zM4 5.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5zM7.5 5a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5zm2.5.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5zM4.5 8a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5zm2.5.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5zm3.5-.5a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5z" /><path d="M2 1a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1zm11 0H3v14h3v-2.5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 .5.5V15h3z" /></svg>),
      },
      {
            key: "16", perm: "R1", href: "/web/branchtransfer", label: "โอนข้ามสาขา", group: 6,
            icon: (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><path fillRule="evenodd" d="M1 11.5a.5.5 0 0 0 .5.5h11.793l-3.147 3.146a.5.5 0 0 0 .708.708l4-4a.5.5 0 0 0 0-.708l-4-4a.5.5 0 0 0-.708.708L13.293 11H1.5a.5.5 0 0 0-.5.5m14-7a.5.5 0 0 1-.5.5H2.707l3.147 3.146a.5.5 0 1 1-.708.708l-4-4a.5.5 0 0 1 0-.708l4-4a.5.5 0 1 1 .708.708L2.707 4H14.5a.5.5 0 0 1 .5.5" /></svg>),
      },
      {
            key: "17", perm: "S1", href: "/web/branchstock", label: "Stock สาขา", group: 6,
            icon: (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><path d="M8.186 1.113a.5.5 0 0 0-.372 0L1.846 3.5l2.404.961L10.404 2zm3.564 1.426L5.596 5 8 5.961 14.154 3.5zm3.25 1.7-6.5 2.6v7.922l6.5-2.6V4.24zM7.5 14.762V6.838L1 4.239v7.923zM7.443.184a1.5 1.5 0 0 1 1.114 0l7.129 2.852A.5.5 0 0 1 16 3.5v8.662a1 1 0 0 1-.629.928l-7.185 2.874a.5.5 0 0 1-.372 0L.63 13.09a1 1 0 0 1-.63-.928V3.5a.5.5 0 0 1 .314-.464z" /></svg>),
      },
]


function MenuTab_small() {

      const [showcolor, setshowcolor] = useState("")

      useEffect(() => {
            setshowcolor(localStorage.getItem("name") || "")

            // Defer badge fetches until after first paint so the menu appears instantly.
            const runBadges = () => {
                  GetFollowBadge()
                  GetDocBadge()
                  GetReceiveBadge()
            }
            const w: any = typeof window !== 'undefined' ? window : null
            let idleId: any = null
            let timeoutId: any = null
            if (w && typeof w.requestIdleCallback === 'function') {
                  idleId = w.requestIdleCallback(runBadges, { timeout: 2000 })
            } else {
                  timeoutId = setTimeout(runBadges, 0)
            }

            const handleDocRefresh = () => { GetDocBadge() }
            window.addEventListener('docBadgeRefresh', handleDocRefresh)
            return () => {
                  window.removeEventListener('docBadgeRefresh', handleDocRefresh)
                  if (idleId && w && typeof w.cancelIdleCallback === 'function') w.cancelIdleCallback(idleId)
                  if (timeoutId) clearTimeout(timeoutId)
            }
      }, [])


      useEffect(() => {
            localStorage.setItem("name", showcolor);

      }, [showcolor])

      const { hasPermission: rawHasPermission } = usePermission()
      // Avoid SSR/client hydration mismatch: permissions read from localStorage
      // are unavailable during SSR, so gate them until after the first client
      // paint. The first client render then matches the server (all hidden),
      // and the real permission rules take over once mounted.
      const [permReady, setPermReady] = useState(false)
      useEffect(() => { setPermReady(true) }, [])
      const hasPermission = (codename: string): boolean => permReady && rawHasPermission(codename)
      const [followBadge, setFollowBadge] = useState(0)
      const [docBadge, setDocBadge] = useState(0)
      const [receiveBadge, setReceiveBadge] = useState(0)

      // ---- Collapsible sidebar ----------------------------------------------
      const rootRef = useRef<HTMLDivElement>(null)
      const sizedRef = useRef(false)
      const [collapsed, setCollapsed] = useState(false)
      const [ready, setReady] = useState(false)

      const toggleCollapsed = () => {
            setCollapsed((prev) => {
                  const next = !prev
                  try { localStorage.setItem(SIDEBAR_STORAGE_KEY, next ? "1" : "0") } catch { }
                  try { window.dispatchEvent(new CustomEvent(SIDEBAR_EVENT, { detail: next })) } catch { }
                  return next
            })
      }

      // Load the persisted preference before first paint to avoid a layout flash.
      useIsoLayoutEffect(() => {
            let stored = false
            try { stored = localStorage.getItem(SIDEBAR_STORAGE_KEY) === "1" } catch { }
            setCollapsed(stored)
            setReady(true)

            // Keep instances/pages in sync if the state changes elsewhere.
            const onSync = (e: any) => {
                  const val = e?.detail
                  if (typeof val === "boolean") setCollapsed(val)
            }
            const onStorage = (e: StorageEvent) => {
                  if (e.key === SIDEBAR_STORAGE_KEY) setCollapsed(e.newValue === "1")
            }
            window.addEventListener(SIDEBAR_EVENT, onSync as EventListener)
            window.addEventListener("storage", onStorage)
            return () => {
                  window.removeEventListener(SIDEBAR_EVENT, onSync as EventListener)
                  window.removeEventListener("storage", onStorage)
            }
      }, [])

      // Drive the width of the wrapping Bootstrap column (col-sm-1) and let the
      // sibling body column grow to reclaim the space. Works on every page because
      // they all share the same "menu column + body column" row structure.
      useIsoLayoutEffect(() => {
            if (!ready) return
            const root = rootRef.current
            const col = root?.parentElement as HTMLElement | null
            if (!col) return
            const body = col.nextElementSibling as HTMLElement | null

            const applySizing = () => {
                  const desktop = typeof window !== "undefined" &&
                        window.matchMedia("(min-width: 768px)").matches

                  if (!desktop) {
                        // Menu is hidden below md (d-none d-md-block): leave Bootstrap in charge.
                        col.style.flex = ""; col.style.maxWidth = ""; col.style.width = ""; col.style.transition = ""
                        col.style.paddingLeft = ""; col.style.paddingRight = ""
                        if (body) { body.style.flex = ""; body.style.maxWidth = ""; body.style.width = ""; body.style.minWidth = ""; body.style.transition = "" }
                        return
                  }

                  // Column = card + the gutter padding on both sides.
                  const w = (collapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_EXPANDED_WIDTH) + SIDEBAR_GUTTER * 2
                  const firstApply = !sizedRef.current

                  // No animation on the very first sizing (initial load); animate on toggles.
                  col.style.transition = firstApply ? "none" : SIDEBAR_TRANSITION
                  if (body) body.style.transition = firstApply ? "none" : SIDEBAR_TRANSITION

                  col.style.flex = `0 0 ${w}px`
                  col.style.maxWidth = `${w}px`
                  col.style.width = `${w}px`
                  col.style.paddingLeft = `${SIDEBAR_GUTTER}px`
                  col.style.paddingRight = `${SIDEBAR_GUTTER}px`
                  if (body) {
                        body.style.flex = "1 1 0"
                        body.style.maxWidth = "100%"
                        body.style.width = "auto"
                        body.style.minWidth = "0"
                  }

                  if (firstApply) {
                        void col.offsetWidth // flush before re-enabling transitions
                        col.style.transition = SIDEBAR_TRANSITION
                        if (body) body.style.transition = SIDEBAR_TRANSITION
                        sizedRef.current = true
                  }
            }

            applySizing()

            const onResize = () => applySizing()
            window.addEventListener("resize", onResize)
            return () => window.removeEventListener("resize", onResize)
      }, [collapsed, ready])
      // -----------------------------------------------------------------------

      const GetFollowBadge = async () => {
            let companyS = (localStorage.getItem("company_") || "")
            const today = new Date(); today.setHours(23, 59, 59, 999)
            const getMaxDate = (row: any) => {
                  const dates = [row.duedate, row.duedate1, row.duedate2].filter(Boolean).map((d: any) => new Date(d).getTime())
                  return dates.length > 0 ? Math.max(...dates) : null
            }
            try {
                  const [res1, res2] = await Promise.all([
                        axios.get(`/api/history/hisfollow?company=${companyS}&statusH=ติดตามผล`),
                        axios.get(`/api/history/hisfollow?company=${companyS}&statusH=รับยา`),
                  ])
                  const count1 = (res1.data || []).filter((row: any) => { const m = getMaxDate(row); return m !== null && m <= today.getTime() }).length
                  const count2 = (res2.data || []).filter((row: any) => { const m = getMaxDate(row); return m !== null && m <= today.getTime() }).length
                  setFollowBadge(count1 + count2)
            } catch (error) {
                  console.error(error)
            }
      }

      const GetDocBadge = async () => {
            let companyS = (localStorage.getItem("company_") || "")
            const today = new Date(); today.setHours(23, 59, 59, 999)
            try {
                  const res = await axios.get(`/api/quatation?companyall=${companyS}`)
                  const count = (res.data || []).filter((row: any) =>
                        row.inv_status === "รออนุมัติ" && row.inv_enddate != null && new Date(row.inv_enddate).getTime() <= today.getTime()
                  ).length
                  setDocBadge(count)
            } catch (error) {
                  console.error(error)
            }
      }

      const GetReceiveBadge = async () => {
            let companyS = (localStorage.getItem("company_") || "")
            const today = new Date(); today.setHours(0, 0, 0, 0)
            try {
                  const res = await axios.get(`/api/receive?company=${companyS}`)
                  const count = (res.data || []).filter((row: any) => {
                        const normalizedStatus = String(row.statuss || "").trim()
                        const isPaid = normalizedStatus === "ชำระเงินแล้ว"
                        if (isPaid) return false
                        if (!row.pay_date) return false
                        const dueDate = new Date(String(row.pay_date))
                        dueDate.setHours(0, 0, 0, 0)
                        return dueDate.getTime() <= today.getTime()
                  }).length
                  setReceiveBadge(count)
            } catch (error) {
                  console.error(error)
            }
      }

      const badgeValues: Record<string, number> = {
            receive: receiveBadge,
            doc: docBadge,
            follow: followBadge,
      }

      // Only the items this user may actually see — dividers are then placed
      // between the remaining groups, never at the top or bottom.
      const visibleItems = NAV_ITEMS.filter((item) => !item.hidden && hasPermission(item.perm))

      return (

            <div ref={rootRef} className={"d-none d-md-block smSidebar " + (collapsed ? "smSidebarCollapsed" : "")}>
                  <style dangerouslySetInnerHTML={{ __html: SIDEBAR_CSS }} />
                  <div>

                        <nav className="smNav" aria-label="เมนูหลัก">

                              <div className="smNavHead">
                                    <button
                                          type="button"
                                          onClick={toggleCollapsed}
                                          title={collapsed ? "ขยายเมนู" : "ย่อเมนู"}
                                          aria-label={collapsed ? "ขยายเมนู" : "ย่อเมนู"}
                                          aria-expanded={!collapsed}
                                          className="smSidebarToggle"
                                    >
                                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" aria-hidden="true">
                                                <path fillRule="evenodd" d="M8.354 1.646a.5.5 0 0 1 0 .708L2.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0" />
                                                <path fillRule="evenodd" d="M12.354 1.646a.5.5 0 0 1 0 .708L6.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0" />
                                          </svg>
                                          {!collapsed && <span>ย่อเมนู</span>}
                                    </button>
                              </div>

                              {visibleItems.map((item, i) => {
                                    const active = showcolor === item.key
                                    const badge = item.badge ? badgeValues[item.badge] : 0
                                    const newGroup = i > 0 && visibleItems[i - 1].group !== item.group

                                    return (
                                          <React.Fragment key={item.key}>
                                                {newGroup && <div className="smNavDivider" aria-hidden="true" />}
                                                <Link
                                                      href={item.href}
                                                      title={item.label}
                                                      aria-current={active ? "page" : undefined}
                                                      className={"smNavItem" + (active ? " smNavItemActive" : "")}
                                                      onClick={() => { setshowcolor(item.key); item.onClick?.() }}
                                                >
                                                      <span className="smNavIcon">{item.icon}</span>
                                                      <span className="smNavLabel">{item.label}</span>
                                                      {badge > 0 && (
                                                            <span
                                                                  className="smNavBadge"
                                                                  style={{
                                                                        backgroundColor: item.badgeColor,
                                                                        boxShadow: `0 2px 5px ${item.badgeColor}59`,
                                                                  }}
                                                            >{badge}</span>
                                                      )}
                                                </Link>
                                          </React.Fragment>
                                    )
                              })}

                        </nav>
                  </div>
            </div>




      )

}
export default MenuTab_small
