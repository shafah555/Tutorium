import React from 'react';

const STYLES = {
  active: 'bg-green-100 text-green-700',
  completed: 'bg-blue-100 text-blue-700',
  inactive: 'bg-gray-100 text-gray-600',
  paid: 'bg-green-100 text-green-700',
  partial: 'bg-amber-100 text-amber-700',
  due: 'bg-red-100 text-red-700',
};

export default function StatusBadge({ status }) {
  const style = STYLES[status] || 'bg-gray-100 text-gray-600';
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-semibold capitalize ${style}`}>
      {status}
    </span>
  );
}
