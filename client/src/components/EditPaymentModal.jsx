import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import Modal from './Modal';
import api from '../services/api';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * Lets a teacher directly edit a single monthly payment record (fee, paid
 * amount, due amount, status, date, method, notes) — used from the
 * Payments ledger's "Edit" row action.
 *
 * Props:
 *  - open, onClose
 *  - payment: the MonthlyPayment row being edited (includes Student)
 *  - onSuccess(updatedRecord): called after a successful save
 */
export default function EditPaymentModal({ open, onClose, payment, onSuccess }) {
  const [form, setForm] = useState({
    paidAmount: 0,
    dueAmount: 0,
    status: 'due',
    paymentDate: '',
    paymentMethod: 'Cash',
    notes: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && payment) {
      setForm({
        paidAmount: Number(payment.paidAmount) || 0,
        dueAmount: Number(payment.dueAmount) || 0,
        status: payment.status || 'due',
        paymentDate: payment.paymentDate ? String(payment.paymentDate).slice(0, 10) : '',
        paymentMethod: payment.paymentMethod || 'Cash',
        notes: payment.notes || '',
      });
    }
  }, [open, payment]);

  if (!payment) return null;

  const update = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const res = await api.put(`/payments/${payment.id}`, {
        paidAmount: form.paidAmount,
        dueAmount: form.dueAmount,
        status: form.status,
        paymentDate: form.paymentDate || null,
        paymentMethod: form.paymentMethod,
        notes: form.notes,
      });
      toast.success('Payment updated successfully');
      onSuccess?.(res.data.data);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update payment');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Edit Payment" maxWidth="max-w-md">
      <div className="mb-4 bg-gray-50 rounded-lg px-4 py-3">
        <p className="font-semibold">{payment.Student?.name}</p>
        <p className="text-xs text-gray-500">
          {payment.Student?.rollNo} • {MONTH_NAMES[payment.month - 1]} {payment.year}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="label">Paid Amount</label>
          <input
            type="number"
            className="input-field"
            value={form.paidAmount}
            onChange={(e) => update('paidAmount', e.target.value)}
          />
        </div>
        <div>
          <label className="label">Due Amount</label>
          <input
            type="number"
            className="input-field"
            value={form.dueAmount}
            onChange={(e) => update('dueAmount', e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="label">Status</label>
          <select className="input-field" value={form.status} onChange={(e) => update('status', e.target.value)}>
            <option value="due">Due</option>
            <option value="partial">Partial</option>
            <option value="paid">Paid</option>
          </select>
        </div>
        <div>
          <label className="label">Payment Method</label>
          <select className="input-field" value={form.paymentMethod} onChange={(e) => update('paymentMethod', e.target.value)}>
            <option>Cash</option>
            <option>bKash</option>
            <option>Nagad</option>
            <option>Bank Transfer</option>
          </select>
        </div>
      </div>

      <div className="mb-4">
        <label className="label">Payment Date</label>
        <input
          type="date"
          className="input-field"
          value={form.paymentDate}
          onChange={(e) => update('paymentDate', e.target.value)}
        />
      </div>

      <div className="mb-5">
        <label className="label">Notes</label>
        <textarea
          className="input-field"
          rows={2}
          value={form.notes}
          onChange={(e) => update('notes', e.target.value)}
        />
      </div>

      <div className="flex justify-end gap-2">
        <button className="btn-secondary" onClick={onClose}>Cancel</button>
        <button className="btn-primary" disabled={saving} onClick={handleSubmit}>
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </Modal>
  );
}