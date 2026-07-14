import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';
import {
  AlertTriangle,
  Plus,
  Clock,
  CheckCircle,
  Play,
  Filter,
  User,
  MessageSquare,
  ChevronRight,
  X,
  History,
  Loader2
} from 'lucide-react';

const createComplaintSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(100, 'Title cannot exceed 100 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  category: z.enum(['Hostel', 'Classroom', 'Transport', 'Other']),
});

const adminUpdateSchema = z.object({
  status: z.enum(['pending', 'in_progress', 'resolved']),
  remarks: z.string().min(2, 'Remarks are required when updating status'),
});

const Complaints = () => {
  const { user } = useAuthStore();
  const [complaints, setComplaints] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1 });
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Admin filters
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Forms
  const {
    register: registerCreate,
    handleSubmit: handleSubmitCreate,
    reset: resetCreate,
    formState: { errors: errorsCreate },
  } = useForm({
    resolver: zodResolver(createComplaintSchema),
  });

  const {
    register: registerAdmin,
    handleSubmit: handleSubmitAdmin,
    reset: resetAdmin,
    formState: { errors: errorsAdmin },
  } = useForm({
    resolver: zodResolver(adminUpdateSchema),
  });

  const fetchComplaints = async () => {
    try {
      setIsLoading(true);
      const categoryParam = categoryFilter ? `&category=${categoryFilter}` : '';
      const statusParam = statusFilter ? `&status=${statusFilter}` : '';
      
      const response = await api.get(
        `/complaints?page=${currentPage}&limit=10${categoryParam}${statusParam}`
      );
      setComplaints(response.data.data.complaints);
      setPagination(response.data.data.pagination);
    } catch (error) {
      console.error('Failed to fetch complaints:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, [currentPage, categoryFilter, statusFilter]);

  const onCreateSubmit = async (data) => {
    try {
      await api.post('/complaints', data);
      setIsCreateOpen(false);
      resetCreate();
      fetchComplaints();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to file complaint');
    }
  };

  const onAdminSubmit = async (data) => {
    try {
      const response = await api.put(`/complaints/${selectedComplaint._id}/status`, data);
      setSelectedComplaint(response.data.data); // Refresh detail view
      resetAdmin();
      fetchComplaints();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to update complaint');
    }
  };

  const getStatusBadge = (status) => {
    const configs = {
      pending: { bg: 'bg-rose-500/10 text-rose-600 border-rose-500/20', label: 'Pending', icon: Clock },
      in_progress: { bg: 'bg-amber-500/10 text-amber-600 border-amber-500/20', label: 'In Progress', icon: Play },
      resolved: { bg: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20', label: 'Resolved', icon: CheckCircle },
    };
    const current = configs[status] || configs.pending;
    const Icon = current.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-xs font-semibold ${current.bg}`}>
        <Icon className="h-3 w-3" />
        <span>{current.label}</span>
      </span>
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <AlertTriangle className="h-8 w-8 text-primary-500" />
            <span className="font-serif">Complaints Pipeline</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            {user?.role === 'admin'
              ? 'Manage and resolve campus complaints globally.'
              : 'File campus complaints and monitor real-time tracking.'}
          </p>
        </div>

        {user?.role === 'student' && (
          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 text-white font-semibold py-2.5 px-4 rounded-xl shadow-md transition-all active:scale-[0.98] shrink-0"
          >
            <Plus className="h-5 w-5" />
            <span>File a Complaint</span>
          </button>
        )}
      </div>

      {/* Filter and Control Bar (Admin or Student filters) */}
      <div className="glass-premium rounded-2xl p-4 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
          <Filter className="h-4 w-4" />
          <span className="text-xs font-bold uppercase tracking-wider">Quick Filters</span>
        </div>
        <div className="flex flex-wrap gap-3">
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-600 dark:text-slate-350 focus:outline-none focus:border-primary-500"
          >
            <option value="">All Categories</option>
            <option value="Hostel">Hostel</option>
            <option value="Classroom">Classroom</option>
            <option value="Transport">Transport</option>
            <option value="Other">Other</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-600 dark:text-slate-350 focus:outline-none focus:border-primary-500"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>
      </div>

      {/* Main Grid: list & details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Complaints list */}
        <div className="lg:col-span-2 space-y-4">
          {isLoading ? (
            <div className="py-12 flex justify-center items-center">
              <Loader2 className="h-10 w-10 animate-spin text-primary-500" />
            </div>
          ) : complaints.length > 0 ? (
            <div className="space-y-4">
              {complaints.map((c) => (
                <div
                  key={c._id}
                  onClick={() => setSelectedComplaint(c)}
                  className={`p-5 rounded-2xl border cursor-pointer transition-all duration-300 card-hover-effect ${
                    selectedComplaint?._id === c._id
                      ? 'border-primary-500 bg-primary-500/5 shadow-md shadow-primary-500/5'
                      : 'border-slate-200/50 bg-white dark:border-slate-800/50 dark:bg-slate-900'
                  }`}
                >
                  <div className="flex justify-between items-start gap-4 mb-2">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md text-slate-500 mr-2">
                        {c.category}
                      </span>
                      {getStatusBadge(c.status)}
                    </div>
                    <span className="text-[10px] text-slate-400 font-semibold">
                      {new Date(c.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <h4 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-1 truncate">
                    {c.title}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {c.description}
                  </p>

                  {user?.role === 'admin' && (
                    <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-[10px] text-slate-400 font-medium">
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" /> Filed by: {c.student?.name} ({c.student?.department})
                      </span>
                      <ChevronRight className="h-4 w-4" />
                    </div>
                  )}
                </div>
              ))}

              {/* Pagination controls */}
              {pagination.pages > 1 && (
                <div className="flex justify-center gap-2 pt-4">
                  {Array.from({ length: pagination.pages }).map((_, i) => (
                    <button
                      key={i + 1}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`px-3 py-1 text-xs font-semibold rounded-lg border transition-all ${
                        currentPage === i + 1
                          ? 'bg-primary-500 border-primary-500 text-white shadow-sm'
                          : 'bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800 text-slate-500'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="py-20 text-center text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl bg-white dark:bg-slate-900">
              <AlertTriangle className="h-12 w-12 mx-auto opacity-40 mb-3 animate-pulse-subtle" />
              <p className="text-sm font-medium">No complaints found</p>
              <p className="text-xs">Adjust your filtration parameters or submit a new ticket.</p>
            </div>
          )}
        </div>

        {/* Selected Complaint Detail View */}
        <div className="glass-premium rounded-3xl p-6 self-start">
          {selectedComplaint ? (
            <div className="space-y-6">
              <div>
                <div className="flex justify-between items-start gap-4 mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md text-slate-500">
                    {selectedComplaint.category}
                  </span>
                  {getStatusBadge(selectedComplaint.status)}
                </div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 leading-tight">
                  {selectedComplaint.title}
                </h3>
                <p className="text-xs text-slate-400 font-medium mt-1">
                  Filed on: {new Date(selectedComplaint.createdAt).toLocaleString()}
                </p>
              </div>

              <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-2">
                <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Description</h5>
                <p className="text-xs text-slate-700 dark:text-slate-350 leading-relaxed bg-slate-50 dark:bg-slate-900/55 p-3 rounded-xl border border-slate-100 dark:border-slate-800/40">
                  {selectedComplaint.description}
                </p>
              </div>

              {/* Admin remarks */}
              {selectedComplaint.remarks && (
                <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-2">
                  <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <MessageSquare className="h-4 w-4 text-primary-500" />
                    <span>Latest Admin Remarks</span>
                  </h5>
                  <p className="text-xs text-slate-700 dark:text-slate-350 leading-relaxed bg-primary-500/5 p-3 rounded-xl border border-primary-500/10">
                    {selectedComplaint.remarks}
                  </p>
                </div>
              )}

              {/* Status change history timeline */}
              {selectedComplaint.history && selectedComplaint.history.length > 0 && (
                <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-3">
                  <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <History className="h-4 w-4 text-indigo-500" />
                    <span>Audit Pipeline History</span>
                  </h5>
                  <div className="relative pl-4 border-l border-slate-200 dark:border-slate-800 space-y-4">
                    {selectedComplaint.history.map((hist, idx) => (
                      <div key={hist._id || idx} className="relative text-xs">
                        <div className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full bg-slate-300 dark:bg-slate-700 ring-4 ring-slate-50 dark:ring-slate-950" />
                        <p className="font-bold capitalize text-slate-700 dark:text-slate-300">
                          Marked {hist.status.replace('_', ' ')}
                        </p>
                        {hist.remarks && <p className="text-[11px] text-slate-500 dark:text-slate-450 italic mt-0.5">"{hist.remarks}"</p>}
                        <p className="text-[10px] text-slate-400 font-medium mt-1">
                          {new Date(hist.updatedAt).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Admin Actions Panel */}
              {user?.role === 'admin' && (
                <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-4 bg-slate-50 dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-200/50">
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Pipeline Status Resolution
                  </h4>
                  <form onSubmit={handleSubmitAdmin(onAdminSubmit)} className="space-y-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-450 uppercase mb-1.5">
                        Target Status
                      </label>
                      <select
                        {...registerAdmin('status')}
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-primary-500"
                      >
                        <option value="pending">Pending</option>
                        <option value="in_progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                      </select>
                      {errorsAdmin.status && (
                        <p className="mt-1 text-[10px] text-red-500">{errorsAdmin.status.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-450 uppercase mb-1.5">
                        Remarks / Feedback
                      </label>
                      <textarea
                        {...registerAdmin('remarks')}
                        rows={3}
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-primary-500"
                        placeholder="Provide details about actions taken..."
                      />
                      {errorsAdmin.remarks && (
                        <p className="mt-1 text-[10px] text-red-500">{errorsAdmin.remarks.message}</p>
                      )}
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 text-white font-semibold py-2 rounded-xl text-xs transition-all active:scale-[0.98]"
                    >
                      Update Pipeline Status
                    </button>
                  </form>
                </div>
              )}
            </div>
          ) : (
            <div className="py-12 text-center text-slate-400 dark:text-slate-500">
              <Plus className="h-8 w-8 mx-auto opacity-35 mb-2 rotate-45 animate-pulse-subtle" />
              <p className="text-sm font-semibold">Select a complaint</p>
              <p className="text-xs mt-0.5">Click a ticket card to view timeline logs and update status.</p>
            </div>
          )}
        </div>
      </div>

      {/* Slide-out Drawer / Dialog for filing complaints */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-950/20 backdrop-blur-sm animate-fadeIn">
          <div
            onClick={() => setIsCreateOpen(false)}
            className="absolute inset-0"
          />
          <div className="relative h-full w-full max-w-md bg-white p-6 shadow-2xl dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 flex flex-col z-10 animate-slideLeft">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-6">
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                <span>Submit Ticket</span>
              </h2>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitCreate(onCreateSubmit)} className="space-y-5 flex-1 flex flex-col">
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                  Complaint Category
                </label>
                <select
                  {...registerCreate('category')}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-primary-500"
                >
                  <option value="">Select Category</option>
                  <option value="Hostel">Hostel</option>
                  <option value="Classroom">Classroom</option>
                  <option value="Transport">Transport</option>
                  <option value="Other">Other</option>
                </select>
                {errorsCreate.category && (
                  <p className="mt-1 text-xs text-red-500">{errorsCreate.category.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                  Title / Subject
                </label>
                <input
                  type="text"
                  {...registerCreate('title')}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-primary-500"
                  placeholder="Short summary of the issue"
                />
                {errorsCreate.title && (
                  <p className="mt-1 text-xs text-red-500">{errorsCreate.title.message}</p>
                )}
              </div>

              <div className="flex-1 flex flex-col">
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                  Detailed Description
                </label>
                <textarea
                  {...registerCreate('description')}
                  rows={6}
                  className="w-full flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-primary-500 resize-none"
                  placeholder="Explain the problem in detail (room/hall numbers, times, bus numbers, etc.)"
                />
                {errorsCreate.description && (
                  <p className="mt-1 text-xs text-red-500">{errorsCreate.description.message}</p>
                )}
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 text-white font-semibold py-3 px-4 rounded-xl shadow-lg transition-all active:scale-[0.98] mt-auto"
              >
                File Ticket
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Complaints;
