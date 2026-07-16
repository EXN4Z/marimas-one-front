import { createContext, useContext, useState, type ReactNode } from 'react';
import type { User } from '../types/user';
import api from '../api/axios'; // BARU: sesuaikan path kalau instance axios kamu ada di tempat lain

interface AuthContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });

  const handleSetUser = (u: User | null) => {
    setUser(u);
    if (u) {
      localStorage.setItem('user', JSON.stringify(u));
    } else {
      localStorage.removeItem('user');
    }
  };

  // UBAH: logout sekarang beneran manggil backend dulu (biar token dicabut &
  // password di-reset di server sesuai kebijakan lockout), baru bersihin localStorage.
  // Kalau API call gagal (misal koneksi putus), tetap lanjut bersihin sisi client
  // supaya user nggak nyangkut logged-in secara visual.
  const logout = async () => {
    try {
      await api.post('/logout');
    } catch (err) {
      console.error('Gagal memanggil endpoint logout, tetap logout di sisi client:', err);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, setUser: handleSetUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}