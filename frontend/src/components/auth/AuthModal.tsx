import React, { useState } from 'react';
import { X, Lock, Mail, User as UserIcon, Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md glass-panel p-6 md:p-8 rounded-2xl border border-white/10 shadow-2xl shadow-emerald-500/10">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-emerald-500/20">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-xl font-extrabold text-white">
            {mode === 'register' ? 'Join FiverrGrowth Platform' : 'Welcome Back'}
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            {mode === 'register'
              ? 'Lock your user ID, AI profile context, and tailored market roadmap.'
              : 'Access your persistent growth strategy and context-grounded tools.'}
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex bg-gray-900/80 p-1 rounded-xl border border-white/5 mb-6">
          <button
            type="button"
            onClick={() => { setMode('register'); setError(null); }}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              mode === 'register'
                ? 'bg-emerald-500 text-gray-950 font-bold shadow-md shadow-emerald-500/20'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Create Account
          </button>
          <button
            type="button"
            onClick={() => { setMode('login'); setError(null); }}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              mode === 'login'
                ? 'bg-emerald-500 text-gray-950 font-bold shadow-md shadow-emerald-500/20'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Sign In
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">
                Your Full Name / Seller Brand
              </label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. Zayn Web & AI Studio"
                  required
                  className="w-full glass-input pl-10 pr-4 py-2 rounded-xl text-sm focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@domain.com"
                required
                className="w-full glass-input pl-10 pr-4 py-2 rounded-xl text-sm focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="w-full glass-input pl-10 pr-4 py-2 rounded-xl text-sm focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-gray-950 font-bold text-sm shadow-lg shadow-emerald-500/20 hover:from-emerald-400 hover:to-teal-500 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-gray-950 border-t-transparent rounded-full animate-spin" />
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
        <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-center gap-2 text-[11px] text-gray-400">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Bcrypt salted encryption &bull; JWT session security</span>
        </div>
      </div>
    </div>
  );
};
