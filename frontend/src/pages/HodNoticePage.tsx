import React, { useEffect, useState } from 'react';

export default function HodNoticePage() {
  const [title, setTitle] = useState('');
  const [audience, setAudience] = useState('All CS Students');
  const [category, setCategory] = useState('Academic');
  const [content, setContent] = useState('');
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAnnouncements = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;
      const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";
      const response = await fetch(`${API_BASE_URL}/users/me/notifications`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setAnnouncements(data || []);
      }
    } catch (err) {
      console.error("Failed to load HOD notice board alerts", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;
      
      const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";
      const targetRole = audience === 'All CS Students' ? 'student' : (audience === 'CS Faculty' ? 'faculty' : null);

      const response = await fetch(`${API_BASE_URL}/users/me/notifications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title,
          message: content,
          target_role: targetRole
        })
      });

      if (response.ok) {
        setTitle('');
        setContent('');
        setShowSuccessToast(true);
        fetchAnnouncements();
        setTimeout(() => {
          setShowSuccessToast(false);
        }, 4000);
      } else {
        alert("Failed to broadcast notice. Verify permissions.");
      }
    } catch (err) {
      console.error("Failed to post notice announcement", err);
      alert("Error broadcasting notice.");
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="border-b border-slate-200/80 dark:border-slate-800/80 pb-5">
        <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Department Bulletins & Notices
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-450 mt-0.5">
          Compose notifications and check academic circular timelines
        </p>
      </div>

      {/* Success Toast */}
      {showSuccessToast && (
        <div className="fixed bottom-5 right-5 z-50 bg-emerald-600 text-white px-5 py-3.5 rounded-2xl shadow-xl flex items-center gap-3 border border-emerald-500/20 animate-bounce">
          <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-xs font-bold">Bulletin notification successfully published to targets!</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Notice Composer */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 p-6 rounded-3xl shadow-sm space-y-6 transition-colors duration-300 lg:col-span-1">
          <div>
            <h3 className="font-extrabold text-slate-850 dark:text-slate-200 text-base">Notice Composer</h3>
            <p className="text-xs text-slate-450 mt-0.5">Publish alerts to department students or faculty</p>
          </div>

          <form onSubmit={handlePublish} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider">
                Announcement Title
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Lab schedule change"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="block w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider">
                Target Audience
              </label>
              <select
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                className="block w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option>All CS Students</option>
                <option>CS Faculty</option>
                <option>All Department members</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-455 dark:text-slate-500 uppercase tracking-wider">
                Bulletin Details
              </label>
              <textarea
                required
                rows={4}
                placeholder="Write detail text here..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="block w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <button
              type="submit"
              className="w-full mt-2 py-3 px-4 border border-transparent text-xs font-bold rounded-xl text-white bg-indigo-650 hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-650/20"
            >
              <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              <span>Broadcast Notice</span>
            </button>
          </form>
        </div>

        {/* Previous Bulletin Logs */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 p-6 rounded-3xl shadow-sm space-y-6 transition-colors duration-300 lg:col-span-2">
          <div>
            <h3 className="font-extrabold text-slate-850 dark:text-slate-200 text-base">Bulletin Log</h3>
            <p className="text-xs text-slate-455 mt-0.5">Timeline of previously broadcasted department circulars</p>
          </div>

          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
            {loading ? (
              <p className="text-slate-400 text-xs py-4 text-center">Syncing bulletins...</p>
            ) : announcements.length === 0 ? (
              <p className="text-slate-400 text-xs py-4 text-center">No circulars posted yet.</p>
            ) : (
              announcements.map((notice, idx) => (
                <div
                  key={idx}
                  className="p-5 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-2xl space-y-3"
                >
                  <div className="flex justify-between items-center">
                    <span className="px-2.5 py-0.5 rounded text-[9px] font-extrabold border bg-indigo-500/10 text-indigo-500 border-indigo-500/20">
                      Circular
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold">
                      {new Date(notice.created_at || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {notice.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                    {notice.message}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
