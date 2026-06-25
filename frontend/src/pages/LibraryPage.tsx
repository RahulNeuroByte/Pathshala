import React, { useEffect, useState } from 'react';
import { libraryService, studentService, facultyService } from '../services/api';
import { useUser } from '../context/UserContext';

export default function LibraryPage() {
  const { role } = useUser();
  const canManage = role === 'admin' || role === 'librarian' || role === 'principal';

  const [books, setBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Tab state
  const [activeTab, setActiveTab] = useState<'catalog' | 'issuances'>('catalog');

  // Modal states
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [borrowerType, setBorrowerType] = useState<'student' | 'faculty'>('student');
  const [issueData, setIssueData] = useState({
    student_name: '',
    roll_no: '',
    book_id: 1,
  });

  // Librarian Add Book states
  const [isAddBookModalOpen, setIsAddBookModalOpen] = useState(false);
  const [addBookForm, setAddBookForm] = useState({
    title: '',
    author: '',
    isbn: '',
    quantity_total: 5,
    publication_year: new Date().getFullYear(),
  });

  // Issuances borrower logs list
  const [issuances, setIssuances] = useState<any[]>([]);

  // Online request states for students
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [requestedBook, setRequestedBook] = useState<any>(null);
  const [pickupExpiryTime, setPickupExpiryTime] = useState('');

  // Realistic CS book titles mapper for the 20 database entries
  const bookDetailsMap: Record<number, { title: string; author: string; edition: string }> = {
    1: { title: 'Computer Networks', author: 'Andrew S. Tanenbaum', edition: '5th Edition' },
    2: { title: 'Introduction to Algorithms', author: 'Thomas H. Cormen', edition: '4th Edition' },
    3: { title: 'Database System Concepts', author: 'Abraham Silberschatz', edition: '7th Edition' },
    4: { title: 'Operating System Concepts', author: 'Peter B. Galvin', edition: '10th Edition' },
    5: { title: 'Software Engineering', author: 'Ian Sommerville', edition: '10th Edition' },
    6: { title: 'Artificial Intelligence: A Modern Approach', author: 'Stuart Russell', edition: '4th Edition' },
    7: { title: 'Compilers: Principles, Techniques, and Tools', author: 'Alfred V. Aho', edition: '2nd Edition' },
    8: { title: 'Computer Architecture: A Quantitative Approach', author: 'John L. Hennessy', edition: '6th Edition' },
    9: { title: 'Design Patterns: Elements of Reusable Object-Oriented Software', author: 'Erich Gamma', edition: '1st Edition' },
    10: { title: 'Computer Graphics: Principles and Practice', author: 'John F. Hughes', edition: '3rd Edition' },
    11: { title: 'Introduction to the Theory of Computation', author: 'Michael Sipser', edition: '3rd Edition' },
    12: { title: 'Data Communications and Networking', author: 'Behrouz A. Forouzan', edition: '5th Edition' },
    13: { title: 'Cryptography and Network Security', author: 'William Stallings', edition: '8th Edition' },
    14: { title: 'Distributed Systems: Principles and Paradigms', author: 'Andrew S. Tanenbaum', edition: '3rd Edition' },
    15: { title: 'Cloud Computing: Principles and Paradigms', author: 'Rajkumar Buyya', edition: '1st Edition' },
    16: { title: 'Modern Operating Systems', author: 'Andrew S. Tanenbaum', edition: '4th Edition' },
    17: { title: 'Digital Design', author: 'M. Morris Mano', edition: '6th Edition' },
    18: { title: 'Machine Learning', author: 'Tom M. Mitchell', edition: '1st Edition' },
    19: { title: 'Pattern Recognition and Machine Learning', author: 'Christopher M. Bishop', edition: '1st Edition' },
    20: { title: 'Deep Learning', author: 'Ian Goodfellow', edition: '1st Edition' },
  };

  const [students, setStudents] = useState<any[]>([]);
  const [faculty, setFaculty] = useState<any[]>([]);

  const fetchBooks = async () => {
    try {
      const response = await libraryService.getBooks();
      const rawBooks = response.data || [];
      const mappedBooks = rawBooks.map((book: any, index: number) => {
        const detail = bookDetailsMap[book.id] || bookDetailsMap[(index % 20) + 1] || {
          title: `Computer Science Textbook Vol ${book.id}`,
          author: 'CS Faculty Board',
          edition: '1st Edition'
        };
        return {
          ...book,
          title: detail.title,
          author: detail.author,
          edition: detail.edition
        };
      });
      setBooks(mappedBooks);
      if (mappedBooks.length > 0) {
        setIssueData(prev => ({ ...prev, book_id: mappedBooks[0].id }));
      }
    } catch (error) {
      console.error('Failed to fetch library books', error);
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await studentService.getStudents();
      setStudents(response.data || []);
    } catch (error) {
      console.error('Failed to fetch students in library page', error);
    }
  };

  const fetchFaculty = async () => {
    try {
      const response = await facultyService.getFaculty();
      setFaculty(response.data || []);
    } catch (error) {
      console.error('Failed to fetch faculty in library page', error);
    }
  };

  const fetchIssuances = async () => {
    try {
      const response = await libraryService.getIssuances();
      setIssuances(response.data || []);
    } catch (error) {
      console.error('Failed to fetch issuances', error);
    }
  };

  const loadAll = async () => {
    setLoading(true);
    await Promise.all([
      fetchBooks(),
      fetchStudents(),
      canManage ? fetchFaculty() : Promise.resolve(),
      canManage ? fetchIssuances() : Promise.resolve(),
    ]);
    setLoading(false);
  };

  useEffect(() => {
    loadAll();
  }, [role]);

  const refreshData = async () => {
    await Promise.all([
      fetchBooks(),
      canManage ? fetchIssuances() : Promise.resolve(),
    ]);
  };

  // Filter books based on search term
  const filteredBooks = books.filter((book) => {
    return (
      book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      book.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
      book.isbn.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const handleAddBookSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addBookForm.title || !addBookForm.author || !addBookForm.isbn) {
      alert("All fields are required.");
      return;
    }
    try {
      await libraryService.addBook(addBookForm);
      alert("Book added successfully!");
      setIsAddBookModalOpen(false);
      setAddBookForm({
        title: '',
        author: '',
        isbn: '',
        quantity_total: 5,
        publication_year: new Date().getFullYear(),
      });
      await refreshData();
    } catch (error) {
      console.error('Failed to add book', error);
      alert('Error adding book. Check ISBN consistency.');
    }
  };

  const handleIssueBookSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (borrowerType === 'student') {
      const matchedStudent = students.find(
        (s) => s.roll_no.trim().toLowerCase() === issueData.roll_no.trim().toLowerCase()
      );

      if (!matchedStudent) {
        alert(`Student with Roll No "${issueData.roll_no}" not found in database.`);
        return;
      }

      try {
        await libraryService.issueBook(matchedStudent.id, undefined, issueData.book_id);
        alert(`Successfully issued book to Student ${matchedStudent.first_name} ${matchedStudent.last_name}!`);
        setIsIssueModalOpen(false);
        setIssueData(prev => ({ ...prev, student_name: '', roll_no: '' }));
        await refreshData();
      } catch (error: any) {
        console.error('Failed to issue book', error);
        alert(error.response?.data?.detail || 'Error issuing book. Check inventory limits.');
      }
    } else {
      const matchedFaculty = faculty.find(
        (f) => f.employee_id.trim().toLowerCase() === issueData.roll_no.trim().toLowerCase()
      );

      if (!matchedFaculty) {
        alert(`Faculty/HOD member with ID "${issueData.roll_no}" not found in database.`);
        return;
      }

      try {
        await libraryService.issueBook(undefined, matchedFaculty.id, issueData.book_id);
        alert(`Successfully issued book to Faculty ${matchedFaculty.first_name} ${matchedFaculty.last_name}!`);
        setIsIssueModalOpen(false);
        setIssueData(prev => ({ ...prev, student_name: '', roll_no: '' }));
        await refreshData();
      } catch (error: any) {
        console.error('Failed to issue book', error);
        alert(error.response?.data?.detail || 'Error issuing book. Check inventory limits.');
      }
    }
  };

  const handleReturnBook = async (issuanceId: number) => {
    if (window.confirm('Mark this catalog volume as returned to the shelf?')) {
      try {
        await libraryService.updateIssuanceStatus(issuanceId, 'Returned');
        alert('Book returned successfully!');
        await refreshData();
      } catch (error) {
        console.error('Failed to return book', error);
        alert('Error returning book.');
      }
    }
  };

  // Student Online Issue Request
  const handleStudentIssueRequest = async (book: any) => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        alert("Unauthorized. Please log in.");
        return;
      }
      const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";
      const profileRes = await fetch(`${API_BASE_URL}/users/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!profileRes.ok) {
        throw new Error("Failed to fetch profile");
      }
      const profileData = await profileRes.json();
      const studentId = profileData.student_id;
      if (!studentId) {
        alert("Only users with a Student Profile can issue books.");
        return;
      }

      await libraryService.issueBook(studentId, undefined, book.id);
      await refreshData();

      setRequestedBook(book);
      const expiry = new Date(Date.now() + 48 * 60 * 60 * 1000);
      const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' };
      setPickupExpiryTime(expiry.toLocaleDateString('en-US', options));
      setIsRequestModalOpen(true);
    } catch (error: any) {
      console.error('Failed to issue book online', error);
      alert(error.response?.data?.detail || 'Error requesting book online. Limit may be reached.');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto relative">
      
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">Library Workspace</h1>
          <p className="text-slate-400 dark:text-slate-500 text-xs mt-1">
            Search physical books, manage catalog, and issue/return volumes.
          </p>
        </div>
        
        {/* Actions Button Bar */}
        {canManage && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setAddBookForm({
                  title: '',
                  author: '',
                  isbn: '',
                  quantity_total: 5,
                  publication_year: new Date().getFullYear(),
                });
                setIsAddBookModalOpen(true);
              }}
              className="flex items-center justify-center px-4 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-md gap-2"
              title="Add Book"
            >
              <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Add Book
            </button>
            <button
              onClick={() => {
                setBorrowerType('student');
                setIsIssueModalOpen(true);
              }}
              className="flex items-center justify-center px-4 py-2.5 text-xs font-bold text-white bg-indigo-650 hover:bg-indigo-500 rounded-xl transition-all shadow-md shadow-indigo-650/20 gap-2"
              title="Issue Book"
            >
              <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              Issue Book
            </button>
          </div>
        )}
      </div>

      {/* Tabs Toggles */}
      {canManage && (
        <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6">
          <button
            onClick={() => setActiveTab('catalog')}
            className={`pb-3 text-xs font-extrabold uppercase tracking-wider transition-all border-b-2 ${
              activeTab === 'catalog'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            Catalog Books
          </button>
          <button
            onClick={() => {
              setActiveTab('issuances');
              refreshData();
            }}
            className={`pb-3 text-xs font-extrabold uppercase tracking-wider transition-all border-b-2 ${
              activeTab === 'issuances'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            Active Issuances & Borrowers
          </button>
        </div>
      )}

      {activeTab === 'catalog' ? (
        <>
          {/* Search Filter Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 p-5 rounded-2xl shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between transition-colors">
            <div className="relative w-full sm:max-w-xs">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 dark:text-slate-500">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input
                type="text"
                placeholder="Search by title, author, ISBN..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-4 py-2.5 bg-slate-55 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl placeholder-slate-400 text-slate-705 dark:text-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                title="Search Books"
              />
            </div>
            <div className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
              Total: {filteredBooks.length} Titles
            </div>
          </div>

          {/* Grid List of Books */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <svg className="animate-spin h-8 w-8 text-indigo-650" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
          ) : filteredBooks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
              <span className="text-4xl">📚</span>
              <h3 className="font-extrabold text-slate-750 dark:text-slate-300 mt-2">No books found</h3>
              <p className="text-slate-400 dark:text-slate-500 text-xs mt-1">Try adjusting your search criteria.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredBooks.map((book) => {
                const availRatio = book.quantity_total > 0 ? book.quantity_available / book.quantity_total : 0;
                const isOutOfStock = book.quantity_available === 0;
                const isLowStock = !isOutOfStock && book.quantity_available <= 2;

                let statusBadge = (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded text-[10px] font-extrabold bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30 uppercase">
                    Available
                  </span>
                );

                if (isOutOfStock) {
                  statusBadge = (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded text-[10px] font-extrabold bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/30 uppercase">
                      Out of Stock
                    </span>
                  );
                } else if (isLowStock) {
                  statusBadge = (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded text-[10px] font-extrabold bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/30 uppercase">
                      Low Stock
                    </span>
                  );
                }

                return (
                  <div
                    key={book.id}
                    className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 p-6 rounded-3xl shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
                  >
                    <div className="space-y-4">
                      <div className="flex justify-between items-start gap-4">
                        <div className="space-y-0.5">
                          <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-base leading-tight">
                            {book.title}
                          </h3>
                          <p className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                            by {book.author}
                          </p>
                        </div>
                        {statusBadge}
                      </div>

                      <div className="border-t border-slate-100 dark:border-slate-850 pt-4 space-y-3">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider text-[10px]">ISBN:</span>
                          <span className="font-mono text-slate-500 dark:text-slate-400 font-bold">{book.isbn}</span>
                        </div>

                        <div className="flex justify-between text-xs">
                          <span className="text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider text-[10px]">Edition:</span>
                          <span className="font-semibold text-slate-700 dark:text-slate-355">{book.edition || '1st Edition'}</span>
                        </div>

                        <div className="flex justify-between text-xs">
                          <span className="text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider text-[10px]">Pub Year:</span>
                          <span className="font-semibold text-slate-700 dark:text-slate-355">{book.publication_year}</span>
                        </div>

                        {/* Stock Meter */}
                        <div className="space-y-1.5 pt-2">
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider text-[9px]">
                              Stock Status
                            </span>
                            <span className="text-[11px] font-extrabold text-slate-700 dark:text-slate-300">
                              {book.quantity_available} / {book.quantity_total} Copies
                            </span>
                          </div>
                          <div className="w-full h-2 bg-slate-100 dark:bg-slate-955 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                isOutOfStock ? 'bg-rose-500' : isLowStock ? 'bg-amber-500' : 'bg-emerald-500'
                              }`}
                              style={{ width: `${availRatio * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Student Request Action Button */}
                    {role === 'student' && (
                      <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800/80">
                        <button
                          onClick={() => handleStudentIssueRequest(book)}
                          disabled={isOutOfStock}
                          className={`w-full py-2.5 px-4 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
                            isOutOfStock 
                              ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed border border-transparent'
                              : 'bg-indigo-650 hover:bg-indigo-600 text-white shadow-md shadow-indigo-600/10'
                          }`}
                        >
                          <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          Issue Book Online
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      ) : (
        /* Book Issuances Active Log Tab */
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-3xl shadow-sm overflow-hidden transition-colors">
          {issuances.length === 0 ? (
            <div className="py-20 text-center text-slate-405 font-bold text-xs uppercase tracking-wider">
              No active issuance records found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-850 text-left">
                <thead className="bg-slate-50/60 dark:bg-slate-950/40 border-b border-slate-100 dark:border-slate-800/80">
                  <tr>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Book Details</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Borrower Details</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Issue Date</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Due Date</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs text-slate-700 dark:text-slate-355 bg-white dark:bg-slate-900 transition-colors">
                  {issuances.map((item) => {
                    const b = item.borrower;
                    return (
                      <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/20 transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-bold text-slate-800 dark:text-slate-200">{item.book_title}</p>
                          <span className="text-[10px] text-slate-450 dark:text-slate-500 font-mono">ISBN: {item.book_isbn}</span>
                        </td>
                        <td className="px-6 py-4 space-y-1">
                          {b.type === 'student' ? (
                            <>
                              <p className="font-bold text-slate-805 dark:text-slate-105">{b.name} <span className="text-[9px] font-extrabold text-indigo-650 bg-indigo-50 px-1.5 py-0.5 rounded ml-1 uppercase">Student</span></p>
                              <p className="text-[10px] text-slate-450">Roll No: {b.roll_no} | Email: {b.email}</p>
                              <p className="text-[9px] text-indigo-500/80 font-bold uppercase">Course: {b.course} | Dept: {b.dept} | Sem: {b.sem} | Section: {b.section}</p>
                            </>
                          ) : b.type === 'faculty' ? (
                            <>
                              <p className="font-bold text-slate-805 dark:text-slate-105">{b.name} <span className="text-[9px] font-extrabold text-purple-650 bg-purple-50 px-1.5 py-0.5 rounded ml-1 uppercase">Faculty/HOD</span></p>
                              <p className="text-[10px] text-slate-455">Employee ID: {b.faculty_id} | Dept: {b.dept}</p>
                              <p className="text-[9px] text-purple-500/80 font-bold uppercase">Timetable: {b.timetable}</p>
                            </>
                          ) : (
                            <span className="text-slate-400">Anonymous borrower</span>
                          )}
                        </td>
                        <td className="px-6 py-4 font-semibold text-slate-500 dark:text-slate-400">{item.issue_date}</td>
                        <td className="px-6 py-4 font-semibold text-slate-500 dark:text-slate-400">{item.due_date}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-extrabold border ${
                            item.status === 'Returned'
                              ? 'bg-emerald-55/10 text-emerald-500 border-emerald-500/20'
                              : item.status === 'Overdue'
                              ? 'bg-rose-500/10 text-rose-500 border-rose-500/20 animate-pulse'
                              : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                          }`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                          <button
                            onClick={() => window.open(`http://localhost:8000/api/v1/reports/print/book-issue/${item.id}`, '_blank')}
                            className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-650 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/30 dark:text-indigo-400 rounded-lg font-bold text-[9px] border border-indigo-100 dark:border-indigo-900/20"
                          >
                            Print Slip
                          </button>
                          {item.status !== 'Returned' && (
                            <button
                              onClick={() => handleReturnBook(item.id)}
                              className="px-2.5 py-1 text-[10px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-all"
                            >
                              Return Book
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Add Book Modal for Librarian */}
      {isAddBookModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={() => setIsAddBookModalOpen(false)} />
          
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-805 rounded-3xl w-full max-w-md p-6 shadow-2xl relative z-10 space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <div>
              <h3 className="text-lg font-extrabold text-slate-850 dark:text-slate-200">Add Book to Catalog</h3>
              <p className="text-xs text-slate-455 dark:text-slate-500 mt-1">Publish a new textbook volume into the library database inventory.</p>
            </div>

            <form onSubmit={handleAddBookSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-450 uppercase" htmlFor="add_book_title">Book Title</label>
                <input
                  type="text" required id="add_book_title"
                  value={addBookForm.title}
                  onChange={(e) => setAddBookForm({ ...addBookForm, title: e.target.value })}
                  placeholder="e.g. Introduction to Algorithms"
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-indigo-505 text-xs font-semibold text-slate-800 dark:text-slate-100"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-450 uppercase" htmlFor="add_book_author">Author Name</label>
                <input
                  type="text" required id="add_book_author"
                  value={addBookForm.author}
                  onChange={(e) => setAddBookForm({ ...addBookForm, author: e.target.value })}
                  placeholder="e.g. Thomas H. Cormen"
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-indigo-505 text-xs font-semibold text-slate-800 dark:text-slate-100"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-450 uppercase" htmlFor="add_book_isbn">ISBN Number</label>
                <input
                  type="text" required id="add_book_isbn"
                  value={addBookForm.isbn}
                  onChange={(e) => setAddBookForm({ ...addBookForm, isbn: e.target.value })}
                  placeholder="e.g. 978-0262033848"
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-indigo-505 text-xs font-semibold text-slate-800 dark:text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-450 uppercase" htmlFor="add_book_qty">Quantity Total</label>
                  <input
                    type="number" required id="add_book_qty" min="1"
                    value={addBookForm.quantity_total}
                    onChange={(e) => setAddBookForm({ ...addBookForm, quantity_total: parseInt(e.target.value) || 1 })}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-indigo-505 text-xs font-semibold text-slate-800 dark:text-slate-100"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-450 uppercase" htmlFor="add_book_year">Publication Year</label>
                  <input
                    type="number" required id="add_book_year"
                    value={addBookForm.publication_year}
                    onChange={(e) => setAddBookForm({ ...addBookForm, publication_year: parseInt(e.target.value) || 2026 })}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-indigo-505 text-xs font-semibold text-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddBookModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs font-bold text-white bg-indigo-650 hover:bg-indigo-500 rounded-xl transition-all shadow-md shadow-indigo-650/20"
                >
                  Publish Book
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Issue Book Modal for Admin/Librarian */}
      {isIssueModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={() => setIsIssueModalOpen(false)} />
          
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl relative z-10 space-y-6">
            <div>
              <h3 className="text-lg font-extrabold text-slate-855 dark:text-slate-205">Issue Library Catalog</h3>
              <p className="text-xs text-slate-455 dark:text-slate-500 mt-1">Input the borrower parameters to approve catalog issuance.</p>
            </div>

            <form onSubmit={handleIssueBookSubmit} className="space-y-5">
              
              {/* Borrower Type */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                  Borrower Type
                </label>
                <div className="flex gap-6">
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-755 dark:text-slate-300">
                    <input
                      type="radio"
                      name="borrowerType"
                      value="student"
                      checked={borrowerType === 'student'}
                      onChange={() => setBorrowerType('student')}
                    />
                    Student
                  </label>
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-755 dark:text-slate-300">
                    <input
                      type="radio"
                      name="borrowerType"
                      value="faculty"
                      checked={borrowerType === 'faculty'}
                      onChange={() => setBorrowerType('faculty')}
                    />
                    Faculty / HOD
                  </label>
                </div>
              </div>

              {/* Borrower Name */}
              <div className="relative">
                <input
                  type="text"
                  required
                  id="student_name"
                  value={issueData.student_name}
                  onChange={(e) => setIssueData({ ...issueData, student_name: e.target.value })}
                  className="block px-3.5 pb-2.5 pt-4.5 w-full text-xs text-slate-800 dark:text-slate-250 bg-slate-55 dark:bg-slate-955 rounded-xl border border-slate-250 dark:border-slate-805 appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all peer"
                  placeholder=" "
                />
                <label
                  htmlFor="student_name"
                  className="absolute text-[10px] text-slate-455 dark:text-slate-500 duration-200 transform -translate-y-3.5 scale-90 top-2 z-10 origin-[0] bg-white dark:bg-slate-900 px-1.5 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-2 peer-placeholder-shown:top-2 peer-focus:-translate-y-3.5 peer-focus:top-2 peer-focus:scale-90 left-2.5"
                >
                  {borrowerType === 'student' ? 'Student Full Name' : 'Faculty Member Name'}
                </label>
              </div>

              {/* Borrower ID (Roll No or Employee ID) */}
              <div className="relative">
                <input
                  type="text"
                  required
                  id="roll_no"
                  value={issueData.roll_no}
                  onChange={(e) => setIssueData({ ...issueData, roll_no: e.target.value })}
                  className="block px-3.5 pb-2.5 pt-4.5 w-full text-xs text-slate-800 dark:text-slate-250 bg-slate-55 dark:bg-slate-955 rounded-xl border border-slate-250 dark:border-slate-805 appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all peer"
                  placeholder=" "
                />
                <label
                  htmlFor="roll_no"
                  className="absolute text-[10px] text-slate-455 dark:text-slate-500 duration-200 transform -translate-y-3.5 scale-90 top-2 z-10 origin-[0] bg-white dark:bg-slate-900 px-1.5 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-2 peer-placeholder-shown:top-2 peer-focus:-translate-y-3.5 peer-focus:top-2 peer-focus:scale-90 left-2.5"
                >
                  {borrowerType === 'student' ? 'Student Roll No' : 'Faculty Employee ID'}
                </label>
              </div>

              {/* Book Selection */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                  Select Book Copy
                </label>
                <select
                  value={issueData.book_id}
                  onChange={(e) => setIssueData({ ...issueData, book_id: parseInt(e.target.value) })}
                  className="block w-full px-3 py-3 bg-slate-55 dark:bg-slate-955 border border-slate-255 dark:border-slate-800 rounded-xl text-slate-755 dark:text-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent cursor-pointer"
                  title="Select Book"
                >
                  {books.map((b) => (
                    <option key={b.id} value={b.id} disabled={b.quantity_available === 0}>
                      {b.title} {b.quantity_available === 0 ? '(Out of stock)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Modal Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsIssueModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs font-bold text-white bg-indigo-650 hover:bg-indigo-500 rounded-xl transition-all shadow-md shadow-indigo-650/20"
                >
                  Approve Issuance
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Student Request Success Modal */}
      {isRequestModalOpen && requestedBook && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={() => setIsRequestModalOpen(false)} />
          
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl relative z-10 space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="text-center space-y-3">
              <div className="mx-auto h-12 w-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/25">
                <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-extrabold text-slate-850 dark:text-slate-200">Book Issued Online!</h3>
              <p className="text-xs text-slate-550 dark:text-slate-450">
                Your online reservation has been confirmed.
              </p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-955 border border-slate-100 dark:border-slate-850/80 p-4 rounded-2xl space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Book Title:</span>
                <span className="font-extrabold text-slate-755 dark:text-slate-250">{requestedBook.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Author:</span>
                <span className="font-bold text-slate-600 dark:text-slate-405">{requestedBook.author}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Edition:</span>
                <span className="font-semibold text-slate-655 dark:text-slate-350">{requestedBook.edition || '1st Edition'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">ISBN:</span>
                <span className="font-mono text-slate-500 dark:text-slate-405">{requestedBook.isbn}</span>
              </div>
            </div>

            <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl space-y-1.5">
              <p className="text-[10px] font-bold text-amber-700 dark:text-amber-455 uppercase tracking-wider flex items-center gap-1.5">
                <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5" className="flex-shrink-0 animate-pulse">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Physical Collection Required
              </p>
              <p className="text-[11px] text-amber-800/90 dark:text-amber-450/90 leading-relaxed font-semibold">
                To collect the physical copy of this book, you must visit the Central Library counter and present your Student ID before <strong className="text-slate-900 dark:text-slate-100 font-extrabold">{pickupExpiryTime}</strong>. 
                Failure to pick up the book within 48 hours will release the online reservation slot.
              </p>
            </div>

            <button
              onClick={() => setIsRequestModalOpen(false)}
              className="w-full py-3 bg-indigo-650 hover:bg-indigo-600 text-white text-xs font-bold rounded-xl shadow-md transition-all"
            >
              Understand & Acknowledge
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
