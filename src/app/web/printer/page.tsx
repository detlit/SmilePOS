"use client";
import { useState } from "react";

export default function Home() {
  const [texts, setTexts] = useState<string[]>(["สวัสดี"]);
  const [copies, setCopies] = useState(1);

  const handlePrint = async () => {
    await fetch("/api/print", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ texts, copies }),
    });
    alert("ส่งคำสั่งพิมพ์แล้ว!");
  };

  return (
    <div className="p-5">
      <h1>Print Label Xprinter 420B (USB + Thai)</h1>
      {texts.map((text, i) => (
        <input
          key={i}
          type="text"
          value={text}
          onChange={(e) => {
            const newTexts = [...texts];
            newTexts[i] = e.target.value;
            setTexts(newTexts);
          }}
          className="border p-2 m-2 block"
        />
      ))}
      <button
        onClick={() => setTexts([...texts, ""])}
        className="bg-gray-300 p-2 m-2"
      >
        เพิ่มหน้า
      </button>

      <input
        type="number"
        min={1}
        value={copies}
        onChange={(e) => setCopies(Number(e.target.value))}
        className="border p-2 m-2"
      />
      <button
        onClick={handlePrint}
        className="bg-blue-500 text-white p-2 m-2"
      >
        Print
      </button>
    </div>
  );
}

