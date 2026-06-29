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
      setError(err.response?.data?.error || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleOAuth = () => {
    // Simulated Google OAuth login flow
    setLoading(true);
    setTimeout(() => {
      setLogin('mock_google_jwt_token', {
        id: 'user_oauth_123',
        name: 'Alex Johnson',
        email: 'alex.johnson@gmail.com',
        role: 'Agency Owner'
      });
      setLoading(false);
    }, 1200);
  };

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
              onClick={() => { setActiveTab('login'); setError(null); }}
              className={`flex-1 py-4 text-center text-sm font-semibold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                activeTab === 'login' ? 'text-blue-500 border-b-2 border-blue-500 bg-slate-900/40' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <LogIn className="w-4 h-4" />
              Sign In
            </button>
            <button
              onClick={() => { setActiveTab('register'); setError(null); }}
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
              <Alert variant="danger" className="mb-4 bg-red-950/30 border-red-900/50 text-red-300">
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
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="border-slate-800 bg-slate-900/50 text-slate-100 placeholder-slate-500"
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
                autoComplete="off"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="border-slate-800 bg-slate-900/50 text-slate-100 placeholder-slate-500"
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

            <button
              onClick={handleGoogleOAuth}
              type="button"
              className="w-full flex items-center justify-center gap-3 px-4 py-2 border border-slate-800 rounded-lg hover:bg-slate-900 text-slate-350 hover:text-white transition-all cursor-pointer font-semibold text-sm"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.92h6.69a5.74 5.74 0 0 1-2.5 3.77v3.13h3.93c2.3-2.12 3.62-5.24 3.62-8.75z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.97-1.08 7.96-2.91l-3.93-3.13c-1.08.73-2.48 1.16-4.03 1.16-3.1 0-5.72-2.09-6.66-4.91H1.31v3.23A12 12 0 0 0 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.34 14.21A7.16 7.16 0 0 1 4.9 12c0-.77.13-1.52.37-2.21V6.56H1.31A12 12 0 0 0 0 12c0 2.25.62 4.35 1.7 6.17l3.64-2.96z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42A11.92 11.92 0 0 0 12 0 12 12 0 0 0 1.3 6.56l4.04 3.23c.94-2.82 3.56-4.91 6.66-4.91z"
                />
              </svg>
              Google Account
            </button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
