import { create } from "zustand";
import { authApi } from "@/lib/api/auth";
import {
  User,
  LoginRequest,
  CustomerRegisterRequest,
  CompanyRegisterRequest,
  LoginResponse,
} from "@/types/auth";

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;

  // Actions
  login: (data: LoginRequest) => Promise<User>;
  registerCustomer: (data: CustomerRegisterRequest) => Promise<User>;
  registerCompany: (data: CompanyRegisterRequest) => Promise<User>;
  logout: () => Promise<void>;
  getCurrentUser: () => Promise<User | null>;
  clearAuth: () => void;
  initializeAuth: () => Promise<void>;
  setAccessToken: (token: string | null) => void;
}

const TOKEN_KEY = "commercehub_token";

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null,
  isAuthenticated: false,
  isLoading: false,
  isInitialized: false,

  setAccessToken: (token: string | null) => {
    if (typeof window !== "undefined") {
      if (token) {
        localStorage.setItem(TOKEN_KEY, token);
      } else {
        localStorage.removeItem(TOKEN_KEY);
      }
    }
    set({ accessToken: token });
  },

  clearAuth: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(TOKEN_KEY);
    }
    set({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
    });
  },

  login: async (data: LoginRequest): Promise<User> => {
    set({ isLoading: true });
    try {
      const response: LoginResponse = await authApi.login(data);
      get().setAccessToken(response.access_token);
      set({
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
      });
      return response.user;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  registerCustomer: async (data: CustomerRegisterRequest): Promise<User> => {
    set({ isLoading: true });
    try {
      const user = await authApi.registerCustomer(data);
      set({ isLoading: false });
      return user;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  registerCompany: async (data: CompanyRegisterRequest): Promise<User> => {
    set({ isLoading: true });
    try {
      const user = await authApi.registerCompany(data);
      set({ isLoading: false });
      return user;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      await authApi.logout();
    } catch {
      // Continue clearing auth even if server logout endpoint fails
    } finally {
      get().clearAuth();
      set({ isInitialized: true, isLoading: false });
    }
  },

  getCurrentUser: async (): Promise<User | null> => {
    const token = get().accessToken || (typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null);
    if (!token) {
      get().clearAuth();
      set({ isInitialized: true });
      return null;
    }

    set({ isLoading: true });
    try {
      const user = await authApi.getCurrentUser();
      set({
        user,
        isAuthenticated: true,
        isLoading: false,
        isInitialized: true,
      });
      return user;
    } catch {
      get().clearAuth();
      set({ isInitialized: true, isLoading: false });
      return null;
    }
  },

  initializeAuth: async () => {
    if (get().isInitialized) return;
    await get().getCurrentUser();
  },
}));
