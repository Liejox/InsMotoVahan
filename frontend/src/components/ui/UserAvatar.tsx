import React from 'react';
import { RobotAvatar } from './RobotAvatar';
import { useAuthStore } from '../../store/authStore';

interface UserAvatarProps {
  /** 'sm' = 32px (navbar), 'md' = 40px (sidebar), 'lg' = 120px (hero / profile page) */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeMap = {
  sm: { px: 32, robotPx: 28 },
  md: { px: 40, robotPx: 36 },
  lg: { px: 120, robotPx: 108 },
  xl: { px: 160, robotPx: 144 },
};

/**
 * UserAvatar — Shows the logged-in user's uploaded profile photo, or
 * the animated RobotAvatar if none has been set.
 */
export const UserAvatar: React.FC<UserAvatarProps> = ({ size = 'md', className = '' }) => {
  const { avatarUrl } = useAuthStore();
  const { px, robotPx } = sizeMap[size];

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt="Profile"
        width={px}
        height={px}
        style={{ width: px, height: px }}
        className={`rounded-full object-cover flex-shrink-0 ring-2 ring-brand-500/30 ${className}`}
      />
    );
  }

  // Fallback: animated robot
  return (
    <div
      style={{ width: px, height: px }}
      className={`flex items-center justify-center rounded-full bg-indigo-950/60 flex-shrink-0 ring-2 ring-indigo-500/30 ${className}`}
    >
      <RobotAvatar size={robotPx} />
    </div>
  );
};

export default UserAvatar;
