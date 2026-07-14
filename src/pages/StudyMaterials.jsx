import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';
import { getFileUrl } from '../services/fileUrl';
import {
  BookOpen,
  Search,
  Plus,
  Trash2,
  FileText,
  Download,
  Eye,
  X,
  Upload,
  ChevronRight,
  Loader2,
  AlertCircle
} from 'lucide-react';

const noteSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  subject: z.string().min(2, 'Subject is required'),
  department: z.enum(['CS', 'IT', 'EC', 'EE', 'ME', 'CE', 'Other']),
  year: z.string().min(1, 'Academic year is required'),
  semester: z.string().min(1, 'Semester is required'),
});

const StudyMaterials = () => {
  const { user } = useAuthStore();
  const [notes, setNotes] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1 });
  const [isLoading, setIsLoading] = useState(true);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [previewNote, setPreviewNote] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState(user?.role === 'student' ? user.department : '');
  const [yearFilter, setYearFilter] = useState(user?.role === 'student' ? user.year.toString() : '');
  const [semFilter, setSemFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(noteSchema),
    defaultValues: {
      department: user?.role === 'student' ? user.department : 'CS',
      year: user?.role === 'student' ? user.year.toString() : '1',
      semester: user?.role === 'student' ? user.semester.toString() : '1',
    },
  });

  const fetchNotes = async () => {
    try {
      setIsLoading(true);
      const searchParam = searchQuery ? `&q=${searchQuery}` : '';
      const deptParam = deptFilter ? `&department=${deptFilter}` : '';
      const yearParam = yearFilter ? `&year=${yearFilter}` : '';
      const semParam = semFilter ? `&semester=${semFilter}` : '';

      const response = await api.get(
        `/notes?page=${currentPage}&limit=9${searchParam}${deptParam}${yearParam}${semParam}`
      );
      setNotes(response.data.data.notes);
      setPagination(response.data.data.pagination);
    } catch (error) {
      console.error('Failed to fetch study notes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Debounce search but immediately apply filter changes
    const delay = searchQuery !== '' ? 500 : 0;
    const timer = setTimeout(() => {
      fetchNotes();
    }, delay);
    return () => clearTimeout(timer);
  }, [currentPage, deptFilter, yearFilter, semFilter, searchQuery]);

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const onSubmit = async (data) => {
    try {
      if (!selectedFile) {
        alert('Please select a file to upload');
        return;
      }

      const formData = new FormData();
      formData.append('title', data.title);
      formData.append('subject', data.subject);
      formData.append('department', data.department);
      formData.append('year', data.year);
      formData.append('semester', data.semester);
      formData.append('file', selectedFile);

      await api.post('/notes', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setIsUploadOpen(false);
      reset();
      setSelectedFile(null);
      fetchNotes();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to upload notes');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete these study notes?')) return;
    try {
      await api.delete(`/notes/${id}`);
      fetchNotes();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to delete study materials');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <BookOpen className="h-8 w-8 text-primary-500" />
            <span className="font-serif">Study Materials</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Browse notes, search subjects, and download semester preparation materials.
          </p>
        </div>

        <button
          onClick={() => setIsUploadOpen(true)}
          className="flex items-center justify-center gap-2 bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 text-white font-semibold py-2.5 px-4 rounded-xl shadow-md transition-all active:scale-[0.98] shrink-0"
        >
          <Plus className="h-5 w-5" />
          <span>Upload Notes</span>
        </button>
      </div>

      {/* Control Filters Toolbar */}
      <div className="glass-premium rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Search bar */}
        <div className="relative w-full md:max-w-sm">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="h-4 w-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => { setCurrentPage(1); setSearchQuery(e.target.value); }}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-150 focus:outline-none focus:border-primary-500 placeholder-slate-400"
            placeholder="Search subject or notes title..."
          />
        </div>

        {/* Filter options */}
        <div className="flex flex-wrap gap-3 w-full md:w-auto justify-end">
          <select
            value={deptFilter}
            onChange={(e) => {
              setDeptFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-600 dark:text-slate-350 focus:outline-none"
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
            onChange={(e) => {
              setYearFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-600 dark:text-slate-350 focus:outline-none"
          >
            <option value="">All Years</option>
            <option value="1">1st Year</option>
            <option value="2">2nd Year</option>
            <option value="3">3rd Year</option>
            <option value="4">4th Year</option>
          </select>

          <select
            value={semFilter}
            onChange={(e) => {
              setSemFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-600 dark:text-slate-350 focus:outline-none"
          >
            <option value="">All Semesters</option>
            {Array.from({ length: 8 }).map((_, i) => (
              <option key={i + 1} value={i + 1}>
                Sem {i + 1}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Catalog Grid */}
      {isLoading ? (
        <div className="py-20 flex justify-center items-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary-500" />
        </div>
      ) : notes.length > 0 ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {notes.map((note) => (
              <div
                key={note._id}
                className="group relative overflow-hidden rounded-3xl border border-slate-200/50 bg-white p-5 dark:border-slate-850 dark:bg-slate-900 shadow-sm hover:shadow-md transition-all duration-300 card-hover-effect flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start gap-4 mb-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-primary-500/10 text-primary-600 dark:text-primary-400 px-2 py-0.5 rounded-md">
                      {note.department} - Sem {note.semester}
                    </span>
                    <span className="text-[10px] text-slate-400 font-semibold">
                      {new Date(note.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100 group-hover:text-primary-500 transition-colors line-clamp-1 mb-1">
                    {note.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-450 font-semibold mb-4">
                    Subject: {note.subject}
                  </p>
                </div>

                <div className="border-t border-slate-100 dark:border-slate-800/80 pt-4 mt-2 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <img
                      src={note.uploadedBy?.avatar}
                      alt={note.uploadedBy?.name}
                      className="h-6 w-6 rounded-full border object-cover"
                    />
                    <span className="text-[10px] font-bold text-slate-400 truncate max-w-[100px]">
                      {note.uploadedBy?.name}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setPreviewNote(note)}
                      className="p-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-primary-500 transition-colors"
                      title="Preview PDF"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <a
                      href={getFileUrl(note.fileUrl)}
                      target="_blank"
                      rel="noreferrer"
                      download
                      className="p-2 rounded-xl bg-primary-500/10 text-primary-500 border border-transparent hover:bg-primary-500 hover:text-white transition-all"
                      title="Download PDF"
                    >
                      <Download className="h-4 w-4" />
                    </a>

                    {(note.uploadedBy?._id === user._id || user.role === 'admin') && (
                      <button
                        onClick={() => handleDelete(note._id)}
                        className="p-2 rounded-xl bg-red-500/10 text-red-500 border border-transparent hover:bg-red-500 hover:text-white transition-all"
                        title="Delete Notes"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

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
          <BookOpen className="h-12 w-12 mx-auto opacity-40 mb-3 animate-pulse-subtle" />
          <p className="text-sm font-medium">No study materials published</p>
          <p className="text-xs">Select other departments or search keywords.</p>
        </div>
      )}

      {/* Upload Notes Modal */}
      {isUploadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/20 backdrop-blur-sm animate-fadeIn p-4">
          <div
            onClick={() => {
              setIsUploadOpen(false);
              setSelectedFile(null);
            }}
            className="absolute inset-0"
          />
          <div className="relative w-full max-w-md bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl z-10 animate-scaleIn">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-5">
              <h2 className="text-lg font-bold text-slate-850 dark:text-slate-100 flex items-center gap-2">
                <Upload className="h-5 w-5 text-primary-500" />
                <span>Upload Study Materials</span>
              </h2>
              <button
                onClick={() => {
                  setIsUploadOpen(false);
                  setSelectedFile(null);
                }}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Notes Title
                </label>
                <input
                  type="text"
                  {...register('title')}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-primary-500"
                  placeholder="e.g. Unit 3 Trees & Graphs Notes"
                />
                {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Subject / Course
                </label>
                <input
                  type="text"
                  {...register('subject')}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-primary-500"
                  placeholder="e.g. Data Structures & Algorithms"
                />
                {errors.subject && <p className="mt-1 text-xs text-red-500">{errors.subject.message}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    Dept
                  </label>
                  <select
                    {...register('department')}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs text-slate-805 dark:text-slate-200 focus:outline-none"
                  >
                    <option value="CS">CS</option>
                    <option value="IT">IT</option>
                    <option value="EC">EC</option>
                    <option value="EE">EE</option>
                    <option value="ME">ME</option>
                    <option value="CE">CE</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    Year
                  </label>
                  <select
                    {...register('year')}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs text-slate-805 dark:text-slate-200 focus:outline-none"
                  >
                    <option value="1">1st Year</option>
                    <option value="2">2nd Year</option>
                    <option value="3">3rd Year</option>
                    <option value="4">4th Year</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    Sem
                  </label>
                  <select
                    {...register('semester')}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-955 text-xs text-slate-805 dark:text-slate-200 focus:outline-none"
                  >
                    {Array.from({ length: 8 }).map((_, i) => (
                      <option key={i + 1} value={i + 1}>
                        Sem {i + 1}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Upload field */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Select PDF Document File
                </label>
                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-250 dark:border-slate-800 rounded-2xl cursor-pointer bg-slate-50 dark:bg-slate-950/40 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors">
                    {selectedFile ? (
                      <div className="p-4 text-center space-y-1">
                        <FileText className="h-8 w-8 text-primary-500 mx-auto" />
                        <p className="text-xs font-bold truncate max-w-[250px]">{selectedFile.name}</p>
                        <p className="text-[10px] text-slate-400">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center px-4">
                        <Upload className="w-8 h-8 mb-2 text-slate-400" />
                        <p className="mb-1 text-xs font-semibold text-slate-500">
                          Click to select notes document
                        </p>
                        <p className="text-[10px] text-slate-450">PDF, PNG, JPG (Max 10MB)</p>
                      </div>
                    )}
                    <input
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 text-white font-semibold py-3 px-4 rounded-xl shadow-lg transition-all active:scale-[0.98] pt-2"
              >
                Upload to Catalog
              </button>
            </form>
          </div>
        </div>
      )}

      {/* PDF / In-Browser Preview Modal */}
      {previewNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-sm animate-fadeIn p-4">
          <div
            onClick={() => setPreviewNote(null)}
            className="absolute inset-0"
          />
          <div className="relative w-full max-w-4xl h-[85vh] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl z-10 animate-scaleIn flex flex-col overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-6 py-4">
              <div>
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary-500" />
                  <span>Previewing Document Notice</span>
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {previewNote.title} (Subject: {previewNote.subject})
                </p>
              </div>
              <button
                onClick={() => setPreviewNote(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-850"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Iframe preview container */}
            <div className="flex-1 bg-slate-100 dark:bg-slate-950">
              <iframe
                src={getFileUrl(previewNote.fileUrl)}
                title={previewNote.title}
                className="w-full h-full border-none"
              />
            </div>

            <div className="border-t border-slate-100 dark:border-slate-800 px-6 py-4 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
              <span className="text-[10px] text-slate-400 font-semibold">
                Uploaded by: {previewNote.uploadedBy?.name}
              </span>
              <a
                href={getFileUrl(previewNote.fileUrl)}
                target="_blank"
                rel="noreferrer"
                download
                className="flex items-center gap-1.5 bg-primary-600 hover:bg-primary-500 text-white font-semibold py-2 px-4 rounded-xl text-xs shadow-md shadow-primary-500/10"
              >
                <Download className="h-4 w-4" />
                <span>Download Study Materials</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudyMaterials;
