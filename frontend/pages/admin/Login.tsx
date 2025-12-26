import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { api } from '../../services/api';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Leaf, Smartphone, Lock, AlertCircle } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loginMethod, setLoginMethod] = useState<'password' | 'otp'>('password');

  const { login, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (loginMethod === 'password') {
        const user = await api.auth.login(email, password);
        login(user);
        navigate('/admin/dashboard');
      } else {
        // Mock OTP login for UI purposes
        // In real app: call API to verify OTP
        await new Promise(r => setTimeout(r, 1000));
        if (email && email.length >= 10) {
          const user = await api.auth.login(email, 'any');
          login(user);
          navigate('/admin/dashboard');
        } else {
          throw new Error("Invalid Mobile Number");
        }
      }
    } catch (err) {
      setError('Invalid credentials. Please check and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-ayur-50 to-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex justify-center bg-white p-4 rounded-full mb-6 shadow-md border border-ayur-100">
          <Leaf className="h-10 w-10 text-ayur-600" />
        </div>
        <h2 className="text-3xl font-serif font-bold text-gray-900 tracking-tight">
          Sri Deerghayu Hospital
        </h2>
        <p className="mt-2 text-sm text-gray-600 font-medium">
          Staff & Administration Portal
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl sm:rounded-2xl sm:px-10 border border-gray-100">

          <h3 className="text-xl font-bold text-gray-900 mb-6 text-center">Sign In</h3>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4 animate-fade-in">
              <Input
                id="email"
                type="email"
                label="Email address"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="doctor@hospital.com"
                className="h-11"
              />

              <div className="space-y-1">
                <Input
                  id="password"
                  type="password"
                  label="Password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11"
                />
                <div className="flex justify-end">
                  <button type="button" className="text-xs font-medium text-ayur-600 hover:text-ayur-500 hover:underline mt-1">
                    Forgot password?
                  </button>
                </div>
              </div>
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 p-4 border border-red-100 flex items-start animate-pulse">
                <AlertCircle className="h-5 w-5 text-red-500 mr-2 shrink-0" />
                <p className="text-sm font-medium text-red-800">{error}</p>
              </div>
            )}

            <Button type="submit" className="w-full h-11 text-base shadow-lg hover:shadow-xl transition-all" isLoading={loading}>
              Sign in
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};