
import React from 'react';

export const TerminalIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
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
        d="M6.75 7.5 9 9.75l-2.25 2.25m4.5 0h4.5" 
    />
    <path 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        d="M3 6a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 6v12a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 18V6Z" 
    />
  </svg>
);
