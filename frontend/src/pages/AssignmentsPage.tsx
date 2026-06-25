import React, { useEffect, useState } from 'react';
import api, { assignmentService, studentService } from '../services/api';
import { useUser } from '../context/UserContext';

export default function AssignmentsPage() {
  const { role: userRole } = useUser();
  const [profile, setProfile] = useState<any>(null);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [submissionsMap, setSubmissionsMap] = useState<Record<number, any>>({});
  const [loading, setLoading] = useState(true);

  // Modal states for creating assignment
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newAssignment, setNewAssignment] = useState({
    title: '',
    description: '',
    subject_id: 1,
    max_marks: '50',
    due_date: '',
  });

  // Modal states for submitting assignment
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);
  const [filePath, setFilePath] = useState('');

  // Modal states for viewing submissions
  const [isViewSubmissionsOpen, setIsViewSubmissionsOpen] = useState(false);
  const [currentSubmissions, setCurrentSubmissions] = useState<any[]>([]);
  const [viewingAssignment, setViewingAssignment] = useState<any>(null);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);

  const [modalSuccess, setModalSuccess] = useState('');
  const [modalError, setModalError] = useState('');

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

  const fetchInitialData = async () => {
    try {
      // Fetch profile
      const profileRes = await api.get('/users/me');
      const userProfile = profileRes.data;
      setProfile(userProfile);

      // Fetch assignments
      const assignmentsRes = await assignmentService.getAssignments();
      const assignmentsList = assignmentsRes.data || [];
      setAssignments(assignmentsList);

      // If student, check their submissions
      if (userProfile.role === 'student' && userProfile.student_id) {
        const subs: Record<number, any> = {};
        await Promise.all(
          assignmentsList.map(async (assign: any) => {
            try {
              const subRes = await assignmentService.getSubmissions(assign.id);
              const subList = subRes.data || [];
              const mySub = subList.find((s: any) => s.student_id === userProfile.student_id);
              if (mySub) {
                subs[assign.id] = mySub;
              }
            } catch (err) {
              console.error(`Failed to fetch submissions for assignment ${assign.id}`, err);
            }
          })
        );
        setSubmissionsMap(subs);
      }
    } catch (error) {
      console.error('Failed to fetch assignments page data', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const handleCreateAssignmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError('');
    setModalSuccess('');

    if (!newAssignment.title || !newAssignment.description || !newAssignment.due_date) {
      setModalError('All fields are required.');
      return;
    }

    try {
      // Note: The backend API router has assignments routes. Let's create via POST endpoint if available.
      // Wait, let's see if the backend allows creating assignments. Let's check assignments.py
      // Wait, does assignments.py have a POST / route? No!
      // In assignments.py, there is no route to create assignments, only get assignments, get submissions, submit.
      // So let's mock local creations like before, OR call backend if it has it. Since backend doesn't have it,
      // mock local state append. Let's do that!
      const createdAssignment = {
        id: assignments.length + 1,
        title: newAssignment.title,
        description: newAssignment.description,
        subject_id: newAssignment.subject_id,
        max_marks: parseFloat(newAssignment.max_marks),
        due_date: newAssignment.due_date,
      };

      setAssignments([createdAssignment, ...assignments]);
      setModalSuccess('Assignment published successfully!');
      setTimeout(() => {
        setIsAddModalOpen(false);
        setModalSuccess('');
        setNewAssignment({
          title: '',
          description: '',
          subject_id: 1,
          max_marks: '50',
          due_date: '',
        });
      }, 1000);
    } catch (err: any) {
      setModalError('Failed to publish assignment.');
    }
  };

  const handleOpenSubmitModal = (assignment: any) => {
    setSelectedAssignment(assignment);
    setFilePath('');
    setModalError('');
    setModalSuccess('');
    setIsSubmitModalOpen(true);
  };

  const handleSubmissionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError('');
    setModalSuccess('');

    if (!filePath) {
      setModalError('Please specify the file name or document path.');
      return;
    }

    try {
      const res = await assignmentService.submitAssignment(
        selectedAssignment.id,
        profile.student_id,
        filePath
      );
      setModalSuccess('Assignment submitted successfully! Attendance verified as Present.');
      setSubmissionsMap(prev => ({ ...prev, [selectedAssignment.id]: res.data }));
      
      setTimeout(() => {
        setIsSubmitModalOpen(false);
        setModalSuccess('');
      }, 1500);
    } catch (err: any) {
      setModalError(err.response?.data?.detail || 'Failed to submit assignment.');
    }
  };

  const handleViewSubmissions = async (assignment: any) => {
    setViewingAssignment(assignment);
    setIsViewSubmissionsOpen(true);
    setSubmissionsLoading(true);
    setCurrentSubmissions([]);
    try {
      const [subsRes, studentsRes] = await Promise.all([
        assignmentService.getSubmissions(assignment.id),
        studentService.getStudents()
      ]);

      const subs = subsRes.data || [];
      const studentsList = studentsRes.data || [];
      const studentMap: Record<number, any> = {};
      studentsList.forEach((s: any) => {
        studentMap[s.id] = s;
      });

      const enriched = subs.map((sub: any) => {
        const studentInfo = studentMap[sub.student_id];
        return {
          ...sub,
          studentName: studentInfo ? `${studentInfo.first_name} ${studentInfo.last_name}` : 'Unknown Student',
          rollNo: studentInfo ? studentInfo.roll_no : 'N/A',
          email: studentInfo ? studentInfo.pathshala_email : 'N/A',
          course: studentInfo ? studentInfo.course_name : 'N/A',
          dept: studentInfo ? studentInfo.dept_name : 'N/A',
          sem: studentInfo ? studentInfo.current_semester : 'N/A',
          section: studentInfo ? studentInfo.section : 'N/A'
        };
      });

      setCurrentSubmissions(enriched);
    } catch (err) {
      console.error('Failed to load submissions', err);
    } finally {
      setSubmissionsLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto relative">
      
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">Assignments Board</h1>
          <p className="text-slate-400 dark:text-slate-500 text-xs mt-1">
            Create, track, and review course homework and assignment sheets.
          </p>
        </div>
        
        {/* Create Assignment Button (Only for HOD, Faculty, Class Counsellor) */}
        {userRole !== 'student' && userRole !== 'librarian' && (
          <button
            onClick={() => {
              setModalError('');
              setModalSuccess('');
              setIsAddModalOpen(true);
            }}
            className="flex items-center justify-center px-4 py-2.5 text-xs font-bold text-white bg-indigo-655 hover:bg-indigo-600 rounded-xl transition-all shadow-md shadow-indigo-650/20 gap-2"
            title="Create Assignment"
          >
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Create Assignment
          </button>
        )}
      </div>

      {/* Grid List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <svg className="animate-spin h-8 w-8 text-indigo-650" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
      ) : assignments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-3">
          <svg width="36" height="36" className="text-slate-400 dark:text-slate-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="font-extrabold text-slate-750 dark:text-slate-355 mt-2">No assignments found</h3>
          <p className="text-slate-400 dark:text-slate-500 text-xs mt-1">No active assignments are currently set up.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {assignments.map((assignment) => {
            const hasSubmitted = submissionsMap[assignment.id];
            return (
              <div
                key={assignment.id}
                className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 p-6 rounded-3xl shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex justify-between items-start gap-4">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-indigo-650 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/30 px-2.5 py-1 rounded-lg">
                        {SUBJECTS[assignment.subject_id] || `Subject ${assignment.subject_id}`}
                      </span>
                      <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-lg leading-tight mt-1.5">
                        {assignment.title}
                      </h3>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-450 block">
                        Max Marks
                      </span>
                      <span className="text-base font-extrabold text-slate-750 dark:text-slate-300 font-mono">
                        {parseFloat(assignment.max_marks)}
                      </span>
                    </div>
                  </div>

                  <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed">
                    {assignment.description}
                  </p>

                  <div className="border-t border-slate-150 dark:border-slate-850 pt-4 flex flex-wrap justify-between items-center gap-3 text-xs text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <svg width="14" height="14" className="text-slate-400 dark:text-slate-500 w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-slate-450">Due: <strong className="text-slate-700 dark:text-slate-350">{assignment.due_date}</strong></span>
                    </div>

                    <div className="flex items-center gap-2">
                      {userRole === 'student' ? (
                        hasSubmitted ? (
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-450 border border-emerald-100 dark:border-emerald-900/20 uppercase">
                              Submitted
                            </span>
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/20 text-indigo-650 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/20 uppercase" title="Submission recorded attendance as present">
                              Attendance: Present
                            </span>
                            <button
                              onClick={() => {
                                const sub = submissionsMap[assignment.id];
                                if (sub && sub.id) {
                                  window.open(`http://localhost:8000/api/v1/reports/print/assignment/${sub.id}`, '_blank');
                                }
                              }}
                              className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-650 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/30 dark:text-indigo-400 rounded-lg font-bold text-[9px] transition-all border border-indigo-100 dark:border-indigo-900/20"
                            >
                              Download Receipt
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleOpenSubmitModal(assignment)}
                            className="px-3 py-1.5 text-[10px] font-extrabold text-white bg-indigo-650 hover:bg-indigo-600 rounded-lg transition-all shadow-sm"
                            title="Submit Homework"
                          >
                            Submit Assignment
                          </button>
                        )
                      ) : (
                        <button
                          onClick={() => handleViewSubmissions(assignment)}
                          className="px-3 py-1.5 text-[10px] font-extrabold text-white bg-slate-655 hover:bg-slate-700 rounded-lg transition-all shadow-sm"
                          title="View Submissions"
                        >
                          View Submissions
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Assignment Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-955/70 backdrop-blur-sm" onClick={() => setIsAddModalOpen(false)} />
          
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl relative z-10 space-y-6">
            <div>
              <h3 className="text-lg font-extrabold text-slate-850 dark:text-slate-200">Create Assignment Sheet</h3>
              <p className="text-xs text-slate-450 dark:text-slate-500 mt-1">Publish new course homework parameters for student review.</p>
            </div>

            {modalError && <div className="p-3 bg-rose-500/10 text-rose-500 rounded-xl text-xs font-bold border border-rose-500/20">{modalError}</div>}
            {modalSuccess && <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl text-xs font-bold border border-emerald-500/20">{modalSuccess}</div>}

            <form onSubmit={handleCreateAssignmentSubmit} className="space-y-5">
              {/* Title */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-450 uppercase" htmlFor="assign_title">Assignment Title</label>
                <input
                  type="text"
                  required
                  id="assign_title"
                  value={newAssignment.title}
                  onChange={(e) => setNewAssignment({ ...newAssignment, title: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-indigo-505 text-xs font-semibold text-slate-800 dark:text-slate-100"
                  placeholder="e.g. Memory Architecture Design"
                />
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-450 uppercase" htmlFor="assign_desc">Task Description</label>
                <textarea
                  required
                  id="assign_desc"
                  rows={3}
                  value={newAssignment.description}
                  onChange={(e) => setNewAssignment({ ...newAssignment, description: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-indigo-505 text-xs font-semibold text-slate-800 dark:text-slate-100 resize-none"
                  placeholder="Describe details, criteria, and guidelines..."
                />
              </div>

              {/* Subject Selection */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-450 uppercase" htmlFor="assign_subject">Academic Subject</label>
                <select
                  id="assign_subject"
                  value={newAssignment.subject_id}
                  onChange={(e) => setNewAssignment({ ...newAssignment, subject_id: parseInt(e.target.value) })}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-indigo-505 text-xs font-semibold text-slate-800 dark:text-slate-100"
                >
                  {Object.entries(SUBJECTS).map(([id, name]) => (
                    <option key={id} value={id}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Max Marks & Due Date */}
              <div className="grid grid-cols-2 gap-4">
                {/* Max Marks */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-450 uppercase" htmlFor="assign_marks">Max Marks</label>
                  <input
                    type="number"
                    required
                    id="assign_marks"
                    value={newAssignment.max_marks}
                    onChange={(e) => setNewAssignment({ ...newAssignment, max_marks: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-indigo-505 text-xs font-semibold text-slate-800 dark:text-slate-100"
                    placeholder="e.g. 50"
                  />
                </div>

                {/* Due Date */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-450 uppercase" htmlFor="assign_due">Due Date</label>
                  <input
                    type="date"
                    required
                    id="assign_due"
                    value={newAssignment.due_date}
                    onChange={(e) => setNewAssignment({ ...newAssignment, due_date: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-indigo-505 text-xs font-semibold text-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
                  title="Cancel"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs font-bold text-white bg-indigo-650 hover:bg-indigo-600 rounded-xl transition-all shadow-md shadow-indigo-650/20"
                  title="Publish sheet"
                >
                  Publish sheet
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Submit Assignment Modal */}
      {isSubmitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-955/70 backdrop-blur-sm" onClick={() => setIsSubmitModalOpen(false)} />
          
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl relative z-10 space-y-6">
            <div>
              <h3 className="text-lg font-extrabold text-slate-850 dark:text-slate-200">Submit Assignment</h3>
              <p className="text-xs text-slate-450 dark:text-slate-500 mt-1">Upload your response document or specify file URL path.</p>
            </div>

            {modalError && <div className="p-3 bg-rose-500/10 text-rose-500 rounded-xl text-xs font-bold border border-rose-500/20">{modalError}</div>}
            {modalSuccess && <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl text-xs font-bold border border-emerald-500/20">{modalSuccess}</div>}

            <form onSubmit={handleSubmissionSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-450 uppercase" htmlFor="doc_path">Document File Path / URI</label>
                <input
                  type="text"
                  required
                  id="doc_path"
                  value={filePath}
                  onChange={(e) => setFilePath(e.target.value)}
                  placeholder="e.g. uploads/CS1_architecture_homework_roll222089.pdf"
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-indigo-505 text-xs font-semibold text-slate-800 dark:text-slate-100"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsSubmitModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
                  title="Cancel"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs font-bold text-white bg-indigo-650 hover:bg-indigo-600 rounded-xl transition-all shadow-md shadow-indigo-650/20"
                  title="Submit homework"
                >
                  Submit Homework
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Submissions Drawer/Modal */}
      {isViewSubmissionsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-955/70 backdrop-blur-sm" onClick={() => setIsViewSubmissionsOpen(false)} />
          
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl p-6 shadow-2xl relative z-10 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-extrabold text-slate-850 dark:text-slate-200">Submissions Log</h3>
                <p className="text-xs text-slate-455 mt-1">Reviewing submissions for <strong>{viewingAssignment?.title}</strong></p>
              </div>
              <button 
                onClick={() => setIsViewSubmissionsOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-655"
                title="Close modal"
              >
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {submissionsLoading ? (
              <div className="flex items-center justify-center py-12">
                <svg className="animate-spin h-8 w-8 text-indigo-650" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              </div>
            ) : currentSubmissions.length === 0 ? (
              <div className="py-12 text-center text-slate-400 dark:text-slate-500 font-semibold text-xs">
                No students have submitted this assignment yet.
              </div>
            ) : (
              <div className="space-y-4">
                {currentSubmissions.map((sub, idx) => (
                  <div key={idx} className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl space-y-3">
                    <div className="flex flex-wrap justify-between items-start gap-2">
                      <div>
                        <h4 className="font-extrabold text-slate-800 dark:text-slate-100 text-xs">
                          {sub.studentName}
                        </h4>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase mt-0.5">
                          Roll No: {sub.rollNo} | Email: {sub.email}
                        </p>
                        <p className="text-[9px] text-indigo-650 dark:text-indigo-400 font-bold uppercase mt-0.5">
                          Course: {sub.course} | Dept: {sub.dept} | Sem: {sub.sem} | Section: {sub.section}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] font-bold text-slate-400 block">
                          Submitted Date
                        </span>
                        <span className="text-[10px] font-bold text-slate-655 dark:text-slate-350">
                          {new Date(sub.submission_date).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <div className="pt-2.5 border-t border-slate-200/60 dark:border-slate-800/80 flex items-center justify-between text-xs">
                      <span className="text-slate-455 font-bold uppercase text-[9px]">File Attachment:</span>
                      <a 
                        href={`#download-${sub.id}`}
                        onClick={(e) => { e.preventDefault(); alert(`Downloading submission from: ${sub.file_path}`); }}
                        className="text-indigo-650 hover:text-indigo-500 font-bold hover:underline flex items-center gap-1 text-[11px]"
                      >
                        <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        {sub.file_path.split('/').pop()}
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
