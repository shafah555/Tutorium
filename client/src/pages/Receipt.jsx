import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FiPrinter, FiDownload } from 'react-icons/fi';
import Layout from '../components/Layout';
import api, { apiBaseURL } from '../services/api';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Logo/signature are stored as base64 data URIs; fall back to resolving a
// legacy "/uploads/xxx.png" path against the API host for older records.
const assetUrl = (value) => {
  if (!value) return null;
  if (value.startsWith('data:')) return value;
  return `${apiBaseURL.replace(/\/api$/, '')}${value}`;
};

export default function Receipt() {
  const { id } = useParams();
  const [receipt, setReceipt] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/receipt/${id}`)
      .then((res) => setReceipt(res.data.data))
      .catch(() => toast.error('Failed to load receipt'))
      .finally(() => setLoading(false));
  }, [id]);

  const [downloading, setDownloading] = useState(false);

  const downloadPdf = () => {
    const base = apiBaseURL.replace(/\/api$/, '');
    const token = localStorage.getItem('tutorium_token');
    setDownloading(true);
    fetch(`${base}/receipt/pdf/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(async (res) => {
        const contentType = res.headers.get('content-type') || '';
        if (!res.ok || !contentType.includes('application/pdf')) {
          // Server sent back a JSON error (or something else went wrong)
          // instead of a PDF — surface it instead of downloading garbage.
          let message = `Failed to generate PDF (${res.status})`;
          if (contentType.includes('application/json')) {
            try {
              const data = await res.json();
              message = data.message || message;
            } catch (e) {
              // ignore parse failure, fall back to default message
            }
          }
          throw new Error(message);
        }
        return res.blob();
      })
      .then((blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `receipt-${receipt.receiptNo}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      })
      .catch((err) => toast.error(err.message || 'Failed to download PDF'))
      .finally(() => setDownloading(false));
  };

  if (loading || !receipt) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin h-8 w-8 border-4 border-primary-600 border-t-transparent rounded-full" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex justify-end gap-2 mb-4 no-print">
        <button className="btn-secondary flex items-center gap-2" onClick={() => window.print()}>
          <FiPrinter /> Print
        </button>
        <button
          className="btn-primary flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          onClick={downloadPdf}
          disabled={downloading}
        >
          <FiDownload /> {downloading ? 'Generating…' : 'Download PDF'}
        </button>
      </div>

      <div className="card max-w-xl mx-auto border-2 border-primary-100">
        <div className="text-center mb-6">
          {receipt.settings?.logo ? (
            <img
              src={assetUrl(receipt.settings.logo)}
              alt="Institute logo"
              className="w-12 h-12 object-contain rounded-lg mx-auto mb-2 bg-white"
            />
          ) : (
            <div className="w-12 h-12 rounded-lg bg-primary-600 text-white flex items-center justify-center font-bold text-xl mx-auto mb-2">
              {(receipt.settings?.instituteName || 'Tutorium').charAt(0)}
            </div>
          )}
          <h2 className="text-lg font-bold text-primary-700">{receipt.settings?.instituteName || 'Tutorium'}</h2>
          <p className="text-xs text-gray-400">Payment Receipt</p>
        </div>

        <div className="grid grid-cols-2 gap-y-2 text-sm mb-4">
          <span className="text-gray-500">Receipt No</span><span className="font-medium">{receipt.receiptNo}</span>
          <span className="text-gray-500">Date</span><span>{new Date(receipt.created_at || receipt.createdAt).toLocaleDateString()}</span>
          <span className="text-gray-500">Student Name</span><span>{receipt.Student?.name}</span>
          <span className="text-gray-500">Roll Number</span><span>{receipt.Student?.rollNo}</span>
          <span className="text-gray-500">Phone</span><span>{receipt.Student?.phone}</span>
        </div>

        <div className="border-t border-gray-100 pt-4 mb-4 text-sm">
          <p className="font-semibold mb-2">
            {receipt.paymentType === 'tuition' ? 'Tuition Fee Payment' : 'Model Test Fee Payment'}
          </p>
          {receipt.paymentType === 'tuition' && Array.isArray(receipt.details) && (
            <ul className="list-disc list-inside text-gray-600">
              {receipt.details.map((d, i) => (
                <li key={i}>{MONTH_NAMES[d.month - 1]} {d.year} — ৳{d.amount}</li>
              ))}
            </ul>
          )}
          {receipt.paymentType === 'model_test' && receipt.details && (
            <p className="text-gray-600">{receipt.details.title}</p>
          )}
        </div>

        <div className="border-t border-gray-100 pt-4 mb-8">
          <div className="flex justify-between text-lg font-bold text-primary-700">
            <span>Total Paid</span>
            <span>৳{receipt.amount}</span>
          </div>
          <p className="text-sm text-gray-500 mt-1">Method: {receipt.paymentMethod || 'Cash'}</p>
        </div>

        <div className="flex justify-between items-end">
          <div>
            {receipt.settings?.signature && (
              <img
                src={assetUrl(receipt.settings.signature)}
                alt="Teacher signature"
                className="h-10 object-contain mb-1"
              />
            )}
            <div className="w-32 border-b border-gray-400 mb-1" />
            <p className="text-xs text-gray-500">
              {receipt.settings?.tutorName ? `${receipt.settings.tutorName} — ` : ''}Teacher Signature
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}