import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../services/api';

export default function ForgotPassword() {
  const [step, setStep] = useState(1); // 1: request OTP, 2: reset with OTP
  const [identifier, setIdentifier] = useState('');
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm();
  const navigate = useNavigate();

  const requestOtp = async (data) => {
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { identifier: data.identifier });
      setIdentifier(data.identifier);
      toast.info('If the account exists, an OTP has been sent.');
      setStep(2);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (data) => {
    setLoading(true);
    try {
      await api.post('/auth/reset-password', {
        identifier,
        otp: data.otp,
        newPassword: data.newPassword,
      });
      toast.success('Password reset successful. Please log in.');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reset failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-white px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-xl bg-primary-600 text-white flex items-center justify-center font-bold text-2xl mx-auto mb-3">T</div>
          <h1 className="text-2xl font-bold text-gray-800">Reset Password</h1>
          <p className="text-gray-500 text-sm mt-1">
            {step === 1 ? 'Enter your email or phone number to receive an OTP.' : 'Enter the OTP code and your new password.'}
          </p>
        </div>

        {step === 1 ? (
          <form onSubmit={handleSubmit(requestOtp)} className="card space-y-4">
            <div>
              <label className="label">Email or Phone Number</label>
              <input className="input-field" {...register('identifier', { required: 'Required' })} />
              {errors.identifier && <p className="text-red-500 text-xs mt-1">{errors.identifier.message}</p>}
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? 'Sending...' : 'Send OTP'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleSubmit(resetPassword)} className="card space-y-4">
            <div>
              <label className="label">OTP Code</label>
              <input className="input-field" {...register('otp', { required: 'Required' })} />
            </div>
            <div>
              <label className="label">New Password</label>
              <input type="password" className="input-field" {...register('newPassword', { required: 'Required', minLength: { value: 6, message: 'Min 6 characters' } })} />
              {errors.newPassword && <p className="text-red-500 text-xs mt-1">{errors.newPassword.message}</p>}
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        )}

        <p className="text-center text-xs text-gray-500 mt-4">
          <Link to="/login" className="text-primary-600 hover:underline">Back to login</Link>
        </p>
      </div>
    </div>
  );
}
