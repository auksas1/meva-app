import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Auth service.
 *
 * For now this is a LOCAL, on-device implementation backed by AsyncStorage.
 * It is NOT secure (passwords are only lightly obfuscated) and is meant for
 * the university demo. The public functions below — register / login / logout /
 * getCurrentUser — are the stable interface the screens use.
 *
 * To switch to a real backend later, replace ONLY the bodies of these functions
 * with HTTP calls (e.g. POST /auth/register, POST /auth/login) and persist the
 * returned token instead of the local user list. The screens won't need to change.
 */

export type AuthUser = {
  id: string;
  email: string;
  name?: string;
  createdAt: string;
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

// Thrown for expected, user-facing failures (email taken, wrong password, …).
export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthError';
  }
}

const KEYS = {
  users: 'meva.auth.users',
  currentUserId: 'meva.auth.current_user_id',
} as const;

// Stored shape — keeps the (obfuscated) password out of the public AuthUser type.
type StoredUser = AuthUser & { passwordHash: string };

const MIN_PASSWORD_LENGTH = 6;

/**
 * Tiny non-cryptographic hash. This only avoids storing the raw password in
 * AsyncStorage during the demo — it provides NO real security. A real backend
 * must use a proper password hash (bcrypt/argon2).
 */
function hashPassword(password: string): string {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    hash = (hash << 5) - hash + password.charCodeAt(i);
    hash |= 0; // force 32-bit int
  }
  return `h${hash}`;
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function toPublic(user: StoredUser): AuthUser {
  const { passwordHash, ...pub } = user;
  void passwordHash;
  return pub;
}

async function readUsers(): Promise<StoredUser[]> {
  const raw = await AsyncStorage.getItem(KEYS.users);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as StoredUser[]) : [];
  } catch {
    return [];
  }
}

async function writeUsers(users: StoredUser[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.users, JSON.stringify(users));
}

export async function register(input: RegisterInput): Promise<AuthUser> {
  const email = normalizeEmail(input.email);
  const name = input.name?.trim();

  if (!isValidEmail(email)) {
    throw new AuthError('Please enter a valid email address.');
  }
  if (input.password.length < MIN_PASSWORD_LENGTH) {
    throw new AuthError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
  }

  const users = await readUsers();
  if (users.some((u) => u.email === email)) {
    throw new AuthError('An account with this email already exists.');
  }

  const user: StoredUser = {
    id: `${Date.now()}-${Math.floor(Math.random() * 100000)}`,
    email,
    name: name && name.length > 0 ? name : undefined,
    createdAt: new Date().toISOString(),
    passwordHash: hashPassword(input.password),
  };

  users.push(user);
  await writeUsers(users);
  await AsyncStorage.setItem(KEYS.currentUserId, user.id);

  return toPublic(user);
}

export async function login(input: LoginInput): Promise<AuthUser> {
  const email = normalizeEmail(input.email);

  const users = await readUsers();
  const user = users.find((u) => u.email === email);
  if (!user || user.passwordHash !== hashPassword(input.password)) {
    throw new AuthError('Incorrect email or password.');
  }

  await AsyncStorage.setItem(KEYS.currentUserId, user.id);
  return toPublic(user);
}

export async function logout(): Promise<void> {
  await AsyncStorage.removeItem(KEYS.currentUserId);
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const id = await AsyncStorage.getItem(KEYS.currentUserId);
  if (!id) return null;
  const users = await readUsers();
  const user = users.find((u) => u.id === id);
  return user ? toPublic(user) : null;
}
