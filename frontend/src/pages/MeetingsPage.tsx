import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useUser } from '../context/UserContext';

export default function MeetingsPage() {
  const { role } = useUser();
  const [meetings, setMeetings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newMeeting, setNewMeeting] = useState({
    title: '',
    description: '',
    meeting_date: '',
    meeting_time: '',
    target_role: '',
  });

  const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

  const fetchMeetings = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.get(`${API_BASE_URL}/meetings/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMeetings(response.data || []);
    } catch (error) {
      console.error('Failed to fetch meetings', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeetings();
  }, []);

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('access_token');
      await axios.post(`${API_BASE_URL}/meetings/`, {
        title: newMeeting.title,
        description: newMeeting.description || null,
        meeting_date: newMeeting.meeting_date,
        meeting_time: newMeeting.meeting_time,
        target_role: newMeeting.target_role || null
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIsModalOpen(false);
      setNewMeeting({
        title: '',
        description: '',
        meeting_date: '',
        meeting_time: '',
        target_role: '',
      });
      fetchMeetings();
    } catch (error) {
      console.error('Failed to schedule meeting', error);
      alert('Error scheduling meeting. Please verify administrative permissions.');
    }
  };

  const isScheduler = ['admin', 'hod', 'principal'].includes(role);

  return (
    <div className="space-y-6 max-w-7xl mx-auto relative">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">Institutional Meetings</h1>
          <p className="text-slate-400 dark:text-slate-500 text-xs mt-1">
            Align academic policies, coordinator schedules, and syllabus status reviews.
          </p>
        </div>
        
        {isScheduler && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center px-4 py-2.5 text-xs font-bold text-white bg-indigo-650 hover:bg-indigo-500 rounded-xl transition-all shadow-md shadow-indigo-650/20 gap-2"
          >
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Schedule Meeting
          </button>
        )}
      </div>

      {/* Grid List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <svg className="animate-spin h-8 w-8 text-indigo-650" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
      ) : meetings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-3">
          <svg width="36" height="36" className="text-slate-400 dark:text-slate-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 00-2 2z" />
          </svg>
          <h3 className="font-extrabold text-slate-750 dark:text-slate-350 mt-2">No meetings scheduled</h3>
          <p className="text-slate-400 dark:text-slate-500 text-xs mt-1">Check back later for revised administrative discussions.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {meetings.map((meeting) => (
            <div
              key={meeting.id}
              className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 p-6 rounded-3xl shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="px-2.5 py-1 rounded-md text-[10px] font-extrabold bg-indigo-50 dark:bg-indigo-950/20 text-indigo-650 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/30 uppercase tracking-wider">
                    {meeting.target_role ? `${meeting.target_role} only` : 'All Members'}
                  </span>
                  <span className="inline-flex items-center text-xs font-semibold text-indigo-500 bg-indigo-50 dark:bg-indigo-950/20 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/20 px-2 py-0.5 rounded">
                    Scheduled
                  </span>
                </div>

                <div className="space-y-1">
                  <h3 className="font-extrabold text-slate-800 dark:text-slate-150 text-base leading-snug">
                    {meeting.title}
                  </h3>
                  <p className="text-xs text-slate-450 dark:text-slate-400 line-clamp-3">
                    {meeting.description || 'No detailed agenda provided.'}
                  </p>
                </div>

                <div className="border-t border-slate-100 dark:border-slate-800/80 pt-4 space-y-3">
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <svg width="16" height="16" className="text-slate-450 dark:text-slate-500 w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <div>
                      <p className="font-extrabold text-slate-700 dark:text-slate-400 leading-none">Date</p>
                      <p className="text-[11px] text-slate-450 mt-1">{meeting.meeting_date}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <svg width="16" height="16" className="text-slate-455 dark:text-slate-500 w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <p className="font-extrabold text-slate-700 dark:text-slate-400 leading-none">Scheduled Time</p>
                      <p className="text-[11px] text-slate-455 mt-1">{meeting.meeting_time}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Schedule Meeting Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl relative z-10 space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <div>
              <h3 className="text-lg font-extrabold text-slate-850 dark:text-slate-200">Schedule Conference</h3>
              <p className="text-xs text-slate-450 dark:text-slate-500 mt-1">Publish a new meeting schedule for organization alignments.</p>
            </div>

            <form onSubmit={handleScheduleSubmit} className="space-y-5">
              
              {/* Title */}
              <div className="relative">
                <input
                  type="text"
                  required
                  id="title"
                  value={newMeeting.title}
                  onChange={(e) => setNewMeeting({ ...newMeeting, title: e.target.value })}
                  className="block px-3.5 pb-2.5 pt-4.5 w-full text-xs text-slate-800 dark:text-slate-250 bg-slate-55 dark:bg-slate-950 rounded-xl border border-slate-250 dark:border-slate-800 appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all peer"
                  placeholder=" "
                />
                <label
                  htmlFor="title"
                  className="absolute text-[10px] text-slate-455 dark:text-slate-500 duration-200 transform -translate-y-3.5 scale-90 top-2 z-10 origin-[0] bg-white dark:bg-slate-900 px-1.5 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-2 peer-placeholder-shown:top-2 peer-focus:-translate-y-3.5 peer-focus:top-2 peer-focus:scale-90 left-2.5"
                >
                  Meeting Title / Agenda
                </label>
              </div>

              {/* Description */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                  Conference Details
                </label>
                <textarea
                  value={newMeeting.description}
                  onChange={(e) => setNewMeeting({ ...newMeeting, description: e.target.value })}
                  className="block w-full px-3.5 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-255 dark:border-slate-800 rounded-xl text-slate-750 dark:text-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 h-24"
                  placeholder="Details, video link, or session notes..."
                />
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-4">
                <div className="relative">
                  <input
                    type="date"
                    required
                    id="meeting_date"
                    value={newMeeting.meeting_date}
                    onChange={(e) => setNewMeeting({ ...newMeeting, meeting_date: e.target.value })}
                    className="block px-3.5 pb-2.5 pt-4.5 w-full text-xs text-slate-850 dark:text-slate-250 bg-slate-55 dark:bg-slate-950 rounded-xl border border-slate-250 dark:border-slate-800 appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all peer"
                  />
                  <label
                    htmlFor="meeting_date"
                    className="absolute text-[10px] text-slate-450 dark:text-slate-500 duration-200 top-2 origin-[0] bg-white dark:bg-slate-900 px-1.5 transform -translate-y-3.5 scale-90 left-2.5"
                  >
                    Meeting Date
                  </label>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="e.g. 10:30 AM"
                    id="meeting_time"
                    value={newMeeting.meeting_time}
                    onChange={(e) => setNewMeeting({ ...newMeeting, meeting_time: e.target.value })}
                    className="block px-3.5 pb-2.5 pt-4.5 w-full text-xs text-slate-850 dark:text-slate-250 bg-slate-55 dark:bg-slate-950 rounded-xl border border-slate-250 dark:border-slate-800 appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all peer"
                  />
                  <label
                    htmlFor="meeting_time"
                    className="absolute text-[10px] text-slate-450 dark:text-slate-500 duration-200 transform -translate-y-3.5 scale-90 top-2 z-10 origin-[0] bg-white dark:bg-slate-900 px-1.5 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-2 peer-placeholder-shown:top-2 peer-focus:-translate-y-3.5 peer-focus:top-2 peer-focus:scale-90 left-2.5"
                  >
                    Meeting Time
                  </label>
                </div>
              </div>

              {/* Target Role */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                  Target Audience Role
                </label>
                <select
                  value={newMeeting.target_role}
                  onChange={(e) => setNewMeeting({ ...newMeeting, target_role: e.target.value })}
                  className="block w-full px-3 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-xl text-slate-755 dark:text-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="">All Members</option>
                  <option value="STUDENT">STUDENT</option>
                  <option value="FACULTY">FACULTY</option>
                  <option value="HOD">HOD</option>
                  <option value="LIBRARIAN">LIBRARIAN</option>
                  <option value="CLASS_COUNSELLOR">CLASS_COUNSELLOR</option>
                </select>
              </div>

              {/* Modal Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs font-bold text-white bg-indigo-650 hover:bg-indigo-500 rounded-xl transition-all shadow-md shadow-indigo-650/20"
                >
                  Schedule Conference
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
