
import React from 'react';

interface PageHeaderProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ icon, title, description }) => (
  <div className="mb-8 flex items-start gap-4">
    <div className="flex-shrink-0 flex items-center justify-center w-12 h-12 bg-primary-light text-primary rounded-lg">
      {icon}
    </div>
    <div>
      <h1 className="text-3xl font-bold text-on-surface">{title}</h1>
      <p className="text-on-surface-variant mt-1 max-w-2xl">{description}</p>
    </div>
  </div>
);