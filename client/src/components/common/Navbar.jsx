import { Link, useNavigate } from 'react-router-dom';
import { MdLogout, MdPerson, MdMenuBook } from 'react-icons/md';
import useAuthStore from '../../store/authStore';
import toast from 'react-hot-toast';

export default function Navbar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  return (
    <nav className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center">
              <MdMenuBook size={20} className="text-white" />
            </div>
            <span className="font-bold text-gray-800 text-lg hidden sm:block">BookPresent</span>
          </Link>

          {/* Nav links */}
          <div className="flex items-center gap-2">
            {user?.role === 'admin' && (
              <Link to="/admin"
                className="px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-xl hover:bg-indigo-100 transition-colors">
                Admin Panel
              </Link>
            )}
          <Link to="/dashboard"
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">
              Catalog
            </Link>
            {user?.role === 'agent' && (
              <Link to="/help"
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">
                Help
              </Link>
            )}
          </div>

          {/* User menu */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-xl">
              <div className="w-7 h-7 bg-indigo-100 rounded-lg flex items-center justify-center">
                <MdPerson size={16} className="text-indigo-600" />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-800 leading-none">{user?.name}</p>
                <p className="text-xs text-gray-400 capitalize">{user?.role}</p>
              </div>
            </div>
            <button onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors">
              <MdLogout size={18} />
              <span className="hidden sm:block">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
