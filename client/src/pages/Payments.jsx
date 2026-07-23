import React, { useEffect, useState, useCallback } from 'react';
import { FiPlus } from 'react-icons/fi';
import { toast } from 'react-toastify';
import Layout from '../components/Layout';
import StatusBadge from '../components/StatusBadge';
import Pagination from '../components/Pagination';
import PaymentModal from '../components/PaymentModal';
import api from '../services/api';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function Payments() {
  const [payments, setPayments] = useState([]);
  const [status, setStatus] = useState('');
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [paymentOpen, setPaymentOpen] = useState(false);

  const fetchPayments = useCallback((page = 1) => {
    setLoading(true);
    api.get('/payments', { params: { status, page, limit: 20 } })
      .then((res) => {
        setPayments(res.data.data);
        setPagination(res.data.pagination);
      })
      .catch(() => toast.error('Failed to load payments'))
      .finally(() => setLoading(false));
  }, [status]);

  useEffect(() => { fetchPayments(1); }, [fetchPayments]);

  return (
    <Layout>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-5">
        <h1 className="text-xl font-bold text-gray-800">Payments</h1>
        {/* Receiving a payment now happens right here in a modal — no separate page/navigation needed. */}
        <button className="btn-primary flex items-center gap-2 w-fit" onClick={() => setPaymentOpen(true)}>
          <FiPlus /> Receive Payment
        </button>
      </div>

      <div className="card mb-4">
        <select className="input-field max-w-xs" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All Status</option>
          <option value="paid">Paid</option>
          <option value="partial">Partial</option>
          <option value="due">Due</option>
        </select>
      </div>

      <div className="card overflow-x-auto">
        <table className="table-base">
          <thead>
            <tr>
              <th>Student</th>
              <th>Roll</th>
              <th>Month</th>
              <th>Fee</th>
              <th>Paid</th>
              <th>Due</th>
              <th>Status</th>
              <th>Payment Date</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="text-center py-8 text-gray-400">Loading...</td></tr>
            ) : payments.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-8 text-gray-400">No payment records found</td></tr>
            ) : (
              payments.map((p) => (
                <tr key={p.id}>
                  <td>{p.Student?.name}</td>
                  <td className="text-primary-700 font-medium">{p.Student?.rollNo}</td>
                  <td>{MONTH_NAMES[p.month - 1]} {p.year}</td>
                  <td>৳{p.monthlyFee}</td>
                  <td>৳{p.paidAmount}</td>
                  <td>৳{p.dueAmount}</td>
                  <td><StatusBadge status={p.status} /></td>
                  <td>{p.paymentDate || '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Pagination page={pagination.page} totalPages={pagination.totalPages} onChange={fetchPayments} />

      <PaymentModal
        open={paymentOpen}
        onClose={() => setPaymentOpen(false)}
        onSuccess={() => fetchPayments(pagination.page)}
      />
    </Layout>
  );
}