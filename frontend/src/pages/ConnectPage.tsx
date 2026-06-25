import React, { useEffect, useState, useRef } from 'react';
import { userService } from '../services/api';

interface Contact {
  id: number;
  username: string;
  name: string;
  role: string;
  email: string;
  phone: string;
  dept_name: string;
  profile_photo?: string;
}

interface Message {
  sender: 'me' | 'them';
  text: string;
  timestamp: string;
}

export default function ConnectPage() {
  const [directory, setDirectory] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  
  // Chat state
  const [chatMessages, setChatMessages] = useState<Record<number, Message[]>>({});
  const [newMessage, setNewMessage] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Email form state
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailTo, setEmailTo] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailStatus, setEmailStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  useEffect(() => {
    const fetchDirectory = async () => {
      try {
        const response = await userService.getDirectory();
        // filter out system admins if needed, or keep everyone except admin
        const list: Contact[] = response.data || [];
        // Sort: Principal (5) -> HOD (2) -> Class Counsellor (7) -> Faculty (3) -> Librarian (6) -> Students
        const roleOrder: Record<string, number> = {
          'principal': 1,
          'hod': 2,
          'class_counsellor': 3,
          'faculty': 4,
          'librarian': 5,
          'student': 6,
          'admin': 7
        };
        const sorted = [...list].sort((a, b) => {
          const roleA = a.role.toLowerCase();
          const roleB = b.role.toLowerCase();
          return (roleOrder[roleA] || 99) - (roleOrder[roleB] || 99);
        });
        setDirectory(sorted);
        if (sorted.length > 0) {
          // Select principal or first contact by default
          const firstContact = sorted.find(c => c.role.toLowerCase() !== 'admin') || sorted[0];
          setSelectedContact(firstContact);
        }
      } catch (err) {
        console.error('Failed to load connect directory', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDirectory();
  }, []);

  // Scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, selectedContact]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedContact) return;

    const contactId = selectedContact.id;
    const timeStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const userMsg: Message = { sender: 'me', text: newMessage, timestamp: timeStr };

    // Update active chat messages
    const currentMsgs = chatMessages[contactId] || [];
    const updatedMsgs = [...currentMsgs, userMsg];
    setChatMessages(prev => ({
      ...prev,
      [contactId]: updatedMsgs
    }));

    setNewMessage('');

    // Trigger mock response
    setTimeout(() => {
      const responses = [
        `Hello! I received your message. I will check this and get back to you soon.`,
        `Hi, thank you for reaching out. Let me review the details.`,
        `Greetings, please email me the official application if it requires HOD/Principal sign-off.`,
        `Received. I am currently in a meeting, will respond by evening.`,
        `Okay, thank you for informing. Let's discuss this tomorrow.`
      ];
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      const responseMsg: Message = {
        sender: 'them',
        text: randomResponse,
        timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      };
      setChatMessages(prev => ({
        ...prev,
        [contactId]: [...(prev[contactId] || []), responseMsg]
      }));
    }, 1000);
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailTo.trim() || !emailSubject.trim() || !emailBody.trim()) return;

    setSendingEmail(true);
    setEmailStatus(null);
    try {
      await userService.sendEmail({
        to_email: emailTo,
        subject: emailSubject,
        body: emailBody
      });
      setEmailStatus({ type: 'success', msg: 'Email sent successfully via SMTP!' });
      setTimeout(() => {
        setShowEmailModal(false);
        setEmailSubject('');
        setEmailBody('');
        setEmailStatus(null);
      }, 2000);
    } catch (err) {
      setEmailStatus({ type: 'error', msg: 'Failed to send email. Please check connection.' });
    } finally {
      setSendingEmail(false);
    }
  };

  const openEmailModal = (contact: Contact) => {
    setEmailTo(contact.email);
    setEmailSubject(`Query regarding Pathshala ERP`);
    setEmailBody(`Dear ${contact.name},\n\n`);
    setEmailStatus(null);
    setShowEmailModal(true);
  };

  const filteredContacts = directory.filter(c => {
    const term = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(term) ||
      c.role.toLowerCase().includes(term) ||
      c.email.toLowerCase().includes(term) ||
      (c.dept_name && c.dept_name.toLowerCase().includes(term))
    );
  });

  const getRoleBadgeColor = (roleStr: string) => {
    const r = roleStr.toLowerCase();
    if (r === 'principal') return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/25';
    if (r === 'hod') return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25';
    if (r === 'class_counsellor') return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25';
    if (r === 'librarian') return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/25';
    if (r === 'student') return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/25';
    return 'bg-slate-500/10 text-slate-600 dark:text-slate-450 border-slate-500/25';
  };

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
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200/80 dark:border-slate-800/80 pb-5">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Connect Directory
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-450 mt-0.5">
            Institutional directory directory lookup, simulated live chat, and official mail sender.
          </p>
        </div>
        <button
          onClick={() => {
            setEmailTo('');
            setEmailSubject('');
            setEmailBody('');
            setEmailStatus(null);
            setShowEmailModal(true);
          }}
          className="flex items-center justify-center px-4 py-2 text-xs font-bold text-white bg-indigo-650 hover:bg-indigo-500 rounded-xl transition-all shadow-md shadow-indigo-650/20 gap-2"
        >
          <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          Compose Direct Email
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-230px)]">
        {/* Left column - contacts list */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-3xl shadow-sm flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-slate-850">
            <div className="relative">
              <input
                type="text"
                placeholder="Search by name, role, or department..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <svg width="14" height="14" className="absolute left-3 top-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-850">
            {filteredContacts.length > 0 ? (
              filteredContacts.map(contact => (
                <div
                  key={contact.id}
                  onClick={() => setSelectedContact(contact)}
                  className={`p-4 flex items-start gap-3 cursor-pointer transition-all hover:bg-slate-50/50 dark:hover:bg-slate-850/20 ${
                    selectedContact?.id === contact.id ? 'bg-indigo-50/40 dark:bg-indigo-950/20 border-l-4 border-indigo-650' : ''
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center font-bold text-indigo-750 dark:text-indigo-350 shrink-0 border border-indigo-200/45 overflow-hidden">
                    {contact.profile_photo ? (
                      <img src={contact.profile_photo} alt={contact.name} className="w-full h-full object-cover" />
                    ) : (
                      contact.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-200 truncate">
                        {contact.name}
                      </h4>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-extrabold border shrink-0 ${getRoleBadgeColor(contact.role)}`}>
                        {contact.role.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                    {contact.dept_name && (
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase mt-0.5">
                        {contact.dept_name}
                      </p>
                    )}
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                      <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24" className="shrink-0 text-slate-400">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <span className="truncate">{contact.email}</span>
                    </p>
                    {contact.phone && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1">
                        <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24" className="shrink-0 text-slate-400">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        <span>{contact.phone}</span>
                      </p>
                    )}

                    <div className="flex gap-2 mt-3" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => setSelectedContact(contact)}
                        className="px-2.5 py-1 text-[10px] font-extrabold text-indigo-650 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100/50 rounded-lg border border-indigo-100 dark:border-indigo-900/30 transition-all flex items-center gap-1"
                      >
                        <svg width="10" height="10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        Chat
                      </button>
                      <button
                        onClick={() => openEmailModal(contact)}
                        className="px-2.5 py-1 text-[10px] font-extrabold text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-850 hover:bg-slate-100 rounded-lg border border-slate-200 dark:border-slate-800 transition-all flex items-center gap-1"
                      >
                        <svg width="10" height="10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        Email
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-slate-400 dark:text-slate-550 font-bold">
                No matching members found.
              </div>
            )}
          </div>
        </div>

        {/* Right column - active chat window */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-3xl shadow-sm flex flex-col overflow-hidden">
          {selectedContact ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-slate-100 dark:border-slate-850 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center font-bold text-indigo-750 dark:text-indigo-350 overflow-hidden border border-indigo-200/45">
                    {selectedContact.profile_photo ? (
                      <img src={selectedContact.profile_photo} alt={selectedContact.name} className="w-full h-full object-cover" />
                    ) : (
                      selectedContact.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
                    )}
                  </div>
                  <div>
                    <h3 className="text-xs font-extrabold text-slate-800 dark:text-slate-200 leading-tight">
                      {selectedContact.name}
                    </h3>
                    <p className="text-[9px] font-bold uppercase tracking-wider text-emerald-500 flex items-center gap-1 mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      Available / Online
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => openEmailModal(selectedContact)}
                  className="px-3 py-1.5 text-[10px] font-bold text-indigo-650 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 rounded-xl border border-indigo-100 dark:border-indigo-900/30 transition-all flex items-center gap-1.5"
                >
                  <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Email Member
                </button>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 dark:bg-slate-950/20">
                <div className="flex justify-center">
                  <span className="px-3 py-1 text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest bg-slate-100 dark:bg-slate-900 rounded-full border border-slate-200/30">
                    Direct Messenger (Simulated)
                  </span>
                </div>

                {(chatMessages[selectedContact.id] || []).length > 0 ? (
                  (chatMessages[selectedContact.id] || []).map((msg, i) => (
                    <div
                      key={i}
                      className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-2xl px-4 py-2 text-xs shadow-sm leading-relaxed ${
                          msg.sender === 'me'
                            ? 'bg-indigo-650 text-white rounded-br-none'
                            : 'bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 text-slate-850 dark:text-slate-200 rounded-bl-none'
                        }`}
                      >
                        <p className="font-medium whitespace-pre-wrap">{msg.text}</p>
                        <span className={`block text-[9px] text-right mt-1 font-bold ${
                          msg.sender === 'me' ? 'text-indigo-200' : 'text-slate-400'
                        }`}>
                          {msg.timestamp}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-3">
                    <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-850 flex items-center justify-center text-slate-400">
                      <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-750 dark:text-slate-300">No Messages Yet</h4>
                      <p className="text-[11px] text-slate-450 dark:text-slate-500 max-w-xs mt-1">
                        Send a message to start a conversation with {selectedContact.name}. Standard auto-responses are simulated.
                      </p>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Chat Input */}
              <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-100 dark:border-slate-850 bg-white dark:bg-slate-900 flex gap-2">
                <input
                  type="text"
                  placeholder={`Send message to ${selectedContact.name}...`}
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-indigo-650 hover:bg-indigo-500 rounded-xl shadow-md shadow-indigo-650/20 transition-all flex items-center justify-center gap-1 shrink-0"
                >
                  <span>Send</span>
                  <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </form>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-3">
              <div className="w-16 h-16 rounded-full bg-slate-50 dark:bg-slate-850 flex items-center justify-center text-slate-400">
                <svg width="32" height="32" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-750 dark:text-slate-350">Select a Contact</h3>
                <p className="text-xs text-slate-500 dark:text-slate-500 max-w-sm mt-1">
                  Choose a department head, counsellor, or colleague from the left directory to chat or compose mail.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Email Composer Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
            <div className="p-5 border-b border-slate-100 dark:border-slate-850 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  Compose Official Email
                </h3>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Sends mock SMTP requests logged in terminal standard output.
                </p>
              </div>
              <button
                onClick={() => setShowEmailModal(false)}
                className="text-slate-450 hover:text-slate-600 dark:hover:text-slate-300"
                title="Close Modal"
              >
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSendEmail} className="p-5 space-y-4">
              {emailStatus && (
                <div className={`p-3 rounded-xl text-xs font-bold border ${
                  emailStatus.type === 'success'
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                    : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                }`}>
                  {emailStatus.msg}
                </div>
              )}

              <div>
                <label className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">To (Email Address)</label>
                <input
                  type="email"
                  required
                  placeholder="name.dept@pathshala.edu.in"
                  value={emailTo}
                  onChange={e => setEmailTo(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">Subject</label>
                <input
                  type="text"
                  required
                  placeholder="Official topic..."
                  value={emailSubject}
                  onChange={e => setEmailSubject(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">Email Body</label>
                <textarea
                  required
                  rows={6}
                  placeholder="Type your official mail content here..."
                  value={emailBody}
                  onChange={e => setEmailBody(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEmailModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-550 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sendingEmail}
                  className="px-4 py-2 text-xs font-bold text-white bg-indigo-650 hover:bg-indigo-500 rounded-xl shadow-md shadow-indigo-650/20 transition-all flex items-center gap-1.5"
                >
                  {sendingEmail ? (
                    <>
                      <svg className="animate-spin h-3 w-3 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Sending...
                    </>
                  ) : (
                    <>
                      <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                      Send Email
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
