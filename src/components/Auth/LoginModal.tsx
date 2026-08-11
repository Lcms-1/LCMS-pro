import React, { useState } from 'react';
import {
  Building2,
  Lock,
  Mail,
  Eye,
  EyeOff,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  KeyRound,
  CheckCircle2,
  UserPlus,
} from 'lucide-react';
import { User, UserRole } from '../../types';
import { ROLES_CONFIG, INITIAL_USERS } from '../../data/mockData';
import { AlertMessage } from '../AlertMessage';
import { CoopLogo } from '../CoopLogo';
import { apiUrl } from '../../utils/apiClient';

interface LoginModalProps {
  isOpen: boolean;
  onLoginSuccess: (user: User, token: string) => void;
  onOpenResetPassword: () => void;
  onOpenSelfRegistration?: () => void;
  onOpenOnboarding?: () => void;
  successNotification?: string;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onLoginSuccess,
  onOpenResetPassword,
  onOpenSelfRegistration,
  onOpenOnboarding,
  successNotification,
}) => {
  const [identity, setIdentity] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!identity.trim()) {
      setError('Please enter your email address or staff/member number.');
      return;
    }

    if (!password.trim()) {
      setError('Please enter your password.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(apiUrl('/api/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identity: identity.trim(),
          password: password.trim(),
        }),
      });

      const data = await response.json();
      setLoading(false);

      if (response.ok && data.success) {
        onLoginSuccess(data.user, data.token);
      } else {
        setError(data.error || 'Invalid authentication credentials');
      }
    } catch {
      setLoading(false);
      // Fallback in case of temporary offline/restart window
      const cleanId = identity.trim().toLowerCase();
      const matchedUser = INITIAL_USERS.find(
        (u) =>
          u.email.toLowerCase() === cleanId ||
          u.memberNo.toLowerCase() === cleanId ||
          u.id.toLowerCase() === cleanId
      );

      if (!matchedUser) {
        setError(`No account found matching '${identity}'. Please verify your email or Member ID.`);
        return;
      }

      const validPass = matchedUser.password;
      if (!validPass || password !== validPass) {
        setError('Incorrect password entered. Please check your password and try again.');
        return;
      }

      onLoginSuccess(matchedUser, `fallback_token_${matchedUser.id}_${Date.now()}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border-2 border-[#DAA520] overflow-hidden my-8 grid grid-cols-1 md:grid-cols-12">
        {/* Left Side: Brand Heritage Banner (Green & Gold with official logo) */}
        <div className="md:col-span-5 bg-[#014421] p-8 text-white flex flex-col justify-between relative overflow-hidden">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <CoopLogo size="lg" showText variant="gold" />
            </div>

            <div className="space-y-4 my-6">
              <h2 className="text-lg font-extrabold leading-snug text-[#DAA520]">
                Lightway Cooperative Society Limited
              </h2>
              <p className="text-xs text-emerald-100 leading-relaxed font-medium">
                Enterprise Cloud Management System for Nigerian Cooperative Societies. Built for seamless member enrolment, daily savings posting, 6-tier loan approvals, dual wallet management, and dividend payouts.
              </p>
              <p className="text-xs text-emerald-100 font-medium leading-relaxed">
                Secure multi-branch cooperative governance, automated passbook ledgers, audit trail compliance, and 9 role-based executive controls.
              </p>
            </div>

            <div className="space-y-2 pt-2 border-t border-emerald-700/60 text-xs">
              <div className="flex items-center gap-2 text-emerald-200">
                <CheckCircle2 className="w-4 h-4 text-amber-400" />
                <span>9 Role-Based Access Control Levels</span>
              </div>
              <div className="flex items-center gap-2 text-emerald-200">
                <CheckCircle2 className="w-4 h-4 text-amber-400" />
                <span>Immutable Transaction Audit Trail</span>
              </div>
              <div className="flex items-center gap-2 text-emerald-200">
                <CheckCircle2 className="w-4 h-4 text-amber-400" />
                <span>Phase 2 Database Schema Foundation</span>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-4 border-t border-emerald-800/80 text-[11px] text-emerald-300/80 flex items-center justify-between">
            <span>Enterprise License 2026</span>
            <span className="font-mono text-amber-400">v1.0.0-Foundation</span>
          </div>
        </div>

        {/* Right Side: Login Form & Role Selector */}
        <div className="md:col-span-7 p-8 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
                  Sign In to LCMS PRO
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Enter staff credentials or select a test role below
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300">
                SECURE AUTH
              </span>
            </div>

            {successNotification && (
              <AlertMessage
                type="success"
                title="Authentication Notice"
                message={successNotification}
                className="mb-4"
              />
            )}

            {error && (
              <AlertMessage
                type="error"
                title="Authentication Error"
                message={error}
                onClose={() => setError('')}
                className="mb-4"
              />
            )}

            <form onSubmit={(e) => handleSubmit(e)} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                  Email Address or Member/Staff Number
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={identity}
                    onChange={(e) => setIdentity(e.target.value)}
                    placeholder="e.g. chairman@lightwaycoop.ng or LCMS-MEM-002"
                    className="w-full pl-9 pr-4 py-2.5 text-xs rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={onOpenResetPassword}
                    className="text-[11px] font-bold text-amber-600 hover:text-amber-700 dark:text-amber-400 flex items-center gap-1"
                  >
                    <KeyRound className="w-3 h-3" />
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-10 py-2.5 text-xs rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <label className="flex items-center gap-2 cursor-pointer text-slate-600 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-slate-300 text-emerald-700 focus:ring-emerald-600"
                  />
                  <span>Remember session on this device</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-800 to-emerald-900 hover:from-emerald-700 hover:to-emerald-800 text-white font-extrabold text-xs shadow-lg shadow-emerald-900/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-amber-300" />
                ) : (
                  <>
                    <span>Authenticate & Access Dashboard</span>
                    <ArrowRight className="w-4 h-4 text-amber-300" />
                  </>
                )}
              </button>
            </form>

            {/* Prospective Member Self-Registration \u2014 primary secondary action */}
            <div className="mt-5 space-y-2.5">
              {onOpenSelfRegistration && (
                <div className="p-4 bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-teal-950/40 dark:to-emerald-950/30 rounded-2xl border border-teal-200/80 dark:border-teal-800/60 flex items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-teal-900 dark:text-teal-200 flex items-center gap-1.5">
                      <UserPlus className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                      New to Lightway Cooperative?
                    </span>
                    <p className="text-[11px] text-teal-700 dark:text-teal-300">
                      Register as a member and get your own savings &amp; loan passbook.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={onOpenSelfRegistration}
                    className="px-3.5 py-2 rounded-xl bg-teal-800 hover:bg-teal-900 text-white text-xs font-extrabold shadow-sm transition-all cursor-pointer shrink-0 flex items-center gap-1.5"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Register</span>
                  </button>
                </div>
              )}

              {onOpenOnboarding && (
                <button
                  type="button"
                  onClick={onOpenOnboarding}
                  className="w-full p-2.5 bg-amber-50/80 dark:bg-amber-950/30 rounded-xl border border-amber-200/70 dark:border-amber-800/50 flex items-center justify-between gap-2 hover:bg-amber-100/80 dark:hover:bg-amber-950/50 transition-colors cursor-pointer"
                >
                  <span className="text-xs font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    See what LCMS PRO can do
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                </button>
              )}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-center gap-1.5 text-[11px] text-slate-400 dark:text-slate-500">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Your credentials are private to your own account.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
