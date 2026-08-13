import notify from '../../utils/notify';
import { Moon, Sun, LogOut, User, Bell } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useNavigate, useLocation } from 'react-router-dom';


const pageTitles = {
  '/': 'Dashboard',
  '/departments': 'Department Management',
  '/staff': 'Staff Management',
  '/subjects': 'Subject Management',
  '/classes': 'Class Management',
  '/rooms': 'Room Management',
  '/timeslots': 'Time Slot Management',
  '/academic-settings': 'Academic Settings',
  '/intervals': 'Interval & Time Settings',
  '/timetable/generate': 'Timetable Generator',
  '/timetable/view': 'Timetable Viewer',
  '/timetable/history': 'Timetable History',
  '/attendance': 'Attendance',
  '/statistics': 'Statistics & Analytics',
  '/audit': 'Audit Log',
};

const Navbar = () => {
  const { user, logout } = useAuth();
  const { dark, toggle } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const title = pageTitles[location.pathname] || 'AI Timetable System';

  const handleLogout = () => {
    logout();
    notify.success('Logged out successfully');
    navigate('/login');
  };

  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        height: 65,
        minHeight: 65,
        borderBottom: '1px solid #e2e8f0',
        backgroundColor: '#ffffff',
        position: 'sticky',
        top: 0,
        zIndex: 30,
        flexShrink: 0,
      }}
      className="dark:bg-slate-900 dark:border-slate-700"
    >
      <h1 style={{ fontSize: 18, fontWeight: 600, color: '#0f172a', margin: 0 }} className="dark:text-slate-100">
        {title}
      </h1>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {/* Theme toggle */}
        <button
          onClick={toggle}
          style={{ padding: 8, borderRadius: 8, border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center' }}
          className="hover:bg-slate-100 dark:hover:bg-slate-700"
          title={dark ? 'Light Mode' : 'Dark Mode'}
        >
          {dark ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Notifications */}
        <button
          style={{ padding: 8, borderRadius: 8, border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', position: 'relative' }}
          className="hover:bg-slate-100 dark:hover:bg-slate-700"
        >
          <Bell size={18} />
          <span style={{ position: 'absolute', top: 8, right: 8, width: 8, height: 8, background: '#ef4444', borderRadius: '50%' }} />
        </button>

        {/* Divider */}
        <div style={{ width: 1, height: 32, background: '#e2e8f0', margin: '0 8px' }} className="dark:bg-slate-700" />

        {/* User info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 34, height: 34, background: '#2563eb', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <User size={16} color="white" />
          </div>
          <div style={{ lineHeight: 1.3 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', whiteSpace: 'nowrap' }} className="dark:text-slate-100">{user?.name}</div>
            <div style={{ fontSize: 11, color: '#94a3b8', textTransform: 'capitalize' }}>{user?.role}</div>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          style={{ padding: 8, borderRadius: 8, border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center' }}
          className="hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600"
          title="Logout"
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
};

export default Navbar;

