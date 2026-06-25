import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/api';
import { useUser } from '../context/UserContext';

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useUser();

  // CAPTCHA States
  const [captchaCode, setCaptchaCode] = useState('');
  const [captchaInput, setCaptchaInput] = useState('');

  // Generate random captcha code
  const generateCaptcha = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Avoid confusing characters like O, 0, I, 1
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Verify Captcha Code
    if (captchaInput.toUpperCase() !== captchaCode) {
      setError('Incorrect CAPTCHA verification code. Please try again.');
      setIsLoading(false);
      generateCaptcha();
      return;
    }

    try {
      const response = await authService.login(username, password);
      const token = response.data.access_token;
      
      // Fetch exact user role dynamically from /users/me
      const profileResponse = await fetch(`${API_BASE_URL}/users/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        login(profileData.role, token);
      } else {
        // Fallback checks
        const lowerUser = username.toLowerCase();
        if (lowerUser.includes('hod') || lowerUser.includes('head')) {
          login('hod', token);
        } else if (lowerUser.includes('faculty') || lowerUser.includes('teacher') || lowerUser.includes('prof')) {
          login('faculty', token);
        } else if (lowerUser.includes('student') || lowerUser.includes('aarav') || lowerUser.includes('stu')) {
          login('student', token);
        } else if (lowerUser.includes('principal')) {
          login('principal', token);
        } else if (lowerUser.includes('librarian')) {
          login('librarian', token);
        } else if (lowerUser.includes('cc')) {
          login('class_counsellor', token);
        } else {
          login('admin', token);
        }
      }
      
      navigate('/dashboard');
    } catch (err: any) {
      const errorDetail = err.response?.data?.detail;
      if (Array.isArray(errorDetail)) {
        const messages = errorDetail.map((detail: any) => {
          const path = detail.loc ? detail.loc.filter((l: any) => l !== 'body').join('.') : '';
          return `${path ? path + ': ' : ''}${detail.msg}`;
        }).join(', ');
        setError(messages || 'Login failed');
      } else if (typeof errorDetail === 'string') {
        setError(errorDetail);
      } else if (errorDetail && typeof errorDetail === 'object') {
        setError(errorDetail.message || JSON.stringify(errorDetail));
      } else {
        setError(err.message || 'Login failed');
      }
      generateCaptcha();
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = (role: 'admin' | 'hod' | 'faculty' | 'student' | 'principal' | 'librarian' | 'class_counsellor') => {
    login(role);
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-55 dark:bg-slate-950 relative overflow-hidden font-sans transition-colors duration-300">
      {/* Decorative subtle background pattern / elements */}
      <div className="absolute top-0 left-0 w-full h-full opacity-[0.02] dark:opacity-[0.03] pointer-events-none bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:16px_16px]" />
      
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 dark:bg-indigo-500/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 dark:bg-purple-500/5 rounded-full blur-3xl" />

      <div className="max-w-md w-full mx-4 relative z-10">
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-8 md:p-10 shadow-xl shadow-slate-200/50 dark:shadow-none transition-colors duration-300">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-5">
              <div className="flex items-center justify-center h-14 w-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-650 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/30 shadow-sm transition-all duration-300">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                  <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5" />
                </svg>
              </div>
            </div>
            <h2 className="text-2.5xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Pathshala ERP
            </h2>
            <p className="mt-2 text-xs text-slate-550 dark:text-slate-400 font-medium">
              Academic Administration & Management System
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleLogin}>
            {error && (
              <div className="rounded-2xl bg-rose-500/10 border border-rose-500/25 p-4 text-xs text-rose-650 dark:text-rose-455 flex items-start gap-3">
                <svg width="20" height="20" className="flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span className="font-semibold leading-relaxed">{error}</span>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-455 dark:text-slate-400 uppercase tracking-wider mb-2">
                  Username
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400 dark:text-slate-500">
                    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="Enter username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="block w-full pl-12 pr-4 py-3 bg-slate-55 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 rounded-xl placeholder-slate-400 dark:placeholder-slate-600 text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-455 dark:text-slate-400 uppercase tracking-wider mb-2">
                  Password
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400 dark:text-slate-500">
                    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </span>
                  <input
                    type="password"
                    required
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-12 pr-4 py-3 bg-slate-55 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 rounded-xl placeholder-slate-400 dark:placeholder-slate-600 text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {/* CAPTCHA Security verification */}
              <div className="space-y-2.5 pt-1">
                <label className="block text-[11px] font-bold text-slate-455 dark:text-slate-400 uppercase tracking-wider">
                  Security Captcha
                </label>
                <div className="flex gap-2">
                  <div className="relative flex items-center justify-center bg-slate-100 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 rounded-xl px-5 py-2.5 select-none font-mono text-base font-bold tracking-widest text-slate-700 dark:text-slate-300 overflow-hidden flex-1 h-11">
                    <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_45%,#6366f1_45%,#6366f1_55%,transparent_55%)] opacity-20 pointer-events-none" />
                    <div className="absolute inset-0 bg-[linear-gradient(-30deg,transparent_40%,#10b981_40%,#10b981_50%,transparent_50%)] opacity-20 pointer-events-none" />
                    <span className="relative z-10 italic line-through decoration-indigo-500/50 decoration-2">{captchaCode}</span>
                  </div>
                  <button
                    type="button"
                    onClick={generateCaptcha}
                    className="px-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 text-slate-400 hover:text-indigo-650 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 transition-all flex items-center justify-center h-11"
                    title="Generate New CAPTCHA"
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
                  className="block w-full px-4 py-3 bg-slate-55 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 rounded-xl placeholder-slate-400 dark:placeholder-slate-600 text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all uppercase text-center tracking-widest font-mono"
                />
              </div>

              <div className="flex items-center justify-end text-xs pt-1">
                <button
                  type="button"
                  onClick={() => navigate('/forgot-password')}
                  className="text-indigo-650 dark:text-indigo-400 hover:text-indigo-550 hover:underline font-extrabold transition-all"
                >
                  Forgot Password?
                </button>
              </div>

            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-3.5 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-indigo-650 hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-white dark:focus:ring-offset-slate-950 transition-all shadow-lg shadow-indigo-600/25 disabled:opacity-50 disabled:cursor-not-allowed items-center gap-2"
            >
              {isLoading ? (
                <>
                  <svg width="20" height="20" className="animate-spin text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Quick Login Roles for Testing */}
          <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800/80">
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-center mb-3.5">
              Quick Role Demo Portals
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('admin')}
                className="py-2.5 px-2 bg-slate-50 hover:bg-indigo-50 dark:bg-slate-950 dark:hover:bg-indigo-950/20 border border-slate-200 dark:border-slate-800 hover:border-indigo-500/35 rounded-xl text-[11px] font-bold text-slate-655 dark:text-slate-400 hover:text-indigo-655 dark:hover:text-indigo-400 transition-all text-center shadow-sm"
              >
                Super Admin
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('principal')}
                className="py-2.5 px-2 bg-slate-50 hover:bg-indigo-50 dark:bg-slate-950 dark:hover:bg-indigo-950/20 border border-slate-200 dark:border-slate-800 hover:border-indigo-500/35 rounded-xl text-[11px] font-bold text-slate-655 dark:text-slate-400 hover:text-indigo-650 dark:hover:text-indigo-400 transition-all text-center shadow-sm"
              >
                Principal
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('hod')}
                className="py-2.5 px-2 bg-slate-50 hover:bg-amber-50 dark:bg-slate-950 dark:hover:bg-amber-950/20 border border-slate-200 dark:border-slate-800 hover:border-amber-500/35 rounded-xl text-[11px] font-bold text-slate-655 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 transition-all text-center shadow-sm"
              >
                CS HOD
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('class_counsellor')}
                className="py-2.5 px-2 bg-slate-50 hover:bg-rose-50 dark:bg-slate-950 dark:hover:bg-rose-950/20 border border-slate-200 dark:border-slate-800 hover:border-rose-500/35 rounded-xl text-[11px] font-bold text-slate-655 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-455 transition-all text-center shadow-sm"
              >
                CC (Sec A)
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('faculty')}
                className="py-2.5 px-2 bg-slate-50 hover:bg-purple-50 dark:bg-slate-950 dark:hover:bg-purple-950/20 border border-slate-200 dark:border-slate-800 hover:border-purple-500/35 rounded-xl text-[11px] font-bold text-slate-655 dark:text-slate-400 hover:text-purple-650 dark:hover:text-purple-400 transition-all text-center shadow-sm"
              >
                Faculty
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('librarian')}
                className="py-2.5 px-2 bg-slate-50 hover:bg-teal-50 dark:bg-slate-950 dark:hover:bg-teal-950/20 border border-slate-200 dark:border-slate-800 hover:border-teal-500/35 rounded-xl text-[11px] font-bold text-slate-655 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 transition-all text-center shadow-sm"
              >
                Librarian
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('student')}
                className="py-2.5 px-2 bg-slate-55 hover:bg-emerald-50 dark:bg-slate-950 dark:hover:bg-emerald-950/20 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/35 rounded-xl text-[11px] font-bold text-slate-655 dark:text-slate-400 hover:text-emerald-650 dark:hover:text-emerald-400 transition-all text-center shadow-sm sm:col-span-3"
              >
                Student View
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
