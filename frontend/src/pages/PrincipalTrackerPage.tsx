import React, { useEffect, useState } from 'react';
import axios from 'axios';

interface Department {
  id: number;
  name: string;
  code: string;
}

interface Course {
  id: number;
  name: string;
  code: string;
  duration_years: number;
}

interface Exam {
  id: number;
  subject_name: string;
  subject_code: string;
  exam_date: string;
  exam_time: string;
  duration_minutes: number;
  exam_type: string;
}

interface Meeting {
  id: number;
  title: string;
  description: string;
  meeting_date: string;
  meeting_time: string;
  target_role: string | null;
}

interface LibraryIssuance {
  id: number;
  book_title: string;
  borrower_name: string;
  borrower_role: string;
  issue_date: string;
  due_date: string;
  return_date: string | null;
  status: string;
}

interface StaffAttendance {
  id: number;
  date: string;
  status: string;
  staff_name: string;
  employee_id: string;
  role: string;
}

interface LeaveRequest {
  id: number;
  applicant_name: string;
  applicant_role: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  reason: string;
  status: string;
}

export default function PrincipalTrackerPage() {
  const [data, setData] = useState<{
    departments: Department[];
    courses: Course[];
    exams: Exam[];
    meetings: Meeting[];
    library_issuances: LibraryIssuance[];
    staff_attendance: StaffAttendance[];
    leaves: LeaveRequest[];
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'academic' | 'exams' | 'attendance' | 'library' | 'meetings'>('academic');
  const [searchTerm, setSearchTerm] = useState('');

  const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

  const fetchTrackerData = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const res = await axios.get(`${API_BASE_URL}/reports/principal-tracker`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setData(res.data);
      setError('');
    } catch (err: any) {
      console.error("Failed to load principal tracker data:", err);
      setError(err.response?.data?.detail || "Could not retrieve Principal activity data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrackerData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <svg width="40" height="40" className="animate-spin text-indigo-650" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <span className="text-slate-400 font-bold text-xs uppercase tracking-wider">Syncing Principal workspace details...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-rose-500/10 text-rose-500 rounded-3xl border border-rose-500/20 max-w-2xl mx-auto mt-10">
        <h3 className="font-extrabold text-base mb-1">Access Restrained</h3>
        <p className="text-xs leading-normal">{error}</p>
      </div>
    );
  }

  // Filtered helper
  const filterList = <T extends Record<string, any>>(list: T[], keys: (keyof T)[]): T[] => {
    if (!searchTerm) return list;
    const term = searchTerm.toLowerCase();
    return list.filter(item => 
      keys.some(key => {
        const val = item[key];
        return val ? String(val).toLowerCase().includes(term) : false;
      })
    );
  };

  const getStatusBadgeClass = (status: string) => {
    const s = status.toLowerCase();
    if (s === 'approved' || s === 'present' || s === 'completed' || s === 'returned') {
      return 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border-emerald-200/50 dark:border-emerald-900/30';
    }
    if (s === 'pending' || s === 'issued') {
      return 'bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border-amber-200/50 dark:border-amber-900/30';
    }
    return 'bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border-rose-200/50 dark:border-rose-900/30';
  };

  const tabItems = [
    { id: 'academic', label: 'Academic Structures', count: (data?.departments.length || 0) + (data?.courses.length || 0) },
    { id: 'exams', label: 'Exam Schedules', count: data?.exams.length || 0 },
    { id: 'attendance', label: 'Leaves & Attendance', count: (data?.leaves.length || 0) + (data?.staff_attendance.length || 0) },
    { id: 'library', label: 'Library Issuances', count: data?.library_issuances.length || 0 },
    { id: 'meetings', label: 'Conference Logs', count: data?.meetings.length || 0 },
  ] as const;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">Principal Workspace Tracker</h1>
          <p className="text-slate-400 dark:text-slate-500 text-xs mt-1">
            Observe, audit, and track operational configurations managed by the Principal.
          </p>
        </div>
        
        <div className="relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input
            type="text"
            placeholder="Search logs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full md:w-64 pl-9 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-slate-850 dark:text-slate-100"
          />
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Departments', count: data?.departments.length || 0, color: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/20' },
          { label: 'Courses Created', count: data?.courses.length || 0, color: 'text-emerald-600 dark:text-emerald-450 bg-emerald-50 dark:bg-emerald-950/20' },
          { label: 'Exams Scheduled', count: data?.exams.length || 0, color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20' },
          { label: 'Staff Leaves Logs', count: data?.leaves.length || 0, color: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/20' },
          { label: 'Library Issuances', count: data?.library_issuances.length || 0, color: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/20' },
        ].map((stat, idx) => (
          <div key={idx} className="p-4 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{stat.label}</p>
              <h3 className="text-xl font-extrabold text-slate-800 dark:text-slate-100 mt-1">{stat.count}</h3>
            </div>
            <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${stat.color}`}>
              #
            </span>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 dark:border-slate-800 flex flex-wrap gap-2">
        {tabItems.map((tab) => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setSearchTerm(''); }}
            className={`px-4 py-3 text-xs font-bold transition-all border-b-2 -mb-px flex items-center gap-2 ${
              activeTab === tab.id
                ? 'border-indigo-650 text-indigo-650 dark:text-indigo-400 dark:border-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            {tab.label}
            <span className="px-1.5 py-0.5 rounded-full text-[9px] bg-slate-100 dark:bg-slate-800 font-extrabold">
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Main Table Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-3xl shadow-sm overflow-hidden">
        {activeTab === 'academic' && (
          <div className="p-6 space-y-6">
            <div>
              <h3 className="font-extrabold text-slate-850 dark:text-slate-200 text-sm">Academic Structure Modifications</h3>
              <p className="text-xs text-slate-400 mt-0.5">Departments and Courses configured to organize faculties and timetables.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Departments */}
              <div className="space-y-3">
                <h4 className="font-extrabold text-xs text-slate-500 uppercase tracking-wider">Departments ({data?.departments.length || 0})</h4>
                <div className="overflow-x-auto border border-slate-100 dark:border-slate-800 rounded-2xl">
                  <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800">
                    <thead className="bg-slate-50 dark:bg-slate-950/40">
                      <tr>
                        <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase">Code</th>
                        <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase">Name</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                      {filterList(data?.departments || [], ['name', 'code']).map((dept) => (
                        <tr key={dept.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/30 transition-colors">
                          <td className="px-4 py-3 text-xs font-bold text-indigo-500">{dept.code.toUpperCase()}</td>
                          <td className="px-4 py-3 text-xs font-semibold text-slate-700 dark:text-slate-300">{dept.name}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Courses */}
              <div className="space-y-3">
                <h4 className="font-extrabold text-xs text-slate-500 uppercase tracking-wider">Courses ({data?.courses.length || 0})</h4>
                <div className="overflow-x-auto border border-slate-100 dark:border-slate-800 rounded-2xl">
                  <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800">
                    <thead className="bg-slate-50 dark:bg-slate-950/40">
                      <tr>
                        <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase">Code</th>
                        <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase">Name</th>
                        <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase text-center">Duration</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                      {filterList(data?.courses || [], ['name', 'code']).map((course) => (
                        <tr key={course.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/30 transition-colors">
                          <td className="px-4 py-3 text-xs font-bold text-emerald-500">{course.code.toUpperCase()}</td>
                          <td className="px-4 py-3 text-xs font-semibold text-slate-700 dark:text-slate-300">{course.name}</td>
                          <td className="px-4 py-3 text-xs font-bold text-slate-500 text-center">{course.duration_years} Years</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          </div>
        )}

        {activeTab === 'exams' && (
          <div className="p-6 space-y-4">
            <div>
              <h3 className="font-extrabold text-slate-850 dark:text-slate-200 text-sm">Exam Scheduling Log</h3>
              <p className="text-xs text-slate-400 mt-0.5">Schedules created by Principal for end-semester reviews and assessments.</p>
            </div>
            <div className="overflow-x-auto border border-slate-100 dark:border-slate-800 rounded-2xl">
              <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800">
                <thead className="bg-slate-50 dark:bg-slate-950/40">
                  <tr>
                    <th className="px-6 py-3 text-left text-[10px] font-bold text-slate-400 uppercase">Subject</th>
                    <th className="px-6 py-3 text-left text-[10px] font-bold text-slate-400 uppercase">Code</th>
                    <th className="px-6 py-3 text-left text-[10px] font-bold text-slate-400 uppercase">Exam Date</th>
                    <th className="px-6 py-3 text-left text-[10px] font-bold text-slate-400 uppercase">Time</th>
                    <th className="px-6 py-3 text-left text-[10px] font-bold text-slate-400 uppercase">Duration</th>
                    <th className="px-6 py-3 text-left text-[10px] font-bold text-slate-400 uppercase">Type</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                  {filterList(data?.exams || [], ['subject_name', 'subject_code', 'exam_type']).map((ex) => (
                    <tr key={ex.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/30 transition-colors">
                      <td className="px-6 py-4 text-xs font-bold text-slate-700 dark:text-slate-350">{ex.subject_name}</td>
                      <td className="px-6 py-4 text-xs font-bold text-indigo-500">{ex.subject_code}</td>
                      <td className="px-6 py-4 text-xs font-semibold text-slate-600 dark:text-slate-400">{ex.exam_date}</td>
                      <td className="px-6 py-4 text-xs font-semibold text-slate-600 dark:text-slate-400">{ex.exam_time}</td>
                      <td className="px-6 py-4 text-xs font-bold text-slate-500">{ex.duration_minutes} Mins</td>
                      <td className="px-6 py-4 text-xs font-semibold text-slate-500">
                        <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded font-bold">{ex.exam_type}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'attendance' && (
          <div className="p-6 space-y-6">
            
            {/* Leaves Section */}
            <div className="space-y-3">
              <div>
                <h3 className="font-extrabold text-slate-850 dark:text-slate-200 text-sm">Staff Leaves Administration</h3>
                <p className="text-xs text-slate-400 mt-0.5">Leaves submitted by HODs and faculty, subject to the Principal's approval.</p>
              </div>
              <div className="overflow-x-auto border border-slate-100 dark:border-slate-800 rounded-2xl">
                <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800">
                  <thead className="bg-slate-50 dark:bg-slate-950/40">
                    <tr>
                      <th className="px-6 py-3 text-left text-[10px] font-bold text-slate-400 uppercase">Staff Name</th>
                      <th className="px-6 py-3 text-left text-[10px] font-bold text-slate-400 uppercase">Role</th>
                      <th className="px-6 py-3 text-left text-[10px] font-bold text-slate-400 uppercase">Leave Type</th>
                      <th className="px-6 py-3 text-left text-[10px] font-bold text-slate-400 uppercase">From - To</th>
                      <th className="px-6 py-3 text-left text-[10px] font-bold text-slate-400 uppercase">Reason</th>
                      <th className="px-6 py-3 text-left text-[10px] font-bold text-slate-400 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                    {filterList(data?.leaves || [], ['applicant_name', 'applicant_role', 'leave_type', 'reason']).map((l) => (
                      <tr key={l.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/30 transition-colors">
                        <td className="px-6 py-4 text-xs font-bold text-slate-700 dark:text-slate-300">{l.applicant_name}</td>
                        <td className="px-6 py-4 text-xs font-semibold text-slate-500">{l.applicant_role}</td>
                        <td className="px-6 py-4 text-xs font-bold text-indigo-500">{l.leave_type}</td>
                        <td className="px-6 py-4 text-xs font-semibold text-slate-600 dark:text-slate-400">{l.start_date} to {l.end_date}</td>
                        <td className="px-6 py-4 text-xs text-slate-450 dark:text-slate-400 max-w-xs truncate">{l.reason}</td>
                        <td className="px-6 py-4 text-xs font-semibold">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold border ${getStatusBadgeClass(l.status)}`}>
                            {l.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Staff Attendance approvals */}
            <div className="space-y-3 pt-6 border-t border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="font-extrabold text-slate-850 dark:text-slate-200 text-sm">Staff Attendance approvals</h3>
                <p className="text-xs text-slate-400 mt-0.5">Faculty check-in records and verdict logs resolved by the Principal.</p>
              </div>
              <div className="overflow-x-auto border border-slate-100 dark:border-slate-800 rounded-2xl">
                <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800">
                  <thead className="bg-slate-50 dark:bg-slate-950/40">
                    <tr>
                      <th className="px-6 py-3 text-left text-[10px] font-bold text-slate-400 uppercase">Date</th>
                      <th className="px-6 py-3 text-left text-[10px] font-bold text-slate-400 uppercase">Employee ID</th>
                      <th className="px-6 py-3 text-left text-[10px] font-bold text-slate-400 uppercase">Staff Name</th>
                      <th className="px-6 py-3 text-left text-[10px] font-bold text-slate-400 uppercase">Role / Spec</th>
                      <th className="px-6 py-3 text-left text-[10px] font-bold text-slate-400 uppercase">Verdict Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                    {filterList(data?.staff_attendance || [], ['staff_name', 'employee_id', 'role']).map((att) => (
                      <tr key={att.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/30 transition-colors">
                        <td className="px-6 py-4 text-xs font-bold text-slate-700 dark:text-slate-300">{att.date}</td>
                        <td className="px-6 py-4 text-xs font-bold text-slate-500">{att.employee_id}</td>
                        <td className="px-6 py-4 text-xs font-bold text-slate-700 dark:text-slate-300">{att.staff_name}</td>
                        <td className="px-6 py-4 text-xs font-semibold text-slate-500">{att.role}</td>
                        <td className="px-6 py-4 text-xs font-semibold">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold border ${getStatusBadgeClass(att.status)}`}>
                            {att.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {activeTab === 'library' && (
          <div className="p-6 space-y-4">
            <div>
              <h3 className="font-extrabold text-slate-850 dark:text-slate-200 text-sm">Library Book Issuance Logs</h3>
              <p className="text-xs text-slate-400 mt-0.5">Physical library book issuances, due returns, and status updates under final oversight.</p>
            </div>
            <div className="overflow-x-auto border border-slate-100 dark:border-slate-800 rounded-2xl">
              <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800">
                <thead className="bg-slate-50 dark:bg-slate-950/40">
                  <tr>
                    <th className="px-6 py-3 text-left text-[10px] font-bold text-slate-400 uppercase">Book Title</th>
                    <th className="px-6 py-3 text-left text-[10px] font-bold text-slate-400 uppercase">Borrower</th>
                    <th className="px-6 py-3 text-left text-[10px] font-bold text-slate-400 uppercase">Role</th>
                    <th className="px-6 py-3 text-left text-[10px] font-bold text-slate-400 uppercase">Issued</th>
                    <th className="px-6 py-3 text-left text-[10px] font-bold text-slate-400 uppercase">Due Date</th>
                    <th className="px-6 py-3 text-left text-[10px] font-bold text-slate-400 uppercase">Returned</th>
                    <th className="px-6 py-3 text-left text-[10px] font-bold text-slate-400 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                  {filterList(data?.library_issuances || [], ['book_title', 'borrower_name', 'borrower_role', 'status']).map((issue) => (
                    <tr key={issue.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/30 transition-colors">
                      <td className="px-6 py-4 text-xs font-bold text-slate-700 dark:text-slate-300">{issue.book_title}</td>
                      <td className="px-6 py-4 text-xs font-bold text-slate-750 dark:text-slate-350">{issue.borrower_name}</td>
                      <td className="px-6 py-4 text-xs font-semibold text-slate-500">{issue.borrower_role}</td>
                      <td className="px-6 py-4 text-xs font-semibold text-slate-600 dark:text-slate-400">{issue.issue_date}</td>
                      <td className="px-6 py-4 text-xs font-bold text-slate-550 dark:text-slate-400">{issue.due_date}</td>
                      <td className="px-6 py-4 text-xs font-semibold text-slate-500">{issue.return_date || '-'}</td>
                      <td className="px-6 py-4 text-xs font-semibold">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold border ${getStatusBadgeClass(issue.status)}`}>
                          {issue.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'meetings' && (
          <div className="p-6 space-y-4">
            <div>
              <h3 className="font-extrabold text-slate-850 dark:text-slate-200 text-sm">Principal-Hosted Conferences & Meetings</h3>
              <p className="text-xs text-slate-400 mt-0.5">Schedules created directly by the Principal to review institutional affairs.</p>
            </div>
            <div className="overflow-x-auto border border-slate-100 dark:border-slate-800 rounded-2xl">
              <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800">
                <thead className="bg-slate-50 dark:bg-slate-950/40">
                  <tr>
                    <th className="px-6 py-3 text-left text-[10px] font-bold text-slate-400 uppercase">Title / Agenda</th>
                    <th className="px-6 py-3 text-left text-[10px] font-bold text-slate-400 uppercase">Description</th>
                    <th className="px-6 py-3 text-left text-[10px] font-bold text-slate-400 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-[10px] font-bold text-slate-400 uppercase">Time</th>
                    <th className="px-6 py-3 text-left text-[10px] font-bold text-slate-400 uppercase">Audience</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                  {filterList(data?.meetings || [], ['title', 'description', 'target_role']).map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/30 transition-colors">
                      <td className="px-6 py-4 text-xs font-bold text-slate-700 dark:text-slate-300">{m.title}</td>
                      <td className="px-6 py-4 text-xs text-slate-450 dark:text-slate-400 max-w-sm truncate">{m.description || 'No detailed agenda.'}</td>
                      <td className="px-6 py-4 text-xs font-semibold text-slate-600 dark:text-slate-400">{m.meeting_date}</td>
                      <td className="px-6 py-4 text-xs font-semibold text-slate-600 dark:text-slate-400">{m.meeting_time}</td>
                      <td className="px-6 py-4 text-xs font-bold text-indigo-500">{m.target_role || 'All Members'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
