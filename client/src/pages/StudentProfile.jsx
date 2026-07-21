import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FiEdit2, FiTrash2, FiCheckCircle } from 'react-icons/fi';
import Layout from '../components/Layout';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import api from '../services/api';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function StudentProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [completeOpen, setCompleteOpen] = useState(false);
  const [completionDate, setCompletionDate] = useState('');
  const [deleteOpen, setDeleteOpen] = useState(false);

  const load = () => {
    setLoading(true);
    api.get(`/students/${id}`)
      .then((res) => setStudent(res.data.data))
      .catch(() => toast.error('Failed to load student'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [id]);

  const handleComplete = async () => {
    if (!completionDate) return toast.error('Select a completion date');
    try {
      await api.post(`/students/${id}/complete`, { completionDate });
      toast.success('Student marked as completed');
      setCompleteOpen(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/students/${id}`);
      toast.success('Student deleted');
      navigate('/students');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  if (loading || !student) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin h-8 w-8 border-4 border-primary-600 border-t-transparent rounded-full" />
        </div>
      </Layout>
    );
  }

  const payments = student.MonthlyPayments || [];

  return (
    <Layout>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-5">
        <h1 className="text-xl font-bold text-gray-800">Student Profile</h1>
        <div className="flex gap-2">
          {student.status === 'active' && (
            <button className="btn-secondary flex items-center gap-2" onClick={() => setCompleteOpen(true)}>
              <FiCheckCircle /> Complete Student
            </button>
          )}
          <Link to={`/students/${id}/edit`} className="btn-secondary flex items-center gap-2">
            <FiEdit2 /> Edit
          </Link>
          <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2" onClick={() => setDeleteOpen(true)}>
            <FiTrash2 /> Delete
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <div className="card lg:col-span-1 flex flex-col items-center text-center">
          {student.photo ? (
            <img src={`${apiBaseURL.replace(/\/api$/, '')}${student.photo}`} alt={student.name} className="w-24 h-24 rounded-full object-cover mb-3" />
          ) : (
            <div className="w-24 h-24 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-2xl font-bold mb-3">
              {student.name?.[0]}
            </div>
          )}
          <h2 className="font-bold text-lg">{student.name}</h2>
          <p className="text-primary-600 font-medium">{student.rollNo}</p>
          <div className="mt-2"><StatusBadge status={student.status} /></div>
        </div>

        <div className="card lg:col-span-2">
          <h3 className="font-semibold text-gray-700 mb-3">Information</h3>
          <div className="grid grid-cols-2 gap-y-2 text-sm">
            <span className="text-gray-500">Phone</span><span>{student.phone}</span>
            <span className="text-gray-500">Guardian Phone</span><span>{student.guardianPhone || '-'}</span>
            <span className="text-gray-500">School</span><span>{student.school || '-'}</span>
            <span className="text-gray-500">Class / Group</span><span>{student.class} / {student.group}</span>
            <span className="text-gray-500">HSC Year</span><span>{student.hscYear}</span>
            <span className="text-gray-500">Joining Date</span><span>{student.joiningDate}</span>
            {student.completionDate && (<><span className="text-gray-500">Completion Date</span><span>{student.completionDate}</span></>)}
            <span className="text-gray-500">Monthly Fee</span><span>৳{student.monthlyFee}</span>
            <span className="text-gray-500">Address</span><span>{student.address || '-'}</span>
          </div>
        </div>
      </div>

      <div className="card overflow-x-auto">
        <h3 className="font-semibold text-gray-700 mb-3">Payment History</h3>
        <table className="table-base">
          <thead>
            <tr>
              <th>Month</th>
              <th>Fee</th>
              <th>Paid</th>
              <th>Due</th>
              <th>Status</th>
              <th>Payment Date</th>
              <th>Receipt</th>
            </tr>
          </thead>
          <tbody>
            {payments.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-6 text-gray-400">No payment records yet</td></tr>
            ) : (
              payments.sort((a, b) => (b.year - a.year) || (b.month - a.month)).map((p) => (
                <tr key={p.id}>
                  <td>{MONTH_NAMES[p.month - 1]} {p.year}</td>
                  <td>৳{p.monthlyFee}</td>
                  <td>৳{p.paidAmount}</td>
                  <td>৳{p.dueAmount}</td>
                  <td><StatusBadge status={p.status} /></td>
                  <td>{p.paymentDate || '-'}</td>
                  <td>
                    {p.receiptNo ? (
                      <Link to={`/receipt/${p.id}`} className="text-primary-600 hover:underline">{p.receiptNo}</Link>
                    ) : '-'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal open={completeOpen} onClose={() => setCompleteOpen(false)} title="Complete Student" maxWidth="max-w-sm">
        <label className="label">Completion Date</label>
        <input type="date" className="input-field mb-4" value={completionDate} onChange={(e) => setCompletionDate(e.target.value)} />
        <button className="btn-primary w-full" onClick={handleComplete}>Confirm Completion</button>
      </Modal>

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        message="This will permanently delete this student and all related records."
      />
    </Layout>
  );
}
