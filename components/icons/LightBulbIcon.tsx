
import React from 'react';

export const LightBulbIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
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
        d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.311a7.478 7.478 0 0 1-4.5 0M9 11.255a2.25 2.25 0 1 1 3.182-3.182m0 0A2.25 2.25 0 0 0 9 11.255m-1.888-2.651A5.25 5.25 0 0 1 12 2.25a5.25 5.25 0 0 1 4.888 6.354M12 21a2.25 2.25 0 0 1-2.25-2.25M12 18.75a2.25 2.25 0 0 0 2.25-2.25" 
    />
  </svg>
);
