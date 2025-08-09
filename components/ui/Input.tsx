
import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({ label, id, className, icon, ...props }) => {
  const baseClasses = "w-full bg-surface border border-border-color rounded-md h-9 px-3 text-sm text-on-surface placeholder-on-surface-variant/70 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors duration-300";

  return (
    <div className="w-full">
      {label && <label htmlFor={id} className="block text-xs font-medium text-on-surface-variant mb-1.5">{label}</label>}
      <div className="relative">
        {icon && <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-on-surface-variant">{icon}</div>}
        <input
            id={id}
            className={`${baseClasses} ${icon ? 'pl-10' : ''} ${className || ''}`}
            {...props}
        />
      </div>
    </div>
  );
};