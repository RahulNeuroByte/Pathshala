import React, { useEffect, useState } from 'react';
import { holidayService } from '../services/api';
import { generatePDFReport } from '../utils/pdfGenerator';

interface Holiday {
  id: number;
  name: string;
  date: string;
  day: string;
  type: string;
  description: string;
}

export default function HolidaysPage() {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('All');
  const [filterMonth, setFilterMonth] = useState<string>('All');

  useEffect(() => {
    const fetchHolidays = async () => {
      try {
        const response = await holidayService.getHolidays();
        setHolidays(response.data || []);
      } catch (error) {
        console.error('Failed to fetch holidays calendar', error);
      } finally {
        setLoading(false);
      }
    };
    fetchHolidays();
  }, []);

  const handleDownloadPDF = () => {
    const headers = [['Date', 'Day', 'Holiday Event', 'Type', 'Description']];
    const rows = filteredHolidays.map((h) => [
      new Date(h.date.split(' ')[0]).toLocaleDateString('en-US', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }),
      h.day,
      h.name,
      h.type,
      h.description || 'N/A',
    ]);

    generatePDFReport(
      'Annual Holidays Calendar',
      {
        'Academic Session': '2025 - 2026',
        'Total Holidays': `${filteredHolidays.length} Days/Slots`,
      },
      headers,
      rows,
      'holidays_calendar.pdf'
    );
  };

  const getMonthName = (dateStr: string) => {
    // "2025-08-15" -> August
    const date = new Date(dateStr.split(' ')[0]); // Handle ranges by taking first date
    return date.toLocaleString('en-US', { month: 'long' });
  };

  const filteredHolidays = holidays.filter(h => {
    const matchesType = filterType === 'All' || h.type === filterType;
    const matchesMonth = filterMonth === 'All' || getMonthName(h.date) === filterMonth;
    return matchesType && matchesMonth;
  });

  const totalGazetted = holidays.filter(h => h.type === 'Gazetted').length;
  const totalRestricted = holidays.filter(h => h.type === 'Restricted').length;
  const totalBreaks = holidays.filter(h => h.type === 'Academic Break').length;

  const months = ['August', 'October', 'November', 'December', 'January', 'February', 'March', 'April', 'June'];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <svg className="animate-spin h-8 w-8 text-indigo-650" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200/80 dark:border-slate-800/80 pb-5">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Annual Holidays Calendar
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-450 mt-0.5">
            Academic Session 2025 - 2026 Academic & Administrative Recess List
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleDownloadPDF}
            className="flex items-center justify-center px-4 py-2.5 text-xs font-bold text-white bg-indigo-650 hover:bg-indigo-500 rounded-xl transition-all shadow-md shadow-indigo-650/20 gap-2"
          >
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download PDF
          </button>
          <div className="flex items-center gap-1.5 text-xs text-indigo-650 dark:text-indigo-400 font-bold bg-indigo-50 dark:bg-indigo-950/40 px-3.5 py-1.5 rounded-2xl border border-indigo-100 dark:border-indigo-900/30 shadow-sm">
            <span>Active Session: 2025-2026</span>
          </div>
        </div>
      </div>

      {/* Holiday statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-emerald-650/5 dark:bg-emerald-500/5 border border-emerald-500/20 p-5 rounded-3xl flex justify-between items-center transition-all hover:shadow-sm">
          <div>
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-450 uppercase tracking-wider">
              Gazetted Holidays
            </span>
            <h3 className="text-3xl font-extrabold text-emerald-700 dark:text-emerald-455 tracking-tight mt-0.5">
              {totalGazetted} Days
            </h3>
            <p className="text-[9px] text-emerald-500/80 font-bold uppercase mt-1">
              Mandatory Institutional Off
            </p>
          </div>
          <span className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-600 dark:text-emerald-400 border border-emerald-500/10">
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </span>
        </div>

        <div className="bg-amber-650/5 dark:bg-amber-500/5 border border-amber-500/20 p-5 rounded-3xl flex justify-between items-center transition-all hover:shadow-sm">
          <div>
            <span className="text-[10px] font-bold text-amber-600 dark:text-amber-450 uppercase tracking-wider">
              Restricted Holidays
            </span>
            <h3 className="text-3xl font-extrabold text-amber-700 dark:text-amber-455 tracking-tight mt-0.5">
              {totalRestricted} Days
            </h3>
            <p className="text-[9px] text-amber-500/80 font-bold uppercase mt-1">
              Max 2 Optional Leaves Allowed
            </p>
          </div>
          <span className="p-3 bg-amber-500/10 rounded-2xl text-amber-600 dark:text-amber-400 border border-amber-500/10">
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </span>
        </div>

        <div className="bg-indigo-650/5 dark:bg-indigo-500/5 border border-indigo-500/20 p-5 rounded-3xl flex justify-between items-center transition-all hover:shadow-sm">
          <div>
            <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
              Academic Vacations
            </span>
            <h3 className="text-3xl font-extrabold text-indigo-700 dark:text-indigo-455 tracking-tight mt-0.5">
              {totalBreaks} Slots
            </h3>
            <p className="text-[9px] text-indigo-500/80 font-bold uppercase mt-1">
              Semester Recesses
            </p>
          </div>
          <span className="p-3 bg-indigo-500/10 rounded-2xl text-indigo-600 dark:text-indigo-400 border border-indigo-500/10">
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </span>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 p-4.5 rounded-3xl flex flex-wrap gap-4 items-center justify-between shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-col">
            <label className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Holiday Type</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="All">All Types</option>
              <option value="Gazetted">Gazetted</option>
              <option value="Restricted">Restricted</option>
              <option value="Academic Break">Academic Breaks</option>
            </select>
          </div>

          <div className="flex flex-col">
            <label className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Select Month</label>
            <select
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="All">All Months</option>
              {months.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
        </div>
        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase">
          Showing {filteredHolidays.length} of {holidays.length} recesses
        </span>
      </div>

      {/* Holiday Table Grid */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-3xl shadow-sm overflow-hidden transition-colors">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-850 text-left">
            <thead className="bg-slate-50/60 dark:bg-slate-950/40 border-b border-slate-100 dark:border-slate-800/80">
              <tr>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Day</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Holiday Event</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs text-slate-700 dark:text-slate-355 font-semibold">
              {filteredHolidays.length > 0 ? (
                filteredHolidays.map((holiday) => (
                  <tr key={holiday.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/20 transition-colors">
                    <td className="px-6 py-4 font-bold text-indigo-650 dark:text-indigo-400 whitespace-nowrap">
                      {new Date(holiday.date.split(' ')[0]).toLocaleDateString('en-US', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-6 py-4 text-slate-400 font-semibold whitespace-nowrap">{holiday.day}</td>
                    <td className="px-6 py-4 font-bold text-slate-800 dark:text-slate-200">{holiday.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-extrabold border ${
                        holiday.type === 'Gazetted'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                          : holiday.type === 'Restricted'
                          ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                          : 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20'
                      }`}>
                        {holiday.type.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-400 dark:text-slate-500 font-medium max-w-xs truncate" title={holiday.description}>
                      {holiday.description}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-slate-400 dark:text-slate-500 font-bold">
                    No holidays matched your visual filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
