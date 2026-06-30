import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, CheckCircle, ArrowRight, MapPin, 
  TrendingUp, MessageSquare, Sparkles, FileCode, Users 
} from 'lucide-react';
import { Button, Badge } from '../components/ui';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  
  // Simulation states
  const [keyword, setKeyword] = useState('dentist near me');
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationGrid, setSimulationGrid] = useState<number[]>([
    1, 2, 1,
    3, 5, 2,
    8, 12, 14
  ]);

  const runSimulation = () => {
    if (!keyword.trim()) return;
    setIsSimulating(true);
    setTimeout(() => {
      const nextGrid = Array.from({ length: 9 }, (_, i) => {
        const dist = Math.abs(i - 4);
        const base = Math.floor(Math.random() * 3) + 1;
        return Math.max(1, base + dist * (Math.floor(Math.random() * 3) + 1));
      });
      setSimulationGrid(nextGrid);
      setIsSimulating(false);
    }, 1500);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setSimulationGrid(prev => prev.map(val => {
        const change = Math.random() > 0.5 ? 1 : -1;
        return Math.max(1, Math.min(25, val + change));
      }));
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const getRankColorClass = (rank: number) => {
    if (rank <= 3) return 'bg-emerald-500 text-white shadow-emerald-500/20';
    if (rank <= 10) return 'bg-amber-500 text-white shadow-amber-500/20';
    return 'bg-rose-500 text-white shadow-rose-500/20';
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-blue-500 selection:text-white">
      {/* Dynamic Background Effects */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[140px] pointer-events-none"></div>
      <div className="absolute top-1/3 right-1/4 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[140px] pointer-events-none"></div>
      <div className="absolute bottom-10 left-10 w-[400px] h-[400px] bg-indigo-600/5 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-slate-950/80 border-b border-slate-900">
        <div className="max-w-7xl mx-auto px-6 h-18 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-blue-500/20">
              L
            </div>
            <span className="font-black text-lg tracking-tight text-white">LocalRank Pro</span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-slate-400">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#simulator" className="hover:text-white transition-colors">Grid Simulator</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
          </nav>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate('/auth')} 
              className="px-4 py-2 text-xs font-bold text-slate-350 hover:text-white transition-colors"
            >
              Sign In
            </button>
            <Button 
              onClick={() => navigate('/auth')}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2 px-4 shadow-md shadow-blue-500/10 animate-pulse hover:animate-none"
            >
              Get Started
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 pt-16 pb-20 md:py-28 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        <div className="lg:col-span-7 space-y-6 text-left">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400">
            <Sparkles className="w-4 h-4" />
            <span className="text-[10px] font-bold tracking-wider uppercase">Advanced Local Rank Tracker</span>
          </div>
          
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white tracking-tight leading-[1.05]">
            Dominate Your <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 animate-pulse">
              Local Search Grid
            </span>
          </h1>
          
          <p className="text-slate-400 text-base md:text-lg leading-relaxed max-w-xl">
            Track and optimize your Google Business Profiles, analyze competitors, reply to customer reviews with AI, and grow your local presence automatically.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button 
              onClick={() => navigate('/auth')} 
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm px-8 py-3.5 flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
            >
              Start Free Trial <ArrowRight className="w-4 h-4" />
            </Button>
            <a 
              href="#simulator" 
              className="px-8 py-3.5 border border-slate-800 hover:border-slate-700 bg-slate-900/30 hover:bg-slate-900/60 text-slate-300 font-bold text-sm rounded-xl text-center transition-all"
            >
              Try Rank Simulator
            </a>
          </div>

          <div className="flex flex-wrap gap-x-6 gap-y-3 pt-8 text-xs text-slate-500 font-medium">
            <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-blue-500" /> No credit card required</span>
            <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-blue-500" /> Instant profile sync</span>
            <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-blue-500" /> Cancel anytime</span>
          </div>
        </div>

        {/* Hero Interactive Grid Demonstration */}
        <div className="lg:col-span-5 flex justify-center">
          <div className="relative p-6 bg-slate-900/40 border border-slate-900 rounded-3xl backdrop-blur-md shadow-2xl max-w-sm w-full">
            <div className="absolute -top-3 -right-3 w-20 h-20 bg-purple-500/10 rounded-full blur-xl"></div>
            
            {/* Grid Header Info */}
            <div className="flex justify-between items-center mb-6">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Mock Search Location</span>
              <Badge variant="success">Live Demo</Badge>
            </div>

            {/* Keyword Field */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between mb-6">
              <div className="flex items-center gap-2.5 min-w-0">
                <Search className="w-4 h-4 text-slate-500 shrink-0" />
                <span className="text-xs font-semibold truncate text-slate-350">dentist near me</span>
              </div>
              <MapPin className="w-3.5 h-3.5 text-blue-500" />
            </div>

            {/* Interactive Grid circles */}
            <div className="grid grid-cols-3 gap-4 justify-items-center mb-6">
              {simulationGrid.map((rank, idx) => (
                <div 
                  key={idx} 
                  className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 shadow-md ${getRankColorClass(rank)}`}
                >
                  {rank}
                </div>
              ))}
            </div>

            {/* Grid Footer details */}
            <div className="text-center text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
              Avg. Grid Rank: <span className="text-white font-bold">{(simulationGrid.reduce((a, b) => a + b, 0) / 9).toFixed(1)}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Grid Simulator Interactive Widget */}
      <section id="simulator" className="border-t border-slate-900 bg-slate-950/40 py-20">
        <div className="max-w-4xl mx-auto px-6 text-center space-y-12">
          <div className="space-y-4">
            <h2 className="text-2xl sm:text-3xl font-black text-white">Interactive Search Rank Simulator</h2>
            <p className="text-slate-400 text-sm max-w-lg mx-auto leading-relaxed">
              Test how LocalRank Pro scans search grids around physical locations. Enter a local search term to generate a simulated local grid.
            </p>
          </div>

          <div className="bg-slate-900/60 border border-slate-900 rounded-3xl p-6 sm:p-8 backdrop-blur-md shadow-xl text-left max-w-xl mx-auto space-y-6">
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide">Enter Business Type or Keyword</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="e.g. bakery near me"
                  className="flex-1 px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-650 focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold"
                />
                <Button 
                  onClick={runSimulation}
                  disabled={isSimulating}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2 px-5"
                >
                  {isSimulating ? 'Scanning...' : 'Scan Grid'}
                </Button>
              </div>
            </div>

            {/* Simulated Grid output */}
            <div className="flex flex-col items-center gap-4 py-4 border-t border-slate-800/60">
              <div className="grid grid-cols-3 gap-4">
                {simulationGrid.map((rank, idx) => (
                  <div 
                    key={idx} 
                    className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-500 ${isSimulating ? 'animate-pulse bg-slate-800 text-slate-500' : getRankColorClass(rank)}`}
                  >
                    {isSimulating ? '?' : rank}
                  </div>
                ))}
              </div>
              
              {!isSimulating && (
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  Simulated local keyword search rankings around store address
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Feature Showcase Grid */}
      <section id="features" className="border-t border-slate-900 py-20 md:py-28 bg-slate-950">
        <div className="max-w-7xl mx-auto px-6 text-center space-y-16">
          <div className="space-y-4">
            <h2 className="text-3xl font-black text-white">Full Suite of Local SEO Tools</h2>
            <p className="text-slate-400 text-sm max-w-xl mx-auto leading-relaxed">
              Every tool you need to track keyword positions, manage online reputation, monitor competitors, and index structured local schema markups.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Feature 1 */}
            <div className="p-6 bg-slate-900/30 border border-slate-900 rounded-2xl hover:border-slate-850 hover:bg-slate-900/50 transition-all text-left space-y-4 group">
              <div className="w-10 h-10 rounded-xl bg-blue-600/10 text-blue-500 border border-blue-500/20 flex items-center justify-center transition-transform group-hover:scale-105">
                <TrendingUp className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-white">Grid Rank Tracker</h3>
              <p className="text-xs text-slate-450 leading-relaxed">
                Scan search grids across specific map coordinates to see your business ranking positions on Google Maps.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 bg-slate-900/30 border border-slate-900 rounded-2xl hover:border-slate-850 hover:bg-slate-900/50 transition-all text-left space-y-4 group">
              <div className="w-10 h-10 rounded-xl bg-indigo-600/10 text-indigo-500 border border-indigo-500/20 flex items-center justify-center transition-transform group-hover:scale-105">
                <MessageSquare className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-white">Review Auto-Responder</h3>
              <p className="text-xs text-slate-450 leading-relaxed">
                Auto-respond to reviews using localized AI models in a single click, keeping your profile active and responsive.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 bg-slate-900/30 border border-slate-900 rounded-2xl hover:border-slate-850 hover:bg-slate-900/50 transition-all text-left space-y-4 group">
              <div className="w-10 h-10 rounded-xl bg-purple-600/10 text-purple-500 border border-purple-500/20 flex items-center justify-center transition-transform group-hover:scale-105">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-white">Competitor Scraper</h3>
              <p className="text-xs text-slate-450 leading-relaxed">
                Scrape competitor website visual elements and review stats to identify opportunities and rank gap deltas.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-6 bg-slate-900/30 border border-slate-900 rounded-2xl hover:border-slate-850 hover:bg-slate-900/50 transition-all text-left space-y-4 group">
              <div className="w-10 h-10 rounded-xl bg-emerald-600/10 text-emerald-500 border border-emerald-500/20 flex items-center justify-center transition-transform group-hover:scale-105">
                <FileCode className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-white">JSON-LD Schema</h3>
              <p className="text-xs text-slate-450 leading-relaxed">
                Auto-generate structured LocalBusiness JSON-LD schemas so search engines index correct contact information.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Tiers */}
      <section id="pricing" className="border-t border-slate-900 py-20 md:py-28 bg-slate-950/50">
        <div className="max-w-7xl mx-auto px-6 text-center space-y-16">
          <div className="space-y-4">
            <h2 className="text-3xl font-black text-white">Simple, Transparent Pricing</h2>
            <p className="text-slate-400 text-sm max-w-xl mx-auto leading-relaxed">
              Choose the plan that fits your business. All plans include full access to the interactive search grids and reviews management dashboard.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Starter Plan */}
            <div className="bg-slate-900/30 border border-slate-900 hover:border-slate-800 rounded-3xl p-8 text-left space-y-6 transition-all relative flex flex-col justify-between">
              <div className="space-y-4">
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-white">Starter</h3>
                  <p className="text-xs text-slate-550">Perfect for single local businesses</p>
                </div>
                <div className="flex items-baseline text-white">
                  <span className="text-3xl font-black">$29</span>
                  <span className="text-xs text-slate-500 font-semibold ml-1">/ month</span>
                </div>
                <hr className="border-slate-800/80" />
                <ul className="space-y-3 text-xs text-slate-400">
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-blue-500" /> 1 Business Profile</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-blue-500" /> 5 Keyword Trackers</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-blue-500" /> 3x3 Rank Grid Scans</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-blue-500" /> AI Review Responses</li>
                </ul>
              </div>
              <Button onClick={() => navigate('/auth')} variant="outline" className="w-full mt-6 py-2.5 text-xs text-slate-350 hover:text-white border-slate-800">
                Start Trial
              </Button>
            </div>

            {/* Professional Plan */}
            <div className="bg-slate-900/60 border-2 border-blue-600/60 rounded-3xl p-8 text-left space-y-6 transition-all relative flex flex-col justify-between shadow-xl shadow-blue-500/5">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white font-bold text-[9px] uppercase tracking-wider px-3.5 py-1 rounded-full">
                Most Popular
              </span>
              <div className="space-y-4">
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-white">Professional</h3>
                  <p className="text-xs text-blue-400 font-medium">Best for multi-location brands</p>
                </div>
                <div className="flex items-baseline text-white">
                  <span className="text-3xl font-black">$79</span>
                  <span className="text-xs text-slate-550 font-semibold ml-1">/ month</span>
                </div>
                <hr className="border-slate-800" />
                <ul className="space-y-3 text-xs text-slate-300 font-medium">
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-blue-500" /> 5 Business Profiles</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-blue-500" /> 25 Keyword Trackers</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-blue-500" /> 5x5 Rank Grid Scans</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-blue-500" /> Automatic AI Auto-Responder</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-blue-500" /> Competitor Reputations</li>
                </ul>
              </div>
              <Button onClick={() => navigate('/auth')} className="w-full mt-6 py-2.5 text-xs bg-blue-600 hover:bg-blue-700 text-white font-bold">
                Start Trial
              </Button>
            </div>

            {/* Agency Plan */}
            <div className="bg-slate-900/30 border border-slate-900 hover:border-slate-800 rounded-3xl p-8 text-left space-y-6 transition-all relative flex flex-col justify-between">
              <div className="space-y-4">
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-white">Agency</h3>
                  <p className="text-xs text-slate-550">For marketing agencies & consultancies</p>
                </div>
                <div className="flex items-baseline text-white">
                  <span className="text-3xl font-black">$199</span>
                  <span className="text-xs text-slate-550 font-semibold ml-1">/ month</span>
                </div>
                <hr className="border-slate-800/80" />
                <ul className="space-y-3 text-xs text-slate-400">
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-blue-500" /> Unlimited Locations</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-blue-500" /> Unlimited Keyword Trackers</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-blue-500" /> Detailed white-label audits</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-blue-500" /> API Access & White Domain</li>
                </ul>
              </div>
              <Button onClick={() => navigate('/auth')} variant="outline" className="w-full mt-6 py-2.5 text-xs text-slate-350 hover:text-white border-slate-800">
                Start Trial
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white font-black text-sm">
              L
            </div>
            <span className="font-bold text-sm tracking-tight text-white">LocalRank Pro</span>
          </div>

          <p className="text-xs text-slate-600">
            &copy; {new Date().getFullYear()} LocalRank Pro. All rights reserved. Localo SEO platform clone.
          </p>
        </div>
      </footer>
    </div>
  );
};
