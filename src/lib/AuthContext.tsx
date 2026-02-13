/**
 * ReklamAI v2.0 — Auth Context
 * React Context replacing Supabase auth state management.
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
    authApi,
    setToken,
    getToken,
    clearToken,
    type UserResponse,
} from './api';

interface AuthState {
    user: UserResponse | null;
    token: string | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<UserResponse>;
    register: (email: string, password: string, fullName?: string) => Promise<UserResponse>;
    logout: () => void;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<UserResponse | null>(null);
    const [token, setTokenState] = useState<string | null>(getToken());
    const [loading, setLoading] = useState(true);

    // Check existing token on mount
    useEffect(() => {
        const existingToken = getToken();
        if (!existingToken) {
            setLoading(false);
            return;
        }

        authApi
            .getMe()
            .then((me) => {
                setUser(me);
                setTokenState(existingToken);
            })
            .catch(() => {
                // Token invalid/expired — clear it
                clearToken();
                setTokenState(null);
                setUser(null);
            })
            .finally(() => setLoading(false));
    }, []);

    const login = useCallback(async (email: string, password: string) => {
        const res = await authApi.login(email, password);
        setToken(res.access_token);
        setTokenState(res.access_token);
        setUser(res.user);
        return res.user;
    }, []);

    const register = useCallback(async (email: string, password: string, fullName = '') => {
        const res = await authApi.register(email, password, fullName);
        setToken(res.access_token);
        setTokenState(res.access_token);
        setUser(res.user);
        return res.user;
    }, []);

    const logout = useCallback(() => {
        clearToken();
        setTokenState(null);
        setUser(null);
    }, []);

    return (
        <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth(): AuthState {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
    return ctx;
}
