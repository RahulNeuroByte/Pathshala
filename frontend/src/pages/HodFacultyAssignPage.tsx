import React, { useState } from 'react';

export default function HodFacultyAssignPage() {
  const [showModal, setShowModal] = useState(false);
  const [selectedFaculty, setSelectedFaculty] = useState('Prof. Sarah');
  const [subjectCode, setSubjectCode] = useState('CS-302');
  const [batchClass, setBatchClass] = useState('B.Tech CS - Sem III');
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  const [assignments, setAssignments] = useState([
    { id: 1, faculty: 'Prof. Sarah', subject: 'Data Structures & Algorithms', code: 'CS-302', batch: 'B.Tech CS - Sem III', status: 'Active' },
    { id: 2, faculty: 'Dr. John Doe', subject: 'Object Oriented Programming', code: 'CS-304', batch: 'B.Tech CS - Sem III', status: 'Active' },
    { id: 3, faculty: 'Prof. Alice', subject: 'Discrete Mathematics', code: 'MA-301', batch: 'B.Tech CS - Sem III', status: 'Active' },
  ]);

  const handleAssign = (e: React.FormEvent) => {
    e.preventDefault();
    const subNameMap: Record<string, string> = {
      'CS-302': 'Data Structures & Algorithms',
      'CS-304': 'Object Oriented Programming',
      'CS-306': 'Database Management Systems',
    };

    const newAssignment = {
      id: Date.now(),
      faculty: selectedFaculty,
      code: subjectCode,
      subject: subNameMap[subjectCode] || 'Advanced Computer Science',
      batch: batchClass,
      status: 'Active',
    };

    setAssignments(prev => [newAssignment, ...prev]);
    setShowModal(false);
    setShowSuccessToast(true);
    setTimeout(() => {
      setShowSuccessToast(false);
    }, 4000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200/80 dark:border-slate-800/80 pb-5">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Faculty Assignments
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-450 mt-0.5">
            Assign department professors to specific courses and class batches
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-5 py-2.5 bg-amber-600 hover:bg-amber-550 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-2"
        >
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Assign Subject Faculty
        </button>
      </div>

      {/* Success Toast */}
      {showSuccessToast && (
        <div className="fixed bottom-5 right-5 z-50 bg-emerald-600 text-white px-5 py-3.5 rounded-2xl shadow-xl flex items-center gap-3 border border-emerald-500/20 animate-bounce">
          <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-xs font-bold">Faculty course configuration successfully updated!</span>
        </div>
      )}

      {/* Active course mappings */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-3xl shadow-sm overflow-hidden transition-colors">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-850 text-left">
            <thead className="bg-slate-50/60 dark:bg-slate-950/40 border-b border-slate-100 dark:border-slate-800/80">
              <tr>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Subject Code</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Course Name</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Batch Class</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Assigned Professor</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs text-slate-700 dark:text-slate-350">
              {assignments.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/20 transition-colors">
                  <td className="px-6 py-4 font-bold text-slate-500 dark:text-slate-450">{item.code}</td>
                  <td className="px-6 py-4 font-bold text-slate-800 dark:text-slate-200">{item.subject}</td>
                  <td className="px-6 py-4 font-bold text-slate-655 dark:text-slate-400">{item.batch}</td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-450 font-bold rounded-lg border border-amber-500/10">
                      {item.faculty}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Assign Faculty Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden transform scale-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-5 bg-slate-50 dark:bg-slate-950 border-b border-slate-150 dark:border-slate-850 flex justify-between items-center">
              <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm">Assign Subject Faculty</h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-355"
              >
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleAssign} className="p-6 space-y-5">
              <div>
                <label className="block text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider mb-2">
                  Faculty Name
                </label>
                <select
                  value={selectedFaculty}
                  onChange={(e) => setSelectedFaculty(e.target.value)}
                  className="block w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option>Prof. Sarah</option>
                  <option>Dr. John Doe</option>
                  <option>Prof. Alice</option>
                  <option>Dr. Richard Brown</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider mb-2">
                  Course Subject
                </label>
                <select
                  value={subjectCode}
                  onChange={(e) => setSubjectCode(e.target.value)}
                  className="block w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="CS-302">CS-302 (Data Structures)</option>
                  <option value="CS-304">CS-304 (Object Oriented Programming)</option>
                  <option value="CS-306">CS-306 (Database Systems)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider mb-2">
                  Batch Class Target
                </label>
                <select
                  value={batchClass}
                  onChange={(e) => setBatchClass(e.target.value)}
                  className="block w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option>B.Tech CS - Sem III</option>
                  <option>B.Tech CS - Sem V</option>
                  <option>M.Tech CS - Sem I</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full mt-2 py-3 px-4 border border-transparent text-xs font-bold rounded-xl text-white bg-amber-600 hover:bg-amber-550 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-600/20"
              >
                <span>Confirm Assignment</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
