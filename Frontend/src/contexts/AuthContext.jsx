import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getMe, loginUser, registerUser } from "../services/auth.js";

const AuthContext = createContext(null);

const storageKey = "webgame_token";

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem(storageKey));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(token));

  const loadUser = useCallback(async () => {
    if (!localStorage.getItem(storageKey)) {
      setUser(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const profile = await getMe();
      setUser(profile);
    } catch (err) {
      setUser(null);
      setToken(null);
      localStorage.removeItem(storageKey);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [token, loadUser]);

  const login = useCallback(async (payload) => {
    const data = await loginUser(payload);
    const nextToken = data.token;
    setToken(nextToken);
    localStorage.setItem(storageKey, nextToken);
    return data.user;
  }, []);

  const register = useCallback(async (payload) => {
    const data = await registerUser(payload);
    const nextToken = data.token;
    setToken(nextToken);
    localStorage.setItem(storageKey, nextToken);
    return data.user;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem(storageKey);
  }, []);

  const value = useMemo(
    () => ({
      token,
      user,
      loading,
      login,
      register,
      logout,
      refreshUser: () => loadUser(),
    }),
    [token, user, loading, login, register, logout, loadUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
