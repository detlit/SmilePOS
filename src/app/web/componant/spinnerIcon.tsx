// components/SpinnerIcon.tsx
import { Loader2 } from 'lucide-react';
import React from 'react';

interface SpinnerIconProps {
  size?: number;
  color?: string;
}

const SpinnerIcon: React.FC<SpinnerIconProps> = ({ size = 32, color = 'text-blue-500' }) => {
  return (
    <div className="flex items-center justify-center">
      <Loader2 className={`animate-spin ${color}`} style={{ width: size, height: size }} />
    </div>
  );
};

export default SpinnerIcon;
