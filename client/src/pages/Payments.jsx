import React, { useEffect, useState, useCallback } from 'react';
import { FiPlus, FiEdit2, FiCreditCard, FiTrash2 } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import StatusBadge from '../components/StatusBadge';
import Pagination from '../components/Pagination';
import PaymentModal from '../components/PaymentModal';
import EditPaymentModal from '../components/EditPaymentModal';
import ConfirmDialog from '../components/ConfirmDialog';
import api from '../services/api';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function Payments() {
  const navigate = useNavigate();
  const [payments, setPayments] = useState([]);
  const [status, setStatus] = useState('');
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [paymentOpen, setPaymentOpen] = useState(false);

  // Row-action state
  const [editingPayment, setEditingPayment] = useState(null);
  const [payingStudent, setPayingStudent] = useState(null);
  const [deletingPayment, setDeletingPayment] = useState(null);
  const [deleting, setDeleting] = useState(false);

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

  const handleDelete = async () => {
    if (!deletingPayment) return;
    setDeleting(true);
    try {
      await api.delete(`/payments/${deletingPayment.id}`);
      toast.success('Payment removed — month marked as due again.');
      fetchPayments(pagination.page);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete payment');
    } finally {
      setDeleting(false);
      setDeletingPayment(null);
    }
  };

  return (
    <Layout>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-5">
        <h1 className="text-xl font-bold text-gray-800">Payments</h1>
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
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9} className="text-center py-8 text-gray-400">Loading...</td></tr>
            ) : payments.length === 0 ? (
              <tr><td colSpan={9} className="text-center py-8 text-gray-400">No payment records found</td></tr>
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
                  <td>
                    <div className="flex items-center justify-end gap-3 text-gray-400">
                      <button
                        title="Edit payment"
                        className="hover:text-primary-600"
                        onClick={() => setEditingPayment(p)}
                      >
                        <FiEdit2 size={16} />
                      </button>
                      {p.status !== 'paid' && (
                        <button
                          title="Receive payment for this month"
                          className="hover:text-green-600"
                          onClick={() => setPayingStudent(p.Student)}
                        >
                          <FiCreditCard size={16} />
                        </button>
                      )}
                      <button
                        title="Delete / reverse this payment"
                        className="hover:text-red-600"
                        onClick={() => setDeletingPayment(p)}
                      >
                        <FiTrash2 size={16} />
                      </button>
                    </div>
                  </td>
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
        onSuccess={(receipt) => {
          fetchPayments(pagination.page);
          // Take the teacher straight to the printable/downloadable PDF receipt.
          if (receipt?.id) navigate(`/receipt/${receipt.id}`);
        }}
      />

      {/* Pay a specific student's pending months from the row action */}
      <PaymentModal
        open={!!payingStudent}
        student={payingStudent}
        onClose={() => setPayingStudent(null)}
        onSuccess={(receipt) => {
          setPayingStudent(null);
          fetchPayments(pagination.page);
          if (receipt?.id) navigate(`/receipt/${receipt.id}`);
        }}
      />

      <EditPaymentModal
        open={!!editingPayment}
        payment={editingPayment}
        onClose={() => setEditingPayment(null)}
        onSuccess={() => fetchPayments(pagination.page)}
      />

      <ConfirmDialog
        open={!!deletingPayment}
        onClose={() => setDeletingPayment(null)}
        onConfirm={handleDelete}
        title="Delete this payment?"
        message={
          deletingPayment
            ? `This will reverse the payment for ${deletingPayment.Student?.name} — ${MONTH_NAMES[deletingPayment.month - 1]} ${deletingPayment.year} — and mark that month as due again. This can't be undone.`
            : ''
        }
      />
    </Layout>
  );
}