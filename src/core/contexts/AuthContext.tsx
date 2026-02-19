import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type UserRole = 'admin' | 'manager' | 'agent';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  permissions: string[];
  isVerified: boolean;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  users: User[];
  login: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
  signup: (userData: { name: string; email: string; password: string }) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
  verifyManager: (userId: string) => void;
  rejectManager: (userId: string) => void;
  updateUserPermissions: (userId: string, permissions: string[]) => void;
  createAgent: (userData: { name: string; email: string; permissions: string[] }) => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const mockPasswords: Record<string, string> = {
  'admin@fasi.com': 'admin123',
  'john@company.com': 'manager123',
  'sarah@company.com': 'agent123',
};

const defaultUsers: User[] = [
  { id: '1', name: 'Admin FASI', email: 'admin@fasi.com', role: 'admin', permissions: ['all'], isVerified: true, createdAt: new Date().toISOString() },
  { id: '2', name: 'John Manager', email: 'john@company.com', role: 'manager', permissions: ['all'], isVerified: true, createdAt: new Date().toISOString() },
  { id: '3', name: 'Sarah Agent', email: 'sarah@company.com', role: 'agent', permissions: ['view-dashboard', 'view-sales', 'view-inventory'], isVerified: true, createdAt: new Date().toISOString() },
];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>(defaultUsers);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStoredUser();
  }, []);

  const loadStoredUser = async () => {
    try {
      const stored = await AsyncStorage.getItem('fasi_user');
      if (stored) setUser(JSON.parse(stored));
    } catch (e) {
      console.error('Error loading user:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<{ success: boolean; message: string }> => {
    await new Promise(resolve => setTimeout(resolve, 600));

    const foundUser = users.find(u => u.email === email);
    if (!foundUser) return { success: false, message: 'User not found' };
    if (mockPasswords[email] !== password) return { success: false, message: 'Invalid password' };
    if (foundUser.role === 'manager' && !foundUser.isVerified) {
      return { success: false, message: 'Your account is pending admin verification' };
    }

    setUser(foundUser);
    await AsyncStorage.setItem('fasi_user', JSON.stringify(foundUser));
    return { success: true, message: 'Welcome back, ' + foundUser.name + '!' };
  };

  const signup = async (userData: { name: string; email: string; password: string }): Promise<{ success: boolean; message: string }> => {
    await new Promise(resolve => setTimeout(resolve, 600));

    if (users.find(u => u.email === userData.email)) {
      return { success: false, message: 'Email already registered' };
    }

    const newUser: User = {
      id: Date.now().toString(),
      name: userData.name,
      email: userData.email,
      role: 'manager',
      permissions: [],
      isVerified: false,
      createdAt: new Date().toISOString(),
    };

    mockPasswords[userData.email] = userData.password;
    setUsers([...users, newUser]);
    return { success: true, message: 'Account created! Please wait for admin verification.' };
  };

  const logout = async () => {
    setUser(null);
    await AsyncStorage.removeItem('fasi_user');
  };

  const verifyManager = (userId: string) => {
    setUsers(users.map(u =>
      u.id === userId ? { ...u, isVerified: true, permissions: ['all'] } : u
    ));
  };

  const rejectManager = (userId: string) => {
    setUsers(users.filter(u => u.id !== userId));
  };

  const updateUserPermissions = (userId: string, permissions: string[]) => {
    setUsers(users.map(u => u.id === userId ? { ...u, permissions } : u));
    if (user?.id === userId) {
      const updated = { ...user, permissions };
      setUser(updated);
      AsyncStorage.setItem('fasi_user', JSON.stringify(updated));
    }
  };

  const createAgent = (userData: { name: string; email: string; permissions: string[] }) => {
    const newAgent: User = {
      id: Date.now().toString(),
      name: userData.name,
      email: userData.email,
      role: 'agent',
      permissions: userData.permissions,
      isVerified: true,
      createdAt: new Date().toISOString(),
    };
    mockPasswords[userData.email] = 'agent123';
    setUsers([...users, newAgent]);
  };

  return (
    <AuthContext.Provider value={{ user, users, login, signup, logout, verifyManager, rejectManager, updateUserPermissions, createAgent, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
