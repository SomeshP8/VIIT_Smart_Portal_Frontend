import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';
import { getFileUrl } from '../services/fileUrl';
import {
  Search,
  Plus,
  MapPin,
  Calendar,
  Tag,
  CheckCircle,
  FileText,
  User,
  X,
  Eye,
  Check,
  Slash,
  AlertCircle,
  Upload,
  Loader2
} from 'lucide-react';

const createItemSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(5, 'Description must be at least 5 characters'),
  location: z.string().min(2, 'Location is required'),
  date: z.string().min(1, 'Date is required'),
  type: z.enum(['lost', 'found']),
});

const claimSchema = z.object({
  message: z.string().min(10, 'Message must explain ownership in detail (at least 10 characters)'),
});

const LostFound = () => {
  const { user } = useAuthStore();
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1 });
  const [selectedItem, setSelectedItem] = useState(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isClaimOpen, setIsClaimOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('open'); // default to open
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);

  // Forms
  const {
    register: registerCreate,
    handleSubmit: handleSubmitCreate,
    reset: resetCreate,
    formState: { errors: errorsCreate },
  } = useForm({
    resolver: zodResolver(createItemSchema),
    defaultValues: { type: 'lost' },
  });

  const {
    register: registerClaim,
    handleSubmit: handleSubmitClaim,
    reset: resetClaim,
    formState: { errors: errorsClaim },
  } = useForm({
    resolver: zodResolver(claimSchema),
  });

  const fetchItems = async () => {
    try {
      setIsLoading(true);
      const searchParam = searchQuery ? `&q=${searchQuery}` : '';
      const typeParam = typeFilter ? `&type=${typeFilter}` : '';
      const statusParam = statusFilter ? `&status=${statusFilter}` : '';

      const response = await api.get(
        `/lost-found?page=${currentPage}&limit=9${searchParam}${typeParam}${statusParam}`
      );
      setItems(response.data.data.items);
      setPagination(response.data.data.pagination);
    } catch (error) {
      console.error('Failed to fetch Lost & Found items:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [currentPage, typeFilter, statusFilter]);

  // Debounced search trigger
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1);
      fetchItems();
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setFilePreview(URL.createObjectURL(file));
    }
  };

  const onCreateSubmit = async (data) => {
    try {
      const formData = new FormData();
      formData.append('title', data.title);
      formData.append('description', data.description);
      formData.append('location', data.location);
      formData.append('date', data.date);
      formData.append('type', data.type);
      if (selectedFile) {
        formData.append('image', selectedFile);
      }

      await api.post('/lost-found', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setIsCreateOpen(false);
      resetCreate();
      setSelectedFile(null);
      setFilePreview(null);
      fetchItems();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to submit report');
    }
  };

  const onClaimSubmit = async (data) => {
    try {
      await api.post(`/lost-found/${selectedItem._id}/claim`, data);
      setIsClaimOpen(false);
      resetClaim();
      // Refresh details
      const detailRes = await api.get(`/lost-found/${selectedItem._id}`);
      setSelectedItem(detailRes.data.data);
      fetchItems();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to file claim');
    }
  };

  const handleClaimResolution = async (claimId, status) => {
    try {
      const confirmText = `Are you sure you want to ${status} this claim?`;
      if (!window.confirm(confirmText)) return;

      await api.put(`/lost-found/${selectedItem._id}/claim/${claimId}`, { status });
      
      // Refresh detail panel
      const detailRes = await api.get(`/lost-found/${selectedItem._id}`);
      setSelectedItem(detailRes.data.data);
      fetchItems();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to resolve claim');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Search className="h-8 w-8 text-primary-500" />
            <span className="font-serif">Lost & Found Hub</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Report lost belongings, list items found on campus, and manage returns.
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center justify-center gap-2 bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 text-white font-semibold py-2.5 px-4 rounded-xl shadow-md transition-all active:scale-[0.98] shrink-0"
        >
          <Plus className="h-5 w-5" />
          <span>Report an Item</span>
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
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-150 focus:outline-none focus:border-primary-500 placeholder-slate-400"
            placeholder="Search keywords..."
          />
        </div>

        {/* Action Tabs & Select boxes */}
        <div className="flex flex-wrap gap-3 w-full md:w-auto justify-end">
          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-600 dark:text-slate-350 focus:outline-none"
          >
            <option value="">All Items</option>
            <option value="lost">Lost</option>
            <option value="found">Found</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-600 dark:text-slate-350 focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="open">Open Listings</option>
            <option value="claimed">Claimed Items</option>
          </select>
        </div>
      </div>

      {/* Grid Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Item List Grid */}
        <div className="lg:col-span-2">
          {isLoading ? (
            <div className="py-20 flex justify-center items-center">
              <Loader2 className="h-10 w-10 animate-spin text-primary-500" />
            </div>
          ) : items.length > 0 ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {items.map((item) => (
                  <div
                    key={item._id}
                    onClick={() => setSelectedItem(item)}
                    className={`group rounded-3xl border overflow-hidden cursor-pointer transition-all duration-300 card-hover-effect flex flex-col ${
                      selectedItem?._id === item._id
                        ? 'border-primary-500 bg-primary-500/5 shadow-md shadow-primary-500/5'
                        : 'border-slate-200/50 bg-white dark:border-slate-800/50 dark:bg-slate-900'
                    }`}
                  >
                    {/* Item Image */}
                    <div className="relative aspect-video w-full bg-slate-100 dark:bg-slate-950 overflow-hidden shrink-0">
                      {item.image ? (
                        <img
                          src={getFileUrl(item.image)}
                          alt={item.title}
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-slate-400">
                          <Tag className="h-12 w-12 opacity-30" />
                        </div>
                      )}

                      {/* Type and status badges on top of image */}
                      <div className="absolute top-3.5 left-3.5 flex gap-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm border ${
                          item.type === 'lost'
                            ? 'bg-rose-500 text-white border-transparent'
                            : 'bg-emerald-500 text-white border-transparent'
                        }`}>
                          {item.type}
                        </span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm border ${
                          item.status === 'open'
                            ? 'bg-blue-500 text-white border-transparent'
                            : 'bg-slate-600 text-white border-transparent'
                        }`}>
                          {item.status}
                        </span>
                      </div>
                    </div>

                    <div className="p-5 flex-1 flex flex-col justify-between">
                      <div>
                        <h4 className="text-base font-bold text-slate-800 dark:text-slate-100 group-hover:text-primary-500 transition-colors line-clamp-1 mb-1.5">
                          {item.title}
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed mb-4">
                          {item.description}
                        </p>
                      </div>

                      <div className="space-y-1.5 text-[10px] text-slate-400 font-semibold border-t border-slate-100 dark:border-slate-800/60 pt-3">
                        <p className="flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                          <span>{item.location}</span>
                        </p>
                        <p className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                          <span>{new Date(item.date).toLocaleDateString()}</span>
                        </p>
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
            <div className="py-20 text-center text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl bg-white dark:bg-slate-900">
              <Tag className="h-12 w-12 mx-auto opacity-40 mb-3 animate-pulse-subtle" />
              <p className="text-sm font-medium">No items found</p>
              <p className="text-xs">Adjust filters or submit a new report.</p>
            </div>
          )}
        </div>

        {/* Selected Item Detail Panel */}
        <div className="glass-premium rounded-3xl p-6 self-start">
          {selectedItem ? (
            <div className="space-y-6">
              {/* Detail header */}
              <div>
                <div className="flex gap-2 mb-2">
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                    selectedItem.type === 'lost'
                      ? 'bg-rose-500/10 text-rose-600 border border-rose-500/20'
                      : 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                  }`}>
                    {selectedItem.type}
                  </span>
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                    selectedItem.status === 'open'
                      ? 'bg-blue-500/10 text-blue-600 border border-blue-500/20'
                      : 'bg-slate-500/10 text-slate-500 border border-slate-500/20'
                  }`}>
                    {selectedItem.status}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-850 dark:text-slate-100 leading-tight">
                  {selectedItem.title}
                </h3>
              </div>

              {/* Large Image Showcase */}
              {selectedItem.image && (
                <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-slate-200/50 dark:border-slate-800/50">
                  <img
                    src={getFileUrl(selectedItem.image)}
                    alt={selectedItem.title}
                    className="h-full w-full object-cover"
                  />
                </div>
              )}

              {/* Description */}
              <div className="space-y-1.5 text-xs">
                <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Description</span>
                <p className="text-slate-700 dark:text-slate-350 leading-relaxed bg-slate-50 dark:bg-slate-900/55 p-3 rounded-xl border border-slate-100 dark:border-slate-800/40">
                  {selectedItem.description}
                </p>
              </div>

              {/* Parameters info */}
              <div className="grid grid-cols-2 gap-4 border-y border-slate-100 dark:border-slate-800/80 py-4 text-xs font-semibold">
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Location</span>
                  <span className="text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-slate-400" /> {selectedItem.location}
                  </span>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Date</span>
                  <span className="text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" /> {new Date(selectedItem.date).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Reporter Details */}
              <div className="space-y-2 text-xs">
                <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Reporter Profile</span>
                <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50">
                  <div className="p-2 bg-primary-500/10 rounded-xl text-primary-500">
                    <User className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-700 dark:text-slate-300">{selectedItem.reporter?.name}</p>
                    <p className="text-[10px] text-slate-400">
                      {selectedItem.reporter?.role === 'admin'
                        ? 'Staff Administrator'
                        : `${selectedItem.reporter?.department} Student`}
                    </p>
                  </div>
                </div>
              </div>

              {/* Verification & Claiming Process */}
              {selectedItem.status === 'claimed' ? (
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-250 dark:border-slate-800/80 text-center space-y-2">
                  <div className="inline-flex rounded-full bg-emerald-500/10 p-2 text-emerald-500">
                    <CheckCircle className="h-6 w-6" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Listing Claimed & Resolved</h4>
                  <p className="text-[10px] text-slate-400">
                    This item has been successfully claimed by {selectedItem.claimedBy?.name}.
                  </p>
                </div>
              ) : (
                /* Item is OPEN */
                <div className="space-y-4">
                  {selectedItem.reporter?._id !== user._id && user.role !== 'admin' ? (
                    /* STUDENT VISITING - Can submit a claim if they haven't yet */
                    selectedItem.claims?.some((c) => c.claimant?._id === user._id) ? (
                      <div className="p-3 bg-amber-500/10 border border-amber-500/25 rounded-2xl text-center text-xs text-amber-600 dark:text-amber-400 font-semibold">
                        You have a claim request pending review
                      </div>
                    ) : isClaimOpen ? (
                      <form onSubmit={handleSubmitClaim(onClaimSubmit)} className="space-y-3 p-3 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-850">
                        <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">File Ownership Claim</h4>
                        <textarea
                          {...registerClaim('message')}
                          rows={3}
                          className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-primary-500 resize-none"
                          placeholder="Provide proof of ownership, characteristics of the item, etc."
                        />
                        {errorsClaim.message && (
                          <p className="text-[10px] text-red-500">{errorsClaim.message.message}</p>
                        )}
                        <div className="flex gap-2">
                          <button
                            type="submit"
                            className="flex-1 bg-primary-600 hover:bg-primary-500 text-white font-semibold py-1.5 rounded-lg text-xs"
                          >
                            Submit Claim
                          </button>
                          <button
                            type="button"
                            onClick={() => setIsClaimOpen(false)}
                            className="px-3 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 rounded-lg text-xs"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    ) : (
                      <button
                        onClick={() => setIsClaimOpen(true)}
                        className="w-full bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 text-white font-semibold py-2.5 rounded-2xl text-xs transition-all active:scale-[0.98]"
                      >
                        File a Claim
                      </button>
                    )
                  ) : (
                    /* ORIGINAL POSTER OR ADMIN VISITING - View list of claims and approve/reject */
                    <div className="space-y-3">
                      <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Submitted Claims ({selectedItem.claims?.length || 0})</span>
                      {selectedItem.claims && selectedItem.claims.length > 0 ? (
                        <div className="space-y-3">
                          {selectedItem.claims.map((claim) => (
                            <div key={claim._id} className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-850 rounded-2xl text-xs space-y-2">
                              <div className="flex justify-between items-center">
                                <p className="font-bold text-slate-700 dark:text-slate-300">
                                  {claim.claimant?.name} <span className="text-[10px] font-medium text-slate-400">({claim.claimant?.department})</span>
                                </p>
                                <span className={`text-[10px] font-bold uppercase ${
                                  claim.status === 'pending'
                                    ? 'text-amber-500'
                                    : claim.status === 'approved'
                                    ? 'text-emerald-500'
                                    : 'text-rose-500'
                                }`}>
                                  {claim.status}
                                </span>
                              </div>
                              <p className="text-xs text-slate-500 dark:text-slate-400 italic bg-white dark:bg-slate-950 p-2 rounded-xl border border-slate-100 dark:border-slate-900/60 leading-normal">
                                "{claim.message}"
                              </p>
                              {claim.status === 'pending' && (
                                <div className="flex gap-2 justify-end pt-1">
                                  <button
                                    onClick={() => handleClaimResolution(claim._id, 'approved')}
                                    className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-1 px-2.5 rounded-lg text-[10px]"
                                  >
                                    <Check className="h-3 w-3" /> Approve
                                  </button>
                                  <button
                                    onClick={() => handleClaimResolution(claim._id, 'rejected')}
                                    className="flex items-center gap-1 bg-rose-600 hover:bg-rose-500 text-white font-semibold py-1 px-2.5 rounded-lg text-[10px]"
                                  >
                                    <X className="h-3 w-3" /> Reject
                                  </button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="py-4 text-center text-[10px] text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50">
                          No claim requests filed yet
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="py-12 text-center text-slate-400 dark:text-slate-500">
              <Eye className="h-8 w-8 mx-auto opacity-35 mb-2" />
              <p className="text-sm font-semibold">Select an item</p>
              <p className="text-xs mt-0.5">Click a card grid item to view full image and claim requests.</p>
            </div>
          )}
        </div>
      </div>

      {/* Slide-out drawer/modal for reporting lost/found items */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-950/20 backdrop-blur-sm animate-fadeIn">
          <div
            onClick={() => {
              setIsCreateOpen(false);
              setFilePreview(null);
              setSelectedFile(null);
            }}
            className="absolute inset-0"
          />
          <div className="relative h-full w-full max-w-md bg-white p-6 shadow-2xl dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 flex flex-col z-10 animate-slideLeft">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-6">
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Tag className="h-5 w-5 text-primary-500" />
                <span>Submit Item Report</span>
              </h2>
              <button
                onClick={() => {
                  setIsCreateOpen(false);
                  setFilePreview(null);
                  setSelectedFile(null);
                }}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitCreate(onCreateSubmit)} className="space-y-4 flex-1 flex flex-col overflow-y-auto pr-1">
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  Report Type
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <label className={`flex items-center justify-center gap-1.5 py-2 px-4 rounded-xl border cursor-pointer text-xs transition-all ${
                    registerCreate('type').value === 'lost' || true // default
                      ? 'border-rose-500 bg-rose-500/5 text-rose-600 font-semibold'
                      : 'border-slate-200 text-slate-500'
                  }`}>
                    <input
                      type="radio"
                      value="lost"
                      {...registerCreate('type')}
                      className="sr-only"
                    />
                    <span>I Lost Something</span>
                  </label>
                  <label className="flex items-center justify-center gap-1.5 py-2 px-4 rounded-xl border border-slate-200 cursor-pointer text-xs text-slate-500">
                    <input
                      type="radio"
                      value="found"
                      {...registerCreate('type')}
                      className="sr-only"
                    />
                    <span>I Found Something</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                  Item Title
                </label>
                <input
                  type="text"
                  {...registerCreate('title')}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-955 text-slate-850 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-primary-500"
                  placeholder="e.g. Black Leather Wallet, Keys, Water Bottle"
                />
                {errorsCreate.title && (
                  <p className="mt-1 text-xs text-red-500">{errorsCreate.title.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                  Location (Where?)
                </label>
                <input
                  type="text"
                  {...registerCreate('location')}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-955 text-slate-850 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-primary-500"
                  placeholder="e.g. Library Block A, Bus No. 4, Canteen"
                />
                {errorsCreate.location && (
                  <p className="mt-1 text-xs text-red-500">{errorsCreate.location.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                  Date
                </label>
                <input
                  type="date"
                  {...registerCreate('date')}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-955 text-slate-850 dark:text-slate-200 focus:outline-none focus:border-primary-500"
                />
                {errorsCreate.date && (
                  <p className="mt-1 text-xs text-red-500">{errorsCreate.date.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                  Detailed Description
                </label>
                <textarea
                  {...registerCreate('description')}
                  rows={4}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-955 text-slate-850 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-primary-500 resize-none"
                  placeholder="Provide key details like brands, colors, contents, distinct markings..."
                />
                {errorsCreate.description && (
                  <p className="mt-1 text-xs text-red-500">{errorsCreate.description.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                  Upload Image
                </label>
                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-250 dark:border-slate-800 rounded-2xl cursor-pointer bg-slate-50 dark:bg-slate-950/40 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors">
                    {filePreview ? (
                      <div className="relative h-full w-full p-2">
                        <img
                          src={filePreview}
                          alt="preview"
                          className="h-full w-full object-contain rounded-xl"
                        />
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-8 h-8 mb-2 text-slate-400" />
                        <p className="mb-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
                          Click to upload image
                        </p>
                        <p className="text-[10px] text-slate-450">PNG, JPG, JPEG (Max 10MB)</p>
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 text-white font-semibold py-3 px-4 rounded-xl shadow-lg transition-all active:scale-[0.98] mt-6 shrink-0"
              >
                Submit Report
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LostFound;
