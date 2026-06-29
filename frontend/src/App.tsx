import React, { useEffect, useState } from 'react';
import { useAppStore } from './store';
import { AuthPage } from './pages/AuthPage';
import { DashboardPage } from './pages/DashboardPage';
import { GbpPage } from './pages/GbpPage';
import { RankTrackerPage } from './pages/RankTrackerPage';
import { ReviewsPage } from './pages/ReviewsPage';
import { CompetitorsPage } from './pages/CompetitorsPage';
import { AuditPage } from './pages/AuditPage';
import { AiContentPage } from './pages/AiContentPage';
import { SchemaPage } from './pages/SchemaPage';
import { AdminPage } from './pages/AdminPage';
import { Dialog, Input, Button } from './components/ui';
import {
  LayoutDashboard, Globe, Search, TrendingUp, MessageSquare, Users, Sparkles, FileCode, ShieldCheck, LogOut, Sun, Moon, Building2, Plus, Bell
} from 'lucide-react';

import axios from 'axios';

type ViewType = 'dashboard' | 'gbp' | 'audit' | 'rankings' | 'reviews' | 'competitors' | 'ai' | 'schema' | 'admin';

export default function App() {
  const { isAuthenticated, user, token, activeBusiness, businesses, setBusinesses, setActiveBusiness, isDarkMode, toggleDarkMode, logout, apiBaseUrl } = useAppStore();
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [isAddBusinessOpen, setIsAddBusinessOpen] = useState(false);

  // Add business states
  const [bName, setBName] = useState('');
  const [bWeb, setBWeb] = useState('');
  const [bPhone, setBPhone] = useState('');

  const fetchBusinessesList = async () => {
    if (!token) return;
    try {
      const res = await axios.get(`${apiBaseUrl}/businesses`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBusinesses(res.data);
      if (res.data.length > 0 && !activeBusiness) {
        setActiveBusiness(res.data[0]);
      }
    } catch (error) {
      console.error('Failed to load businesses:', error);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchBusinessesList();
    }
  }, [isAuthenticated, token]);

  const handleAddBusiness = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bName.trim()) return;

    try {
      const res = await axios.post(`${apiBaseUrl}/businesses`, {
        name: bName,
        websiteUrl: bWeb,
        phone: bPhone
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setBName('');
      setBWeb('');
      setBPhone('');
      setIsAddBusinessOpen(false);
      
      // Reload lists and select
      await fetchBusinessesList();
      setActiveBusiness(res.data);
    } catch (error) {
      console.error('Failed to create business:', error);
    }
  };

  if (!isAuthenticated) {
    return <AuthPage />;
  }

  // Sidebar Menu items
  const menuItems = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard, view: 'dashboard' as ViewType },
    { id: 'gbp', name: 'Google Profile Sync', icon: Globe, view: 'gbp' as ViewType },
    { id: 'audit', name: 'Local SEO Audit', icon: Search, view: 'audit' as ViewType },

    { id: 'rankings', name: 'Rank Tracker', icon: TrendingUp, view: 'rankings' as ViewType },
    { id: 'reviews', name: 'GBP Review Management', icon: MessageSquare, view: 'reviews' as ViewType },
    { id: 'competitors', name: 'Competitor Analysis', icon: Users, view: 'competitors' as ViewType },
    { id: 'ai', name: 'AI Content Generator', icon: Sparkles, view: 'ai' as ViewType },
    { id: 'schema', name: 'JSON-LD Schema', icon: FileCode, view: 'schema' as ViewType }
  ];

  const renderView = () => {
    switch (currentView) {
      case 'dashboard': return <DashboardPage />;
      case 'gbp': return <GbpPage />;
      case 'audit': return <AuditPage />;
      case 'rankings': return <RankTrackerPage />;
      case 'reviews': return <ReviewsPage />;
      case 'competitors': return <CompetitorsPage />;
      case 'ai': return <AiContentPage />;
      case 'schema': return <SchemaPage />;
      case 'admin': return <AdminPage />;
      default: return <DashboardPage />;
    }
  };

  return (
    <div className={`min-h-screen flex ${isDarkMode ? 'dark' : ''} bg-slate-50 dark:bg-slate-950 transition-colors duration-200`}>
      {/* Sidebar */}
      <aside className="w-64 shrink-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between h-screen sticky top-0">
        <div className="flex flex-col overflow-y-auto">
          {/* Logo Title */}
          <div className="p-6 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800/60">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-extrabold text-lg shadow-md">
              L
            </div>
            <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white">LocalRank Pro</span>
          </div>

          {/* Business Selector */}
          <div className="p-4 border-b border-slate-100 dark:border-slate-800/40">
            <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Active Location</label>
            <div className="flex gap-2">
              <select
                value={activeBusiness?._id || ''}
                onChange={(e) => {
                  const b = businesses.find((x) => x._id === e.target.value);
                  setActiveBusiness(b || null);
                }}
                className="flex-1 px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-855 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {businesses.length === 0 && <option value="">No profiles loaded</option>}
                {businesses.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.name}
                  </option>
                ))}
              </select>
              <button
                onClick={() => setIsAddBusinessOpen(true)}
                className="p-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/40 border border-blue-200/50 dark:border-blue-800 text-blue-600 dark:text-blue-400 rounded-lg cursor-pointer transition-colors"
                title="Add New Business"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.view;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentView(item.view)}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-650 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {item.name}
                </button>
              );
            })}

            {/* Admin Panel (Conditional) */}
            {user?.role === 'Super Admin' && (
              <button
                onClick={() => setCurrentView('admin')}
                className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer mt-4 border border-dashed ${
                  currentView === 'admin'
                    ? 'bg-purple-600 text-white border-transparent'
                    : 'text-purple-500 border-purple-550/20 hover:bg-purple-500/5 hover:text-purple-600'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                Super Admin Console
              </button>
            )}
          </nav>
        </div>

        {/* User profile footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800/60 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex gap-2.5 items-center min-w-0">
              <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/60 border border-blue-200/50 dark:border-blue-800 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs shrink-0">
                {user?.name[0]}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{user?.name}</p>
                <p className="text-[9px] text-slate-400 dark:text-slate-500 truncate capitalize">{user?.role}</p>
              </div>
            </div>
            
            {/* Theme Toggle */}
            <button
              onClick={toggleDarkMode}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-850 rounded-lg cursor-pointer transition-colors"
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>

          <Button
            onClick={logout}
            variant="outline"
            className="w-full flex items-center justify-center gap-1.5 text-xs py-1.5 text-slate-600 dark:text-slate-300 dark:border-slate-800 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" /> Log Out
          </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Header Bar */}
        <header className="h-16 shrink-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-8 z-10">
          <div className="flex items-center gap-3">
            <h1 className="text-base font-extrabold text-slate-900 dark:text-white capitalize tracking-tight">{currentView === 'gbp' ? 'GBP Profile Management' : currentView}</h1>
            {activeBusiness && (
              <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-md border border-slate-200/50 dark:border-slate-800/40 flex items-center gap-1">
                <Building2 className="w-3 h-3 text-blue-500" />
                {activeBusiness.name}
              </span>
            )}
          </div>

          <div className="flex items-center gap-4">
            {/* Notifications Alert */}
            <button className="p-1.5 text-slate-450 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 bg-slate-50 dark:bg-slate-950/40 border border-slate-200/50 dark:border-slate-800 rounded-lg cursor-pointer relative">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-red-500 rounded-full"></span>
            </button>
          </div>
        </header>

        {/* View Content Panel */}
        <div className="flex-1 overflow-y-auto p-8">
          {renderView()}
        </div>
      </main>

      {/* Dialog for adding business */}
      <Dialog isOpen={isAddBusinessOpen} onClose={() => setIsAddBusinessOpen(false)} title="Track New Local Business">
        <form onSubmit={handleAddBusiness} className="space-y-4">
          <Input
            label="Business/Profile Name"
            required
            placeholder="e.g. California Dental Clinic"
            value={bName}
            onChange={(e) => setBName(e.target.value)}
          />
          <Input
            label="Website Homepage URL"
            placeholder="https://californiadental.com"
            value={bWeb}
            onChange={(e) => setBWeb(e.target.value)}
          />
          <Input
            label="Phone Number"
            placeholder="+1 555-0199"
            value={bPhone}
            onChange={(e) => setBPhone(e.target.value)}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setIsAddBusinessOpen(false)} className="text-xs">
              Cancel
            </Button>
            <Button type="submit" className="text-xs">
              Add Profile
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
