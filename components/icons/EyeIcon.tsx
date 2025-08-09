
import React from 'react';

export const EyeIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
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
      d="M2.036 12.322a1.012 1.012 0 0 1 0-.639l4.436-7.399A1.011 1.011 0 0 1 7.25 4h9.5a1.011 1.011 0 0 1 .778.383l4.436 7.399a1.012 1.012 0 0 1 0 .639l-4.436 7.399A1.011 1.011 0 0 1 16.75 20h-9.5a1.011 1.011 0 0 1-.778-.383l-4.436-7.399Z" 
    />
    <path 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" 
    />
  </svg>
);
