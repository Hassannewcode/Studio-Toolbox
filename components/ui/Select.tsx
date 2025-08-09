
import React from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  children: React.ReactNode;
}

export const Select: React.FC<SelectProps> = ({ label, id, children, className, ...props }) => {
  const baseClasses = "w-full bg-surface border border-border-color rounded-md h-9 px-3 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors duration-300";

  return (
    <div className="w-full">
      {label && <label htmlFor={id} className="block text-xs font-medium text-on-surface-variant mb-1.5">{label}</label>}
      <select
        id={id}
        className={`${baseClasses} ${className || ''}`}
        {...props}
      >
        {children}
      </select>
    </div>
  );
};