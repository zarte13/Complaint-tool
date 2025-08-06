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
};

type AuthPersist = (
  config: StateCreator<AuthState, [['zustand/immer', never]], []> | StateCreator<AuthState>,
  options: PersistOptions<AuthState>
) => any;

export const useAuthStore = create<AuthState>()(
  (persist as unknown as AuthPersist)(
    (set: (partial: Partial<AuthState> | ((state: AuthState) => Partial<AuthState>), replace?: boolean) => void, get: () => AuthState) => ({
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
    }),
    {
      name: 'auth-store',
      partialize: (state: AuthState) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);