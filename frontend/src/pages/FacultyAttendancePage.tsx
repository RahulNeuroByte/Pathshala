import React, { useEffect, useState } from 'react';
import { useUser } from '../context/UserContext';
import {
  attendanceService,
  studentService,
  masterDataService
} from '../services/api';

interface StaffAttendanceItem {
  id: number;
  date: string;
  status: string;
}

interface PendingStaffItem {
  id: number;
  date: string;
  status: string;
  staff_name: string;
  employee_id: string;
  role: string;
}

interface StudentItem {
  id: number;
  first_name: string;
  last_name: string;
  roll_no: string;
  course_id: number;
  current_semester: number;
  section: string;
}

interface SubjectItem {
  id: number;
  name: string;
  code: string;
  course_id: number;
}

interface CourseItem {
  id: number;
  name: string;
  code: string;
}

export default function FacultyAttendancePage() {
  const { role } = useUser();
  
  // State for Staff Self-Attendance
  const [myLogs, setMyLogs] = useState<StaffAttendanceItem[]>([]);
  const [checkInDate, setCheckInDate] = useState<string>(
    new Date().toISOString().substring(0, 10)
  );
  
  // State for Principal Approvals
  const [pendingApprovals, setPendingApprovals] = useState<PendingStaffItem[]>([]);
  
  // State for Student Marking
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<number>(0);
  const [selectedSemester, setSelectedSemester] = useState<number>(1);
  const [selectedSubject, setSelectedSubject] = useState<number>(0);
  const [markingDate, setMarkingDate] = useState<string>(
    new Date().toISOString().substring(0, 10)
  );
  const [studentStatusMap, setStudentStatusMap] = useState<Record<number, string>>({});
  
  // General UI States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Auto-clear messages
  useEffect(() => {
    let timer: any = null;
    if (successMessage || error) {
      timer = setTimeout(() => {
        setSuccessMessage('');
        setError('');
      }, 5000);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [successMessage, error]);

  // Load Initial Data
  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Load own staff logs if role is not student
      if (role !== 'student') {
        const myLogsRes = await attendanceService.getMyStaffAttendance();
        setMyLogs(myLogsRes.data || []);
      }

      // 2. Load Principal panel data
      if (role === 'principal') {
        const pendingRes = await attendanceService.getPendingStaffAttendance();
        setPendingApprovals(pendingRes.data || []);
      }

      // 3. Load Courses, Subjects, Students for Student marking (visible to faculty, class counsellor, principal, admin)
      if (['faculty', 'class_counsellor', 'principal', 'admin', 'hod'].includes(role || '')) {
        const coursesRes = await masterDataService.getCourses();
        const subjectsRes = await masterDataService.getSubjects();
        const studentsRes = await studentService.getStudents();
        
        setCourses(coursesRes.data || []);
        setSubjects(subjectsRes.data || []);
        setStudents(studentsRes.data || []);

        if (coursesRes.data?.length > 0) {
          setSelectedCourse(coursesRes.data[0].id);
        }
      }
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed to load attendance portal data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [role]);

  // Filter subjects based on selected course
  const filteredSubjects = subjects.filter(
    (sub) => sub.course_id === Number(selectedCourse)
  );

  useEffect(() => {
    if (filteredSubjects.length > 0) {
      setSelectedSubject(filteredSubjects[0].id);
    } else {
      setSelectedSubject(0);
    }
  }, [selectedCourse, subjects]);

  // Filter students based on selected course and semester
  const filteredStudents = students.filter(
    (stu) =>
      stu.course_id === Number(selectedCourse) &&
      stu.current_semester === Number(selectedSemester)
  );

  // Initialize studentStatusMap when filteredStudents list changes
  useEffect(() => {
    const initialMap: Record<number, string> = {};
    filteredStudents.forEach((stu) => {
      initialMap[stu.id] = 'Present'; // Default status is Present
    });
    setStudentStatusMap(initialMap);
  }, [selectedCourse, selectedSemester, students]);

  // Helper to verify weekend date
  const isDateWeekend = (dateStr: string) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    const day = d.getDay(); // 0 = Sunday, 6 = Saturday
    return day === 0 || day === 6;
  };

  // Staff self check-in handler
  const handleStaffCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isDateWeekend(checkInDate)) {
      setError('Cannot mark staff check-in on Saturday or Sunday weekend holidays.');
      return;
    }
    try {
      setLoading(true);
      await attendanceService.markMyStaffAttendance({ date: checkInDate });
      setSuccessMessage('Attendance request registered successfully!');
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to submit check-in request');
    } finally {
      setLoading(false);
    }
  };

  // Principal approval actions
  const handleApproveStaff = async (id: number) => {
    try {
      await attendanceService.approveStaffAttendance(id);
      setSuccessMessage('Staff attendance record APPROVED.');
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to approve request');
    }
  };

  const handleRejectStaff = async (id: number) => {
    try {
      await attendanceService.rejectStaffAttendance(id);
      setSuccessMessage('Staff attendance record REJECTED/ABSENT.');
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to reject request');
    }
  };

  // Student Attendance Submit
  const handleStudentAttendanceSubmit = async () => {
    if (isDateWeekend(markingDate)) {
      setError('Cannot log student class attendance on weekend holidays (Saturday or Sunday).');
      return;
    }
    if (!selectedSubject) {
      setError('Please select a valid subject before saving.');
      return;
    }
    if (filteredStudents.length === 0) {
      setError('No students exist in the selected batch/semester.');
      return;
    }

    try {
      setLoading(true);
      const studentPayload = Object.entries(studentStatusMap).map(([id, status]) => ({
        student_id: Number(id),
        status
      }));

      await attendanceService.markStudentAttendance({
        subject_id: Number(selectedSubject),
        date: markingDate,
        students: studentPayload
      });

      setSuccessMessage('Student class attendance sheet saved successfully!');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to log student attendance sheet');
    } finally {
      setLoading(false);
    }
  };

  const toggleStudentStatus = (id: number) => {
    setStudentStatusMap((prev) => ({
      ...prev,
      [id]: prev[id] === 'Present' ? 'Absent' : 'Present'
    }));
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="border-b border-slate-200/80 dark:border-slate-800/80 pb-5">
        <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Attendance Portal & Sheets
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-450 mt-0.5">
          Mark and manage daily check-ins for students and staff
        </p>
      </div>

      {/* Success/Error Alerts */}
      {successMessage && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 rounded-xl border border-emerald-100 dark:border-emerald-900/40 text-xs font-bold transition-all">
          {successMessage}
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 rounded-xl border border-rose-100 dark:border-rose-900/40 text-xs font-bold transition-all">
          {error}
        </div>
      )}

      {/* Staff Self-Attendance Section */}
      {role !== 'student' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Mark My Attendance Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 p-6 rounded-3xl shadow-sm space-y-6 transition-colors duration-300">
            <div>
              <h3 className="font-extrabold text-slate-850 dark:text-slate-200 text-base">Mark My Daily Attendance</h3>
              <p className="text-xs text-slate-450 mt-0.5">Log your presence request. Principals approve Faculty & HOD check-ins.</p>
            </div>

            <form onSubmit={handleStaffCheckIn} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  Check-in Date
                </label>
                <input
                  type="date"
                  value={checkInDate}
                  onChange={(e) => setCheckInDate(e.target.value)}
                  className="block w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-755 dark:text-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {isDateWeekend(checkInDate) && (
                <div className="p-3 bg-slate-100 dark:bg-slate-800/60 rounded-xl text-[10px] font-bold text-slate-400 border border-slate-200 dark:border-slate-700/50">
                  ⚠️ Saturday & Sunday are weekend holidays. No check-ins are allowed.
                </div>
              )}

              <button
                type="submit"
                disabled={loading || isDateWeekend(checkInDate)}
                className="w-full py-2.5 bg-indigo-650 hover:bg-indigo-600 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
              >
                Submit Check-in Request
              </button>
            </form>
          </div>

          {/* My Attendance Log History */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 p-6 rounded-3xl shadow-sm space-y-6 transition-colors duration-300">
            <div>
              <h3 className="font-extrabold text-slate-850 dark:text-slate-200 text-base">My Check-in Log History</h3>
              <p className="text-xs text-slate-450 mt-0.5">Chronological record of your submitted attendance logs</p>
            </div>

            <div className="overflow-x-auto max-h-[220px] overflow-y-auto">
              <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-850 text-left">
                <thead className="bg-slate-50/60 dark:bg-slate-950/40 border-b border-slate-100 dark:border-slate-800/80 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Date</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs text-slate-700 dark:text-slate-350">
                  {myLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/20 transition-colors">
                      <td className="px-4 py-3 font-bold text-slate-500 dark:text-slate-450">{log.date}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-extrabold uppercase ${
                          log.status === 'Present'
                            ? 'bg-emerald-500/10 text-emerald-500'
                            : log.status === 'Pending'
                            ? 'bg-amber-500/10 text-amber-500'
                            : 'bg-rose-500/10 text-rose-500'
                        }`}>
                          {log.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {myLogs.length === 0 && (
                    <tr>
                      <td colSpan={2} className="px-4 py-8 text-center text-slate-400 italic">No check-in logs found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Principal Approvals Management Panel */}
      {role === 'principal' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 p-6 rounded-3xl shadow-sm space-y-6 transition-colors duration-300">
          <div>
            <h3 className="font-extrabold text-slate-850 dark:text-slate-200 text-base">Pending Staff Attendance Approvals</h3>
            <p className="text-xs text-slate-450 mt-0.5">Review and authorize daily attendance for Faculty and HODs</p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-850 text-left">
              <thead className="bg-slate-50/60 dark:bg-slate-950/40 border-b border-slate-100 dark:border-slate-800/80">
                <tr>
                  <th className="px-4 py-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Staff Name</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Role/Designation</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Emp ID</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs text-slate-700 dark:text-slate-350">
                {pendingApprovals.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/20 transition-colors">
                    <td className="px-4 py-3 font-bold text-slate-500 dark:text-slate-450">{item.date}</td>
                    <td className="px-4 py-3 font-extrabold text-slate-850 dark:text-slate-205">{item.staff_name}</td>
                    <td className="px-4 py-3 text-slate-450">{item.role}</td>
                    <td className="px-4 py-3 font-mono">{item.employee_id}</td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <button
                        onClick={() => handleApproveStaff(item.id)}
                        className="px-2.5 py-1 text-[10px] font-extrabold uppercase rounded bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border border-emerald-500/20"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleRejectStaff(item.id)}
                        className="px-2.5 py-1 text-[10px] font-extrabold uppercase rounded bg-rose-500/10 text-rose-550 hover:bg-rose-500/20 border border-rose-500/20"
                      >
                        Reject
                      </button>
                    </td>
                  </tr>
                ))}
                {pendingApprovals.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-400 italic">No pending staff check-ins waiting approval.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Student Attendance Marking Section */}
      {['faculty', 'class_counsellor', 'principal', 'admin', 'hod'].includes(role || '') && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 p-6 rounded-3xl shadow-sm space-y-6 transition-colors duration-300">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 dark:border-slate-800/80 pb-4">
            <div>
              <h3 className="font-extrabold text-slate-850 dark:text-slate-200 text-base font-black">Student Attendance Marker</h3>
              <p className="text-xs text-slate-450 mt-0.5">Select a class batch and subject to log student attendance status</p>
            </div>
            
            <button
              onClick={handleStudentAttendanceSubmit}
              disabled={loading || isDateWeekend(markingDate) || filteredStudents.length === 0}
              className="px-5 py-2.5 bg-indigo-650 hover:bg-indigo-600 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-2"
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Save Attendance Sheet
            </button>
          </div>

          {/* Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Select Course
              </label>
              <select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(Number(e.target.value))}
                className="block w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-700 dark:text-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Select Semester
              </label>
              <select
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(Number(e.target.value))}
                className="block w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-700 dark:text-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                  <option key={sem} value={sem}>Semester {sem}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Select Subject
              </label>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(Number(e.target.value))}
                className="block w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-700 dark:text-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value={0}>-- Choose Subject --</option>
                {filteredSubjects.map((s) => (
                  <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Marking Date
              </label>
              <input
                type="date"
                value={markingDate}
                onChange={(e) => setMarkingDate(e.target.value)}
                className="block w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-700 dark:text-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {isDateWeekend(markingDate) && (
            <div className="p-4 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-450 border border-rose-100 dark:border-rose-900/40 rounded-2xl text-xs font-bold">
              ⚠️ Selected marking date falls on a Saturday or Sunday weekend holiday. Log submission is disabled.
            </div>
          )}

          {/* Student Grid */}
          <div className="border border-slate-100 dark:border-slate-850 rounded-2xl overflow-hidden">
            <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-850 text-left">
              <thead className="bg-slate-50/60 dark:bg-slate-950/40 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-3.5">Roll Number</th>
                  <th className="px-6 py-3.5">Student Name</th>
                  <th className="px-6 py-3.5">Section</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Quick Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs text-slate-750 dark:text-slate-350">
                {filteredStudents.map((student) => {
                  const status = studentStatusMap[student.id] || 'Present';
                  return (
                    <tr key={student.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/20 transition-all duration-150">
                      <td className="px-6 py-4 font-bold text-slate-450">{student.roll_no}</td>
                      <td className="px-6 py-4 font-extrabold text-slate-850 dark:text-slate-200">
                        {student.first_name} {student.last_name}
                      </td>
                      <td className="px-6 py-4 font-bold uppercase">{student.section}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg border text-[10px] font-black uppercase ${
                          status === 'Present'
                            ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/25'
                            : 'bg-rose-500/10 text-rose-500 border-rose-500/25'
                        }`}>
                          {status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => toggleStudentStatus(student.id)}
                          disabled={isDateWeekend(markingDate)}
                          className={`px-3 py-1.5 rounded-lg border text-[10px] font-extrabold uppercase transition-all ${
                            status === 'Present'
                              ? 'border-rose-500/20 bg-rose-500/5 text-rose-500 hover:bg-rose-500/10'
                              : 'border-emerald-500/20 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10'
                          }`}
                        >
                          Mark {status === 'Present' ? 'Absent' : 'Present'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {filteredStudents.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">
                      No students found registered for Course ID {selectedCourse} / Sem {selectedSemester}.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
