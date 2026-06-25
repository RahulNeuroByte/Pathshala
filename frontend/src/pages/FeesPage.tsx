import React, { useEffect, useState } from 'react';
import { feeService, facultyService } from '../services/api';
import { useUser } from '../context/UserContext';
import { generatePDFReport } from '../utils/pdfGenerator';

interface FeePaymentData {
  id: number;
  student_name: string;
  roll_no: string;
  amount: number;
  date: string;
  method: string;
  status: string;
}

export default function FeesPage() {
  const { role } = useUser();
  const [activeTab, setActiveTab] = useState<'fees' | 'salaries'>('fees');
  const [structures, setStructures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Student fee payments
  const [payments, setPayments] = useState<FeePaymentData[]>([
    { id: 1, student_name: 'Aarav Kumar', roll_no: '2221001', amount: 95000, date: '2023-08-10', method: 'Online', status: 'Completed' },
    { id: 2, student_name: 'Vihaan Sharma', roll_no: '2221005', amount: 87000, date: '2023-08-12', method: 'Online', status: 'Completed' },
    { id: 3, student_name: 'Ananya Patel', roll_no: '2221010', amount: 110000, date: '2023-08-14', method: 'UPI', status: 'Completed' },
  ]);

  // Salary States
  const [salaries, setSalaries] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [salariesLoading, setSalariesLoading] = useState(false);
  const [showSalaryModal, setShowSalaryModal] = useState(false);
  const [salaryMonth, setSalaryMonth] = useState('June');
  const [salaryYear, setSalaryYear] = useState(2026);
  const [salaryProcessing, setSalaryProcessing] = useState(false);

  // Student Fee Collect Modal states
  const [isCollectModalOpen, setIsCollectModalOpen] = useState(false);
  const [newPayment, setNewPayment] = useState({
    student_name: '',
    roll_no: '',
    amount: '',
    payment_method: 'Online',
  });

  // Course name mapper
  const COURSES: { [key: number]: string } = {
    1: 'B.Tech CS (Computer Science)',
    2: 'B.Tech EC (Electronics)',
    3: 'B.Tech ME (Mechanical)',
    4: 'B.Tech CE (Civil)',
    5: 'B.Tech BA (Business Admin)'
  };

  const fetchSalariesAndEmployees = async () => {
    setSalariesLoading(true);
    try {
      const [salariesRes, facultyRes] = await Promise.all([
        feeService.getSalaries(),
        facultyService.getFaculty(),
      ]);
      setSalaries(salariesRes.data || []);
      setEmployees(facultyRes.data || []);
    } catch (err) {
      console.error("Failed to load salaries or faculty profiles", err);
    } finally {
      setSalariesLoading(false);
    }
  };

  useEffect(() => {
    const fetchFeeData = async () => {
      try {
        const response = await feeService.getStructures();
        setStructures(response.data || []);
      } catch (error) {
        console.error('Failed to fetch fee structures', error);
      } finally {
        setLoading(false);
      }
    };
    fetchFeeData();
    if (role === 'admin' || role === 'principal') {
      fetchSalariesAndEmployees();
    }
  }, [role]);

  const getEmployeeDetails = (userId: number) => {
    const emp = employees.find(e => e.user_id === userId);
    if (emp) {
      return {
        name: `${emp.first_name} ${emp.last_name}`,
        designation: emp.designation || 'Staff Member',
        employee_id: emp.employee_id
      };
    }
    return {
      name: `User ID: ${userId}`,
      designation: 'Employee',
      employee_id: 'N/A'
    };
  };

  const handleCollectFeeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payment: FeePaymentData = {
      id: payments.length + 1,
      student_name: newPayment.student_name,
      roll_no: newPayment.roll_no,
      amount: parseFloat(newPayment.amount),
      date: new Date().toISOString().split('T')[0],
      method: newPayment.payment_method,
      status: 'Completed',
    };
    setPayments([payment, ...payments]);
    setIsCollectModalOpen(false);
    setNewPayment({
      student_name: '',
      roll_no: '',
      amount: '',
      payment_method: 'Online',
    });
  };

  const handlePaySalariesSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSalaryProcessing(true);
    try {
      const res = await feeService.paySalaries(salaryMonth, salaryYear);
      alert(res.data?.message || `Processed salaries successfully for ${salaryMonth} ${salaryYear}.`);
      await fetchSalariesAndEmployees();
      setShowSalaryModal(false);
    } catch (err: any) {
      console.error("Failed to pay salaries", err);
      alert(err.response?.data?.detail || "Failed to process salary payments.");
    } finally {
      setSalaryProcessing(false);
    }
  };

  const triggerSalaryReceiptDownload = (sal: any) => {
    window.open(`http://localhost:8000/api/v1/reports/print/salary/${sal.id}`, '_blank');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto relative">
      
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">Financial Portal</h1>
          <p className="text-slate-400 dark:text-slate-500 text-xs mt-1">
            Manage course fee structures, student collections, and employee salary disbursements.
          </p>
        </div>
        
        {/* Actions Button */}
        {role === 'admin' && activeTab === 'fees' && (
          <button
            onClick={() => setIsCollectModalOpen(true)}
            className="flex items-center justify-center px-4 py-2.5 text-xs font-bold text-white bg-indigo-650 hover:bg-indigo-500 rounded-xl transition-all shadow-md shadow-indigo-650/20 gap-2"
          >
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5h7M9 9h7M9 5a4 4 0 0 1 0 8h3L16 19" />
            </svg>
            Collect Payment
          </button>
        )}

        {role === 'admin' && activeTab === 'salaries' && (
          <button
            onClick={() => setShowSalaryModal(true)}
            className="flex items-center justify-center px-4 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-all shadow-md gap-2"
          >
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Disburse Monthly Salaries
          </button>
        )}
      </div>

      {/* Tabs Selector (Admin / Principal only) */}
      {(role === 'admin' || role === 'principal') && (
        <div className="flex border-b border-slate-200 dark:border-slate-800 gap-4">
          <button
            onClick={() => setActiveTab('fees')}
            className={`pb-3 text-xs font-extrabold uppercase tracking-wider transition-all border-b-2 px-2 ${
              activeTab === 'fees'
                ? 'border-indigo-650 text-indigo-650 dark:text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            Student Fees Ledger
          </button>
          <button
            onClick={() => setActiveTab('salaries')}
            className={`pb-3 text-xs font-extrabold uppercase tracking-wider transition-all border-b-2 px-2 ${
              activeTab === 'salaries'
                ? 'border-indigo-650 text-indigo-650 dark:text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            Employee Salaries Portal
          </button>
        </div>
      )}

      {activeTab === 'fees' ? (
        <>
          {/* Info Card Banner Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-r from-indigo-600 to-indigo-550 p-6 rounded-3xl text-white shadow-md space-y-2">
              <span className="text-2xl">💰</span>
              <h3 className="font-extrabold text-lg">Tuition Rates</h3>
              <p className="text-indigo-100 text-xs">Standardized pricing schema across semesters for 2023-24.</p>
            </div>
            <div className="bg-gradient-to-r from-emerald-600 to-emerald-550 p-6 rounded-3xl text-white shadow-md space-y-2">
              <span className="text-2xl">📊</span>
              <h3 className="font-extrabold text-lg">Ledger Collections</h3>
              <p className="text-emerald-100 text-xs">Seamless digital billing processing for netbanking and card channels.</p>
            </div>
            <div className="bg-gradient-to-r from-purple-600 to-purple-550 p-6 rounded-3xl text-white shadow-md space-y-2">
              <span className="text-2xl">🔒</span>
              <h3 className="font-extrabold text-lg">Financial Audit</h3>
              <p className="text-purple-100 text-xs">Compliant with general education audits and payment protocols.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Side: Fee Structures Table */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-3xl shadow-sm overflow-hidden lg:col-span-2 p-6 space-y-5 transition-colors">
              <h3 className="font-extrabold text-slate-850 dark:text-slate-200 text-base">Course Tuition Tariffs</h3>
              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <svg className="animate-spin h-6 w-6 text-indigo-650" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800 text-left text-xs">
                    <thead className="bg-slate-55/60 dark:bg-slate-950/40">
                      <tr>
                        <th className="px-5 py-3.5 font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Course Program</th>
                        <th className="px-5 py-3.5 font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Term</th>
                        <th className="px-5 py-3.5 font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-right">Annual Tariff</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {structures.map((struct) => (
                        <tr key={struct.id} className="hover:bg-slate-50/30 dark:hover:bg-slate-850/20">
                          <td className="px-5 py-4 font-bold text-slate-700 dark:text-slate-350">{COURSES[struct.course_id] || `Course ${struct.course_id}`}</td>
                          <td className="px-5 py-4 text-slate-450 dark:text-slate-500 font-semibold">{struct.academic_year}</td>
                          <td className="px-5 py-4 font-extrabold text-slate-800 dark:text-slate-200 text-right font-mono">₹{parseFloat(struct.total_amount).toLocaleString('en-IN')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Right Side: Recent Transactions Ledger */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-3xl shadow-sm p-6 space-y-5 transition-colors">
              <h3 className="font-extrabold text-slate-850 dark:text-slate-200 text-base">Collections Stream</h3>
              
              <div className="space-y-4">
                {payments.map((pm) => (
                  <div key={pm.id} className="flex justify-between items-center p-4 bg-slate-50 dark:bg-slate-955 border border-slate-100 dark:border-slate-850 rounded-2xl">
                    <div className="space-y-1">
                      <p className="text-xs font-extrabold text-slate-750 dark:text-slate-250 leading-none">{pm.student_name}</p>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">{pm.roll_no} • {pm.method}</span>
                    </div>
                    <div className="text-right space-y-1">
                      <p className="text-xs font-black text-emerald-600 dark:text-emerald-400 font-mono">+₹{pm.amount.toLocaleString('en-IN')}</p>
                      <span className="inline-flex px-1.5 py-0.5 text-[9px] font-extrabold text-emerald-500 bg-emerald-500/10 border border-emerald-500/25 rounded-md uppercase">
                        {pm.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </>
      ) : (
        /* Salaries Tab content */
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-r from-teal-600 to-teal-550 p-6 rounded-3xl text-white shadow-md space-y-2">
              <span className="text-2xl">💼</span>
              <h3 className="font-extrabold text-lg">Total Disbursed</h3>
              <p className="text-teal-100 text-xs">Disbursed salary payroll record tallying ₹{salaries.reduce((acc, curr) => acc + parseFloat(curr.amount || 0), 0).toLocaleString('en-IN')}.00</p>
            </div>
            <div className="bg-gradient-to-r from-blue-600 to-blue-550 p-6 rounded-3xl text-white shadow-md space-y-2">
              <span className="text-2xl">🤝</span>
              <h3 className="font-extrabold text-lg">Paid Employees</h3>
              <p className="text-blue-100 text-xs">Total employee count paid successfully this session: {salaries.length} records.</p>
            </div>
            <div className="bg-gradient-to-r from-indigo-600 to-indigo-550 p-6 rounded-3xl text-white shadow-md space-y-2">
              <span className="text-2xl">📁</span>
              <h3 className="font-extrabold text-lg">SMTP Logs</h3>
              <p className="text-indigo-100 text-xs">Automatic email dispatch is triggered upon payroll processing verification.</p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-3xl shadow-sm overflow-hidden p-6 space-y-5 transition-colors">
            <h3 className="font-extrabold text-slate-850 dark:text-slate-200 text-base">Employee Payroll Register</h3>
            
            {salariesLoading ? (
              <div className="flex items-center justify-center py-20">
                <svg className="animate-spin h-6 w-6 text-indigo-650" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              </div>
            ) : salaries.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-400 uppercase font-bold tracking-wider">
                No salary payments recorded in system
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800 text-left text-xs">
                  <thead className="bg-slate-55/60 dark:bg-slate-950/40">
                    <tr>
                      <th className="px-5 py-3.5 font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Employee Name</th>
                      <th className="px-5 py-3.5 font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Employee ID</th>
                      <th className="px-5 py-3.5 font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Role</th>
                      <th className="px-5 py-3.5 font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Term</th>
                      <th className="px-5 py-3.5 font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Amount Paid</th>
                      <th className="px-5 py-3.5 font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Pay Date</th>
                      <th className="px-5 py-3.5 font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-right">Receipt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {salaries.map((sal) => {
                      const details = getEmployeeDetails(sal.user_id);
                      return (
                        <tr key={sal.id} className="hover:bg-slate-50/30 dark:hover:bg-slate-850/20">
                          <td className="px-5 py-4 font-bold text-slate-700 dark:text-slate-350">{details.name}</td>
                          <td className="px-5 py-4 font-mono font-semibold text-slate-455">{details.employee_id}</td>
                          <td className="px-5 py-4 font-semibold text-slate-450">{details.designation}</td>
                          <td className="px-5 py-4 text-slate-500 font-semibold">{sal.month} {sal.year}</td>
                          <td className="px-5 py-4 font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">₹{parseFloat(sal.amount).toLocaleString('en-IN')}.00</td>
                          <td className="px-5 py-4 font-semibold text-slate-400">{sal.payment_date}</td>
                          <td className="px-5 py-4 text-right">
                            <button
                              onClick={() => triggerSalaryReceiptDownload(sal)}
                              className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/30 text-indigo-650 dark:text-indigo-400 rounded-lg font-bold text-[10px] transition-all border border-indigo-100 dark:border-indigo-900/20"
                            >
                              Download Payslip
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Collect Fee Modal */}
      {isCollectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={() => setIsCollectModalOpen(false)} />
          
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl relative z-10 space-y-6">
            <div>
              <h3 className="text-lg font-extrabold text-slate-850 dark:text-slate-200">Collect Course Payment</h3>
              <p className="text-xs text-slate-455 dark:text-slate-500 mt-1">Record a manual collection verification entry for billing audits.</p>
            </div>

            <form onSubmit={handleCollectFeeSubmit} className="space-y-5">
              
              <div className="relative">
                <input
                  type="text" required id="student_name"
                  value={newPayment.student_name}
                  onChange={(e) => setNewPayment({ ...newPayment, student_name: e.target.value })}
                  className="block px-3.5 pb-2.5 pt-4.5 w-full text-xs text-slate-800 dark:text-slate-250 bg-slate-55 dark:bg-slate-955 rounded-xl border border-slate-250 dark:border-slate-800 appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all peer"
                  placeholder=" "
                />
                <label
                  htmlFor="student_name"
                  className="absolute text-[10px] text-slate-455 dark:text-slate-500 duration-200 transform -translate-y-3.5 scale-90 top-2 z-10 origin-[0] bg-white dark:bg-slate-900 px-1.5 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-2 peer-placeholder-shown:top-2 peer-focus:-translate-y-3.5 peer-focus:top-2 peer-focus:scale-90 left-2.5"
                >
                  Student Name
                </label>
              </div>

              <div className="relative">
                <input
                  type="text" required id="roll_no"
                  value={newPayment.roll_no}
                  onChange={(e) => setNewPayment({ ...newPayment, roll_no: e.target.value })}
                  className="block px-3.5 pb-2.5 pt-4.5 w-full text-xs text-slate-800 dark:text-slate-250 bg-slate-55 dark:bg-slate-955 rounded-xl border border-slate-250 dark:border-slate-800 appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all peer"
                  placeholder=" "
                />
                <label
                  htmlFor="roll_no"
                  className="absolute text-[10px] text-slate-455 dark:text-slate-500 duration-200 transform -translate-y-3.5 scale-90 top-2 z-10 origin-[0] bg-white dark:bg-slate-900 px-1.5 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-2 peer-placeholder-shown:top-2 peer-focus:-translate-y-3.5 peer-focus:top-2 peer-focus:scale-90 left-2.5"
                >
                  Student Roll No
                </label>
              </div>

              <div className="relative">
                <input
                  type="number" required id="amount"
                  value={newPayment.amount}
                  onChange={(e) => setNewPayment({ ...newPayment, amount: e.target.value })}
                  className="block px-3.5 pb-2.5 pt-4.5 w-full text-xs text-slate-800 dark:text-slate-250 bg-slate-55 dark:bg-slate-955 rounded-xl border border-slate-250 dark:border-slate-800 appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all peer"
                  placeholder=" "
                />
                <label
                  htmlFor="amount"
                  className="absolute text-[10px] text-slate-455 dark:text-slate-500 duration-200 transform -translate-y-3.5 scale-90 top-2 z-10 origin-[0] bg-white dark:bg-slate-900 px-1.5 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-2 peer-placeholder-shown:top-2 peer-focus:-translate-y-3.5 peer-focus:top-2 peer-focus:scale-90 left-2.5"
                >
                  Payment Amount (₹)
                </label>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                  Payment Mode
                </label>
                <select
                  value={newPayment.payment_method}
                  onChange={(e) => setNewPayment({ ...newPayment, payment_method: e.target.value })}
                  className="block w-full px-3 py-3 bg-slate-55 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-xl text-slate-750 dark:text-slate-355 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent cursor-pointer"
                >
                  <option value="Online">Online Bank Transfer</option>
                  <option value="UPI">UPI (GPay / PhonePe)</option>
                  <option value="Card">Credit/Debit Card</option>
                  <option value="Cash">Cash Ledger</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCollectModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs font-bold text-white bg-indigo-650 hover:bg-indigo-500 rounded-xl transition-all shadow-md shadow-indigo-650/20"
                >
                  Confirm Payment
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Salary Disbursement Modal */}
      {showSalaryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={() => setShowSalaryModal(false)} />
          
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-sm p-6 shadow-2xl relative z-10 space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <div>
              <h3 className="text-base font-extrabold text-slate-850 dark:text-slate-200">Disburse Monthly Payroll</h3>
              <p className="text-xs text-slate-455 dark:text-slate-500 mt-1">This will process salaries for all registered HOD, Faculty, Librarian, CC users and log email dispatches.</p>
            </div>

            <form onSubmit={handlePaySalariesSubmit} className="space-y-4">
              
              <div>
                <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                  Select Month
                </label>
                <select
                  value={salaryMonth}
                  onChange={(e) => setSalaryMonth(e.target.value)}
                  className="block w-full px-3 py-2.5 bg-slate-55 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-750 dark:text-slate-355 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer font-semibold"
                >
                  {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                  Select Year
                </label>
                <input
                  type="number"
                  value={salaryYear}
                  onChange={(e) => setSalaryYear(parseInt(e.target.value) || 2026)}
                  className="block w-full px-3 py-2.5 bg-slate-55 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-750 dark:text-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowSalaryModal(false)}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={salaryProcessing}
                  className="px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-all shadow-md disabled:opacity-50"
                >
                  {salaryProcessing ? 'Disbursing...' : 'Disburse Salaries'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
