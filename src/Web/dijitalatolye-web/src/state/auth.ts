import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  roles: string[];
  email: string | null;
  setTokens: (access: string, refresh: string) => void;
  setUser: (email: string, roles: string[]) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      roles: [],
      email: null,
      setTokens: (access, refresh) => set({ accessToken: access, refreshToken: refresh }),
      setUser: (email, roles) => set({ email, roles }),
      logout: () => set({ accessToken: null, refreshToken: null, roles: [], email: null }),
    }),
    { name: "dijitalatolye-auth" }
  )
);
