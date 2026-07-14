import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { LogIn, Key, Mail, Eye, EyeOff, Loader2 } from 'lucide-react';
import DarkModeToggle from '../components/common/DarkModeToggle';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

const Login = () => {
  const { login, isLoading } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  const handleMouseMove = (e) => {
    const { clientX, clientY } = e;
    const { innerWidth, innerHeight } = window;
    const x = (clientX / innerWidth) - 0.5;
    const y = (clientY / innerHeight) - 0.5;
    setMousePos({ x, y });
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data) => {
    setApiError(null);
    try {
      await login(data.email, data.password);
      navigate(from, { replace: true });
    } catch (err) {
      setApiError(err.message || 'Login failed. Please verify credentials.');
    }
  };

  return (
    <div 
      onMouseMove={handleMouseMove}
      style={{ perspective: '1000px' }}
      className="relative min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4 overflow-hidden"
    >
      {/* Decorative Radial Background Gradients (Parallax Shifted) */}
      <div 
        style={{ transform: `translate(${mousePos.x * 70}px, ${mousePos.y * 70}px)` }}
        className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary-400/10 blur-[120px] dark:bg-primary-900/10 pointer-events-none transition-transform duration-300 ease-out"
      />
      <div 
        style={{ transform: `translate(${mousePos.x * -70}px, ${mousePos.y * -70}px)` }}
        className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-400/10 blur-[120px] dark:bg-indigo-900/10 pointer-events-none transition-transform duration-300 ease-out"
      />

      {/* Floating Dark Mode Toggle */}
      <div className="absolute top-6 right-6">
        <DarkModeToggle />
      </div>

      <div 
        style={{ 
          transform: `translate(${mousePos.x * -15}px, ${mousePos.y * -15}px) rotateY(${mousePos.x * 8}deg) rotateX(${mousePos.y * -8}deg)`,
          transformStyle: 'preserve-3d'
        }}
        className="w-full max-w-md z-10 transition-transform duration-300 ease-out"
      >
        <div className="glass-premium rounded-3xl p-8 transition-all duration-305 shadow-2xl">
          <div className="text-center mb-8" style={{ transform: 'translateZ(20px)' }}>
            <h1 className="text-3xl font-extrabold tracking-tight mb-2">
              <span className="gradient-text font-serif">VIIT</span>
              <span className="text-slate-800 dark:text-slate-205"> Smart Campus</span>
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
              Access your portal dashboard & academic hub
            </p>
          </div>

          {apiError && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm font-medium">
              {apiError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Email Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                Campus Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                  <Mail className="h-5 w-5" />
                </div>
                <input
                  type="email"
                  {...register('email')}
                  className={`w-full pl-11 pr-4 py-3 rounded-2xl bg-white dark:bg-slate-900 border ${
                    errors.email
                      ? 'border-red-500 focus:ring-red-500/20'
                      : 'border-slate-200 dark:border-slate-800 focus:border-primary-500 dark:focus:border-primary-500 focus:ring-primary-500/10'
                  } text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-4 transition-all`}
                  placeholder="name@viit.ac.in"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-xs text-red-500 font-medium">{errors.email.message}</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-semibold text-primary-600 dark:text-primary-400 hover:underline"
                >
                  Forgot Password?
                </Link>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                  <Key className="h-5 w-5" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  {...register('password')}
                  className={`w-full pl-11 pr-11 py-3 rounded-2xl bg-white dark:bg-slate-900 border ${
                    errors.password
                      ? 'border-red-500 focus:ring-red-500/20'
                      : 'border-slate-200 dark:border-slate-800 focus:border-primary-500 dark:focus:border-primary-500 focus:ring-primary-500/10'
                  } text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-4 transition-all`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-red-500 font-medium">{errors.password.message}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 text-white font-semibold py-3 px-4 rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary-500/20 active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none shadow-lg shadow-primary-500/10"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Logging in...</span>
                </>
              ) : (
                <>
                  <LogIn className="h-5 w-5" />
                  <span>Sign In</span>
                </>
              )}
            </button>
          </form>

          {/* Account Creation Prompt */}
          <div className="mt-8 text-center border-t border-slate-200/50 dark:border-slate-800/50 pt-6">
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              New to VIIT Smart Campus?{' '}
              <Link
                to="/signup"
                className="font-semibold text-primary-600 dark:text-primary-400 hover:underline"
              >
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
