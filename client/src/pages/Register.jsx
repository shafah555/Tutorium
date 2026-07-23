import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/register', data);
      login(res.data.token, res.data.user);
      toast.success('Account created successfully!');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-white px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-xl bg-primary-600 text-white flex items-center justify-center font-bold text-2xl mx-auto mb-3">T</div>
          <h1 className="text-2xl font-bold text-gray-800">Create Your Tutorium Account</h1>
          <p className="text-gray-500 text-sm mt-1">Each tutor gets their own private, isolated account.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="card space-y-4">
          <div>
            <label className="label">Full Name</label>
            <input className="input-field" {...register('name', { required: 'Name is required' })} />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input-field" type="email" {...register('email')} />
          </div>
          <div>
            <label className="label">Phone Number</label>
            <input className="input-field" {...register('phone')} />
          </div>
          <div>
            <label className="label">Password</label>
            <input
              type="password"
              className="input-field"
              {...register('password', { required: 'Password is required', minLength: { value: 6, message: 'Min 6 characters' } })}
            />
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
          <p className="text-center text-xs text-gray-500 pt-2">
            Already have an account? <Link to="/login" className="text-primary-600 hover:underline">Sign in</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
