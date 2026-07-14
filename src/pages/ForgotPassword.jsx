import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Mail, ArrowLeft, Send, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import DarkModeToggle from '../components/common/DarkModeToggle';

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

const ForgotPassword = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);
  const [apiError, setApiError] = useState(null);
  const [devResetLink, setDevResetLink] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (data) => {
    setIsLoading(true);
    setApiError(null);
    setSuccessMsg(null);
    setDevResetLink(null);
    try {
      const response = await axios.post('/api/v1/auth/forgot-password', data);
      setSuccessMsg(response.data.message);
      
      // If server returns the reset url (in development mode), capture it
      if (response.data.data?.resetUrl) {
        setDevResetLink(response.data.data.resetUrl);
      }
    } catch (err) {
      setApiError(err.response?.data?.message || 'Something went wrong. Please try again.');
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
          <div className="mb-6">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors uppercase tracking-wider"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Login</span>
            </Link>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-2xl font-extrabold tracking-tight mb-2">
              <span className="text-slate-800 dark:text-slate-200 font-bold">Reset Password</span>
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
              Enter your email to receive a password reset link
            </p>
          </div>

          {apiError && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm font-medium">
              {apiError}
            </div>
          )}

          {successMsg ? (
            <div className="space-y-6 text-center">
              <div className="flex justify-center">
                <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-500">
                  <CheckCircle2 className="h-10 w-10" />
                </div>
              </div>
              <p className="text-slate-700 dark:text-slate-300 font-medium">
                {successMsg}
              </p>

              {devResetLink && (
                <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 text-left space-y-3">
                  <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">Dev Helper Mode</span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    No SMTP email client is configured. Use this link directly to reset the password:
                  </p>
                  <a
                    href={devResetLink}
                    target="_blank"
                    rel="noreferrer"
                    className="block text-xs font-mono break-all text-primary-500 hover:underline bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800"
                  >
                    {devResetLink}
                  </a>
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
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
                      errors.email ? 'border-red-500' : 'border-slate-200 dark:border-slate-800'
                    } text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-primary-500/10 transition-all`}
                    placeholder="name@viit.ac.in"
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-xs text-red-500 font-medium">{errors.email.message}</p>
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
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <Send className="h-5 w-5" />
                    <span>Send Reset Instructions</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
