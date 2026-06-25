import React, { useEffect, useState } from 'react';
import { Line, Bar } from 'react-chartjs-2';
import { useNavigate } from 'react-router-dom';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip as ChartTooltip,
  Legend as ChartLegend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  ChartTooltip,
  ChartLegend
);

export default function FacultyDashboardPage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('access_token');
        if (!token) return;
        const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";
        const response = await fetch(`${API_BASE_URL}/users/me`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setProfile(data);
        }
      } catch (err) {
        console.error("Failed to fetch profile in FacultyDashboard", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const classSchedule = [
    { time: '09:00 AM - 10:30 AM', subject: 'Data Structures & Algorithms', code: 'CS-302', room: 'Lab-A', batch: 'B.Tech CS - Sem III' },
    { time: '11:00 AM - 12:30 PM', subject: 'Object Oriented Programming', code: 'CS-304', room: 'Room 402', batch: 'B.Tech CS - Sem III' },
    { time: '02:00 PM - 03:30 PM', subject: 'Database Management Systems', code: 'CS-306', room: 'Seminar Hall 1', batch: 'B.Tech CS - Sem V' },
  ];

  const pendingGrading = [
    { title: 'Graph Theory Practical - Lab 4', subject: 'Data Structures Lab', dueDate: 'Yesterday', submissions: '24 / 28', color: 'border-amber-500/20 bg-amber-500/5 text-amber-550 dark:text-amber-400' },
    { title: 'DBMS Assignment 2 - SQL Joins', subject: 'Database Systems', dueDate: 'June 25, 2026', submissions: '12 / 30', color: 'border-indigo-500/20 bg-indigo-500/5 text-indigo-550 dark:text-indigo-400' },
  ];

  const stats = [
    {
      title: 'My Batches',
      value: '3 Active',
      desc: 'B.Tech CS (Sem III, V)',
      icon: (
        <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
      color: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/20 border-indigo-100 dark:border-indigo-900/30'
    },
    {
      title: 'Total Students',
      value: '88 Enrolled',
      desc: 'Across all subjects',
      icon: (
        <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      color: 'text-purple-650 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/20 border-purple-100 dark:border-purple-900/30'
    },
    {
      title: 'Avg. Attendance',
      value: '93.4%',
      desc: 'This semester',
      icon: (
        <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'text-emerald-600 dark:text-emerald-450 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/30'
    },
    {
      title: 'Unmarked Tasks',
      value: '36 Pending',
      desc: 'Assignments & Labs',
      icon: (
        <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
      color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/30'
    }
  ];

  const attendanceTrend = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    datasets: [
      {
        label: 'DSA Attendance (%)',
        data: [95, 92, 96, 90, 94],
        borderColor: '#6366f1',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        tension: 0.3,
        fill: true,
        borderWidth: 2,
      },
      {
        label: 'DBMS Attendance (%)',
        data: [88, 94, 91, 95, 93],
        borderColor: '#a855f7',
        backgroundColor: 'rgba(168, 85, 247, 0.1)',
        tension: 0.3,
        fill: true,
        borderWidth: 2,
      }
    ]
  };

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="relative rounded-3xl overflow-hidden shadow-lg bg-gradient-to-r from-indigo-650 to-violet-750 p-8 md:p-10 text-white flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-white/20 tracking-wider">
            Faculty Workspace
          </span>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Welcome back, {profile ? `${profile.designation || 'Prof.'} ${profile.first_name} ${profile.last_name}` : 'Faculty'}
          </h2>
          <p className="text-white/80 text-xs md:text-sm">
            {profile ? `${profile.designation || 'Professor'} - ${profile.dept_name || 'Department'}` : 'Faculty Member'} | Academic Year 2026-27
          </p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => navigate('/faculty-attendance')}
            className="px-4 py-2.5 bg-white text-indigo-700 text-xs font-extrabold rounded-xl shadow-md hover:bg-slate-50 transition-all flex items-center gap-2"
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2" />
            </svg>
            Mark Attendance
          </button>
          <button 
            onClick={() => navigate('/faculty-marks')}
            className="px-4 py-2.5 bg-indigo-500 text-white text-xs font-extrabold rounded-xl shadow-md hover:bg-indigo-600 border border-indigo-400/20 transition-all flex items-center gap-2"
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Submit Grades
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.title}
            className="flex items-center justify-between p-6 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-3xl shadow-sm transition-colors duration-300"
          >
            <div className="space-y-1">
              <span className="text-slate-400 dark:text-slate-500 font-extrabold text-[10px] uppercase tracking-wider">
                {stat.title}
              </span>
              <h3 className="text-2xl font-extrabold text-slate-850 dark:text-slate-100 tracking-tight">
                {stat.value}
              </h3>
              <p className="text-[10px] text-slate-450 dark:text-slate-550 font-medium">
                {stat.desc}
              </p>
            </div>
            <span className={`p-3.5 rounded-2xl border ${stat.color} flex items-center justify-center`}>
              {stat.icon}
            </span>
          </div>
        ))}
      </div>

      {/* Class Schedule and Pending Grading */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Today's Schedule */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 p-6 rounded-3xl shadow-sm lg:col-span-2 space-y-5 transition-colors duration-300">
          <div>
            <h3 className="font-extrabold text-slate-850 dark:text-slate-200 text-base">Today's Class Schedule</h3>
            <p className="text-xs text-slate-400 mt-0.5">Lectures and lab assignments for today</p>
          </div>
          <div className="space-y-4">
            {classSchedule.map((cls, idx) => (
              <div
                key={idx}
                className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-2xl gap-4 transition-all hover:border-indigo-200 dark:hover:border-indigo-900"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded-md border border-indigo-100/20">
                      {cls.code}
                    </span>
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                      {cls.batch}
                    </span>
                  </div>
                  <h4 className="text-sm font-extrabold text-slate-800 dark:text-slate-200">
                    {cls.subject}
                  </h4>
                  <p className="text-[10px] text-slate-450 dark:text-slate-500 font-medium">
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

        {/* Pending Grading Queue */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 p-6 rounded-3xl shadow-sm space-y-5 transition-colors duration-300">
          <div>
            <h3 className="font-extrabold text-slate-850 dark:text-slate-200 text-base">Grading Queue</h3>
            <p className="text-xs text-slate-400 mt-0.5">Submissions awaiting grading evaluation</p>
          </div>
          <div className="space-y-4">
            {pendingGrading.map((item, idx) => (
              <div
                key={idx}
                className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-2xl space-y-3"
              >
                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider">
                    {item.subject}
                  </span>
                  <h4 className="text-xs font-bold text-slate-750 dark:text-slate-200 leading-snug">
                    {item.title}
                  </h4>
                </div>
                <div className="flex items-center justify-between text-[11px] font-bold">
                  <span className="text-slate-400">Due: {item.dueDate}</span>
                  <span className={`px-2.5 py-1 rounded-lg border ${item.color}`}>
                    {item.submissions} Done
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Attendance Trend Chart */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 p-6 rounded-3xl shadow-sm space-y-5 transition-colors duration-300">
        <div>
          <h3 className="font-extrabold text-slate-850 dark:text-slate-200 text-base">Attendance Trend Analysis</h3>
          <p className="text-xs text-slate-400 mt-0.5">Average weekly attendance percentage across key courses</p>
        </div>
        <div className="h-72">
          <Line
            data={attendanceTrend}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { position: 'bottom', labels: { font: { size: 10 }, color: '#64748B' } },
              },
              scales: {
                y: { min: 80, max: 100, grid: { color: 'rgba(100, 116, 139, 0.08)' }, ticks: { color: '#64748B', font: { size: 10 } } },
                x: { grid: { display: false }, ticks: { color: '#64748B', font: { size: 10 } } },
              },
            }}
          />
        </div>
      </div>
    </div>
  );
}
