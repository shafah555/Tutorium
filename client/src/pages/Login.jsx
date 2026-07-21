import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/login', data);
      login(res.data.token, res.data.user);
      toast.success('Welcome back!');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-white px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-xl bg-primary-600 text-white flex items-center justify-center font-bold text-2xl mx-auto mb-3">T</div>
          <h1 className="text-2xl font-bold text-gray-800">Tutorium</h1>
          <p className="text-gray-500 text-sm mt-1">Student Management System</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="card space-y-4">
          <div>
            <label className="label">Email or Phone Number</label>
            <input
              className="input-field"
              placeholder="you@example.com or 01700000000"
              {...register('identifier', { required: 'This field is required' })}
            />
            {errors.identifier && <p className="text-red-500 text-xs mt-1">{errors.identifier.message}</p>}
          </div>
          <div>
            <label className="label">Password</label>
            <input
              type="password"
              className="input-field"
              placeholder="••••••••"
              {...register('password', { required: 'Password is required' })}
            />
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
          <div className="flex justify-between text-xs pt-2">
            <Link to="/forgot-password" className="text-primary-600 hover:underline">Forgot password?</Link>
            <Link to="/register" className="text-gray-500 hover:underline">Create account</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
