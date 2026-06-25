import React, { useEffect, useState } from 'react';
import api, { studentService } from '../services/api';
import { useUser } from '../context/UserContext';
import { generatePDFReport } from '../utils/pdfGenerator';

export default function StudentPage() {
  const { role } = useUser();
  const [students, setStudents] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentUserProfile, setCurrentUserProfile] = useState<any>(null);
  
  // Selection barrier states
  const [tempCourseId, setTempCourseId] = useState('');
  const [tempDeptId, setTempDeptId] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [selectedDeptId, setSelectedDeptId] = useState('');
  const [isCohortSelected, setIsCohortSelected] = useState(false);
  const [directRollNo, setDirectRollNo] = useState('');
  const [filterSem, setFilterSem] = useState('');
  const [filterSec, setFilterSec] = useState('');

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentStudent, setCurrentStudent] = useState<any>(null);
  
  const [newStudent, setNewStudent] = useState<any>({
    username: '',
    password: '',
    first_name: '',
    last_name: '',
    roll_no: '',
    enrollment_no: '',
    dept_id: '',
    course_id: '',
    current_semester: 1,
    batch: new Date().getFullYear().toString(),
    personal_email: '',
    alternative_phone: '',
    father_name: '',
    father_occupation: '',
    mother_name: '',
    mother_occupation: '',
    permanent_address: '',
    current_address: '',
    blood_group: 'O+',
    section: 'A',
    phone: '',
    gender: 'Male',
    dob: ''
  });

  const [modalSuccess, setModalSuccess] = useState('');
  const [modalError, setModalError] = useState('');

  const loadInitialData = async () => {
    try {
      const [studentsRes, deptsRes, coursesRes, meRes] = await Promise.all([
        studentService.getStudents(),
        api.get('/departments'),
        api.get('/courses'),
        api.get('/users/me')
      ]);
      const depts = deptsRes.data || [];
      const crs = coursesRes.data || [];
      setStudents(studentsRes.data || []);
      setDepartments(depts);
      setCourses(crs);
      
      const uProfile = meRes.data;
      setCurrentUserProfile(uProfile);
      
      if (depts.length > 0) {
        setTempDeptId(depts[0].id.toString());
        setNewStudent((prev: any) => ({ ...prev, dept_id: depts[0].id }));
      }
      if (crs.length > 0) {
        setTempCourseId(crs[0].id.toString());
        setNewStudent((prev: any) => ({ ...prev, course_id: crs[0].id }));
      }

      if (uProfile) {
        if (role === 'class_counsellor' && uProfile.course_id && uProfile.dept_id) {
          setTempCourseId(uProfile.course_id.toString());
          setTempDeptId(uProfile.dept_id.toString());
          setSelectedCourseId(uProfile.course_id.toString());
          setSelectedDeptId(uProfile.dept_id.toString());
          setFilterSem(uProfile.current_semester ? uProfile.current_semester.toString() : '1');
          setFilterSec(uProfile.section || 'A');
          setIsCohortSelected(true);
        } else if (role === 'hod' && uProfile.dept_id) {
          setTempDeptId(uProfile.dept_id.toString());
          setSelectedDeptId(uProfile.dept_id.toString());
          
          // Pre-fill department for the new student
          setNewStudent((prev: any) => ({ ...prev, dept_id: uProfile.dept_id }));
        }
      }
    } catch (error) {
      console.error('Failed to load initial data in StudentPage', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const getDeptName = (id: number) => {
    const dept = departments.find(d => d.id === id);
    return dept ? dept.name : `Dept ${id}`;
  };

  const getCourseName = (id: number) => {
    const course = courses.find(c => c.id === id);
    return course ? course.name : `Course ${id}`;
  };

  // Filter students based on selection and search
  const filteredStudents = students.filter((student) => {
    const nameMatch = `${student.first_name} ${student.last_name}`.toLowerCase().includes(searchTerm.toLowerCase());
    const rollMatch = student.roll_no.toLowerCase().includes(searchTerm.toLowerCase());
    const enrollMatch = student.enrollment_no.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSearch = nameMatch || rollMatch || enrollMatch;
    
    // Cohort barrier filtering
    const matchesDept = student.dept_id.toString() === selectedDeptId;
    const matchesCourse = student.course_id.toString() === selectedCourseId;
    const matchesSem = filterSem === '' || student.current_semester.toString() === filterSem;
    const matchesSec = filterSec === '' || student.section.toLowerCase() === filterSec.toLowerCase();

    return matchesSearch && matchesDept && matchesCourse && matchesSem && matchesSec;
  });

  const handleApplyBarrier = (e: React.FormEvent) => {
    e.preventDefault();
    if (tempCourseId && tempDeptId) {
      setSelectedCourseId(tempCourseId);
      setSelectedDeptId(tempDeptId);
      setIsCohortSelected(true);
    }
  };

  const handleDirectRollSearch = () => {
    if (!directRollNo.trim()) {
      alert("Please enter a roll number.");
      return;
    }
    const matched = students.find(
      (s) => s.roll_no.trim().toLowerCase() === directRollNo.trim().toLowerCase()
    );
    if (matched) {
      if (role === 'class_counsellor') {
        const uProfile = currentUserProfile;
        if (
          matched.course_id !== uProfile?.course_id ||
          matched.current_semester !== uProfile?.current_semester ||
          matched.section !== uProfile?.section
        ) {
          alert("Access Denied: You can only look up students in your assigned section.");
          return;
        }
      } else if (role === 'hod') {
        if (matched.dept_id !== currentUserProfile?.dept_id) {
          alert("Access Denied: You can only look up students in your department.");
          return;
        }
      }

      setSelectedCourseId(matched.course_id.toString());
      setSelectedDeptId(matched.dept_id.toString());
      setFilterSem(matched.current_semester.toString());
      setFilterSec(matched.section);
      setSearchTerm(matched.roll_no);
      setIsCohortSelected(true);
    } else {
      alert(`Student with Roll No "${directRollNo}" not found in database.`);
    }
  };

  const handleDownloadPDF = () => {
    const headers = [['Full Name', 'Roll No', 'Enrollment No', 'Department', 'Course', 'Sem/Sec']];
    const rows = filteredStudents.map((s) => [
      `${s.first_name} ${s.last_name}`,
      s.roll_no,
      s.enrollment_no,
      getDeptName(s.dept_id),
      getCourseName(s.course_id),
      `Sem ${s.current_semester} - ${s.section}`
    ]);

    generatePDFReport(
      'Student Academic Directory',
      {
        'Academic Year': '2026-27',
        'Course': getCourseName(parseInt(selectedCourseId)),
        'Department': getDeptName(parseInt(selectedDeptId)),
        'Profile Status': 'Active',
      },
      headers,
      rows,
      'student_directory.pdf'
    );
  };

  const handleAddStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError('');
    setModalSuccess('');
    
    try {
      const res = await studentService.createStudent(newStudent);
      setStudents([res.data, ...students]);
      setModalSuccess('Student profile enrolled successfully! Access details sent.');
      setTimeout(() => {
        setIsAddModalOpen(false);
        setModalSuccess('');
        setNewStudent({
          username: '',
          password: '',
          first_name: '',
          last_name: '',
          roll_no: '',
          enrollment_no: '',
          dept_id: departments[0]?.id || '',
          course_id: courses[0]?.id || '',
          current_semester: 1,
          batch: new Date().getFullYear().toString(),
          personal_email: '',
          alternative_phone: '',
          father_name: '',
          father_occupation: '',
          mother_name: '',
          mother_occupation: '',
          permanent_address: '',
          current_address: '',
          blood_group: 'O+',
          section: 'A',
          phone: '',
          gender: 'Male',
          dob: ''
        });
      }, 1500);
    } catch (err: any) {
      setModalError(err.response?.data?.detail || 'Failed to enroll student profile.');
    }
  };

  const handleDeleteStudent = async (id: number) => {
    if (window.confirm('Are you sure you want to permanently delete this student profile?')) {
      try {
        await studentService.deleteStudent(id);
        setStudents(students.filter(student => student.id !== id));
      } catch (err: any) {
        alert(err.response?.data?.detail || 'Failed to remove student profile.');
      }
    }
  };

  const handleEditClick = (student: any) => {
    setCurrentStudent({ ...student });
    setModalError('');
    setModalSuccess('');
    setIsEditModalOpen(true);
  };

  const handleEditStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError('');
    setModalSuccess('');
    
    try {
      const res = await studentService.updateStudent(currentStudent.id, currentStudent);
      setStudents(students.map(s => s.id === currentStudent.id ? res.data : s));
      setModalSuccess('Student profile details saved.');
      setTimeout(() => {
        setIsEditModalOpen(false);
        setModalSuccess('');
        setCurrentStudent(null);
      }, 1500);
    } catch (err: any) {
      setModalError(err.response?.data?.detail || 'Failed to update student profile.');
    }
  };

  // Check roles permissions
  const canModify = role === 'admin' || role === 'principal' || role === 'hod' || role === 'class_counsellor';
  const canEdit = role === 'admin' || role === 'principal' || role === 'hod' || role === 'class_counsellor';

  return (
    <div className="space-y-6 max-w-7xl mx-auto relative">
      
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">Student Workspace</h1>
          <p className="text-slate-400 dark:text-slate-500 text-xs mt-1">
            Search, filter, and enroll new students in academic cohorts.
          </p>
        </div>
        
        {/* Enroll Button */}
        {canModify && (
          <button
            onClick={() => {
              setModalError('');
              setModalSuccess('');
              const baseDeptId = currentUserProfile?.dept_id || (departments[0]?.id || '');
              const baseCourseId = currentUserProfile?.course_id || (courses[0]?.id || '');
              const baseSem = currentUserProfile?.current_semester || 1;
              const baseSec = currentUserProfile?.section || 'A';
              
              setNewStudent({
                username: '',
                password: '',
                first_name: '',
                last_name: '',
                roll_no: '',
                enrollment_no: '',
                dept_id: baseDeptId,
                course_id: baseCourseId,
                current_semester: baseSem,
                batch: new Date().getFullYear().toString(),
                personal_email: '',
                alternative_phone: '',
                father_name: '',
                father_occupation: '',
                mother_name: '',
                mother_occupation: '',
                permanent_address: '',
                current_address: '',
                blood_group: 'O+',
                section: baseSec,
                phone: '',
                gender: 'Male',
                dob: ''
              });
              setIsAddModalOpen(true);
            }}
            className="flex items-center justify-center px-4 py-2.5 text-xs font-bold text-white bg-indigo-655 hover:bg-indigo-600 rounded-xl transition-all shadow-md shadow-indigo-650/20 gap-2"
            title="Enroll Student"
          >
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Enroll Student
          </button>
        )}
      </div>

      {!isCohortSelected ? (
        /* Selector Barrier Card */
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 p-8 rounded-3xl shadow-lg max-w-xl mx-auto space-y-6 transition-all duration-300">
          <div className="text-center space-y-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-500/10 text-amber-600 dark:text-amber-400 tracking-wider">
              Verification Barrier
            </span>
            <h3 className="text-lg font-black text-slate-850 dark:text-slate-100">Target Cohort Selection Required</h3>
            <p className="text-xs text-slate-450 dark:text-slate-500 max-w-md mx-auto leading-relaxed">
              To verify student detail credentials, you must first select an academic course and department stream, or directly search by Roll Number.
            </p>
          </div>

          <form onSubmit={handleApplyBarrier} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider" htmlFor="cohort_course">
                Select Course
              </label>
              <select
                required
                id="cohort_course"
                value={tempCourseId}
                onChange={(e) => setTempCourseId(e.target.value)}
                className="block w-full px-4 py-3 bg-slate-50 dark:bg-slate-955 border border-slate-250 dark:border-slate-800 rounded-xl text-slate-750 dark:text-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">-- Choose Course --</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider" htmlFor="cohort_dept">
                Select Department
              </label>
              <select
                required
                id="cohort_dept"
                value={tempDeptId}
                onChange={(e) => setTempDeptId(e.target.value)}
                disabled={role === 'hod' || role === 'class_counsellor'}
                className="block w-full px-4 py-3 bg-slate-50 dark:bg-slate-955 border border-slate-250 dark:border-slate-800 rounded-xl text-slate-750 dark:text-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
              >
                <option value="">-- Choose Department --</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="w-full mt-2 py-3 px-4 border border-transparent text-xs font-bold rounded-xl text-white bg-indigo-650 hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20"
              title="Access Cohort Directories"
            >
              <span>Access Cohort Directories</span>
              <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </form>

          <div className="relative flex items-center justify-center my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200 dark:border-slate-800"></div>
            </div>
            <span className="relative px-3 text-[10px] font-extrabold uppercase bg-white dark:bg-slate-900 text-slate-400 tracking-wider">
              OR Access Globally
            </span>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider" htmlFor="direct_roll_no">
              Direct Roll No Lookup
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                id="direct_roll_no"
                placeholder="e.g. 222089"
                value={directRollNo}
                onChange={(e) => setDirectRollNo(e.target.value)}
                className="block w-full px-4 py-3 bg-slate-50 dark:bg-slate-955 border border-slate-250 dark:border-slate-800 rounded-xl text-slate-750 dark:text-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="button"
                onClick={handleDirectRollSearch}
                className="py-3 px-5 text-xs font-bold rounded-xl text-white bg-emerald-600 hover:bg-emerald-500 transition-all whitespace-nowrap shadow-md"
              >
                Lookup Roll No
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Unlocked student directory panel */
        <>
          {/* Stats Summary Panel */}
          <div className={`grid grid-cols-1 gap-5 ${role === 'class_counsellor' ? 'sm:grid-cols-3' : 'sm:grid-cols-4'}`}>
            <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/80 p-5 rounded-2xl shadow-sm space-y-1">
              <p className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Current Course</p>
              <p className="text-sm font-black text-slate-800 dark:text-slate-200">{getCourseName(parseInt(selectedCourseId))}</p>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/80 p-5 rounded-2xl shadow-sm space-y-1">
              <p className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Current Department</p>
              <p className="text-sm font-black text-slate-800 dark:text-slate-200">{getDeptName(parseInt(selectedDeptId))}</p>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/80 p-5 rounded-2xl shadow-sm space-y-1">
              <p className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Cohort Size</p>
              <p className="text-lg font-black text-slate-850 dark:text-slate-150">{filteredStudents.length} Profiles</p>
            </div>
            {role !== 'class_counsellor' && (
              <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/80 p-5 rounded-2xl shadow-sm flex items-center justify-center">
                <button
                  onClick={() => setIsCohortSelected(false)}
                  className="text-xs font-bold text-indigo-650 dark:text-indigo-400 hover:underline"
                >
                  Change Cohort Selection
                </button>
              </div>
            )}
          </div>

          {/* Filter Toolbar */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 p-4.5 rounded-2xl shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between transition-colors">
            {/* Search */}
            <div className="relative w-full md:max-w-xs">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 dark:text-slate-500">
                <svg width="20" height="20" className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input
                type="text"
                placeholder="Search student directories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-9 pr-4 py-2.5 bg-slate-55 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl placeholder-slate-400 text-slate-750 dark:text-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                title="Search Student"
              />
            </div>

            {/* Semester and Section Filters */}
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <select
                value={filterSem}
                onChange={(e) => setFilterSem(e.target.value)}
                className="px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-750 dark:text-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                title="Filter Semester"
              >
                <option value="">All Semesters</option>
                <option value="1">Semester 1</option>
                <option value="2">Semester 2</option>
                <option value="3">Semester 3</option>
                <option value="4">Semester 4</option>
                <option value="5">Semester 5</option>
                <option value="6">Semester 6</option>
                <option value="7">Semester 7</option>
                <option value="8">Semester 8</option>
              </select>

              <select
                value={filterSec}
                onChange={(e) => setFilterSec(e.target.value)}
                className="px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-750 dark:text-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                title="Filter Section"
              >
                <option value="">All Sections</option>
                <option value="A">Section A</option>
                <option value="B">Section B</option>
                <option value="C">Section C</option>
                <option value="D">Section D</option>
              </select>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 w-full md:w-auto justify-end">
              <button
                onClick={handleDownloadPDF}
                disabled={filteredStudents.length === 0}
                className={`flex items-center justify-center px-4 py-2 text-xs font-bold text-white rounded-xl transition-all shadow-md gap-2 border border-indigo-500/10 ${
                  filteredStudents.length === 0
                    ? 'bg-slate-300 dark:bg-slate-800 text-slate-400 cursor-not-allowed shadow-none'
                    : 'bg-indigo-650 hover:bg-indigo-500 shadow-indigo-650/20'
                }`}
                title="Download List PDF"
              >
                <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download List PDF
              </button>
            </div>
          </div>

          {/* Data Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-3xl shadow-sm overflow-hidden transition-colors">
            {loading ? (
              <div className="flex items-center justify-center py-24">
                <div className="flex flex-col items-center gap-4">
                  <svg width="32" height="32" className="animate-spin text-indigo-650" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Syncing directory logs...</span>
                </div>
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-850 text-slate-400 dark:text-slate-500 border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-center">
                  <svg width="32" height="32" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <div className="space-y-1">
                  <h3 className="font-extrabold text-slate-750 dark:text-slate-300 text-sm">No matching profiles found</h3>
                  <p className="text-slate-455 dark:text-slate-500 text-xs max-w-xs leading-relaxed">
                    Try adjusting your search query.
                  </p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800/80 text-left">
                  <thead className="bg-slate-50/60 dark:bg-slate-955/40 border-b border-slate-100 dark:border-slate-800/80">
                    <tr>
                      <th className="px-6 py-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                        Full Profile Name
                      </th>
                      <th className="px-6 py-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                        Roll No
                      </th>
                      <th className="px-6 py-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                        Enrollment No
                      </th>
                      <th className="px-6 py-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                        Department
                      </th>
                      <th className="px-6 py-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                        Academic Course
                      </th>
                      {canEdit && (
                        <th className="px-6 py-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-right">
                          Actions
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 bg-white dark:bg-slate-900 transition-colors">
                    {filteredStudents.map((student) => (
                      <tr key={student.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-850/30 transition-colors">
                        <td className="px-6 py-4.5 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-xl bg-indigo-50 dark:bg-indigo-955/30 text-indigo-650 dark:text-indigo-400 font-bold text-xs flex items-center justify-center border border-indigo-100 dark:border-indigo-900/30">
                              {student.first_name[0]}
                              {student.last_name[0]}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-755 dark:text-slate-200">
                                {student.first_name} {student.last_name}
                              </p>
                              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                Sec {student.section} | Sem {student.current_semester}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4.5 whitespace-nowrap text-xs font-semibold text-slate-500 dark:text-slate-400">
                          {student.roll_no}
                        </td>
                        <td className="px-6 py-4.5 whitespace-nowrap text-xs text-slate-400 dark:text-slate-500 font-mono">
                          {student.enrollment_no}
                        </td>
                        <td className="px-6 py-4.5 whitespace-nowrap text-xs">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-lg font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-355 border border-slate-200 dark:border-slate-700/50">
                            {getDeptName(student.dept_id)}
                          </span>
                        </td>
                        <td className="px-6 py-4.5 whitespace-nowrap text-xs text-slate-600 dark:text-slate-400 font-semibold">
                          {getCourseName(student.course_id)}
                        </td>
                        {canEdit && (
                          <td className="px-6 py-4.5 whitespace-nowrap text-right text-xs font-bold space-x-1.5">
                            <button
                              onClick={() => handleEditClick(student)}
                              className="px-2.5 py-1.5 text-indigo-600 hover:text-indigo-700 bg-indigo-50 dark:bg-indigo-950/50 dark:text-indigo-400 dark:hover:text-indigo-300 rounded-lg transition-all"
                              title="Edit details"
                            >
                              Rename/Edit
                            </button>
                            {canModify && (
                              <button
                                onClick={() => handleDeleteStudent(student.id)}
                                className="px-2.5 py-1.5 text-rose-600 hover:text-rose-700 bg-rose-50 dark:bg-rose-955/50 dark:text-rose-450 dark:hover:text-rose-350 rounded-lg transition-all"
                                title="Delete profile"
                              >
                                Remove
                              </button>
                            )}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* Floating Labels Enrollment Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={() => setIsAddModalOpen(false)} />
          
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl p-6 shadow-2xl relative z-10 space-y-6 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
            <div>
              <h3 className="text-lg font-extrabold text-slate-850 dark:text-slate-200">Enroll Student Profile</h3>
              <p className="text-xs text-slate-455 dark:text-slate-500 mt-1">Input details to provision a student account credentials.</p>
            </div>

            {modalError && <div className="p-3 bg-rose-500/10 text-rose-500 rounded-xl text-xs font-bold border border-rose-500/20">{modalError}</div>}
            {modalSuccess && <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl text-xs font-bold border border-emerald-500/20">{modalSuccess}</div>}

            <form onSubmit={handleAddStudentSubmit} className="space-y-6">
              
              {/* Account Credentials */}
              <div className="space-y-4">
                <h4 className="text-xs font-extrabold text-indigo-650 dark:text-indigo-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-1.5">
                  1. Login Credentials
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-450 uppercase" htmlFor="student_username">Login Username</label>
                    <input
                      type="text" required id="student_username"
                      value={newStudent.username}
                      onChange={(e) => setNewStudent({ ...newStudent, username: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-indigo-505 text-xs font-semibold text-slate-800 dark:text-slate-100"
                      placeholder="e.g. rahul2026"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-450 uppercase" htmlFor="student_password">Login Password</label>
                    <input
                      type="password" required id="student_password"
                      value={newStudent.password}
                      onChange={(e) => setNewStudent({ ...newStudent, password: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-indigo-505 text-xs font-semibold text-slate-800 dark:text-slate-100"
                      placeholder="Default password"
                    />
                  </div>
                </div>
              </div>

              {/* Personal Details */}
              <div className="space-y-4">
                <h4 className="text-xs font-extrabold text-indigo-650 dark:text-indigo-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-1.5">
                  2. Personal details
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-450 uppercase" htmlFor="add_first_name">First Name</label>
                    <input
                      type="text" required id="add_first_name"
                      value={newStudent.first_name}
                      onChange={(e) => setNewStudent({ ...newStudent, first_name: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-indigo-505 text-xs font-semibold text-slate-800 dark:text-slate-100"
                      placeholder="First Name"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-450 uppercase" htmlFor="add_last_name">Last Name</label>
                    <input
                      type="text" required id="add_last_name"
                      value={newStudent.last_name}
                      onChange={(e) => setNewStudent({ ...newStudent, last_name: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-indigo-505 text-xs font-semibold text-slate-800 dark:text-slate-100"
                      placeholder="Last Name"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-450 uppercase" htmlFor="add_dob">Date of Birth</label>
                    <input
                      type="date" id="add_dob"
                      value={newStudent.dob}
                      onChange={(e) => setNewStudent({ ...newStudent, dob: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none text-xs text-slate-800 dark:text-slate-100"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-455 uppercase" htmlFor="add_gender">Gender</label>
                    <select
                      id="add_gender"
                      value={newStudent.gender}
                      onChange={(e) => setNewStudent({ ...newStudent, gender: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none text-xs text-slate-800 dark:text-slate-100"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-455 uppercase" htmlFor="add_blood">Blood Group</label>
                    <input
                      type="text" id="add_blood"
                      value={newStudent.blood_group}
                      onChange={(e) => setNewStudent({ ...newStudent, blood_group: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none text-xs text-slate-800 dark:text-slate-100"
                      placeholder="e.g. O+"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-450 uppercase" htmlFor="add_phone">Contact No</label>
                    <input
                      type="text" id="add_phone"
                      value={newStudent.phone}
                      onChange={(e) => setNewStudent({ ...newStudent, phone: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none text-xs text-slate-800 dark:text-slate-100"
                      placeholder="Primary phone"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-450 uppercase" htmlFor="add_altphone">Alternative Contact</label>
                    <input
                      type="text" id="add_altphone"
                      value={newStudent.alternative_phone}
                      onChange={(e) => setNewStudent({ ...newStudent, alternative_phone: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none text-xs text-slate-800 dark:text-slate-100"
                      placeholder="Alternative phone"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-450 uppercase" htmlFor="add_pemail">Personal Email</label>
                    <input
                      type="email" id="add_pemail"
                      value={newStudent.personal_email}
                      onChange={(e) => setNewStudent({ ...newStudent, personal_email: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none text-xs text-slate-800 dark:text-slate-100"
                      placeholder="e.g. personal@gmail.com"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-450 uppercase" htmlFor="add_roll">Roll No</label>
                    <input
                      type="text" required id="add_roll"
                      value={newStudent.roll_no}
                      onChange={(e) => setNewStudent({ ...newStudent, roll_no: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none text-xs text-slate-800 dark:text-slate-100"
                      placeholder="e.g. 222089"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-455 uppercase" htmlFor="add_enroll">Enrollment No</label>
                    <input
                      type="text" required id="add_enroll"
                      value={newStudent.enrollment_no}
                      onChange={(e) => setNewStudent({ ...newStudent, enrollment_no: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 focus:outline-none text-xs text-slate-800 dark:text-slate-100"
                      placeholder="e.g. ENR-222089"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-455 uppercase" htmlFor="add_batch">Batch (Admission Year)</label>
                    <input
                      type="text" id="add_batch"
                      value={newStudent.batch}
                      onChange={(e) => setNewStudent({ ...newStudent, batch: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none text-xs text-slate-800 dark:text-slate-100"
                      placeholder="e.g. 2024"
                    />
                  </div>
                </div>
              </div>

              {/* Academic Parameters */}
              <div className="space-y-4">
                <h4 className="text-xs font-extrabold text-indigo-650 dark:text-indigo-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-1.5">
                  3. Academic Allocations
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider" htmlFor="add_dept">Department Stream</label>
                    <select
                      id="add_dept"
                      value={newStudent.dept_id}
                      onChange={(e) => setNewStudent({ ...newStudent, dept_id: parseInt(e.target.value) })}
                      disabled={role === 'hod' || role === 'class_counsellor'}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none text-xs text-slate-800 dark:text-slate-100 disabled:opacity-60"
                    >
                      {departments.map((dept) => (
                        <option key={dept.id} value={dept.id}>{dept.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider" htmlFor="add_course">Academic Course</label>
                    <select
                      id="add_course"
                      value={newStudent.course_id}
                      onChange={(e) => setNewStudent({ ...newStudent, course_id: parseInt(e.target.value) })}
                      disabled={role === 'class_counsellor'}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 focus:outline-none text-xs text-slate-800 dark:text-slate-100 disabled:opacity-60"
                    >
                      {courses.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-455 uppercase" htmlFor="add_sem">Current Semester</label>
                    <input
                      type="number" id="add_sem" min="1" max="8"
                      value={newStudent.current_semester}
                      onChange={(e) => setNewStudent({ ...newStudent, current_semester: parseInt(e.target.value) || 1 })}
                      disabled={role === 'class_counsellor'}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 focus:outline-none text-xs text-slate-800 dark:text-slate-100 disabled:opacity-60"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-455 uppercase" htmlFor="add_section">Section</label>
                    <input
                      type="text" id="add_section"
                      value={newStudent.section}
                      onChange={(e) => setNewStudent({ ...newStudent, section: e.target.value })}
                      disabled={role === 'class_counsellor'}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none text-xs text-slate-800 dark:text-slate-100 disabled:opacity-60"
                      placeholder="e.g. A"
                    />
                  </div>
                </div>
              </div>

              {/* Parents Details */}
              <div className="space-y-4">
                <h4 className="text-xs font-extrabold text-indigo-650 dark:text-indigo-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-1.5">
                  4. Parents details
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-450 uppercase" htmlFor="add_father">Father's Name</label>
                    <input
                      type="text" id="add_father"
                      value={newStudent.father_name}
                      onChange={(e) => setNewStudent({ ...newStudent, father_name: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none text-xs text-slate-800 dark:text-slate-100"
                      placeholder="Father's Name"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-450 uppercase" htmlFor="add_foccup">Father's Occupation</label>
                    <input
                      type="text" id="add_foccup"
                      value={newStudent.father_occupation}
                      onChange={(e) => setNewStudent({ ...newStudent, father_occupation: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none text-xs text-slate-800 dark:text-slate-100"
                      placeholder="Occupation"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-450 uppercase" htmlFor="add_mother">Mother's Name</label>
                    <input
                      type="text" id="add_mother"
                      value={newStudent.mother_name}
                      onChange={(e) => setNewStudent({ ...newStudent, mother_name: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none text-xs text-slate-800 dark:text-slate-100"
                      placeholder="Mother's Name"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-450 uppercase" htmlFor="add_moccup">Mother's Occupation</label>
                    <input
                      type="text" id="add_moccup"
                      value={newStudent.mother_occupation}
                      onChange={(e) => setNewStudent({ ...newStudent, mother_occupation: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none text-xs text-slate-800 dark:text-slate-100"
                      placeholder="Occupation"
                    />
                  </div>
                </div>
              </div>

              {/* Addresses */}
              <div className="space-y-4">
                <h4 className="text-xs font-extrabold text-indigo-650 dark:text-indigo-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-1.5">
                  5. Physical Addresses
                </h4>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-455 uppercase" htmlFor="add_curraddr">Current Residential Address</label>
                    <textarea
                      id="add_curraddr" rows={2}
                      value={newStudent.current_address}
                      onChange={(e) => setNewStudent({ ...newStudent, current_address: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 focus:outline-none text-xs text-slate-800 dark:text-slate-100 resize-none"
                      placeholder="Local address..."
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-455 uppercase" htmlFor="add_permaddr">Permanent Address</label>
                    <textarea
                      id="add_permaddr" rows={2}
                      value={newStudent.permanent_address}
                      onChange={(e) => setNewStudent({ ...newStudent, permanent_address: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 focus:outline-none text-xs text-slate-800 dark:text-slate-100 resize-none"
                      placeholder="Permanent address..."
                    />
                  </div>
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
                  className="px-5 py-2.5 text-xs font-bold text-white bg-indigo-650 hover:bg-indigo-500 rounded-xl transition-all shadow-md shadow-indigo-650/20"
                  title="Enroll Student"
                >
                  Enroll Student
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Edit Student Modal */}
      {isEditModalOpen && currentStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={() => { setIsEditModalOpen(false); setCurrentStudent(null); }} />
          
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl p-6 shadow-2xl relative z-10 space-y-6 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
            <div>
              <h3 className="text-lg font-extrabold text-slate-855 dark:text-slate-205">Modify Student Profile</h3>
              <p className="text-xs text-slate-455 dark:text-slate-500 mt-1">Update academic records and cohort assignments.</p>
            </div>

            {modalError && <div className="p-3 bg-rose-500/10 text-rose-500 rounded-xl text-xs font-bold border border-rose-500/20">{modalError}</div>}
            {modalSuccess && <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl text-xs font-bold border border-emerald-500/20">{modalSuccess}</div>}

            <form onSubmit={handleEditStudentSubmit} className="space-y-6">
              
              {/* Personal Details */}
              <div className="space-y-4">
                <h4 className="text-xs font-extrabold text-indigo-650 dark:text-indigo-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-1.5">
                  1. Personal details
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-450 uppercase" htmlFor="edit_first_name">First Name</label>
                    <input
                      type="text" required id="edit_first_name"
                      value={currentStudent.first_name}
                      onChange={(e) => setCurrentStudent({ ...currentStudent, first_name: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-indigo-505 text-xs font-semibold text-slate-800 dark:text-slate-100"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-455 uppercase" htmlFor="edit_last_name">Last Name</label>
                    <input
                      type="text" required id="edit_last_name"
                      value={currentStudent.last_name}
                      onChange={(e) => setCurrentStudent({ ...currentStudent, last_name: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-indigo-505 text-xs font-semibold text-slate-800 dark:text-slate-100"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-450 uppercase" htmlFor="edit_dob">Date of Birth</label>
                    <input
                      type="date" id="edit_dob"
                      value={currentStudent.dob ? currentStudent.dob.substring(0, 10) : ''}
                      onChange={(e) => setCurrentStudent({ ...currentStudent, dob: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none text-xs text-slate-800 dark:text-slate-100"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-455 uppercase" htmlFor="edit_gender">Gender</label>
                    <select
                      id="edit_gender"
                      value={currentStudent.gender}
                      onChange={(e) => setCurrentStudent({ ...currentStudent, gender: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 focus:outline-none text-xs text-slate-800 dark:text-slate-100"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-455 uppercase" htmlFor="edit_blood">Blood Group</label>
                    <input
                      type="text" id="edit_blood"
                      value={currentStudent.blood_group || ''}
                      onChange={(e) => setCurrentStudent({ ...currentStudent, blood_group: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none text-xs text-slate-800 dark:text-slate-100"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-450 uppercase" htmlFor="edit_phone">Contact No</label>
                    <input
                      type="text" id="edit_phone"
                      value={currentStudent.phone || ''}
                      onChange={(e) => setCurrentStudent({ ...currentStudent, phone: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none text-xs text-slate-800 dark:text-slate-100"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-450 uppercase" htmlFor="edit_altphone">Alternative Contact</label>
                    <input
                      type="text" id="edit_altphone"
                      value={currentStudent.alternative_phone || ''}
                      onChange={(e) => setCurrentStudent({ ...currentStudent, alternative_phone: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none text-xs text-slate-800 dark:text-slate-100"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-450 uppercase" htmlFor="edit_pemail">Personal Email</label>
                    <input
                      type="email" id="edit_pemail"
                      value={currentStudent.personal_email || ''}
                      onChange={(e) => setCurrentStudent({ ...currentStudent, personal_email: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none text-xs text-slate-800 dark:text-slate-100"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-455 uppercase" htmlFor="edit_batch">Batch (Admission Year)</label>
                    <input
                      type="text" id="edit_batch"
                      value={currentStudent.batch || ''}
                      onChange={(e) => setCurrentStudent({ ...currentStudent, batch: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none text-xs text-slate-800 dark:text-slate-100"
                    />
                  </div>
                </div>
              </div>

              {/* Academic Parameters */}
              <div className="space-y-4">
                <h4 className="text-xs font-extrabold text-indigo-650 dark:text-indigo-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-1.5">
                  2. Academic Allocations
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider" htmlFor="edit_dept">Department Stream</label>
                    <select
                      id="edit_dept"
                      value={currentStudent.dept_id}
                      onChange={(e) => setCurrentStudent({ ...currentStudent, dept_id: parseInt(e.target.value) })}
                      disabled={role === 'hod' || role === 'class_counsellor'}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 focus:outline-none text-xs text-slate-800 dark:text-slate-100 disabled:opacity-60"
                    >
                      {departments.map((dept) => (
                        <option key={dept.id} value={dept.id}>{dept.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider" htmlFor="edit_course">Academic Course</label>
                    <select
                      id="edit_course"
                      value={currentStudent.course_id}
                      onChange={(e) => setCurrentStudent({ ...currentStudent, course_id: parseInt(e.target.value) })}
                      disabled={role === 'class_counsellor'}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 focus:outline-none text-xs text-slate-800 dark:text-slate-100 disabled:opacity-60"
                    >
                      {courses.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-455 uppercase" htmlFor="edit_sem">Current Semester</label>
                    <input
                      type="number" id="edit_sem" min="1" max="8"
                      value={currentStudent.current_semester}
                      onChange={(e) => setCurrentStudent({ ...currentStudent, current_semester: parseInt(e.target.value) || 1 })}
                      disabled={role === 'class_counsellor'}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-55 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 focus:outline-none text-xs text-slate-800 dark:text-slate-100 disabled:opacity-60"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-455 uppercase" htmlFor="edit_section">Section</label>
                    <input
                      type="text" id="edit_section"
                      value={currentStudent.section || ''}
                      onChange={(e) => setCurrentStudent({ ...currentStudent, section: e.target.value })}
                      disabled={role === 'class_counsellor'}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none text-xs text-slate-800 dark:text-slate-100 disabled:opacity-60"
                    />
                  </div>
                </div>
              </div>

              {/* Parents Details */}
              <div className="space-y-4">
                <h4 className="text-xs font-extrabold text-indigo-650 dark:text-indigo-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-1.5">
                  3. Parents details
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-455 uppercase" htmlFor="edit_father">Father's Name</label>
                    <input
                      type="text" id="edit_father"
                      value={currentStudent.father_name || ''}
                      onChange={(e) => setCurrentStudent({ ...currentStudent, father_name: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none text-xs text-slate-800 dark:text-slate-100"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-455 uppercase" htmlFor="edit_foccup">Father's Occupation</label>
                    <input
                      type="text" id="edit_foccup"
                      value={currentStudent.father_occupation || ''}
                      onChange={(e) => setCurrentStudent({ ...currentStudent, father_occupation: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 focus:outline-none text-xs text-slate-800 dark:text-slate-100"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-455 uppercase" htmlFor="edit_mother">Mother's Name</label>
                    <input
                      type="text" id="edit_mother"
                      value={currentStudent.mother_name || ''}
                      onChange={(e) => setCurrentStudent({ ...currentStudent, mother_name: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none text-xs text-slate-800 dark:text-slate-100"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-455 uppercase" htmlFor="edit_moccup">Mother's Occupation</label>
                    <input
                      type="text" id="edit_moccup"
                      value={currentStudent.mother_occupation || ''}
                      onChange={(e) => setCurrentStudent({ ...currentStudent, mother_occupation: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 focus:outline-none text-xs text-slate-800 dark:text-slate-100"
                    />
                  </div>
                </div>
              </div>

              {/* Addresses */}
              <div className="space-y-4">
                <h4 className="text-xs font-extrabold text-indigo-650 dark:text-indigo-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-1.5">
                  4. Physical Addresses
                </h4>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-455 uppercase" htmlFor="edit_curraddr">Current Residential Address</label>
                    <textarea
                      id="edit_curraddr" rows={2}
                      value={currentStudent.current_address || ''}
                      onChange={(e) => setCurrentStudent({ ...currentStudent, current_address: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 focus:outline-none text-xs text-slate-800 dark:text-slate-100 resize-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-455 uppercase" htmlFor="edit_permaddr">Permanent Address</label>
                    <textarea
                      id="edit_permaddr" rows={2}
                      value={currentStudent.permanent_address || ''}
                      onChange={(e) => setCurrentStudent({ ...currentStudent, permanent_address: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 focus:outline-none text-xs text-slate-800 dark:text-slate-100 resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => { setIsEditModalOpen(false); setCurrentStudent(null); }}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
                  title="Cancel"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs font-bold text-white bg-indigo-650 hover:bg-indigo-500 rounded-xl transition-all shadow-md shadow-indigo-650/20"
                  title="Save changes"
                >
                  Save Changes
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
