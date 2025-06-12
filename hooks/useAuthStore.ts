import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface User {
  id?: string;
  photoURL?: string;
  displayName?: string;
  email?: string;
}

interface AuthState {
  user: User | null;
  apartmentId: string | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setUser: (user: User | null) => void;
  setApartmentId: (apartmentId: string | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearAuth: () => void;
  
  // Selectors
  isAuthenticated: () => boolean;
  hasApartment: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      apartmentId: null,
      isLoading: false,
      error: null,

      setUser: (user) => set({ user, error: null }),
      setApartmentId: (apartmentId) => set({ apartmentId }),
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
      
      clearAuth: () => set({ 
        user: null, 
        apartmentId: null, 
        error: null, 
        isLoading: false 
      }),

      // Optimized selectors
      isAuthenticated: () => {
        const state = get();
        return !!state.user?.id;
      },
      
      hasApartment: () => {
        const state = get();
        return !!state.apartmentId;
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        apartmentId: state.apartmentId,
      }),
    }
  )
);

// Optimized selectors for components
export const useUser = () => useAuthStore((state) => state.user);
export const useApartmentId = () => useAuthStore((state) => state.apartmentId);
export const useAuthLoading = () => useAuthStore((state) => state.isLoading);
export const useAuthError = () => useAuthStore((state) => state.error);
export const useIsAuthenticated = () => useAuthStore((state) => state.isAuthenticated());
export const useHasApartment = () => useAuthStore((state) => state.hasApartment());