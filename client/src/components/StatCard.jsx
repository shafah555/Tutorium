import React from 'react';

export default function StatCard({ label, value, icon: Icon, accent = 'primary' }) {
  const colors = {
    primary: 'bg-primary-50 text-primary-700',
    green: 'bg-green-50 text-green-700',
    red: 'bg-red-50 text-red-700',
    amber: 'bg-amber-50 text-amber-700',
  };

  return (
    <div className="card flex items-center justify-between">
      <div>
        <p className="text-xs text-gray-500 font-medium">{label}</p>
        <p className="text-2xl font-bold text-gray-800 mt-1">{value}</p>
      </div>
      {Icon && (
        <div className={`w-11 h-11 rounded-lg flex items-center justify-center ${colors[accent]}`}>
          <Icon size={20} />
        </div>
      )}
    </div>
  );
}
