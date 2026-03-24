import type { LoginCredentials, LoginResponse, User } from '@/types';
import client, { unwrap } from './client';

interface BackendUser {
  id: number;
  username: string;
  role: 'admin' | 'manager';
}

interface BackendLoginData {
  token: string;
  user: BackendUser;
}

function mapUser(bu: BackendUser): User {
  return {
    id: String(bu.id),
    username: bu.username,
    name: bu.username.charAt(0).toUpperCase() + bu.username.slice(1),
    email: `${bu.username}@eztruckrepair.com`,
    role: bu.role,
    createdAt: new Date().toISOString(),
  };
}

export async function apiLogin(credentials: LoginCredentials): Promise<LoginResponse> {
  const data = await unwrap<BackendLoginData>(
    client.post('/auth/login', {
      username: credentials.username,
      password: credentials.password,
    })
  );

  return {
    user: mapUser(data.user),
    token: data.token,
  };
}

export async function apiLogout(): Promise<void> {
  // Backend doesn't have a logout endpoint — just clear local state
}

export async function apiGetCurrentUser(_token: string): Promise<User> {
  const data = await unwrap<BackendUser>(client.get('/auth/me'));
  return mapUser(data);
}
