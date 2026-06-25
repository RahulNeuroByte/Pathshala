import React, { useEffect, useState } from 'react';
import { useTheme, Theme } from '../context/ThemeContext';
import { useUser } from '../context/UserContext';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

export default function ProfileSettingsPage() {
  const { theme, setTheme } = useTheme();
  const { role } = useUser();
  
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Editable fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('Male');
  
  // Expanded Personal Details
  const [alternativePhone, setAlternativePhone] = useState('');
  const [personalEmail, setPersonalEmail] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [fatherOccupation, setFatherOccupation] = useState('');
  const [motherName, setMotherName] = useState('');
  const [motherOccupation, setMotherOccupation] = useState('');
  const [permanentAddress, setPermanentAddress] = useState('');
  const [currentAddress, setCurrentAddress] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');
  
  // Password change fields
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [activeTab, setActiveTab] = useState<'personal' | 'academic' | 'help'>('personal');

  // Help & Corrections Query states
  const [queryCategory, setQueryCategory] = useState<'personal_info' | 'academic_info' | 'marks' | 'attendance' | 'fee_payments'>('personal_info');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);

  // Fetch current user details on mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const response = await axios.get(`${API_BASE_URL}/users/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = response.data;
        setProfile(data);
        
        // Populate inputs
        setFirstName(data.first_name || '');
        setLastName(data.last_name || '');
        setEmail(data.email || '');
        setPhone(data.phone || '');
        setAddress(data.address || '');
        setDob(data.dob || '');
        setGender(data.gender || 'Male');
        setAlternativePhone(data.alternative_phone || '');
        setPersonalEmail(data.personal_email || '');
        setFatherName(data.father_name || '');
        setFatherOccupation(data.father_occupation || '');
        setMotherName(data.mother_name || '');
        setMotherOccupation(data.mother_occupation || '');
        setPermanentAddress(data.permanent_address || '');
        setCurrentAddress(data.current_address || '');
        setBloodGroup(data.blood_group || '');
      } catch (err: any) {
        console.error('Failed to load profile details:', err);
        setError('Could not retrieve profile information. Ensure the backend is active.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  // Dynamically update default email subject based on selected query category
  useEffect(() => {
    if (profile) {
      const categoryLabel = {
        personal_info: 'Personal Information',
        academic_info: 'Academic Information',
        marks: 'Marks & Results',
        attendance: 'Attendance Record',
        fee_payments: 'Fee Payments',
      }[queryCategory];
      
      const identifier = profile.roll_no 
        ? `Student: ${firstName} ${lastName} (Roll: ${profile.roll_no})` 
        : `Staff: ${firstName} ${lastName} (Emp ID: ${profile.employee_id || 'N/A'})`;
        
      setEmailSubject(`Correction Query: ${categoryLabel} - ${identifier}`);
    }
  }, [queryCategory, profile, firstName, lastName]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.post(`${API_BASE_URL}/users/me/photo`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      });
      const newPhotoUrl = response.data.profile_photo;
      setSuccess('Profile photo uploaded successfully!');
      
      setProfile((prev: any) => ({
        ...prev,
        profile_photo: newPhotoUrl,
      }));
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to upload photo. Please try again.');
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password && password !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }

    setUpdatingProfile(true);

    try {
      const token = localStorage.getItem('access_token');
      const payload: any = {
        first_name: firstName,
        last_name: lastName,
        email: email,
        phone: phone,
        address: address,
        dob: dob,
        gender: gender,
        alternative_phone: alternativePhone,
        personal_email: personalEmail,
        father_name: fatherName,
        father_occupation: fatherOccupation,
        mother_name: motherName,
        mother_occupation: motherOccupation,
        permanent_address: permanentAddress,
        current_address: currentAddress,
        blood_group: bloodGroup
      };

      if (password) {
        payload.password = password;
      }

      await axios.put(`${API_BASE_URL}/users/me`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setSuccess('Profile details successfully saved to database!');
      setPassword('');
      setConfirmPassword('');
      
      // Update local profile state
      setProfile((prev: any) => ({
        ...prev,
        first_name: firstName,
        last_name: lastName,
        email: email,
        phone: phone,
        address: address,
        dob: dob,
        gender: gender,
        alternative_phone: alternativePhone,
        personal_email: personalEmail,
        father_name: fatherName,
        father_occupation: fatherOccupation,
        mother_name: motherName,
        mother_occupation: motherOccupation,
        permanent_address: permanentAddress,
        current_address: currentAddress,
        blood_group: bloodGroup
      }));
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to save changes. Please try again.');
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    const authority = profile?.authorities?.[queryCategory];
    if (!authority?.email) {
      setError('No contact email found for this authority.');
      return;
    }
    
    setSendingEmail(true);
    try {
      const token = localStorage.getItem('access_token');
      await axios.post(`${API_BASE_URL}/users/send-email`, {
        to_email: authority.email,
        subject: emailSubject,
        body: emailBody,
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setSuccess('Query email sent successfully to the respective authority!');
      setEmailBody('');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to dispatch email. SMTP server may be offline, but you can still contact them via their phone/email shown below.');
    } finally {
      setSendingEmail(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <svg className="animate-spin h-8 w-8 text-indigo-650" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">Profile Settings</h1>
        <p className="text-slate-400 dark:text-slate-500 text-xs mt-1">
          Review credentials, edit personal details, and configure layout themes.
        </p>
      </div>

      {success && (
        <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/25 p-4 text-xs text-emerald-650 dark:text-emerald-455 flex items-start gap-3">
          <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5" className="flex-shrink-0">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="font-bold leading-relaxed">{success}</span>
        </div>
      )}

      {error && (
        <div className="rounded-2xl bg-rose-500/10 border border-rose-500/25 p-4 text-xs text-rose-650 dark:text-rose-455 flex items-start gap-3">
          <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5" className="flex-shrink-0">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span className="font-semibold leading-relaxed">{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side: General Profile Status & Theme Selection */}
        <div className="space-y-6 lg:col-span-1">
          {/* Profile Card Summary */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 p-6 rounded-3xl shadow-sm text-center space-y-4">
            <div className="relative group mx-auto h-20 w-20">
              <div className="h-20 w-20 rounded-3xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-650 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/30 flex items-center justify-center text-3xl font-extrabold shadow-sm overflow-hidden">
                {profile?.profile_photo ? (
                  <img 
                    src={`${profile.profile_photo.startsWith('http') ? '' : 'http://localhost:8000'}${profile.profile_photo}`} 
                    alt="Profile" 
                    className="h-full w-full object-cover"
                  />
                ) : (
                  profile?.first_name?.charAt(0) || profile?.username?.charAt(0)?.toUpperCase()
                )}
              </div>
              <label 
                htmlFor="avatar-upload" 
                className="absolute inset-0 flex items-center justify-center bg-slate-950/70 rounded-3xl opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity text-white text-[10px] font-bold"
              >
                Change Photo
              </label>
              <input 
                id="avatar-upload" 
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={handlePhotoUpload}
              />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-base">
                {firstName} {lastName}
              </h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                {profile?.role?.toUpperCase()} | @{profile?.username}
              </p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 p-4.5 rounded-2xl text-left space-y-2.5 text-xs text-slate-600 dark:text-slate-405 font-semibold">
              {profile?.roll_no && (
                <div className="flex justify-between">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Roll No:</span>
                  <span>{profile?.roll_no}</span>
                </div>
              )}
              {profile?.enrollment_no && (
                <div className="flex justify-between">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Enrollment:</span>
                  <span>{profile?.enrollment_no}</span>
                </div>
              )}
              {profile?.employee_id && (
                <div className="flex justify-between">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Employee ID:</span>
                  <span>{profile?.employee_id}</span>
                </div>
              )}
              {profile?.dept_name && (
                <div className="flex justify-between">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Dept:</span>
                  <span>{profile?.dept_name}</span>
                </div>
              )}
              {profile?.course_name && (
                <div className="flex justify-between">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Course:</span>
                  <span>{profile?.course_name}</span>
                </div>
              )}
              {profile?.current_semester && (
                <div className="flex justify-between">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Semester:</span>
                  <span>Sem {profile?.current_semester}</span>
                </div>
              )}
            </div>
          </div>

          {/* Theme Selector Widget */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 p-6 rounded-3xl shadow-sm space-y-4">
            <div>
              <h3 className="font-extrabold text-slate-855 dark:text-slate-200 text-sm">Appearance Theme</h3>
              <p className="text-[11px] text-slate-400">Configure visual themes for Pathshala ERP</p>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'normal', name: 'Normal', desc: 'Standard Light', style: 'border-slate-200 text-slate-800 bg-white' },
                { id: 'dark', name: 'Dark', desc: 'Clean Obsidian', style: 'border-slate-800 text-slate-200 bg-slate-900' },
                { id: 'oiled', name: 'Oiled', desc: 'Bronze Accent', style: 'border-amber-900/40 text-amber-50 bg-[#1c1917]' },
                { id: 'night', name: 'Night', desc: 'Midnight Blue', style: 'border-slate-900 text-slate-100 bg-[#06060c]' },
              ].map((t) => {
                const isActive = theme === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTheme(t.id as Theme)}
                    className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all select-none hover:-translate-y-0.5 hover:shadow-md ${t.style} ${
                      isActive 
                        ? 'ring-2 ring-indigo-500 scale-100 shadow-md font-bold' 
                        : 'opacity-70 font-semibold'
                    }`}
                  >
                    <span className="text-xs font-black">{t.name}</span>
                    <span className="text-[9px] opacity-70 mt-1">{t.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Side: Profile Details Form & Password Change or Academic Info or Help & Corrections */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 p-6 md:p-8 rounded-3xl shadow-sm transition-colors">
            
            {/* Tabs Selector */}
            <div className="flex space-x-1 p-1 bg-slate-100 dark:bg-slate-950 rounded-2xl mb-6">
              <button
                type="button"
                onClick={() => setActiveTab('personal')}
                className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all ${
                  activeTab === 'personal'
                    ? 'bg-white dark:bg-slate-900 text-indigo-650 dark:text-indigo-400 shadow-sm border border-slate-200/40 dark:border-slate-800/40'
                    : 'text-slate-500 dark:text-slate-450 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Personal Information
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('academic')}
                className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all ${
                  activeTab === 'academic'
                    ? 'bg-white dark:bg-slate-900 text-indigo-650 dark:text-indigo-400 shadow-sm border border-slate-200/40 dark:border-slate-800/40'
                    : 'text-slate-500 dark:text-slate-450 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Academic Information
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('help')}
                className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all ${
                  activeTab === 'help'
                    ? 'bg-white dark:bg-slate-900 text-indigo-650 dark:text-indigo-400 shadow-sm border border-slate-200/40 dark:border-slate-800/40'
                    : 'text-slate-500 dark:text-slate-450 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Help & Corrections
              </button>
            </div>

            {activeTab === 'academic' ? (
              <div className="space-y-6">
                <div className="rounded-2xl bg-indigo-500/10 border border-indigo-500/25 p-4 text-xs text-indigo-650 dark:text-indigo-400 flex items-start gap-3">
                  <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5" className="flex-shrink-0">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-bold leading-relaxed">
                    Academic information is managed strictly by the registrar and department heads. For corrections, please use the Help & Corrections tab to contact the assigned authority.
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {role === 'student' ? (
                    <>
                      {/* Roll Number */}
                      <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800/60 p-4.5 rounded-2xl">
                        <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Roll Number</span>
                        <span className="text-sm font-extrabold text-slate-800 dark:text-slate-100">{profile?.roll_no || 'N/A'}</span>
                      </div>

                      {/* Enrollment Number */}
                      <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800/60 p-4.5 rounded-2xl">
                        <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Enrollment Number</span>
                        <span className="text-sm font-extrabold text-slate-800 dark:text-slate-100">{profile?.enrollment_no || 'N/A'}</span>
                      </div>

                      {/* Department */}
                      <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800/60 p-4.5 rounded-2xl">
                        <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Department</span>
                        <span className="text-sm font-extrabold text-slate-800 dark:text-slate-100">{profile?.dept_name || 'N/A'}</span>
                      </div>

                      {/* Course */}
                      <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800/60 p-4.5 rounded-2xl">
                        <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Course</span>
                        <span className="text-sm font-extrabold text-slate-800 dark:text-slate-100">{profile?.course_name || 'N/A'}</span>
                      </div>

                      {/* Semester */}
                      <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800/60 p-4.5 rounded-2xl">
                        <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Current Semester</span>
                        <span className="text-sm font-extrabold text-slate-800 dark:text-slate-100">Semester {profile?.current_semester || '1'}</span>
                      </div>

                      {/* Section */}
                      <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800/60 p-4.5 rounded-2xl">
                        <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Section</span>
                        <span className="text-sm font-extrabold text-slate-800 dark:text-slate-100">Section {profile?.section || 'A'}</span>
                      </div>

                      {/* Batch */}
                      <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800/60 p-4.5 rounded-2xl">
                        <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Batch</span>
                        <span className="text-sm font-extrabold text-slate-800 dark:text-slate-100">{profile?.batch || 'N/A'}</span>
                      </div>

                      {/* Pathshala Email */}
                      <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800/60 p-4.5 rounded-2xl sm:col-span-2">
                        <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Academic Email</span>
                        <span className="text-sm font-extrabold text-indigo-650 dark:text-indigo-400 break-all">{profile?.pathshala_email || profile?.email || 'N/A'}</span>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Employee ID */}
                      <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800/60 p-4.5 rounded-2xl">
                        <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Employee ID</span>
                        <span className="text-sm font-extrabold text-slate-800 dark:text-slate-100">{profile?.employee_id || 'N/A'}</span>
                      </div>

                      {/* Designation */}
                      <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800/60 p-4.5 rounded-2xl">
                        <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Designation</span>
                        <span className="text-sm font-extrabold text-slate-800 dark:text-slate-100">{profile?.designation || 'N/A'}</span>
                      </div>

                      {/* Department */}
                      <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800/60 p-4.5 rounded-2xl">
                        <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Department</span>
                        <span className="text-sm font-extrabold text-slate-800 dark:text-slate-100">{profile?.dept_name || 'N/A'}</span>
                      </div>

                      {/* Specialization */}
                      <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800/60 p-4.5 rounded-2xl">
                        <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Specialization</span>
                        <span className="text-sm font-extrabold text-slate-800 dark:text-slate-100">{profile?.specialization || 'N/A'}</span>
                      </div>

                      {/* Joining Batch */}
                      <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800/60 p-4.5 rounded-2xl">
                        <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Joining Batch</span>
                        <span className="text-sm font-extrabold text-slate-800 dark:text-slate-100">{profile?.batch || 'N/A'}</span>
                      </div>

                      {/* Pathshala Email */}
                      <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800/60 p-4.5 rounded-2xl">
                        <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Academic Email</span>
                        <span className="text-sm font-extrabold text-indigo-650 dark:text-indigo-400 break-all">{profile?.pathshala_email || profile?.email || 'N/A'}</span>
                      </div>

                      {/* If Class Counsellor or has assigned section, show section, course, semester */}
                      {profile?.section && (
                        <div className="bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 p-4.5 rounded-2xl sm:col-span-2 space-y-2">
                          <span className="block text-[10px] font-bold text-indigo-650 dark:text-indigo-400 uppercase tracking-wider">Counsellor Assignment (Active Section Control)</span>
                          <div className="grid grid-cols-3 gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                            <div>
                              <span className="block text-[9px] text-slate-400 font-bold uppercase">Course</span>
                              <span>{profile?.course_name || 'N/A'}</span>
                            </div>
                            <div>
                              <span className="block text-[9px] text-slate-400 font-bold uppercase">Semester</span>
                              <span>Semester {profile?.current_semester || 'N/A'}</span>
                            </div>
                            <div>
                              <span className="block text-[9px] text-slate-400 font-bold uppercase">Section</span>
                              <span>Section {profile?.section || 'N/A'}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            ) : activeTab === 'help' ? (
              <div className="space-y-6">
                <div className="rounded-2xl bg-indigo-500/10 border border-indigo-500/25 p-4 text-xs text-indigo-650 dark:text-indigo-400 flex items-start gap-3">
                  <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5" className="flex-shrink-0">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-bold leading-relaxed">
                    Have an issue or need corrections? Select a category to find the respective authority and send them an official correction query directly from the ERP.
                  </span>
                </div>

                {/* Category Selector */}
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-slate-455 dark:text-slate-450 uppercase tracking-wider">
                    Query / Correction Category
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {[
                      { id: 'personal_info', label: 'Personal Info' },
                      { id: 'academic_info', label: 'Academic Info' },
                      { id: 'marks', label: 'Marks & Results' },
                      { id: 'attendance', label: 'Attendance' },
                      { id: 'fee_payments', label: 'Fee Payments' }
                    ].map((cat) => {
                      const isSelected = queryCategory === cat.id;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setQueryCategory(cat.id as any)}
                          className={`p-2.5 rounded-xl border text-xs font-bold text-center transition-all ${
                            isSelected
                              ? 'bg-indigo-650 text-white border-transparent shadow-sm'
                              : 'bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900'
                          }`}
                        >
                          {cat.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Respective Authority Card */}
                {profile?.authorities?.[queryCategory] ? (
                  <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800/60 p-5 rounded-2xl space-y-4">
                    <div className="flex justify-between items-start border-b border-slate-200/60 dark:border-slate-800/60 pb-3">
                      <div>
                        <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Respective Authority</span>
                        <h4 className="text-sm font-extrabold text-indigo-650 dark:text-indigo-400">
                          {profile.authorities[queryCategory].name || 'N/A'}
                        </h4>
                      </div>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-650 dark:text-indigo-400 border border-indigo-150 dark:border-indigo-900/30 uppercase">
                        Assigned
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div className="flex items-center gap-2.5 font-semibold text-slate-700 dark:text-slate-350">
                        <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/40 dark:border-slate-800/40 text-slate-400">
                          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                        </div>
                        <div>
                          <span className="block text-[9px] text-slate-400 dark:text-slate-500 uppercase font-bold">Contact Number</span>
                          <span>{profile.authorities[queryCategory].phone || 'N/A'}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 font-semibold text-slate-700 dark:text-slate-350">
                        <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/40 dark:border-slate-800/40 text-slate-400">
                          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div className="min-w-0">
                          <span className="block text-[9px] text-slate-400 dark:text-slate-500 uppercase font-bold">Email ID</span>
                          <span className="block truncate">{profile.authorities[queryCategory].email || 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-600 font-bold">
                    No authority found for this category.
                  </div>
                )}

                {/* Email Send Tab Composer */}
                <form onSubmit={handleSendEmail} className="space-y-4">
                  <h4 className="text-xs font-extrabold text-slate-805 dark:text-slate-300 uppercase tracking-wider">
                    Compose Correction Query
                  </h4>

                  {/* To field (read only) */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-455 dark:text-slate-450 uppercase tracking-wider mb-2">
                      Recipient
                    </label>
                    <input
                      type="email"
                      readOnly
                      value={profile?.authorities?.[queryCategory]?.email || ''}
                      placeholder="No recipient email resolved"
                      className="block w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800/60 rounded-xl text-xs font-bold text-slate-500 dark:text-slate-450 focus:outline-none"
                    />
                  </div>

                  {/* Subject field */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-455 dark:text-slate-450 uppercase tracking-wider mb-2">
                      Subject
                    </label>
                    <input
                      type="text"
                      required
                      value={emailSubject}
                      onChange={(e) => setEmailSubject(e.target.value)}
                      placeholder="Query subject line"
                      className="block w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  {/* Body field */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-455 dark:text-slate-450 uppercase tracking-wider mb-2">
                      Query Description
                    </label>
                    <textarea
                      required
                      rows={5}
                      value={emailBody}
                      onChange={(e) => setEmailBody(e.target.value)}
                      placeholder="Please specify exactly what needs to be updated (e.g. 'My permanent address in profile is showing older house number. It should be changed to: ...')"
                      className="block w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={sendingEmail || !profile?.authorities?.[queryCategory]?.email}
                      className="px-6 py-3 border border-transparent text-xs font-bold rounded-xl text-white bg-indigo-650 hover:bg-indigo-655 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-md shadow-indigo-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {sendingEmail ? (
                        <>
                          <svg width="14" height="14" className="animate-spin text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          <span>Sending Query...</span>
                        </>
                      ) : (
                        <>
                          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" className="flex-shrink-0">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                          </svg>
                          <span>Send Query via Email</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <form onSubmit={handleProfileUpdate} className="space-y-6">
                {role === 'student' && (
                  <div className="rounded-2xl bg-indigo-500/10 border border-indigo-500/25 p-4 text-xs text-indigo-650 dark:text-indigo-400 flex items-start gap-3">
                    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5" className="flex-shrink-0">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="font-bold leading-relaxed">
                      Student profiles are read-only. You can view your personal details and update your profile photo, but other modifications must be processed by the registrar. For corrections, please use the Help & Corrections tab.
                    </span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* First Name */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-455 dark:text-slate-450 uppercase tracking-wider mb-2">
                      First Name
                    </label>
                    <input
                      type="text"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="block w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
                      disabled={role === 'student'}
                      title="First Name"
                      placeholder="Enter first name"
                    />
                  </div>

                  {/* Last Name */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-455 dark:text-slate-450 uppercase tracking-wider mb-2">
                      Last Name
                    </label>
                    <input
                      type="text"
                      required
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="block w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
                      disabled={role === 'student'}
                      title="Last Name"
                      placeholder="Enter last name"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Email */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-455 dark:text-slate-450 uppercase tracking-wider mb-2">
                      Official Email Address
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
                      disabled={role === 'student'}
                      title="Official Email Address"
                      placeholder="Enter official email"
                    />
                  </div>

                  {/* Personal Email */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-455 dark:text-slate-450 uppercase tracking-wider mb-2">
                      Personal Email ID
                    </label>
                    <input
                      type="email"
                      value={personalEmail}
                      onChange={(e) => setPersonalEmail(e.target.value)}
                      className="block w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
                      disabled={role === 'student'}
                      title="Personal Email ID"
                      placeholder="Enter personal email"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Contact Number */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-455 dark:text-slate-450 uppercase tracking-wider mb-2">
                      Contact Number
                    </label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Enter phone number"
                      className="block w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
                      disabled={role === 'student'}
                    />
                  </div>

                  {/* Alternate Contact Number */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-455 dark:text-slate-450 uppercase tracking-wider mb-2">
                      Alternate Contact Number
                    </label>
                    <input
                      type="text"
                      value={alternativePhone}
                      onChange={(e) => setAlternativePhone(e.target.value)}
                      placeholder="Enter alternate phone number"
                      className="block w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
                      disabled={role === 'student'}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Date of Birth */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-455 dark:text-slate-450 uppercase tracking-wider mb-2">
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                      className="block w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
                      disabled={role === 'student'}
                    />
                  </div>

                  {/* Gender */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-455 dark:text-slate-450 uppercase tracking-wider mb-2">
                      Gender
                    </label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="block w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
                      disabled={role === 'student'}
                      title="Gender"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  {/* Blood Group */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-455 dark:text-slate-450 uppercase tracking-wider mb-2">
                      Blood Group
                    </label>
                    <select
                      value={bloodGroup}
                      onChange={(e) => setBloodGroup(e.target.value)}
                      className="block w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
                      disabled={role === 'student'}
                      title="Blood Group"
                    >
                      <option value="">Select Blood Group</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Father's Name */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-455 dark:text-slate-450 uppercase tracking-wider mb-2">
                      Father's Name
                    </label>
                    <input
                      type="text"
                      value={fatherName}
                      onChange={(e) => setFatherName(e.target.value)}
                      placeholder="Father's full name"
                      className="block w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
                      disabled={role === 'student'}
                    />
                  </div>

                  {/* Father's Occupation */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-455 dark:text-slate-450 uppercase tracking-wider mb-2">
                      Father's Occupation
                    </label>
                    <input
                      type="text"
                      value={fatherOccupation}
                      onChange={(e) => setFatherOccupation(e.target.value)}
                      placeholder="Father's occupation"
                      className="block w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
                      disabled={role === 'student'}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Mother's Name */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-455 dark:text-slate-450 uppercase tracking-wider mb-2">
                      Mother's Name
                    </label>
                    <input
                      type="text"
                      value={motherName}
                      onChange={(e) => setMotherName(e.target.value)}
                      placeholder="Mother's full name"
                      className="block w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
                      disabled={role === 'student'}
                    />
                  </div>

                  {/* Mother's Occupation */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-455 dark:text-slate-450 uppercase tracking-wider mb-2">
                      Mother's Occupation
                    </label>
                    <input
                      type="text"
                      value={motherOccupation}
                      onChange={(e) => setMotherOccupation(e.target.value)}
                      placeholder="Mother's occupation"
                      className="block w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
                      disabled={role === 'student'}
                    />
                  </div>
                </div>

                {/* Current Address */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-455 dark:text-slate-450 uppercase tracking-wider mb-2">
                    Current Address
                  </label>
                  <textarea
                    rows={2}
                    value={currentAddress}
                    onChange={(e) => setCurrentAddress(e.target.value)}
                    placeholder="Enter current residential address..."
                    className="block w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
                    disabled={role === 'student'}
                  />
                </div>

                {/* Permanent Address */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-455 dark:text-slate-450 uppercase tracking-wider mb-2">
                    Permanent Address
                  </label>
                  <textarea
                    rows={2}
                    value={permanentAddress}
                    onChange={(e) => setPermanentAddress(e.target.value)}
                    placeholder="Enter permanent residential address..."
                    className="block w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
                    disabled={role === 'student'}
                  />
                </div>

                {/* Password update section (only for non-students) */}
                {role !== 'student' && (
                  <>
                    <div className="pt-4 border-t border-slate-150 dark:border-slate-850 space-y-4">
                      <h4 className="text-xs font-extrabold text-slate-805 dark:text-slate-300 uppercase tracking-wider">
                        Update Security Password
                      </h4>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-455 dark:text-slate-450 uppercase tracking-wider mb-2">
                            New Password
                          </label>
                          <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Leave blank to keep current"
                            className="block w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-455 dark:text-slate-450 uppercase tracking-wider mb-2">
                            Confirm New Password
                          </label>
                          <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Confirm new password"
                            className="block w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end pt-4 border-t border-slate-150 dark:border-slate-850">
                      <button
                        type="submit"
                        disabled={updatingProfile}
                        className="px-6 py-3 border border-transparent text-xs font-bold rounded-xl text-white bg-indigo-650 hover:bg-indigo-655 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-md shadow-indigo-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
                        title="Save Changes"
                      >
                        {updatingProfile ? (
                          <>
                            <svg width="14" height="14" className="animate-spin text-white" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            <span>Saving to Database...</span>
                          </>
                        ) : (
                          'Save Changes'
                        )}
                      </button>
                    </div>
                  </>
                )}
              </form>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}
