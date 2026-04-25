export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  const token = localStorage.getItem('token');
  return !!token;
}

export function getUser(): { id: string; email: string; name: string } | null {
  if (typeof window === 'undefined') return null;
  const userStr = localStorage.getItem('user');
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
}

export function login(email: string, password: string): void {
  // Mock login for demo mode
  if (typeof window === 'undefined') return;
  
  // For demo, accept any email/password
  const user = {
    id: 'demo-user-id',
    email,
    name: email.split('@')[0]
  };
  
  localStorage.setItem('token', 'demo-token');
  localStorage.setItem('user', JSON.stringify(user));
}

export function logout(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}
