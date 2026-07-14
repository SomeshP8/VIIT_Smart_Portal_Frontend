import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { UserPlus, Mail, Key, User, BookOpen, GraduationCap, Calendar, Shield, Loader2, Eye, EyeOff } from 'lucide-react';
import DarkModeToggle from '../components/common/DarkModeToggle';

const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['student', 'admin']).default('student'),
  department: z.string().optional(),
  year: z.string().optional(),
  semester: z.string().optional(),
  rollNumber: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.role === 'student') {
    if (!data.department) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['department'], message: 'Department is required for students' });
    }
    if (!data.year) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['year'], message: 'Year is required for students' });
    }
    if (!data.semester) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['semester'], message: 'Semester is required for students' });
    }
    if (!data.rollNumber) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['rollNumber'], message: 'Roll number is required for students' });
    }
  }
});

const Signup = () => {
  const { signup, isLoading } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const navigate = useNavigate();

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
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      role: 'student',
      department: '',
      year: '',
      semester: '',
      rollNumber: '',
    },
  });

  const selectedRole = watch('role');

  const onSubmit = async (data) => {
    setApiError(null);
    try {
      let payload;
      if (data.role === 'student') {
        payload = {
          name: data.name,
          email: data.email,
          password: data.password,
          role: data.role,
          department: data.department,
          year: Number(data.year),
          semester: Number(data.semester),
          rollNumber: data.rollNumber,
        };
      } else {
        // Admin — only send the required fields, omit all student-specific fields
        payload = {
          name: data.name,
          email: data.email,
          password: data.password,
          role: data.role,
        };
      }

      await signup(payload);
      navigate('/');
    } catch (err) {
      setApiError(err.message || 'Signup failed. Please try again.');
    }
  };

  return (
    <div 
      onMouseMove={handleMouseMove}
      style={{ perspective: '1000px' }}
      className="relative min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4 py-12 overflow-hidden"
    >
      {/* Ambient backgrounds (Parallax) */}
      <div 
        style={{ transform: `translate(${mousePos.x * 70}px, ${mousePos.y * 70}px)` }}
        className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary-400/10 blur-[120px] dark:bg-primary-900/10 pointer-events-none transition-transform duration-300 ease-out"
      />
      <div 
        style={{ transform: `translate(${mousePos.x * -70}px, ${mousePos.y * -70}px)` }}
        className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-400/10 blur-[120px] dark:bg-indigo-900/10 pointer-events-none transition-transform duration-300 ease-out"
      />

      <div className="absolute top-6 right-6">
        <DarkModeToggle />
      </div>

      <div 
        style={{ 
          transform: `translate(${mousePos.x * -15}px, ${mousePos.y * -15}px) rotateY(${mousePos.x * 8}deg) rotateX(${mousePos.y * -8}deg)`,
          transformStyle: 'preserve-3d'
        }}
        className="w-full max-w-lg z-10 transition-transform duration-300 ease-out"
      >
        <div className="glass-premium rounded-3xl p-8 transition-all duration-305 shadow-2xl">
          <div className="text-center mb-8" style={{ transform: 'translateZ(20px)' }}>
            <h1 className="text-3xl font-extrabold tracking-tight mb-2">
              <span className="text-slate-800 dark:text-slate-200">Join </span>
              <span className="gradient-text font-serif">VIIT</span>
              <span className="text-slate-800 dark:text-slate-200"> Portal</span>
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
              Create an account to connect with students and campus services
            </p>
          </div>

          {apiError && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm font-medium">
              {apiError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Split row Name & Email */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                    <User className="h-5 w-5" />
                  </div>
                  <input
                    type="text"
                    {...register('name')}
                    className={`w-full pl-11 pr-4 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border ${
                      errors.name ? 'border-red-500' : 'border-slate-200 dark:border-slate-800'
                    } text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-primary-500/10 transition-all`}
                    placeholder="John Doe"
                  />
                </div>
                {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
              </div>

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
                    className={`w-full pl-11 pr-4 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border ${
                      errors.email ? 'border-red-500' : 'border-slate-200 dark:border-slate-800'
                    } text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-primary-500/10 transition-all`}
                    placeholder="johndoe@viit.ac.in"
                  />
                </div>
                {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
              </div>
            </div>

            {/* Role Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                Portal Role
              </label>
              <div className="grid grid-cols-2 gap-4">
                <label className={`flex items-center justify-center gap-2 py-3 px-4 rounded-2xl border cursor-pointer transition-all ${
                  selectedRole === 'student'
                    ? 'border-primary-500 bg-primary-500/5 text-primary-600 dark:text-primary-400 font-semibold shadow-sm'
                    : 'border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900'
                }`}>
                  <input
                    type="radio"
                    value="student"
                    {...register('role')}
                    className="sr-only"
                  />
                  <GraduationCap className="h-5 w-5" />
                  <span>Student</span>
                </label>
                <label className={`flex items-center justify-center gap-2 py-3 px-4 rounded-2xl border cursor-pointer transition-all ${
                  selectedRole === 'admin'
                    ? 'border-primary-500 bg-primary-500/5 text-primary-600 dark:text-primary-400 font-semibold shadow-sm'
                    : 'border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900'
                }`}>
                  <input
                    type="radio"
                    value="admin"
                    {...register('role')}
                    className="sr-only"
                  />
                  <Shield className="h-5 w-5" />
                  <span>Admin</span>
                </label>
              </div>
            </div>

            {/* Student Specific Fields (Shown only if role is Student) */}
            {selectedRole === 'student' && (
              <div className="p-4 rounded-2xl bg-slate-100/50 dark:bg-slate-900/30 border border-slate-200/50 dark:border-slate-800/50 space-y-4 animate-fadeIn">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                      Department
                    </label>
                    <select
                      {...register('department')}
                      className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all"
                    >
                      <option value="">Select Department</option>
                      <option value="CS">Computer Science (CS)</option>
                      <option value="IT">Information Technology (IT)</option>
                      <option value="EC">Electronics & Comm. (EC)</option>
                      <option value="EE">Electrical Eng. (EE)</option>
                      <option value="ME">Mechanical Eng. (ME)</option>
                      <option value="CE">Civil Eng. (CE)</option>
                      <option value="Other">Other</option>
                    </select>
                    {errors.department && <p className="mt-1 text-xs text-red-500">{errors.department.message}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                      Academic Year
                    </label>
                    <select
                      {...register('year')}
                      className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all"
                    >
                      <option value="">Select Year</option>
                      <option value="1">1st Year</option>
                      <option value="2">2nd Year</option>
                      <option value="3">3rd Year</option>
                      <option value="4">4th Year</option>
                    </select>
                    {errors.year && <p className="mt-1 text-xs text-red-500">{errors.year.message}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                      Semester
                    </label>
                    <select
                      {...register('semester')}
                      className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all"
                    >
                      <option value="">Select Semester</option>
                      {Array.from({ length: 8 }).map((_, i) => (
                        <option key={i + 1} value={i + 1}>
                          Semester {i + 1}
                        </option>
                      ))}
                    </select>
                    {errors.semester && <p className="mt-1 text-xs text-red-500">{errors.semester.message}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                      Roll Number
                    </label>
                    <input
                      type="text"
                      {...register('rollNumber')}
                      className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all"
                      placeholder="e.g. 21CS1005"
                    />
                    {errors.rollNumber && <p className="mt-1 text-xs text-red-500">{errors.rollNumber.message}</p>}
                  </div>
                </div>
              </div>
            )}

            {/* Password Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                  <Key className="h-5 w-5" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  {...register('password')}
                  className={`w-full pl-11 pr-11 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border ${
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
              {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 text-white font-semibold py-3 px-4 rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary-500/20 active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none shadow-lg shadow-primary-500/10 mt-6"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <UserPlus className="h-5 w-5" />
                  <span>Register Account</span>
                </>
              )}
            </button>
          </form>

          {/* Account Creation Prompt */}
          <div className="mt-8 text-center border-t border-slate-200/50 dark:border-slate-800/50 pt-6">
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-semibold text-primary-600 dark:text-primary-400 hover:underline"
              >
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
