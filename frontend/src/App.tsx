import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import DashboardPage from './pages/DashboardPage';
import StudentPage from './pages/StudentPage';
import FacultyPage from './pages/FacultyPage';
import FeesPage from './pages/FeesPage';
import ExamsPage from './pages/ExamsPage';
import AssignmentsPage from './pages/AssignmentsPage';
import LibraryPage from './pages/LibraryPage';
import DashboardShell from './components/DashboardShell';
import ProfileSettingsPage from './pages/ProfileSettingsPage';
import HolidaysPage from './pages/HolidaysPage';
import ConnectPage from './pages/ConnectPage';
import LeavesPage from './pages/LeavesPage';
import PrincipalTrackerPage from './pages/PrincipalTrackerPage';
import CollaborationRoomPage from './pages/CollaborationRoomPage';

// Role specific pages

import HodDashboardPage from './pages/HodDashboardPage';
import HodFacultyAssignPage from './pages/HodFacultyAssignPage';
import HodNoticePage from './pages/HodNoticePage';
import FacultyDashboardPage from './pages/FacultyDashboardPage';
import FacultyAttendancePage from './pages/FacultyAttendancePage';
import FacultyMarksPage from './pages/FacultyMarksPage';
import StudentDashboardPage from './pages/StudentDashboardPage';
import StudentAttendancePage from './pages/StudentAttendancePage';
import StudentResultsPage from './pages/StudentResultsPage';
import StudentFeesPage from './pages/StudentFeesPage';
import StudentTimetablePage from './pages/StudentTimetablePage';
import MeetingsPage from './pages/MeetingsPage';

import { ThemeProvider } from './context/ThemeContext';
import { UserProvider, useUser } from './context/UserContext';

function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: string[] }) {
  const { isAuthenticated, role } = useUser();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/dashboard" />;
  }
  
  return <DashboardShell>{children}</DashboardShell>;
}

function DynamicDashboard() {
  const { role } = useUser();
  if (role === 'hod') return <HodDashboardPage />;
  if (role === 'faculty') return <FacultyDashboardPage />;
  if (role === 'student') return <StudentDashboardPage />;
  return <DashboardPage />;
}

function App() {
  return (
    <UserProvider>
      <ThemeProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            
            {/* Dynamic Dashboards */}
            <Route path="/dashboard" element={<ProtectedRoute><DynamicDashboard /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><ProfileSettingsPage /></ProtectedRoute>} />
            <Route path="/holidays" element={<ProtectedRoute><HolidaysPage /></ProtectedRoute>} />
            
            {/* Shared directories (read-only for HOD, full CRUD for Admin) */}
            <Route path="/students" element={<ProtectedRoute allowedRoles={['admin', 'hod', 'principal', 'class_counsellor']}><StudentPage /></ProtectedRoute>} />
            <Route path="/faculty" element={<ProtectedRoute allowedRoles={['admin', 'hod', 'principal']}><FacultyPage /></ProtectedRoute>} />
            <Route path="/fees" element={<ProtectedRoute allowedRoles={['admin', 'hod', 'principal']}><FeesPage /></ProtectedRoute>} />
            <Route path="/library" element={<ProtectedRoute allowedRoles={['student', 'hod', 'librarian', 'principal']}><LibraryPage /></ProtectedRoute>} />

            {/* HOD exclusive routes */}
            <Route path="/hod-assign" element={<ProtectedRoute allowedRoles={['hod', 'principal']}><HodFacultyAssignPage /></ProtectedRoute>} />
            <Route path="/hod-notice" element={<ProtectedRoute allowedRoles={['hod', 'admin', 'principal']}><HodNoticePage /></ProtectedRoute>} />

            {/* Faculty exclusive routes */}
            <Route path="/faculty-attendance" element={<ProtectedRoute allowedRoles={['faculty', 'class_counsellor', 'hod', 'librarian', 'principal']}><FacultyAttendancePage /></ProtectedRoute>} />
            <Route path="/faculty-marks" element={<ProtectedRoute allowedRoles={['faculty', 'class_counsellor']}><FacultyMarksPage /></ProtectedRoute>} />
            
            {/* Admin and Faculty Assignments */}
            <Route path="/assignments" element={<ProtectedRoute allowedRoles={['faculty', 'student', 'class_counsellor']}><AssignmentsPage /></ProtectedRoute>} />

            {/* Admin/Principal exclusive routes */}
            <Route path="/exams" element={<ProtectedRoute allowedRoles={['principal']}><ExamsPage /></ProtectedRoute>} />

            {/* Student exclusive routes */}
            <Route path="/student-attendance" element={<ProtectedRoute allowedRoles={['student']}><StudentAttendancePage /></ProtectedRoute>} />
            <Route path="/student-results" element={<ProtectedRoute allowedRoles={['student']}><StudentResultsPage /></ProtectedRoute>} />
            <Route path="/student-fees" element={<ProtectedRoute allowedRoles={['student']}><StudentFeesPage /></ProtectedRoute>} />
            {/* Shared routes for all authenticated users */}
            <Route path="/timetable" element={<ProtectedRoute allowedRoles={['hod', 'faculty', 'student', 'principal', 'class_counsellor']}><StudentTimetablePage /></ProtectedRoute>} />
            
            {/* Admin exclusive tracking portal */}
            <Route path="/principal-tracker" element={<ProtectedRoute allowedRoles={['admin']}><PrincipalTrackerPage /></ProtectedRoute>} />
            <Route path="/collaboration" element={<ProtectedRoute allowedRoles={['hod', 'principal']}><CollaborationRoomPage /></ProtectedRoute>} />
            <Route path="/meetings" element={<ProtectedRoute><MeetingsPage /></ProtectedRoute>} />
            <Route path="/connect" element={<ProtectedRoute><ConnectPage /></ProtectedRoute>} />
            <Route path="/leaves" element={<ProtectedRoute><LeavesPage /></ProtectedRoute>} />

            <Route path="/" element={<Navigate to="/dashboard" />} />
            <Route path="*" element={<Navigate to="/dashboard" />} />
          </Routes>
        </Router>
      </ThemeProvider>
    </UserProvider>
  );
}

export default App;
