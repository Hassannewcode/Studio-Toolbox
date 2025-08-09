
import React from 'react';

export const CogIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    fill="none" 
    viewBox="0 0 24 24" 
    strokeWidth={1.5} 
    stroke="currentColor" 
    {...props}
  >
    <path 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      d="M4.5 12a7.5 7.5 0 0 0 15 0m-15 0a7.5 7.5 0 1 1 15 0m-15 0H3m18 0h-1.5m-15 0a7.5 7.5 0 1 1 15 0m-15 0h-1.5m15 0h1.5m-16.5 4.979v1.5m15-1.5v1.5m-15-15v1.5m15-1.5v1.5m-13.021 1.979 1.061 1.061m10.9-1.061-1.061 1.061m-10.9 10.9 1.061-1.061m10.9 1.061-1.061-1.061M12 9.75a2.25 2.25 0 1 1 0 4.5 2.25 2.25 0 0 1 0-4.5Z" 
    />
  </svg>
);
