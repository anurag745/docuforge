import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '@/lib/api';

export interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  useMockMode: boolean;
  toggleMockMode: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      useMockMode: false,

      login: async (email: string, password: string) => {
        const res = await api.post('/api/auth/login', { email, password });
        const { token, user } = res.data;
        set({ user, token, isAuthenticated: true });
      },

      signup: async (name: string, email: string, password: string) => {
        const res = await api.post('/api/auth/signup', { name, email, password });
        const user = res.data;
        // Backend doesn't return a token on signup; perform login to get token
        const loginRes = await api.post('/api/auth/login', { email, password });
        const { token } = loginRes.data;
        set({ user, token, isAuthenticated: true });
      },

      logout: () => {
        set({ user: null, token: null, isAuthenticated: false });
      },

      toggleMockMode: () => set((state) => ({ useMockMode: !state.useMockMode })),
    }),
    {
      name: 'auth-storage',
    }
  )
);

// Cleanup legacy mock persisted state on startup (happens during development when the store
// previously used a mock implementation). If a mock token is found, remove the persisted
// storage and reset the store so the app will use real JWT flows.
if (typeof window !== 'undefined') {
  try {
    const state = useAuthStore.getState();
    if (state && (state.token === 'mock-token' || state.useMockMode === true)) {
      // remove persisted entry and reset to defaults
      try {
        localStorage.removeItem('auth-storage');
      } catch (e) {
        // ignore
      }
      useAuthStore.setState({ user: null, token: null, isAuthenticated: false, useMockMode: false });
    }
  } catch (e) {
    // ignore any errors during startup cleanup
  }
}
