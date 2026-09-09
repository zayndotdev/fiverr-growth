import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

// ─── User & Context Interfaces ───────────────────────────────────────────────

export interface User {
  id: string;
  username: string;
  email: string;
  fiverr_profile_url?: string;
  fiverrProfile?: any;
  skills?: string[];
  created_at?: string;
  // Onboarding state
  onboardingCompleted: boolean;
  onboardingSkipped: boolean;
  onboardingStep: number;
  icpProfiles?: any[];
}

export interface RecommendedGig {
  title: string;
  niche: string;
  demand_score: number;
  avg_ticket_price: string;
  differentiation_angle: string;
}

export interface MarketStrategy {
  target_niches: string[];
  recommended_gigs: RecommendedGig[];
  profile_positioning: {
    recommended_title: string;
    usp: string;
    target_audience: string;
  };
  market_analysis: {
    demand_level: string;
    competition_density: string;
    pricing_strategy: string;
  };
  actionable_roadmap: string[];
  anti_patterns_to_avoid: string[];
}

export interface UserContextData {
  user_id: string;
  profile: {
    name: string;
    fiverr_profile_url: string;
    experience_level: string;
    skills: string[];
    intended_gigs: string[];
  };
  strategy: MarketStrategy;
  fiverrProfile?: any;
  onboardingStep?: number;
  marketStrategy?: any;
  updated_at: string;
}

// ─── Auth Context Type ───────────────────────────────────────────────────────

interface AuthContextType {
  user: User | null;
  token: string | null;
  userContext: UserContextData | null;
  loading: boolean;
  login: (token: string, user: User) => Promise<void>;
  register: (token: string, user: User) => Promise<void>;
  logout: () => void;
  refreshContext: () => Promise<void>;
  updateUserContext: (context: UserContextData) => void;
  updateOnboardingState: (updates: Partial<Pick<User, 'onboardingCompleted' | 'onboardingSkipped' | 'onboardingStep' | 'fiverrProfile' | 'icpProfiles'>>) => void;
  isOnboardingRequired: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ─── Normalize Backend Response ──────────────────────────────────────────────

function normalizeUser(raw: any): User {
  return {
    id: raw.id,
    username: raw.username,
    email: raw.email,
    fiverr_profile_url: raw.fiverr_profile_url || raw.fiverrUrl || undefined,
    fiverrProfile: raw.fiverrProfile || undefined,
    skills: raw.skills || raw.primarySkills || [],
    created_at: raw.created_at || raw.createdAt,
    onboardingCompleted: raw.onboardingCompleted ?? false,
    onboardingSkipped: raw.onboardingSkipped ?? false,
    onboardingStep: raw.onboardingStep ?? 1,
    icpProfiles: raw.icpProfiles || undefined,
  };
}

// ─── Auth Provider ───────────────────────────────────────────────────────────

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [userContext, setUserContext] = useState<UserContextData | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize from localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem('fg_token');
    const storedUser = localStorage.getItem('fg_user');

    if (storedToken && storedUser) {
      try {
        const parsedUser = normalizeUser(JSON.parse(storedUser));
        setToken(storedToken);
        setUser(parsedUser);
        fetchUserContext(parsedUser.id, storedToken);
      } catch (e) {
        console.error('Failed to parse stored user:', e);
        localStorage.removeItem('fg_token');
        localStorage.removeItem('fg_user');
      }
    }
    setLoading(false);
  }, []);

  const fetchUserContext = async (userId: string, authToken?: string) => {
    try {
      const headers: Record<string, string> = {};
      const tkn = authToken || token;
      if (tkn) {
        headers['Authorization'] = `Bearer ${tkn}`;
      }
      const res = await fetch(`/api/v1/strategist/context/${userId}`, { headers });
      const json = await res.json();
      if (json.success && json.data) {
        setUserContext(json.data);
      }
    } catch (err) {
      console.warn('Could not fetch user context:', err);
    }
  };

  const login = async (newToken: string, newUser: User) => {
    const normalized = normalizeUser(newUser);
    setToken(newToken);
    setUser(normalized);
    localStorage.setItem('fg_token', newToken);
    localStorage.setItem('fg_user', JSON.stringify(normalized));
    await fetchUserContext(normalized.id, newToken);
  };

  const register = async (newToken: string, newUser: User) => {
    await login(newToken, newUser);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setUserContext(null);
    localStorage.removeItem('fg_token');
    localStorage.removeItem('fg_user');
  };

  const refreshContext = useCallback(async () => {
    if (user?.id) {
      // Also re-fetch user data from /auth/me to get latest onboarding state
      try {
        const headers: Record<string, string> = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;
        const res = await fetch('/api/v1/auth/me', { headers });
        const json = await res.json();
        if (json.success && (json.data?.user || json.user)) {
          const freshUser = normalizeUser(json.data?.user || json.user);
          setUser(freshUser);
          localStorage.setItem('fg_user', JSON.stringify(freshUser));
        }
      } catch (err) {
        console.warn('Could not refresh user data:', err);
      }
      await fetchUserContext(user.id);
    }
  }, [user?.id, token]);

  const updateUserContext = (context: UserContextData) => {
    setUserContext(context);
  };

  const updateOnboardingState = (updates: Partial<Pick<User, 'onboardingCompleted' | 'onboardingSkipped' | 'onboardingStep' | 'fiverrProfile' | 'icpProfiles'>>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, ...updates };
      localStorage.setItem('fg_user', JSON.stringify(updated));
      return updated;
    });
  };

  const isOnboardingRequired = (): boolean => {
    if (!user) return false;
    return !user.onboardingCompleted && !user.onboardingSkipped;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        userContext,
        loading,
        login,
        register,
        logout,
        refreshContext,
        updateUserContext,
        updateOnboardingState,
        isOnboardingRequired,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
