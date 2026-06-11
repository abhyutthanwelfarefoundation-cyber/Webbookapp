import { Link, useNavigate, useLocation } from 'react-router-dom';
import { MdLogout, MdMenuBook, MdDashboard, MdLibraryBooks, MdHelp, MdPeople, MdFolder, MdConfirmationNumber, MdMenu, MdClose ,  MdSchool  } from 'react-icons/md';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import useAuthStore from '../../store/authStore';
import toast from 'react-hot-toast';

function useWindowWidth() {
  const [width, setWidth] = useState(window.innerWidth);
  useEffect(() => {
    const fn = () => setWidth(window.innerWidth);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);
  return width;
}

export default function Navbar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const width = useWindowWidth();
  const isMobile = width < 768;

  const handleLogout = () => {
    logout();
    toast.success('Logged out');
    navigate('/login');
    setMenuOpen(false);
  };

  const adminLinks = [
    { to: '/admin', label: 'Dashboard', icon: <MdDashboard size={17} />, exact: true },
    { to: '/admin/books', label: 'Books', icon: <MdLibraryBooks size={17} /> },
    { to: '/admin/categories', label: 'Categories', icon: <MdFolder size={17} /> },
    { to: '/admin/agents', label: 'Agents', icon: <MdPeople size={17} /> },
    { to: '/admin/tickets', label: 'Support', icon: <MdConfirmationNumber size={17} /> },
    { to: '/visits', label: 'Visits', icon: <MdSchool size={17} />, exact: true },
    { to: '/admin/visits', label: 'Visits', icon: <MdSchool size={17} /> },
  ];

const agentLinks = [
    { to: '/dashboard', label: 'Catalog', icon: <MdLibraryBooks size={17} />, exact: true },
    { to: '/visits', label: 'Visits', icon: <MdSchool size={17} />, exact: true },
    { to: '/help', label: 'Help', icon: <MdHelp size={17} />, exact: true },
  ];

  const isAdminRoute = location.pathname.startsWith('/admin');
  const links = isAdminRoute ? adminLinks : agentLinks;

  const isActive = (link) => link.exact
    ? location.pathname === link.to
    : location.pathname.startsWith(link.to);

  return (
    <nav style={{
      background: 'linear-gradient(90deg,#1e1b4b 0%,#312e81 100%)',
      position: 'sticky', top: 0, zIndex: 100,
      boxShadow: '0 2px 20px rgba(0,0,0,0.2)'
    }}>
      {/* Top bar */}
      <div style={{
        display: 'flex', alignItems: 'center',
        padding: '0 16px', height: 56, gap: 8
      }}>

        {/* Logo */}
        <Link
          to={user?.role === 'admin' ? '/admin' : '/dashboard'}
          style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', flexShrink: 0 }}
        >
          <div style={{
            width: 32, height: 32,
            background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
            borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <MdMenuBook size={18} color="#fff" />
          </div>
          {!isMobile && (
            <span style={{ color: '#fff', fontSize: 15, fontWeight: 600 }}>BookPresent</span>
          )}
        </Link>

        {/* Desktop only — mode switcher + links */}
        {!isMobile && (
          <>
            {user?.role === 'admin' && (
              <Link
                to={isAdminRoute ? '/dashboard' : '/admin'}
                style={{
                  padding: '5px 10px', borderRadius: 7, textDecoration: 'none',
                  fontSize: 12, color: 'rgba(255,255,255,0.55)',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  marginLeft: 4, marginRight: 8, whiteSpace: 'nowrap', flexShrink: 0
                }}
              >
                {isAdminRoute ? 'View Catalog →' : '← Admin Panel'}
              </Link>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1, overflow: 'hidden' }}>
              {links.map(link => {
                const active = isActive(link);
                return (
                  <Link key={link.to} to={link.to} style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '6px 12px', borderRadius: 8,
                    textDecoration: 'none', fontSize: 13,
                    fontWeight: active ? 500 : 400,
                    color: active ? '#fff' : 'rgba(255,255,255,0.55)',
                    background: active ? 'rgba(255,255,255,0.12)' : 'transparent',
                    transition: 'all 0.15s', whiteSpace: 'nowrap',
                    position: 'relative'
                  }}>
                    {link.icon} {link.label}
                    {active && (
                      <motion.div
                        layoutId="nav-active"
                        style={{
                          position: 'absolute', bottom: 0, left: '50%',
                          transform: 'translateX(-50%)',
                          width: 16, height: 2,
                          background: '#a78bfa', borderRadius: 2
                        }}
                        transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                      />
                    )}
                  </Link>
                );
              })}
            </div>
          </>
        )}

        {isMobile && <div style={{ flex: 1 }} />}

        {/* Right side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {/* User pill */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 20, padding: isMobile ? '4px 8px 4px 4px' : '4px 12px 4px 4px'
          }}>
            <div style={{
              width: 28, height: 28,
              background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
              borderRadius: '50%', display: 'flex', alignItems: 'center',
              justifyContent: 'center', color: '#fff', fontSize: 12, fontWeight: 600
            }}>
              {user?.name?.[0]?.toUpperCase()}
            </div>
            {!isMobile && (
              <div style={{ lineHeight: 1.2 }}>
                <p style={{ margin: 0, fontSize: 12, fontWeight: 500, color: '#fff' }}>{user?.name}</p>
                <p style={{ margin: 0, fontSize: 10, color: 'rgba(255,255,255,0.45)', textTransform: 'capitalize' }}>{user?.role}</p>
              </div>
            )}
          </div>

          {/* Desktop logout */}
          {!isMobile && (
            <button
              onClick={handleLogout}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 8, padding: '6px 12px',
                color: 'rgba(255,255,255,0.6)', fontSize: 13,
                cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s'
              }}
              onMouseEnter={e => e.currentTarget.style.color = '#f87171'}
              onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.6)'}
            >
              <MdLogout size={16} /> Logout
            </button>
          )}

          {/* Mobile hamburger */}
          {isMobile && (
            <button
              onClick={() => setMenuOpen(p => !p)}
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 8, padding: 6, cursor: 'pointer',
                color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}
            >
              {menuOpen ? <MdClose size={20} /> : <MdMenu size={20} />}
            </button>
          )}
        </div>
      </div>

      {/* Mobile dropdown — only renders on mobile */}
      {isMobile && (
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              style={{
                background: 'rgba(15,12,50,0.98)',
                borderTop: '1px solid rgba(255,255,255,0.08)',
                overflow: 'hidden'
              }}
            >
              <div style={{ padding: '8px 12px 14px' }}>

                {/* Mode switcher */}
                {user?.role === 'admin' && (
                  <Link
                    to={isAdminRoute ? '/dashboard' : '/admin'}
                    onClick={() => setMenuOpen(false)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '11px 14px', borderRadius: 10,
                      textDecoration: 'none', fontSize: 14,
                      color: 'rgba(255,255,255,0.7)',
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      marginBottom: 8
                    }}
                  >
                    {isAdminRoute ? '→ View Catalog' : '← Admin Panel'}
                  </Link>
                )}

                {/* Nav links */}
                {links.map(link => {
                  const active = isActive(link);
                  return (
                    <Link
                      key={link.to}
                      to={link.to}
                      onClick={() => setMenuOpen(false)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '11px 14px', borderRadius: 10,
                        textDecoration: 'none', fontSize: 14,
                        fontWeight: active ? 600 : 400,
                        color: active ? '#fff' : 'rgba(255,255,255,0.65)',
                        background: active ? 'rgba(99,102,241,0.25)' : 'transparent',
                        marginBottom: 2, transition: 'all 0.15s'
                      }}
                    >
                      {link.icon} {link.label}
                    </Link>
                  );
                })}

                {/* Logout */}
                <button
                  onClick={handleLogout}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '11px 14px', borderRadius: 10,
                    background: 'rgba(239,68,68,0.1)',
                    border: '1px solid rgba(239,68,68,0.2)',
                    color: '#f87171', fontSize: 14,
                    cursor: 'pointer', fontFamily: 'inherit',
                    width: '100%', marginTop: 6
                  }}
                >
                  <MdLogout size={18} /> Logout
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </nav>
  );
}