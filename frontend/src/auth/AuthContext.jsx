import { createContext, useContext, useEffect, useState } from 'react';
import client, { storage } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(storage.getUser());
  const [checking, setChecking] = useState(!!storage.getToken());

  // Tải lại trang: hỏi backend token còn hợp lệ không
  useEffect(() => {
    if (!storage.getToken()) return;
    client.get('/api/auth/me')
      .then((res) => setUser(res.data))
      .catch(() => { storage.clear(); setUser(null); })
      .finally(() => setChecking(false));
  }, []);

  const login = async (email, password) => {
    const res = await client.post('/api/auth/login', { email, password });
    const { token, ...info } = res.data;
    storage.save(token, info);
    setUser(info);
    return info;
  };

  const logout = () => {
    storage.clear();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, checking, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

// Trang chủ của từng vai trò
export function homeOf(role) {
  if (role === 'EMPLOYER') return '/employer/jobs';
  if (role === 'ADMIN') return '/admin';
  return '/student/profile';
}
