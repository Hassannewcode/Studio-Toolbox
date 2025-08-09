
import React from 'react';

interface SliderProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  value: number | string;
}

export const Slider: React.FC<SliderProps> = ({ label, value, ...props }) => {
  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-1.5">
        <label className="text-xs font-medium text-on-surface-variant">{label}</label>
        <span className="text-xs font-mono px-1.5 py-0.5 bg-surface border border-border-color rounded-md text-secondary">{value}</span>
      </div>
      <input
        type="range"
        value={value}
        className="w-full h-1.5 bg-border-color rounded-lg appearance-none cursor-pointer accent-primary"
        {...props}
      />
    </div>
  );
};