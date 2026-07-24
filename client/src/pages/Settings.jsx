import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import Layout from '../components/Layout';
import api, { apiBaseURL } from '../services/api';

// Only these fields are actually editable text fields on the Setting model.
// We whitelist them explicitly instead of spreading the whole settings object
// back into the form submission (that was the root cause of "nothing saves" —
// stray fields like id/logo/signature/timestamps were being resubmitted as
// plain text and confusing the request).
const TEXT_FIELDS = [
  'instituteName', 'tutorName', 'phone', 'currency',
  'monthlyFeeDefault', 'googleFormLink', 'receiptFooter',
];

// Logo/signature are now stored as base64 data URIs ("data:image/png;base64,...")
// so they survive redeploys on hosts with an ephemeral filesystem. Older
// records may still have a legacy "/uploads/xxx.png" path, which we resolve
// against the API host for backward compatibility.
const assetUrl = (value) => {
  if (!value) return null;
  if (value.startsWith('data:')) return value;
  return `${apiBaseURL.replace(/\/api$/, '')}${value}`;
};

export default function Settings() {
  const { register, handleSubmit, reset } = useForm();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [logoFile, setLogoFile] = useState(null);
  const [signatureFile, setSignatureFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [signaturePreview, setSignaturePreview] = useState(null);

  const loadSettings = () => {
    setInitialLoading(true);
    api.get('/settings')
      .then((res) => {
        const data = res.data.data;
        reset(data);
        setLogoPreview(assetUrl(data.logo));
        setSignaturePreview(assetUrl(data.signature));
      })
      .catch(() => toast.error('Failed to load settings'))
      .finally(() => setInitialLoading(false));
  };

  useEffect(() => { loadSettings(); }, []);

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const handleSignatureChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSignatureFile(file);
    setSignaturePreview(URL.createObjectURL(file));
  };

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const formData = new FormData();
      TEXT_FIELDS.forEach((key) => {
        const value = data[key];
        if (value !== undefined && value !== null) formData.append(key, value);
      });
      if (logoFile) formData.append('logo', logoFile);
      if (signatureFile) formData.append('signature', signatureFile);

      // IMPORTANT: do NOT set a manual 'Content-Type: multipart/form-data' header here.
      // The browser/axios must generate that header itself so it can attach the
      // multipart boundary — setting it by hand (as the old code did) strips the
      // boundary and the server silently receives an empty body, which is why
      // logo, signature and tutor name (and everything else) never actually saved.
      const res = await api.put('/settings', formData);

      toast.success('Settings saved successfully');
      reset(res.data.data);
      setLogoPreview(assetUrl(res.data.data.logo));
      setSignaturePreview(assetUrl(res.data.data.signature));
      setLogoFile(null);
      setSignatureFile(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="orbit-spinner" />
        </div>
      </Layout>
    );
  }

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
            {logoPreview && (
              <img src={logoPreview} alt="Logo preview" className="w-16 h-16 object-contain rounded-lg border border-gray-200 mb-2 bg-white p-1" />
            )}
            <input type="file" accept="image/*" className="input-field" onChange={handleLogoChange} />
          </div>
          <div>
            <label className="label">Signature Upload</label>
            {signaturePreview && (
              <img src={signaturePreview} alt="Signature preview" className="w-32 h-16 object-contain rounded-lg border border-gray-200 mb-2 bg-white p-1" />
            )}
            <input type="file" accept="image/*" className="input-field" onChange={handleSignatureChange} />
          </div>
        </div>

        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? 'Saving...' : 'Save Settings'}
        </button>
      </form>
    </Layout>
  );
}