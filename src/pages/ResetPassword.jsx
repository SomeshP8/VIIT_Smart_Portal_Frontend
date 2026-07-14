import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { Key, Eye, EyeOff, CheckCircle2, ArrowLeft, Loader2 } from 'lucide-react';
import DarkModeToggle from '../components/common/DarkModeToggle';

const resetPasswordSchema = z.object({
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  const onSubmit = async (data) => {
    setIsLoading(true);
    setApiError(null);
    try {
      await axios.post(`/api/v1/auth/reset-password/${token}`, {
        password: data.password,
      });
      setSuccess(true);
    } catch (err) {
      setApiError(err.response?.data?.message || 'Password reset failed. Token may be invalid or expired.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4 overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary-400/10 blur-[120px] dark:bg-primary-900/10 pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-400/10 blur-[120px] dark:bg-indigo-900/10 pointer-events-none"></div>

      <div className="absolute top-6 right-6">
        <DarkModeToggle />
      </div>

      <div className="w-full max-w-md z-10">
        <div className="glass-premium rounded-3xl p-8 transition-all duration-300">
          {success ? (
            <div className="space-y-6 text-center">
              <div className="flex justify-center">
                <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-500 animate-bounce">
                  <CheckCircle2 className="h-10 w-10" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-slate-850 dark:text-slate-100">Success!</h2>
              <p className="text-slate-600 dark:text-slate-400 text-sm">
                Your password has been successfully reset. You can now log in using your new credentials.
              </p>
              <Link
                to="/login"
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 text-white font-semibold py-3 px-4 rounded-2xl shadow-lg shadow-primary-500/10 focus:outline-none transition-all active:scale-[0.98]"
              >
                <span>Proceed to Login</span>
              </Link>
            </div>
          ) : (
            <>
              <div className="text-center mb-8">
                <h1 className="text-2xl font-extrabold tracking-tight mb-2">
                  <span className="text-slate-800 dark:text-slate-200">Set New Password</span>
                </h1>
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
                  Create a strong password for your campus account
                </p>
              </div>

              {apiError && (
                <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm font-medium">
                  {apiError}
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                {/* New Password */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                      <Key className="h-5 w-5" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      {...register('password')}
                      className={`w-full pl-11 pr-11 py-3 rounded-2xl bg-white dark:bg-slate-900 border ${
                        errors.password ? 'border-red-500' : 'border-slate-200 dark:border-slate-800'
                      } text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-primary-500/10 transition-all`}
                      placeholder="At least 6 characters"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 dark:text-slate-500 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="mt-1 text-xs text-red-500 font-medium">{errors.password.message}</p>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                      <Key className="h-5 w-5" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      {...register('confirmPassword')}
                      className={`w-full pl-11 pr-4 py-3 rounded-2xl bg-white dark:bg-slate-900 border ${
                        errors.confirmPassword ? 'border-red-500' : 'border-slate-200 dark:border-slate-800'
                      } text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-primary-500/10 transition-all`}
                      placeholder="Confirm your password"
                    />
                  </div>
                  {errors.confirmPassword && (
                    <p className="mt-1 text-xs text-red-500 font-medium">{errors.confirmPassword.message}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 text-white font-semibold py-3 px-4 rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary-500/20 active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none shadow-lg shadow-primary-500/10"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Updating...</span>
                    </>
                  ) : (
                    <>
                      <span>Reset Password</span>
                    </>
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
