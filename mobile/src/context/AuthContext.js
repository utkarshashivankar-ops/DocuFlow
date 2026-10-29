import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authService } from '../services/authService';
import { clearToken, loadToken, saveToken } from '../services/tokenStorage';
import { setAuthToken, setUnauthorizedHandler } from '../services/api';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [booting, setBooting] = useState(true);
  const [notice, setNotice] = useState(null); // e.g. "session expired" shown on Login

  const clearSession = useCallback(async () => {
    setAuthToken(null);
    setToken(null);
    setUser(null);
    await clearToken().catch(() => {});
  }, []);

  // restore session on launch (splash is shown for at least 1.2s)
  useEffect(() => {
    let alive = true;
    const minDelay = new Promise((r) => setTimeout(r, 1200));
    (async () => {
      try {
        const stored = await loadToken();
        if (stored) {
          setAuthToken(stored);
          const me = await authService.me();
          if (alive) { setToken(stored); setUser(me); }
        }
      } catch (err) {
        // 401 -> bad/expired token; network error -> keep them signed out this launch
        if (err?.response?.status === 401) await clearSession();
        else { setAuthToken(null); }
      } finally {
        await minDelay;
        if (alive) setBooting(false);
      }
    })();
    return () => { alive = false; };
  }, [clearSession]);

  // any API call that comes back "session expired" signs the user out
  useEffect(() => {
    setUnauthorizedHandler(async (code) => {
      await clearSession();
      setNotice(code === 'TOKEN_EXPIRED' ? 'Your session has expired. Please sign in again.' : 'Please sign in again.');
    });
  }, [clearSession]);

  const startSession = useCallback(async ({ token: t, user: u }) => {
    setAuthToken(t);
    await saveToken(t);
    setToken(t);
    setUser(u);
    setNotice(null);
  }, []);

  const value = useMemo(() => ({
    user, token, booting, notice, setNotice, setUser,
    login: async (body) => startSession(await authService.login(body)),
    register: async (body) => startSession(await authService.register(body)),
    logout: async () => { await clearSession(); setNotice(null); },
  }), [user, token, booting, notice, startSession, clearSession]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
