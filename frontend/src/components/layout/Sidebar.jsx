import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Building2, Users, BookOpen, GraduationCap,
  DoorOpen, Clock, Cpu, Eye, ChevronLeft, ChevronRight, Settings,
  Timer, BarChart3, History, ClipboardList, ScrollText, X, Menu
} from 'lucide-react';
import { useEffect } from 'react';

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

const Sidebar = ({ collapsed, onToggle, mobileOpen, onMobileClose }) => {
  const location = useLocation();

  // Close mobile menu on route change
  useEffect(() => {
    if (onMobileClose) onMobileClose();
  }, [location.pathname]);

  // Close on ESC key
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape' && onMobileClose) onMobileClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onMobileClose]);

  const width = collapsed ? 64 : 256;

  const sidebarContent = (
    <aside
      style={{
        width: mobileOpen !== undefined ? 260 : width,
        minWidth: mobileOpen !== undefined ? 260 : width,
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.3s',
        overflowX: 'hidden',
        overflowY: 'auto',
        flexShrink: 0,
        borderRight: '1px solid #e2e8f0',
        backgroundColor: '#ffffff',
        position: 'relative',
        zIndex: 40,
      }}
      className="dark:bg-slate-900 dark:border-slate-700"
    >
      {/* Logo / Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          minHeight: 65,
          borderBottom: '1px solid #e2e8f0',
          flexShrink: 0,
        }}
        className="dark:border-slate-700"
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
          <div style={{ width: 32, height: 32, background: '#2563eb', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Cpu size={18} color="white" />
          </div>
          {(!collapsed || mobileOpen !== undefined) && (
            <div style={{ lineHeight: 1.2, overflow: 'hidden' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap' }} className="dark:text-slate-100">AI Timetable</div>
              <div style={{ fontSize: 10, color: '#94a3b8', whiteSpace: 'nowrap' }}>Management System</div>
            </div>
          )}
        </div>
        {/* Close button — mobile only */}
        {mobileOpen !== undefined ? (
          <button onClick={onMobileClose} style={{ padding: 4, borderRadius: 6, border: 'none', background: 'transparent', cursor: 'pointer', color: '#94a3b8' }}>
            <X size={18} />
          </button>
        ) : (
          !collapsed && (
            <button onClick={onToggle} style={{ padding: 4, borderRadius: 6, border: 'none', background: 'transparent', cursor: 'pointer', color: '#94a3b8' }}>
              <ChevronLeft size={16} />
            </button>
          )
        )}
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '10px 8px' }}>
        {navItems.map((item, idx) => {
          if (item.divider) {
            return (
              <div key={idx}>
                <div style={{ borderTop: '1px solid #e2e8f0', margin: '6px 0' }} className="dark:border-slate-700" />
                {(!collapsed || mobileOpen !== undefined) && item.label && (
                  <p style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', padding: '2px 12px 4px', letterSpacing: '0.08em', margin: 0 }}>
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
              title={collapsed && mobileOpen === undefined ? item.label : ''}
            >
              <Icon size={18} style={{ flexShrink: 0 }} />
              {(!collapsed || mobileOpen !== undefined) && (
                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.label}</span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Expand button when desktop-collapsed */}
      {collapsed && mobileOpen === undefined && (
        <div style={{ padding: '12px 0', display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
          <button onClick={onToggle} style={{ padding: 8, borderRadius: 6, border: 'none', background: 'transparent', cursor: 'pointer', color: '#94a3b8' }} title="Expand sidebar">
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </aside>
  );

  // Mobile: render as overlay drawer
  if (mobileOpen !== undefined) {
    return (
      <>
        {/* Backdrop */}
        {mobileOpen && (
          <div
            onClick={onMobileClose}
            style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
              zIndex: 39, backdropFilter: 'blur(2px)',
            }}
          />
        )}
        {/* Drawer */}
        <div style={{
          position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 40,
          transform: mobileOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.3s ease',
          boxShadow: '4px 0 20px rgba(0,0,0,0.15)',
        }}>
          {sidebarContent}
        </div>
      </>
    );
  }

  // Desktop: render normally
  return sidebarContent;
};

export default Sidebar;
