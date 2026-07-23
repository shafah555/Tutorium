import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { FiSearch } from 'react-icons/fi';
import Modal from './Modal';
import api from '../services/api';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * Drop-in "Receive Payment" modal. Used directly from a student's profile
 * (student pre-selected & locked) or from the Payments ledger (teacher
 * searches for a student first) — either way, no dedicated page/navigation
 * is needed to record a payment.
 *
 * Props:
 *  - open, onClose
 *  - student: optional pre-selected student ({ id, name, rollNo, phone }).
 *             If omitted, a search box is shown instead.
 *  - onSuccess(receipt): called after a successful payment
 */
export default function PaymentModal({ open, onClose, student = null, onSuccess }) {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(student);
  const [pendingMonths, setPendingMonths] = useState([]);
  const [selectedIds, setSelectedIds] = useState({});
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));
  const [loadingMonths, setLoadingMonths] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Reset local state whenever the modal is (re)opened
  useEffect(() => {
    if (open) {
      setSelectedStudent(student);
      setSearch('');
      setResults([]);
      setSelectedIds({});
      setPaymentMethod('Cash');
      setPaymentDate(new Date().toISOString().slice(0, 10));
      if (student) loadPendingMonths(student.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, student]);

  const searchStudents = useCallback(() => {
    if (!search) return setResults([]);
    api.get('/students', { params: { search, limit: 8 } }).then((res) => setResults(res.data.data));
  }, [search]);

  useEffect(() => {
    if (!open || student) return; // no free-text search when a student is pre-locked
    const timer = setTimeout(searchStudents, 300);
    return () => clearTimeout(timer);
  }, [search, open, student, searchStudents]);

  const loadPendingMonths = async (studentId) => {
    setLoadingMonths(true);
    try {
      const res = await api.get(`/payments/pending/${studentId}`);
      setPendingMonths(res.data.data);
    } catch {
      toast.error('Failed to load pending months');
    } finally {
      setLoadingMonths(false);
    }
  };

  const selectStudent = (s) => {
    setSelectedStudent(s);
    setResults([]);
    setSearch('');
    setSelectedIds({});
    loadPendingMonths(s.id);
  };

  const toggleMonth = (payment) => {
    setSelectedIds((prev) => {
      const copy = { ...prev };
      if (copy[payment.id] !== undefined) {
        delete copy[payment.id];
      } else {
        copy[payment.id] = Number(payment.dueAmount);
      }
      return copy;
    });
  };

  const updateAmount = (paymentId, value) => {
    setSelectedIds((prev) => ({ ...prev, [paymentId]: Number(value) }));
  };

  const totalSelected = Object.values(selectedIds).reduce((sum, v) => sum + Number(v || 0), 0);

  const handleSubmit = async () => {
    const payments = Object.entries(selectedIds).map(([paymentId, amount]) => ({ paymentId: Number(paymentId), amount }));
    if (!selectedStudent || payments.length === 0) {
      return toast.error('Select a student and at least one month to pay.');
    }
    setSubmitting(true);
    try {
      const res = await api.post('/payments', {
        studentId: selectedStudent.id,
        payments,
        paymentDate,
        paymentMethod,
      });
      toast.success('Payment received successfully!');
      onSuccess?.(res.data.data.receipt);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Payment failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Receive Payment" maxWidth="max-w-lg">
      {!student && (
        <div className="mb-4">
          <label className="label">Select Student</label>
          {selectedStudent ? (
            <div className="flex items-center justify-between bg-primary-50 rounded-lg px-4 py-3">
              <div>
                <p className="font-semibold">{selectedStudent.name}</p>
                <p className="text-xs text-gray-500">{selectedStudent.rollNo} • {selectedStudent.phone}</p>
              </div>
              <button
                className="text-sm text-primary-600 hover:underline"
                onClick={() => { setSelectedStudent(null); setPendingMonths([]); setSelectedIds({}); }}
              >
                Change
              </button>
            </div>
          ) : (
            <div className="relative">
              <FiSearch className="absolute left-3 top-3 text-gray-400" />
              <input
                autoFocus
                className="input-field pl-9"
                placeholder="Search by name, roll, or phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {results.length > 0 && (
                <div className="absolute z-10 bg-white border border-gray-200 rounded-lg mt-1 w-full shadow-lg max-h-64 overflow-y-auto">
                  {results.map((s) => (
                    <button
                      key={s.id}
                      className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm"
                      onClick={() => selectStudent(s)}
                    >
                      <span className="font-medium">{s.name}</span> — {s.rollNo} ({s.phone})
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {selectedStudent && (
        <>
          <h3 className="font-semibold text-gray-700 mb-3">Pending Months</h3>
          {loadingMonths ? (
            <div className="flex justify-center py-6"><div className="orbit-spinner" /></div>
          ) : pendingMonths.length === 0 ? (
            <p className="text-sm text-gray-400 mb-4">No pending months for this student. They are fully paid up!</p>
          ) : (
            <div className="space-y-2 mb-5 max-h-56 overflow-y-auto pr-1">
              {pendingMonths.map((p) => (
                <label key={p.id} className="flex items-center justify-between border border-gray-100 rounded-lg px-3 py-2">
                  <div className="flex items-center gap-3">
                    <input type="checkbox" checked={selectedIds[p.id] !== undefined} onChange={() => toggleMonth(p)} />
                    <span className="text-sm">{MONTH_NAMES[p.month - 1]} {p.year} <span className="text-gray-400">(Due ৳{p.dueAmount})</span></span>
                  </div>
                  {selectedIds[p.id] !== undefined && (
                    <input
                      type="number"
                      className="input-field w-28 py-1"
                      value={selectedIds[p.id]}
                      max={p.dueAmount}
                      onChange={(e) => updateAmount(p.id, e.target.value)}
                    />
                  )}
                </label>
              ))}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="label">Payment Date</label>
              <input type="date" className="input-field" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} />
            </div>
            <div>
              <label className="label">Payment Method</label>
              <select className="input-field" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                <option>Cash</option>
                <option>bKash</option>
                <option>Nagad</option>
                <option>Bank Transfer</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-gray-100 pt-4">
            <span className="font-semibold">Total: ৳{totalSelected}</span>
            <button className="btn-primary" disabled={submitting || totalSelected <= 0} onClick={handleSubmit}>
              {submitting ? 'Processing...' : 'Receive Payment'}
            </button>
          </div>
        </>
      )}
    </Modal>
  );
}