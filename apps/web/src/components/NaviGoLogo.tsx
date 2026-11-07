import React from 'react';

interface NaviGoLogoProps {
  className?: string;
  size?: number;
}

export const NaviGoLogo: React.FC<NaviGoLogoProps> = ({ className = 'w-10 h-10', size }) => {
  return (
    <svg 
      viewBox="0 0 40 40" 
      width={size} 
      height={size} 
      className={className} 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Rich dark metallic carbon squircle background */}
        <linearGradient id="navigo-bg-grad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1E293B" />
          <stop offset="50%" stopColor="#0F172A" />
          <stop offset="100%" stopColor="#020617" />
        </linearGradient>
        {/* Subtle glass border rim */}
        <linearGradient id="navigo-rim-grad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="rgba(255, 255, 255, 0.35)" />
          <stop offset="100%" stopColor="rgba(255, 255, 255, 0.05)" />
        </linearGradient>
        {/* Dynamic supersonic navigation arrow - top blade (radiant amber to neon orange) */}
        <linearGradient id="navigo-top-blade" x1="11" y1="17" x2="29" y2="9" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFA000" />
          <stop offset="100%" stopColor="#FF5722" />
        </linearGradient>
        {/* Dynamic supersonic navigation arrow - bottom blade (vivid fiery red to crimson ruby) */}
        <linearGradient id="navigo-bot-blade" x1="18" y1="19" x2="21" y2="28" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FF3D00" />
          <stop offset="100%" stopColor="#E11D48" />
        </linearGradient>
        {/* Highway velocity speed trajectory line */}
        <linearGradient id="navigo-trail-grad" x1="8" y1="30" x2="18" y2="19" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#E11D48" />
          <stop offset="60%" stopColor="#FF5722" />
          <stop offset="100%" stopColor="#FFB300" />
        </linearGradient>
        {/* High-definition drop shadow for depth */}
        <filter id="navigo-arrow-depth" x="5" y="5" width="30" height="30" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="2" stdDeviation="1.8" floodColor="#FF3D00" floodOpacity="0.45" />
        </filter>
      </defs>

      {/* Dark squircle container badge */}
      <rect width="40" height="40" rx="10" fill="url(#navigo-bg-grad)" />
      <rect x="0.5" y="0.5" width="39" height="39" rx="9.5" stroke="url(#navigo-rim-grad)" strokeWidth="1" />

      {/* Highway GPS Route Origin Pulse & Trail */}
      <circle cx="8.5" cy="29.5" r="3.5" fill="#E11D48" fillOpacity="0.3" />
      <circle cx="8.5" cy="29.5" r="1.8" fill="#FF5722" />
      <path 
        d="M8.5 29.5 C 11 25.5, 14 22.5, 18 19.2" 
        stroke="url(#navigo-trail-grad)" 
        strokeWidth="2.8" 
        strokeLinecap="round" 
      />

      {/* 3D Dynamic Faceted Supersonic Arrow */}
      <g filter="url(#navigo-arrow-depth)">
        {/* Upper blade (lit facet) */}
        <path d="M29 9 L11 17 L18 19.2 Z" fill="url(#navigo-top-blade)" />
        {/* Lower blade (shadow facet) */}
        <path d="M29 9 L18 19.2 L21 28 Z" fill="url(#navigo-bot-blade)" />
        {/* Crisp Central Ridge Specular Line */}
        <path d="M18 19.2 L29 9" stroke="rgba(255, 255, 255, 0.45)" strokeWidth="0.75" strokeLinecap="round" />
      </g>

      {/* Arrow Forward Beacon Star Flare */}
      <circle cx="28.5" cy="9.5" r="1.3" fill="#FFFFFF" />
    </svg>
  );
};
