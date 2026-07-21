import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <h1 className="text-6xl font-bold text-primary-600 mb-2">404</h1>
      <p className="text-gray-500 mb-6">Page not found</p>
      <Link to="/" className="btn-primary">Go to Dashboard</Link>
    </div>
  );
}
