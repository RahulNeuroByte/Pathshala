import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useUser } from '../context/UserContext';

interface DashboardShellProps {
  children: React.ReactNode;
}

export default function DashboardShell({ children }: DashboardShellProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { role, logout } = useUser();
  
  const roleDetails: Record<string, { name: string; roleName: string; badge: string; email: string; initials: string; profile_photo?: string }> = {
    admin: { name: 'Admin User', roleName: 'Super Admin', badge: 'SYS LIVE', email: 'admin@pathshala.edu', initials: 'AD', profile_photo: '' },
    hod: { name: 'Dr. Sarah Jenkins', roleName: 'HOD - CS', badge: 'DEPT HEAD', email: 'sarah.j@pathshala.edu', initials: 'SJ', profile_photo: '' },
    faculty: { name: 'Prof. Alan Turing', roleName: 'Faculty', badge: 'FACULTY', email: 'alan.t@pathshala.edu', initials: 'AT', profile_photo: '' },
    student: { name: 'Rahul Kumar', roleName: 'Student (CSE)', badge: 'STUDENT', email: 'rahul.k@pathshala.edu', initials: 'RK', profile_photo: '' },
    principal: { name: 'Dr. John Doe', roleName: 'Principal', badge: 'PRINCIPAL', email: 'principal@pathshala.edu', initials: 'JD', profile_photo: '' },
    librarian: { name: 'Mrs. Irene Adler', roleName: 'Librarian', badge: 'LIBRARIAN', email: 'library@pathshala.edu', initials: 'IA', profile_photo: '' },
    class_counsellor: { name: 'Prof. Ada Lovelace', roleName: 'Class Counsellor', badge: 'CLASS COUNSELLOR', email: 'cc@pathshala.edu', initials: 'AL', profile_photo: '' },
  };

  const [currentProfile, setCurrentProfile] = useState(roleDetails[role] || roleDetails.admin);
  const [time, setTime] = useState<string>('');

  // Clock tick effect
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      };
      setTime(now.toLocaleDateString('en-US', options));
    };
    
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch real-time user profile from backend
  useEffect(() => {
    let active = true;
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('access_token');
        if (!token) return;
        
        const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";
        const response = await fetch(`${API_BASE_URL}/users/me`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok && active) {
          const data = await response.json();
          const firstName = data.first_name || '';
          const lastName = data.last_name || '';
          const name = firstName || lastName ? `${firstName} ${lastName}`.trim() : (data.username || 'User');
          const initials = firstName && lastName ? `${firstName[0]}${lastName[0]}`.toUpperCase() : (data.username ? data.username.substring(0, 2).toUpperCase() : 'US');
          
          let roleName = 'Student';
          let badge = 'STUDENT';
          if (data.role === 'admin') {
            roleName = 'Super Admin';
            badge = 'SYS LIVE';
          } else if (data.role === 'principal') {
            roleName = 'Principal';
            badge = 'PRINCIPAL';
          } else if (data.role === 'librarian') {
            roleName = 'Librarian';
            badge = 'LIBRARIAN';
          } else if (data.role === 'class_counsellor') {
            roleName = `CC - Section ${data.section || 'A'}`;
            badge = 'CLASS COUNSELLOR';
          } else if (data.role === 'hod') {
            roleName = `HOD - ${data.dept_name || 'CS'}`;
            badge = 'DEPT HEAD';
          } else if (data.role === 'faculty') {
            roleName = data.designation || 'Faculty';
            badge = 'FACULTY';
          } else if (data.role === 'student') {
            roleName = `Student (${data.course_name || 'CSE'})`;
            badge = 'STUDENT';
          }
          
          setCurrentProfile({
            name,
            roleName,
            badge,
            email: data.email || '',
            initials,
            profile_photo: data.profile_photo
          });
        }
      } catch (err) {
        console.error("Failed to fetch user profile in DashboardShell", err);
      }
    };
    
    fetchProfile();
    return () => {
      active = false;
    };
  }, [role]);
  
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Dropdown states
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isMessagesOpen, setIsMessagesOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  // Fetch notifications
  useEffect(() => {
    let active = true;
    const fetchNotifications = async () => {
      try {
        const token = localStorage.getItem('access_token');
        if (!token) return;
        const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";
        const response = await fetch(`${API_BASE_URL}/users/me/notifications`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok && active) {
          const data = await response.json();
          setNotifications(data || []);
        }
      } catch (err) {
        console.error("Failed to fetch notifications in DashboardShell", err);
      }
    };
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000); // Poll every 15s for alerts
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const allNavItems = [
    {
      name: 'Dashboard',
      path: '/dashboard',
      icon: (
        <svg width="20" height="20" className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" />
        </svg>
      ),
      roles: ['admin', 'hod', 'faculty', 'student', 'principal', 'librarian', 'class_counsellor']
    },
    {
      name: 'Students',
      path: '/students',
      icon: (
        <svg width="20" height="20" className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      roles: ['admin', 'hod', 'principal', 'class_counsellor']
    },
    {
      name: 'Faculty',
      path: '/faculty',
      icon: (
        <svg width="20" height="20" className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 00-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
        </svg>
      ),
      roles: ['admin', 'hod', 'principal']
    },
    {
      name: 'Principal Tracker',
      path: '/principal-tracker',
      icon: (
        <svg width="20" height="20" className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2" />
        </svg>
      ),
      roles: ['admin']
    },
    {
      name: 'Faculty Assignment',
      path: '/hod-assign',
      icon: (
        <svg width="20" height="20" className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
        </svg>
      ),
      roles: ['hod', 'principal']
    },
    {
      name: 'Bulletins Board',
      path: '/hod-notice',
      icon: (
        <svg width="20" height="20" className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
        </svg>
      ),
      roles: ['hod', 'principal']
    },
    {
      name: 'Attendance Sheet',
      path: '/faculty-attendance',
      icon: (
        <svg width="20" height="20" className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2" />
        </svg>
      ),
      roles: ['faculty', 'class_counsellor', 'hod', 'librarian', 'principal']
    },
    {
      name: 'Submit Grades',
      path: '/faculty-marks',
      icon: (
        <svg width="20" height="20" className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      ),
      roles: ['faculty', 'class_counsellor']
    },
    {
      name: 'My Attendance',
      path: '/student-attendance',
      icon: (
        <svg width="20" height="20" className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      roles: ['student']
    },
    {
      name: 'My Grades',
      path: '/student-results',
      icon: (
        <svg width="20" height="20" className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
      roles: ['student']
    },
    {
      name: 'Fees & Payments',
      path: '/student-fees',
      icon: (
        <svg width="20" height="20" className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      ),
      roles: ['student']
    },
    {
      name: 'Class Timetable',
      path: '/timetable',
      icon: (
        <svg width="20" height="20" className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      roles: ['hod', 'faculty', 'student', 'principal', 'class_counsellor']
    },
    {
      name: 'Meetings',
      path: '/meetings',
      icon: (
        <svg width="20" height="20" className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 00-2 2z" />
        </svg>
      ),
      roles: ['admin', 'hod', 'faculty', 'student', 'principal', 'librarian', 'class_counsellor']
    },
    {
      name: 'Fees Audit',
      path: '/fees',
      icon: (
        <svg width="20" height="20" className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5h7M9 9h7M9 5a4 4 0 0 1 0 8h3L16 19" />
        </svg>
      ),
      roles: ['admin', 'hod', 'principal']
    },
    {
      name: 'Exams Scheduling',
      path: '/exams',
      icon: (
        <svg width="20" height="20" className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
      roles: ['principal']
    },
    {
      name: 'Assignments Board',
      path: '/assignments',
      icon: (
        <svg width="20" height="20" className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
      roles: ['faculty', 'class_counsellor']
    },
    {
      name: 'Library Catalog',
      path: '/library',
      icon: (
        <svg width="20" height="20" className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
        </svg>
      ),
      roles: ['student', 'hod', 'librarian', 'principal']
    },
    {
      name: 'Annual Holidays',
      path: '/holidays',
      icon: (
        <svg width="20" height="20" className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      roles: ['admin', 'student', 'faculty', 'hod', 'principal', 'librarian', 'class_counsellor']
    },
    {
      name: 'Connect Directory',
      path: '/connect',
      icon: (
        <svg width="20" height="20" className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
      roles: ['admin', 'student', 'faculty', 'hod', 'principal', 'librarian', 'class_counsellor']
    },
    {
      name: 'Leave Portal',
      path: '/leaves',
      icon: (
        <svg width="20" height="20" className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      roles: ['admin', 'student', 'faculty', 'hod', 'principal', 'librarian', 'class_counsellor']
    },
    {
      name: role === 'principal' ? 'HOD Interaction Room' : 'Dept Collaboration',
      path: '/collaboration',
      icon: (
        <svg width="20" height="20" className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      roles: ['hod', 'principal']
    },
  ];

  const navItems = allNavItems.filter((item) => item.roles.includes(role));

  return (
    <div className={`flex h-screen overflow-hidden font-sans ${theme === 'dark' ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800'}`}>
      
      {/* Sidebar for Desktop */}
      <aside className={`hidden md:flex md:flex-shrink-0 transition-all duration-300 ${isSidebarCollapsed ? 'w-20' : 'w-66'}`}>
        <div className="flex flex-col w-full bg-slate-900 border-r border-slate-800/80 shadow-lg z-20">
          
          {/* Logo Section */}
          <div className="flex items-center justify-between h-16 px-5 bg-slate-950 border-b border-slate-800/80">
            {!isSidebarCollapsed && (
              <span className="text-lg font-extrabold tracking-tight text-white flex items-center gap-2.5">
                <span className="bg-indigo-650/20 p-1.5 rounded-xl text-indigo-400 border border-indigo-500/20">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                    <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5" />
                  </svg>
                </span>
                Pathshala ERP
              </span>
            )}
            {isSidebarCollapsed && (
              <span className="bg-indigo-650/20 p-1.5 rounded-xl text-indigo-400 border border-indigo-500/20 mx-auto">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                  <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5" />
                </svg>
              </span>
            )}
            
            {/* Collapse Toggle */}
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Toggle Sidebar"
            >
              <svg width="20" height="20" className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isSidebarCollapsed ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7 7-7M19 19l-7-7 7-7" />
                )}
              </svg>
            </button>
          </div>

          {/* Navigation Links */}
          <div className="flex-1 flex flex-col pt-6 pb-4 overflow-y-auto">
            <nav className="flex-1 px-4 space-y-1.5">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <div key={item.name} className="relative group/tooltip">
                    <button
                      onClick={() => navigate(item.path)}
                      className={`flex items-center w-full px-4 py-3.5 text-sm font-semibold rounded-2xl transition-all duration-200 group ${
                        isActive
                          ? 'bg-indigo-650 text-white shadow-xl shadow-indigo-600/25 border border-indigo-500/20'
                          : 'text-slate-400 hover:bg-slate-850 hover:text-white border border-transparent'
                      }`}
                    >
                      <span className={`flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'} ${isSidebarCollapsed ? 'mx-auto' : 'mr-3.5'}`}>
                        {item.icon}
                      </span>
                      {!isSidebarCollapsed && <span>{item.name}</span>}
                    </button>

                    {/* Tooltip for collapsed mode */}
                    {isSidebarCollapsed && (
                      <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-1.5 bg-slate-950 text-white text-xs font-bold rounded-lg opacity-0 pointer-events-none group-hover/tooltip:opacity-100 transition-opacity whitespace-nowrap shadow-xl border border-slate-850 z-30">
                        {item.name}
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>
          </div>

          {/* Bottom Profile Section */}
          <div className="flex-shrink-0 border-t border-slate-800 p-4 bg-slate-950/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-indigo-55/10 text-indigo-400 border border-indigo-55/20 flex items-center justify-center font-bold text-sm overflow-hidden">
                  {currentProfile.profile_photo ? (
                    <img 
                      src={`${currentProfile.profile_photo.startsWith('http') ? '' : 'http://localhost:8000'}${currentProfile.profile_photo}`} 
                      alt="Profile" 
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    currentProfile.initials
                  )}
                </div>
                {!isSidebarCollapsed && (
                  <div>
                    <p className="text-xs font-extrabold text-slate-350">{currentProfile.roleName}</p>
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {currentProfile.badge}
                    </span>
                  </div>
                )}
              </div>
              {!isSidebarCollapsed && (
                <button
                  onClick={handleLogout}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                  title="Log out"
                >
                  <svg width="20" height="20" className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              )}
            </div>
          </div>

        </div>
      </aside>

      {/* Mobile Drawer Navigation */}
      <div className={`md:hidden fixed inset-0 z-40 flex ${isMobileMenuOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
        <div className="relative flex-1 flex flex-col max-w-xs w-full bg-slate-900 border-r border-slate-800">
          <div className="flex items-center justify-between h-16 px-5 bg-slate-950 border-b border-slate-800">
            <span className="text-lg font-extrabold text-white flex items-center gap-2.5">
              <span className="bg-indigo-650/20 p-1.5 rounded-xl text-indigo-400 border border-indigo-500/20">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                  <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5" />
                </svg>
              </span>
              Pathshala ERP
            </span>
            <button onClick={() => setIsMobileMenuOpen(false)} className="p-1.5 rounded-xl text-slate-400 hover:text-white" title="Close menu">
              <svg width="24" height="24" className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="flex-1 pt-6 pb-4 overflow-y-auto">
            <nav className="px-4 space-y-1.5">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <button
                    key={item.name}
                    onClick={() => {
                      navigate(item.path);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`flex items-center w-full px-4 py-3.5 text-sm font-semibold rounded-2xl ${
                      isActive ? 'bg-indigo-650 text-white' : 'text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    <span className="mr-3">{item.icon}</span>
                    {item.name}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 w-0 overflow-hidden">
        
        {/* Sticky Top Navbar */}
        <header className="sticky top-0 z-10 flex-shrink-0 flex h-16 bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800/80 shadow-sm transition-colors">
          {/* Mobile hamburger menu toggle */}
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="px-4 border-r border-slate-200 dark:border-slate-800 text-slate-500 focus:outline-none md:hidden"
            title="Open menu"
          >
            <svg width="24" height="24" className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          
          <div className="flex-1 px-6 md:px-8 flex items-center justify-between">
            {/* Left Header / Path & Real-time Clock */}
            <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
              <h2 className="text-base font-extrabold text-slate-800 dark:text-slate-200 capitalize tracking-tight">
                {location.pathname.substring(1) || 'Dashboard'}
              </h2>
              {time && (
                <div className="flex items-center gap-1.5 text-xs text-indigo-650 dark:text-indigo-400 font-bold bg-indigo-50 dark:bg-indigo-950/40 px-3 py-1 rounded-full border border-indigo-100 dark:border-indigo-900/30">
                  <svg className="w-3.5 h-3.5 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0" />
                  </svg>
                  <span>{time}</span>
                </div>
              )}
            </div>

            {/* Right Tools (Search, Notifications, Profile, Theme Toggle) */}
            <div className="flex items-center space-x-3.5 relative">
              
              {/* Theme Toggle Button */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-xl text-slate-400 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Toggle Theme"
              >
                {theme === 'dark' ? (
                  <svg width="20" height="20" className="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 14.142a1 1 0 011.414 0l.707.707a1 1 0 11-1.414 1.414l-.707-.707a1 1 0 010-1.414zm0-8.284a1 1 0 00-1.414 1.414l.707.707a1 1 0 001.414-1.414l-.707-.707zm-2.07 4.142a1 1 0 100-2H3a1 1 0 100 2h1z" />
                  </svg>
                ) : (
                  <svg width="20" height="20" className="w-5 h-5 text-slate-500" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                  </svg>
                )}
              </button>

              {/* Notification Button & Popover */}
              <div className="relative">
                <button
                  onClick={() => {
                    setIsNotificationsOpen(!isNotificationsOpen);
                    setIsMessagesOpen(false);
                    setIsProfileOpen(false);
                  }}
                  className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative"
                >
                  {notifications.length > 0 && (
                    <span className="absolute -top-1 -right-1 h-4.5 w-4.5 rounded-full bg-rose-500 text-[9px] font-black text-white flex items-center justify-center border border-white dark:border-slate-900">
                      {notifications.length}
                    </span>
                  )}
                  <svg width="20" height="20" className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </button>
                {isNotificationsOpen && (
                  <div className="absolute right-0 mt-3 w-80 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xl z-30 p-4 space-y-3">
                    <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-200">Alert Center</h3>
                    <div className="space-y-2 text-xs max-h-64 overflow-y-auto pr-1">
                      {notifications.length === 0 ? (
                        <p className="text-slate-400 text-center py-4">No active notices.</p>
                      ) : (
                        notifications.map((item, idx) => (
                          <div key={idx} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-800 space-y-1">
                            <p className="font-bold text-slate-700 dark:text-slate-250 leading-tight">{item.title}</p>
                            <p className="text-[10px] text-slate-455 dark:text-slate-500 leading-normal">{item.message}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Messages Button & Popover */}
              <div className="relative">
                <button
                  onClick={() => {
                    setIsMessagesOpen(!isMessagesOpen);
                    setIsNotificationsOpen(false);
                    setIsProfileOpen(false);
                  }}
                  className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative"
                  title="Messages"
                >
                  <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-emerald-500" />
                  <svg width="20" height="20" className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </button>
                {isMessagesOpen && (
                  <div className="absolute right-0 mt-3 w-80 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xl z-30 p-4 space-y-3.5">
                    <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-200">Inbox Messages</h3>
                    <p className="text-xs text-slate-400 text-center py-4">No unread administrator messages.</p>
                  </div>
                )}
              </div>

              {/* Separator */}
              <div className="h-6 w-px bg-slate-200 dark:bg-slate-800" />

              {/* Profile Dropdown */}
              <div className="relative">
                <button
                  onClick={() => {
                    setIsProfileOpen(!isProfileOpen);
                    setIsNotificationsOpen(false);
                    setIsMessagesOpen(false);
                  }}
                  className="flex items-center gap-2.5 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <div className="h-8 w-8 rounded-full bg-indigo-650 text-white font-bold text-xs flex items-center justify-center shadow-md overflow-hidden">
                    {currentProfile.profile_photo ? (
                      <img 
                        src={`${currentProfile.profile_photo.startsWith('http') ? '' : 'http://localhost:8000'}${currentProfile.profile_photo}`} 
                        alt="Profile" 
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      currentProfile.initials
                    )}
                  </div>
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-355 hidden sm:inline">
                    {currentProfile.name}
                  </span>
                </button>

                {isProfileOpen && (
                  <div className="absolute right-0 mt-3 w-52 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xl z-30 py-2.5">
                    <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800 mb-2">
                      <p className="text-xs font-extrabold text-slate-800 dark:text-slate-200 leading-none">{currentProfile.roleName}</p>
                      <p className="text-[10px] text-slate-400 mt-1">{currentProfile.email}</p>
                    </div>
                    <button
                      onClick={() => {
                        navigate('/profile');
                        setIsProfileOpen(false);
                      }}
                      className="w-full text-left px-4 py-2.5 text-xs text-slate-700 dark:text-slate-355 hover:bg-slate-50 dark:hover:bg-slate-850 transition-all font-semibold flex items-center gap-2"
                    >
                      <svg width="16" height="16" className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Profile Settings
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2.5 text-xs text-rose-500 hover:bg-rose-500/5 hover:text-rose-600 transition-all font-semibold flex items-center gap-2 border-t border-slate-100 dark:border-slate-800 mt-1 pt-2"
                    >
                      <svg width="16" height="16" className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Sign Out
                    </button>
                  </div>
                )}
              </div>

            </div>
          </div>
        </header>

        {/* Content Viewport */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none bg-slate-50 dark:bg-slate-950 transition-colors">
          <div className="py-8 px-6 md:px-10 max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>

    </div>
  );
}
