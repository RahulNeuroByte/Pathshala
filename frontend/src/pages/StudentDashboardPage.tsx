import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip as ChartTooltip,
  Legend as ChartLegend,
} from 'chart.js';

ChartJS.register(ArcElement, ChartTooltip, ChartLegend);

export default function StudentDashboardPage() {
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

        // Fetch Notifications / Bulletins
        const noticesRes = await fetch(`${API_BASE_URL}/users/me/notifications`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (noticesRes.ok) {
          const noticesData = await noticesRes.json();
          setNotices(noticesData || []);
        }
      } catch (err) {
        console.error("Failed to load student dashboard info", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardDetails();
  }, []);

  const getCategoryAndColor = (title: string) => {
    const lower = title.toLowerCase();
    if (lower.includes('meeting')) {
      return { type: 'Meeting', color: 'bg-rose-500/10 text-rose-500 border-rose-500/20' };
    } else if (lower.includes('maintenance') || lower.includes('offline') || lower.includes('server')) {
      return { type: 'System', color: 'bg-rose-500/10 text-rose-500 border-rose-500/20' };
    } else if (lower.includes('hackathon') || lower.includes('fest') || lower.includes('hack')) {
      return { type: 'Event', color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' };
    }
    return { type: 'Academic', color: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20' };
  };

  const todayClasses = [
    { time: '09:00 AM - 10:30 AM', subject: 'Data Structures & Algorithms', code: 'CS-302', room: 'Lab-A', professor: 'Prof. Sarah' },
    { time: '11:00 AM - 12:30 PM', subject: 'Object Oriented Programming', code: 'CS-304', room: 'Room 402', professor: 'Dr. John Doe' },
    { time: '02:00 PM - 03:30 PM', subject: 'Library Self Study / Lab Slot', code: 'LIB-101', room: 'Central Library', professor: 'Staff' },
  ];

  const stats = [
    {
      title: 'My Attendance',
      value: '92.5%',
      desc: 'Requirement: > 75%',
      icon: (
        <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'text-indigo-650 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/20 border-indigo-100 dark:border-indigo-900/30',
      path: '/student-attendance'
    },
    {
      title: 'Current CGPA',
      value: '8.8 / 10.0',
      desc: 'First Class with Distinction',
      icon: (
        <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
      color: 'text-purple-650 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/20 border-purple-100 dark:border-purple-900/30',
      path: '/student-results'
    },
    {
      title: 'Pending Assignments',
      value: '2 Due',
      desc: 'DBMS SQL & DSA Trees',
      icon: (
        <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
      color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/30',
      path: '/assignments'
    },
    {
      title: 'Unpaid Fees',
      value: '₹0.00',
      desc: 'All dues clear',
      icon: (
        <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5h7M9 9h7M9 5a4 4 0 0 1 0 8h3L16 19" />
        </svg>
      ),
      color: 'text-emerald-600 dark:text-emerald-455 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/30',
      path: '/student-fees'
    }
  ];

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

  const name = profile ? `${profile.first_name} ${profile.last_name}` : "Student";
  const rollNo = profile?.roll_no || "N/A";
  const courseName = profile?.course_name || "N/A";
  const semester = profile?.current_semester ? `Semester ${profile.current_semester}` : "N/A";

  return (
    <div className="space-y-8">
      {/* Student Banner */}
      <div className="relative rounded-3xl overflow-hidden shadow-lg bg-gradient-to-r from-indigo-650 to-violet-750 p-8 md:p-10 text-white flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-white/20 tracking-wider">
            Student Portal
          </span>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Welcome back, {name}
          </h2>
          <p className="text-white/80 text-xs md:text-sm">
            Roll: {rollNo} | {courseName} - {semester}
          </p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => navigate('/timetable')}
            className="px-4 py-2.5 bg-white text-indigo-700 text-xs font-extrabold rounded-xl shadow-md hover:bg-slate-50 transition-all flex items-center gap-2"
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Class Timetable
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <button
            key={stat.title}
            onClick={() => navigate(stat.path)}
            className="flex items-center justify-between p-6 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-3xl shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 text-left w-full group animate-in fade-in slide-in-from-bottom-2 duration-300"
          >
            <div className="space-y-1">
              <span className="text-slate-400 dark:text-slate-500 font-extrabold text-[10px] uppercase tracking-wider">
                {stat.title}
              </span>
              <h3 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight group-hover:text-indigo-650 dark:group-hover:text-indigo-400 transition-colors">
                {stat.value}
              </h3>
              <p className="text-[10px] text-slate-450 dark:text-slate-550 font-medium">
                {stat.desc}
              </p>
            </div>
            <span className={`p-3.5 rounded-2xl border ${stat.color} transition-transform duration-300 group-hover:scale-110 flex items-center justify-center`}>
              {stat.icon}
            </span>
          </button>
        ))}
      </div>

      {/* Campus Placement Selection Banner */}
      {profile?.student_id && (
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-3xl p-6 shadow-md text-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 animate-in fade-in duration-300">
          <div className="space-y-1">
            <span className="inline-flex px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-white/20 uppercase tracking-widest">
              Training & Placement Cell Attestation
            </span>
            <h3 className="text-lg font-black tracking-tight">Congratulations on your Corporate Offer!</h3>
            <p className="text-xs text-emerald-100">
              Selected in Campus Drive: <strong>Google India Pvt. Ltd. (Software Engineer)</strong>
            </p>
          </div>
          <button
            onClick={() => window.open(`http://localhost:8000/api/v1/reports/print/placement/${profile.student_id}`, '_blank')}
            className="px-4 py-2.5 bg-white text-emerald-700 font-extrabold text-xs rounded-xl shadow hover:bg-emerald-50 transition-all flex items-center gap-1.5"
            title="Download Placement Letter"
          >
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download Selection Letter
          </button>
        </div>
      )}

      {/* Class Schedule and Notice Board */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Today's Schedule */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 p-6 rounded-3xl shadow-sm lg:col-span-2 space-y-5 transition-colors duration-300">
          <div>
            <h3 className="font-extrabold text-slate-850 dark:text-slate-200 text-base">Today's Lectures</h3>
            <p className="text-xs text-slate-400 mt-0.5">Your class attendance schedule for today</p>
          </div>
          <div className="space-y-4">
            {todayClasses.map((cls, idx) => (
              <div
                key={idx}
                className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-2xl gap-4 transition-all hover:border-indigo-200 dark:hover:border-indigo-900"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded-md border border-indigo-100/20">
                      {cls.code}
                    </span>
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-450">
                      {cls.professor}
                    </span>
                  </div>
                  <h4 className="text-sm font-extrabold text-slate-800 dark:text-slate-200">
                    {cls.subject}
                  </h4>
                  <p className="text-[10px] text-slate-455 dark:text-slate-500 font-medium">
                    Room: {cls.room}
                  </p>
                </div>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-200/60 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-750 flex-shrink-0">
                  {cls.time}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Notice Board */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 p-6 rounded-3xl shadow-sm space-y-5 transition-colors duration-300">
          <div>
            <h3 className="font-extrabold text-slate-850 dark:text-slate-200 text-base">Academic Notices</h3>
            <p className="text-xs text-slate-400 mt-0.5">Latest announcements from administration</p>
          </div>
          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
            {notices.length === 0 ? (
              <p className="text-slate-400 text-xs py-4 text-center">No current bulletins.</p>
            ) : (
              notices.map((item, idx) => {
                const badgeInfo = getCategoryAndColor(item.title);
                const formattedDate = new Date(item.created_at || Date.now()).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                });
                return (
                  <div
                    key={idx}
                    className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-2xl space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold border ${badgeInfo.color}`}>
                        {badgeInfo.type}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">{formattedDate}</span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-750 dark:text-slate-250 leading-relaxed">
                      {item.title}
                    </h4>
                    <p className="text-[11px] text-slate-400 leading-normal">{item.message}</p>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
