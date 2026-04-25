export interface User {
  id: string;
  email: string;
  username: string;
}

export interface AuthResponse {
  message: string;
  token: string;
  user: User;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export async function register(email: string, username: string, password: string): Promise<AuthResponse> {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, username, password }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Registration failed");
  }

  return response.json();
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Login failed");
  }

  return response.json();
}

export function setToken(token: string): void {
  localStorage.setItem("auth_token", token);
}

export function getToken(): string | null {
  return localStorage.getItem("auth_token");
}

export function setUser(user: User): void {
  localStorage.setItem("auth_user", JSON.stringify(user));
}

export function getUser(): User | null {
  const userStr = localStorage.getItem("auth_user");
  return userStr ? JSON.parse(userStr) : null;
}

export function logout(): void {
  localStorage.removeItem("auth_token");
  localStorage.removeItem("auth_user");
}

export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  return !!getToken();
}
