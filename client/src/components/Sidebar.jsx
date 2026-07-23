import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  FiHome, FiUsers, FiDollarSign, FiFileText, FiClipboard,
  FiBarChart2, FiSettings, FiX,
} from 'react-icons/fi';

const links = [
  { to: '/', label: 'Dashboard', icon: FiHome, end: true },
  { to: '/students', label: 'Students', icon: FiUsers },
  { to: '/payments', label: 'Payments', icon: FiDollarSign },
  { to: '/model-tests', label: 'Model Tests', icon: FiClipboard },
  { to: '/reports', label: 'Reports', icon: FiBarChart2 },
  { to: '/settings', label: 'Settings', icon: FiSettings },
];

export default function Sidebar({ open, onClose }) {
  return (
    <>
      {open && (
        <div className="fixed inset-0 bg-black/50 z-30 md:hidden" onClick={onClose} />
      )}
      <aside
        className={`fixed z-40 md:z-auto md:static top-0 left-0 h-full w-64 bg-space-gradient border-r border-space-900 transform transition-transform duration-200
        ${open ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}
      >
        <div className="flex items-center justify-between px-5 h-16 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="sun-badge">T</div>
            <span className="font-bold text-lg text-white tracking-tight">Tutorium</span>
          </div>
          <button className="md:hidden text-space-200" onClick={onClose}>
            <FiX size={20} />
          </button>
        </div>
        <nav className="p-3 space-y-1">
          {links.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 ${
                  isActive
                    ? 'bg-white/10 text-primary-400 shadow-inner'
                    : 'text-space-200 hover:bg-white/5 hover:text-white'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
}