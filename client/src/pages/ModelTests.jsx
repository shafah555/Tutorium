import React, { useEffect, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { FiPlus, FiTrash2, FiEdit2, FiDollarSign, FiSearch } from 'react-icons/fi';
import Layout from '../components/Layout';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import api from '../services/api';

export default function ModelTests() {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [payOpen, setPayOpen] = useState(null); // test object

  const { register, handleSubmit, reset } = useForm();

  const load = useCallback(() => {
    setLoading(true);
    api.get('/model-tests').then((res) => setTests(res.data.data)).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditing(null); reset({ title: '', fee: '', examDate: '', description: '' }); setFormOpen(true); };
  const openEdit = (t) => { setEditing(t); reset(t); setFormOpen(true); };

  const onSubmit = async (data) => {
    try {
      if (editing) {
        await api.put(`/model-tests/${editing.id}`, data);
        toast.success('Model test updated');
      } else {
        await api.post('/model-tests', data);
        toast.success('Model test created');
      }
      setFormOpen(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/model-tests/${deleteId}`);
      toast.success('Deleted');
      load();
    } catch (err) {
      toast.error('Delete failed');
    }
  };

  return (
    <Layout>
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-gray-800">Model Tests</h1>
        <button className="btn-primary flex items-center gap-2" onClick={openCreate}>
          <FiPlus /> New Model Test
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <p className="text-gray-400">Loading...</p>
        ) : tests.length === 0 ? (
          <p className="text-gray-400">No model tests created yet.</p>
        ) : (
          tests.map((t) => (
            <div key={t.id} className="card">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold">{t.title}</h3>
                <span className="text-primary-700 font-bold">৳{t.fee}</span>
              </div>
              <p className="text-xs text-gray-400 mb-3">{t.examDate ? new Date(t.examDate).toLocaleDateString() : 'No date set'}</p>
              <p className="text-sm text-gray-600 mb-4">{t.description}</p>
              <div className="flex gap-3 text-gray-500">
                <button onClick={() => setPayOpen(t)} className="hover:text-primary-600" title="Receive Payment"><FiDollarSign /></button>
                <button onClick={() => openEdit(t)} className="hover:text-primary-600" title="Edit"><FiEdit2 /></button>
                <button onClick={() => setDeleteId(t.id)} className="hover:text-red-600" title="Delete"><FiTrash2 /></button>
              </div>
            </div>
          ))
        )}
      </div>

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={editing ? 'Edit Model Test' : 'New Model Test'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="label">Title</label>
            <input className="input-field" {...register('title', { required: true })} />
          </div>
          <div>
            <label className="label">Fee</label>
            <input type="number" className="input-field" {...register('fee', { required: true })} />
          </div>
          <div>
            <label className="label">Exam Date</label>
            <input type="date" className="input-field" {...register('examDate')} />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input-field" rows={3} {...register('description')} />
          </div>
          <button type="submit" className="btn-primary w-full">Save</button>
        </form>
      </Modal>

      {payOpen && (
        <ModelTestPaymentModal test={payOpen} onClose={() => setPayOpen(null)} />
      )}

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        message="This will permanently delete this model test and its payment records."
      />
    </Layout>
  );
}

function ModelTestPaymentModal({ test, onClose }) {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [student, setStudent] = useState(null);
  const [amount, setAmount] = useState(test.fee);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!search) return setResults([]);
    const timer = setTimeout(() => {
      api.get('/students', { params: { search, limit: 6 } }).then((res) => setResults(res.data.data));
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const submit = async () => {
    if (!student) return toast.error('Select a student');
    setSubmitting(true);
    try {
      await api.post(`/model-tests/${test.id}/pay`, { studentId: student.id, amount, paymentDate: date });
      toast.success('Model test payment received');
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Payment failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open onClose={onClose} title={`Receive Payment - ${test.title}`}>
      <div className="space-y-4">
        {student ? (
          <div className="flex items-center justify-between bg-primary-50 rounded-lg px-4 py-3">
            <div>
              <p className="font-semibold">{student.name}</p>
              <p className="text-xs text-gray-500">{student.rollNo}</p>
            </div>
            <button className="text-sm text-primary-600" onClick={() => setStudent(null)}>Change</button>
          </div>
        ) : (
          <div className="relative">
            <FiSearch className="absolute left-3 top-3 text-gray-400" />
            <input className="input-field pl-9" placeholder="Search student..." value={search} onChange={(e) => setSearch(e.target.value)} />
            {results.length > 0 && (
              <div className="absolute z-10 bg-white border border-gray-200 rounded-lg mt-1 w-full shadow-lg max-h-56 overflow-y-auto">
                {results.map((s) => (
                  <button key={s.id} className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm" onClick={() => { setStudent(s); setResults([]); setSearch(''); }}>
                    {s.name} — {s.rollNo}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        <div>
          <label className="label">Amount</label>
          <input type="number" className="input-field" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </div>
        <div>
          <label className="label">Payment Date</label>
          <input type="date" className="input-field" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <button className="btn-primary w-full" disabled={submitting} onClick={submit}>
          {submitting ? 'Processing...' : 'Receive Payment'}
        </button>
      </div>
    </Modal>
  );
}
