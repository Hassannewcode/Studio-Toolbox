
import React from 'react';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}

export const Textarea: React.FC<TextareaProps> = ({ label, id, className, ...props }) => {
  const baseClasses = "w-full bg-surface border border-border-color rounded-md px-3 py-2 text-sm text-on-surface placeholder-on-surface-variant/70 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors duration-300";
  
  return (
    <div className="w-full h-full flex flex-col">
      {label && <label htmlFor={id} className="block text-xs font-medium text-on-surface-variant mb-1.5">{label}</label>}
      <textarea
        id={id}
        className={`${baseClasses} ${className || ''} flex-grow`}
        {...props}
      />
    </div>
  );
};