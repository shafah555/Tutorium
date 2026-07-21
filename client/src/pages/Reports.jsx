import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { FiDownload } from 'react-icons/fi';
import Layout from '../components/Layout';
import api from '../services/api';

const REPORTS = [
  { key: 'monthly', label: 'Monthly Collection Report', path: '/reports/monthly' },
  { key: 'due', label: 'Due Report', path: '/reports/due' },
  { key: 'students-active', label: 'Student Report (Active)', path: '/reports/students', params: { status: 'active' } },
  { key: 'students-completed', label: 'Completed Student Report', path: '/reports/students', params: { status: 'completed' } },
  { key: 'model-tests', label: 'Model Test Report', path: '/reports/model-tests' },
  { key: 'income-month', label: 'Income Report (By Month)', path: '/reports/income', params: { groupBy: 'month' } },
  { key: 'income-year', label: 'Income Report (By Year)', path: '/reports/income', params: { groupBy: 'year' } },
];

export default function Reports() {
  const [downloading, setDownloading] = useState(null);

  const download = async (report, format) => {
    setDownloading(`${report.key}-${format}`);
    try {
      const token = localStorage.getItem('tutorium_token');
      const params = new URLSearchParams({ ...(report.params || {}), format });
      const base = import.meta.env.VITE_API_URL;
      const res = await fetch(`${base}${report.path}?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${report.key}.${format === 'excel' ? 'xlsx' : format}`;
      a.click();
    } catch (err) {
      toast.error('Failed to export report');
    } finally {
      setDownloading(null);
    }
  };

  return (
    <Layout>
      <h1 className="text-xl font-bold text-gray-800 mb-5">Reports</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {REPORTS.map((report) => (
          <div key={report.key} className="card flex items-center justify-between">
            <span className="font-medium text-gray-700">{report.label}</span>
            <div className="flex gap-2">
              {['excel', 'csv', 'pdf'].map((format) => (
                <button
                  key={format}
                  className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1"
                  disabled={downloading === `${report.key}-${format}`}
                  onClick={() => download(report, format)}
                >
                  <FiDownload size={12} /> {format.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Layout>
  );
}
