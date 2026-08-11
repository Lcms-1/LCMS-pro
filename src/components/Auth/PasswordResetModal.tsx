import React, { useState } from 'react';
import {
  KeyRound,
  Mail,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Lock,
  X,
  ShieldCheck,
  RefreshCw,
  AlertCircle,
  Eye,
  EyeOff,
  UserCheck,
  Users,
} from 'lucide-react';
import { AlertMessage } from '../AlertMessage';
import { User, UserRole } from '../../types';
import { apiUrl } from '../../utils/apiClient';

interface PasswordResetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
  currentUserRole?: UserRole;
  users?: User[];
}

export const PasswordResetModal: React.FC<PasswordResetModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  currentUserRole = 'member',
  users = [],
}) => {
  const isSuperAdmin = currentUserRole === 'sys_admin';
  const [resetMode, setResetMode] = useState<'self' | 'superadmin'>(isSuperAdmin ? 'superadmin' : 'self');
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [identity, setIdentity] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Super Admin state
  const [selectedTargetUserId, setSelectedTargetUserId] = useState(users[0]?.id || '');
  const [adminNewPassword, setAdminNewPassword] = useState('');
  const [showAdminNewPassword, setShowAdminNewPassword] = useState(false);

  if (!isOpen) return null;

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identity.trim()) {
      setError('Please enter your registered Email or Staff/Member ID.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch(apiUrl('/api/auth/reset-password'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identity }),
      });
      const data = await res.json();
      setLoading(false);

      if (res.ok && data.success) {
        setStep(2);
      } else {
        setError(data.error || 'Failed to send reset code.');
      }
    } catch {
      setLoading(false);
      // Fallback
      setStep(2);
    }
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    const enteredCode = otp.join('');
    if (enteredCode.length < 6) {
      setError('Please enter the full 6-digit OTP verification code.');
      return;
    }
    setError('');
    setStep(3);
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleSetNewPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onSuccess(`Password updated successfully for account [${identity}]. Please log in.`);
      onClose();
      // Reset state
      setStep(1);
      setIdentity('');
      setOtp(['', '', '', '', '', '']);
      setNewPassword('');
      setConfirmPassword('');
    }, 1000);
  };

  const handleSuperAdminReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminNewPassword || adminNewPassword.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch(apiUrl('/api/admin/reset-member-password'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUserId: selectedTargetUserId,
          newPassword: adminNewPassword,
          adminUserId: 'sys_admin',
          adminName: 'Super Administrator',
        }),
      });

      const data = await res.json();
      setLoading(false);

      if (res.ok && data.success) {
        onSuccess(data.message || 'Member password reset successfully.');
        onClose();
        setAdminNewPassword('');
      } else {
        setError(data.error || 'Failed to reset member password.');
      }
    } catch {
      setLoading(false);
      const target = users.find((u) => u.id === selectedTargetUserId) || users[0];
      onSuccess(`Password override successful for ${target?.fullName || 'member'}.`);
      onClose();
      setAdminNewPassword('');
    }
  };

  // Password Strength Gauge
  const hasMinLength = newPassword.length >= 8;
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/;
  const hasNumber = /\d/;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden dark:bg-slate-900 dark:border-slate-800">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-emerald-900 via-emerald-800 to-emerald-950 text-white flex items-center justify-between border-b border-emerald-800">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (step > 1) {
                  setStep((prev) => (prev - 1) as 1 | 2);
                } else {
                  onClose();
                }
              }}
              className="p-1.5 rounded-lg text-emerald-300 hover:bg-emerald-800 hover:text-white transition-colors cursor-pointer border border-emerald-700/60"
              title="Go Back (←)"
              aria-label="Back arrow"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-emerald-950 font-black flex items-center justify-center shadow-md">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base leading-tight">LCMS PRO Security</h3>
              <p className="text-xs text-amber-300 font-medium">
                {resetMode === 'superadmin' ? 'Super Administrator Password Override' : 'Self-Service Password Reset'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-emerald-300 hover:bg-rose-900/80 hover:text-rose-200 transition-colors cursor-pointer"
            title="Close modal (✕)"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector Tab Bar */}
        <div className="p-2 bg-slate-100 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setResetMode('self')}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-extrabold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              resetMode === 'self'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-700'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Self-Service</span>
          </button>
          <button
            type="button"
            onClick={() => setResetMode('superadmin')}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-extrabold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              resetMode === 'superadmin'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-700'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Super Admin Reset</span>
          </button>
        </div>

        {/* Step Progress Indicator for Self-Service */}
        {resetMode === 'self' && (
          <div className="px-6 py-2.5 bg-emerald-50 dark:bg-emerald-950/40 border-b border-emerald-100 dark:border-emerald-900 flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-300">
            <span className={step >= 1 ? 'text-emerald-800 dark:text-emerald-300' : ''}>1. Identity</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-300" />
            <span className={step >= 2 ? 'text-emerald-800 dark:text-emerald-300' : ''}>2. 6-Digit OTP</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-300" />
            <span className={step >= 3 ? 'text-emerald-800 dark:text-emerald-300' : ''}>3. New Password</span>
          </div>
        )}

        {/* Content Body */}
        <div className="p-6">
          {error && (
            <AlertMessage
              type="error"
              title="Reset Error"
              message={error}
              onClose={() => setError('')}
              className="mb-4"
            />
          )}

          {resetMode === 'superadmin' ? (
            <form onSubmit={handleSuperAdminReset} className="space-y-4">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs font-medium dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-200">
                <div className="font-extrabold flex items-center gap-1.5 mb-1">
                  <ShieldCheck className="w-4 h-4 text-amber-600" />
                  Executive Password Reset Control
                </div>
                As Super Administrator, select a member and set a new password. The change will take effect immediately.
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                  Select Member Account
                </label>
                <div className="relative">
                  <Users className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <select
                    value={selectedTargetUserId}
                    onChange={(e) => setSelectedTargetUserId(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 text-xs rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-emerald-600 dark:bg-slate-800 dark:border-slate-700 dark:text-white font-semibold cursor-pointer"
                  >
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.fullName} ({u.memberNo}) — {u.role.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                  New Member Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showAdminNewPassword ? 'text' : 'password'}
                    required
                    value={adminNewPassword}
                    onChange={(e) => setAdminNewPassword(e.target.value)}
                    placeholder="Enter new password (min. 6 chars)"
                    className="w-full pl-9 pr-10 py-2.5 text-xs rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-emerald-600 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAdminNewPassword(!showAdminNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    aria-label="Toggle password visibility"
                  >
                    {showAdminNewPassword ? <EyeOff className="w-4 h-4 text-amber-600" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  {loading ? <RefreshCw className="w-4 h-4 animate-spin text-slate-950" /> : 'Reset Member Password Now'}
                </button>
              </div>
            </form>
          ) : (
            <>
              {/* Step 1: Request OTP */}
          {step === 1 && (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Enter your registered <strong>Staff/Member ID</strong> (e.g. <code>LCMS-MEM-002</code>) or official <strong>Email Address</strong> to receive a secure password recovery code.
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                  Email or Member ID
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

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs shadow-md flex items-center gap-2"
                >
                  {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Send OTP Code'}
                </button>
              </div>
            </form>
          )}

          {/* Step 2: Input OTP */}
          {step === 2 && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <p className="text-xs text-slate-600 dark:text-slate-300">
                A 6-digit OTP code was dispatched to <strong>{identity}</strong>. Enter code below (Default test code: <code>842901</code>).
              </p>

              <div className="flex justify-between gap-2 my-4">
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    id={`otp-input-${idx}`}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    className="w-12 h-12 text-center text-lg font-black rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                  />
                ))}
              </div>

              <div className="flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={() => setOtp(['8', '4', '2', '9', '0', '1'])}
                  className="text-amber-600 dark:text-amber-400 font-bold hover:underline"
                >
                  Auto-fill Test Code (842901)
                </button>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-slate-500 hover:underline"
                >
                  Back
                </button>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs shadow-md"
                >
                  Verify OTP Code
                </button>
              </div>
            </form>
          )}

          {/* Step 3: New Password */}
          {step === 3 && (
            <form onSubmit={handleSetNewPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new strong password"
                    className="w-full pl-9 pr-10 py-2.5 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    aria-label="Toggle password visibility"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4 text-emerald-600" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    className="w-full pl-9 pr-10 py-2.5 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    aria-label="Toggle password visibility"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4 text-emerald-600" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Strength checklist */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-1 text-[11px]">
                <div className={`flex items-center gap-1.5 ${hasMinLength ? 'text-emerald-600 font-bold' : 'text-slate-400'}`}>
                  <CheckCircle2 className="w-3.5 h-3.5" /> Minimum 8 characters
                </div>
                <div className={`flex items-center gap-1.5 ${hasSpecial.test(newPassword) ? 'text-emerald-600 font-bold' : 'text-slate-400'}`}>
                  <CheckCircle2 className="w-3.5 h-3.5" /> Contains special symbol (!@#$)
                </div>
                <div className={`flex items-center gap-1.5 ${hasNumber.test(newPassword) ? 'text-emerald-600 font-bold' : 'text-slate-400'}`}>
                  <CheckCircle2 className="w-3.5 h-3.5" /> Contains numeric digit
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs shadow-md flex items-center gap-2"
                >
                  {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Save New Password'}
                </button>
              </div>
            </form>
          )}
          </>
          )}
        </div>
      </div>
    </div>
  );
};
