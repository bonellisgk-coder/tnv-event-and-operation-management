import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Eye, EyeOff, ShieldAlert, Award } from 'lucide-react';

export const Login: React.FC = () => {
  const { login, apiFetch } = useAuth();
  const navigate = useNavigate();

  // Step states: 1 = Email/Phone, 2 = Role Preview, 3 = Password
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Step 2 preview user data
  const [previewUser, setPreviewUser] = useState<{
    name: string;
    email: string;
    phone: string;
    role: string;
    department: string | null;
  } | null>(null);

  const handleStep1Next = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      setError('Please enter your email or phone number');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const data = await apiFetch('/auth/login/verify', {
        method: 'POST',
        body: JSON.stringify({ identifier }),
      });

      setPreviewUser(data);
      setStep(2);
    } catch (err: any) {
      setError(err.message || 'Account not found');
    } finally {
      setLoading(false);
    }
  };

  const handleStep2Next = () => {
    setStep(3);
    setError('');
  };

  const handleStep3Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setError('Please enter your password');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const data = await apiFetch('/auth/login/authenticate', {
        method: 'POST',
        body: JSON.stringify({ identifier, password }),
      });

      // Complete login
      login(data.accessToken, data.refreshToken, data.user);

      // If user profile is incomplete (e.g., name or phone missing or default template values), go to profile completion.
      // Let's assume profile is incomplete if name is blank or placeholder (e.g. "Selvan Karthik" or empty, in seed we have names,
      // but let's check if name contains 'ChangeMe' or user wants to verify details, or if first login).
      // For this demo, let's direct to profile completion if the name is generic or phone starts with a placeholder,
      // or if they want to update details. Let's make a condition: if name is empty or we check if user wants to update it.
      // Let's add a state to optionally redirect to profile-completion.
      // If we want to demonstrate the profile completion screen (Step 4), we check if name is empty.
      if (!data.user.name || data.user.name === 'New User') {
        navigate('/complete-profile');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Incorrect password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToStep1 = () => {
    setStep(1);
    setError('');
  };

  const handleBackToStep2 = () => {
    setStep(2);
    setError('');
  };

  // Convert role tags to Tamil Nadu public service titles
  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'State Administrator';
      case 'DEPARTMENT_ADMIN':
        return 'Department Coordinator';
      case 'VOLUNTEER':
        return 'Volunteer Coordinator';
      default:
        return 'Volunteer';
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-12" style={{background: 'linear-gradient(135deg, #EAFAF1 0%, #F5FFF9 50%, #FEFDE7 100%)'}}>
      {/* Platform Branding Header */}
      <div className="text-center mb-6">
        <img
          src="/logo.png"
          alt="Tamil Nadu Volunteers Logo"
          className="w-24 h-24 object-contain mx-auto mb-4 drop-shadow-lg rounded-full bg-white p-1.5 border-2 border-primary-mid shadow-soft"
        />
        <h1 className="text-3xl font-bold text-primary font-serif tracking-wide">தமிழ்நாடு தன்னார்வலர்கள்</h1>
        <p className="text-accent-hover font-sans font-bold tracking-widest text-xs uppercase mt-1">Volunteer Management Platform</p>
      </div>

      {/* Main Login Card */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-premium border border-primary-mid overflow-hidden min-h-[400px] flex flex-col">
        {/* Progress Bar indicator */}
        <div className="h-1.5 w-full bg-primary-light">
          <div 
            className="h-full bg-primary transition-all duration-500 rounded-full" 
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>

        <div className="p-8 flex-1 flex flex-col justify-between">
          {/* STEP 1: IDENTIFIER SCREEN */}
          {step === 1 && (
            <form onSubmit={handleStep1Next} className="flex-1 flex flex-col justify-between">
              <div>
                <h2 className="text-xl font-bold text-primary mb-2 font-serif text-center">Sign In to Your Account</h2>
                <p className="text-gray-medium text-center text-sm mb-6">Enter your registered email address or mobile number to continue</p>
                
                {error && (
                  <div className="mb-4 p-3 bg-danger-light text-danger rounded-lg text-sm flex items-center gap-2 border border-danger/20">
                    <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-medium uppercase tracking-wider mb-1">Email or Phone Number</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 rounded-lg border border-gray-border focus:ring-2 focus:ring-primary focus:border-transparent outline-none bg-background/30 transition-all font-medium text-gray-dark"
                      placeholder="e.g. admin@example.com or 9876543210"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-8 space-y-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-primary hover:bg-primary-hover text-background font-bold rounded-lg shadow-md border-b-2 border-accent transition-all disabled:opacity-50 flex justify-center items-center"
                >
                  {loading ? 'Verifying...' : 'Next'}
                </button>
                <div className="text-center text-xs text-gray-medium pt-2 border-t border-gray-light">
                  <span className="block mb-2">New volunteer? Join the platform to get started.</span>
                  <Link to="/register" className="text-primary font-bold hover:underline">
                    Create new account
                  </Link>
                </div>
              </div>
            </form>
          )}

          {/* STEP 2: USER PREVIEW SCREEN */}
          {step === 2 && previewUser && (
            <div className="flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-center mb-6">
                  <button 
                    onClick={handleBackToStep1}
                    className="p-1 rounded-full hover:bg-gray-light text-primary transition-all mr-2"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <span className="text-sm font-semibold text-gray-medium">Change account</span>
                </div>

                <div className="text-center mb-6">
                  {/* Avatar */}
                  <div className="inline-flex justify-center items-center w-20 h-20 rounded-full bg-primary-light text-primary font-bold text-2xl mb-3 border border-primary/20 shadow-inner">
                    {previewUser.name.charAt(0)}
                  </div>
                  
                  <h3 className="text-lg font-bold text-primary font-serif">{previewUser.name}</h3>
                  <p className="text-xs text-gray-medium mb-3">{previewUser.email}</p>
                  
                  {/* Role Badge */}
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-accent-light text-accent-hover border border-accent/20 uppercase tracking-wider">
                    {getRoleLabel(previewUser.role)}
                  </span>
                  
                  {previewUser.department && (
                    <p className="text-xs text-primary font-semibold mt-2">
                      Dept: {previewUser.department}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-6">
                <button
                  onClick={handleStep2Next}
                  className="w-full py-3 bg-primary hover:bg-primary-hover text-background font-bold rounded-lg shadow-md border-b-2 border-accent transition-all flex justify-center items-center"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: PASSWORD SCREEN */}
          {step === 3 && previewUser && (
            <form onSubmit={handleStep3Submit} className="flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-center mb-4">
                  <button 
                    onClick={handleBackToStep2}
                    className="p-1 rounded-full hover:bg-gray-light text-primary transition-all mr-2"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-medium">Signing in as</span>
                    <span className="text-sm font-bold text-primary">{previewUser.name}</span>
                  </div>
                </div>

                <h2 className="text-xl font-bold text-primary mb-4 font-serif text-center">Enter Password</h2>

                {error && (
                  <div className="mb-4 p-3 bg-danger-light text-danger rounded-lg text-sm flex items-center gap-2 border border-danger/20">
                    <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-medium uppercase tracking-wider mb-1">Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        className="w-full pl-4 pr-10 py-3 rounded-lg border border-gray-border focus:ring-2 focus:ring-primary focus:border-transparent outline-none bg-background/30 transition-all font-medium"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={loading}
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-3.5 text-gray-medium hover:text-primary transition-all"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Link
                      to="/forgot-password"
                      className="text-xs font-bold text-primary hover:text-primary-hover hover:underline transition-all"
                    >
                      Forgot password?
                    </Link>
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-primary hover:bg-primary-hover text-background font-bold rounded-lg shadow-md border-b-2 border-accent transition-all disabled:opacity-50 flex justify-center items-center"
                >
                  {loading ? 'Authenticating...' : 'Sign In'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
