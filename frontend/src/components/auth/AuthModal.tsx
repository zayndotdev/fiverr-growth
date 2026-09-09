import React, { useState } from 'react';
import { X, Lock, Mail, User as UserIcon, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: 'login' | 'register';
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, defaultMode = 'register' }) => {
  const [mode, setMode] = useState<'login' | 'register'>(defaultMode);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { login, register } = useAuth();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const endpoint = mode === 'register' ? '/api/v1/auth/register' : '/api/v1/auth/login';
      const payload = mode === 'register'
        ? { username, email, password }
        : { email, password };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!json.success) {
        throw new Error(json.error || 'Authentication failed');
      }

      const receivedToken = json.data?.token || json.token;
      const receivedUser = json.data?.user || json.user;

      if (!receivedToken || !receivedUser) {
        throw new Error('Authentication succeeded but token or user data was missing.');
      }

      if (mode === 'register') {
        await register(receivedToken, receivedUser);
      } else {
        await login(receivedToken, receivedUser);
      }

      onClose();
    } catch (err: any) {
      setError(err.message || 'An error occurred during authentication');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-white p-6 md:p-8 rounded-xl border border-[#dadbdd] shadow-2xl text-[#222325]">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#74767e] hover:text-[#222325] p-1 rounded-lg hover:bg-[#f5f5f5] transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-10 h-10 rounded-full bg-[#1dbf73]/10 flex items-center justify-center mx-auto mb-3">
            <span className="font-bold text-[#1dbf73] text-lg">f<span className="text-[#222325]">.</span></span>
          </div>
          <h2 className="text-xl font-bold text-[#222325]">
            {mode === 'register' ? 'Join FiverrGrowth Platform' : 'Welcome Back'}
          </h2>
          <p className="text-xs text-[#74767e] mt-1">
            {mode === 'register'
              ? 'Save your verified Fiverr intelligence, profile data, and growth roadmap.'
              : 'Sign in to access your saved gigs, briefs radar, and market strategies.'}
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex bg-[#f5f5f5] p-1 rounded-lg border border-[#dadbdd] mb-5">
          <button
            type="button"
            onClick={() => { setMode('register'); setError(null); }}
            className={`flex-1 py-1.5 text-xs font-bold rounded transition-all cursor-pointer ${
              mode === 'register'
                ? 'bg-white text-[#1dbf73] shadow-xs'
                : 'text-[#74767e] hover:text-[#222325]'
            }`}
          >
            Create Account
          </button>
          <button
            type="button"
            onClick={() => { setMode('login'); setError(null); }}
            className={`flex-1 py-1.5 text-xs font-bold rounded transition-all cursor-pointer ${
              mode === 'login'
                ? 'bg-white text-[#1dbf73] shadow-xs'
                : 'text-[#74767e] hover:text-[#222325]'
            }`}
          >
            Sign In
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3 rounded bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-semibold text-[#404145] mb-1">
                Your Full Name / Seller Brand
              </label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-2.5 w-4 h-4 text-[#74767e]" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. Zayn Web & AI Studio"
                  required
                  className="w-full pl-10 pr-4 py-2 border border-[#dadbdd] rounded text-sm text-[#222325] focus:border-[#1dbf73] focus:outline-none focus:ring-1 focus:ring-[#1dbf73]"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#404145] mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 w-4 h-4 text-[#74767e]" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@domain.com"
                required
                className="w-full pl-10 pr-4 py-2 border border-[#dadbdd] rounded text-sm text-[#222325] focus:border-[#1dbf73] focus:outline-none focus:ring-1 focus:ring-[#1dbf73]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#404145] mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 w-4 h-4 text-[#74767e]" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="w-full pl-10 pr-4 py-2 border border-[#dadbdd] rounded text-sm text-[#222325] focus:border-[#1dbf73] focus:outline-none focus:ring-1 focus:ring-[#1dbf73]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="fiverr-btn-green w-full py-2.5 px-4 rounded text-sm font-bold flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50 mt-2"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Processing...
              </span>
            ) : (
              <>
                <span>{mode === 'register' ? 'Register & Begin Onboarding' : 'Sign In to Dashboard'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Security badge */}
        <div className="mt-6 pt-4 border-t border-[#efeff0] flex items-center justify-center gap-2 text-xs text-[#74767e]">
          <ShieldCheck className="w-4 h-4 text-[#1dbf73]" />
          <span>Bcrypt salted encryption &bull; JWT session security</span>
        </div>
      </div>
    </div>
  );
};
