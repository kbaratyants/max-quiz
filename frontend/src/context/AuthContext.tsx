import { createContext } from 'react';

export interface User {
  _id: string;
  maxId: string;
  role: 'teacher' | 'student';
}

export interface AuthContextType {
  user: User | null;
  login: (maxId: string, role: 'teacher' | 'student') => Promise<any>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  login: async () => {},
  logout: () => {},
});

