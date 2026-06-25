import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { generatePDFReport } from '../utils/pdfGenerator';

interface FeePaymentData {
  id: number;
  student_id: number;
  fee_structure_id: number;
  amount_paid: string;
  payment_date: string;
  payment_method: string;
  status: 'Pending' | 'Completed' | 'Failed';
}

export default function StudentFeesPage() {
  const [loading, setLoading] = useState(true);
  const [studentId, setStudentId] = useState<number | null>(null);
  const [studentName, setStudentName] = useState('');
  const [structureId, setStructureId] = useState<number | null>(null);
  const [totalTermFee, setTotalTermFee] = useState(0);
  const [payments, setPayments] = useState<FeePaymentData[]>([]);
  
  // Modal states
  const [showPayModal, setShowPayModal] = useState(false);
  const [feeAmount, setFeeAmount] = useState('15000');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const fetchFeeData = async () => {
    try {
      // 1. Get current student details
      const profileRes = await api.get('/users/me');
      const sId = profileRes.data.student_id;
      const sName = profileRes.data.first_name + ' ' + profileRes.data.last_name;
      const courseId = profileRes.data.course_id;

      if (!sId) {
        setLoading(false);
        return;
      }
      setStudentId(sId);
      setStudentName(sName);

      // 2. Get structures
      const structuresRes = await api.get('/fees/structures');
      const structures = structuresRes.data || [];
      const relevantStructure = structures.find((s: any) => s.course_id === courseId);
      
      if (relevantStructure) {
        setStructureId(relevantStructure.id);
        setTotalTermFee(parseFloat(relevantStructure.total_amount));
      } else {
        // fallback
        setTotalTermFee(50000);
      }

      // 3. Get payments list
      const paymentsRes = await api.get(`/fees/payments/${sId}`);
      setPayments(paymentsRes.data || []);
    } catch (err) {
      console.error("Failed to load fee information", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeeData();
  }, []);

  const totalPaid = payments.reduce((acc, curr) => {
    if (curr.status === 'Completed') {
      return acc + parseFloat(curr.amount_paid);
    }
    return acc;
  }, 0);

  const pendingBalance = Math.max(0, totalTermFee - totalPaid);

  const triggerReceiptDownload = (payment: FeePaymentData) => {
    window.open(`http://localhost:8000/api/v1/reports/print/fee/${payment.id}`, '_blank');
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId || !structureId) return;

    setIsProcessing(true);
    try {
      const payload = {
        student_id: studentId,
        fee_structure_id: structureId,
        amount_paid: parseFloat(feeAmount),
        payment_method: 'Credit/Debit Card',
        status: 'Completed'
      };

      const response = await api.post('/fees/payments', payload);
      const newPayment = response.data;
      
      // Instantly trigger download
      triggerReceiptDownload(newPayment);

      // Refresh list
      await fetchFeeData();

      // Show alert and reset
      setIsProcessing(false);
      setShowPayModal(false);
      setShowSuccess(true);
      setCardNumber('');
      setCardExpiry('');
      setCardCvv('');
      
      setTimeout(() => {
        setShowSuccess(false);
      }, 5000);
    } catch (err) {
      console.error("Payment failed", err);
      setIsProcessing(false);
      alert("Online payment transaction authorization failed. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="flex flex-col items-center gap-4">
          <svg width="32" height="32" className="animate-spin text-indigo-650" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-slate-450 text-xs font-bold uppercase tracking-wider">Syncing fees ledger...</span>
        </div>
      </div>
    );
  }

  if (studentId === null) {
    return (
      <div className="flex flex-col items-center justify-center py-24 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-3xl p-8 max-w-xl mx-auto space-y-4">
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-850 text-slate-400 dark:text-slate-500 border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-center">
          <svg width="32" height="32" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h3 className="font-extrabold text-slate-750 dark:text-slate-200 text-sm">Access Restricted</h3>
        <p className="text-slate-455 dark:text-slate-500 text-xs text-center max-w-xs leading-relaxed">
          Billing details are only accessible to enrolled student profile users.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200/80 dark:border-slate-800/80 pb-5">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Fees & Billing Ledger
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-455 mt-0.5">
            Monitor academic fees, caution deposits, and transactions
          </p>
        </div>
        <button
          onClick={() => setShowPayModal(true)}
          className="px-5 py-2.5 bg-indigo-650 hover:bg-indigo-600 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-2"
        >
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
          Make Online Payment
        </button>
      </div>

      {/* Success alert */}
      {showSuccess && (
        <div className="fixed bottom-5 right-5 z-50 bg-emerald-600 text-white px-5 py-3.5 rounded-2xl shadow-xl flex items-center gap-3 border border-emerald-500/20 animate-in fade-in slide-in-from-bottom-5">
          <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-xs font-bold">Payment approved! Transaction receipt downloaded and saved.</span>
        </div>
      )}

      {/* Balance stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-emerald-650/5 dark:bg-emerald-500/5 border border-emerald-500/20 p-6 rounded-3xl flex justify-between items-center bg-white dark:bg-slate-900 transition-colors">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-450 uppercase tracking-wider">
              Dues Paid This Term
            </span>
            <h3 className="text-3.5xl font-extrabold text-emerald-700 dark:text-emerald-455 tracking-tight">
              ₹{totalPaid.toLocaleString('en-IN')}.00
            </h3>
            <p className="text-[9px] text-emerald-500/80 font-bold uppercase">
              Amount Credited to ERP
            </p>
          </div>
          <span className="p-3.5 bg-emerald-500/10 rounded-2xl text-emerald-600 dark:text-emerald-400 border border-emerald-500/10">
            <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </span>
        </div>

        <div className="bg-indigo-650/5 dark:bg-indigo-500/5 border border-indigo-500/20 p-6 rounded-3xl flex justify-between items-center bg-white dark:bg-slate-900 transition-colors">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
              Pending Semester Balance
            </span>
            <h3 className="text-3.5xl font-extrabold text-indigo-700 dark:text-indigo-455 tracking-tight">
              ₹{pendingBalance.toLocaleString('en-IN')}.00
            </h3>
            <p className="text-[9px] text-indigo-500/80 font-bold uppercase">
              {pendingBalance === 0 ? "100% Cleared / On Time" : "Balance Outstanding"}
            </p>
          </div>
          <span className="p-3.5 bg-indigo-500/10 rounded-2xl text-indigo-600 dark:text-indigo-400 border border-indigo-500/10">
            <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2" />
            </svg>
          </span>
        </div>
      </div>

      {/* Invoice Ledger Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-3xl shadow-sm overflow-hidden transition-colors">
        <div className="p-6 border-b border-slate-100 dark:border-slate-850">
          <h3 className="font-extrabold text-slate-850 dark:text-slate-200 text-sm">Recent Fee Ledger Transactions</h3>
        </div>
        <div className="overflow-x-auto">
          {payments.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400 uppercase font-bold tracking-wider">
              No recent payments recorded in ledger
            </div>
          ) : (
            <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-850 text-left">
              <thead className="bg-slate-50/60 dark:bg-slate-950/40 border-b border-slate-100 dark:border-slate-800/80">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Transaction ID</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Receipt Date</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Method</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs text-slate-700 dark:text-slate-355 bg-white dark:bg-slate-900 transition-colors">
                {payments.map((txn) => (
                  <tr key={txn.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/20 transition-colors">
                    <td className="px-6 py-4 font-bold text-indigo-650 dark:text-indigo-400">TXN-{txn.id}</td>
                    <td className="px-6 py-4 font-semibold text-slate-400">{txn.payment_date}</td>
                    <td className="px-6 py-4 font-bold text-slate-600 dark:text-slate-400">{txn.payment_method}</td>
                    <td className="px-6 py-4 font-extrabold text-slate-900 dark:text-white">₹{parseFloat(txn.amount_paid).toLocaleString('en-IN')}.00</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-extrabold border ${
                        txn.status === 'Completed'
                          ? 'bg-emerald-500/10 text-emerald-555 border-emerald-500/20'
                          : txn.status === 'Pending'
                          ? 'bg-amber-500/10 text-amber-650 border-amber-500/20'
                          : 'bg-rose-500/10 text-rose-555 border-rose-500/20'
                      }`}>
                        {txn.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => triggerReceiptDownload(txn)}
                        className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/30 text-indigo-650 dark:text-indigo-400 rounded-lg font-bold text-[10px] transition-all border border-indigo-100 dark:border-indigo-900/20"
                      >
                        Download PDF
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Pay Modal */}
      {showPayModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden transform scale-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-5 bg-slate-50 dark:bg-slate-950 border-b border-slate-150 dark:border-slate-850 flex justify-between items-center">
              <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm">Make Online Payment</h3>
              <button
                onClick={() => setShowPayModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-350"
              >
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handlePaymentSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-[10px] font-bold text-slate-455 dark:text-slate-500 uppercase tracking-wider mb-2">
                  Amount (₹)
                </label>
                <input
                  type="number"
                  required
                  value={feeAmount}
                  onChange={(e) => setFeeAmount(e.target.value)}
                  className="block w-full px-4 py-2.5 bg-slate-55 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-455 dark:text-slate-500 uppercase tracking-wider mb-2">
                  Card Number
                </label>
                <input
                  type="text"
                  required
                  placeholder="xxxx xxxx xxxx xxxx"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  className="block w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider mb-2">
                    Expiry Date
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="MM / YY"
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(e.target.value)}
                    className="block w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-455 dark:text-slate-500 uppercase tracking-wider mb-2">
                    CVV Code
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="***"
                    maxLength={3}
                    value={cardCvv}
                    onChange={(e) => setCardCvv(e.target.value)}
                    className="block w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isProcessing}
                className="w-full mt-2 py-3 px-4 border border-transparent text-xs font-bold rounded-xl text-white bg-indigo-650 hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <svg width="16" height="16" className="animate-spin text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Securing transaction connection...</span>
                  </>
                ) : (
                  'Authorize Payment Gateway'
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
