import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { api } from '../../services/api';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Leaf } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await api.auth.login(email, password);
      login(user);
      navigate('/admin/dashboard');
    } catch (err) {
      setError('Invalid credentials. Try "doctor@hospital.com" or "reception@hospital.com"');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
            <div className="bg-ayur-100 p-3 rounded-full">
                <Leaf className="h-10 w-10 text-ayur-600" />
            </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-serif font-extrabold text-gray-900">
          Sign in to EMR
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
           Sri Deerghayu Ayurvedic Hospital
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-100">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <Input
              id="email"
              type="email"
              label="Email address"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. doctor@hospital.com"
            />
            
            <Input
              id="password"
              type="password"
              label="Password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="flex">
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">{error}</h3>
                  </div>
                </div>
              </div>
            )}

            <div>
              <Button type="submit" className="w-full" isLoading={loading}>
                Sign in
              </Button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Demo Credentials</span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3 text-xs text-gray-500 text-center">
                <div className="p-2 bg-gray-50 rounded">doctor@hospital.com</div>
                <div className="p-2 bg-gray-50 rounded">reception@hospital.com</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};