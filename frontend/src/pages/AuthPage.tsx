import React, { useState } from 'react';
import { useAppStore } from '../store';
import { Button, Card, CardContent, Input, Select, Alert } from '../components/ui';
import { ShieldCheck, LogIn, UserPlus } from 'lucide-react';
import axios from 'axios';

export const AuthPage: React.FC = () => {
  const { setLogin, apiBaseUrl } = useAppStore();
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'Agency Owner' | 'Business Owner'>('Agency Owner');
  const [agencyName, setAgencyName] = useState('');
  const [isGoogleRegister, setIsGoogleRegister] = useState(false);
  
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (activeTab === 'login') {
        const res = await axios.post(`${apiBaseUrl}/auth/login`, { email, password });
        setLogin(res.data.token, res.data.user);
      } else {
        const res = await axios.post(`${apiBaseUrl}/auth/register`, {
          name,
          email,
          password,
          role,
          agencyName: role === 'Agency Owner' ? agencyName : undefined
        });
        setLogin(res.data.token, res.data.user);
      }
    } catch (err: any) {
      console.error(err);
      let errMsg = err.response?.data?.error || 'Authentication failed. Please verify credentials.';
      if (err.response?.data?.details && Array.isArray(err.response.data.details)) {
        errMsg = err.response.data.details.map((d: any) => `${d.field}: ${d.message}`).join(' | ');
      }
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleCredentialResponse = async (response: any) => {
    setError(null);
    setLoading(true);
    try {
      const res = await axios.post(`${apiBaseUrl}/auth/google-login`, {
        idToken: response.credential,
      });

      if (res.data.exists) {
        setLogin(res.data.token, res.data.user);
      } else {
        setIsGoogleRegister(true);
        setActiveTab('register');
        setEmail(res.data.email);
        setName(res.data.name);
        setError('Google verification successful! Please select your role and set a password to create your account.');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || 'Google login failed.');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    const initGsi = () => {
      const google = (window as any).google;
      if (google) {
        google.accounts.id.initialize({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || '952354818653-dahuatsrqa8jcd4150kq9uajs99cd0mo.apps.googleusercontent.com',
          callback: handleGoogleCredentialResponse
        });
        google.accounts.id.renderButton(
          document.getElementById('google-signin-btn'),
          { theme: 'outline', size: 'large', width: 380 }
        );
      }
    };

    const google = (window as any).google;
    if (google) {
      initGsi();
    } else {
      const interval = setInterval(() => {
        if ((window as any).google) {
          initGsi();
          clearInterval(interval);
        }
      }, 100);
      return () => clearInterval(interval);
    }
  }, []);

  return (
    <div className="min-height-screen min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[120px]"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-600/15 rounded-full blur-[120px]"></div>

      <div className="w-full max-w-md z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 mb-4 animate-bounce">
            <ShieldCheck className="w-5 h-5" />
            <span className="text-xs font-semibold tracking-wide uppercase">LocalRank Pro</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Boost Local Rankings</h1>
          <p className="text-slate-400 text-sm mt-2">Manage Google Business Profiles, keywords, and reviews.</p>
        </div>

        <Card className="border-slate-800 bg-slate-950/80 backdrop-blur-md shadow-2xl">
          <div className="flex border-b border-slate-800">
            <button
              onClick={() => { setActiveTab('login'); setError(null); setIsGoogleRegister(false); setEmail(''); setName(''); }}
              className={`flex-1 py-4 text-center text-sm font-semibold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                activeTab === 'login' ? 'text-blue-500 border-b-2 border-blue-500 bg-slate-900/40' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <LogIn className="w-4 h-4" />
              Sign In
            </button>
            <button
              onClick={() => { setActiveTab('register'); setError(null); setIsGoogleRegister(false); setEmail(''); setName(''); }}
              className={`flex-1 py-4 text-center text-sm font-semibold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                activeTab === 'register' ? 'text-blue-500 border-b-2 border-blue-500 bg-slate-900/40' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              Create Account
            </button>
          </div>

          <CardContent className="p-6">
            {error && (
              <Alert variant={error.includes('successful') ? 'success' : 'danger'} className={`mb-4 border-slate-850 text-sm ${error.includes('successful') ? 'bg-blue-950/30 border-blue-900/50 text-blue-300' : 'bg-red-950/30 border-red-900/50 text-red-300'}`}>
                <span>{error}</span>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {activeTab === 'register' && (
                <>
                  <Input
                    label="Full Name"
                    type="text"
                    required
                    disabled={isGoogleRegister}
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="border-slate-800 bg-slate-900/50 text-slate-100 placeholder-slate-500 disabled:opacity-75 disabled:cursor-not-allowed"
                  />
                  <Select
                    label="I want to manage as"
                    value={role}
                    onChange={(e) => setRole(e.target.value as any)}
                    options={[
                      { value: 'Agency Owner', label: 'SEO Agency Owner' },
                      { value: 'Business Owner', label: 'Local Business Owner' }
                    ]}
                    className="border-slate-800 bg-slate-900 text-slate-100"
                  />
                  {role === 'Agency Owner' && (
                    <Input
                      label="Agency Name"
                      type="text"
                      required
                      placeholder="e.g. Acme Marketing Agency"
                      value={agencyName}
                      onChange={(e) => setAgencyName(e.target.value)}
                      className="border-slate-800 bg-slate-900/50 text-slate-100 placeholder-slate-500"
                    />
                  )}
                </>
              )}

              <Input
                label="Email Address"
                type="email"
                required
                disabled={isGoogleRegister}
                autoComplete="off"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="border-slate-800 bg-slate-900/50 text-slate-100 placeholder-slate-500 disabled:opacity-75 disabled:cursor-not-allowed"
              />

              <Input
                label="Password"
                type="password"
                required
                autoComplete="off"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="border-slate-800 bg-slate-900/50 text-slate-100 placeholder-slate-500"
              />

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg cursor-pointer"
              >
                {loading ? 'Processing...' : activeTab === 'login' ? 'Sign In' : 'Register Account'}
              </Button>
            </form>

            <div className="relative my-6 text-center">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-800"></div></div>
              <span className="relative bg-slate-950 px-3 text-xs text-slate-500 uppercase tracking-wider">Or continue with</span>
            </div>

            <div className="flex justify-center w-full min-h-[44px]">
              <div id="google-signin-btn" className="w-full flex justify-center"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
