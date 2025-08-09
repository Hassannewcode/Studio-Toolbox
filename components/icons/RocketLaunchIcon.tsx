
import React from 'react';

export const RocketLaunchIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
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
        d="M15.59 14.37a6 6 0 0 1-5.84 7.38v-4.82m5.84-2.56a6 6 0 0 0-5.84-7.38v4.82m5.84 2.56a6 6 0 0 1-8.48 0 6 6 0 0 1 8.48 0Zm-2.12-2.12a6 6 0 0 0-8.48 0" 
    />
    <path 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        d="m12 6.37 3.29 3.29-3.29 3.29m-3.29-6.58L12 9.66l-3.29 3.29" 
    />
  </svg>
);
