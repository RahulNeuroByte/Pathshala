import React, { useState } from 'react';
import { generatePDFReport } from '../utils/pdfGenerator';

export default function StudentTimetablePage() {
  const [activeDay, setActiveDay] = useState('Monday');
  const [viewMode, setViewMode] = useState<'day' | 'grid'>('day');

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const scheduleData: Record<string, Array<{ time: string; subject: string; code: string; room: string; instructor: string; type: string }>> = {
    Monday: [
      { time: '09:00 AM - 10:30 AM', subject: 'Data Structures & Algorithms', code: 'CS-302', room: 'Lab-A', instructor: 'Prof. Sarah', type: 'Lab' },
      { time: '11:00 AM - 12:30 PM', subject: 'Object Oriented Programming', code: 'CS-304', room: 'Room 402', instructor: 'Dr. John Doe', type: 'Lecture' },
      { time: '02:00 PM - 03:30 PM', subject: 'Discrete Mathematics', code: 'MA-301', room: 'Room 305', instructor: 'Prof. Alice', type: 'Lecture' },
    ],
    Tuesday: [
      { time: '09:00 AM - 10:30 AM', subject: 'Database Management Systems', code: 'CS-306', room: 'Room 402', instructor: 'Prof. Sarah', type: 'Lecture' },
      { time: '11:00 AM - 12:30 PM', subject: 'Data Structures Lecture', code: 'CS-302', room: 'Room 201', instructor: 'Prof. Sarah', type: 'Lecture' },
    ],
    Wednesday: [
      { time: '09:00 AM - 10:30 AM', subject: 'Data Structures & Algorithms', code: 'CS-302', room: 'Lab-A', instructor: 'Prof. Sarah', type: 'Lab' },
      { time: '02:00 PM - 03:30 PM', subject: 'Discrete Mathematics', code: 'MA-301', room: 'Room 305', instructor: 'Prof. Alice', type: 'Lecture' },
    ],
    Thursday: [
      { time: '09:00 AM - 10:30 AM', subject: 'Database Management Systems', code: 'CS-306', room: 'Room 402', instructor: 'Prof. Sarah', type: 'Lecture' },
      { time: '11:00 AM - 12:30 PM', subject: 'Object Oriented Programming', code: 'CS-304', room: 'Room 402', instructor: 'Dr. John Doe', type: 'Lecture' },
    ],
    Friday: [
      { time: '11:00 AM - 12:30 PM', subject: 'Discrete Mathematics Practice', code: 'MA-301', room: 'Room 305', instructor: 'Prof. Alice', type: 'Tutorial' },
      { time: '02:00 PM - 03:30 PM', subject: 'Database Systems Lab', code: 'CS-306', room: 'Lab-B', instructor: 'Prof. Sarah', type: 'Lab' },
    ],
    Saturday: [
      { time: '09:00 AM - 10:30 AM', subject: 'Industry Seminar / Expert Talk', code: 'SEM-301', room: 'Seminar Hall 1', instructor: 'Guest Speaker', type: 'Lecture' },
      { time: '11:00 AM - 12:30 PM', subject: 'Soft Skills Training', code: 'SS-101', room: 'Room 402', instructor: 'Prof. Alice', type: 'Lecture' },
    ],
  };

  const activeLectures = scheduleData[activeDay] || [];
  const timeSlots = ['09:00 AM - 10:30 AM', '11:00 AM - 12:30 PM', '02:00 PM - 03:30 PM'];

  const handleDownloadPDF = () => {
    const headers = [['Time Slot', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']];
    const rows = timeSlots.map(slot => {
      const row = [slot];
      days.forEach(day => {
        const cls = scheduleData[day]?.find(c => c.time === slot);
        row.push(cls ? `${cls.subject}\n(${cls.code} - ${cls.room})\n${cls.instructor}` : '-');
      });
      return row;
    });

    generatePDFReport(
      'Weekly Lecture Timetable',
      {
        'Academic Year': '2026-27',
        'Scope': 'All Departments & Batches',
      },
      headers,
      rows,
      'weekly_timetable.pdf'
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200/80 dark:border-slate-800/80 pb-5">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Weekly Lecture Timetable
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-450 mt-0.5">
            Access your interactive schedule of classes, laboratory sessions, and tutorials
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Toggle View Mode */}
          <div className="bg-slate-100 dark:bg-slate-850 p-1 rounded-xl flex border border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setViewMode('day')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'day'
                  ? 'bg-white dark:bg-slate-900 text-indigo-650 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              Day View
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-slate-900 text-indigo-650 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              Full Weekly Grid
            </button>
          </div>

          {/* Download Button */}
          <button
            onClick={handleDownloadPDF}
            className="flex items-center justify-center px-4 py-2 text-xs font-bold text-white bg-indigo-650 hover:bg-indigo-500 rounded-xl transition-all shadow-md shadow-indigo-650/20 gap-2 border border-indigo-500/10"
          >
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download PDF
          </button>
        </div>
      </div>

      {viewMode === 'day' ? (
        <>
          {/* Day Selector Tabs */}
          <div className="flex overflow-x-auto bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 p-2 rounded-2xl shadow-sm gap-2 transition-colors scrollbar-none">
            {days.map((day) => (
              <button
                key={day}
                onClick={() => setActiveDay(day)}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex-1 sm:flex-none text-center ${
                  activeDay === day
                    ? 'bg-indigo-650 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-250 hover:bg-slate-50 dark:hover:bg-slate-850'
                }`}
              >
                {day}
              </button>
            ))}
          </div>

          {/* Timeline lecture cards */}
          <div className="space-y-4">
            {activeLectures.map((lecture, idx) => (
              <div
                key={idx}
                className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-3xl p-5 md:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-5 transition-colors duration-300"
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-5">
                  <div className={`h-11 w-11 rounded-2xl flex items-center justify-center flex-shrink-0 border font-bold text-xs ${
                    lecture.type === 'Lab'
                      ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                      : lecture.type === 'Tutorial'
                      ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20'
                      : 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20'
                  }`}>
                    {lecture.type[0]}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-extrabold text-indigo-650 dark:text-indigo-400">{lecture.code}</span>
                      <span className="text-[10px] text-slate-400 font-extrabold uppercase bg-slate-50 dark:bg-slate-950 px-2 py-0.5 rounded border border-slate-100 dark:border-slate-850">
                        {lecture.type}
                      </span>
                    </div>
                    <h3 className="text-sm font-extrabold text-slate-850 dark:text-slate-200">
                      {lecture.subject}
                    </h3>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-455 dark:text-slate-500 font-medium">
                      <span className="flex items-center gap-1">
                        <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24" className="opacity-70">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        Room: {lecture.room}
                      </span>
                      <span className="flex items-center gap-1">
                        <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24" className="opacity-70">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        Instructor: {lecture.instructor}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex-shrink-0 flex items-center md:justify-end">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-350 bg-slate-55 dark:bg-slate-950 px-4 py-2 rounded-2xl border border-slate-150 dark:border-slate-850 flex items-center gap-2">
                    <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" className="text-indigo-650 dark:text-indigo-400">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {lecture.time}
                  </span>
                </div>
              </div>
            ))}
            {activeLectures.length === 0 && (
              <div className="text-center py-12 text-slate-400">
                No lectures scheduled for this day.
              </div>
            )}
          </div>
        </>
      ) : (
        /* Full Weekly Grid View Table */
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-3xl shadow-sm overflow-hidden transition-colors">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-850 text-left border-collapse">
              <thead className="bg-slate-50/60 dark:bg-slate-950/40 border-b border-slate-100 dark:border-slate-800/80">
                <tr>
                  <th className="px-5 py-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider border-r border-slate-100 dark:border-slate-850">
                    Time Slot
                  </th>
                  {days.map(day => (
                    <th key={day} className="px-5 py-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider border-r border-slate-100 dark:border-slate-850 last:border-r-0">
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs font-semibold">
                {timeSlots.map((slot, sIdx) => (
                  <tr key={sIdx} className="hover:bg-slate-50/30 dark:hover:bg-slate-850/10 transition-colors">
                    <td className="px-5 py-5 font-bold text-indigo-650 dark:text-indigo-400 whitespace-nowrap bg-slate-50/30 dark:bg-slate-950/10 border-r border-slate-100 dark:border-slate-850">
                      {slot}
                    </td>
                    {days.map(day => {
                      const lecture = scheduleData[day]?.find(c => c.time === slot);
                      return (
                        <td key={day} className="px-5 py-5 border-r border-slate-100 dark:border-slate-850 last:border-r-0 align-top max-w-[200px]">
                          {lecture ? (
                            <div className="space-y-1">
                              <span className="text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-1.5 py-0.5 rounded">
                                {lecture.code}
                              </span>
                              <h4 className="font-extrabold text-slate-800 dark:text-slate-200 mt-1 leading-snug">
                                {lecture.subject}
                              </h4>
                              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                                Room: {lecture.room}
                              </p>
                              <p className="text-[10px] text-slate-455 dark:text-slate-550 font-bold">
                                {lecture.instructor}
                              </p>
                            </div>
                          ) : (
                            <span className="text-slate-300 dark:text-slate-700 font-normal">-</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
