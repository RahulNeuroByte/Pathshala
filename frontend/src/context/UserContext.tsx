import React, { createContext, useContext, useState, useEffect } from 'react';

export type UserRole = 'admin' | 'hod' | 'faculty' | 'student' | 'principal' | 'librarian' | 'class_counsellor';

interface UserContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
  isAuthenticated: boolean;
  login: (role: UserRole, token?: string) => void;
  logout: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [role, setRoleState] = useState<UserRole>(() => {
    const savedRole = localStorage.getItem('user_role');
    return (savedRole as UserRole) || 'admin';
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return !!localStorage.getItem('access_token');
  });

  const setRole = (newRole: UserRole) => {
    setRoleState(newRole);
    localStorage.setItem('user_role', newRole);
  };

  const login = (selectedRole: UserRole, token?: string) => {
    localStorage.setItem('access_token', token || 'mock-token-for-' + selectedRole);
    setRole(selectedRole);
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_role');
    setIsAuthenticated(false);
  };

  return (
    <UserContext.Provider value={{ role, setRole, isAuthenticated, login, logout }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
