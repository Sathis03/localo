import React, { useEffect, useState } from 'react';
import { useAppStore } from '../store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Badge } from '../components/ui';
import { ShieldCheck, Users, Landmark, Activity } from 'lucide-react';
import axios from 'axios';

export const AdminPage: React.FC = () => {
  const { token, apiBaseUrl } = useAppStore();
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdminMetrics = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${apiBaseUrl}/admin/metrics`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMetrics(res.data);
      } catch (error) {
        console.error('Failed to load admin stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminMetrics();
  }, [token, apiBaseUrl]);

  if (loading) {
    return <div className="text-center py-12 text-slate-400">Loading admin operations dashboard...</div>;
  }

  if (!metrics) {
    return (
      <div className="text-center py-12 text-rose-500">
        <p className="font-semibold text-sm">Access Denied: You do not have Super Admin permissions.</p>
      </div>
    );
  }
  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardDescription className="text-slate-500 dark:text-slate-400">Total Users</CardDescription>
            <Users className="w-4 h-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold text-slate-900 dark:text-white">{metrics.totalUsers}</span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardDescription className="text-slate-500 dark:text-slate-400">Total Registered Agencies</CardDescription>
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold text-slate-900 dark:text-white">{metrics.totalAgencies}</span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardDescription className="text-slate-500 dark:text-slate-400">Tracked Locations</CardDescription>
            <Activity className="w-4 h-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold text-slate-900 dark:text-white">{metrics.totalBusinesses}</span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardDescription className="text-slate-500 dark:text-slate-400">Monitored Keywords</CardDescription>
            <Landmark className="w-4 h-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold text-slate-900 dark:text-white">
              {metrics.totalKeywords}
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Active Locations Summary Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-bold text-slate-900 dark:text-white">Tracked Locations Summary</CardTitle>
          <CardDescription className="text-xs">Overview of active local business profiles monitored on the platform.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Location/Business</TableHead>
                <TableHead>Service Status</TableHead>
                <TableHead>Monitoring Interval</TableHead>
                <TableHead>System Role</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-semibold text-xs text-slate-800 dark:text-slate-200">California Dental Clinic</TableCell>
                <TableCell>
                  <Badge variant="success">Fully Active</Badge>
                </TableCell>
                <TableCell className="text-xs text-slate-500">Real-time API Sync</TableCell>
                <TableCell className="text-xs text-slate-500">SEO Agency Owner</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-semibold text-xs text-slate-800 dark:text-slate-200">Downtown Auto Care</TableCell>
                <TableCell>
                  <Badge variant="success">Fully Active</Badge>
                </TableCell>
                <TableCell className="text-xs text-slate-500">Real-time API Sync</TableCell>
                <TableCell className="text-xs text-slate-500">Local Business Owner</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

