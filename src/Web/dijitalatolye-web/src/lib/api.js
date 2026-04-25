import axios from "axios";
import { useAuthStore } from "@/state/auth";
export const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL ?? "/api",
    withCredentials: false,
});
api.interceptors.request.use((config) => {
    const token = useAuthStore.getState().accessToken;
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});
let refreshing = null;
api.interceptors.response.use((resp) => resp, async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && original && !original._retried) {
        original._retried = true;
        refreshing ??= refreshAccessToken();
        const token = await refreshing;
        refreshing = null;
        if (token) {
            original.headers.Authorization = `Bearer ${token}`;
            return api.request(original);
        }
    }
    return Promise.reject(error);
});
export default api;
async function refreshAccessToken() {
    const refresh = useAuthStore.getState().refreshToken;
    if (!refresh)
        return null;
    try {
        const { data } = await axios.post(`${api.defaults.baseURL}/auth/refresh`, { refreshToken: refresh });
        useAuthStore.getState().setTokens(data.accessToken, data.refreshToken);
        return data.accessToken;
    }
    catch {
        useAuthStore.getState().logout();
        return null;
    }
}
