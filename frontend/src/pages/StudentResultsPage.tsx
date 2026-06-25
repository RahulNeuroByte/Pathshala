import React, { useState, useEffect } from 'react';
import { generatePDFReport } from '../utils/pdfGenerator';
import api from '../services/api';

const ROMAN_SEMS = ["", "Semester I", "Semester II", "Semester III", "Semester IV", "Semester V", "Semester VI", "Semester VII", "Semester VIII"];

interface CourseResult {
  code: string;
  name: string;
  credits: number;
  grade: string;
  points: number;
  marksObtained: number;
  maxMarks: number;
  status: 'PASSED' | 'FAILED';
}

export default function StudentResultsPage() {
  const [loading, setLoading] = useState(true);
  const [resultsData, setResultsData] = useState<Record<string, { gpa: string; courses: CourseResult[] }>>({});
  const [availableSems, setAvailableSems] = useState<string[]>([]);
  const [selectedSem, setSelectedSem] = useState('');
  const [cgpa, setCgpa] = useState('0.00');
  const [totalCredits, setTotalCredits] = useState(0);
  const [studentId, setStudentId] = useState<number | null>(null);

  // Helper to map percent to grade and points
  const getGradeDetails = (marks: number, maxMarks: number) => {
    const percent = (marks / maxMarks) * 100;
    if (percent >= 89) return { grade: 'O', points: 10, status: 'PASSED' as const };
    if (percent >= 79) return { grade: 'A+', points: 9, status: 'PASSED' as const };
    if (percent >= 70) return { grade: 'A', points: 8, status: 'PASSED' as const };
    if (percent >= 60) return { grade: 'B+', points: 7, status: 'PASSED' as const };
    if (percent >= 50) return { grade: 'B', points: 6, status: 'PASSED' as const };
    if (percent >= 45) return { grade: 'C', points: 5, status: 'PASSED' as const };
    if (percent >= 40) return { grade: 'P', points: 4, status: 'PASSED' as const };
    return { grade: 'F', points: 0, status: 'FAILED' as const };
  };

  useEffect(() => {
    const fetchGrades = async () => {
      try {
        // 1. Get student ID
        const profileRes = await api.get('/users/me');
        const sId = profileRes.data.student_id;
        setStudentId(sId);
        if (!sId) {
          setLoading(false);
          return;
        }

        // 2. Fetch results
        const resultsRes = await api.get(`/exams/results/${studentId}`);
        const rawResults = resultsRes.data || [];

        // 3. Process results and group by Semester
        const grouped: Record<string, CourseResult[]> = {};
        let cumulativeCredits = 0;
        
        rawResults.forEach((res: any) => {
          const match = res.subject_name.match(/\(Sem (\d+)\)/);
          const semNum = match ? parseInt(match[1]) : 1;
          const semName = ROMAN_SEMS[semNum] || `Semester ${semNum}`;

          const { grade, points, status } = getGradeDetails(res.marks_obtained, res.max_marks);
          
          const courseResult: CourseResult = {
            code: res.subject_code,
            name: res.subject_name.replace(/\s*\(Sem\s*\d+\)/, ''), // clean name
            credits: res.subject_credits || 4,
            grade: grade,
            points: points,
            marksObtained: res.marks_obtained,
            maxMarks: res.max_marks,
            status: status
          };

          if (!grouped[semName]) {
            grouped[semName] = [];
          }
          grouped[semName].push(courseResult);
          
          if (status === 'PASSED') {
            cumulativeCredits += (res.subject_credits || 4);
          }
        });

        // 4. Calculate GPA for each Semester
        const semDetails: Record<string, { gpa: string; courses: CourseResult[] }> = {};
        const semGpas: number[] = [];

        Object.keys(grouped).forEach(sem => {
          const courses = grouped[sem];
          let totalPts = 0;
          let totalCreds = 0;
          courses.forEach(c => {
            totalPts += c.points * c.credits;
            totalCreds += c.credits;
          });
          const gpa = totalCreds > 0 ? (totalPts / totalCreds).toFixed(2) : '0.00';
          semDetails[sem] = {
            gpa: gpa,
            courses: courses
          };
          semGpas.push(parseFloat(gpa));
        });

        // Calculate CGPA
        const overallCgpa = semGpas.length > 0 ? (semGpas.reduce((a, b) => a + b, 0) / semGpas.length).toFixed(2) : '0.00';

        const sortedSems = Object.keys(semDetails).sort((a, b) => {
          const idxA = ROMAN_SEMS.indexOf(a);
          const idxB = ROMAN_SEMS.indexOf(b);
          return idxA - idxB;
        });

        setResultsData(semDetails);
        setAvailableSems(sortedSems);
        if (sortedSems.length > 0) {
          setSelectedSem(sortedSems[0]);
        }
        setCgpa(overallCgpa);
        setTotalCredits(cumulativeCredits);
      } catch (error) {
        console.error("Failed to fetch exam results", error);
      } finally {
        setLoading(false);
      }
    };

    fetchGrades();
  }, []);

  const activeResults = resultsData[selectedSem] || { gpa: '0.00', courses: [] };

  const handleDownloadPDF = () => {
    if (!studentId || !selectedSem) return;
    window.open(`http://localhost:8000/api/v1/reports/print/transcript/${studentId}/${selectedSem}`, '_blank');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="flex flex-col items-center gap-4">
          <svg width="32" height="32" className="animate-spin text-indigo-650" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-slate-450 text-xs font-bold uppercase tracking-wider">Syncing grades ledger...</span>
        </div>
      </div>
    );
  }

  if (availableSems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-3xl p-8 max-w-xl mx-auto space-y-4">
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-850 text-slate-400 dark:text-slate-500 border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-center">
          <svg width="32" height="32" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h3 className="font-extrabold text-slate-750 dark:text-slate-200 text-sm">No Academic Grades Recorded</h3>
        <p className="text-slate-455 dark:text-slate-500 text-xs text-center max-w-xs leading-relaxed">
          You currently do not have any published exam result logs. Please contact the administrator or subjects faculty.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200/80 dark:border-slate-800/80 pb-5">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Academic Transcript & Grades
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-450 mt-0.5">
            Access your finalized term grades and cumulative progress cards
          </p>
        </div>
        
        {/* Actions header group */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleDownloadPDF}
            disabled={activeResults.courses.length === 0}
            className="flex items-center justify-center px-4 py-2.5 text-xs font-bold text-white bg-indigo-650 hover:bg-indigo-500 rounded-xl transition-all shadow-md shadow-indigo-650/20 gap-2 disabled:opacity-50"
          >
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download Marksheet
          </button>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Semester:
            </span>
            <select
              value={selectedSem}
              onChange={(e) => setSelectedSem(e.target.value)}
              className="px-4 py-2 bg-white dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-700 dark:text-slate-355 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
              title="Select Semester"
            >
              {availableSems.map(sem => (
                <option key={sem} value={sem}>{sem}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Overview GPA card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-indigo-650/5 dark:bg-indigo-500/5 border border-indigo-500/20 p-6 rounded-3xl flex justify-between items-center md:col-span-1">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
              Semester GPA
            </span>
            <h3 className="text-3.5xl font-extrabold text-indigo-700 dark:text-indigo-455 tracking-tight">
              {activeResults.gpa}
            </h3>
            <p className="text-[9px] text-indigo-500/80 font-bold uppercase">
              {parseFloat(activeResults.gpa) >= 8.5 ? "First Class Distinction" : parseFloat(activeResults.gpa) >= 6.5 ? "First Class" : "Passed"}
            </p>
          </div>
          <span className="p-3 bg-indigo-500/10 rounded-2xl text-indigo-600 dark:text-indigo-400 border border-indigo-500/10">
            <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </span>
        </div>

        <div className="bg-purple-650/5 dark:bg-purple-500/5 border border-purple-500/20 p-6 rounded-3xl flex justify-between items-center md:col-span-1">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
              Cumulative CGPA
            </span>
            <h3 className="text-3.5xl font-extrabold text-purple-755 dark:text-purple-455 tracking-tight">
              {cgpa}
            </h3>
            <p className="text-[9px] text-purple-500/80 font-bold uppercase">
              All Term Compilation
            </p>
          </div>
          <span className="p-3 bg-purple-500/10 rounded-2xl text-purple-650 dark:text-purple-400 border border-purple-500/10">
            <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </span>
        </div>

        <div className="bg-emerald-650/5 dark:bg-emerald-500/5 border border-emerald-500/20 p-6 rounded-3xl flex justify-between items-center md:col-span-1">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              Total Credits Earned
            </span>
            <h3 className="text-3.5xl font-extrabold text-emerald-700 dark:text-emerald-455 tracking-tight">
              {totalCredits} Credits
            </h3>
            <p className="text-[9px] text-emerald-500/80 font-bold uppercase">
              No Backlogs / Cleared
            </p>
          </div>
          <span className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-600 dark:text-emerald-400 border border-emerald-500/10">
            <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2" />
            </svg>
          </span>
        </div>
      </div>

      {/* Detailed Grades Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-3xl shadow-sm overflow-hidden transition-colors">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-850 text-left">
            <thead className="bg-slate-50/60 dark:bg-slate-950/40 border-b border-slate-100 dark:border-slate-800/80">
              <tr>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Subject Code</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Subject Name</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Grade</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Credits</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">SGPA</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs text-slate-700 dark:text-slate-355 bg-white dark:bg-slate-900 transition-colors">
              {activeResults.courses.map((course, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/20 transition-colors">
                  <td className="px-6 py-4 font-bold text-slate-500 dark:text-slate-450">{course.code}</td>
                  <td className="px-6 py-4 font-bold text-slate-800 dark:text-slate-200">{course.name}</td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 text-xs font-extrabold rounded-lg">
                      {course.grade}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-660 dark:text-slate-400">{course.credits}</td>
                  <td className="px-6 py-4 font-bold text-slate-655 dark:text-slate-350">{activeResults.gpa}</td>
                  <td className="px-6 py-4 text-right">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-extrabold border ${
                      course.status === 'PASSED' 
                        ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' 
                        : 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                     }`}>
                      {course.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
