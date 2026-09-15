import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { setUnauthorizedHandler, TOKEN_KEY } from '../api/client.js';
import { authApi } from '../api/services.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(() => Boolean(localStorage.getItem(TOKEN_KEY)));

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(logout);
    if (!localStorage.getItem(TOKEN_KEY)) return;
    authApi
      .me()
      .then((res) => (res.data.role === 'admin' ? setUser(res.data) : logout()))
      .catch(logout)
      .finally(() => setLoading(false));
  }, [logout]);

  const login = async (email, password) => {
    const res = await authApi.login({ email, password });
    localStorage.setItem(TOKEN_KEY, res.data.token);
    setUser(res.data.user);
    return res.data.user;
  };

  const value = useMemo(() => ({ user, loading, login, logout }), [user, loading, logout]); // eslint-disable-line react-hooks/exhaustive-deps
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
