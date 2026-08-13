import { Moon, Sun, LogOut, User, Menu } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useNavigate, useLocation } from 'react-router-dom';
import notify from '../../utils/notify';

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

const Navbar = ({ onMenuClick, showMenu }) => {
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
        padding: '0 12px 0 8px',
        height: 65,
        minHeight: 65,
        borderBottom: '1px solid #e2e8f0',
        backgroundColor: '#ffffff',
        position: 'sticky',
        top: 0,
        zIndex: 30,
        flexShrink: 0,
        gap: 8,
      }}
      className="dark:bg-slate-900 dark:border-slate-700"
    >
      {/* Left: hamburger + title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flex: 1 }}>
        {showMenu && (
          <button
            onClick={onMenuClick}
            style={{
              padding: 8, borderRadius: 8, border: 'none',
              background: 'transparent', cursor: 'pointer',
              color: '#64748b', display: 'flex', alignItems: 'center', flexShrink: 0,
            }}
            title="Menu"
          >
            <Menu size={20} />
          </button>
        )}
        <h1
          style={{
            fontSize: 16, fontWeight: 600, color: '#0f172a', margin: 0,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}
          className="dark:text-slate-100"
        >
          {title}
        </h1>
      </div>

      {/* Right: actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
        {/* Dark mode toggle */}
        <button
          onClick={toggle}
          style={{ padding: 8, borderRadius: 8, border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center' }}
          title={dark ? 'Light Mode' : 'Dark Mode'}
        >
          {dark ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* User avatar */}
        <div
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            paddingLeft: 8, borderLeft: '1px solid #e2e8f0',
            marginLeft: 4,
          }}
          className="dark:border-slate-700"
        >
          <div style={{ width: 32, height: 32, background: '#2563eb', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <User size={15} color="white" />
          </div>
          {/* Name — hidden on mobile */}
          <div style={{ lineHeight: 1.3, display: 'none' }} className="sm:block">
            <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', whiteSpace: 'nowrap' }} className="dark:text-slate-100">{user?.name}</div>
            <div style={{ fontSize: 11, color: '#94a3b8', textTransform: 'capitalize' }}>{user?.role}</div>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          style={{ padding: 8, borderRadius: 8, border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center' }}
          title="Logout"
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
};

export default Navbar;
