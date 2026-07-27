import React from 'react';

interface RobotAvatarProps {
  size?: number;
  className?: string;
}

/**
 * RobotAvatar — An animated SVG robot face used as the default user avatar.
 * Animations: subtle floating, eye-blink, and antenna pulse.
 */
export const RobotAvatar: React.FC<RobotAvatarProps> = ({ size = 40, className = '' }) => {
  const uniqueId = React.useId().replace(/:/g, '');

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Default robot avatar"
      style={{ display: 'block' }}
    >
      <defs>
        <style>{`
          @keyframes robot-float-${uniqueId} {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-3px); }
          }
          @keyframes robot-blink-${uniqueId} {
            0%, 90%, 100% { transform: scaleY(1); }
            95% { transform: scaleY(0.1); }
          }
          @keyframes robot-pulse-${uniqueId} {
            0%, 100% { opacity: 1; r: 3; }
            50% { opacity: 0.4; r: 4; }
          }
          @keyframes robot-glow-${uniqueId} {
            0%, 100% { opacity: 0.6; }
            50% { opacity: 1; }
          }
          .robot-body-${uniqueId} {
            animation: robot-float-${uniqueId} 3s ease-in-out infinite;
            transform-origin: 50% 50%;
          }
          .robot-eye-left-${uniqueId} {
            animation: robot-blink-${uniqueId} 4s ease-in-out infinite;
            transform-origin: 35px 46px;
          }
          .robot-eye-right-${uniqueId} {
            animation: robot-blink-${uniqueId} 4s ease-in-out infinite 0.1s;
            transform-origin: 65px 46px;
          }
          .robot-antenna-dot-${uniqueId} {
            animation: robot-pulse-${uniqueId} 2s ease-in-out infinite;
          }
          .robot-mouth-glow-${uniqueId} {
            animation: robot-glow-${uniqueId} 2.5s ease-in-out infinite;
          }
        `}</style>

        {/* Radial gradient for head */}
        <radialGradient id={`grad-head-${uniqueId}`} cx="40%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#312e81" />
        </radialGradient>

        {/* Radial gradient for body */}
        <radialGradient id={`grad-body-${uniqueId}`} cx="40%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#4f46e5" />
          <stop offset="100%" stopColor="#1e1b4b" />
        </radialGradient>

        {/* Eye glow filter */}
        <filter id={`eye-glow-${uniqueId}`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>

        {/* Antenna glow filter */}
        <filter id={`ant-glow-${uniqueId}`}>
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* === Floating body group === */}
      <g className={`robot-body-${uniqueId}`}>

        {/* Antenna stem */}
        <line x1="50" y1="18" x2="50" y2="28" stroke="#818cf8" strokeWidth="2" strokeLinecap="round" />

        {/* Antenna dot (pulsing) */}
        <circle
          cx="50" cy="14"
          r="4"
          fill="#a5b4fc"
          filter={`url(#ant-glow-${uniqueId})`}
          className={`robot-antenna-dot-${uniqueId}`}
        />

        {/* Head */}
        <rect
          x="22" y="28"
          width="56" height="44"
          rx="12" ry="12"
          fill={`url(#grad-head-${uniqueId})`}
          stroke="#6366f1"
          strokeWidth="1.5"
        />

        {/* Left eye (with blink) */}
        <g className={`robot-eye-left-${uniqueId}`}>
          <ellipse cx="35" cy="46" rx="7" ry="7" fill="#0ea5e9" filter={`url(#eye-glow-${uniqueId})`} />
          <circle cx="35" cy="46" r="3.5" fill="#e0f2fe" />
          <circle cx="36.5" cy="44.5" r="1.2" fill="white" />
        </g>

        {/* Right eye (with blink) */}
        <g className={`robot-eye-right-${uniqueId}`}>
          <ellipse cx="65" cy="46" rx="7" ry="7" fill="#0ea5e9" filter={`url(#eye-glow-${uniqueId})`} />
          <circle cx="65" cy="46" r="3.5" fill="#e0f2fe" />
          <circle cx="66.5" cy="44.5" r="1.2" fill="white" />
        </g>

        {/* Mouth LED strip */}
        <rect
          x="33" y="61"
          width="34" height="5"
          rx="2.5"
          fill="#22d3ee"
          opacity="0.85"
          className={`robot-mouth-glow-${uniqueId}`}
          filter={`url(#eye-glow-${uniqueId})`}
        />
        {/* Mouth pixels */}
        <rect x="36" y="62" width="5" height="3" rx="1" fill="#67e8f9" />
        <rect x="44" y="62" width="5" height="3" rx="1" fill="#67e8f9" />
        <rect x="52" y="62" width="5" height="3" rx="1" fill="#67e8f9" />
        <rect x="60" y="62" width="5" height="3" rx="1" fill="#67e8f9" />

        {/* Body panel */}
        <rect
          x="28" y="74"
          width="44" height="18"
          rx="8" ry="8"
          fill={`url(#grad-body-${uniqueId})`}
          stroke="#4f46e5"
          strokeWidth="1.5"
        />

        {/* Body detail — chest dots */}
        <circle cx="42" cy="83" r="3" fill="#818cf8" />
        <circle cx="50" cy="83" r="3" fill="#a5b4fc" />
        <circle cx="58" cy="83" r="3" fill="#818cf8" />

        {/* Left ear nub */}
        <rect x="16" y="38" width="8" height="14" rx="4" fill="#4f46e5" stroke="#6366f1" strokeWidth="1" />
        {/* Right ear nub */}
        <rect x="76" y="38" width="8" height="14" rx="4" fill="#4f46e5" stroke="#6366f1" strokeWidth="1" />
      </g>
    </svg>
  );
};

export default RobotAvatar;
