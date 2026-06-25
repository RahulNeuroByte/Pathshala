import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { useUser } from '../context/UserContext';

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

interface ProfileSummary {
  user_id: number;
  name: string;
  role: string;
  email: string;
  phone: string;
  dept_name: string;
  designation: string;
}

interface ChatMsg {
  id: number;
  sender_id: number;
  sender_name: string;
  sender_role: string;
  room_type: string;
  dept_id?: number;
  message: string;
  created_at: string;
}

interface FeedbackMsg {
  id: number;
  sender_id: number;
  sender_name: string;
  sender_role: string;
  receiver_id?: number;
  receiver_name?: string;
  dept_id?: number;
  message: string;
  created_at: string;
}

export default function CollaborationRoomPage() {
  const { role } = useUser(); // principal or hod or faculty
  const [activeSubTab, setActiveSubTab] = useState<'directory' | 'chat' | 'meetings' | 'feedback'>('directory');
  
  // Lists
  const [directory, setDirectory] = useState<ProfileSummary[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([]);
  const [feedbacks, setFeedbacks] = useState<FeedbackMsg[]>([]);
  const [meetings, setMeetings] = useState<any[]>([]);
  
  // Form states
  const [newChatText, setNewChatText] = useState('');
  const [newFeedbackText, setNewFeedbackText] = useState('');
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');
  
  // Meeting form states
  const [isMeetingModalOpen, setIsMeetingModalOpen] = useState(false);
  const [meetingForm, setMeetingForm] = useState({
    title: '',
    description: '',
    meeting_date: '',
    meeting_time: '',
    target_role: ''
  });
  
  // Notice form states
  const [isNoticeModalOpen, setIsNoticeModalOpen] = useState(false);
  const [noticeForm, setNoticeForm] = useState({
    title: '',
    message: ''
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  const roomType = role === 'principal' ? 'PRINCIPAL_HOD' : 'DEPT_FACULTY';
  
  // Fetch Directory (HODs for Principal, Teachers for HOD)
  const fetchDirectory = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const endpoint = role === 'principal' 
        ? `${API_BASE_URL}/collaboration/hods`
        : `${API_BASE_URL}/collaboration/department-teachers`;
        
      const response = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDirectory(response.data || []);
      if (response.data && response.data.length > 0) {
        setSelectedTeacherId(response.data[0].user_id.toString());
      }
    } catch (err) {
      console.error("Failed to fetch directory details", err);
    }
  };

  // Fetch Chat Messages
  const fetchChats = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.get(`${API_BASE_URL}/collaboration/chat?room_type=${roomType}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setChatMessages(response.data || []);
    } catch (err) {
      console.error("Failed to fetch chat logs", err);
    }
  };

  // Fetch Feedback Logs
  const fetchFeedbacks = async () => {
    if (role === 'principal') return; // Principal doesn't have department feedback
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.get(`${API_BASE_URL}/collaboration/feedback`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFeedbacks(response.data || []);
    } catch (err) {
      console.error("Failed to fetch feedback history", err);
    }
  };

  // Fetch Meetings
  const fetchMeetingsList = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.get(`${API_BASE_URL}/meetings/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Filter meetings:
      // Principal sees all, but let's show HOD target meetings
      // HOD sees HOD targeted or department targeted
      const list = response.data || [];
      if (role === 'principal') {
        setMeetings(list.filter((m: any) => m.target_role === 'HOD' || m.target_role === null));
      } else {
        setMeetings(list.filter((m: any) => m.target_role === 'HOD' || m.target_role === 'FACULTY' || m.target_role === null));
      }
    } catch (err) {
      console.error("Failed to fetch meetings roster", err);
    }
  };

  const handleInit = async () => {
    setLoading(true);
    await Promise.all([
      fetchDirectory(),
      fetchChats(),
      fetchFeedbacks(),
      fetchMeetingsList()
    ]);
    setLoading(false);
  };

  useEffect(() => {
    handleInit();
  }, [role]);

  // Scroll chat window to bottom
  useEffect(() => {
    if (activeSubTab === 'chat') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, activeSubTab]);

  // Periodic poll for new messages in chat room
  useEffect(() => {
    if (activeSubTab !== 'chat') return;
    const interval = setInterval(() => {
      fetchChats();
    }, 4000);
    return () => clearInterval(interval);
  }, [activeSubTab]);

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChatText.trim()) return;
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.post(`${API_BASE_URL}/collaboration/chat`, {
        room_type: roomType,
        message: newChatText
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setChatMessages(prev => [...prev, response.data]);
      setNewChatText('');
    } catch (err) {
      console.error("Failed to send chat message", err);
    }
  };

  const handleSendFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFeedbackText.trim()) return;
    setError('');
    setSuccess('');
    try {
      const token = localStorage.getItem('access_token');
      const payload: any = {
        message: newFeedbackText
      };
      if (role === 'hod' && selectedTeacherId) {
        payload.receiver_id = parseInt(selectedTeacherId);
      }
      const response = await axios.post(`${API_BASE_URL}/collaboration/feedback`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFeedbacks(prev => [response.data, ...prev]);
      setNewFeedbackText('');
      setSuccess('Feedback submitted successfully!');
    } catch (err) {
      console.error("Failed to send feedback log", err);
      setError('Failed to submit feedback.');
    }
  };

  const handleScheduleMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const token = localStorage.getItem('access_token');
      await axios.post(`${API_BASE_URL}/meetings/`, {
        title: meetingForm.title,
        description: meetingForm.description || null,
        meeting_date: meetingForm.meeting_date,
        meeting_time: meetingForm.meeting_time,
        target_role: meetingForm.target_role || null
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIsMeetingModalOpen(false);
      setMeetingForm({
        title: '',
        description: '',
        meeting_date: '',
        meeting_time: '',
        target_role: ''
      });
      setSuccess('Conference scheduled successfully!');
      fetchMeetingsList();
    } catch (err) {
      console.error("Failed to schedule meeting", err);
      setError('Failed to schedule meeting.');
    }
  };

  const handleBroadcastNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const token = localStorage.getItem('access_token');
      await axios.post(`${API_BASE_URL}/users/me/notifications`, {
        title: noticeForm.title,
        message: noticeForm.message,
        target_role: 'HOD'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIsNoticeModalOpen(false);
      setNoticeForm({ title: '', message: '' });
      setSuccess('Notice broadcasted to all HODs successfully!');
    } catch (err) {
      console.error("Failed to broadcast notice", err);
      setError('Failed to publish bulletin notice.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <svg className="animate-spin h-8 w-8 text-indigo-650" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>
    );
  }

  const roomTitle = role === 'principal' 
    ? 'HOD Interaction & Academic Council Room'
    : 'Department Staff & Faculty Collaboration Room';

  const roomDesc = role === 'principal'
    ? 'Convene council meetings, broadcast operational notices, and coordinate with academic heads.'
    : 'Align syllabus milestones, host faculty assemblies, and review departmental feedback loops.';

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header Banner */}
      <div className="relative rounded-3xl overflow-hidden shadow-lg bg-gradient-to-r from-indigo-700 via-indigo-850 to-slate-900 p-8 md:p-10 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-6 transition-all duration-300">
        <div className="space-y-2">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-white/20 tracking-wider">
            {role === 'principal' ? 'Principal Workspace' : 'Department Workspace'}
          </span>
          <h2 className="text-xl md:text-2xl font-extrabold tracking-tight">
            {roomTitle}
          </h2>
          <p className="text-white/80 text-xs max-w-xl leading-relaxed">
            {roomDesc}
          </p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button 
            onClick={() => {
              setMeetingForm(prev => ({
                ...prev,
                target_role: role === 'principal' ? 'HOD' : 'FACULTY'
              }));
              setIsMeetingModalOpen(true);
            }}
            className="px-4 py-2.5 bg-white text-indigo-700 hover:text-indigo-800 text-xs font-extrabold rounded-xl shadow-md hover:bg-slate-55 transition-all flex items-center gap-1.5"
          >
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Schedule Meeting
          </button>
          
          {role === 'principal' && (
            <button 
              onClick={() => setIsNoticeModalOpen(true)}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-650 text-white text-xs font-extrabold rounded-xl shadow-md border border-indigo-400/20 transition-all flex items-center gap-1.5"
            >
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
              </svg>
              Broadcast Notice
            </button>
          )}
        </div>
      </div>

      {success && (
        <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/25 p-4 text-xs text-emerald-650 dark:text-emerald-400 flex items-start gap-3">
          <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5" className="flex-shrink-0">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="font-bold leading-relaxed">{success}</span>
        </div>
      )}

      {error && (
        <div className="rounded-2xl bg-rose-500/10 border border-rose-500/25 p-4 text-xs text-rose-650 dark:text-rose-455 flex items-start gap-3">
          <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5" className="flex-shrink-0">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span className="font-semibold leading-relaxed">{error}</span>
        </div>
      )}

      {/* Main Board Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Navigation Tabs (Sidebar style on lg, Row on mobile) */}
        <div className="lg:col-span-1 space-y-2">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 p-4.5 rounded-3xl shadow-sm flex flex-row lg:flex-col overflow-x-auto lg:overflow-x-visible gap-2 scrollbar-none">
            
            <button
              onClick={() => setActiveSubTab('directory')}
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all whitespace-nowrap lg:w-full border ${
                activeSubTab === 'directory'
                  ? 'bg-indigo-650 text-white shadow-md shadow-indigo-600/10 border-transparent'
                  : 'bg-transparent text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850/30 border-transparent'
              }`}
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {role === 'principal' ? 'HOD Directory' : 'Department Faculty'}
            </button>

            <button
              onClick={() => setActiveSubTab('chat')}
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all whitespace-nowrap lg:w-full border ${
                activeSubTab === 'chat'
                  ? 'bg-indigo-650 text-white shadow-md shadow-indigo-600/10 border-transparent'
                  : 'bg-transparent text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850/30 border-transparent'
              }`}
            >
              <div className="relative">
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping border border-white dark:border-slate-900" />
              </div>
              Group Chat Room
            </button>

            <button
              onClick={() => setActiveSubTab('meetings')}
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all whitespace-nowrap lg:w-full border ${
                activeSubTab === 'meetings'
                  ? 'bg-indigo-650 text-white shadow-md shadow-indigo-600/10 border-transparent'
                  : 'bg-transparent text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850/30 border-transparent'
              }`}
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Scheduled Conferences
            </button>

            {role !== 'principal' && (
              <button
                onClick={() => setActiveSubTab('feedback')}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all whitespace-nowrap lg:w-full border ${
                  activeSubTab === 'feedback'
                    ? 'bg-indigo-650 text-white shadow-md shadow-indigo-600/10 border-transparent'
                    : 'bg-transparent text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850/30 border-transparent'
                }`}
              >
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
                Feedback Log
              </button>
            )}

          </div>
        </div>

        {/* Tab Content Display Board */}
        <div className="lg:col-span-3">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-3xl shadow-sm p-6 min-h-[460px] flex flex-col justify-between overflow-hidden">
            
            {/* DIRECTORY TAB */}
            {activeSubTab === 'directory' && (
              <div className="space-y-4 flex-1">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-100">
                    {role === 'principal' ? 'Academic Council: HOD Directory' : 'Department Faculty Register'}
                  </h3>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                    Profiles of active departmental heads and faculty coordinators.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  {directory.map((m, idx) => (
                    <div 
                      key={idx} 
                      className="bg-slate-50/50 dark:bg-slate-950/20 border border-slate-150 dark:border-slate-850 p-4.5 rounded-2xl flex flex-col justify-between hover:border-indigo-500/20 hover:shadow-sm transition-all"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-750 dark:text-indigo-400 flex items-center justify-center font-bold text-xs border border-indigo-150/30">
                            {m.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-200">{m.name}</h4>
                            <p className="text-[9px] font-extrabold uppercase text-slate-400 dark:text-slate-500 mt-0.5">{m.designation}</p>
                          </div>
                        </div>

                        <div className="space-y-1 text-[11px] font-semibold text-slate-550 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-850">
                          <p className="flex items-center gap-1.5">
                            <span className="text-slate-400">Dept:</span> {m.dept_name}
                          </p>
                          <p className="flex items-center gap-1.5">
                            <span className="text-slate-400">Email:</span> {m.email}
                          </p>
                          <p className="flex items-center gap-1.5">
                            <span className="text-slate-400">Phone:</span> {m.phone || 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {directory.length === 0 && (
                    <p className="text-slate-400 text-xs text-center py-10 col-span-2">No active members found in this category.</p>
                  )}
                </div>
              </div>
            )}

            {/* CHAT TAB */}
            {activeSubTab === 'chat' && (
              <div className="flex flex-col h-[460px] justify-between flex-1">
                {/* Chat Header */}
                <div className="pb-3 border-b border-slate-100 dark:border-slate-850 flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-extrabold text-slate-850 dark:text-slate-200">
                      {role === 'principal' ? 'HOD Group Council Channel' : 'Department Faculty Chat'}
                    </h4>
                    <p className="text-[9px] text-slate-400 uppercase font-bold tracking-wider mt-0.5">
                      Room Type: {roomType.replace('_', ' ')}
                    </p>
                  </div>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    Active / Persisted
                  </span>
                </div>

                {/* Messages Box */}
                <div className="flex-1 overflow-y-auto py-4 space-y-3 pr-1">
                  {chatMessages.map((msg) => (
                    <div 
                      key={msg.id} 
                      className={`flex ${msg.sender_id === parseInt(localStorage.getItem('user_id') || '0') ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[75%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                        msg.sender_id === parseInt(localStorage.getItem('user_id') || '0')
                          ? 'bg-indigo-650 text-white rounded-br-none'
                          : 'bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-850 text-slate-800 dark:text-slate-200 rounded-bl-none'
                      }`}>
                        <div className="flex justify-between items-center gap-4 mb-1">
                          <span className={`text-[9px] font-black ${
                            msg.sender_id === parseInt(localStorage.getItem('user_id') || '0') ? 'text-indigo-200' : 'text-indigo-650 dark:text-indigo-400'
                          }`}>
                            {msg.sender_name} ({msg.sender_role})
                          </span>
                          <span className="text-[8px] opacity-70">
                            {new Date(msg.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="font-semibold whitespace-pre-wrap">{msg.message}</p>
                      </div>
                    </div>
                  ))}
                  {chatMessages.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-2">
                      <svg width="24" height="24" className="text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      <h4 className="text-xs font-bold text-slate-650 dark:text-slate-350">No chat history</h4>
                      <p className="text-[10px] text-slate-450 dark:text-slate-500 max-w-xs leading-normal">
                        Type a message below to coordinate operations. Messages are saved securely in the database.
                      </p>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Input form */}
                <form onSubmit={handleSendChat} className="pt-3 border-t border-slate-100 dark:border-slate-850 flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Type conference/coordination message..."
                    value={newChatText}
                    onChange={(e) => setNewChatText(e.target.value)}
                    className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-350 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2.5 bg-indigo-650 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-indigo-650/15 flex items-center justify-center gap-1 shrink-0"
                  >
                    <span>Send</span>
                    <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </button>
                </form>
              </div>
            )}

            {/* MEETINGS TAB */}
            {activeSubTab === 'meetings' && (
              <div className="space-y-4 flex-1">
                <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-850">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-100">Scheduled Academic Conferences</h3>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">List of council schedules and syllabus review meetings.</p>
                  </div>
                </div>

                <div className="space-y-3.5 max-h-[350px] overflow-y-auto pr-1">
                  {meetings.map((m) => (
                    <div 
                      key={m.id} 
                      className="bg-slate-50/50 dark:bg-slate-950/20 border border-slate-150 dark:border-slate-850 p-4 rounded-2xl flex flex-col sm:flex-row justify-between sm:items-center gap-4 hover:border-indigo-500/10"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-200">{m.title}</h4>
                          <span className="px-2 py-0.5 rounded text-[8px] font-extrabold uppercase bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 border border-indigo-150/20">
                            {m.target_role || 'All Staff'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-450 dark:text-slate-400">{m.description || 'No detailed agenda provided.'}</p>
                      </div>

                      <div className="flex gap-4 text-[11px] font-bold text-slate-600 dark:text-slate-350 shrink-0 border-l sm:border-l-0 pl-3 sm:pl-0 border-slate-200 dark:border-slate-800">
                        <div className="flex items-center gap-1.5">
                          <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" className="text-slate-400">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span>{m.meeting_date}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" className="text-slate-400">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>{m.meeting_time}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {meetings.length === 0 && (
                    <p className="text-slate-400 text-xs text-center py-10">No active conference schedules pending.</p>
                  )}
                </div>
              </div>
            )}

            {/* FEEDBACK TAB */}
            {activeSubTab === 'feedback' && role !== 'principal' && (
              <div className="space-y-4 flex flex-col justify-between flex-1 h-[460px]">
                
                {/* Feedback Logs */}
                <div className="flex-1 space-y-4">
                  <div className="pb-2 border-b border-slate-100 dark:border-slate-850">
                    <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-100">Official Feedback & Review Logs</h3>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">Academic reports and professional feedback summaries.</p>
                  </div>

                  <div className="space-y-3.5 max-h-[250px] overflow-y-auto pr-1">
                    {feedbacks.map((f) => (
                      <div 
                        key={f.id} 
                        className="bg-slate-50/50 dark:bg-slate-950/20 border border-slate-150 dark:border-slate-850 p-4 rounded-2xl space-y-2"
                      >
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-extrabold text-indigo-650 dark:text-indigo-400">
                            From: {f.sender_name} ({f.sender_role})
                          </span>
                          <span className="text-[9px] text-slate-400 font-semibold">
                            {new Date(f.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        {f.receiver_name && (
                          <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                            Target Recipient: {f.receiver_name}
                          </p>
                        )}
                        <p className="text-xs text-slate-700 dark:text-slate-300 font-semibold leading-relaxed whitespace-pre-wrap">{f.message}</p>
                      </div>
                    ))}
                    {feedbacks.length === 0 && (
                      <p className="text-slate-400 text-xs text-center py-10">No official feedback records logged.</p>
                    )}
                  </div>
                </div>

                {/* Submit Feedback Form */}
                <form onSubmit={handleSendFeedback} className="pt-3 border-t border-slate-100 dark:border-slate-850 space-y-3">
                  <h4 className="text-xs font-extrabold text-slate-850 dark:text-slate-200 uppercase tracking-wider">Submit Review Feedback</h4>
                  
                  <div className="flex flex-col sm:flex-row gap-3">
                    {role === 'hod' && directory.length > 0 && (
                      <div className="w-full sm:w-1/3">
                        <select
                          value={selectedTeacherId}
                          onChange={(e) => setSelectedTeacherId(e.target.value)}
                          className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-700 dark:text-slate-350 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                          aria-label="Select Department Teacher"
                        >
                          {directory.map((t) => (
                            <option key={t.user_id} value={t.user_id}>{t.name}</option>
                          ))}
                        </select>
                      </div>
                    )}
                    
                    <div className="flex-1 flex gap-2">
                      <input
                        type="text"
                        required
                        placeholder={role === 'hod' ? 'Write feedback message for the selected faculty member...' : 'Submit feedback report to the HOD...'}
                        value={newFeedbackText}
                        onChange={(e) => setNewFeedbackText(e.target.value)}
                        className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                      <button
                        type="submit"
                        className="px-4 py-2.5 bg-indigo-650 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-indigo-600/15 flex items-center justify-center gap-1.5 shrink-0"
                      >
                        Submit
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            )}

          </div>
        </div>

      </div>

      {/* MEETINGS MODAL */}
      {isMeetingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={() => setIsMeetingModalOpen(false)} />
          
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl relative z-10 space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <div>
              <h3 className="text-lg font-extrabold text-slate-850 dark:text-slate-200">Schedule Conference</h3>
              <p className="text-xs text-slate-450 dark:text-slate-555 mt-1">Publish a new meeting schedule for alignment.</p>
            </div>

            <form onSubmit={handleScheduleMeeting} className="space-y-5">
              <div className="relative">
                <input
                  type="text"
                  required
                  id="meeting_title"
                  value={meetingForm.title}
                  onChange={(e) => setMeetingForm({ ...meetingForm, title: e.target.value })}
                  className="block px-3.5 pb-2.5 pt-4.5 w-full text-xs text-slate-800 dark:text-slate-255 bg-slate-55 dark:bg-slate-955 rounded-xl border border-slate-250 dark:border-slate-800 appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all peer"
                  placeholder=" "
                />
                <label
                  htmlFor="meeting_title"
                  className="absolute text-[10px] text-slate-455 dark:text-slate-500 duration-200 transform -translate-y-3.5 scale-90 top-2 z-10 origin-[0] bg-white dark:bg-slate-900 px-1.5 left-2.5"
                >
                  Meeting Title / Agenda
                </label>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                  Conference Details
                </label>
                <textarea
                  value={meetingForm.description}
                  onChange={(e) => setMeetingForm({ ...meetingForm, description: e.target.value })}
                  className="block w-full px-3.5 py-3 bg-slate-55 dark:bg-slate-955 border border-slate-250 dark:border-slate-800 rounded-xl text-slate-750 dark:text-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 h-20"
                  placeholder="Conference link, or session notes..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="relative">
                  <input
                    type="date"
                    required
                    id="m_date"
                    value={meetingForm.meeting_date}
                    onChange={(e) => setMeetingForm({ ...meetingForm, meeting_date: e.target.value })}
                    className="block px-3.5 pb-2.5 pt-4.5 w-full text-xs text-slate-850 dark:text-slate-255 bg-slate-55 dark:bg-slate-955 rounded-xl border border-slate-250 dark:border-slate-800 appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all peer"
                  />
                  <label
                    htmlFor="m_date"
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
                    id="m_time"
                    value={meetingForm.meeting_time}
                    onChange={(e) => setMeetingForm({ ...meetingForm, meeting_time: e.target.value })}
                    className="block px-3.5 pb-2.5 pt-4.5 w-full text-xs text-slate-850 dark:text-slate-255 bg-slate-55 dark:bg-slate-955 rounded-xl border border-slate-250 dark:border-slate-800 appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all peer"
                  />
                  <label
                    htmlFor="m_time"
                    className="absolute text-[10px] text-slate-450 dark:text-slate-500 duration-200 transform -translate-y-3.5 scale-90 top-2 z-10 origin-[0] bg-white dark:bg-slate-900 px-1.5 left-2.5"
                  >
                    Meeting Time
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsMeetingModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs font-bold text-white bg-indigo-650 hover:bg-indigo-500 rounded-xl transition-all shadow-md shadow-indigo-650/20"
                >
                  Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* NOTICE MODAL */}
      {isNoticeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={() => setIsNoticeModalOpen(false)} />
          
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl relative z-10 space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <div>
              <h3 className="text-lg font-extrabold text-slate-850 dark:text-slate-200">Broadcast Notice Bulletin</h3>
              <p className="text-xs text-slate-455 mt-1">Publish an official bulletin notice visible to HODs.</p>
            </div>

            <form onSubmit={handleBroadcastNotice} className="space-y-5">
              <div className="relative">
                <input
                  type="text"
                  required
                  id="notice_title"
                  value={noticeForm.title}
                  onChange={(e) => setNoticeForm({ ...noticeForm, title: e.target.value })}
                  className="block px-3.5 pb-2.5 pt-4.5 w-full text-xs text-slate-800 dark:text-slate-255 bg-slate-55 dark:bg-slate-955 rounded-xl border border-slate-250 dark:border-slate-800 appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all peer"
                  placeholder=" "
                />
                <label
                  htmlFor="notice_title"
                  className="absolute text-[10px] text-slate-455 dark:text-slate-500 duration-200 transform -translate-y-3.5 scale-90 top-2 z-10 origin-[0] bg-white dark:bg-slate-900 px-1.5 left-2.5"
                >
                  Notice Title / Subject
                </label>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                  Notice Details
                </label>
                <textarea
                  required
                  value={noticeForm.message}
                  onChange={(e) => setNoticeForm({ ...noticeForm, message: e.target.value })}
                  className="block w-full px-3.5 py-3 bg-slate-55 dark:bg-slate-955 border border-slate-255 dark:border-slate-800 rounded-xl text-slate-750 dark:text-slate-350 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 h-24"
                  placeholder="Announcement description..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsNoticeModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs font-bold text-white bg-indigo-650 hover:bg-indigo-500 rounded-xl transition-all shadow-md shadow-indigo-650/20"
                >
                  Broadcast Notice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
