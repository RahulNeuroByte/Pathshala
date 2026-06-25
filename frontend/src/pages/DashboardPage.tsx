import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { studentService, facultyService, libraryService, assignmentService, masterDataService } from '../services/api';
import { useTheme } from '../context/ThemeContext';
import { useUser } from '../context/UserContext';
import { Bar, Doughnut } from 'react-chartjs-2';
import LibrarianDashboard from './LibrarianDashboard';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

export default function DashboardPage() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { role } = useUser();

  if (role === 'librarian') {
    return <LibrarianDashboard />;
  }

  const [stats, setStats] = useState({
    studentsCount: 0,
    facultyCount: 0,
    booksCount: 0,
    assignmentsCount: 0,
  });
  const [studentsData, setStudentsData] = useState<any[]>([]);
  const [facultyData, setFacultyData] = useState<any[]>([]);
  const [booksData, setBooksData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Master Data Addition States
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [departmentsList, setDepartmentsList] = useState<any[]>([]);
  const [deptForm, setDeptForm] = useState({ name: '', code: '' });
  const [courseForm, setCourseForm] = useState({ name: '', code: '', dept_id: '', duration_years: 4 });
  const [modalError, setModalError] = useState('');
  const [modalSuccess, setModalSuccess] = useState('');

  const fetchDepartments = async () => {
    try {
      const res = await masterDataService.getDepartments();
      setDepartmentsList(res.data || []);
      if (res.data && res.data.length > 0) {
        setCourseForm(prev => ({ ...prev, dept_id: res.data[0].id.toString() }));
      }
    } catch (err: any) {
      console.error("Failed to load departments:", err);
    }
  };

  const handleCreateDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError('');
    setModalSuccess('');
    if (!deptForm.name || !deptForm.code) {
      setModalError('All fields are required.');
      return;
    }
    try {
      await masterDataService.createDepartment(deptForm);
      setModalSuccess('Department created successfully!');
      setDeptForm({ name: '', code: '' });
      setTimeout(() => {
        setIsDeptModalOpen(false);
        setModalSuccess('');
      }, 1500);
    } catch (err: any) {
      setModalError(err.response?.data?.detail || 'Failed to create department.');
    }
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError('');
    setModalSuccess('');
    if (!courseForm.name || !courseForm.code || !courseForm.dept_id) {
      setModalError('All fields are required.');
      return;
    }
    try {
      await masterDataService.createCourse({
        name: courseForm.name,
        code: courseForm.code,
        dept_id: parseInt(courseForm.dept_id),
        duration_years: Number(courseForm.duration_years)
      });
      setModalSuccess('Course created successfully!');
      setCourseForm({ name: '', code: '', dept_id: departmentsList[0]?.id.toString() || '', duration_years: 4 });
      setTimeout(() => {
        setIsCourseModalOpen(false);
        setModalSuccess('');
      }, 1500);
    } catch (err: any) {
      setModalError(err.response?.data?.detail || 'Failed to create course.');
    }
  };

  // Hero Slider State
  const [activeSlide, setActiveSlide] = useState(0);
  const slides = [
    {
      title: 'Admissions Open for Session 2025-26',
      subtitle: 'Pathshala ERP Administration Panel',
      desc: 'Coordinate admissions, course structures, and student records for the 2025-26 academic cycle.',
      badge: 'Admissions',
      color: 'from-indigo-650 to-violet-750',
    },
    {
      title: 'Daily Routine & Operations Scheduler',
      subtitle: 'Daily Basis Schedules',
      desc: 'Access live class schedules, faculty attendance records, lecture routines, and real-time operational tracking.',
      badge: 'Daily Basis',
      color: 'from-sky-600 to-indigo-700',
    },
    {
      title: 'Upcoming Events & Tech Fest Registrations',
      subtitle: 'Upcoming Events',
      desc: 'Participate in the upcoming annual sports meet and the Pathshala Tech Fest. Registrations open next week.',
      badge: 'Events',
      color: 'from-emerald-600 to-teal-700',
    },
    {
      title: 'Expert Seminars & Technology Talks',
      subtitle: 'Seminars & Workshops',
      desc: 'Register for incoming expert panels on AI/ML applications, cyber security protocols, and web engineering.',
      badge: 'Seminars',
      color: 'from-amber-650 to-orange-700',
    },
    {
      title: 'Auditorium Booking & Cultural Programs',
      subtitle: 'Auditorium Events',
      desc: 'Coordinate slot booking for academic convocation ceremonies, orientation programs, and weekend cultural events.',
      badge: 'Auditorium',
      color: 'from-rose-600 to-pink-700',
    },
  ];

  // Department name mapper
  const DEPARTMENTS = ['Computer Science', 'Electronics', 'Mechanical', 'Civil', 'Business Admin'];

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [studentsRes, facultyRes, booksRes, assignmentsRes] = await Promise.all([
          studentService.getStudents(),
          facultyService.getFaculty(),
          libraryService.getBooks(),
          assignmentService.getAssignments(),
        ]);

        const students = studentsRes.data || [];
        const faculty = facultyRes.data || [];
        const books = booksRes.data || [];
        const assignments = assignmentsRes.data || [];

        setStudentsData(students);
        setFacultyData(faculty);
        setBooksData(books);

        const totalBooks = books.reduce((acc: number, curr: any) => acc + (curr.quantity_total || 0), 0);

        setStats({
          studentsCount: students.length,
          facultyCount: faculty.length,
          booksCount: totalBooks,
          assignmentsCount: assignments.length,
        });
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Automatic hero slider transition
  useEffect(() => {
    if (loading) return;
    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [loading]);

  // Compute students & faculty breakdown by department
  const getDeptChartData = () => {
    const studentCounts = [0, 0, 0, 0, 0];
    studentsData.forEach((student: any) => {
      if (student.dept_id >= 1 && student.dept_id <= 5) {
        studentCounts[student.dept_id - 1]++;
      }
    });

    const facultyCounts = [0, 0, 0, 0, 0];
    facultyData.forEach((fac: any) => {
      if (fac.dept_id >= 1 && fac.dept_id <= 5) {
        facultyCounts[fac.dept_id - 1]++;
      }
    });

    return {
      labels: DEPARTMENTS,
      datasets: [
        {
          label: 'Students',
          data: studentCounts,
          backgroundColor: 'rgba(99, 102, 241, 0.85)', // Indigo
          borderColor: 'rgb(99, 102, 241)',
          borderWidth: 1.5,
          borderRadius: 6,
        },
        {
          label: 'Faculty',
          data: facultyCounts,
          backgroundColor: 'rgba(244, 63, 94, 0.85)', // Rose
          borderColor: 'rgb(244, 63, 94)',
          borderWidth: 1.5,
          borderRadius: 6,
        },
      ],
    };
  };

  // Compute book availability status
  const getBookChartData = () => {
    let available = 0;
    let total = 0;
    booksData.forEach((book: any) => {
      available += book.quantity_available || 0;
      total += book.quantity_total || 0;
    });
    const issued = total - available;

    return {
      labels: ['Available Copies', 'Issued Copies'],
      datasets: [
        {
          data: [available, issued > 0 ? issued : 0],
          backgroundColor: ['#10B981', '#F59E0B'],
          hoverOffset: 4,
          borderWidth: 0,
        },
      ],
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <svg width="40" height="40" className="animate-spin text-indigo-650" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-slate-400 font-bold text-xs uppercase tracking-wider">Loading ERP Intelligence...</span>
        </div>
      </div>
    );
  }

  const statCards = [
    { 
      title: 'Students Enrolled', 
      count: stats.studentsCount, 
      icon: (
        <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ), 
      color: 'bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900/30', 
      path: '/students' 
    },
    { 
      title: 'Faculty Members', 
      count: stats.facultyCount, 
      icon: (
        <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
        </svg>
      ), 
      color: 'bg-purple-50 dark:bg-purple-950/20 text-purple-600 dark:text-purple-400 border-purple-100 dark:border-purple-900/30', 
      path: '/faculty' 
    },
    { 
      title: 'Library Inventory', 
      count: stats.booksCount, 
      icon: (
        <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ), 
      color: 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30', 
      path: '/library' 
    },
    { 
      title: 'Active Assignments', 
      count: stats.assignmentsCount, 
      icon: (
        <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ), 
      color: 'bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-indigo-900/30', 
      path: '/assignments' 
    },
  ].filter(card => !(role === 'admin' && card.title === 'Active Assignments'));

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      
      {/* Interactive Hero Slider */}
      <div className="relative rounded-3xl overflow-hidden shadow-lg border border-slate-200/50 dark:border-slate-800/80">
        <div className={`flex transition-transform duration-500 ease-out`} style={{ transform: `translateX(-${activeSlide * 100}%)` }}>
          {slides.map((slide, idx) => (
            <div
              key={idx}
              className={`w-full flex-shrink-0 bg-gradient-to-r ${slide.color} p-8 md:p-12 text-white flex flex-col justify-between min-h-[220px] relative`}
              style={{ width: '100%' }}
            >
              <div className="absolute right-8 bottom-0 opacity-[0.08] select-none pointer-events-none transform translate-y-8 text-white">
                <svg width="160" height="160" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                  <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5" />
                </svg>
              </div>
              <div className="space-y-3.5 max-w-2xl">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-extrabold uppercase bg-white/20 tracking-wider">
                  {slide.badge}
                </span>
                <h2 className="text-2xl md:text-3.5xl font-extrabold tracking-tight leading-tight">
                  {slide.title}
                </h2>
                <p className="text-white/80 text-xs md:text-sm leading-relaxed">
                  {slide.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Slide Indicators */}
        <div className="absolute bottom-5 left-8 flex space-x-2">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setActiveSlide(idx)}
              className={`h-2.5 rounded-full transition-all duration-300 ${
                activeSlide === idx ? 'w-8 bg-white' : 'w-2.5 bg-white/40'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div className={`grid grid-cols-1 gap-6 sm:grid-cols-2 ${role === 'admin' ? 'lg:grid-cols-3' : 'lg:grid-cols-4'}`}>
        {statCards.map((card) => (
          <button
            key={card.title}
            onClick={() => navigate(card.path)}
            className="flex items-center justify-between p-6 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-3xl shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 text-left w-full group"
          >
            <div className="space-y-1">
              <span className="text-slate-400 dark:text-slate-500 font-extrabold text-[10px] uppercase tracking-wider">
                {card.title}
              </span>
              <h3 className="text-3.5xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                {card.count}
              </h3>
            </div>
            <span className={`p-3.5 rounded-2xl border ${card.color} transition-transform duration-300 group-hover:scale-110 flex items-center justify-center`}>
              {card.icon}
            </span>
          </button>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Department Breakdown Bar Chart */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 p-6 rounded-3xl shadow-sm lg:col-span-2 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-slate-850 dark:text-slate-200 text-base">Students & Faculty by Department</h3>
              <p className="text-xs text-slate-400 mt-0.5">Academic headcount distributed across active fields</p>
            </div>
          </div>
          <div className="h-68">
            <Bar
              data={getDeptChartData()}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: true,
                    position: 'top',
                    labels: {
                      boxWidth: 10,
                      font: { size: 10, weight: 'bold' },
                      color: theme === 'dark' ? '#94A3B8' : '#64748B',
                    },
                  },
                },
                scales: {
                  y: { beginAtZero: true, grid: { color: theme === 'dark' ? '#1E293B' : '#F1F5F9' }, ticks: { color: '#64748B', font: { size: 10 } } },
                  x: { grid: { display: false }, ticks: { color: '#64748B', font: { size: 10 } } },
                },
              }}
            />
          </div>
        </div>

        {/* Library Availability Doughnut Chart */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 p-6 rounded-3xl shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-slate-850 dark:text-slate-200 text-base">Library Allocation</h3>
              <p className="text-xs text-slate-400 mt-0.5">Availability breakdown of physical catalogs</p>
            </div>
          </div>
          <div className="h-68 flex items-center justify-center relative">
            <Doughnut
              data={getBookChartData()}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 10 }, color: '#64748B' } },
                },
                cutout: '72%',
              }}
            />
          </div>
        </div>
      </div>

      {/* Quick Panels Navigation */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 p-6 rounded-3xl shadow-sm space-y-4">
        <h3 className="font-extrabold text-slate-850 dark:text-slate-200 text-base">Administrative Access Hub</h3>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {[
            { 
              label: 'View Students', 
              path: '/students', 
              icon: (
                <svg width="28" height="28" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" className="text-indigo-650 dark:text-indigo-400">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ), 
              color: 'hover:bg-indigo-50/20 dark:hover:bg-indigo-950/20 hover:border-indigo-200 dark:hover:border-indigo-900',
              roles: ['admin', 'principal', 'hod', 'class_counsellor']
            },
            { 
              label: 'View Faculty', 
              path: '/faculty', 
              icon: (
                <svg width="28" height="28" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" className="text-purple-600 dark:text-purple-400">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
              ), 
              color: 'hover:bg-purple-50/20 dark:hover:bg-purple-950/20 hover:border-purple-200 dark:hover:border-purple-900',
              roles: ['admin', 'principal', 'hod']
            },
            { 
              label: 'Fees Portal', 
              path: '/fees', 
              icon: (
                <svg width="28" height="28" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" className="text-emerald-600 dark:text-emerald-450">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5h7M9 9h7M9 5a4 4 0 0 1 0 8h3L16 19" />
                </svg>
              ), 
              color: 'hover:bg-emerald-50/20 dark:hover:bg-emerald-950/20 hover:border-emerald-200 dark:hover:border-emerald-900',
              roles: ['admin', 'principal', 'hod']
            },
            { 
              label: 'Exams Scheduling', 
              path: '/exams', 
              icon: (
                <svg width="28" height="28" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" className="text-amber-600 dark:text-amber-400">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              ), 
              color: 'hover:bg-amber-50/20 dark:hover:bg-amber-950/20 hover:border-amber-200 dark:hover:border-amber-900',
              roles: ['principal']
            },
            { 
              label: 'Meetings Portal', 
              path: '/meetings', 
              icon: (
                <svg width="28" height="28" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" className="text-blue-600 dark:text-blue-400">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 00-2 2z" />
                </svg>
              ), 
              color: 'hover:bg-blue-50/20 dark:hover:bg-blue-950/20 hover:border-blue-200 dark:hover:border-blue-900',
              roles: ['admin', 'principal', 'hod', 'class_counsellor', 'faculty', 'student', 'librarian']
            },
            { 
              label: 'Assignments Board', 
              path: '/assignments', 
              icon: (
                <svg width="28" height="28" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" className="text-pink-650 dark:text-pink-450">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              ), 
              color: 'hover:bg-pink-50/20 dark:hover:bg-pink-950/20 hover:border-pink-200 dark:hover:border-pink-900',
              roles: ['hod', 'class_counsellor', 'faculty']
            },
            { 
              label: 'Library Catalog', 
              path: '/library', 
              icon: (
                <svg width="28" height="28" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" className="text-teal-600 dark:text-teal-400">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                </svg>
              ), 
              color: 'hover:bg-teal-50/20 dark:hover:bg-teal-950/20 hover:border-teal-200 dark:hover:border-teal-900',
              roles: ['student', 'hod', 'librarian', 'principal']
            },
            {
              label: 'Principal Tracker',
              path: '/principal-tracker',
              icon: (
                <svg width="28" height="28" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" className="text-indigo-650 dark:text-indigo-400">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2" />
                </svg>
              ),
              color: 'hover:bg-indigo-50/20 dark:hover:bg-indigo-950/20 hover:border-indigo-200 dark:hover:border-indigo-900',
              roles: ['admin']
            },
            { 
              label: 'Fees & Payments', 
              path: '/student-fees', 
              icon: (
                <svg width="28" height="28" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" className="text-rose-600 dark:text-rose-400">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              ), 
              color: 'hover:bg-rose-50/20 dark:hover:bg-rose-950/20 hover:border-rose-200 dark:hover:border-rose-900',
              roles: ['student']
            },
            { 
              label: 'My Grades', 
              path: '/student-results', 
              icon: (
                <svg width="28" height="28" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" className="text-cyan-600 dark:text-cyan-400">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              ), 
              color: 'hover:bg-cyan-50/20 dark:hover:bg-cyan-950/20 hover:border-cyan-200 dark:hover:border-cyan-900',
              roles: ['student']
            },
            { 
              label: 'Class Timetable', 
              path: '/timetable', 
              icon: (
                <svg width="28" height="28" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" className="text-orange-600 dark:text-orange-400">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0" />
                </svg>
              ), 
              color: 'hover:bg-orange-50/20 dark:hover:bg-orange-950/20 hover:border-orange-200 dark:hover:border-orange-900',
              roles: ['faculty', 'student', 'librarian']
            }
          ].filter(action => action.roles.includes(role)).map((action) => (
            <button
              key={action.label}
              onClick={() => navigate(action.path)}
              className={`flex flex-col items-center gap-3.5 p-5 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-800 rounded-2xl group transition-all duration-300 ${action.color}`}
              title={action.label}
            >
              <span className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm transition-transform duration-300 group-hover:scale-110 flex items-center justify-center">
                {action.icon}
              </span>
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 group-hover:text-indigo-650 dark:group-hover:text-indigo-400 transition-colors">
                {action.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Master Data Creation Controls for Principal */}
      {role === 'principal' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 p-6 rounded-3xl shadow-sm space-y-4">
          <h3 className="font-extrabold text-slate-850 dark:text-slate-200 text-base">Master Data Management</h3>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => {
                setModalError('');
                setModalSuccess('');
                setIsDeptModalOpen(true);
              }}
              className="px-5 py-3 rounded-2xl bg-indigo-650 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all"
              title="Add Department"
            >
              Add Department
            </button>
            <button
              onClick={() => {
                setModalError('');
                setModalSuccess('');
                fetchDepartments();
                setIsCourseModalOpen(true);
              }}
              className="px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all"
              title="Add Course"
            >
              Add Course
            </button>
          </div>
        </div>
      )}

      {/* Department Modal */}
      {isDeptModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4 relative">
            <button 
              onClick={() => setIsDeptModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
              title="Close Modal"
            >
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <h3 className="text-lg font-extrabold text-slate-800 dark:text-slate-100">Create Department</h3>
            {modalError && <div className="p-3 bg-rose-500/10 text-rose-500 rounded-xl text-xs font-bold border border-rose-500/20">{modalError}</div>}
            {modalSuccess && <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl text-xs font-bold border border-emerald-500/20">{modalSuccess}</div>}
            
            <form onSubmit={handleCreateDepartment} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase">Department Name</label>
                <input 
                  type="text" 
                  value={deptForm.name}
                  onChange={(e) => setDeptForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. Computer Science and Engineering"
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-indigo-505 text-xs font-semibold text-slate-800 dark:text-slate-100"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase">Department Code</label>
                <input 
                  type="text" 
                  value={deptForm.code}
                  onChange={(e) => setDeptForm(prev => ({ ...prev, code: e.target.value }))}
                  placeholder="e.g. CSE"
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-indigo-505 text-xs font-semibold text-slate-800 dark:text-slate-100"
                />
              </div>
              <button 
                type="submit"
                className="w-full py-3 rounded-xl bg-indigo-655 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider shadow-md transition-all"
                title="Submit Department"
              >
                Create Department
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Course Modal */}
      {isCourseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-955/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4 relative">
            <button 
              onClick={() => setIsCourseModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
              title="Close Modal"
            >
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <h3 className="text-lg font-extrabold text-slate-800 dark:text-slate-100">Create Course</h3>
            {modalError && <div className="p-3 bg-rose-500/10 text-rose-500 rounded-xl text-xs font-bold border border-rose-500/20">{modalError}</div>}
            {modalSuccess && <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl text-xs font-bold border border-emerald-500/20">{modalSuccess}</div>}
            
            <form onSubmit={handleCreateCourse} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase">Course Name</label>
                <input 
                  type="text" 
                  value={courseForm.name}
                  onChange={(e) => setCourseForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. Bachelor of Technology"
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-indigo-505 text-xs font-semibold text-slate-800 dark:text-slate-100"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase">Course Code</label>
                <input 
                  type="text" 
                  value={courseForm.code}
                  onChange={(e) => setCourseForm(prev => ({ ...prev, code: e.target.value }))}
                  placeholder="e.g. BTech"
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-indigo-505 text-xs font-semibold text-slate-800 dark:text-slate-100"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase">Department</label>
                <select
                  value={courseForm.dept_id}
                  onChange={(e) => setCourseForm(prev => ({ ...prev, dept_id: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-indigo-505 text-xs font-semibold text-slate-800 dark:text-slate-100"
                  title="Select Department"
                >
                  {departmentsList.length === 0 ? (
                    <option value="">No departments available</option>
                  ) : (
                    departmentsList.map(dept => (
                      <option key={dept.id} value={dept.id}>{dept.name} ({dept.code})</option>
                    ))
                  )}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase">Duration (Years)</label>
                <input 
                  type="number" 
                  value={courseForm.duration_years}
                  onChange={(e) => setCourseForm(prev => ({ ...prev, duration_years: parseInt(e.target.value) || 4 }))}
                  min="1"
                  max="6"
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-indigo-555 text-xs font-semibold text-slate-800 dark:text-slate-100"
                  title="Duration in Years"
                  placeholder="e.g. 4"
                />
              </div>
              <button 
                type="submit"
                className="w-full py-3 rounded-xl bg-indigo-655 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider shadow-md transition-all"
                title="Submit Course"
              >
                Create Course
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
