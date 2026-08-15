// components/LoadingOverlay.tsx
import SpinnerIcon from './spinnerIcon';

export default function LoadingOverlay({ show }: { show: boolean }) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex flex-col items-center justify-center z-50">
      <SpinnerIcon size={48} color="text-white" />
      <p className="text-white mt-3">กำลังโหลดข้อมูล...</p>
    </div>
  );
}
