import { create } from 'zustand';

interface User {
  id: string;
  email: string;
  fullName: string;
  role: string;
}

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: User | null;
  theme: 'light' | 'dark';
  /** Base64 data URL of the user's profile picture, or null for robot avatar default */
  avatarUrl: string | null;
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  clearAuth: () => void;
  toggleTheme: () => void;
  /** Save a new profile picture (base64 data URL). Pass null to remove. */
  setAvatar: (url: string | null) => void;
}

const getAvatarKey = (userId?: string) => `avatar_${userId || 'default'}`;

export const useAuthStore = create<AuthState>((set, get) => {
  // Load initial state from local storage (safe fallback for simple agent access)
  const savedAccessToken = localStorage.getItem('accessToken');
  const savedRefreshToken = localStorage.getItem('refreshToken');
  const savedUser = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!) : null;
  const savedTheme = (localStorage.getItem('theme') as 'light' | 'dark') || 'light';

  // Load avatar for the saved user (keyed by user id)
  const savedAvatarUrl = savedUser
    ? localStorage.getItem(getAvatarKey(savedUser.id))
    : null;

  // Apply dark class to html element on load
  if (savedTheme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }

  return {
    accessToken: savedAccessToken,
    refreshToken: savedRefreshToken,
    user: savedUser,
    theme: savedTheme,
    avatarUrl: savedAvatarUrl,

    setAuth: (user, accessToken, refreshToken) => {
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(user));
      // Load this user's avatar when they log in
      const avatar = localStorage.getItem(getAvatarKey(user.id));
      set({ user, accessToken, refreshToken, avatarUrl: avatar });
    },

    clearAuth: () => {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      set({ user: null, accessToken: null, refreshToken: null, avatarUrl: null });
    },

    toggleTheme: () => {
      set((state) => {
        const nextTheme = state.theme === 'light' ? 'dark' : 'light';
        localStorage.setItem('theme', nextTheme);
        if (nextTheme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
        return { theme: nextTheme };
      });
    },

    setAvatar: (url: string | null) => {
      const userId = get().user?.id;
      if (url) {
        localStorage.setItem(getAvatarKey(userId), url);
      } else {
        localStorage.removeItem(getAvatarKey(userId));
      }
      set({ avatarUrl: url });
    },
  };
});
