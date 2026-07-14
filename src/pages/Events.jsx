import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';
import {
  Calendar,
  Users,
  Plus,
  X,
  MapPin,
  Clock,
  User,
  Shield,
  Loader2,
  FolderPlus,
  AlertTriangle,
  Award
} from 'lucide-react';

const createClubSchema = z.object({
  name: z.string().min(3, 'Club name must be at least 3 characters'),
  description: z.string().min(10, 'Club description must be at least 10 characters'),
});

const createEventSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  date: z.string().min(1, 'Date is required'),
  venue: z.string().min(2, 'Venue is required'),
  clubId: z.string().min(1, 'Please select a host club'),
  capacity: z.string().or(z.number()).transform((val) => Number(val)),
});

const Events = () => {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('events'); // events | clubs
  const [events, setEvents] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [selectedClubData, setSelectedClubData] = useState(null);
  const [selectedEventData, setSelectedEventData] = useState(null);
  
  const [isClubModalOpen, setIsClubModalOpen] = useState(false);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Forms
  const {
    register: registerClub,
    handleSubmit: handleSubmitClub,
    reset: resetClub,
    formState: { errors: errorsClub },
  } = useForm({
    resolver: zodResolver(createClubSchema),
  });

  const {
    register: registerEvent,
    handleSubmit: handleSubmitEvent,
    reset: resetEvent,
    formState: { errors: errorsEvent },
  } = useForm({
    resolver: zodResolver(createEventSchema),
  });

  const fetchData = async () => {
    try {
      setIsLoading(true);
      if (activeTab === 'events') {
        const response = await api.get('/events?limit=20');
        setEvents(response.data.data.events);
      } else if (activeTab === 'clubs') {
        const response = await api.get('/events/clubs');
        setClubs(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch events data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const handleCreateClub = async (data) => {
    try {
      await api.post('/events/clubs', data);
      setIsClubModalOpen(false);
      resetClub();
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to register club');
    }
  };

  const handleCreateEvent = async (data) => {
    try {
      const formData = new FormData();
      formData.append('title', data.title);
      formData.append('description', data.description);
      formData.append('date', data.date);
      formData.append('venue', data.venue);
      formData.append('clubId', data.clubId);
      formData.append('capacity', data.capacity);

      await api.post('/events', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setIsEventModalOpen(false);
      resetEvent();
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to schedule event');
    }
  };

  const handleJoinClub = async (clubId) => {
    try {
      await api.post(`/events/clubs/${clubId}/join`);
      alert('Successfully joined club membership!');
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to join club');
    }
  };

  const fetchClubDetails = async (clubId) => {
    try {
      const response = await api.get(`/events/clubs/${clubId}`);
      setSelectedClubData(response.data.data);
    } catch (error) {
      alert('Failed to load club information');
    }
  };

  const fetchEventDetails = async (eventId) => {
    try {
      const response = await api.get(`/events/${eventId}`);
      setSelectedEventData(response.data.data);
    } catch (error) {
      alert('Failed to load event information');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Calendar className="h-8 w-8 text-primary-500" />
            <span className="font-serif">Campus Life Hub</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Discover student clubs, hackathons, and campus seminars.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex gap-2 flex-wrap">
          {user?.role === 'admin' && (
            <button
              onClick={() => {
                api.get('/events/clubs').then(res => setClubs(res.data.data)); // prefetch for events form
                setIsClubModalOpen(true);
              }}
              className="flex items-center justify-center gap-1.5 bg-primary-500/10 hover:bg-primary-500/20 text-primary-600 dark:text-primary-400 font-semibold py-2 px-4 rounded-xl text-xs transition-colors shrink-0"
            >
              <FolderPlus className="h-4 w-4" />
              <span>Create Club</span>
            </button>
          )}
          {(user?.role === 'admin' || user?.role === 'student') && (
            <button
              onClick={() => {
                // Fetch clubs list for dropdown select option
                api.get('/events/clubs').then(res => setClubs(res.data.data));
                setIsEventModalOpen(true);
              }}
              className="flex items-center justify-center gap-1.5 bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 text-white font-semibold py-2 px-4 rounded-xl text-xs shadow-md transition-all active:scale-[0.98] shrink-0"
            >
              <Plus className="h-4 w-4" />
              <span>Schedule Event</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs navigation panel */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('events')}
          className={`px-5 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
            activeTab === 'events'
              ? 'border-primary-500 text-primary-600 dark:text-primary-400'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          Upcoming Events
        </button>
        <button
          onClick={() => setActiveTab('clubs')}
          className={`px-5 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
            activeTab === 'clubs'
              ? 'border-primary-500 text-primary-600 dark:text-primary-400'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          Student Clubs
        </button>
      </div>

      {/* Content display area */}
      {isLoading ? (
        <div className="py-20 flex justify-center items-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary-500" />
        </div>
      ) : (
        <div className="animate-fadeIn">
          {/* TAB 1: EVENTS */}
          {activeTab === 'events' && (
            events.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {events.map((event) => (
                  <div
                    key={event._id}
                    className="group rounded-3xl border border-slate-200/50 bg-white overflow-hidden dark:border-slate-800/50 dark:bg-slate-900 shadow-sm hover:shadow-md flex flex-col justify-between card-hover-effect"
                  >
                    <div className="relative aspect-video bg-slate-100 dark:bg-slate-950 w-full overflow-hidden shrink-0">
                      <img
                        src={event.bannerImage}
                        alt={event.title}
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <span className="absolute top-3.5 left-3.5 bg-primary-500 text-white text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded shadow-sm border border-transparent">
                        {event.club?.name}
                      </span>
                    </div>

                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                      <div className="space-y-1.5">
                        <h3 className="text-base font-extrabold text-slate-805 dark:text-slate-100 group-hover:text-primary-500 transition-colors line-clamp-1">
                          {event.title}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                          {event.description}
                        </p>
                      </div>

                      <div className="space-y-2 border-t border-slate-100 dark:border-slate-800/60 pt-3 text-[10px] text-slate-400 font-semibold">
                        <p className="flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                          <span>Venue: {event.venue}</span>
                        </p>
                        <p className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                          <span>{new Date(event.date).toLocaleString()}</span>
                        </p>
                      </div>

                      <button
                        onClick={() => fetchEventDetails(event._id)}
                        className="w-full border border-slate-205 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-950 font-semibold py-1.5 rounded-xl text-xs transition-colors"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-20 text-center text-slate-400 border border-dashed border-slate-200 dark:border-slate-850 rounded-3xl bg-white dark:bg-slate-900">
                <Calendar className="h-12 w-12 mx-auto opacity-40 mb-3" />
                <p className="text-sm font-medium">No upcoming events scheduled</p>
                <p className="text-xs">Student organizations will announce events soon.</p>
              </div>
            )
          )}

          {/* TAB 2: CLUBS */}
          {activeTab === 'clubs' && (
            clubs.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {clubs.map((club) => (
                  <div
                    key={club._id}
                    className="p-5 rounded-3xl border border-slate-200/50 bg-white dark:border-slate-805 dark:bg-slate-900 flex gap-4 card-hover-effect"
                  >
                    {/* Club logo */}
                    <img
                      src={club.logo}
                      alt={club.name}
                      className="h-12 w-12 rounded-2xl border object-cover shrink-0"
                    />

                    <div className="flex-1 space-y-3">
                      <div>
                        <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100 line-clamp-1">
                          {club.name}
                        </h3>
                        <p className="text-xs text-slate-450 mt-0.5 flex items-center gap-1 font-semibold">
                          <Award className="h-3.5 w-3.5 text-primary-500" /> Lead: {club.owner?.name}
                        </p>
                      </div>

                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                        {club.description}
                      </p>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 font-bold">
                        <span className="flex items-center gap-1">
                          <Users className="h-3.5 w-3.5 text-slate-400" /> {club.members?.length || 0} Members
                        </span>
                        
                        <div className="flex gap-2">
                          <button
                            onClick={() => fetchClubDetails(club._id)}
                            className="text-primary-600 dark:text-primary-400 hover:underline text-[10px]"
                          >
                            Roster details
                          </button>
                          {user?.role === 'student' && !club.members?.includes(user._id) && (
                            <button
                              onClick={() => handleJoinClub(club._id)}
                              className="bg-primary-500/10 text-primary-500 px-2.5 py-1 rounded-lg hover:bg-primary-500 hover:text-white transition-colors"
                            >
                              Join Club
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-20 text-center text-slate-400 border border-dashed border-slate-200 dark:border-slate-850 rounded-3xl bg-white dark:bg-slate-900">
                <Users className="h-12 w-12 mx-auto opacity-40 mb-3" />
                <p className="text-sm font-medium">No clubs registered yet</p>
                <p className="text-xs">Campus groups profile listings will appear here.</p>
              </div>
            )
          )}
        </div>
      )}

      {/* Club Details Modal */}
      {selectedClubData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-sm animate-fadeIn p-4">
          <div onClick={() => setSelectedClubData(null)} className="absolute inset-0" />
          <div className="relative w-full max-w-xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl z-10 animate-scaleIn space-y-6 max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-start gap-4">
              <div className="flex gap-3.5 items-center">
                <img src={selectedClubData.club.logo} alt={selectedClubData.club.name} className="h-12 w-12 rounded-2xl object-cover border" />
                <div>
                  <h3 className="text-lg font-bold text-slate-850 dark:text-slate-100 leading-tight">{selectedClubData.club.name}</h3>
                  <p className="text-xs text-slate-450 mt-0.5 font-bold uppercase tracking-wider">President: {selectedClubData.club.owner?.name}</p>
                </div>
              </div>
              <button onClick={() => setSelectedClubData(null)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-850">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-1.5 text-xs">
              <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Club Profile</span>
              <p className="text-slate-700 dark:text-slate-350 leading-relaxed bg-slate-50 dark:bg-slate-950/50 p-4 rounded-2xl border border-slate-150">{selectedClubData.club.description}</p>
            </div>

            {/* Club members roster catalog */}
            <div className="space-y-3">
              <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px] block">Roster Members ({selectedClubData.club.members?.length || 0})</span>
              <div className="grid grid-cols-2 gap-3">
                {selectedClubData.club.members?.map((member) => (
                  <div key={member._id} className="flex gap-2 items-center p-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/50 dark:border-slate-800/40 text-xs">
                    <img src={member.avatar} alt={member.name} className="h-6 w-6 rounded-full object-cover border" />
                    <div>
                      <p className="font-bold text-slate-700 dark:text-slate-300 truncate max-w-[150px]">{member.name}</p>
                      <p className="text-[10px] text-slate-400">{member.department || 'Student'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Hosted Events list */}
            <div className="space-y-3">
              <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px] block">Hosted Events</span>
              {selectedClubData.events?.length > 0 ? (
                <div className="space-y-2">
                  {selectedClubData.events.map((ev) => (
                    <div key={ev._id} className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200/40 dark:border-slate-800/30 text-xs flex justify-between items-center">
                      <div>
                        <h4 className="font-bold text-slate-800 dark:text-slate-250">{ev.title}</h4>
                        <p className="text-[10px] text-slate-400 mt-0.5">{new Date(ev.date).toLocaleDateString()} @ {ev.venue}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[10px] text-slate-450 italic">No events hosted yet</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Event Details Modal */}
      {selectedEventData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-sm animate-fadeIn p-4">
          <div onClick={() => setSelectedEventData(null)} className="absolute inset-0" />
          <div className="relative w-full max-w-lg bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-805 rounded-3xl z-10 animate-scaleIn space-y-6 max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-start gap-4">
              <div>
                <span className="text-[9px] font-bold uppercase tracking-wider text-primary-500 bg-primary-500/10 px-2 py-0.5 rounded border border-primary-500/10">
                  Hosted by {selectedEventData.event.club?.name}
                </span>
                <h3 className="text-lg font-bold text-slate-850 dark:text-slate-100 mt-1 leading-tight">{selectedEventData.event.title}</h3>
              </div>
              <button onClick={() => setSelectedEventData(null)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-850">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="relative aspect-video rounded-2xl overflow-hidden border border-slate-200/50 dark:border-slate-800/40">
              <img src={selectedEventData.event.bannerImage} alt={selectedEventData.event.title} className="h-full w-full object-cover" />
            </div>

            <div className="space-y-1.5 text-xs">
              <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Description</span>
              <p className="text-slate-700 dark:text-slate-350 leading-relaxed bg-slate-50 dark:bg-slate-950/50 p-4 rounded-2xl border border-slate-150">{selectedEventData.event.description}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 border-y border-slate-100 dark:border-slate-800/80 py-4 text-xs font-semibold text-slate-650">
              <div className="space-y-1">
                <span className="text-[9px] text-slate-400 uppercase tracking-wider block">Date</span>
                <span className="text-slate-700 dark:text-slate-300 flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {new Date(selectedEventData.event.date).toLocaleDateString()}</span>
              </div>
              <div className="space-y-1">
                <span className="text-[9px] text-slate-400 uppercase tracking-wider block">Venue</span>
                <span className="text-slate-700 dark:text-slate-300 flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {selectedEventData.event.venue}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Club Modal (Admin only) */}
      {isClubModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/20 backdrop-blur-sm animate-fadeIn p-4">
          <div onClick={() => { setIsClubModalOpen(false); resetClub(); }} className="absolute inset-0" />
          <div className="relative w-full max-w-md bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl z-10 animate-scaleIn">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-5">
              <h2 className="text-lg font-bold text-slate-850 dark:text-slate-100 flex items-center gap-2">
                <Users className="h-5 w-5 text-primary-500" />
                <span>Create Student Club</span>
              </h2>
              <button onClick={() => { setIsClubModalOpen(false); resetClub(); }} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitClub(handleCreateClub)} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Club Name</label>
                <input
                  type="text"
                  {...registerClub('name')}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-205 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none"
                  placeholder="e.g. Coding Club, Cultural Society"
                />
                {errorsClub.name && <p className="mt-1 text-xs text-red-500">{errorsClub.name.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Club Description</label>
                <textarea
                  {...registerClub('description')}
                  rows={4}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-205 dark:border-slate-800 bg-white dark:bg-slate-955 text-slate-800 dark:text-slate-200 focus:outline-none resize-none"
                  placeholder="Describe club purpose and activities..."
                />
                {errorsClub.description && <p className="mt-1 text-xs text-red-550">{errorsClub.description.message}</p>}
              </div>

              <button type="submit" className="w-full bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 text-white font-semibold py-2.5 rounded-xl text-xs transition-all">
                Register Club
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Create Event Modal (Admins/Students) */}
      {isEventModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/20 backdrop-blur-sm animate-fadeIn p-4">
          <div onClick={() => { setIsEventModalOpen(false); resetEvent(); }} className="absolute inset-0" />
          <div className="relative w-full max-w-md bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl z-10 animate-scaleIn max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-5">
              <h2 className="text-lg font-bold text-slate-850 dark:text-slate-100 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary-500" />
                <span>Schedule Campus Event</span>
              </h2>
              <button onClick={() => { setIsEventModalOpen(false); resetEvent(); }} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitEvent(handleCreateEvent)} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 font-bold">Host Student Club</label>
                <select
                  {...registerEvent('clubId')}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-205 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
                >
                  <option value="">Select Host Club</option>
                  {clubs.map(c => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                </select>
                {errorsEvent.clubId && <p className="mt-1 text-xs text-red-500">{errorsEvent.clubId.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 font-bold">Event Title</label>
                <input
                  type="text"
                  {...registerEvent('title')}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-205 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
                  placeholder="e.g. Algocode Hackathon 1.0"
                />
                {errorsEvent.title && <p className="mt-1 text-xs text-red-500">{errorsEvent.title.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 font-bold">Event Description</label>
                <textarea
                  {...registerEvent('description')}
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-205 dark:border-slate-800 bg-white dark:bg-slate-955 text-xs text-slate-800 dark:text-slate-200 focus:outline-none resize-none"
                  placeholder="Details of the campus workshop..."
                />
                {errorsEvent.description && <p className="mt-1 text-xs text-red-550">{errorsEvent.description.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 font-bold">Date & Time</label>
                  <input
                    type="datetime-local"
                    {...registerEvent('date')}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-205 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
                  />
                  {errorsEvent.date && <p className="mt-1 text-xs text-red-500">{errorsEvent.date.message}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 font-bold">Capacity</label>
                  <input
                    type="number"
                    {...registerEvent('capacity')}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-205 dark:border-slate-800 bg-white dark:bg-slate-955 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
                    placeholder="100"
                  />
                  {errorsEvent.capacity && <p className="mt-1 text-xs text-red-500">{errorsEvent.capacity.message}</p>}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 font-bold">Event Venue</label>
                <input
                  type="text"
                  {...registerEvent('venue')}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-205 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
                  placeholder="e.g. Main Auditorium Block C"
                />
                {errorsEvent.venue && <p className="mt-1 text-xs text-red-550">{errorsEvent.venue.message}</p>}
              </div>

              <button type="submit" className="w-full bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 text-white font-semibold py-2.5 rounded-xl text-xs transition-all pt-2">
                Publish Event
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Events;
