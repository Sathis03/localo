import React, { useEffect, useState } from 'react';
import { useAppStore } from '../store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui';
import {
  TrendingUp, Building2, MessageSquare, Star, CheckSquare, History, ArrowUpRight
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend, PieChart, Pie, Cell
} from 'recharts';
import axios from 'axios';

export const DashboardPage: React.FC = () => {
  const { activeBusiness, token, apiBaseUrl } = useAppStore();
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      if (!activeBusiness) return;
      try {
        setLoading(true);
        const res = await axios.get(`${apiBaseUrl}/dashboard?businessId=${activeBusiness._id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMetrics(res.data);
      } catch (error) {
        console.error('Failed to fetch dashboard metrics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, [activeBusiness, token, apiBaseUrl]);

  if (!activeBusiness) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center p-6">
        <Building2 className="w-16 h-16 text-slate-400 dark:text-slate-600 mb-4 animate-pulse" />
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">No Business Selected</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-sm">Please select or connect a business profile from the sidebar to view the local SEO audit dashboard.</p>
      </div>
    );
  }

  if (loading || !metrics) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <span className="ml-3 text-slate-500 dark:text-slate-400 text-sm font-medium">Loading Dashboard Metrics...</span>
      </div>
    );
  }

  // Mock data for charts
  const rankingTrendData = [
    { name: 'Week 1', Rank: 18 },
    { name: 'Week 2', Rank: 14 },
    { name: 'Week 3', Rank: 15 },
    { name: 'Week 4', Rank: 9 },
    { name: 'Week 5', Rank: 7 },
    { name: 'Week 6', Rank: 5 }
  ];

  const sentimentData = [
    { name: 'Positive', value: 16, color: '#10b981' },
    { name: 'Neutral', value: 4, color: '#f59e0b' },
    { name: 'Negative', value: 2, color: '#ef4444' }
  ];

  const competitorComparison = [
    { name: 'You', Reviews: metrics.totalReviews, Rating: metrics.averageRating },
    { name: 'Competitor A', Reviews: 14, Rating: 4.1 },
    { name: 'Competitor B', Reviews: 32, Rating: 4.6 },
    { name: 'Competitor C', Reviews: 8, Rating: 3.8 }
  ];

  return (
    <div className="space-y-6">
      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* SEO Score */}
        <Card className="relative overflow-hidden group hover:scale-[1.01] transition-transform duration-200">
          <div className="absolute top-0 right-0 p-3 text-emerald-500/10 dark:text-emerald-500/5 group-hover:text-emerald-500/20 transition-colors">
            <TrendingUp className="w-24 h-24 -mr-6 -mt-6" />
          </div>
          <CardHeader className="pb-2">
            <CardDescription className="text-slate-500 dark:text-slate-400">SEO Health Score</CardDescription>
            <CardTitle className="text-3xl font-extrabold text-slate-900 dark:text-white flex items-baseline gap-2">
              {metrics.seoScore}/100
              <span className="text-xs text-emerald-500 font-semibold flex items-center bg-emerald-500/10 px-1.5 py-0.5 rounded-lg">
                <ArrowUpRight className="w-3.5 h-3.5" /> Good
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden mt-2">
              <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${metrics.seoScore}%` }}></div>
            </div>
          </CardContent>
        </Card>

        {/* Reviews */}
        <Card className="hover:scale-[1.01] transition-transform duration-200">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardDescription className="text-slate-500 dark:text-slate-400">Total GBP Reviews</CardDescription>
              <MessageSquare className="w-4 h-4 text-blue-500" />
            </div>
            <CardTitle className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
              {metrics.totalReviews}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">Sync status: Synced 1h ago</p>
          </CardContent>
        </Card>

        {/* Average Rating */}
        <Card className="hover:scale-[1.01] transition-transform duration-200">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardDescription className="text-slate-500 dark:text-slate-400">Average Rating</CardDescription>
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
            </div>
            <CardTitle className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
              {metrics.averageRating}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-0.5 mt-1">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-3.5 h-3.5 ${
                    i < Math.round(metrics.averageRating)
                      ? 'text-amber-400 fill-amber-400'
                      : 'text-slate-200 dark:text-slate-700'
                  }`}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Tasks Pending */}
        <Card className="hover:scale-[1.01] transition-transform duration-200">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardDescription className="text-slate-500 dark:text-slate-400">Pending Tasks</CardDescription>
              <CheckSquare className="w-4 h-4 text-purple-500" />
            </div>
            <CardTitle className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
              {metrics.pendingTasks}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-purple-500 font-medium bg-purple-550/10 dark:bg-purple-950/20 px-2 py-0.5 rounded-md inline-block">
              {metrics.pendingTasks > 0 ? 'Actions Required' : 'All caught up'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Local Ranking Trend */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-bold text-slate-900 dark:text-white">Local Map Ranking History (Average Position)</CardTitle>
            <CardDescription className="text-xs">Tracks your average position across all connected keywords.</CardDescription>
          </CardHeader>
          <CardContent className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={rankingTrendData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRank" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-800" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                {/* Reversed Y-Axis because 1st rank is better than 10th rank */}
                <YAxis reversed domain={[1, 20]} stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#f8fafc',
                    fontSize: '12px'
                  }}
                />
                <Area type="monotone" dataKey="Rank" stroke="#2563eb" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRank)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Sentiment breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold text-slate-900 dark:text-white">Review Sentiment Analysis</CardTitle>
            <CardDescription className="text-xs">Distribution based on semantic comment parsing.</CardDescription>
          </CardHeader>
          <CardContent className="h-[220px] flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={sentimentData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {sentimentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute text-center">
              <span className="text-2xl font-black text-slate-800 dark:text-white">{sentimentData[0].value + sentimentData[1].value + sentimentData[2].value}</span>
              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Reviews</p>
            </div>
          </CardContent>
          <div className="px-6 pb-6 flex justify-around text-xs border-t border-slate-100 dark:border-slate-800/40 pt-4">
            {sentimentData.map((item) => (
              <div key={item.name} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></span>
                <span className="text-slate-500 dark:text-slate-400">{item.name} ({item.value})</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Competitors and Recent Log */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Competitor Reviews & Rating chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-bold text-slate-900 dark:text-white">Competitor Review Analysis</CardTitle>
            <CardDescription className="text-xs">Compare review volumes and ratings against top competitors.</CardDescription>
          </CardHeader>
          <CardContent className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={competitorComparison} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-800" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#f8fafc',
                    fontSize: '12px'
                  }}
                />
                <Legend verticalAlign="top" height={36} iconType="circle" fontSize={12} />
                <Bar dataKey="Reviews" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Rating" fill="#eab308" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Recent Activities list */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold text-slate-900 dark:text-white">Recent Activities</CardTitle>
              <CardDescription className="text-xs">Platform audit logs.</CardDescription>
            </div>
            <History className="w-4 h-4 text-slate-400" />
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100 dark:divide-slate-800/40">
              {metrics.recentActivities.length === 0 ? (
                <p className="p-4 text-xs text-slate-400 text-center">No recent activities found.</p>
              ) : (
                metrics.recentActivities.map((act: any) => (
                  <div key={act._id} className="p-4 flex gap-3 text-xs">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5 shrink-0"></div>
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-slate-200">{act.action}</p>
                      <p className="text-slate-400 dark:text-slate-500 text-[10px] mt-0.5">{act.details}</p>
                      <span className="text-[9px] text-slate-450 dark:text-slate-550 block mt-1">
                        {new Date(act.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
