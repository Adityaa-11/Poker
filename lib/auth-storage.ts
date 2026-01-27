// Simple auth storage for demo purposes
// In a real app, this would be handled by a backend auth service

interface AuthUser {
  id: string;
  name: string;
  email: string;
  password?: string; // Only for demo - never store passwords in plain text!
  authMethod: 'email' | 'google';
  createdAt: string;
}

const AUTH_STORAGE_KEY = 'poker_auth_users';

export const getAuthUsers = (): AuthUser[] => {
  if (typeof window === 'undefined') return [];
  try {
    const users = localStorage.getItem(AUTH_STORAGE_KEY);
    return users ? JSON.parse(users) : [];
  } catch {
    return [];
  }
};

export const saveAuthUser = (user: AuthUser): void => {
  if (typeof window === 'undefined') return;
  try {
    const users = getAuthUsers();
    const existingIndex = users.findIndex(u => u.email === user.email);
    
    if (existingIndex >= 0) {
      users[existingIndex] = user;
    } else {
      users.push(user);
    }
    
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(users));
  } catch (error) {
    console.error('Failed to save auth user:', error);
  }
};

export const findAuthUser = (email: string, password?: string): AuthUser | null => {
  const users = getAuthUsers();
  const user = users.find(u => u.email === email);
  
  if (!user) return null;
  
  // For Google auth, no password check needed
  if (user.authMethod === 'google') return user;
  
  // For email auth, check password (in real app, this would be hashed)
  if (user.authMethod === 'email' && password && user.password === password) {
    return user;
  }
  
  return null;
};

export const clearAuthStorage = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(AUTH_STORAGE_KEY);
}; 