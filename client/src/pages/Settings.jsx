import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import Layout from '../components/Layout';
import api from '../services/api';

export default function Settings() {
  const { register, handleSubmit, reset } = useForm();
  const [loading, setLoading] = useState(false);
  const [logoFile, setLogoFile] = useState(null);
  const [signatureFile, setSignatureFile] = useState(null);

  useEffect(() => {
    api.get('/settings').then((res) => reset(res.data.data));
  }, [reset]);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) formData.append(key, value);
      });
      if (logoFile) formData.append('logo', logoFile);
      if (signatureFile) formData.append('signature', signatureFile);

      await api.put('/settings', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Settings saved successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <h1 className="text-xl font-bold text-gray-800 mb-5">Settings</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="card space-y-5 max-w-2xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">Institute Name</label>
            <input className="input-field" {...register('instituteName')} />
          </div>
          <div>
            <label className="label">Tutor Name</label>
            <input className="input-field" {...register('tutorName')} />
          </div>
          <div>
            <label className="label">Phone</label>
            <input className="input-field" {...register('phone')} />
          </div>
          <div>
            <label className="label">Currency</label>
            <input className="input-field" {...register('currency')} />
          </div>
          <div>
            <label className="label">Default Monthly Fee</label>
            <input type="number" className="input-field" {...register('monthlyFeeDefault')} />
          </div>
        </div>

        <div>
          <label className="label">Google Form Link</label>
          <input className="input-field" placeholder="https://forms.gle/..." {...register('googleFormLink')} />
          <div className="mt-2 text-xs text-gray-500 bg-gray-50 rounded-lg p-3">
            <p className="font-semibold mb-1">Recommended Google Form fields (so submissions map cleanly to a student record):</p>
            <ul className="list-disc list-inside space-y-0.5">
              <li>Full Name</li>
              <li>Phone Number</li>
              <li>Guardian Phone Number</li>
              <li>School / College</li>
              <li>Class</li>
              <li>Group (Science / Commerce / Arts)</li>
              <li>HSC Year</li>
              <li>Address</li>
            </ul>
            <p className="mt-1">Paste the Google Form link above for your own reference — connecting live auto-import requires a Google Sheets/Forms API integration, which can be added as a follow-up backend job.</p>
          </div>
        </div>

        <div>
          <label className="label">Receipt Footer</label>
          <textarea className="input-field" rows={2} {...register('receiptFooter')} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">Logo Upload</label>
            <input type="file" accept="image/*" className="input-field" onChange={(e) => setLogoFile(e.target.files[0])} />
          </div>
          <div>
            <label className="label">Signature Upload</label>
            <input type="file" accept="image/*" className="input-field" onChange={(e) => setSignatureFile(e.target.files[0])} />
          </div>
        </div>

        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? 'Saving...' : 'Save Settings'}
        </button>
      </form>
    </Layout>
  );
}
