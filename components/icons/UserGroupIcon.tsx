
import React from 'react';

export const UserGroupIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
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
        d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m-7.5-2.226A3 3 0 0 1 18 15.72V18" 
    />
    <path 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        d="M6.84 15.721A3 3 0 0 0 10.5 18v-2.28a4.5 4.5 0 0 1 .38-1.84 7.5 7.5 0 0 1 10.638 7.53" 
    />
    <path 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        d="M6 21a2.25 2.25 0 0 1-2.25-2.25V15a2.25 2.25 0 0 1 2.25-2.25h1.5A2.25 2.25 0 0 1 9.75 15v.75" 
    />
    <path 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        d="M13.5 9a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm-4.5 6.75a3.375 3.375 0 0 1 6.75 0 3.375 3.375 0 0 1-6.75 0Z" 
    />
  </svg>
);
