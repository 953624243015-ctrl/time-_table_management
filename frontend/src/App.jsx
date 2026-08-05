import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Layout from './components/layout/Layout';
import Login from './pages/auth/Login';
import Dashboard from './pages/dashboard/Dashboard';
import Departments from './pages/departments/Departments';
import Staff from './pages/staff/Staff';
import Subjects from './pages/subjects/Subjects';
import Classes from './pages/classes/Classes';
import Rooms from './pages/rooms/Rooms';
import TimeSlots from './pages/timeslots/TimeSlots';
import AcademicSettings from './pages/timeslots/AcademicSettings';
import TimetableGenerator from './pages/timetable/TimetableGenerator';
import TimetableViewer from './pages/timetable/TimetableViewer';
import IntervalSettings from './pages/intervals/IntervalSettings';
import Statistics from './pages/statistics/Statistics';
import TimetableHistory from './pages/history/TimetableHistory';
import AuditLog from './pages/audit/AuditLog';
import Attendance from './pages/attendance/Attendance';
import LoadingSpinner from './components/common/LoadingSpinner';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner fullScreen />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner fullScreen />;
  if (user) return <Navigate to="/" replace />;
  return children;
};

const AppRoutes = () => (
  <Routes>
    <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
    <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
      <Route index element={<Dashboard />} />
      <Route path="departments"        element={<Departments />} />
      <Route path="staff"              element={<Staff />} />
      <Route path="subjects"           element={<Subjects />} />
      <Route path="classes"            element={<Classes />} />
      <Route path="rooms"              element={<Rooms />} />
      <Route path="timeslots"          element={<TimeSlots />} />
      <Route path="academic-settings"  element={<AcademicSettings />} />
      <Route path="intervals"          element={<IntervalSettings />} />
      <Route path="timetable/generate" element={<TimetableGenerator />} />
      <Route path="timetable/view"     element={<TimetableViewer />} />
      <Route path="timetable/history"  element={<TimetableHistory />} />
      <Route path="attendance"         element={<Attendance />} />
      <Route path="statistics"         element={<Statistics />} />
      <Route path="audit"              element={<AuditLog />} />
      <Route path="*"                  element={<Navigate to="/" replace />} />
    </Route>
  </Routes>
);

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </ThemeProvider>
  );
}
