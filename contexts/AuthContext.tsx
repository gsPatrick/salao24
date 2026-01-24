import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { authAPI } from '../lib/api';

// Types
interface PlanFeatures {
    ai_voice_response: boolean;
    priority_support: boolean;
    whatsapp_integration: boolean;
    financial_reports: boolean;
    marketing_campaigns: boolean;
}

interface Plan {
    id: number;
    name: string;
    features: PlanFeatures;
}

interface AuthUser {
    id: number;
    name: string;
    email: string;
    avatarUrl?: string;
    role: 'admin' | 'gerente' | 'recepcao' | 'profissional' | 'cliente';
    tenant_id: number | null;
    is_super_admin: boolean;
    plan?: Plan;
    tenant?: {
        id: number;
        name: string;
        address?: {
            latitude?: number;
            longitude?: number;
            [key: string]: any;
        };
    };
    // Additional fields used by existing frontend
    contracts?: any[];
}

interface AuthContextType {
    user: AuthUser | null;
    token: string | null;
    isAuthenticated: boolean;
    isSuperAdmin: boolean;
    isLoading: boolean;
    planFeatures: PlanFeatures | null;
    login: (email: string, password: string, rememberMe: boolean) => Promise<{ success: boolean; error?: string }>;
    logout: () => void;
    updateUser: (updates: Partial<AuthUser>) => void;
}

const defaultPlanFeatures: PlanFeatures = {
    ai_voice_response: false,
    priority_support: false,
    whatsapp_integration: false,
    financial_reports: false,
    marketing_campaigns: false,
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const logout = useCallback(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('authUser');
        localStorage.removeItem('rememberedUser');
        setToken(null);
        setUser(null);
    }, []);

    // Hydrate auth state from localStorage on mount
    useEffect(() => {
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('authUser');

        if (storedToken && storedUser) {
            try {
                const parsedUser = JSON.parse(storedUser);
                setToken(storedToken);
                setUser(parsedUser);

                // Silent validation
                authAPI.me()
                    .then(response => {
                        if (response.success) {
                            const apiUser = response.data.user || response.data;
                            const plan = response.data.plan;

                            const authUser: AuthUser = {
                                id: apiUser.id,
                                name: apiUser.name,
                                email: apiUser.email,
                                avatarUrl: apiUser.avatar_url || `https://i.pravatar.cc/150?u=${apiUser.email}`,
                                role: apiUser.role,
                                tenant_id: apiUser.tenant_id,
                                is_super_admin: apiUser.is_super_admin || false,
                                tenant: apiUser.tenant, // Pass full tenant data including address
                                plan: plan ? {
                                    id: plan.id,
                                    name: plan.name,
                                    features: {
                                        ai_voice_response: plan.ai_voice_response || false,
                                        priority_support: plan.priority_support || false,
                                        whatsapp_integration: plan.whatsapp_integration || false,
                                        financial_reports: plan.financial_reports || false,
                                        marketing_campaigns: plan.marketing_campaigns || false,
                                    },
                                } : undefined,
                                contracts: [],
                            };
                            setUser(authUser);
                            localStorage.setItem('authUser', JSON.stringify(authUser));
                        }
                    })
                    .catch(() => {
                        // If token is invalid/expired
                        logout();
                    });
            } catch (error) {
                console.error('Failed to parse stored auth data:', error);
                localStorage.removeItem('token');
                localStorage.removeItem('authUser');
            }
        }
        setIsLoading(false);
    }, [logout]);

    // Listen for logout events from API interceptor
    useEffect(() => {
        const handleLogoutEvent = () => {
            logout();
        };

        window.addEventListener('auth:logout', handleLogoutEvent);
        return () => window.removeEventListener('auth:logout', handleLogoutEvent);
    }, [logout]);

    const login = useCallback(async (email: string, password: string, rememberMe: boolean) => {
        try {
            const response = await authAPI.login({ email, password });

            if (response.success) {
                const { token: newToken, user: apiUser, plan } = response.data;

                // Map API user to AuthUser format
                const authUser: AuthUser = {
                    id: apiUser.id,
                    name: apiUser.name,
                    email: apiUser.email,
                    avatarUrl: apiUser.avatar_url || `https://i.pravatar.cc/150?u=${apiUser.email}`,
                    role: apiUser.role,
                    tenant_id: apiUser.tenant_id,
                    is_super_admin: apiUser.is_super_admin || false,
                    tenant: apiUser.tenant, // Pass full tenant data including address
                    plan: plan ? {
                        id: plan.id,
                        name: plan.name,
                        features: {
                            ai_voice_response: plan.ai_voice_response || false,
                            priority_support: plan.priority_support || false,
                            whatsapp_integration: plan.whatsapp_integration || false,
                            financial_reports: plan.financial_reports || false,
                            marketing_campaigns: plan.marketing_campaigns || false,
                        },
                    } : undefined,
                    contracts: [],
                };

                // Store auth data
                localStorage.setItem('token', newToken);
                localStorage.setItem('authUser', JSON.stringify(authUser));

                // Also store for "remember me" feature (used by LoginPage)
                if (rememberMe) {
                    localStorage.setItem('rememberedUser', JSON.stringify(authUser));
                }

                setToken(newToken);
                setUser(authUser);

                return { success: true };
            } else {
                return { success: false, error: response.message || 'Erro ao fazer login' };
            }
        } catch (error: any) {
            console.error('Login error:', error);
            const message = error.response?.data?.message || 'Erro de conexão com o servidor';
            return { success: false, error: message };
        }
    }, [logout]);

    const updateUser = useCallback((updates: Partial<AuthUser>) => {
        setUser(prev => {
            if (!prev) return null;
            const updated = { ...prev, ...updates };
            localStorage.setItem('authUser', JSON.stringify(updated));
            return updated;
        });
    }, []);

    const isAuthenticated = !!token && !!user;
    const isSuperAdmin = user?.is_super_admin || false;
    const planFeatures = user?.plan?.features || defaultPlanFeatures;

    return (
        <AuthContext.Provider
            value={{
                user,
                token,
                isAuthenticated,
                isSuperAdmin,
                isLoading,
                planFeatures,
                login,
                logout,
                updateUser,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export default AuthContext;
