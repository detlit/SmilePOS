import React from 'react';
import {QRCodeCanvas} from 'qrcode.react';
import PromptPay from 'promptpay-qr';

interface Props {
  promptPayId: string;
  amount: number;
  size?: number;
}

const PromptPayQRCode: React.FC<Props> = ({ promptPayId, amount, size = 200 }) => {
  // สร้าง QR string
  const qrString = PromptPay(promptPayId, { amount });

  return (
    <div style={{ textAlign: 'center' }}>
      <QRCodeCanvas value={qrString} size={size} />
      <div  style={{fontFamily:"kanit_B",fontSize:28,textAlign:"center",color: "#2A6AAA"}}>ยอดโอน {amount} บาท</div>
      <div style={{fontFamily:"kanit",fontSize:19,textAlign:"center"}}>promptPay {promptPayId} </div>
    </div>
  );
};

export default PromptPayQRCode;