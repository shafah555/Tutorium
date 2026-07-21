import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler,
} from 'chart.js';
import { FiUsers, FiUserCheck, FiUserX, FiDollarSign, FiAlertCircle, FiClipboard } from 'react-icons/fi';
import Layout from '../components/Layout';
import StatCard from '../components/StatCard';
import api from '../services/api';
import { toast } from 'react-toastify';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler);

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard')
      .then((res) => setData(res.data.data))
      .catch(() => toast.error('Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin h-8 w-8 border-4 border-primary-600 border-t-transparent rounded-full" />
        </div>
      </Layout>
    );
  }

  const chart = data?.monthlyCollectionChart || [];
  const chartData = {
    labels: chart.map((c) => `${MONTH_NAMES[c.month - 1]} ${c.year}`),
    datasets: [
      {
        label: 'Collected',
        data: chart.map((c) => c.collected),
        borderColor: '#2563eb',
        backgroundColor: 'rgba(37,99,235,0.1)',
        fill: true,
        tension: 0.35,
      },
    ],
  };

  return (
    <Layout>
      <h1 className="text-xl font-bold text-gray-800 mb-5">Dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Students" value={data?.totalStudents ?? 0} icon={FiUsers} accent="primary" />
        <StatCard label="Active Students" value={data?.activeStudents ?? 0} icon={FiUserCheck} accent="green" />
        <StatCard label="Completed Students" value={data?.completedStudents ?? 0} icon={FiUserX} accent="amber" />
        <StatCard label="Collected This Month" value={`৳${data?.collectedThisMonth ?? 0}`} icon={FiDollarSign} accent="green" />
        <StatCard label="Due This Month" value={`৳${data?.dueThisMonth ?? 0}`} icon={FiAlertCircle} accent="red" />
        <StatCard label="Model Test Collection" value={`৳${data?.modelTestCollection ?? 0}`} icon={FiClipboard} accent="primary" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card lg:col-span-2">
          <h2 className="font-semibold text-gray-700 mb-4">Monthly Collection (Last 6 months)</h2>
          <Line data={chartData} options={{ responsive: true, plugins: { legend: { display: false } } }} />
        </div>
        <div className="card">
          <h2 className="font-semibold text-gray-700 mb-4">Notifications</h2>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
              <span className="text-red-700">Students with due</span>
              <span className="font-bold text-red-700">{data?.notifications?.studentsWithDue ?? 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <span className="text-green-700">Today's payments</span>
              <span className="font-bold text-green-700">{data?.notifications?.todaysPaymentsCount ?? 0}</span>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
