import { create } from 'zustand';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'Super Admin' | 'Agency Owner' | 'Agency Staff' | 'Business Owner';
  agencyId?: string;
}

export interface Business {
  _id: string;
  name: string;
  websiteUrl?: string;
  phone?: string;
  seoScore: number;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
  };
}

interface AppState {
  // Auth state
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  setLogin: (token: string, user: User) => void;
  logout: () => void;

  // Business state
  businesses: Business[];
  activeBusiness: Business | null;
  setBusinesses: (businesses: Business[]) => void;
  setActiveBusiness: (business: Business | null) => void;

  // UI state
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  apiBaseUrl: string;

  // Add Business Modal
  isAddBusinessOpen: boolean;
  setIsAddBusinessOpen: (open: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  // Load initial credentials if present in localStorage
  token: localStorage.getItem('lr_token'),
  user: localStorage.getItem('lr_user') ? JSON.parse(localStorage.getItem('lr_user')!) : null,
  isAuthenticated: !!localStorage.getItem('lr_token'),

  setLogin: (token, user) => {
    localStorage.setItem('lr_token', token);
    localStorage.setItem('lr_user', JSON.stringify(user));
    set({ token, user, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem('lr_token');
    localStorage.removeItem('lr_user');
    set({ token: null, user: null, isAuthenticated: false, activeBusiness: null, businesses: [] });
  },

  // Business states
  businesses: [],
  activeBusiness: null,
  setBusinesses: (businesses) => set({ businesses }),
  setActiveBusiness: (activeBusiness) => set({ activeBusiness }),

  // UI states
  isDarkMode: localStorage.getItem('lr_dark_mode') === 'true',
  toggleDarkMode: () => set((state) => {
    const nextMode = !state.isDarkMode;
    localStorage.setItem('lr_dark_mode', String(nextMode));
    if (nextMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    return { isDarkMode: nextMode };
  }),

  // Add Business Modal
  isAddBusinessOpen: false,
  setIsAddBusinessOpen: (isAddBusinessOpen) => set({ isAddBusinessOpen }),

  // Target Backend API Server
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1',
}));

// Initialize theme state on load
const currentDark = localStorage.getItem('lr_dark_mode') === 'true';
if (currentDark) {
  document.documentElement.classList.add('dark');
} else {
  document.documentElement.classList.remove('dark');
}
