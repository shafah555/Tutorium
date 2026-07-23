import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { FiPlus, FiSearch, FiEye, FiEdit2, FiTrash2, FiDollarSign } from 'react-icons/fi';
import { toast } from 'react-toastify';
import Layout from '../components/Layout';
import Pagination from '../components/Pagination';
import StatusBadge from '../components/StatusBadge';
import ConfirmDialog from '../components/ConfirmDialog';
import PaymentModal from '../components/PaymentModal';
import api from '../services/api';

export default function Students() {
  const [students, setStudents] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [hscYear, setHscYear] = useState('');
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState(null);
  const [payStudent, setPayStudent] = useState(null);

  const fetchStudents = useCallback((page = 1) => {
    setLoading(true);
    api.get('/students', { params: { search, status, hscYear, page, limit: 15 } })
      .then((res) => {
        setStudents(res.data.data);
        setPagination(res.data.pagination);
      })
      .catch(() => toast.error('Failed to load students'))
      .finally(() => setLoading(false));
  }, [search, status, hscYear]);

  useEffect(() => {
    const timer = setTimeout(() => fetchStudents(1), 300);
    return () => clearTimeout(timer);
  }, [fetchStudents]);

  const handleDelete = async () => {
    try {
      await api.delete(`/students/${deleteId}`);
      toast.success('Student deleted');
      fetchStudents(pagination.page);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  return (
    <Layout>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-5">
        <h1 className="text-xl font-bold text-gray-800">Students</h1>
        <Link to="/students/add" className="btn-primary flex items-center gap-2 w-fit">
          <FiPlus /> Add Student
        </Link>
      </div>

      <div className="card mb-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="relative md:col-span-2">
            <FiSearch className="absolute left-3 top-3 text-gray-400" />
            <input
              className="input-field pl-9"
              placeholder="Search by name, roll, phone, school..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select className="input-field" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="inactive">Inactive</option>
          </select>
          <input
            className="input-field"
            placeholder="HSC Year (e.g. 2026)"
            value={hscYear}
            onChange={(e) => setHscYear(e.target.value)}
          />
        </div>
      </div>

      <div className="card overflow-x-auto">
        <table className="table-base">
          <thead>
            <tr>
              <th>Roll</th>
              <th>Name</th>
              <th>Phone</th>
              <th>Class/Group</th>
              <th>HSC Year</th>
              <th>Monthly Fee</th>
              <th>Status</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="text-center py-8 text-gray-400">Loading...</td></tr>
            ) : students.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-8 text-gray-400">No students found</td></tr>
            ) : (
              students.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="font-medium text-primary-700">{s.rollNo}</td>
                  <td>{s.name}</td>
                  <td>{s.phone}</td>
                  <td>{s.class} / {s.group}</td>
                  <td>{s.hscYear}</td>
                  <td>৳{s.monthlyFee}</td>
                  <td><StatusBadge status={s.status} /></td>
                  <td>
                    <div className="flex justify-end gap-3 text-gray-500">
                      <button onClick={() => setPayStudent(s)} title="Receive Payment" className="hover:text-primary-600">
                        <FiDollarSign />
                      </button>
                      <Link to={`/students/${s.id}`} title="View"><FiEye /></Link>
                      <Link to={`/students/${s.id}/edit`} title="Edit"><FiEdit2 /></Link>
                      <button onClick={() => setDeleteId(s.id)} title="Delete" className="hover:text-red-600">
                        <FiTrash2 />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Pagination page={pagination.page} totalPages={pagination.totalPages} onChange={fetchStudents} />

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        message="This will permanently delete the student and all related payment records."
      />

      <PaymentModal
        open={!!payStudent}
        onClose={() => setPayStudent(null)}
        student={payStudent}
        onSuccess={() => fetchStudents(pagination.page)}
      />
    </Layout>
  );
}