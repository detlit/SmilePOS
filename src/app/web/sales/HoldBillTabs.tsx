'use client';
import React, { useState, useEffect } from 'react';
import styles from "../componant/mystyle.module.css";
import { useHoldBillStore, HoldBill } from './useHoldBillStore';

interface HoldBillTabsProps {
  currentList: any[];
  currentTotal: number;
  onSwitchBill: (bill: HoldBill | null, index: number) => void;
  onHoldCurrent: () => void;
  onRemoveBill: (index: number) => void;
}

function HoldBillTabs({ currentList, currentTotal, onSwitchBill, onHoldCurrent, onRemoveBill }: HoldBillTabsProps) {
  const bills = useHoldBillStore((s) => s.bills);
  const activeIndex = useHoldBillStore((s) => s.activeIndex);

  // Prevent hydration mismatch: render nothing until client has mounted
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  // Build visible tabs: all non-null bills + next empty slot (if any and < 5)
  const tabs: { index: number; bill: HoldBill | null; isEmpty: boolean }[] = [];
  
  // Always show active tab first
  tabs.push({ index: activeIndex, bill: bills[activeIndex], isEmpty: bills[activeIndex] === null && currentList.length === 0 });

  // Then show other held bills
  for (let i = 0; i < 5; i++) {
    if (i === activeIndex) continue;
    if (bills[i] !== null) {
      tabs.push({ index: i, bill: bills[i], isEmpty: false });
    }
  }

  // Show one "+" button if there are empty slots left and current tab has items
  const hasEmptySlot = bills.some((b, i) => b === null && i !== activeIndex);
  const canHold = currentList.length > 0 && hasEmptySlot;

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  };

  const formatMoney = (n: number) => {
    return n.toLocaleString('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  };

  if (!mounted) return <div className={styles.holdBillTabBar} />;

  return (
    <div className={styles.holdBillTabBar}>
      {tabs.map((tab) => {
        const isActive = tab.index === activeIndex;
        const bill = tab.bill;
        const itemCount = isActive ? currentList.length : (bill?.itemCount || 0);
        const total = isActive ? currentTotal : (bill?.total || 0);
        const hasItems = itemCount > 0;

        return (
          <div
            key={tab.index}
            className={`${styles.holdBillTab} ${isActive ? styles.holdBillTabActive : ''} ${!hasItems && isActive ? styles.holdBillTabEmpty : ''}`}
            onClick={() => {
              if (!isActive) onSwitchBill(bill, tab.index);
            }}
          >
            <div className={styles.holdBillTabHeader}>
              <span className={styles.holdBillTabLabel}>
                บิล {tab.index + 1}
              </span>
              {hasItems && (
                <span className={styles.holdBillTabBadge}>
                  {itemCount}
                </span>
              )}
              {/* Close button for non-active tabs with items */}
              {!isActive && hasItems && (
                <button
                  className={styles.holdBillTabClose}
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveBill(tab.index);
                  }}
                  title="ลบบิลนี้"
                >
                  ×
                </button>
              )}
            </div>
            {hasItems && (
              <div className={styles.holdBillTabInfo}>
                <span className={styles.holdBillTabTotal}>฿{formatMoney(total)}</span>
                {!isActive && bill?.timestamp && (
                  <span className={styles.holdBillTabTime}>{formatTime(bill.timestamp)}</span>
                )}
              </div>
            )}
            {!hasItems && isActive && (
              <div className={styles.holdBillTabInfo}>
                <span className={styles.holdBillTabEmptyText}>ว่าง</span>
              </div>
            )}
          </div>
        );
      })}

      {/* Add new bill "+" button */}
      {canHold && (
        <div
          className={`${styles.holdBillTab} ${styles.holdBillTabAdd}`}
          onClick={onHoldCurrent}
          title="พักบิลปัจจุบัน แล้วเปิดบิลใหม่"
        >
          <div className={styles.holdBillTabAddIcon}>+</div>
          <div className={styles.holdBillTabAddText}>พักบิล</div>
        </div>
      )}
    </div>
  );
}

export default HoldBillTabs;
