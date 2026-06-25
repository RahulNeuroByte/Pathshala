import React, { useEffect, useState } from 'react';
import api, { facultyService } from '../services/api';
import { useUser } from '../context/UserContext';
import { generatePDFReport } from '../utils/pdfGenerator';

export default function FacultyPage() {
  const { role } = useUser();
  const [faculty, setFaculty] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentUserProfile, setCurrentUserProfile] = useState<any>(null);
  
  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentFaculty, setCurrentFaculty] = useState<any>(null);
  
  const [newFaculty, setNewFaculty] = useState<any>({
    username: '',
    password: '',
    first_name: '',
    last_name: '',
    employee_id: '',
    designation: 'Assistant Professor',
    dept_id: '',
    specialization: '',
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
    section: '',
    course_id: '',
    current_semester: ''
  });

  const [modalSuccess, setModalSuccess] = useState('');
  const [modalError, setModalError] = useState('');

  const loadInitialData = async () => {
    try {
      const [facultyRes, deptsRes, coursesRes, meRes] = await Promise.all([
        facultyService.getFaculty(),
        api.get('/departments'),
        api.get('/courses'),
        api.get('/users/me')
      ]);
      const depts = deptsRes.data || [];
      const crs = coursesRes.data || [];
      setFaculty(facultyRes.data || []);
      setDepartments(depts);
      setCourses(crs);
      
      const uProfile = meRes.data;
      setCurrentUserProfile(uProfile);
      
      if (depts.length > 0) {
        const defaultDept = (role === 'hod' && uProfile?.dept_id) ? uProfile.dept_id : depts[0].id;
        setNewFaculty((prev: any) => ({ ...prev, dept_id: defaultDept }));
      }
    } catch (error) {
      console.error('Failed to load initial data in FacultyPage', error);
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
    if (!id) return 'None';
    const course = courses.find(c => c.id === id);
    return course ? course.name : `Course ${id}`;
  };

  // Filter faculty members based on search term
  const filteredFaculty = faculty.filter((member) => {
    return (
      `${member.first_name} ${member.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.employee_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (member.specialization && member.specialization.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

  const handlePromoteHOD = async (facultyId: number) => {
    if (window.confirm("Are you sure you want to promote this faculty member to HOD? This changes their system permissions.")) {
      try {
        setLoading(true);
        await facultyService.makeHod(facultyId);
        alert("Faculty member promoted to HOD successfully!");
        const facultyRes = await facultyService.getFaculty();
        setFaculty(facultyRes.data || []);
      } catch (e: any) {
        console.error("Failed to promote faculty member to HOD", e);
        alert(e.response?.data?.detail || "Failed to promote faculty member.");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleDownloadPDF = () => {
    const headers = [['Full Name', 'Employee ID', 'Designation', 'Department', 'Specialization']];
    const rows = filteredFaculty.map((member) => [
      `${member.first_name} ${member.last_name}`,
      member.employee_id,
      member.designation || 'Faculty Member',
      getDeptName(member.dept_id),
      member.specialization || 'Generalist',
    ]);

    generatePDFReport(
      'Faculty Academic Directory',
      {
        'Academic Year': '2026-27',
        'Staff Count': filteredFaculty.length.toString(),
        'Scope': 'All Departments',
      },
      headers,
      rows,
      'faculty_directory.pdf'
    );
  };

  const handleAddFacultySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError('');
    setModalSuccess('');
    
    // Process optional values
    const payload = { ...newFaculty };
    if (!payload.course_id) delete payload.course_id;
    else payload.course_id = parseInt(payload.course_id);
    if (!payload.current_semester) delete payload.current_semester;
    else payload.current_semester = parseInt(payload.current_semester);
    if (!payload.section) delete payload.section;

    try {
      const res = await facultyService.createFaculty(payload);
      setFaculty([res.data, ...faculty]);
      setModalSuccess('Faculty member registered successfully! Access details sent.');
      setTimeout(() => {
        setIsAddModalOpen(false);
        setModalSuccess('');
        setNewFaculty({
          username: '',
          password: '',
          first_name: '',
          last_name: '',
          employee_id: '',
          designation: 'Assistant Professor',
          dept_id: departments[0]?.id || '',
          specialization: '',
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
          section: '',
          course_id: '',
          current_semester: ''
        });
      }, 1500);
    } catch (err: any) {
      setModalError(err.response?.data?.detail || 'Failed to register faculty member.');
    }
  };

  const handleDeleteFaculty = async (id: number) => {
    if (window.confirm('Are you sure you want to remove this faculty profile?')) {
      try {
        await facultyService.deleteFaculty(id);
        setFaculty(faculty.filter((member) => member.id !== id));
      } catch (err: any) {
        alert(err.response?.data?.detail || 'Failed to remove faculty member.');
      }
    }
  };

  const handleEditClick = (member: any) => {
    setCurrentFaculty({
      ...member,
      course_id: member.course_id ? member.course_id.toString() : '',
      current_semester: member.current_semester ? member.current_semester.toString() : '',
      section: member.section || ''
    });
    setModalError('');
    setModalSuccess('');
    setIsEditModalOpen(true);
  };

  const handleEditFacultySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError('');
    setModalSuccess('');

    const payload = { ...currentFaculty };
    if (!payload.course_id) payload.course_id = null;
    else payload.course_id = parseInt(payload.course_id);
    if (!payload.current_semester) payload.current_semester = null;
    else payload.current_semester = parseInt(payload.current_semester);
    if (!payload.section) payload.section = null;

    try {
      const res = await facultyService.updateFaculty(currentFaculty.id, payload);
      setFaculty(faculty.map(f => f.id === currentFaculty.id ? res.data : f));
      setModalSuccess('Faculty profile updated successfully!');
      setTimeout(() => {
        setIsEditModalOpen(false);
        setModalSuccess('');
        setCurrentFaculty(null);
      }, 1500);
    } catch (err: any) {
      setModalError(err.response?.data?.detail || 'Failed to update faculty member.');
    }
  };

  const canModify = role === 'admin' || role === 'principal' || role === 'hod';
  const canPromote = role === 'admin' || role === 'principal';

  return (
    <div className="space-y-6 max-w-7xl mx-auto relative">
      
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">Faculty Workspace</h1>
          <p className="text-slate-400 dark:text-slate-500 text-xs mt-1">
            Display, search, and register faculty profiles and academic specializations.
          </p>
        </div>
        
        {/* Actions Button Bar */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleDownloadPDF}
            disabled={filteredFaculty.length === 0}
            className={`flex items-center justify-center px-4 py-2.5 text-xs font-bold text-white rounded-xl transition-all shadow-md gap-2 border border-indigo-500/10 ${
              filteredFaculty.length === 0
                ? 'bg-slate-300 dark:bg-slate-800 text-slate-400 cursor-not-allowed shadow-none'
                : 'bg-indigo-650 hover:bg-indigo-500 shadow-indigo-650/20'
            }`}
            title="Download PDF"
          >
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download PDF
          </button>
          
          {canModify && (
            <button
              onClick={() => {
                setModalError('');
                setModalSuccess('');
                const defaultDept = (role === 'hod' && currentUserProfile?.dept_id) ? currentUserProfile.dept_id : (departments[0]?.id || '');
                setNewFaculty({
                  username: '',
                  password: '',
                  first_name: '',
                  last_name: '',
                  employee_id: '',
                  designation: 'Assistant Professor',
                  dept_id: defaultDept,
                  specialization: '',
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
                  section: '',
                  course_id: '',
                  current_semester: ''
                });
                setIsAddModalOpen(true);
              }}
              className="flex items-center justify-center px-4 py-2.5 text-xs font-bold text-white bg-indigo-650 hover:bg-indigo-500 rounded-xl transition-all shadow-md shadow-indigo-650/20 gap-2"
              title="Add Faculty"
            >
              <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Add Faculty
            </button>
          )}
        </div>
      </div>

      {/* Filter and Stats Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 p-4.5 rounded-2xl shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between transition-colors">
        <div className="relative w-full sm:max-w-xs">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 dark:text-slate-500">
            <svg width="20" height="20" className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input
            type="text"
            placeholder="Search by name, spec, ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-4 py-2.5 bg-slate-55 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl placeholder-slate-400 text-slate-700 dark:text-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            title="Search Faculty"
          />
        </div>
        <div className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
          Total: {filteredFaculty.length} Academic Staff
        </div>
      </div>

      {/* Main Grid View */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-4">
            <svg width="32" height="32" className="animate-spin h-8 w-8 text-indigo-650" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Syncing staff records...</span>
          </div>
        </div>
      ) : filteredFaculty.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-3">
          <svg width="32" height="32" className="text-slate-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <h3 className="font-extrabold text-slate-755 dark:text-slate-305 mt-2">No profiles matched</h3>
          <p className="text-slate-400 dark:text-slate-500 text-xs mt-1">
            Try adjusting your search criteria.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredFaculty.map((member) => (
            <div
              key={member.id}
              className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 p-6 rounded-3xl shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
            >
              <div className="space-y-4.5">
                {/* Profile Header */}
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-purple-50 dark:bg-purple-955/20 text-purple-650 dark:text-purple-400 font-bold text-base flex items-center justify-center border border-purple-100 dark:border-purple-900/30 flex-shrink-0">
                    {member.first_name[0]}
                    {member.last_name[0]}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-850 dark:text-slate-100 text-base leading-tight">
                      {member.first_name} {member.last_name}
                    </h3>
                    <p className="text-[11px] font-bold text-slate-450 dark:text-slate-550 mt-1.5 uppercase tracking-wider">
                      {member.designation || 'Instructor'}
                    </p>
                  </div>
                </div>

                <div className="border-t border-slate-100 dark:border-slate-800/80 pt-4 space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider text-[10px]">Employee ID</span>
                    <span className="font-mono font-extrabold text-slate-700 dark:text-slate-300">{member.employee_id}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider text-[10px]">Department</span>
                    <span className="font-extrabold text-slate-700 dark:text-slate-355">
                      {getDeptName(member.dept_id)}
                    </span>
                  </div>
                  {member.designation === 'Class Counsellor' && member.course_id && (
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider text-[10px]">Assigned Class</span>
                      <span className="font-extrabold text-slate-700 dark:text-slate-355 text-[11px]">
                        {getCourseName(member.course_id)} | Sem {member.current_semester} - {member.section}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Specialization Badge and Action buttons */}
              <div className="mt-4 pt-4 border-t border-slate-50 dark:border-slate-800/40 flex items-center justify-between">
                {member.specialization ? (
                  <span className="text-[10px] font-extrabold text-indigo-650 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/30 px-2.5 py-1 rounded-lg">
                    {member.specialization}
                  </span>
                ) : (
                  <span />
                )}
                 {canModify && !(role === 'hod' && ['HOD', 'LIBRARIAN', 'PRINCIPAL'].includes((member.designation || '').toUpperCase())) && (
                  <div className="flex items-center gap-1.5 flex-wrap justify-end">
                    {canPromote && member.designation !== 'HOD' && (
                      <button
                        onClick={() => handlePromoteHOD(member.id)}
                        className="px-2 py-1 text-[10px] font-extrabold text-amber-600 hover:bg-amber-500/10 rounded-lg border border-amber-500/20 transition-all uppercase tracking-wider"
                        title="Promote HOD"
                      >
                        Make HOD
                      </button>
                    )}
                    <button
                      onClick={() => handleEditClick(member)}
                      className="px-2 py-1 text-[11px] font-bold text-indigo-655 hover:bg-indigo-500/10 rounded-lg transition-all"
                      title="Edit Profile"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteFaculty(member.id)}
                      className="px-2 py-1 text-[11px] font-bold text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"
                      title="Delete Profile"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Faculty Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={() => setIsAddModalOpen(false)} />
          
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl p-6 shadow-2xl relative z-10 space-y-6 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
            <div>
              <h3 className="text-lg font-extrabold text-slate-850 dark:text-slate-200">Register Faculty Profile</h3>
              <p className="text-xs text-slate-455 dark:text-slate-500 mt-1">Input the registration logs for academic credentials verification.</p>
            </div>

            {modalError && <div className="p-3 bg-rose-500/10 text-rose-500 rounded-xl text-xs font-bold border border-rose-500/20">{modalError}</div>}
            {modalSuccess && <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl text-xs font-bold border border-emerald-500/20">{modalSuccess}</div>}

            <form onSubmit={handleAddFacultySubmit} className="space-y-6">
              
              {/* Credentials */}
              <div className="space-y-4">
                <h4 className="text-xs font-extrabold text-indigo-650 dark:text-indigo-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-1.5">
                  1. Login Credentials
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-450 uppercase" htmlFor="fac_username">Login Username</label>
                    <input
                      type="text" required id="fac_username"
                      value={newFaculty.username}
                      onChange={(e) => setNewFaculty({ ...newFaculty, username: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-indigo-505 text-xs font-semibold text-slate-800 dark:text-slate-100"
                      placeholder="e.g. aturing"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-450 uppercase" htmlFor="fac_password">Login Password</label>
                    <input
                      type="password" required id="fac_password"
                      value={newFaculty.password}
                      onChange={(e) => setNewFaculty({ ...newFaculty, password: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-indigo-505 text-xs font-semibold text-slate-800 dark:text-slate-100"
                      placeholder="Default password"
                    />
                  </div>
                </div>
              </div>

              {/* Personal details */}
              <div className="space-y-4">
                <h4 className="text-xs font-extrabold text-indigo-650 dark:text-indigo-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-1.5">
                  2. Personal details
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-455 uppercase" htmlFor="fac_first_name">First Name</label>
                    <input
                      type="text" required id="fac_first_name"
                      value={newFaculty.first_name}
                      onChange={(e) => setNewFaculty({ ...newFaculty, first_name: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-indigo-505 text-xs font-semibold text-slate-800 dark:text-slate-100"
                      placeholder="First Name"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-455 uppercase" htmlFor="fac_last_name">Last Name</label>
                    <input
                      type="text" required id="fac_last_name"
                      value={newFaculty.last_name}
                      onChange={(e) => setNewFaculty({ ...newFaculty, last_name: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-indigo-505 text-xs font-semibold text-slate-800 dark:text-slate-100"
                      placeholder="Last Name"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-450 uppercase" htmlFor="fac_dob">Date of Birth</label>
                    <input
                      type="date" id="fac_dob"
                      value={newFaculty.dob || ''}
                      onChange={(e) => setNewFaculty({ ...newFaculty, dob: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none text-xs text-slate-800 dark:text-slate-100"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-455 uppercase" htmlFor="fac_gender">Gender</label>
                    <select
                      id="fac_gender"
                      value={newFaculty.gender || 'Male'}
                      onChange={(e) => setNewFaculty({ ...newFaculty, gender: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 focus:outline-none text-xs text-slate-800 dark:text-slate-100"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-455 uppercase" htmlFor="fac_blood">Blood Group</label>
                    <input
                      type="text" id="fac_blood"
                      value={newFaculty.blood_group}
                      onChange={(e) => setNewFaculty({ ...newFaculty, blood_group: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none text-xs text-slate-800 dark:text-slate-100"
                      placeholder="e.g. A+"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-450 uppercase" htmlFor="fac_phone">Contact No</label>
                    <input
                      type="text" id="fac_phone"
                      value={newFaculty.phone || ''}
                      onChange={(e) => setNewFaculty({ ...newFaculty, phone: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none text-xs text-slate-800 dark:text-slate-100"
                      placeholder="Primary Phone"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-450 uppercase" htmlFor="fac_altphone">Alternative Contact</label>
                    <input
                      type="text" id="fac_altphone"
                      value={newFaculty.alternative_phone}
                      onChange={(e) => setNewFaculty({ ...newFaculty, alternative_phone: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none text-xs text-slate-800 dark:text-slate-100"
                      placeholder="Alternative Phone"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-450 uppercase" htmlFor="fac_pemail">Personal Email</label>
                  <input
                    type="email" id="fac_pemail"
                    value={newFaculty.personal_email}
                    onChange={(e) => setNewFaculty({ ...newFaculty, personal_email: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none text-xs text-slate-800 dark:text-slate-100"
                    placeholder="e.g. turing@gmail.com"
                  />
                </div>
              </div>

              {/* Academic Parameters */}
              <div className="space-y-4">
                <h4 className="text-xs font-extrabold text-indigo-650 dark:text-indigo-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-1.5">
                  3. Academic Allocations
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-450 uppercase" htmlFor="fac_empid">Employee ID</label>
                    <input
                      type="text" required id="fac_empid"
                      value={newFaculty.employee_id}
                      onChange={(e) => setNewFaculty({ ...newFaculty, employee_id: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none"
                      placeholder="e.g. FAC-089"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-555 uppercase tracking-wider" htmlFor="fac_dept">Department Stream</label>
                    <select
                      id="fac_dept"
                      value={newFaculty.dept_id}
                      onChange={(e) => setNewFaculty({ ...newFaculty, dept_id: parseInt(e.target.value) })}
                      disabled={role === 'hod'}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 focus:outline-none text-xs text-slate-800 dark:text-slate-100 disabled:opacity-60"
                    >
                      {departments.map((dept) => (
                        <option key={dept.id} value={dept.id}>{dept.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-455 uppercase" htmlFor="fac_desg">Designation</label>
                    <select
                      id="fac_desg"
                      value={newFaculty.designation}
                      onChange={(e) => setNewFaculty({ ...newFaculty, designation: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 focus:outline-none text-xs text-slate-800 dark:text-slate-100"
                    >
                      <option value="Professor">Professor</option>
                      <option value="Associate Professor">Associate Professor</option>
                      <option value="Assistant Professor">Assistant Professor</option>
                      <option value="Lecturer">Lecturer</option>
                      <option value="Class Counsellor">Class Counsellor</option>
                      {role !== 'hod' && <option value="Librarian">Librarian</option>}
                      {role !== 'hod' && <option value="HOD">HOD</option>}
                      {role !== 'hod' && <option value="Principal">Principal</option>}
                    </select>
                  </div>
                  <div className="space-y-1 col-span-2">
                    <label className="text-[10px] font-bold text-slate-450 uppercase" htmlFor="fac_spec">Specialization</label>
                    <input
                      type="text" required id="fac_spec"
                      value={newFaculty.specialization}
                      onChange={(e) => setNewFaculty({ ...newFaculty, specialization: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none"
                      placeholder="e.g. Distributed Systems"
                    />
                  </div>
                </div>

                {newFaculty.designation === 'Class Counsellor' && (
                  <div className="pt-2.5 space-y-4 bg-indigo-50/20 dark:bg-indigo-950/20 p-4.5 rounded-2xl border border-indigo-500/10">
                    <h5 className="text-[10px] font-bold text-indigo-650 dark:text-indigo-400 uppercase tracking-wider">
                      Class Counsellor Section Assignment
                    </h5>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase" htmlFor="cc_course">Assigned Course</label>
                        <select
                          id="cc_course"
                          value={newFaculty.course_id}
                          onChange={(e) => setNewFaculty({ ...newFaculty, course_id: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs"
                        >
                          <option value="">-- Select --</option>
                          {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase" htmlFor="cc_sem">Assigned Sem</label>
                        <input
                          type="number" id="cc_sem" min="1" max="8"
                          value={newFaculty.current_semester}
                          onChange={(e) => setNewFaculty({ ...newFaculty, current_semester: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-400 dark:text-slate-555 uppercase" htmlFor="cc_sec">Assigned Section</label>
                        <input
                          type="text" id="cc_sec"
                          value={newFaculty.section}
                          onChange={(e) => setNewFaculty({ ...newFaculty, section: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs"
                          placeholder="e.g. A"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Parents Details */}
              <div className="space-y-4">
                <h4 className="text-xs font-extrabold text-indigo-650 dark:text-indigo-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-1.5">
                  4. Parents details
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-450 uppercase" htmlFor="fac_father">Father's Name</label>
                    <input
                      type="text" id="fac_father"
                      value={newFaculty.father_name || ''}
                      onChange={(e) => setNewFaculty({ ...newFaculty, father_name: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none text-xs text-slate-800 dark:text-slate-100"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-450 uppercase" htmlFor="fac_foccup">Father's Occupation</label>
                    <input
                      type="text" id="fac_foccup"
                      value={newFaculty.father_occupation || ''}
                      onChange={(e) => setNewFaculty({ ...newFaculty, father_occupation: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none text-xs text-slate-800 dark:text-slate-100"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-455 uppercase" htmlFor="fac_mother">Mother's Name</label>
                    <input
                      type="text" id="fac_mother"
                      value={newFaculty.mother_name || ''}
                      onChange={(e) => setNewFaculty({ ...newFaculty, mother_name: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 focus:outline-none text-xs text-slate-800 dark:text-slate-100"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-455 uppercase" htmlFor="fac_moccup">Mother's Occupation</label>
                    <input
                      type="text" id="fac_moccup"
                      value={newFaculty.mother_occupation || ''}
                      onChange={(e) => setNewFaculty({ ...newFaculty, mother_occupation: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 focus:outline-none text-xs text-slate-800 dark:text-slate-100"
                    />
                  </div>
                </div>
              </div>

              {/* Physical Addresses */}
              <div className="space-y-4">
                <h4 className="text-xs font-extrabold text-indigo-650 dark:text-indigo-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-1.5">
                  5. Physical Addresses
                </h4>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-455 uppercase" htmlFor="fac_curraddr">Current Residential Address</label>
                    <textarea
                      id="fac_curraddr" rows={2}
                      value={newFaculty.current_address || ''}
                      onChange={(e) => setNewFaculty({ ...newFaculty, current_address: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 focus:outline-none text-xs text-slate-800 dark:text-slate-100 resize-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-455 uppercase" htmlFor="fac_permaddr">Permanent Address</label>
                    <textarea
                      id="fac_permaddr" rows={2}
                      value={newFaculty.permanent_address || ''}
                      onChange={(e) => setNewFaculty({ ...newFaculty, permanent_address: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 focus:outline-none text-xs text-slate-800 dark:text-slate-100 resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-805">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:bg-slate-150 dark:hover:bg-slate-800 rounded-xl transition-all"
                  title="Cancel"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs font-bold text-white bg-indigo-650 hover:bg-indigo-500 rounded-xl transition-all shadow-md shadow-indigo-650/20"
                  title="Register Profile"
                >
                  Register Profile
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Edit Faculty Modal */}
      {isEditModalOpen && currentFaculty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={() => { setIsEditModalOpen(false); setCurrentFaculty(null); }} />
          
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl p-6 shadow-2xl relative z-10 space-y-6 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
            <div>
              <h3 className="text-lg font-extrabold text-slate-855 dark:text-slate-205">Modify Faculty Profile</h3>
              <p className="text-xs text-slate-455 dark:text-slate-500 mt-1">Update the profile credentials and cohort assignments.</p>
            </div>

            {modalError && <div className="p-3 bg-rose-500/10 text-rose-500 rounded-xl text-xs font-bold border border-rose-500/20">{modalError}</div>}
            {modalSuccess && <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl text-xs font-bold border border-emerald-500/20">{modalSuccess}</div>}

            <form onSubmit={handleEditFacultySubmit} className="space-y-6">
              
              {/* Personal Details */}
              <div className="space-y-4">
                <h4 className="text-xs font-extrabold text-indigo-650 dark:text-indigo-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-1.5">
                  1. Personal details
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-450 uppercase" htmlFor="edit_fac_first_name">First Name</label>
                    <input
                      type="text" required id="edit_fac_first_name"
                      value={currentFaculty.first_name}
                      onChange={(e) => setCurrentFaculty({ ...currentFaculty, first_name: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-indigo-505 text-xs font-semibold text-slate-800 dark:text-slate-100"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-455 uppercase" htmlFor="edit_fac_last_name">Last Name</label>
                    <input
                      type="text" required id="edit_fac_last_name"
                      value={currentFaculty.last_name}
                      onChange={(e) => setCurrentFaculty({ ...currentFaculty, last_name: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-indigo-505 text-xs font-semibold text-slate-800 dark:text-slate-100"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-450 uppercase" htmlFor="edit_fac_dob">Date of Birth</label>
                    <input
                      type="date" id="edit_fac_dob"
                      value={currentFaculty.dob ? currentFaculty.dob.substring(0, 10) : ''}
                      onChange={(e) => setCurrentFaculty({ ...currentFaculty, dob: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none text-xs text-slate-800 dark:text-slate-100"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-455 uppercase" htmlFor="edit_fac_gender">Gender</label>
                    <select
                      id="edit_fac_gender"
                      value={currentFaculty.gender || 'Male'}
                      onChange={(e) => setCurrentFaculty({ ...currentFaculty, gender: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 focus:outline-none text-xs text-slate-800 dark:text-slate-100"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-455 uppercase" htmlFor="edit_fac_blood">Blood Group</label>
                    <input
                      type="text" id="edit_fac_blood"
                      value={currentFaculty.blood_group || ''}
                      onChange={(e) => setCurrentFaculty({ ...currentFaculty, blood_group: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none text-xs text-slate-800 dark:text-slate-100"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-450 uppercase" htmlFor="edit_fac_phone">Contact No</label>
                    <input
                      type="text" id="edit_fac_phone"
                      value={currentFaculty.phone || ''}
                      onChange={(e) => setCurrentFaculty({ ...currentFaculty, phone: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none text-xs text-slate-800 dark:text-slate-100"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-450 uppercase" htmlFor="edit_fac_altphone">Alternative Contact</label>
                    <input
                      type="text" id="edit_fac_altphone"
                      value={currentFaculty.alternative_phone || ''}
                      onChange={(e) => setCurrentFaculty({ ...currentFaculty, alternative_phone: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none text-xs text-slate-800 dark:text-slate-100"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-450 uppercase" htmlFor="edit_fac_pemail">Personal Email</label>
                  <input
                    type="email" id="edit_fac_pemail"
                    value={currentFaculty.personal_email || ''}
                    onChange={(e) => setCurrentFaculty({ ...currentFaculty, personal_email: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none text-xs text-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              {/* Academic Allocations */}
              <div className="space-y-4">
                <h4 className="text-xs font-extrabold text-indigo-650 dark:text-indigo-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-1.5">
                  2. Academic Allocations
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-450 uppercase" htmlFor="edit_fac_employee_id">Employee ID</label>
                    <input
                      type="text" required id="edit_fac_employee_id"
                      value={currentFaculty.employee_id}
                      onChange={(e) => setCurrentFaculty({ ...currentFaculty, employee_id: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider" htmlFor="edit_fac_dept">Department Stream</label>
                    <select
                      id="edit_fac_dept"
                      value={currentFaculty.dept_id}
                      onChange={(e) => setCurrentFaculty({ ...currentFaculty, dept_id: parseInt(e.target.value) })}
                      disabled={role === 'hod'}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 focus:outline-none text-xs text-slate-800 dark:text-slate-100 disabled:opacity-60"
                    >
                      {departments.map((dept) => (
                        <option key={dept.id} value={dept.id}>{dept.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-455 uppercase" htmlFor="edit_fac_desg">Designation</label>
                    <select
                      id="edit_fac_desg"
                      value={currentFaculty.designation}
                      onChange={(e) => setCurrentFaculty({ ...currentFaculty, designation: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 focus:outline-none text-xs text-slate-800 dark:text-slate-100"
                    >
                      <option value="Professor">Professor</option>
                      <option value="Associate Professor">Associate Professor</option>
                      <option value="Assistant Professor">Assistant Professor</option>
                      <option value="Lecturer">Lecturer</option>
                      <option value="Class Counsellor">Class Counsellor</option>
                      {role !== 'hod' && <option value="Librarian">Librarian</option>}
                      {role !== 'hod' && <option value="HOD">HOD</option>}
                      {role !== 'hod' && <option value="Principal">Principal</option>}
                    </select>
                  </div>
                  <div className="space-y-1 col-span-2">
                    <label className="text-[10px] font-bold text-slate-450 uppercase" htmlFor="edit_fac_spec">Specialization</label>
                    <input
                      type="text" required id="edit_fac_spec"
                      value={currentFaculty.specialization || ''}
                      onChange={(e) => setCurrentFaculty({ ...currentFaculty, specialization: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-55 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none"
                    />
                  </div>
                </div>

                {currentFaculty.designation === 'Class Counsellor' && (
                  <div className="pt-2.5 space-y-4 bg-indigo-50/20 dark:bg-indigo-950/20 p-4.5 rounded-2xl border border-indigo-500/10">
                    <h5 className="text-[10px] font-bold text-indigo-650 dark:text-indigo-400 uppercase tracking-wider">
                      Class Counsellor Section Assignment
                    </h5>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-400 dark:text-slate-555 uppercase" htmlFor="edit_cc_course">Assigned Course</label>
                        <select
                          id="edit_cc_course"
                          value={currentFaculty.course_id || ''}
                          onChange={(e) => setCurrentFaculty({ ...currentFaculty, course_id: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs"
                        >
                          <option value="">-- Select --</option>
                          {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-400 dark:text-slate-555 uppercase" htmlFor="edit_cc_sem">Assigned Sem</label>
                        <input
                          type="number" id="edit_cc_sem" min="1" max="8"
                          value={currentFaculty.current_semester || ''}
                          onChange={(e) => setCurrentFaculty({ ...currentFaculty, current_semester: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-955 border border-slate-200 dark:border-slate-800 text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-400 dark:text-slate-555 uppercase" htmlFor="edit_cc_sec">Assigned Section</label>
                        <input
                          type="text" id="edit_cc_sec"
                          value={currentFaculty.section || ''}
                          onChange={(e) => setCurrentFaculty({ ...currentFaculty, section: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Parents Details */}
              <div className="space-y-4">
                <h4 className="text-xs font-extrabold text-indigo-650 dark:text-indigo-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-1.5">
                  3. Parents details
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-455 uppercase" htmlFor="edit_fac_father">Father's Name</label>
                    <input
                      type="text" id="edit_fac_father"
                      value={currentFaculty.father_name || ''}
                      onChange={(e) => setCurrentFaculty({ ...currentFaculty, father_name: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none text-xs text-slate-800 dark:text-slate-100"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-455 uppercase" htmlFor="edit_fac_foccup">Father's Occupation</label>
                    <input
                      type="text" id="edit_fac_foccup"
                      value={currentFaculty.father_occupation || ''}
                      onChange={(e) => setCurrentFaculty({ ...currentFaculty, father_occupation: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none text-xs text-slate-800 dark:text-slate-100"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-455 uppercase" htmlFor="edit_fac_mother">Mother's Name</label>
                    <input
                      type="text" id="edit_fac_mother"
                      value={currentFaculty.mother_name || ''}
                      onChange={(e) => setCurrentFaculty({ ...currentFaculty, mother_name: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 focus:outline-none text-xs text-slate-800 dark:text-slate-100"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-455 uppercase" htmlFor="edit_fac_moccup">Mother's Occupation</label>
                    <input
                      type="text" id="edit_fac_moccup"
                      value={currentFaculty.mother_occupation || ''}
                      onChange={(e) => setCurrentFaculty({ ...currentFaculty, mother_occupation: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 focus:outline-none text-xs text-slate-800 dark:text-slate-100"
                    />
                  </div>
                </div>
              </div>

              {/* Physical Addresses */}
              <div className="space-y-4">
                <h4 className="text-xs font-extrabold text-indigo-650 dark:text-indigo-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-1.5">
                  4. Physical Addresses
                </h4>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-455 uppercase" htmlFor="edit_fac_curraddr">Current Residential Address</label>
                    <textarea
                      id="edit_fac_curraddr" rows={2}
                      value={currentFaculty.current_address || ''}
                      onChange={(e) => setCurrentFaculty({ ...currentFaculty, current_address: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 focus:outline-none text-xs text-slate-800 dark:text-slate-100 resize-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-455 uppercase" htmlFor="edit_fac_permaddr">Permanent Address</label>
                    <textarea
                      id="edit_fac_permaddr" rows={2}
                      value={currentFaculty.permanent_address || ''}
                      onChange={(e) => setCurrentFaculty({ ...currentFaculty, permanent_address: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 focus:outline-none text-xs text-slate-800 dark:text-slate-100 resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => { setIsEditModalOpen(false); setCurrentFaculty(null); }}
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
