import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Building2, Users, BookOpen, GraduationCap,
  DoorOpen, Clock, Cpu, Eye, ChevronLeft, ChevronRight, Settings,
  Timer, BarChart3, History, ClipboardList, ScrollText
} from 'lucide-react';

const navItems = [
  { label: 'Dashboard',         icon: LayoutDashboard, path: '/' },
  { divider: true, label: 'MANAGEMENT' },
  { label: 'Departments',       icon: Building2,       path: '/departments' },
  { label: 'Staff',             icon: Users,           path: '/staff' },
  { label: 'Subjects',          icon: BookOpen,        path: '/subjects' },
  { label: 'Classes',           icon: GraduationCap,   path: '/classes' },
  { label: 'Rooms',             icon: DoorOpen,        path: '/rooms' },
  { divider: true, label: 'SCHEDULE' },
  { label: 'Time Slots',        icon: Clock,           path: '/timeslots' },
  { label: 'Interval Settings', icon: Timer,           path: '/intervals' },
  { label: 'Academic Settings', icon: Settings,        path: '/academic-settings' },
  { divider: true, label: 'TIMETABLE' },
  { label: 'Generate',          icon: Cpu,             path: '/timetable/generate', highlight: true },
  { label: 'View Timetable',    icon: Eye,             path: '/timetable/view' },
  { label: 'History',           icon: History,         path: '/timetable/history' },
  { divider: true, label: 'REPORTS' },
  { label: 'Attendance',        icon: ClipboardList,   path: '/attendance' },
  { label: 'Statistics',        icon: BarChart3,       path: '/statistics' },
  { label: 'Audit Log',         icon: ScrollText,      path: '/audit' },
];

const Sidebar = ({ collapsed, onToggle }) => {
  const location = useLocation();
  const width = collapsed ? 64 : 256;

  return (
    <aside
      style={{
        width,
        minWidth: width,
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.3s',
        overflowX: 'hidden',
        flexShrink: 0,
        borderRight: '1px solid #e2e8f0',
        backgroundColor: '#ffffff',
        position: 'sticky',
        top: 0,
      }}
      className="dark:bg-slate-900 dark:border-slate-700"
    >
      {/* Logo */}
      <div
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', minHeight: 65, borderBottom: '1px solid #e2e8f0' }}
        className="dark:border-slate-700"
      >
        {!collapsed ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
              <div style={{ width: 32, height: 32, background: '#2563eb', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Cpu size={18} color="white" />
              </div>
              <div style={{ lineHeight: 1.2 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap' }} className="dark:text-slate-100">AI Timetable</div>
                <div style={{ fontSize: 10, color: '#94a3b8', whiteSpace: 'nowrap' }}>Management System</div>
              </div>
            </div>
            <button
              onClick={onToggle}
              style={{ padding: 4, borderRadius: 6, border: 'none', background: 'transparent', cursor: 'pointer', color: '#94a3b8' }}
              className="hover:bg-slate-100 dark:hover:bg-slate-700"
            >
              <ChevronLeft size={16} />
            </button>
          </>
        ) : (
          <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
            <div style={{ width: 32, height: 32, background: '#2563eb', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Cpu size={18} color="white" />
            </div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '12px 8px' }}>
        {navItems.map((item, idx) => {
          if (item.divider) {
            return (
              <div key={idx}>
                <div style={{ borderTop: '1px solid #e2e8f0', margin: '6px 0' }} className="dark:border-slate-700" />
                {!collapsed && item.label && (
                  <p style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', padding: '2px 12px 4px', letterSpacing: '0.08em' }}>
                    {item.label}
                  </p>
                )}
              </div>
            );
          }
          const Icon = item.icon;
          const isActive = item.path === '/'
            ? location.pathname === '/'
            : location.pathname.startsWith(item.path);

          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              style={({ isActive: a }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 12px',
                borderRadius: 8,
                textDecoration: 'none',
                fontSize: 14,
                fontWeight: 500,
                marginBottom: 2,
                transition: 'all 0.15s',
                background: a ? '#2563eb' : 'transparent',
                color: a ? '#ffffff' : '#475569',
                border: item.highlight && !a ? '1px solid #bfdbfe' : '1px solid transparent',
              })}
              title={collapsed ? item.label : ''}
            >
              <Icon size={18} style={{ flexShrink: 0 }} />
              {!collapsed && <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* Expand button when collapsed */}
      {collapsed && (
        <div style={{ padding: '12px 0', display: 'flex', justifyContent: 'center' }}>
          <button
            onClick={onToggle}
            style={{ padding: 8, borderRadius: 6, border: 'none', background: 'transparent', cursor: 'pointer', color: '#94a3b8' }}
            className="hover:bg-slate-100 dark:hover:bg-slate-700"
            title="Expand sidebar"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
