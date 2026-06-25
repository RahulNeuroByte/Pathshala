import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// Get API base URL
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [captchaCode, setCaptchaCode] = useState('');
  const [captchaInput, setCaptchaInput] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Generate random captcha code
  const generateCaptcha = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = '';
    for (let i = 0; i < 5; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCaptchaCode(result);
    setCaptchaInput('');
  };

  useEffect(() => {
    generateCaptcha();
  }, []);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (captchaInput.toUpperCase() !== captchaCode) {
      setError('Incorrect CAPTCHA verification code.');
      generateCaptcha();
      return;
    }

    setIsLoading(true);

    try {
      await axios.post(`${API_BASE_URL}/users/reset-password`, {
        username,
        email,
        new_password: newPassword,
      });

      setSuccess('Your password has been reset successfully. Redirecting to login page...');
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to reset password. Please check your credentials.');
      generateCaptcha();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-55 dark:bg-slate-950 relative overflow-hidden font-sans transition-colors duration-300">
      <div className="absolute top-0 left-0 w-full h-full opacity-[0.02] dark:opacity-[0.03] pointer-events-none bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:16px_16px]" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 dark:bg-indigo-500/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 dark:bg-purple-500/5 rounded-full blur-3xl" />

      <div className="max-w-md w-full mx-4 relative z-10">
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-8 md:p-10 shadow-xl transition-colors duration-300">
          
          <div className="text-center mb-8">
            <h2 className="text-2.5xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Reset Password
            </h2>
            <p className="mt-2 text-xs text-slate-550 dark:text-slate-400 font-medium">
              Enter details below to update your login credentials
            </p>
          </div>

          <form onSubmit={handleResetPassword} className="space-y-5">
            {error && (
              <div className="rounded-2xl bg-rose-500/10 border border-rose-500/25 p-4 text-xs text-rose-650 dark:text-rose-455 flex items-start gap-3">
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" className="flex-shrink-0 mt-0.5">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span className="font-semibold leading-relaxed">{error}</span>
              </div>
            )}

            {success && (
              <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/25 p-4 text-xs text-emerald-650 dark:text-emerald-450 flex items-start gap-3">
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" className="flex-shrink-0 mt-0.5">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-bold leading-relaxed">{success}</span>
              </div>
            )}

            <div className="space-y-4">
              {/* Username */}
              <div>
                <label className="block text-[11px] font-bold text-slate-455 dark:text-slate-400 uppercase tracking-wider mb-2">
                  Username
                </label>
                <input
                  type="text"
                  required
                  placeholder="Enter username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full px-4 py-3 bg-slate-55 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-[11px] font-bold text-slate-455 dark:text-slate-400 uppercase tracking-wider mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="Enter registered email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full px-4 py-3 bg-slate-55 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                />
              </div>

              {/* New Password */}
              <div>
                <label className="block text-[11px] font-bold text-slate-455 dark:text-slate-400 uppercase tracking-wider mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="block w-full px-4 py-3 bg-slate-55 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                />
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-[11px] font-bold text-slate-455 dark:text-slate-400 uppercase tracking-wider mb-2">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="block w-full px-4 py-3 bg-slate-55 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                />
              </div>

              {/* Captcha */}
              <div className="space-y-2 pt-1">
                <label className="block text-[11px] font-bold text-slate-455 dark:text-slate-400 uppercase tracking-wider">
                  Security Captcha
                </label>
                <div className="flex gap-2">
                  <div className="relative flex items-center justify-center bg-slate-100 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 rounded-xl px-5 py-2.5 select-none font-mono text-base font-bold tracking-widest text-slate-700 dark:text-slate-300 overflow-hidden flex-1 h-11">
                    <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_45%,#6366f1_45%,#6366f1_55%,transparent_55%)] opacity-20 pointer-events-none" />
                    <span className="relative z-10 italic line-through decoration-indigo-500/50 decoration-2">{captchaCode}</span>
                  </div>
                  <button
                    type="button"
                    onClick={generateCaptcha}
                    className="px-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 text-slate-400 hover:text-indigo-650 hover:bg-indigo-55/20 transition-all flex items-center justify-center h-11"
                  >
                    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89" />
                    </svg>
                  </button>
                </div>
                <input
                  type="text"
                  required
                  placeholder="Enter Captcha Code"
                  value={captchaInput}
                  onChange={(e) => setCaptchaInput(e.target.value)}
                  className="block w-full px-4 py-3 bg-slate-55 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 rounded-xl placeholder-slate-400 text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all uppercase text-center tracking-widest font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-3.5 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-indigo-650 hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-lg shadow-indigo-600/25 disabled:opacity-50 disabled:cursor-not-allowed items-center gap-2"
            >
              {isLoading ? 'Resetting Password...' : 'Confirm Reset Password'}
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="text-xs font-bold text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              >
                Back to Sign In
              </button>
            </div>
          </form>

        </div>
      </div>
    </div>
  );
}
