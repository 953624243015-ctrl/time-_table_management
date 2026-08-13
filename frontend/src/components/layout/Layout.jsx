import { Outlet } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

const Layout = () => {
  const [collapsed, setCollapsed]       = useState(false);
  const [mobileOpen, setMobileOpen]     = useState(false);
  const [isMobile, setIsMobile]         = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) setMobileOpen(false); // close drawer when going desktop
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }} className="bg-slate-50 dark:bg-slate-950">

      {/* Desktop sidebar */}
      {!isMobile && (
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} />
      )}

      {/* Mobile sidebar — overlay drawer */}
      {isMobile && (
        <Sidebar
          mobileOpen={mobileOpen}
          onMobileClose={() => setMobileOpen(false)}
        />
      )}

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
        <Navbar
          onMenuClick={() => isMobile ? setMobileOpen(true) : setCollapsed(c => !c)}
          showMenu={true}
        />
        <main style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '12px' : '24px' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
