
import React from 'react';

export const BeakerIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
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
        d="M14.25 6.087c0-.653.528-1.187 1.187-1.187h1.126c.66 0 1.187.534 1.187 1.187V15.75M14.25 6.087V15.75m0 0H4.125c-.66 0-1.187-.534-1.187-1.187V6.087c0-.653.528-1.187 1.187-1.187h10.125c.66 0 1.187.534 1.187 1.187M9.75 12.75h4.5M14.25 15.75c0 .414-.336.75-.75.75h-7.5c-.414 0-.75-.336-.75-.75V4.5m11.25 11.25c0 .414-.336.75-.75.75h-1.5a.75.75 0 0 1-.75-.75M14.25 3.75h.008v.008h-.008V3.75Z" 
    />
  </svg>
);
