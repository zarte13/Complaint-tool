/* eslint-disable @typescript-eslint/no-explicit-any */
import type { StateCreator } from 'zustand';
import { create } from 'zustand';
import { persist, type PersistOptions } from 'zustand/middleware';

export type TokenPair = {
  access_token: string;
  refresh_token: string;
  token_type?: 'bearer';
  expires_in?: number; // seconds
};

export type AuthState = {
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  login: (tokens: TokenPair) => void;
  logout: () => void;
  setAccessToken: (token: string | null) => void;
  getRole: () => string | null;
  isAdmin: () => boolean;
};

type AuthPersist = (
  config: StateCreator<AuthState>,
  options: PersistOptions<AuthState>
) => any;

export const useAuthStore = create<AuthState>()(
  (persist as unknown as AuthPersist)(
    (set, get) => ({
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      login: (tokens: TokenPair) =>
        set({
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          isAuthenticated: true,
        }),
      logout: () =>
        set({
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        }),
      setAccessToken: (token: string | null) =>
        set((state) => ({
          accessToken: token,
          isAuthenticated: Boolean(token && state.refreshToken),
        })),
      getRole: () => {
        const token = get().accessToken;
        if (!token) return null;
        try {
          const [, payloadB64] = token.split('.') as any;
          const json = JSON.parse(atob(payloadB64));
          const role = json?.role || (Array.isArray(json?.roles) ? json.roles[0] : null) || (json?.is_admin ? 'admin' : null);
          return typeof role === 'string' ? role : null;
        } catch {
          return null;
        }
      },
      isAdmin: () => {
        const role = (get() as any).getRole?.();
        return role === 'admin';
      },
    }),
    {
      name: 'auth-store',
      // Cast to satisfy TS persist type; we only store a subset
      partialize: ((state: AuthState) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      })) as unknown as (state: AuthState) => AuthState,
    }
  )
);