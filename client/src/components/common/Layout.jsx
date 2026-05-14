import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiOutlineBookOpen, HiOutlineHome, HiOutlineLogout,
  HiOutlineMenu, HiOutlineX, HiOutlineUser
} from 'react-icons/hi';
import useAuthStore from '../../store/authStore';

export default function Layout({ children }) {
  const [open, setOpen]    = useState(false);
  const { user, logout }   = useAuthStore();
  const navigate           = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  const navLink = 'flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 text-gray-600 hover:bg-gray-100 hover:text-gray-900';
  const activeNavLink = '!bg-blue-50 !text-blue-700';

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar — desktop */}
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-gray-100 fixed inset-y-0 left-0 z-30 p-4">
        <SidebarContent navLink={navLink} activeNavLink={activeNavLink} user={user} handleLogout={handleLogout} />
      </aside>

      {/* Mobile overlay */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setOpen(false)} />
            <motion.aside initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }}
              transition={{ type: 'tween', duration: 0.25 }}
              className="fixed inset-y-0 left-0 w-64 bg-white z-50 p-4 flex flex-col lg:hidden">
              <button onClick={() => setOpen(false)} className="self-end p-1 text-gray-500 mb-2">
                <HiOutlineX className="w-5 h-5" />
              </button>
              <SidebarContent navLink={navLink} activeNavLink={activeNavLink} user={user} handleLogout={handleLogout} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        {/* Top bar — mobile only */}
        <header className="lg:hidden sticky top-0 z-20 bg-white border-b border-gray-100 px-4 h-14 flex items-center justify-between">
          <button onClick={() => setOpen(true)} className="p-1 text-gray-600">
            <HiOutlineMenu className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-2">
            <HiOutlineBookOpen className="w-5 h-5 text-blue-600" />
            <span className="font-semibold text-gray-900 text-sm">BookShelf</span>
          </div>
          <div className="w-8" />
        </header>

        <main className="flex-1 p-4 lg:p-6 max-w-6xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

function SidebarContent({ navLink, activeNavLink, user, handleLogout }) {
  return (
    <>
      {/* Logo */}
      <div className="flex items-center gap-3 px-2 mb-8">
        <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
          <HiOutlineBookOpen className="w-5 h-5 text-white" />
        </div>
        <span className="font-bold text-gray-900">BookShelf</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1">
        <NavLink to="/dashboard" className={({ isActive }) => `${navLink} ${isActive ? activeNavLink : ''}`}>
          <HiOutlineHome className="w-5 h-5 flex-shrink-0" /> Dashboard
        </NavLink>
        {user?.role === 'admin' && (
          <>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 pt-4 pb-1">Admin</p>
            <NavLink to="/admin" end className={({ isActive }) => `${navLink} ${isActive ? activeNavLink : ''}`}>
              <HiOutlineHome className="w-5 h-5 flex-shrink-0" /> Overview
            </NavLink>
            <NavLink to="/admin/books" className={({ isActive }) => `${navLink} ${isActive ? activeNavLink : ''}`}>
              <HiOutlineBookOpen className="w-5 h-5 flex-shrink-0" /> Books
            </NavLink>
            <NavLink to="/admin/categories" className={({ isActive }) => `${navLink} ${isActive ? activeNavLink : ''}`}>
              <HiOutlineBookOpen className="w-5 h-5 flex-shrink-0" /> Categories
            </NavLink>
            <NavLink to="/admin/agents" className={({ isActive }) => `${navLink} ${isActive ? activeNavLink : ''}`}>
              <HiOutlineUser className="w-5 h-5 flex-shrink-0" /> Agents
            </NavLink>
          </>
        )}
      </nav>

      {/* User info + logout */}
      <div className="border-t border-gray-100 pt-4 mt-4">
        <div className="flex items-center gap-3 px-2 mb-3">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-sm flex-shrink-0">
            {user?.name?.charAt(0)?.toUpperCase()}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
            <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
          </div>
        </div>
        <button onClick={handleLogout} className={`${navLink} w-full text-red-500 hover:bg-red-50 hover:text-red-600`}>
          <HiOutlineLogout className="w-5 h-5 flex-shrink-0" /> Sign out
        </button>
      </div>
    </>
  );
}
