import React, { useState } from 'react';

export default function FacultyMarksPage() {
  const [selectedBatch, setSelectedBatch] = useState('B.Tech CS - Sem III');
  const [selectedExam, setSelectedExam] = useState('Mid-Term Examination');
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  const [students, setStudents] = useState([
    { id: 'STU001', name: 'Aarav Mehta', rollNo: 'CS2025-001', marks: '85', maxMarks: '100' },
    { id: 'STU002', name: 'Isha Sharma', rollNo: 'CS2025-002', marks: '92', maxMarks: '100' },
    { id: 'STU003', name: 'Kabir Verma', rollNo: 'CS2025-003', marks: '78', maxMarks: '100' },
    { id: 'STU004', name: 'Rohan Gupta', rollNo: 'CS2025-004', marks: '88', maxMarks: '100' },
    { id: 'STU005', name: 'Ananya Roy', rollNo: 'CS2025-005', marks: '95', maxMarks: '100' },
  ]);

  const handleMarksChange = (id: string, value: string) => {
    // Validate number 0-100
    const parsed = parseInt(value);
    if (value !== '' && (isNaN(parsed) || parsed < 0 || parsed > 100)) return;

    setStudents(prev =>
      prev.map(student =>
        student.id === id ? { ...student, marks: value } : student
      )
    );
  };

  const handleSubmit = () => {
    setShowSuccessToast(true);
    setTimeout(() => {
      setShowSuccessToast(false);
    }, 4000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200/80 dark:border-slate-800/80 pb-5">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Grades & Marks Submission
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-450 mt-0.5">
            Log examination and project assessment scorecard results
          </p>
        </div>
        <button
          onClick={handleSubmit}
          className="px-5 py-2.5 bg-indigo-650 hover:bg-indigo-600 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-2"
        >
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          Publish Marks Card
        </button>
      </div>

      {/* Success Toast */}
      {showSuccessToast && (
        <div className="fixed bottom-5 right-5 z-50 bg-emerald-600 text-white px-5 py-3.5 rounded-2xl shadow-xl flex items-center gap-3 border border-emerald-500/20 animate-bounce">
          <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-xs font-bold">Grades published successfully to Student Portals!</span>
        </div>
      )}

      {/* Toolbar selectors */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 p-5 rounded-2xl shadow-sm space-y-4 transition-colors">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Select Batch Class
            </label>
            <select
              value={selectedBatch}
              onChange={(e) => setSelectedBatch(e.target.value)}
              className="block w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-700 dark:text-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option>B.Tech CS - Sem III</option>
              <option>B.Tech CS - Sem V</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Select Assessment Type
            </label>
            <select
              value={selectedExam}
              onChange={(e) => setSelectedExam(e.target.value)}
              className="block w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-700 dark:text-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option>Mid-Term Examination</option>
              <option>Final Term Examination</option>
              <option>Internal Lab Assignment</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grade inputs */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-3xl shadow-sm overflow-hidden transition-colors">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-850 text-left">
            <thead className="bg-slate-50/60 dark:bg-slate-950/40 border-b border-slate-100 dark:border-slate-800/80">
              <tr>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Roll No</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Student Name</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Marks Scored</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Max Marks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs text-slate-700 dark:text-slate-350">
              {students.map((student) => (
                <tr key={student.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/20 transition-colors">
                  <td className="px-6 py-4 font-bold text-slate-500 dark:text-slate-450">{student.rollNo}</td>
                  <td className="px-6 py-4 font-bold text-slate-800 dark:text-slate-200">{student.name}</td>
                  <td className="px-6 py-4">
                    <div className="relative max-w-[120px]">
                      <input
                        type="text"
                        value={student.marks}
                        onChange={(e) => handleMarksChange(student.id, e.target.value)}
                        className="block w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                      />
                    </div>
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-400 dark:text-slate-500">/ {student.maxMarks}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
