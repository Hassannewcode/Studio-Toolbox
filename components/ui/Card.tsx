
import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  padding?: 'sm' | 'md' | 'lg' | 'none';
}

export const Card: React.FC<CardProps> = ({ children, className = '', padding = 'md', ...props }) => {
  const paddingClasses = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
    none: 'p-0',
  };

  return (
    <div className={`bg-surface border border-border-color rounded-lg shadow-sm ${paddingClasses[padding]} ${className}`} {...props}>
      {children}
    </div>
  );
};
