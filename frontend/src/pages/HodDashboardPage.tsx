import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function HodDashboardPage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [notices, setNotices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardDetails = async () => {
      try {
        const token = localStorage.getItem('access_token');
        if (!token) return;
        const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";
        
        // Fetch User Profile
        const profileRes = await fetch(`${API_BASE_URL}/users/me`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (profileRes.ok) {
          const profileData = await profileRes.json();
          setProfile(profileData);
        }

        // Fetch Notices
        const noticesRes = await fetch(`${API_BASE_URL}/users/me/notifications`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (noticesRes.ok) {
          const noticesData = await noticesRes.json();
          setNotices(noticesData || []);
        }
      } catch (err) {
        console.error("Failed to load HOD dashboard details", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardDetails();
  }, []);

  const stats = [
    {
      title: 'Department Faculty',
      value: '12 Professors',
      desc: 'Computer Science Dept',
      icon: (
        <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
        </svg>
      ),
      color: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/20 border-indigo-100 dark:border-indigo-900/30',
      path: '/faculty'
    },
    {
      title: 'Department Students',
      value: '145 Enrolled',
      desc: 'Across DSA, DBMS, OOP',
      icon: (
        <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      color: 'text-purple-650 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/20 border-purple-100 dark:border-purple-900/30',
      path: '/students'
    },
    {
      title: 'Dept Library Issues',
      value: '38 Books',
      desc: 'Central Library Catalog',
      icon: (
        <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
        </svg>
      ),
      color: 'text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/20 border-teal-100 dark:border-teal-900/30',
      path: '/library'
    },
    {
      title: 'Pending Dues Balance',
      value: '₹1,75,000',
      desc: 'Unpaid Student Fees',
      icon: (
        <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5h7M9 9h7M9 5a4 4 0 0 1 0 8h3L16 19" />
        </svg>
      ),
      color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/30',
      path: '/fees'
    }
  ];

  const studentPresenceList = [
    { course: 'Data Structures & Algorithms', batch: 'B.Tech CS - Sem III', total: 30, present: 27, rate: '90.0%' },
    { course: 'Object Oriented Programming', batch: 'B.Tech CS - Sem III', total: 30, present: 29, rate: '96.7%' },
    { course: 'Database Management Systems', batch: 'B.Tech CS - Sem V', total: 28, present: 25, rate: '89.2%' },
    { course: 'Discrete Mathematics Lecture', batch: 'B.Tech CS - Sem III', total: 25, present: 22, rate: '88.0%' }
  ];

  const getCategoryColor = (title: string) => {
    const lower = title.toLowerCase();
    if (lower.includes('meeting')) return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
    if (lower.includes('grade') || lower.includes('exam')) return 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20';
    return 'bg-emerald-500/10 text-emerald-550 border-emerald-500/20';
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

  const hodName = profile ? `${profile.designation || 'Dr.'} ${profile.first_name} ${profile.last_name}` : 'HOD Administration';
  const deptName = profile?.dept_name || 'Computer Science & Engineering';

  return (
    <div className="space-y-6">
      {/* Alert Bar */}
      <div 
        onClick={() => navigate('/hod-assign')}
        className="cursor-pointer bg-orange-500 hover:bg-orange-600 text-white px-5 py-3.5 rounded-2xl shadow-sm flex items-center justify-between gap-3 border border-orange-400/20 transition-all"
      >
        <div className="flex items-center gap-3">
          <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5" className="flex-shrink-0 animate-pulse text-white">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span className="text-xs font-bold text-white">Pending Action: Allocate faculty members to the upcoming term courses. Click here to configure assignment details.</span>
        </div>
        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5" className="flex-shrink-0 text-white">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </div>

      {/* HOD Greeting Banner */}
      <div className="relative rounded-3xl overflow-hidden shadow-lg bg-gradient-to-r from-amber-600 to-orange-700 p-8 md:p-10 text-white flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-white/20 tracking-wider">
            HOD Administration Workspace
          </span>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Welcome back, {hodName}
          </h2>
          <p className="text-white/80 text-xs md:text-sm">
            Head of {deptName} | Academic Year 2026-27
          </p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => navigate('/hod-assign')}
            className="px-4 py-2.5 bg-white text-orange-700 hover:text-orange-800 text-xs font-extrabold rounded-xl shadow-md hover:bg-slate-55 transition-all flex items-center gap-2"
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Assign Subject Faculty
          </button>
          <button 
            onClick={() => navigate('/hod-notice')}
            className="px-4 py-2.5 bg-orange-600 text-white text-xs font-extrabold rounded-xl shadow-md hover:bg-orange-700 border border-orange-400/20 transition-all flex items-center gap-2"
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            Broadcast Announcement
          </button>
        </div>
      </div>

      {/* Department Stats */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <button
            key={stat.title}
            onClick={() => navigate(stat.path)}
            className="flex items-center justify-between p-6 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-3xl shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 text-left w-full group"
          >
            <div className="space-y-1">
              <span className="text-slate-400 dark:text-slate-500 font-extrabold text-[10px] uppercase tracking-wider">
                {stat.title}
              </span>
              <h3 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                {stat.value}
              </h3>
              <p className="text-[10px] text-slate-455 dark:text-slate-550 font-medium">
                {stat.desc}
              </p>
            </div>
            <span className={`p-3.5 rounded-2xl border ${stat.color} transition-transform duration-300 group-hover:scale-110 flex items-center justify-center`}>
              {stat.icon}
            </span>
          </button>
        ))}
      </div>

      {/* Dynamic Content Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Attendance Compliance / Student Presence list */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 p-6 rounded-3xl shadow-sm space-y-5 transition-colors duration-300 lg:col-span-2">
          <div>
            <h3 className="font-extrabold text-slate-850 dark:text-slate-200 text-base">Student Presence Compliance</h3>
            <p className="text-xs text-slate-450 mt-0.5">Audit student attendance rates and lecture presence today</p>
          </div>
          
          <div className="space-y-4">
            {studentPresenceList.map((item, idx) => (
              <div
                key={idx}
                className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-2xl gap-4 hover:border-amber-500/20 transition-all"
              >
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    {item.batch}
                  </span>
                  <h4 className="text-sm font-extrabold text-slate-800 dark:text-slate-200">
                    {item.course}
                  </h4>
                  <p className="text-[10px] text-slate-450 dark:text-slate-500 font-medium">
                    Attendance Rate: {item.present} / {item.total} active students present today
                  </p>
                </div>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-3 py-1.5 rounded-xl flex-shrink-0">
                  {item.rate} Attendance
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Notices Board */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 p-6 rounded-3xl shadow-sm space-y-5 transition-colors duration-300 lg:col-span-1">
          <div>
            <h3 className="font-extrabold text-slate-850 dark:text-slate-200 text-base">Academic Bulletins</h3>
            <p className="text-xs text-slate-455 mt-0.5">Alert logs for CS department members</p>
          </div>
          
          <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
            {notices.length === 0 ? (
              <p className="text-slate-400 text-xs py-4 text-center">No active bulletins.</p>
            ) : (
              notices.map((notice, idx) => (
                <div
                  key={idx}
                  className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-2xl space-y-2.5"
                >
                  <div className="flex justify-between items-center">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold border ${getCategoryColor(notice.title)}`}>
                      Academic
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold">
                      {new Date(notice.created_at || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-snug">
                    {notice.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-450 leading-relaxed font-medium">
                    {notice.message}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
