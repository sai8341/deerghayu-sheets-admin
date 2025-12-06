import React, { useState } from 'react';
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
  
  const { login } = useAuthStore();
  const navigate = useNavigate();

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
            
          <div className="flex rounded-lg bg-gray-100 p-1 mb-8">
             <button 
                type="button"
                onClick={() => { setLoginMethod('password'); setError(''); }}
                className={`flex-1 flex items-center justify-center py-2.5 text-sm font-medium rounded-md transition-all ${loginMethod === 'password' ? 'bg-white text-gray-900 shadow-sm ring-1 ring-black/5' : 'text-gray-500 hover:text-gray-900'}`}
             >
                <Lock size={16} className="mr-2" /> Password
             </button>
             <button 
                type="button"
                onClick={() => { setLoginMethod('otp'); setError(''); }}
                className={`flex-1 flex items-center justify-center py-2.5 text-sm font-medium rounded-md transition-all ${loginMethod === 'otp' ? 'bg-white text-gray-900 shadow-sm ring-1 ring-black/5' : 'text-gray-500 hover:text-gray-900'}`}
             >
                <Smartphone size={16} className="mr-2" /> Mobile OTP
             </button>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            {loginMethod === 'password' ? (
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
            ) : (
                <div className="space-y-4 animate-fade-in">
                    <Input
                        id="mobile"
                        type="tel"
                        label="Registered Mobile Number"
                        required
                        value={email} // reusing email state for mobile
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="e.g. 9876543210"
                        className="h-11"
                    />
                     <div className="bg-yellow-50 p-4 rounded-lg text-xs text-yellow-800 border border-yellow-100 flex items-start">
                        <Smartphone size={16} className="mr-2 shrink-0 mt-0.5" />
                        <span>A One-Time Password (OTP) will be sent to your registered mobile number for verification.</span>
                    </div>
                </div>
            )}

            {error && (
              <div className="rounded-lg bg-red-50 p-4 border border-red-100 flex items-start animate-pulse">
                <AlertCircle className="h-5 w-5 text-red-500 mr-2 shrink-0" />
                <p className="text-sm font-medium text-red-800">{error}</p>
              </div>
            )}

            <Button type="submit" className="w-full h-11 text-base shadow-lg hover:shadow-xl transition-all" isLoading={loading}>
              {loginMethod === 'password' ? 'Sign in' : 'Send OTP'}
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-100">
            <div className="text-center">
               <p className="text-xs text-gray-400 mb-2">Demo Access Credentials</p>
               <div className="flex flex-wrap justify-center gap-2">
                   <span className="px-2.5 py-1 bg-gray-50 rounded border border-gray-200 text-xs text-gray-500 font-mono">doctor@hospital.com</span>
                   <span className="px-2.5 py-1 bg-gray-50 rounded border border-gray-200 text-xs text-gray-500 font-mono">reception@hospital.com</span>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};