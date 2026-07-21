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
        <div className="fixed inset-0 bg-black/40 z-30 md:hidden" onClick={onClose} />
      )}
      <aside
        className={`fixed z-40 md:z-auto md:static top-0 left-0 h-full w-64 bg-white border-r border-gray-100 transform transition-transform duration-200
        ${open ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}
      >
        <div className="flex items-center justify-between px-5 h-16 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary-600 text-white flex items-center justify-center font-bold">T</div>
            <span className="font-bold text-lg text-primary-700">Tutorium</span>
          </div>
          <button className="md:hidden text-gray-500" onClick={onClose}>
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
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? 'bg-primary-50 text-primary-700' : 'text-gray-600 hover:bg-gray-50'
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
