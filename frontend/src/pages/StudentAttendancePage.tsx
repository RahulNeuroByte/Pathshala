import React, { useEffect, useState } from 'react';
import { generatePDFReport } from '../utils/pdfGenerator';
import api, { attendanceService } from '../services/api';

interface AttendanceSummaryItem {
  subject: string;
  code: string;
  attended: number;
  total: number;
  percentage: number;
}

interface AttendanceLogItem {
  id: number;
  date: string;
  subject: string;
  code: string;
  status: string;
}

export default function StudentAttendancePage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [summary, setSummary] = useState<AttendanceSummaryItem[]>([]);
  const [overallPercentage, setOverallPercentage] = useState<number>(100.0);
  const [attendanceLogs, setAttendanceLogs] = useState<AttendanceLogItem[]>([]);
  const [studentId, setStudentId] = useState<number | null>(null);

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        setLoading(true);
        // Fetch current user details to get student_id
        const userRes = await api.get('/users/me');
        setStudentId(userRes.data.student_id);

        const res = await attendanceService.getMyAttendance();
        setSummary(res.data.summary || []);
        setOverallPercentage(res.data.overall_percentage ?? 100.0);
        setAttendanceLogs(res.data.attendance_logs || []);
        setError('');
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Failed to fetch attendance records');
      } finally {
        setLoading(false);
      }
    };
    fetchAttendance();
  }, []);

  const handleDownloadPDF = () => {
    if (!studentId) return;
    window.open(`http://localhost:8000/api/v1/reports/print/attendance/${studentId}`, '_blank');
  };

  // Calendar dates for June 2026
  const daysInJune = Array.from({ length: 30 }, (_, i) => {
    const day = i + 1;
    const dateStr = `2026-06-${day < 10 ? '0' + day : day}`;
    
    // Check if weekend (June 1, 2026 is Monday, so index 0 = Monday)
    const dayOfWeek = i % 7; // 0=Mon, 1=Tue, 2=Wed, 3=Thu, 4=Fri, 5=Sat, 6=Sun
    const isWeekend = dayOfWeek === 5 || dayOfWeek === 6;

    // Filter logs for this date
    const dayLogs = attendanceLogs.filter(log => log.date === dateStr);

    return {
      day,
      dateStr,
      isWeekend,
      logs: dayLogs
    };
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200/80 dark:border-slate-800/80 pb-5">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            My Attendance Records
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-450 mt-0.5">
            View your course compliance and class presence logs
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="px-4 py-2 bg-indigo-50 dark:bg-indigo-950/30 rounded-xl border border-indigo-100 dark:border-indigo-900/40 text-center">
            <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400">Overall Attendance</span>
            <div className={`text-lg font-black ${overallPercentage >= 75 ? 'text-emerald-500' : 'text-rose-500'}`}>
              {overallPercentage}%
            </div>
          </div>
          <button
            onClick={handleDownloadPDF}
            className="flex items-center justify-center px-4 py-2.5 text-xs font-bold text-white bg-indigo-650 hover:bg-indigo-500 rounded-xl transition-all shadow-md shadow-indigo-650/20 gap-2"
          >
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download PDF Report
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 rounded-xl border border-rose-100 dark:border-rose-900/40 text-xs font-bold">
          {error}
        </div>
      )}

      {/* Stats Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Subject-Wise Summary */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 p-6 rounded-3xl shadow-sm space-y-6 transition-colors duration-300">
          <div>
            <h3 className="font-extrabold text-slate-850 dark:text-slate-200 text-base">Course Compliance</h3>
            <p className="text-xs text-slate-450 mt-0.5">Attendance rates per registered academic course</p>
          </div>
          
          <div className="space-y-4.5">
            {summary.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No registered subjects found.</p>
            ) : (
              summary.map((item, idx) => (
                <div key={idx} className="space-y-2">
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span className="text-slate-850 dark:text-slate-200">{item.subject}</span>
                    <span className={item.percentage >= 75 ? "text-emerald-500" : "text-rose-500"}>
                      {item.percentage}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-slate-450 font-medium">
                    <span>Class Code: {item.code}</span>
                    <span>{item.attended} / {item.total} lectures attended</span>
                  </div>
                  {/* Progress Bar */}
                  <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${item.percentage >= 75 ? "bg-emerald-500" : "bg-rose-550"}`}
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Attendance Calendar */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 p-6 rounded-3xl shadow-sm space-y-6 transition-colors duration-300">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="font-extrabold text-slate-850 dark:text-slate-200 text-base">June 2026 Calendar</h3>
              <p className="text-xs text-slate-450 mt-0.5">Visual monthly logs mapping presence</p>
            </div>
            <div className="flex flex-wrap gap-3 text-[10px] font-bold">
              <span className="flex items-center gap-1.5 text-slate-400">
                <span className="h-2.5 w-2.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700" /> Unmarked
              </span>
              <span className="flex items-center gap-1.5 text-slate-400">
                <span className="h-2.5 w-2.5 rounded bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 pattern-diagonal-lines" /> Weekend Holiday
              </span>
              <span className="flex items-center gap-1.5 text-emerald-500">
                <span className="h-2.5 w-2.5 rounded bg-emerald-500/20 border border-emerald-500/30" /> Present
              </span>
              <span className="flex items-center gap-1.5 text-rose-500">
                <span className="h-2.5 w-2.5 rounded bg-rose-500/20 border border-rose-500/30" /> Absent
              </span>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2.5 text-center text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">
            <span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span><span>S</span>
          </div>
          
          <div className="grid grid-cols-7 gap-2.5">
            {daysInJune.map((d) => {
              // Determine status colors based on logs
              let cellClass = 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-450';
              let badge = null;

              if (d.isWeekend) {
                cellClass = 'border-slate-250 dark:border-slate-800 bg-slate-150/70 dark:bg-slate-850/50 text-slate-400 cursor-not-allowed';
                badge = <span className="absolute bottom-0.5 text-[7px] font-extrabold uppercase text-slate-400">Holiday</span>;
              } else if (d.logs.length > 0) {
                // If any subject is present, mark present, else if all are absent mark absent
                const hasPresent = d.logs.some(l => l.status === 'Present' || l.status === 'Late');
                if (hasPresent) {
                  cellClass = 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400';
                  badge = <span className="absolute bottom-0.5 text-[7px] font-extrabold uppercase text-emerald-500">Present</span>;
                } else {
                  cellClass = 'border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-450';
                  badge = <span className="absolute bottom-0.5 text-[7px] font-extrabold uppercase text-rose-550">Absent</span>;
                }
              }

              return (
                <div
                  key={d.day}
                  className={`relative h-12 rounded-xl flex flex-col items-center justify-center border transition-all ${cellClass} group`}
                  title={d.isWeekend ? "Weekend Holiday" : d.logs.map(l => `${l.code}: ${l.status}`).join(', ') || "No class marked"}
                >
                  <span className="font-extrabold text-xs -mt-2">{d.day}</span>
                  {badge}

                  {/* Tooltip for class lists */}
                  {!d.isWeekend && d.logs.length > 0 && (
                    <div className="hidden group-hover:block absolute bottom-full mb-1 z-30 bg-slate-900 text-white text-[9px] p-2 rounded-lg shadow-lg min-w-[120px] pointer-events-none">
                      {d.logs.map((l, i) => (
                        <div key={i} className="flex justify-between gap-2 border-b border-slate-800 pb-0.5 mb-0.5 last:border-0 last:pb-0 last:mb-0">
                          <span className="font-bold truncate max-w-[80px]">{l.code}</span>
                          <span className={l.status === 'Present' || l.status === 'Late' ? 'text-emerald-400' : 'text-rose-400'}>{l.status}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
