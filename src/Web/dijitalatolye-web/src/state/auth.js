import { create } from "zustand";
import { persist } from "zustand/middleware";
export const useAuthStore = create()(persist((set) => ({
    accessToken: null,
    refreshToken: null,
    roles: [],
    email: null,
    setTokens: (access, refresh) => set({ accessToken: access, refreshToken: refresh }),
    setUser: (email, roles) => set({ email, roles }),
    logout: () => set({ accessToken: null, refreshToken: null, roles: [], email: null }),
}), { name: "dijitalatolye-auth" }));
