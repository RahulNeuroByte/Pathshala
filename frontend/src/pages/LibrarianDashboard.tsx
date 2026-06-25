import React, { useEffect, useState } from 'react';
import { libraryService, studentService, facultyService } from '../services/api';
import { Bar } from 'react-chartjs-2';
import { useTheme } from '../context/ThemeContext';

interface Book {
  id: number;
  title: string;
  author: string;
  isbn: string;
  quantity_total: number;
  quantity_available: number;
  publication_year: number;
}

interface BorrowerInfo {
  type: 'student' | 'faculty';
  name: string;
  roll_no?: string;
  faculty_id?: string;
  email?: string;
  course?: string;
  dept?: string;
  sem?: number;
  section?: string;
}

interface Issuance {
  id: number;
  book_title: string;
  book_isbn: string;
  issue_date: string;
  due_date: string;
  return_date: string | null;
  status: string;
  borrower: BorrowerInfo;
}

export default function LibrarianDashboard() {
  const { theme } = useTheme();
  
  // States
  const [books, setBooks] = useState<Book[]>([]);
  const [issuances, setIssuances] = useState<Issuance[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchBook, setSearchBook] = useState('');
  
  // Modals
  const [isAddBookOpen, setIsAddBookOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const [loadingStudentDetails, setLoadingStudentDetails] = useState(false);

  // Form State
  const [bookForm, setBookForm] = useState({
    title: '',
    edition: '',
    author: '',
    isbn: '',
    quantity_total: 1,
    publication_year: new Date().getFullYear()
  });
  const [formMsg, setFormMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchData = async () => {
    try {
      const [booksRes, issueRes] = await Promise.all([
        libraryService.getBooks(),
        libraryService.getIssuances()
      ]);
      setBooks(booksRes.data || []);
      setIssuances(issueRes.data || []);
    } catch (err) {
      console.error('Failed to load librarian dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddBook = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormMsg(null);

    if (!bookForm.title || !bookForm.author || !bookForm.isbn) {
      setFormMsg({ type: 'error', text: 'Title, Author, and ISBN are required.' });
      return;
    }

    try {
      const formattedTitle = bookForm.edition 
        ? `${bookForm.title} (${bookForm.edition})` 
        : bookForm.title;
        
      await libraryService.addBook({
        title: formattedTitle,
        author: bookForm.author,
        isbn: bookForm.isbn,
        quantity_total: Number(bookForm.quantity_total),
        publication_year: Number(bookForm.publication_year)
      });

      setFormMsg({ type: 'success', text: 'Book added to catalog successfully!' });
      setBookForm({
        title: '',
        edition: '',
        author: '',
        isbn: '',
        quantity_total: 1,
        publication_year: new Date().getFullYear()
      });
      fetchData();
      setTimeout(() => {
        setIsAddBookOpen(false);
        setFormMsg(null);
      }, 1500);
    } catch (err: any) {
      setFormMsg({ type: 'error', text: err.response?.data?.detail || 'Failed to add book.' });
    }
  };

  const handleReturnBook = async (issuanceId: number) => {
    if (!window.confirm('Are you sure you want to mark this book as Returned?')) return;
    try {
      await libraryService.updateIssuanceStatus(issuanceId, 'Returned');
      fetchData();
    } catch (err) {
      console.error('Failed to return book', err);
    }
  };

  const viewStudentDetails = async (rollNo: string) => {
    setLoadingStudentDetails(true);
    try {
      // Find matching student by fetching the list or search
      const studentsRes = await studentService.getStudents();
      const studentObj = (studentsRes.data || []).find((s: any) => s.roll_no === rollNo);
      if (studentObj) {
        // Fetch detailed profile
        const detailsRes = await studentService.getStudent(studentObj.id);
        setSelectedStudent(detailsRes.data);
      } else {
        alert('Student profile details not found in system directory.');
      }
    } catch (err) {
      console.error('Error fetching student details', err);
      alert('Could not retrieve student details.');
    } finally {
      setLoadingStudentDetails(false);
    }
  };

  // Fine & Duration calculator
  const getIssuanceTracking = (issueDateStr: string, returnDateStr: string | null) => {
    const issueDate = new Date(issueDateStr);
    const endDate = returnDateStr ? new Date(returnDateStr) : new Date();
    
    // Day calculation
    const diffTime = endDate.getTime() - issueDate.getTime();
    const diffDays = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
    
    const fineDays = diffDays - 28;
    const fineAmount = fineDays > 0 ? fineDays * 2 : 0;
    
    return {
      duration: diffDays,
      fine: fineAmount,
      isOverdue: diffDays > 28
    };
  };

  // Group books subject-wise for stock chart
  const getSubjectStockData = () => {
    const categories = [
      { name: 'Computer Science', keywords: ['computer', 'programming', 'code', 'python', 'java', 'web', 'data', 'algorithm', 'software', 'network', 'sql'] },
      { name: 'Mathematics', keywords: ['math', 'calculus', 'algebra', 'statistics', 'probability', 'discrete'] },
      { name: 'Electronics', keywords: ['circuit', 'electronic', 'microcontroller', 'digital', 'semiconductor', 'analog'] },
      { name: 'Physics', keywords: ['physics', 'mechanics', 'quantum', 'thermodynamic', 'optics'] },
      { name: 'Humanities & Gen', keywords: [] } // Fallback
    ];

    const stockCounts = categories.map(() => ({ inStock: 0, outOfStock: 0 }));

    books.forEach(b => {
      const titleLower = b.title.toLowerCase();
      let matchedIdx = categories.length - 1; // Default to Humanities/Gen
      
      for (let i = 0; i < categories.length - 1; i++) {
        if (categories[i].keywords.some(k => titleLower.includes(k))) {
          matchedIdx = i;
          break;
        }
      }

      if (b.quantity_available > 0) {
        stockCounts[matchedIdx].inStock++;
      } else {
        stockCounts[matchedIdx].outOfStock++;
      }
    });

    return {
      labels: categories.map(c => c.name),
      datasets: [
        {
          label: 'In Stock (Available)',
          data: stockCounts.map(c => c.inStock),
          backgroundColor: '#10B981', // Emerald
          borderRadius: 8,
        },
        {
          label: 'Out of Stock',
          data: stockCounts.map(c => c.outOfStock),
          backgroundColor: '#EF4444', // Red
          borderRadius: 8,
        }
      ]
    };
  };

  // Filter book catalog
  const filteredBooks = books.filter(b => {
    const query = searchBook.toLowerCase();
    return (
      b.title.toLowerCase().includes(query) ||
      b.author.toLowerCase().includes(query) ||
      b.isbn.includes(query)
    );
  });

  // Separate student and faculty active issuances
  const studentIssuances = issuances.filter(issue => issue.borrower?.type === 'student');
  const facultyIssuances = issuances.filter(issue => issue.borrower?.type === 'faculty');

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
    <div className="space-y-8 max-w-7xl mx-auto animate-in fade-in duration-300">
      
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200/80 dark:border-slate-800/80 pb-5">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Librarian Command Console
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-450 mt-0.5">
            Manage books catalog, track borrower duration metrics, collect overdue fines, and visualize inventory.
          </p>
        </div>
        <button
          onClick={() => setIsAddBookOpen(true)}
          className="flex items-center justify-center px-4 py-2.5 text-xs font-bold text-white bg-indigo-650 hover:bg-indigo-500 rounded-xl transition-all shadow-md shadow-indigo-650/20 gap-2"
        >
          <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add New Book
        </button>
      </div>

      {/* Book stock subject-wise visualization */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 p-6 rounded-3xl shadow-sm space-y-4">
        <div>
          <h3 className="font-extrabold text-slate-850 dark:text-slate-200 text-base">Subject-wise Book Availability</h3>
          <p className="text-xs text-slate-450 mt-0.5">Physical books stock catalogued by academic topics and availability status</p>
        </div>
        <div className="h-64">
          <Bar
            data={getSubjectStockData()}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: 'top',
                  labels: {
                    boxWidth: 10,
                    font: { size: 10, weight: 'bold' },
                    color: theme === 'dark' ? '#94A3B8' : '#64748B',
                  }
                }
              },
              scales: {
                y: { beginAtZero: true, grid: { color: theme === 'dark' ? '#1E293B' : '#F1F5F9' }, ticks: { color: '#64748B', font: { size: 10 } } },
                x: { grid: { display: false }, ticks: { color: '#64748B', font: { size: 10 } } },
              }
            }}
          />
        </div>
      </div>

      {/* Inventory & Borrowers grids */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Books Inventory Catalog (8 cols) */}
        <div className="lg:col-span-12 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-3xl p-6 shadow-sm flex flex-col">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest">
              Books Inventory Catalog
            </h3>
            <div className="w-full sm:w-64 relative">
              <input
                type="text"
                placeholder="Search catalog by title, author, isbn..."
                value={searchBook}
                onChange={e => setSearchBook(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-350 focus:outline-none"
              />
              <svg width="14" height="14" className="absolute left-3 top-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-850 text-left">
              <thead className="bg-slate-50/60 dark:bg-slate-950/40 border-b border-slate-100 dark:border-slate-800/80">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider">ISBN</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider">Book Name / Title</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider">Author</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider">Publication</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider">In-Stock Copies</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider">Availability Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs text-slate-700 dark:text-slate-355 font-semibold">
                {filteredBooks.length > 0 ? (
                  filteredBooks.map(book => (
                    <tr key={book.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/20 transition-colors">
                      <td className="px-6 py-4 text-slate-400 font-semibold whitespace-nowrap">{book.isbn}</td>
                      <td className="px-6 py-4 font-bold text-slate-800 dark:text-slate-200">{book.title}</td>
                      <td className="px-6 py-4 text-slate-500 whitespace-nowrap">{book.author}</td>
                      <td className="px-6 py-4 text-slate-450 whitespace-nowrap">{book.publication_year}</td>
                      <td className="px-6 py-4 whitespace-nowrap font-extrabold text-slate-800 dark:text-slate-100">
                        {book.quantity_available} / {book.quantity_total} available
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-extrabold border ${
                          book.quantity_available > 0
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                        }`}>
                          {book.quantity_available > 0 ? 'IN STOCK' : 'OUT OF STOCK'}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-slate-400 dark:text-slate-500 font-bold">
                      No books found matching search parameters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Borrower logs: Students Borrowers Log (6 cols) */}
        <div className="lg:col-span-6 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-3xl p-6 shadow-sm flex flex-col">
          <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest mb-4 border-b border-slate-100 dark:border-slate-850 pb-3">
            Students Book Borrowers Log
          </h3>

          <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1">
            {studentIssuances.length > 0 ? (
              studentIssuances.map(issue => (
                <div
                  key={issue.id}
                  onClick={() => issue.borrower?.roll_no && viewStudentDetails(issue.borrower.roll_no)}
                  className="p-4 bg-slate-50/50 dark:bg-slate-950/20 border border-slate-200/40 dark:border-slate-800/40 rounded-2xl cursor-pointer hover:shadow-sm hover:border-indigo-500/35 transition-all flex justify-between items-start gap-4"
                  title="Click to view student full contact / profile details"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-200 truncate">
                        {issue.borrower?.name || 'Unknown student'}
                      </h4>
                      <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 font-mono">
                        {issue.borrower?.roll_no}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-indigo-650 dark:text-indigo-400 truncate">
                      {issue.book_title}
                    </p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold">
                      Issued: {new Date(issue.issue_date).toLocaleDateString()} | Due: {new Date(issue.due_date).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-extrabold border ${
                      issue.status === 'Issued'
                        ? 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                        : 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                    }`}>
                      {issue.status.toUpperCase()}
                    </span>
                    <div className="flex items-center gap-1.5 mt-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(`http://localhost:8000/api/v1/reports/print/book-issue/${issue.id}`, '_blank');
                        }}
                        className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-650 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/30 dark:text-indigo-400 rounded-lg font-bold text-[9px] border border-indigo-100 dark:border-indigo-900/20"
                      >
                        Print
                      </button>
                      {issue.status === 'Issued' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleReturnBook(issue.id);
                          }}
                          className="px-2.5 py-1 text-[9px] font-extrabold text-indigo-600 hover:bg-indigo-50 rounded-lg border border-indigo-200"
                        >
                          Return
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center py-10 text-slate-400 dark:text-slate-500 text-xs font-bold">
                No active student issuances.
              </p>
            )}
          </div>
        </div>

        {/* Borrower logs: Faculty Overdue Fine Meter (6 cols) */}
        <div className="lg:col-span-6 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-3xl p-6 shadow-sm flex flex-col">
          <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest mb-4 border-b border-slate-100 dark:border-slate-850 pb-3">
            Faculty Active Borrowers Tracker (Fines)
          </h3>

          <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1">
            {facultyIssuances.length > 0 ? (
              facultyIssuances.map(issue => {
                const tracking = getIssuanceTracking(issue.issue_date, issue.return_date);
                return (
                  <div
                    key={issue.id}
                    className="p-4 bg-slate-50/50 dark:bg-slate-950/20 border border-slate-200/40 dark:border-slate-800/40 rounded-2xl flex justify-between items-start gap-4"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-extrabold text-slate-850 dark:text-slate-200 truncate">
                          {issue.borrower?.name}
                        </h4>
                        <span className="text-[9px] font-bold text-purple-650 bg-purple-50 dark:bg-purple-950/30 px-1.5 py-0.5 rounded border border-purple-100 dark:border-purple-900/30">
                          {issue.borrower?.dept}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-indigo-650 dark:text-indigo-400 truncate">
                        {issue.book_title}
                      </p>
                      <p className="text-[10px] text-slate-450 dark:text-slate-500 font-semibold">
                        Issued: {new Date(issue.issue_date).toLocaleDateString()} | Duration: <strong className="text-slate-700 dark:text-slate-300">{tracking.duration} days</strong>
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-2 shrink-0">
                      {tracking.isOverdue ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-extrabold border bg-rose-500/10 text-rose-600 border-rose-500/20 animate-pulse">
                          OVERDUE FINE: ₹{tracking.fine}
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-extrabold border bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                          NO FINE (Duration &lt; 28d)
                        </span>
                      )}
                      
                      <div className="flex items-center gap-1.5 mt-1">
                        <button
                          onClick={() => window.open(`http://localhost:8000/api/v1/reports/print/book-issue/${issue.id}`, '_blank')}
                          className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-650 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/30 dark:text-indigo-400 rounded-lg font-bold text-[9px] border border-indigo-100 dark:border-indigo-900/20"
                        >
                          Print
                        </button>
                        {issue.status === 'Issued' && (
                          <button
                            onClick={() => handleReturnBook(issue.id)}
                            className="px-2.5 py-1 text-[9px] font-extrabold text-indigo-650 hover:bg-indigo-50 rounded-lg border border-indigo-200"
                          >
                            Return Book
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-center py-10 text-slate-400 dark:text-slate-500 text-xs font-bold">
                No active faculty issuances.
              </p>
            )}
          </div>
        </div>

      </div>

      {/* Add Book Modal */}
      {isAddBookOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
            <div className="p-5 border-b border-slate-100 dark:border-slate-850 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  Add Book to Library Inventory
                </h3>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Update database catalog record instantly.
                </p>
              </div>
              <button
                onClick={() => setIsAddBookOpen(false)}
                className="text-slate-400 hover:text-slate-650"
                title="Close Add Book Modal"
              >
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleAddBook} className="p-5 space-y-4">
              {formMsg && (
                <div className={`p-3 rounded-xl text-xs font-bold border ${
                  formMsg.type === 'success' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-rose-500/10 text-rose-600 border-rose-500/20'
                }`}>
                  {formMsg.text}
                </div>
              )}

              <div>
                <label className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">Book Title / Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Clean Code"
                  value={bookForm.title}
                  onChange={e => setBookForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">Book Edition (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. 2nd Edition"
                  value={bookForm.edition}
                  onChange={e => setBookForm(prev => ({ ...prev, edition: e.target.value }))}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">Author Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Robert C. Martin"
                  value={bookForm.author}
                  onChange={e => setBookForm(prev => ({ ...prev, author: e.target.value }))}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">ISBN Code</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 9780132350884"
                    value={bookForm.isbn}
                    onChange={e => setBookForm(prev => ({ ...prev, isbn: e.target.value }))}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider block mb-1">Total Copies</label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={200}
                    value={bookForm.quantity_total}
                    onChange={e => setBookForm(prev => ({ ...prev, quantity_total: parseInt(e.target.value) || 1 }))}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none"
                    title="Total Copies"
                    placeholder="Total Copies"
                  />
                </div>
              </div>

              <div>
                <label className="text-[9px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider block mb-1">Publication Year</label>
                <input
                  type="number"
                  required
                  min={1800}
                  max={new Date().getFullYear()}
                  value={bookForm.publication_year}
                  onChange={e => setBookForm(prev => ({ ...prev, publication_year: parseInt(e.target.value) || new Date().getFullYear() }))}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none"
                  title="Publication Year"
                  placeholder="Publication Year"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddBookOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-indigo-650 hover:bg-indigo-500 rounded-xl transition-all shadow-md"
                >
                  Save Book
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Student Details Info Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
            <div className="p-5 border-b border-slate-100 dark:border-slate-850 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  Student Profile & Borrower Details
                </h3>
                <p className="text-[10px] text-slate-450 mt-0.5">
                  Complete directory profile for {selectedStudent.first_name} {selectedStudent.last_name}.
                </p>
              </div>
              <button
                onClick={() => setSelectedStudent(null)}
                className="text-slate-400 hover:text-slate-655"
                title="Close Student Details Modal"
              >
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[500px] space-y-6">
              {/* Top summary */}
              <div className="flex gap-4 items-center">
                <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center text-indigo-650 dark:text-indigo-400 font-extrabold text-xl border border-indigo-200/40 overflow-hidden shrink-0">
                  {selectedStudent.profile_photo ? (
                    <img src={selectedStudent.profile_photo} alt={selectedStudent.first_name} className="w-full h-full object-cover" />
                  ) : (
                    `${selectedStudent.first_name[0]}${selectedStudent.last_name[0]}`.toUpperCase()
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-slate-850 dark:text-slate-100">
                    {selectedStudent.first_name} {selectedStudent.last_name}
                  </h4>
                  <p className="text-xs text-slate-500 font-semibold">
                    Roll No: <span className="font-mono text-[11px] font-bold text-slate-700 dark:text-slate-300">{selectedStudent.roll_no}</span>
                  </p>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-650 dark:text-indigo-400 mt-0.5">
                    {selectedStudent.course_name || 'B.Tech'} - Section {selectedStudent.section || 'A'}
                  </p>
                </div>
              </div>

              {/* Grid details */}
              <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-slate-700 dark:text-slate-350">
                <div className="space-y-1">
                  <span className="text-[9px] font-bold uppercase text-slate-400 block">Department</span>
                  <p className="text-slate-800 dark:text-slate-200">{selectedStudent.dept_name || 'Computer Science'}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] font-bold uppercase text-slate-400 block">Current Semester</span>
                  <p className="text-slate-800 dark:text-slate-200">Sem {selectedStudent.current_semester || 1}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] font-bold uppercase text-slate-400 block">Enrollment Number</span>
                  <p className="text-slate-800 dark:text-slate-200">{selectedStudent.enrollment_no || 'N/A'}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] font-bold uppercase text-slate-400 block">Admission Batch</span>
                  <p className="text-slate-800 dark:text-slate-200">{selectedStudent.batch || '2022'}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] font-bold uppercase text-slate-400 block">Pathshala Email</span>
                  <p className="text-slate-800 dark:text-slate-200 text-[11px] truncate" title={selectedStudent.pathshala_email}>{selectedStudent.pathshala_email || 'N/A'}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] font-bold uppercase text-slate-400 block">Personal Email</span>
                  <p className="text-slate-800 dark:text-slate-200 text-[11px] truncate" title={selectedStudent.personal_email}>{selectedStudent.personal_email || 'N/A'}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] font-bold uppercase text-slate-400 block">Contact Phone</span>
                  <p className="text-slate-800 dark:text-slate-200">{selectedStudent.phone || 'N/A'}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] font-bold uppercase text-slate-400 block">Alternative Phone</span>
                  <p className="text-slate-800 dark:text-slate-200">{selectedStudent.alternative_phone || 'N/A'}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] font-bold uppercase text-slate-400 block">Blood Group</span>
                  <p className="text-slate-800 dark:text-slate-200 font-extrabold text-indigo-600 dark:text-indigo-400">{selectedStudent.blood_group || 'O+'}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] font-bold uppercase text-slate-400 block">Date of Birth</span>
                  <p className="text-slate-800 dark:text-slate-200">{selectedStudent.dob || 'N/A'}</p>
                </div>
              </div>

              <hr className="border-slate-100 dark:border-slate-850" />

              {/* Parents profile */}
              <div className="space-y-3">
                <h5 className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Guardian / Parents Details</h5>
                <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-slate-700 dark:text-slate-350">
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold uppercase text-slate-400 block">Father's Name</span>
                    <p className="text-slate-800 dark:text-slate-200">{selectedStudent.father_name || 'N/A'}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold uppercase text-slate-400 block">Father's Occupation</span>
                    <p className="text-slate-800 dark:text-slate-200">{selectedStudent.father_occupation || 'N/A'}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold uppercase text-slate-400 block">Mother's Name</span>
                    <p className="text-slate-800 dark:text-slate-200">{selectedStudent.mother_name || 'N/A'}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold uppercase text-slate-400 block">Mother's Occupation</span>
                    <p className="text-slate-800 dark:text-slate-200">{selectedStudent.mother_occupation || 'N/A'}</p>
                  </div>
                </div>
              </div>

              <hr className="border-slate-100 dark:border-slate-850" />

              {/* Address details */}
              <div className="space-y-3">
                <h5 className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Address Details</h5>
                <div className="space-y-3 text-xs font-semibold text-slate-700 dark:text-slate-350">
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold uppercase text-slate-400 block">Current Address</span>
                    <p className="text-slate-800 dark:text-slate-200 leading-relaxed">{selectedStudent.current_address || 'Campus Hostels, Pathshala Campus'}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold uppercase text-slate-400 block">Permanent Address</span>
                    <p className="text-slate-800 dark:text-slate-200 leading-relaxed">{selectedStudent.permanent_address || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-slate-50 dark:bg-slate-950/45 border-t border-slate-100 dark:border-slate-850 flex justify-end">
              <button
                onClick={() => setSelectedStudent(null)}
                className="px-4 py-2 text-xs font-bold text-white bg-indigo-650 hover:bg-indigo-500 rounded-xl shadow-md transition-all"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
