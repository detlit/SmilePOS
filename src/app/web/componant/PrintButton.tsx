// components/PrintButton.tsx
'use client';

export default function PrintButton() {
  const handlePrint = () => {
    window.print();
  };

  return (
    <button onClick={handlePrint}>Print Slip</button>
  );
}