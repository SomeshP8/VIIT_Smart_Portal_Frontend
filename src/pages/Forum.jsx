import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';
import {
  MessageSquare,
  Search,
  Plus,
  Trash2,
  ThumbsUp,
  ThumbsDown,
  Tag,
  CornerDownRight,
  Send,
  X,
  Calendar,
  User,
  ArrowLeft,
  Loader2,
  MessageCircle
} from 'lucide-react';

const postSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(150, 'Title cannot exceed 150 characters'),
  content: z.string().min(10, 'Details must be at least 10 characters'),
  tagsString: z.string().optional(),
});

const replySchema = z.object({
  content: z.string().min(2, 'Reply must be at least 2 characters'),
});

const Forum = () => {
  const { user } = useAuthStore();
  const [posts, setPosts] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1 });
  const [selectedPost, setSelectedPost] = useState(null);
  const [replies, setReplies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRepliesLoading, setIsRepliesLoading] = useState(false);
  const [isAskOpen, setIsAskOpen] = useState(false);
  const [activeReplyInputId, setActiveReplyInputId] = useState(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [tagFilter, setTagFilter] = useState('');
  const [sortOrder, setSortOrder] = useState('newest'); // newest | upvoted
  const [currentPage, setCurrentPage] = useState(1);

  const {
    register: registerPost,
    handleSubmit: handleSubmitPost,
    reset: resetPost,
    formState: { errors: errorsPost },
  } = useForm({
    resolver: zodResolver(postSchema),
  });

  const {
    register: registerReply,
    handleSubmit: handleSubmitReply,
    reset: resetReply,
    formState: { errors: errorsReply },
  } = useForm({
    resolver: zodResolver(replySchema),
  });

  const fetchPosts = async () => {
    try {
      setIsLoading(true);
      const tagParam = tagFilter ? `&tag=${tagFilter}` : '';
      const searchParam = searchQuery ? `&q=${searchQuery}` : '';
      
      const response = await api.get(
        `/forum/posts?page=${currentPage}&limit=10&sort=${sortOrder}${tagParam}${searchParam}`
      );
      setPosts(response.data.data.posts);
      setPagination(response.data.data.pagination);
    } catch (error) {
      console.error('Failed to fetch forum posts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchReplies = async (postId) => {
    try {
      setIsRepliesLoading(true);
      const response = await api.get(`/forum/posts/${postId}/replies`);
      setReplies(response.data.data);
    } catch (error) {
      console.error('Failed to fetch replies:', error);
    } finally {
      setIsRepliesLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [currentPage, tagFilter, sortOrder]);

  // Debounced search trigger
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1);
      fetchPosts();
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    if (selectedPost) {
      fetchReplies(selectedPost._id);
    }
  }, [selectedPost]);

  const onAskSubmit = async (data) => {
    try {
      const tags = data.tagsString
        ? data.tagsString.split(',').map((t) => t.trim().toUpperCase()).filter(Boolean)
        : [];
      
      await api.post('/forum/posts', {
        title: data.title,
        content: data.content,
        tags,
      });

      setIsAskOpen(false);
      resetPost();
      fetchPosts();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to submit question');
    }
  };

  const onReplySubmit = async (data) => {
    try {
      await api.post(`/forum/posts/${selectedPost._id}/replies`, {
        content: data.content,
        parentId: activeReplyInputId, // null for top level replies
      });
      resetReply();
      setActiveReplyInputId(null);
      fetchReplies(selectedPost._id);
      
      // Update comment count on listed post
      setPosts(posts.map(p => p._id === selectedPost._id ? { ...p, replyCount: p.replyCount + 1 } : p));
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to post comment');
    }
  };

  const handleVote = async (postId, type) => {
    try {
      const response = await api.put(`/forum/posts/${postId}/${type}`);
      const { upvotes, downvotes } = response.data.data;
      
      // Update listed posts state
      setPosts(
        posts.map((p) => (p._id === postId ? { ...p, upvotes, downvotes } : p))
      );

      // Update selected details panel state
      if (selectedPost?._id === postId) {
        setSelectedItemState(upvotes, downvotes);
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Vote failed');
    }
  };

  const setSelectedItemState = (upvotes, downvotes) => {
    setSelectedItem(prev => ({
      ...prev,
      upvotes,
      downvotes,
    }));
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm('Are you sure you want to delete this thread?')) return;
    try {
      await api.delete(`/forum/posts/${postId}`);
      setSelectedPost(null);
      fetchPosts();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to delete thread');
    }
  };

  // Structured commenting (hierarchical replies renderer)
  const renderRepliesTree = () => {
    // Separate parent comments and nested replies
    const parentComments = replies.filter((r) => !r.parentId);
    const childComments = replies.filter((r) => r.parentId);

    return (
      <div className="space-y-4">
        {parentComments.map((parent) => {
          const children = childComments.filter((c) => c.parentId === parent._id);
          return (
            <div key={parent._id} className="space-y-3 p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-2xl">
              <div className="flex items-start gap-3">
                <img src={parent.author?.avatar} alt={parent.author?.name} className="h-8 w-8 rounded-full border object-cover shrink-0" />
                <div className="flex-1 text-xs">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-slate-700 dark:text-slate-200">{parent.author?.name}</span>
                    <span className="text-[10px] text-slate-400">{new Date(parent.createdAt).toLocaleString()}</span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-350 leading-relaxed font-medium">{parent.content}</p>
                  
                  {/* Action buttons */}
                  <div className="flex gap-4 pt-2 text-[10px] font-bold text-slate-400">
                    <button
                      onClick={() => setActiveReplyInputId(parent._id)}
                      className="hover:text-primary-500 flex items-center gap-0.5"
                    >
                      <CornerDownRight className="h-3 w-3" /> Reply
                    </button>
                  </div>
                </div>
              </div>

              {/* Children comments */}
              {children.length > 0 && (
                <div className="pl-6 border-l border-slate-200 dark:border-slate-800 space-y-3">
                  {children.map((child) => (
                    <div key={child._id} className="flex items-start gap-3 text-xs bg-white dark:bg-slate-950 p-3 rounded-xl border border-slate-100 dark:border-slate-900/60">
                      <img src={child.author?.avatar} alt={child.author?.name} className="h-6 w-6 rounded-full border object-cover shrink-0" />
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-0.5">
                          <span className="font-bold text-slate-700 dark:text-slate-350">{child.author?.name}</span>
                          <span className="text-[10px] text-slate-400">{new Date(child.createdAt).toLocaleString()}</span>
                        </div>
                        <p className="text-slate-600 dark:text-slate-400 leading-normal">{child.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Inline input if active */}
              {activeReplyInputId === parent._id && (
                <div className="pl-6 pt-1 animate-fadeIn">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      {...registerReply('content')}
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs focus:outline-none focus:border-primary-500"
                      placeholder={`Reply to ${parent.author?.name}...`}
                    />
                    <button
                      onClick={handleSubmitReply(onReplySubmit)}
                      className="bg-primary-600 hover:bg-primary-500 text-white rounded-xl px-3 flex items-center justify-center shrink-0"
                    >
                      <Send className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setActiveReplyInputId(null)}
                      className="p-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-850 rounded-xl"
                    >
                      <X className="h-3.5 w-3.5 text-slate-400" />
                    </button>
                  </div>
                  {errorsReply.content && <p className="text-[10px] text-red-500 mt-1">{errorsReply.content.message}</p>}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <MessageSquare className="h-8 w-8 text-primary-500" />
            <span className="font-serif">Discussion Forum</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Collaborate, ask questions, and share placement or academic preparation advice.
          </p>
        </div>

        <button
          onClick={() => setIsAskOpen(true)}
          className="flex items-center justify-center gap-2 bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 text-white font-semibold py-2.5 px-4 rounded-xl shadow-md transition-all active:scale-[0.98] shrink-0"
        >
          <Plus className="h-5 w-5" />
          <span>Ask Question</span>
        </button>
      </div>

      {/* Filters Toolbar */}
      <div className="glass-premium rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Search */}
        <div className="relative w-full md:max-w-sm">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="h-4 w-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-150 focus:outline-none focus:border-primary-500"
            placeholder="Search keywords..."
          />
        </div>

        {/* Filters and Tags selector */}
        <div className="flex flex-wrap gap-3 w-full md:w-auto justify-end">
          <select
            value={tagFilter}
            onChange={(e) => {
              setTagFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-605"
          >
            <option value="">All Tags</option>
            <option value="DSA">DSA</option>
            <option value="EXAMS">EXAMS</option>
            <option value="PLACEMENTS">PLACEMENTS</option>
            <option value="HOSTEL">HOSTEL</option>
            <option value="PROJECTS">PROJECTS</option>
          </select>

          <select
            value={sortOrder}
            onChange={(e) => {
              setSortOrder(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-605"
          >
            <option value="newest">Sort: Newest</option>
            <option value="upvoted">Sort: Top Upvoted</option>
          </select>
        </div>
      </div>

      {/* Grid structure list vs detail comments */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Posts list grid */}
        <div className="lg:col-span-2 space-y-4">
          {isLoading ? (
            <div className="py-20 flex justify-center items-center">
              <Loader2 className="h-10 w-10 animate-spin text-primary-500" />
            </div>
          ) : posts.length > 0 ? (
            <div className="space-y-4">
              {posts.map((post) => (
                <div
                  key={post._id}
                  onClick={() => setSelectedPost(post)}
                  className={`p-5 rounded-3xl border cursor-pointer transition-all duration-300 card-hover-effect flex gap-4 ${
                    selectedPost?._id === post._id
                      ? 'border-primary-500 bg-primary-500/5 shadow-md'
                      : 'border-slate-200/50 bg-white dark:border-slate-800/50 dark:bg-slate-900'
                  }`}
                >
                  {/* Upvotes bar side layout */}
                  <div className="flex flex-col items-center gap-1.5 text-slate-400 select-none">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleVote(post._id, 'upvote');
                      }}
                      className={`p-1.5 rounded-xl border hover:bg-primary-500/10 hover:text-primary-500 transition-colors ${
                        post.upvotes?.includes(user._id)
                          ? 'border-primary-500/20 bg-primary-500/10 text-primary-500 font-semibold'
                          : 'border-slate-200/50'
                      }`}
                    >
                      <ThumbsUp className="h-3.5 w-3.5" />
                    </button>
                    <span className="text-[10px] font-extrabold text-slate-700 dark:text-slate-350">
                      {(post.upvotes?.length || 0) - (post.downvotes?.length || 0)}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleVote(post._id, 'downvote');
                      }}
                      className={`p-1.5 rounded-xl border hover:bg-rose-500/10 hover:text-rose-500 transition-colors ${
                        post.downvotes?.includes(user._id)
                          ? 'border-rose-500/20 bg-rose-500/10 text-rose-500 font-semibold'
                          : 'border-slate-200/50'
                      }`}
                    >
                      <ThumbsDown className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Main feed details */}
                  <div className="flex-1 space-y-2">
                    <div className="flex justify-between items-start gap-4 text-[10px] text-slate-450">
                      <div className="flex items-center gap-1.5">
                        <img src={post.author?.avatar} alt={post.author?.name} className="h-5 w-5 rounded-full object-cover border" />
                        <span className="font-bold text-slate-500">{post.author?.name}</span>
                      </div>
                      <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                    </div>

                    <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100 line-clamp-1 group-hover:text-primary-500">
                      {post.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {post.content}
                    </p>

                    <div className="pt-2 border-t border-slate-50 dark:border-slate-800/60 flex flex-wrap gap-2 items-center justify-between">
                      {/* Tags */}
                      <div className="flex flex-wrap gap-1.5">
                        {post.tags.map((tg) => (
                          <span key={tg} className="text-[8px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded-md uppercase tracking-wider flex items-center gap-0.5">
                            <Tag className="h-2 w-2" /> {tg}
                          </span>
                        ))}
                      </div>

                      {/* Comment tally count */}
                      <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                        <MessageCircle className="h-3.5 w-3.5" /> {post.replyCount} Replies
                      </span>
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
            <div className="py-20 text-center text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl bg-white dark:bg-slate-900">
              <MessageSquare className="h-12 w-12 mx-auto opacity-40 mb-3 animate-pulse-subtle" />
              <p className="text-sm font-medium">No posts found</p>
              <p className="text-xs">Adjust your search parameters or start a new thread.</p>
            </div>
          )}
        </div>

        {/* Selected Post comments Details view panel */}
        <div className="glass-premium rounded-3xl p-6 self-start flex flex-col max-h-[85vh] overflow-hidden">
          {selectedPost ? (
            <div className="flex-1 flex flex-col justify-between overflow-hidden">
              <div className="overflow-y-auto space-y-6 pr-1">
                {/* Detail Header */}
                <div>
                  <div className="flex justify-between items-start gap-4 mb-2 text-[10px] text-slate-400 font-semibold">
                    <span className="flex items-center gap-1">
                      <User className="h-3.5 w-3.5" /> Filed by: {selectedPost.author?.name}
                    </span>
                    <span>{new Date(selectedPost.createdAt).toLocaleString()}</span>
                  </div>
                  <h3 className="text-base font-extrabold text-slate-850 dark:text-slate-100 leading-tight">
                    {selectedPost.title}
                  </h3>
                </div>

                {/* Body Content */}
                <div className="text-xs text-slate-700 dark:text-slate-350 bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-150 leading-relaxed font-medium">
                  {selectedPost.content}
                </div>

                {/* Submitting Comments list */}
                <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Discussion Comments
                  </h4>

                  {isRepliesLoading ? (
                    <div className="py-6 flex justify-center">
                      <Loader2 className="h-6 w-6 animate-spin text-primary-500" />
                    </div>
                  ) : (
                    renderRepliesTree()
                  )}
                </div>
              </div>

              {/* Add Top-Level Comment Field */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
                <form onSubmit={handleSubmitReply(onReplySubmit)} className="flex gap-2">
                  <input
                    type="text"
                    {...registerReply('content')}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs text-slate-800 dark:text-slate-205 focus:outline-none focus:border-primary-500"
                    placeholder="Ask a question or reply to thread..."
                    onClick={() => setActiveReplyInputId(null)} // reset inline reply parent
                  />
                  <button
                    type="submit"
                    className="bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 text-white rounded-xl px-4 flex items-center justify-center shrink-0"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </form>
                {errorsReply.content && (
                  <p className="text-[10px] text-red-500 mt-1">{errorsReply.content.message}</p>
                )}
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-slate-400 dark:text-slate-500 flex flex-col justify-center items-center h-full">
              <MessageSquare className="h-8 w-8 opacity-35 mb-2" />
              <p className="text-sm font-semibold">Select a thread</p>
              <p className="text-xs mt-0.5">Click a forum question to review discussions and write replies.</p>
            </div>
          )}
        </div>
      </div>

      {/* Ask Question Modal */}
      {isAskOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/20 backdrop-blur-sm animate-fadeIn p-4">
          <div
            onClick={() => setIsAskOpen(false)}
            className="absolute inset-0"
          />
          <div className="relative w-full max-w-lg bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl z-10 animate-scaleIn">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-5">
              <h2 className="text-lg font-bold text-slate-850 dark:text-slate-100 flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary-500" />
                <span>Ask Question on Forum</span>
              </h2>
              <button
                onClick={() => setIsAskOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitPost(onAskSubmit)} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Question Summary / Title
                </label>
                <input
                  type="text"
                  {...registerPost('title')}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-primary-500"
                  placeholder="e.g. How to prepare for DBMS mid-sem exams?"
                />
                {errorsPost.title && <p className="mt-1 text-xs text-red-500">{errorsPost.title.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Details / Body Content
                </label>
                <textarea
                  {...registerPost('content')}
                  rows={6}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-955 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-primary-500 resize-none"
                  placeholder="Provide context, what you have tried, relevant details..."
                />
                {errorsPost.content && <p className="mt-1 text-xs text-red-500">{errorsPost.content.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Tags (Separated by commas)
                </label>
                <input
                  type="text"
                  {...registerPost('tagsString')}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-primary-500"
                  placeholder="e.g. DSA, Exams, Placements"
                />
                <p className="mt-1 text-[10px] text-slate-400">Tags categorize posts and help students find them.</p>
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 text-white font-semibold py-3 px-4 rounded-xl shadow-lg transition-all active:scale-[0.98] pt-2"
              >
                Submit Question
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Forum;
