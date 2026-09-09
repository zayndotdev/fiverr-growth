import React, { createContext, useContext, useState, useEffect } from 'react';

export interface User {
  id: string;
  username: string;
  email: string;
  fiverr_profile_url?: string;
  fiverrProfile?: any;
  skills?: string[];
  created_at?: string;
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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

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
        const parsedUser = JSON.parse(storedUser);
        setToken(storedToken);
        setUser(parsedUser);
        fetchUserContext(parsedUser.id);
      } catch (e) {
        console.error('Failed to parse stored user:', e);
        localStorage.removeItem('fg_token');
        localStorage.removeItem('fg_user');
      }
    }
    setLoading(false);
  }, []);

  const fetchUserContext = async (userId: string) => {
    try {
      const res = await fetch(`/api/v1/strategist/context/${userId}`);
      const json = await res.json();
      if (json.success && json.data) {
        setUserContext(json.data);
      }
    } catch (err) {
      console.warn('Could not fetch user context:', err);
    }
  };

  const login = async (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('fg_token', newToken);
    localStorage.setItem('fg_user', JSON.stringify(newUser));
    await fetchUserContext(newUser.id);
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

  const refreshContext = async () => {
    if (user?.id) {
      await fetchUserContext(user.id);
    }
  };

  const updateUserContext = (context: UserContextData) => {
    setUserContext(context);
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
