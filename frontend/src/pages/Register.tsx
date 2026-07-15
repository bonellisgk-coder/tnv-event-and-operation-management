import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  User, Mail, Phone, Lock, Eye, EyeOff, ArrowRight,
  CheckCircle, AlertCircle, Building2, ChevronLeft
} from 'lucide-react';

interface FormData {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  departmentCode: string;
}

type Step = 'details' | 'password' | 'success';

export const Register: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [step, setStep] = useState<Step>('details');
  const [form, setForm] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    departmentCode: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const validateDetails = () => {
    if (!form.name.trim()) return 'Full name is required';
    if (!form.email.trim() || !/^\S+@\S+\.\S+$/.test(form.email)) return 'Valid email is required';
    if (!form.phone.trim() || !/^\d{10}$/.test(form.phone)) return 'Valid 10-digit phone number is required';
    return '';
  };

  const validatePassword = () => {
    if (form.password.length < 8) return 'Password must be at least 8 characters';
    if (!/[A-Z]/.test(form.password)) return 'Password must include at least one uppercase letter';
    if (!/[0-9]/.test(form.password)) return 'Password must include at least one number';
    if (form.password !== form.confirmPassword) return 'Passwords do not match';
    return '';
  };

  const handleNextStep = () => {
    const err = validateDetails();
    if (err) { setError(err); return; }
    setStep('password');
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validatePassword();
    if (err) { setError(err); return; }

    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim().toLowerCase(),
          phone: form.phone.trim(),
          password: form.password,
          departmentCode: form.departmentCode.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');

      // Auto login after registration
      login(data.accessToken, data.refreshToken, data.user);
      setStep('success');

      setTimeout(() => navigate('/dashboard'), 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4" style={{background: 'linear-gradient(135deg, #EAFAF1 0%, #F5FFF9 50%, #FEFDE7 100%)'}}>
      {/* Decorative background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo / Branding */}
        <div className="text-center mb-6">
          <img
            src="/logo.png"
            alt="Tamil Nadu Volunteers Logo"
            className="w-20 h-20 object-contain mx-auto mb-3 drop-shadow-lg rounded-full bg-white p-1.5 border-2 border-primary-mid shadow-soft"
          />
          <h1 className="font-serif text-2xl font-bold text-primary">தமிழ்நாடு தன்னார்வலர்கள்</h1>
          <p className="text-xs font-bold text-accent-hover uppercase tracking-widest mt-1">
            Tamil Nadu Volunteer Portal
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-premium border border-primary-mid overflow-hidden">
          {/* Header bar */}
          <div className="bg-primary-light px-6 py-4 border-b-2 border-primary-mid">
            <h2 className="font-serif text-lg font-bold text-primary">Create Volunteer Account</h2>
            <p className="text-xs text-gray-medium mt-0.5">Join the Tamil Nadu Volunteer Network</p>
          </div>

          {/* Step indicator */}
          <div className="flex border-b border-gray-light">
            {['Personal Details', 'Set Password'].map((label, i) => (
              <div
                key={label}
                className={`flex-1 py-3 text-center text-xs font-semibold border-b-2 transition-colors ${
                  (i === 0 && (step === 'details' || step === 'password' || step === 'success')) ||
                  (i === 1 && (step === 'password' || step === 'success'))
                    ? 'border-accent text-primary'
                    : 'border-transparent text-gray-medium'
                }`}
              >
                <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-xs mr-1.5 ${
                  (i === 0 && (step === 'details' || step === 'password' || step === 'success')) ||
                  (i === 1 && (step === 'password' || step === 'success'))
                    ? 'bg-accent text-primary font-bold'
                    : 'bg-gray-light text-gray-medium'
                }`}>{i + 1}</span>
                {label}
              </div>
            ))}
          </div>

          <div className="p-6">
            {/* Error */}
            {error && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-danger/10 border border-danger/20 mb-4">
                <AlertCircle className="w-4 h-4 text-danger mt-0.5 flex-shrink-0" />
                <p className="text-sm text-danger">{error}</p>
              </div>
            )}

            {/* Success State */}
            {step === 'success' && (
              <div className="text-center py-6">
                <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-10 h-10 text-success" />
                </div>
                <h3 className="font-serif text-xl font-bold text-primary mb-2">Welcome Aboard!</h3>
                <p className="text-gray-medium text-sm">Your volunteer account has been created successfully.</p>
                <p className="text-gray-medium text-xs mt-1">Redirecting to dashboard...</p>
              </div>
            )}

            {/* Step 1: Personal Details */}
            {step === 'details' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-dark mb-1.5 uppercase tracking-wide">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-medium" />
                    <input
                      id="reg-name"
                      name="name"
                      type="text"
                      autoComplete="name"
                      value={form.name}
                      onChange={handleChange}
                      placeholder="Enter your full name"
                      className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-border bg-background/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-dark mb-1.5 uppercase tracking-wide">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-medium" />
                    <input
                      id="reg-email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="your@email.com"
                      className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-border bg-background/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-dark mb-1.5 uppercase tracking-wide">
                    Mobile Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-medium" />
                    <input
                      id="reg-phone"
                      name="phone"
                      type="tel"
                      autoComplete="tel"
                      maxLength={10}
                      value={form.phone}
                      onChange={handleChange}
                      placeholder="10-digit mobile number"
                      className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-border bg-background/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-dark mb-1.5 uppercase tracking-wide">
                    Department Code <span className="text-gray-medium font-normal normal-case">(optional)</span>
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-medium" />
                    <input
                      id="reg-dept"
                      name="departmentCode"
                      type="text"
                      value={form.departmentCode}
                      onChange={handleChange}
                      placeholder="Enter dept. code if provided"
                      className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-border bg-background/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                    />
                  </div>
                  <p className="text-xs text-gray-medium mt-1">Leave blank to register as a general volunteer</p>
                </div>

                <button
                  onClick={handleNextStep}
                  className="w-full flex items-center justify-center gap-2 py-3 px-6 bg-primary text-background rounded-lg font-semibold text-sm hover:bg-primary-hover active:scale-95 transition-all border-b-2 border-accent shadow-soft mt-2"
                >
                  Continue
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Step 2: Password */}
            {step === 'password' && (
              <form onSubmit={handleRegister} className="space-y-4">
                <button
                  type="button"
                  onClick={() => setStep('details')}
                  className="flex items-center gap-1 text-xs text-gray-medium hover:text-primary transition-colors mb-2"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  Back to personal details
                </button>

                {/* Review summary */}
                <div className="bg-background border border-gray-light rounded-lg p-3 mb-4">
                  <p className="text-xs text-gray-medium mb-1">Registering as</p>
                  <p className="font-semibold text-sm text-primary">{form.name}</p>
                  <p className="text-xs text-gray-medium">{form.email} · {form.phone}</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-dark mb-1.5 uppercase tracking-wide">
                    Create Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-medium" />
                    <input
                      id="reg-password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      value={form.password}
                      onChange={handleChange}
                      placeholder="Min. 8 chars, 1 uppercase, 1 number"
                      className="w-full pl-10 pr-12 py-3 rounded-lg border border-gray-border bg-background/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-medium hover:text-primary"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-dark mb-1.5 uppercase tracking-wide">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-medium" />
                    <input
                      id="reg-confirm"
                      name="confirmPassword"
                      type={showConfirm ? 'text' : 'password'}
                      autoComplete="new-password"
                      value={form.confirmPassword}
                      onChange={handleChange}
                      placeholder="Re-enter your password"
                      className="w-full pl-10 pr-12 py-3 rounded-lg border border-gray-border bg-background/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-medium hover:text-primary"
                    >
                      {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Password strength hints */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    { label: '8+ characters', ok: form.password.length >= 8 },
                    { label: 'Uppercase letter', ok: /[A-Z]/.test(form.password) },
                    { label: 'Number included', ok: /[0-9]/.test(form.password) },
                    { label: 'Passwords match', ok: form.password === form.confirmPassword && form.password.length > 0 },
                  ].map(({ label, ok }) => (
                    <div key={label} className={`flex items-center gap-1.5 ${ok ? 'text-success' : 'text-gray-medium'}`}>
                      <CheckCircle className={`w-3.5 h-3.5 ${ok ? 'opacity-100' : 'opacity-30'}`} />
                      {label}
                    </div>
                  ))}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3 px-6 bg-primary text-background rounded-lg font-semibold text-sm hover:bg-primary-hover active:scale-95 transition-all border-b-2 border-accent shadow-soft disabled:opacity-60 disabled:cursor-not-allowed mt-2"
                >
                  {loading ? (
                    <span className="animate-spin inline-block w-4 h-4 border-2 border-background border-t-transparent rounded-full" />
                  ) : (
                    <>Create Account <ArrowRight className="w-4 h-4" /></>
                  )}
                </button>
              </form>
            )}
          </div>

          {/* Footer link */}
          {step !== 'success' && (
            <div className="px-6 pb-6 text-center">
              <p className="text-sm text-gray-medium">
                Already have an account?{' '}
                <Link to="/login" className="text-primary font-semibold hover:text-primary-hover hover:underline">
                  Sign In
                </Link>
              </p>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-gray-medium mt-6">
          © 2026 Government of Tamil Nadu · All Rights Reserved
        </p>
      </div>
    </div>
  );
};
