import { useSyncExternalStore } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ApiError, request, setAuthToken, setOnUnauthorized } from './api';

/**
 * Auth service backed by the backend's /auth endpoints. The token is kept in
 * AsyncStorage and attached to every request by api.ts. The current user is a
 * tiny module-level store: AppNavigator reads it via useCurrentUser() to decide
 * between the Login stack and the main tabs.
 */

export type AuthUser = {
  id: number;
  email: string;
  name?: string | null;
  role: 'user' | 'admin';
  created_at: string;
};

export type RegisterInput = {
  email: string;
  password: string;
  name?: string;
};

export type LoginInput = {
  email: string;
  password: string;
};

export type DevAccount = LoginInput & { name?: string | null; role: string };

// Thrown for expected, user-facing failures (email taken, wrong password, …).
export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthError';
  }
}

const KEYS = {
  token: 'meva.auth.token',
  user: 'meva.auth.user',
} as const;

let currentUser: AuthUser | null = null;
let restored = false;
const listeners = new Set<() => void>();

function setUser(user: AuthUser | null): void {
  currentUser = user;
  listeners.forEach((l) => l());
}

/** Synchronous accessor for services that namespace storage per user. */
export function currentUserId(): number | null {
  return currentUser?.id ?? null;
}

function subscribe(l: () => void): () => void {
  listeners.add(l);
  return () => listeners.delete(l);
}

/** undefined = still restoring from storage, null = signed out. */
export function useCurrentUser(): AuthUser | null | undefined {
  return useSyncExternalStore(subscribe, () => (restored ? currentUser : undefined));
}

async function clearLocal(): Promise<void> {
  setAuthToken(null);
  setUser(null);
  await AsyncStorage.multiRemove([KEYS.token, KEYS.user]);
}

setOnUnauthorized(() => {
  clearLocal().catch(() => {});
});

async function authRequest(path: string, body: unknown): Promise<AuthUser> {
  try {
    const res = await request<{ token: string; user: AuthUser }>(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    setAuthToken(res.token);
    await AsyncStorage.multiSet([
      [KEYS.token, res.token],
      [KEYS.user, JSON.stringify(res.user)],
    ]);
    setUser(res.user);
    return res.user;
  } catch (err) {
    if (err instanceof ApiError && err.status === 0) {
      throw new AuthError('Cannot reach the server. Check the backend URL.');
    }
    throw new AuthError(err instanceof Error ? err.message : 'Something went wrong.');
  }
}

export function register(input: RegisterInput): Promise<AuthUser> {
  return authRequest('/auth/register', input);
}

export function login(input: LoginInput): Promise<AuthUser> {
  return authRequest('/auth/login', input);
}

export async function logout(): Promise<void> {
  await request<void>('/auth/logout', { method: 'POST' }).catch(() => {});
  await clearLocal();
}

/** Restores the saved session on boot. A stale token is caught by the first 401. */
export async function restoreSession(): Promise<void> {
  try {
    const [[, token], [, user]] = await AsyncStorage.multiGet([KEYS.token, KEYS.user]);
    if (token && user) {
      setAuthToken(token);
      currentUser = JSON.parse(user) as AuthUser;
    }
  } catch {
    // Unreadable storage ⇒ stay signed out.
  } finally {
    restored = true;
    setUser(currentUser);
  }
}

/** Seed accounts for the dev quick-login menu; [] when the backend has DEV_MODE off. */
export async function fetchDevAccounts(): Promise<DevAccount[]> {
  try {
    return await request<DevAccount[]>('/auth/dev-accounts');
  } catch {
    return [];
  }
}
