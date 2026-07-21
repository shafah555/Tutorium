import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import Layout from '../components/Layout';
import api from '../services/api';

export default function StudentForm() {
  const { id } = useParams();
  const isEdit = !!id;
  const { register, handleSubmit, reset, formState: { errors } } = useForm();
  const [loading, setLoading] = useState(false);
  const [photoFile, setPhotoFile] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isEdit) {
      api.get(`/students/${id}`).then((res) => {
        const s = res.data.data;
        reset({
          name: s.name,
          fatherName: s.fatherName,
          motherName: s.motherName,
          phone: s.phone,
          guardianPhone: s.guardianPhone,
          school: s.school,
          class: s.class,
          group: s.group,
          hscYear: s.hscYear,
          address: s.address,
          joiningDate: s.joiningDate,
          monthlyFee: s.monthlyFee,
          notes: s.notes,
        });
      }).catch(() => toast.error('Failed to load student'));
    }
  }, [id, isEdit, reset]);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) formData.append(key, value);
      });
      if (photoFile) formData.append('photo', photoFile);

      if (isEdit) {
        await api.put(`/students/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Student updated successfully');
      } else {
        const res = await api.post('/students', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        if (res.data.duplicatePhoneWarning) {
          toast.warn('Note: this phone number already exists for another student.');
        }
        toast.success(`Student created with roll number ${res.data.data.rollNo}`);
      }
      navigate('/students');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <h1 className="text-xl font-bold text-gray-800 mb-5">{isEdit ? 'Edit Student' : 'Add Student'}</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="card space-y-5 max-w-3xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">Student Name *</label>
            <input className="input-field" {...register('name', { required: 'Required' })} />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
          </div>
          <div>
            <label className="label">Phone *</label>
            <input className="input-field" {...register('phone', { required: 'Required' })} />
            {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
          </div>
          <div>
            <label className="label">Guardian Phone</label>
            <input className="input-field" {...register('guardianPhone')} />
          </div>
          <div>
            <label className="label">Father's Name</label>
            <input className="input-field" {...register('fatherName')} />
          </div>
          <div>
            <label className="label">Mother's Name</label>
            <input className="input-field" {...register('motherName')} />
          </div>
          <div>
            <label className="label">School / College</label>
            <input className="input-field" {...register('school')} />
          </div>
          <div>
            <label className="label">Class</label>
            <input className="input-field" placeholder="HSC 1st Year" {...register('class')} />
          </div>
          <div>
            <label className="label">Group</label>
            <select className="input-field" {...register('group')}>
              <option value="">Select</option>
              <option>Science</option>
              <option>Commerce</option>
              <option>Arts</option>
            </select>
          </div>
          <div>
            <label className="label">HSC Year *</label>
            <input
              type="number"
              className="input-field"
              disabled={isEdit}
              {...register('hscYear', { required: 'Required' })}
            />
            {errors.hscYear && <p className="text-red-500 text-xs mt-1">{errors.hscYear.message}</p>}
            {isEdit && <p className="text-xs text-gray-400 mt-1">HSC year cannot be changed (roll number is tied to it).</p>}
          </div>
          <div>
            <label className="label">Joining Date *</label>
            <input
              type="date"
              className="input-field"
              disabled={isEdit}
              {...register('joiningDate', { required: 'Required' })}
            />
            {errors.joiningDate && <p className="text-red-500 text-xs mt-1">{errors.joiningDate.message}</p>}
          </div>
          <div>
            <label className="label">Monthly Fee *</label>
            <input
              type="number"
              step="0.01"
              className="input-field"
              {...register('monthlyFee', { required: 'Required' })}
            />
            {errors.monthlyFee && <p className="text-red-500 text-xs mt-1">{errors.monthlyFee.message}</p>}
          </div>
          <div>
            <label className="label">Photo (optional)</label>
            <input
              type="file"
              accept="image/*"
              className="input-field"
              onChange={(e) => setPhotoFile(e.target.files[0])}
            />
          </div>
        </div>

        <div>
          <label className="label">Address</label>
          <textarea className="input-field" rows={2} {...register('address')} />
        </div>

        <div>
          <label className="label">Notes</label>
          <textarea className="input-field" rows={2} {...register('notes')} />
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Saving...' : isEdit ? 'Update Student' : 'Create Student'}
          </button>
          <button type="button" className="btn-secondary" onClick={() => navigate('/students')}>
            Cancel
          </button>
        </div>
      </form>
    </Layout>
  );
}
