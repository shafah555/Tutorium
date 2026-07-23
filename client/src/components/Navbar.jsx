import React from 'react';
import { FiMenu, FiLogOut, FiUser } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar({ onMenuClick }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-4 md:px-6 sticky top-0 z-20">
      <button className="md:hidden text-gray-600" onClick={onMenuClick}>
        <FiMenu size={22} />
      </button>
      <div className="hidden md:block" />
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-sm text-gray-700">
          <div className="w-8 h-8 rounded-full bg-solar-gradient text-white flex items-center justify-center shadow-sm">
            <FiUser size={16} />
          </div>
          <span className="font-medium">{user?.name || 'Tutor'}</span>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-primary-700 transition-colors"
          title="Logout"
        >
          <FiLogOut size={16} />
        </button>
      </div>
    </header>
  );
}