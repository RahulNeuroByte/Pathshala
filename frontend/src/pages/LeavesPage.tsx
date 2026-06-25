import React, { useEffect, useState } from 'react';
import { leaveService } from '../services/api';
import { useUser } from '../context/UserContext';
import { generatePDFReport } from '../utils/pdfGenerator';

interface LeaveRequest {
  id: number;
  user_id: number;
  leave_type: string;
  start_date: string;
  end_date: string;
  reason: string;
  status: string;
  applicant_name: string;
  applicant_role: string;
}

export default function LeavesPage() {
  const { role } = useUser();
  
  // State
  const [myLeaves, setMyLeaves] = useState<LeaveRequest[]>([]);
  const [pendingLeaves, setPendingLeaves] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Leave Application Form State
  const [leaveType, setLeaveType] = useState('Casual Leave');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchLeaves = async () => {
    try {
      const myRes = await leaveService.getMyLeaves();
      setMyLeaves(myRes.data || []);
      
      // If the user role is an approver, fetch pending leaves
      const approverRoles = ['admin', 'principal', 'hod', 'class_counsellor'];
      if (approverRoles.includes(role)) {
        const pendingRes = await leaveService.getPendingLeaves();
        setPendingLeaves(pendingRes.data || []);
      }
    } catch (err) {
      console.error('Failed to load leaves data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, [role]);

  const handleApplyLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate || !reason.trim()) {
      setMessage({ type: 'error', text: 'All fields are required.' });
      return;
    }
    
    setSubmitting(true);
    setMessage(null);
    try {
      await leaveService.applyLeave({
        leave_type: leaveType,
        start_date: startDate,
        end_date: endDate,
        reason: reason
      });
      setMessage({ type: 'success', text: 'Leave application submitted successfully!' });
      setStartDate('');
      setEndDate('');
      setReason('');
      fetchLeaves();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.detail || 'Failed to submit leave request.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async (id: number) => {
    try {
      await leaveService.approveLeave(id);
      fetchLeaves();
    } catch (err) {
      console.error('Failed to approve leave request', err);
    }
  };

  const handleReject = async (id: number) => {
    try {
      await leaveService.rejectLeave(id);
      fetchLeaves();
    } catch (err) {
      console.error('Failed to reject leave request', err);
    }
  };

  const handleDownloadCertificate = (leave: LeaveRequest) => {
    window.open(`http://localhost:8000/api/v1/reports/print/leave/${leave.id}`, '_blank');
  };

  const getStatusBadge = (status: string) => {
    const s = status.toLowerCase();
    if (s === 'approved') return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
    if (s === 'rejected') return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
    return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
  };

  const getRoleLabel = (roleStr: string) => {
    if (!roleStr) return 'Staff';
    const r = roleStr.toLowerCase();
    if (r === 'principal') return 'Principal';
    if (r === 'hod') return 'Head of Department';
    if (r === 'class_counsellor') return 'Class Counsellor';
    if (r === 'librarian') return 'Librarian';
    if (r === 'faculty') return 'Faculty Member';
    if (r === 'student') return 'Student';
    return roleStr;
  };

  const canApprove = ['admin', 'principal', 'hod', 'class_counsellor'].includes(role);

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
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200/80 dark:border-slate-800/80 pb-5">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Leave Portal
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-450 mt-0.5">
            Apply for academic or administrative leaves and manage approvals matching your hierarchy.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Apply Form */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-3xl p-6 shadow-sm h-fit">
          <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest border-b border-slate-100 dark:border-slate-850 pb-3 mb-4">
            Apply for Leave
          </h3>
          
          {message && (
            <div className={`p-3 rounded-xl text-xs font-bold border mb-4 ${
              message.type === 'success'
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
            }`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleApplyLeave} className="space-y-4">
            <div>
              <label className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">Leave Type</label>
              <select
                value={leaveType}
                onChange={e => setLeaveType(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                title="Select Leave Type"
              >
                <option value="Casual Leave">Casual Leave</option>
                <option value="Medical Leave">Medical Leave</option>
                <option value="Duty Leave">Duty Leave</option>
                <option value="Maternity/Paternity Leave">Maternity/Paternity Leave</option>
                <option value="Semester Break Off">Semester Break Off</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">Start Date</label>
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  title="Select Start Date"
                />
              </div>
              <div>
                <label className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">End Date</label>
                <input
                  type="date"
                  required
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  title="Select End Date"
                />
              </div>
            </div>

            <div>
              <label className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">Reason for Leave</label>
              <textarea
                required
                rows={4}
                placeholder="Explain the reason for leave..."
                value={reason}
                onChange={e => setReason(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 text-xs font-bold text-white bg-indigo-650 hover:bg-indigo-500 rounded-xl transition-all shadow-md shadow-indigo-650/20 flex items-center justify-center gap-2"
            >
              {submitting ? 'Submitting...' : 'Apply for Leave'}
            </button>
          </form>
        </div>

        {/* Right Column: Lists */}
        <div className="lg:col-span-8 space-y-8">
          {/* Pending Approvals Section (Only for HOD, Principal, CC, Admin) */}
          {canApprove && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-3xl p-6 shadow-sm">
              <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest border-b border-slate-100 dark:border-slate-850 pb-3 mb-4 flex items-center justify-between">
                <span>Pending Leave Approvals</span>
                <span className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full text-[9px] font-extrabold">
                  {pendingLeaves.length} pending
                </span>
              </h3>
              
              <div className="space-y-4">
                {pendingLeaves.length > 0 ? (
                  pendingLeaves.map(leave => (
                    <div
                      key={leave.id}
                      className="p-4 bg-slate-50/50 dark:bg-slate-950/20 border border-slate-200/40 dark:border-slate-800/40 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:shadow-sm transition-all"
                    >
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-extrabold text-slate-850 dark:text-slate-200">
                            {leave.applicant_name}
                          </span>
                          <span className="text-[9px] font-extrabold uppercase bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200/30 text-slate-500">
                            {getRoleLabel(leave.applicant_role)}
                          </span>
                          <span className="text-[9px] font-bold text-indigo-650 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/35 px-2 py-0.5 rounded-md">
                            {leave.leave_type}
                          </span>
                        </div>
                        <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 leading-relaxed">
                          <strong className="text-slate-400">Duration:</strong>{' '}
                          {new Date(leave.start_date).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })} to{' '}
                          {new Date(leave.end_date).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </p>
                        <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                          <strong className="text-slate-450 uppercase text-[9px] tracking-wider block mb-0.5">Reason:</strong>
                          {leave.reason}
                        </p>
                      </div>
                      
                      <div className="flex gap-2 shrink-0 self-end md:self-center">
                        <button
                          onClick={() => handleReject(leave.id)}
                          className="px-3 py-1.5 text-xs font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 rounded-xl border border-rose-100 dark:border-rose-900/30 transition-all"
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => handleApprove(leave.id)}
                          className="px-3 py-1.5 text-xs font-bold text-emerald-650 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 rounded-xl border border-emerald-100 dark:border-emerald-900/30 transition-all shadow-sm"
                        >
                          Approve
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center py-8 text-slate-400 dark:text-slate-500 text-xs font-bold">
                    No pending leaves in your approval scope.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* My Leave Requests Section */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-3xl p-6 shadow-sm">
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest border-b border-slate-100 dark:border-slate-850 pb-3 mb-4">
              My Leave Requests
            </h3>
            
            <div className="space-y-4">
              {myLeaves.length > 0 ? (
                myLeaves.map(leave => (
                  <div
                    key={leave.id}
                    className="p-4 bg-slate-50/30 dark:bg-slate-950/10 border border-slate-150/40 dark:border-slate-800/30 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          {leave.leave_type}
                        </span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-extrabold border ${getStatusBadge(leave.status)}`}>
                          {leave.status.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                        <strong>Period:</strong>{' '}
                        {new Date(leave.start_date).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })} to{' '}
                        {new Date(leave.end_date).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </p>
                      <p className="text-xs font-medium text-slate-550 dark:text-slate-450">
                        <strong>Reason:</strong> {leave.reason}
                      </p>
                      {leave.status.toLowerCase() === 'approved' && (
                        <button
                          onClick={() => handleDownloadCertificate(leave)}
                          className="mt-2 flex items-center justify-center px-3 py-1.5 text-[10px] font-bold text-white bg-indigo-650 hover:bg-indigo-500 rounded-lg transition-all shadow-sm shadow-indigo-650/10 gap-1.5"
                        >
                          <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                          Download Certificate (PDF)
                        </button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center py-8 text-slate-400 dark:text-slate-500 text-xs font-bold">
                  You haven't submitted any leave requests yet.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
