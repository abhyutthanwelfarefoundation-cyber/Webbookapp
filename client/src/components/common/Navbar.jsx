import { Link, useNavigate, useLocation } from 'react-router-dom';
import { MdLogout, MdMenuBook, MdDashboard, MdLibraryBooks, MdHelp, MdPeople, MdFolder, MdConfirmationNumber } from 'react-icons/md';
import { motion } from 'framer-motion';
import useAuthStore from '../../store/authStore';
import toast from 'react-hot-toast';

export default function Navbar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const adminLinks = [
    { to: '/admin', label: 'Dashboard', icon: <MdDashboard size={16} />, exact: true },
    { to: '/admin/books', label: 'Books', icon: <MdLibraryBooks size={16} /> },
    { to: '/admin/categories', label: 'Categories', icon: <MdFolder size={16} /> },
    { to: '/admin/agents', label: 'Agents', icon: <MdPeople size={16} /> },
    { to: '/admin/tickets', label: 'Support', icon: <MdConfirmationNumber size={16} /> },
  ];

  const agentLinks = [
    { to: '/dashboard', label: 'Catalog', icon: <MdLibraryBooks size={16} />, exact: true },
    { to: '/help', label: 'Help', icon: <MdHelp size={16} />, exact: true },
  ];

  // Show admin links only on /admin routes, agent links on /dashboard routes
  const isAdminRoute = location.pathname.startsWith('/admin');
  const links = isAdminRoute ? adminLinks : agentLinks;

  const isActive = (link) => link.exact
    ? location.pathname === link.to
    : location.pathname.startsWith(link.to);

  return (
    <nav style={{
      background: 'linear-gradient(90deg,#1e1b4b 0%,#312e81 100%)',
      height: 56,
      display: 'flex',
      alignItems: 'center',
      padding: '0 20px',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      boxShadow: '0 2px 20px rgba(0,0,0,0.2)',
      gap: 0
    }}>
      {/* Logo */}
      <Link
        to={user?.role === 'admin' ? '/admin' : '/dashboard'}
        style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', marginRight: 28, flexShrink: 0 }}
      >
        <div style={{
          width: 34, height: 34,
          background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
          borderRadius: 9,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 2px 8px rgba(99,102,241,0.4)'
        }}>
          <MdMenuBook size={19} color="#fff" />
        </div>
        <span style={{ color: '#fff', fontSize: 16, fontWeight: 600, letterSpacing: 0.3 }}>
          BookPresent
        </span>
      </Link>
{/* Admin mode switcher — only show the OTHER mode, not current */}
      {user?.role === 'admin' && (
        <div style={{ marginRight: 12, flexShrink: 0 }}>
          {isAdminRoute ? (
            <Link to="/dashboard" style={{
              padding: '5px 12px', borderRadius: 7,
              textDecoration: 'none', fontSize: 12, fontWeight: 400,
              color: 'rgba(255,255,255,0.5)',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              transition: 'all 0.15s'
            }}>
              View Catalog →
            </Link>
          ) : (
            <Link to="/admin" style={{
              padding: '5px 12px', borderRadius: 7,
              textDecoration: 'none', fontSize: 12, fontWeight: 400,
              color: 'rgba(255,255,255,0.5)',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              transition: 'all 0.15s'
            }}>
              ← Admin Panel
            </Link>
          )}
        </div>
      )}

      {/* Page links */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1, overflowX: 'auto' }}>
        {links.map(link => {
          const active = isActive(link);
          return (
            <Link
              key={link.to}
              to={link.to}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 12px',
                borderRadius: 8,
                textDecoration: 'none',
                fontSize: 13,
                fontWeight: active ? 500 : 400,
                color: active ? '#fff' : 'rgba(255,255,255,0.55)',
                background: active ? 'rgba(255,255,255,0.1)' : 'transparent',
                transition: 'all 0.15s',
                whiteSpace: 'nowrap',
                position: 'relative'
              }}
            >
              {link.icon}
              <span>{link.label}</span>
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

      {/* User + logout */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'rgba(255,255,255,0.08)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 20,
          padding: '4px 12px 4px 4px'
        }}>
          <div style={{
            width: 28, height: 28,
            background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
            borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: 12, fontWeight: 600
          }}>
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div style={{ lineHeight: 1.2 }}>
            <p style={{ margin: 0, fontSize: 12, fontWeight: 500, color: '#fff' }}>{user?.name}</p>
            <p style={{ margin: 0, fontSize: 10, color: 'rgba(255,255,255,0.45)', textTransform: 'capitalize' }}>{user?.role}</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 8, padding: '6px 12px',
            color: 'rgba(255,255,255,0.6)',
            fontSize: 13, cursor: 'pointer',
            fontFamily: 'inherit', transition: 'all 0.15s'
          }}
          onMouseEnter={e => { e.currentTarget.style.color = '#f87171'; e.currentTarget.style.borderColor = 'rgba(248,113,113,0.3)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
        >
          <MdLogout size={16} />
          <span>Logout</span>
        </button>
      </div>
    </nav>
  );
}