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
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  clearAuth: () => void;
  toggleTheme: () => void;
}

export const useAuthStore = create<AuthState>((set) => {
  // Load initial state from local storage (safe fallback for simple agent access)
  const savedAccessToken = localStorage.getItem('accessToken');
  const savedRefreshToken = localStorage.getItem('refreshToken');
  const savedUser = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!) : null;
  const savedTheme = (localStorage.getItem('theme') as 'light' | 'dark') || 'light';

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
    setAuth: (user, accessToken, refreshToken) => {
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(user));
      set({ user, accessToken, refreshToken });
    },
    clearAuth: () => {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      set({ user: null, accessToken: null, refreshToken: null });
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
  };
});
