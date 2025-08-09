
import React from 'react';

export const TrophyIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    {...props}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9a9.75 9.75 0 0 0 9 0Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 18.75c.357 0 .706.024 1.05.068a4.504 4.504 0 0 0 3.864-3.585c.216-1.018.312-2.06.312-3.117v-1.5a5.25 5.25 0 0 0-5.25-5.25h-3.375" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M5.625 18.75c-.357 0-.706.024-1.05.068a4.505 4.505 0 0 1-3.864-3.585C.504 14.187.408 13.145.408 12.098v-1.5a5.25 5.25 0 0 1 5.25-5.25h3.375" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.375 10.5h5.25" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v6" />
  </svg>
);