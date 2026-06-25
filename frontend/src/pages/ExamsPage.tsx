import React, { useEffect, useState } from 'react';
import { examService } from '../services/api';

export default function ExamsPage() {
  const [schedules, setSchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [newExam, setNewExam] = useState({
    subject_id: 1,
    exam_date: '',
    exam_time: '',
    duration_minutes: '180',
    exam_type: 'Midterm',
  });

  // Subject mapper
  const SUBJECTS: { [key: number]: string } = {
    1: 'Core Subject CS1 (Computer Architecture)',
    2: 'Core Subject CS2 (Data Structures)',
    3: 'Core Subject EC1 (Digital Electronics)',
    4: 'Core Subject EC2 (Signals & Systems)',
    5: 'Core Subject ME1 (Thermodynamics)',
    6: 'Core Subject ME2 (Fluid Mechanics)',
    7: 'Core Subject CE1 (Structural Design)',
    8: 'Core Subject CE2 (Geotechnical Eng)',
    9: 'Core Subject BA1 (Financial Management)',
    10: 'Core Subject BA2 (Organizational Behavior)'
  };

  useEffect(() => {
    const fetchExams = async () => {
      try {
        const response = await examService.getSchedules();
        setSchedules(response.data || []);
      } catch (error) {
        console.error('Failed to fetch exam schedules', error);
      } finally {
        setLoading(false);
      }
    };
    fetchExams();
  }, []);

  const handleScheduleExamSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const scheduledExam = {
      id: schedules.length + 1,
      ...newExam,
      duration_minutes: parseInt(newExam.duration_minutes),
    };

    setSchedules([...schedules, scheduledExam]);
    setIsScheduleModalOpen(false);

    setNewExam({
      subject_id: 1,
      exam_date: '',
      exam_time: '',
      duration_minutes: '180',
      exam_type: 'Midterm',
    });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto relative">
      
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">Exam Schedules</h1>
          <p className="text-slate-400 dark:text-slate-500 text-xs mt-1">
            Publish midterm, final, and practical slot schedules.
          </p>
        </div>
        
        {/* Schedule Exam Button */}
        <button
          onClick={() => setIsScheduleModalOpen(true)}
          className="flex items-center justify-center px-4 py-2.5 text-xs font-bold text-white bg-indigo-650 hover:bg-indigo-500 rounded-xl transition-all shadow-md shadow-indigo-650/20 gap-2"
        >
          <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Schedule Exam
        </button>
      </div>

      {/* Grid List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <svg className="animate-spin h-8 w-8 text-indigo-650" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
      ) : schedules.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-3">
          <svg width="36" height="36" className="text-slate-400 dark:text-slate-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-6h.008v.008H12v-.008zM12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM7.5 15h.008v.008H7.5V15zm0 2.25h.008v.008H7.5v-.008zM14.25 15h.008v.008h-.008V15zm0 2.25h.008v.008h-.008v-.008zM16.5 15h.008v.008H16.5V15zm0 2.25h.008v.008H16.5v-.008z" />
          </svg>
          <h3 className="font-extrabold text-slate-750 dark:text-slate-350 mt-2">No exams scheduled</h3>
          <p className="text-slate-400 dark:text-slate-500 text-xs mt-1">Check back later for revised academic timelines.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {schedules.map((exam) => (
            <div
              key={exam.id}
              className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 p-6 rounded-3xl shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="px-2.5 py-1 rounded-md text-[10px] font-extrabold bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/30 uppercase tracking-wider">
                    {exam.exam_type}
                  </span>
                  <span className="inline-flex items-center text-xs font-semibold text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 dark:text-emerald-450 border border-emerald-100 dark:border-emerald-900/20 px-2 py-0.5 rounded">
                    Active
                  </span>
                </div>

                <div className="space-y-1">
                  <h3 className="font-extrabold text-slate-800 dark:text-slate-150 text-base leading-snug">
                    {SUBJECTS[exam.subject_id] || `Subject ${exam.subject_id}`}
                  </h3>
                  <span className="text-slate-400 dark:text-slate-500 text-[10px] font-extrabold tracking-wider uppercase">
                    Exam ID: EXAM-{exam.id}
                  </span>
                </div>

                <div className="border-t border-slate-100 dark:border-slate-800/80 pt-4 space-y-3">
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <svg width="16" height="16" className="text-slate-450 dark:text-slate-500 w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <div>
                      <p className="font-extrabold text-slate-700 dark:text-slate-400 leading-none">Date</p>
                      <p className="text-[11px] text-slate-450 mt-1">{exam.exam_date}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <svg width="16" height="16" className="text-slate-455 dark:text-slate-500 w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <p className="font-extrabold text-slate-700 dark:text-slate-400 leading-none">Time & Duration</p>
                      <p className="text-[11px] text-slate-455 mt-1">{exam.exam_time} ({exam.duration_minutes} Mins)</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Schedule Exam Modal */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={() => setIsScheduleModalOpen(false)} />
          
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl relative z-10 space-y-6">
            <div>
              <h3 className="text-lg font-extrabold text-slate-850 dark:text-slate-200">Schedule Examination</h3>
              <p className="text-xs text-slate-450 dark:text-slate-500 mt-1">Publish a new exam slot for student registration checks.</p>
            </div>

            <form onSubmit={handleScheduleExamSubmit} className="space-y-5">
              
              {/* Subject Selection */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                  Academic Subject
                </label>
                <select
                  value={newExam.subject_id}
                  onChange={(e) => setNewExam({ ...newExam, subject_id: parseInt(e.target.value) })}
                  className="block w-full px-3 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-xl text-slate-750 dark:text-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent cursor-pointer"
                >
                  {Object.entries(SUBJECTS).map(([id, name]) => (
                    <option key={id} value={id}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Exam Date */}
              <div className="relative">
                <input
                  type="date"
                  required
                  id="exam_date"
                  value={newExam.exam_date}
                  onChange={(e) => setNewExam({ ...newExam, exam_date: e.target.value })}
                  className="block px-3.5 pb-2.5 pt-4.5 w-full text-xs text-slate-800 dark:text-slate-250 bg-slate-55 dark:bg-slate-950 rounded-xl border border-slate-250 dark:border-slate-800 appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all peer"
                  placeholder=" "
                />
                <label
                  htmlFor="exam_date"
                  className="absolute text-[10px] text-slate-455 dark:text-slate-500 duration-200 transform -translate-y-3.5 scale-90 top-2 z-10 origin-[0] bg-white dark:bg-slate-900 px-1.5 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-2 peer-placeholder-shown:top-2 peer-focus:-translate-y-3.5 peer-focus:top-2 peer-focus:scale-90 left-2.5"
                >
                  Exam Date
                </label>
              </div>

              {/* Exam Time & Duration */}
              <div className="grid grid-cols-2 gap-4">
                {/* Time */}
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="e.g. 10:00 AM"
                    id="exam_time"
                    value={newExam.exam_time}
                    onChange={(e) => setNewExam({ ...newExam, exam_time: e.target.value })}
                    className="block px-3.5 pb-2.5 pt-4.5 w-full text-xs text-slate-800 dark:text-slate-250 bg-slate-55 dark:bg-slate-950 rounded-xl border border-slate-250 dark:border-slate-800 appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all peer"
                  />
                  <label
                    htmlFor="exam_time"
                    className="absolute text-[10px] text-slate-455 dark:text-slate-500 duration-200 transform -translate-y-3.5 scale-90 top-2 z-10 origin-[0] bg-white dark:bg-slate-900 px-1.5 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-2 peer-placeholder-shown:top-2 peer-focus:-translate-y-3.5 peer-focus:top-2 peer-focus:scale-90 left-2.5"
                  >
                    Start Time (e.g. 10:00 AM)
                  </label>
                </div>

                {/* Duration */}
                <div className="relative">
                  <input
                    type="number"
                    required
                    id="duration"
                    value={newExam.duration_minutes}
                    onChange={(e) => setNewExam({ ...newExam, duration_minutes: e.target.value })}
                    className="block px-3.5 pb-2.5 pt-4.5 w-full text-xs text-slate-800 dark:text-slate-250 bg-slate-55 dark:bg-slate-950 rounded-xl border border-slate-250 dark:border-slate-800 appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all peer"
                    placeholder=" "
                  />
                  <label
                    htmlFor="duration"
                    className="absolute text-[10px] text-slate-455 dark:text-slate-500 duration-200 transform -translate-y-3.5 scale-90 top-2 z-10 origin-[0] bg-white dark:bg-slate-900 px-1.5 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-2 peer-placeholder-shown:top-2 peer-focus:-translate-y-3.5 peer-focus:top-2 peer-focus:scale-90 left-2.5"
                  >
                    Duration (Minutes)
                  </label>
                </div>
              </div>

              {/* Exam Type selection */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                  Exam Type
                </label>
                <select
                  value={newExam.exam_type}
                  onChange={(e) => setNewExam({ ...newExam, exam_type: e.target.value })}
                  className="block w-full px-3 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-xl text-slate-755 dark:text-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent cursor-pointer"
                >
                  <option value="Midterm">Midterm</option>
                  <option value="Final">Final Exam</option>
                  <option value="Practical">Practical Assessment</option>
                  <option value="Quiz">Academic Quiz</option>
                </select>
              </div>

              {/* Modal Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsScheduleModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs font-bold text-white bg-indigo-650 hover:bg-indigo-500 rounded-xl transition-all shadow-md shadow-indigo-650/20"
                >
                  Publish Schedule
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
