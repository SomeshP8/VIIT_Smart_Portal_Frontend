import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';
import { getFileUrl } from '../services/fileUrl';
import {
  Megaphone,
  Pin,
  Trash2,
  Paperclip,
  Plus,
  X,
  Calendar,
  User,
  Filter,
  Loader2,
  AlertCircle
} from 'lucide-react';

const createAnnouncementSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  body: z.string().min(5, 'Notice description must be at least 5 characters'),
  targetDepartments: z.array(z.string()).optional().default(['All']),
  targetYears: z.array(z.string()).optional().default(['0']),
  isPinned: z.boolean().optional().default(false),
});

const Announcements = () => {
  const { user } = useAuthStore();
  const [announcements, setAnnouncements] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1 });
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedFile, setSelectedFile] = useState(null);

  // Admin filter parameters
  const [deptFilter, setDeptFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(createAnnouncementSchema),
    defaultValues: {
      targetDepartments: ['All'],
      targetYears: ['0'],
      isPinned: false,
    },
  });

  const fetchAnnouncements = async () => {
    try {
      setIsLoading(true);
      const deptParam = deptFilter ? `&department=${deptFilter}` : '';
      const yearParam = yearFilter ? `&year=${yearFilter}` : '';

      const response = await api.get(
        `/announcements?page=${currentPage}&limit=10${deptParam}${yearParam}`
      );
      setAnnouncements(response.data.data.announcements);
      setPagination(response.data.data.pagination);
    } catch (error) {
      console.error('Failed to fetch announcements:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, [currentPage, deptFilter, yearFilter]);

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const onSubmit = async (data) => {
    try {
      const formData = new FormData();
      formData.append('title', data.title);
      formData.append('body', data.body);
      formData.append('isPinned', data.isPinned ? 'true' : 'false');

      data.targetDepartments.forEach((dept) => {
        formData.append('targetDepartments', dept);
      });
      data.targetYears.forEach((yr) => {
        formData.append('targetYears', Number(yr));
      });

      if (selectedFile) {
        formData.append('attachment', selectedFile);
      }

      await api.post('/announcements', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setIsCreateOpen(false);
      reset();
      setSelectedFile(null);
      fetchAnnouncements();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to post announcement');
    }
  };

  const handleTogglePin = async (id) => {
    try {
      await api.put(`/announcements/${id}/pin`);
      fetchAnnouncements();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to change pin status');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this announcement?')) return;
    try {
      await api.delete(`/announcements/${id}`);
      fetchAnnouncements();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to delete announcement');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Megaphone className="h-8 w-8 text-primary-500" />
            <span className="font-serif">Campus Notices</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Browse critical news, departmental directives, and general updates.
          </p>
        </div>

        {user?.role === 'admin' && (
          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 text-white font-semibold py-2.5 px-4 rounded-xl shadow-md transition-all active:scale-[0.98] shrink-0"
          >
            <Plus className="h-5 w-5" />
            <span>Create Notice</span>
          </button>
        )}
      </div>

      {/* Filters (For Admin to verify target listings) */}
      {user?.role === 'admin' && (
        <div className="glass-premium rounded-2xl p-4 flex flex-wrap gap-4 items-center justify-between">
          <div className="flex items-center gap-2 text-slate-500">
            <Filter className="h-4 w-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Audience Filters</span>
          </div>
          <div className="flex gap-3">
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-600 dark:text-slate-355"
            >
              <option value="">All Departments</option>
              <option value="CS">CS</option>
              <option value="IT">IT</option>
              <option value="EC">EC</option>
              <option value="EE">EE</option>
              <option value="ME">ME</option>
              <option value="CE">CE</option>
            </select>

            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-600 dark:text-slate-355"
            >
              <option value="">All Years</option>
              <option value="1">1st Year</option>
              <option value="2">2nd Year</option>
              <option value="3">3rd Year</option>
              <option value="4">4th Year</option>
            </select>
          </div>
        </div>
      )}

      {/* Notice Feed */}
      <div className="max-w-4xl mx-auto space-y-6">
        {isLoading ? (
          <div className="py-20 flex justify-center items-center">
            <Loader2 className="h-10 w-10 animate-spin text-primary-500" />
          </div>
        ) : announcements.length > 0 ? (
          <div className="space-y-6">
            {announcements.map((ann) => (
              <div
                key={ann._id}
                className={`relative rounded-3xl border p-6 transition-all duration-300 ${
                  ann.isPinned
                    ? 'border-primary-500/30 bg-primary-500/5 shadow-md shadow-primary-500/5'
                    : 'border-slate-200/50 bg-white dark:border-slate-850 dark:bg-slate-900'
                }`}
              >
                {/* Pin indicator tag */}
                {ann.isPinned && (
                  <div className="absolute top-4 right-4 flex items-center gap-1 text-primary-600 dark:text-primary-400">
                    <Pin className="h-4 w-4 fill-current" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Pinned</span>
                  </div>
                )}

                <div className="flex items-start gap-4">
                  {/* Avatar wrapper */}
                  <img
                    src={ann.createdBy?.avatar}
                    alt={ann.createdBy?.name}
                    className="h-10 w-10 rounded-full border border-slate-200 dark:border-slate-800 object-cover shrink-0"
                  />

                  <div className="flex-1 space-y-3">
                    <div>
                      <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                        {ann.createdBy?.name}
                        <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                          Admin
                        </span>
                      </h4>
                      <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> {new Date(ann.createdAt).toLocaleString()}
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <h3 className="text-base font-extrabold text-slate-850 dark:text-slate-100">
                        {ann.title}
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-slate-350 leading-relaxed whitespace-pre-line">
                        {ann.body}
                      </p>
                    </div>

                    {/* Target tags details */}
                    <div className="flex flex-wrap gap-2 text-[9px] font-bold uppercase tracking-wider text-slate-400">
                      <span>Targets:</span>
                      {ann.targetDepartments.map(dept => (
                        <span key={dept} className="bg-slate-100 dark:bg-slate-850 px-1.5 py-0.5 rounded text-slate-500">
                          Dept: {dept}
                        </span>
                      ))}
                      {ann.targetYears.map(yr => (
                        <span key={yr} className="bg-slate-100 dark:bg-slate-850 px-1.5 py-0.5 rounded text-slate-500">
                          Year: {yr === 0 ? 'All' : yr}
                        </span>
                      ))}
                    </div>

                    {/* Attachment links */}
                    {ann.attachment && (
                      <div className="pt-2">
                        <a
                          href={getFileUrl(ann.attachment)}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-600 dark:text-primary-400 hover:underline bg-primary-500/5 px-3 py-1.5 rounded-xl border border-primary-500/10"
                        >
                          <Paperclip className="h-3.5 w-3.5" />
                          <span>View Notice Attachment</span>
                        </a>
                      </div>
                    )}

                    {/* Admin Moderation controls */}
                    {user?.role === 'admin' && (
                      <div className="flex gap-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs font-semibold">
                        <button
                          onClick={() => handleTogglePin(ann._id)}
                          className="flex items-center gap-1 text-slate-500 hover:text-primary-500 transition-colors"
                        >
                          <Pin className="h-4 w-4" />
                          <span>{ann.isPinned ? 'Unpin' : 'Pin'} Notice</span>
                        </button>
                        <button
                          onClick={() => handleDelete(ann._id)}
                          className="flex items-center gap-1 text-red-500 hover:text-red-600 transition-colors ml-auto"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span>Delete</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Pagination */}
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
          <div className="py-20 text-center text-slate-400 border border-dashed border-slate-200 dark:border-slate-850 rounded-3xl bg-white dark:bg-slate-900">
            <Megaphone className="h-12 w-12 mx-auto opacity-40 mb-3 animate-pulse-subtle" />
            <p className="text-sm font-medium">No notices published</p>
            <p className="text-xs">Important announcements will be displayed here.</p>
          </div>
        )}
      </div>

      {/* Creation Modal for Admins */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/20 backdrop-blur-sm animate-fadeIn p-4">
          <div
            onClick={() => {
              setIsCreateOpen(false);
              setSelectedFile(null);
            }}
            className="absolute inset-0"
          />
          <div className="relative w-full max-w-lg bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl z-10 animate-scaleIn">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-5">
              <h2 className="text-lg font-bold text-slate-850 dark:text-slate-100 flex items-center gap-2">
                <Megaphone className="h-5 w-5 text-primary-500" />
                <span>Publish Announcement Notice</span>
              </h2>
              <button
                onClick={() => {
                  setIsCreateOpen(false);
                  setSelectedFile(null);
                }}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-h-[80vh] overflow-y-auto pr-1">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Notice Title
                </label>
                <input
                  type="text"
                  {...register('title')}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-primary-500"
                  placeholder="e.g. End Semester Exam Timetable, Holiday Announcement"
                />
                {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Notice Details
                </label>
                <textarea
                  {...register('body')}
                  rows={5}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-955 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-primary-500 resize-none"
                  placeholder="Write the message text..."
                />
                {errors.body && <p className="mt-1 text-xs text-red-500">{errors.body.message}</p>}
              </div>

              {/* Target Departments Select Multiple */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Target Departments (Select Multiple)
                </label>
                <select
                  multiple
                  {...register('targetDepartments')}
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs text-slate-800 dark:text-slate-200 focus:outline-none h-24"
                >
                  <option value="All">All Departments</option>
                  <option value="CS">Computer Science (CS)</option>
                  <option value="IT">Information Technology (IT)</option>
                  <option value="EC">Electronics & Comm. (EC)</option>
                  <option value="EE">Electrical Eng. (EE)</option>
                  <option value="ME">Mechanical Eng. (ME)</option>
                  <option value="CE">Civil Eng. (CE)</option>
                </select>
                <p className="mt-1 text-[10px] text-slate-400">Hold Ctrl (Cmd) to select multiple target categories.</p>
              </div>

              {/* Target Years Select Multiple */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Target Academic Years (Select Multiple)
                </label>
                <select
                  multiple
                  {...register('targetYears')}
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-955 text-xs text-slate-800 dark:text-slate-200 focus:outline-none h-24"
                >
                  <option value="0">All Years</option>
                  <option value="1">1st Year</option>
                  <option value="2">2nd Year</option>
                  <option value="3">3rd Year</option>
                  <option value="4">4th Year</option>
                </select>
              </div>

              {/* Pin notice check */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isPinned"
                  {...register('isPinned')}
                  className="rounded border-slate-350 text-primary-500 focus:ring-primary-500/25 h-4 w-4"
                />
                <label htmlFor="isPinned" className="text-xs font-semibold text-slate-600 dark:text-slate-300 cursor-pointer">
                  Pin this notice at the top of the feed
                </label>
              </div>

              {/* Attachment field */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Attach Document Notice (PDF/Image)
                </label>
                <input
                  type="file"
                  onChange={handleFileChange}
                  className="w-full text-xs text-slate-500 dark:text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-primary-500/15 file:text-primary-600 dark:file:text-primary-400 hover:file:bg-primary-500/25 cursor-pointer"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 text-white font-semibold py-3 px-4 rounded-xl shadow-lg transition-all active:scale-[0.98] pt-3 shrink-0"
              >
                Publish Broadcast Notice
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Announcements;
