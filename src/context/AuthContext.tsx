'use client';

import { createContext, useContext, useState } from 'react';

interface User {
  name: string;
  role: 'admin' | 'member' | 'guest';
  isRWAMember: boolean;
}

interface AuthContextType {
  user: User | null;
  login: (name: string, role: 'admin' | 'member' | 'guest') => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window === 'undefined') {
      return null;
    }

    try {
      const savedUser = localStorage.getItem('rwaDashboardUser');
      return savedUser ? (JSON.parse(savedUser) as User) : null;
    } catch {
      return null;
    }
  });

  const login = (name: string, role: 'admin' | 'member' | 'guest') => {
    const newUser: User = {
      name,
      role,
      isRWAMember: role === 'admin' || role === 'member',
    };
    setUser(newUser);
    localStorage.setItem('rwaDashboardUser', JSON.stringify(newUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('rwaDashboardUser');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
