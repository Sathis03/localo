import React, { useEffect, useState } from 'react';
import { useAppStore } from '../store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Button, Input, Select, Badge, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Alert } from '../components/ui';
import {
  Search, Plus, MapPin, Eye, ArrowUp, ArrowDown, Grid
} from 'lucide-react';
import axios from 'axios';

export const RankTrackerPage: React.FC = () => {
  const { activeBusiness, token, apiBaseUrl } = useAppStore();
  const [keywords, setKeywords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Add keyword states
  const [newKeyword, setNewKeyword] = useState('');
  const [location, setLocation] = useState('');
  const [frequency, setFrequency] = useState<'Daily' | 'Weekly' | 'Monthly'>('Weekly');
  const [addError, setAddError] = useState<string | null>(null);

  // Local grid rank state
  const [selectedKeyword, setSelectedKeyword] = useState<any>(null);
  const [gridData, setGridData] = useState<any>(null);
  const [loadingGrid, setLoadingGrid] = useState(false);

  const fetchKeywords = async () => {
    if (!activeBusiness) return;
    try {
      setLoading(true);
      const res = await axios.get(`${apiBaseUrl}/keywords?businessId=${activeBusiness._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setKeywords(res.data);
      if (res.data.length > 0) {
        setSelectedKeyword(res.data[0]);
      }
    } catch (error) {
      console.error('Failed to fetch keywords:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchGridRankings = async (keywordId: string) => {
    try {
      setLoadingGrid(true);
      const res = await axios.get(`${apiBaseUrl}/keywords/grid?keywordId=${keywordId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setGridData(res.data);
    } catch (error) {
      console.error('Failed to fetch grid rankings:', error);
    } finally {
      setLoadingGrid(false);
    }
  };

  useEffect(() => {
    fetchKeywords();
  }, [activeBusiness, token, apiBaseUrl]);

  useEffect(() => {
    if (selectedKeyword) {
      fetchGridRankings(selectedKeyword._id);
    }
  }, [selectedKeyword]);

  const handleAddKeyword = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);
    if (!newKeyword.trim() || !location.trim()) {
      setAddError('Keyword and location parameters are required.');
      return;
    }

    try {
      const res = await axios.post(`${apiBaseUrl}/keywords`, {
        businessId: activeBusiness?._id,
        keyword: newKeyword,
        location,
        trackingFrequency: frequency
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setNewKeyword('');
      setLocation('');
      
      // Reload list
      await fetchKeywords();
      setSelectedKeyword(res.data);
    } catch (error: any) {
      setAddError('Failed to add keyword.');
    }
  };

  const getRankColorClass = (rank: number) => {
    if (rank === 0) return 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500';
    if (rank <= 3) return 'bg-emerald-500 text-white';
    if (rank <= 10) return 'bg-amber-500 text-white';
    return 'bg-red-500 text-white';
  };

  const getGridColorClass = (rank: number) => {
    if (rank <= 3) return 'bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400';
    if (rank <= 10) return 'bg-amber-500/10 border-amber-500 text-amber-600 dark:text-amber-400';
    return 'bg-rose-500/10 border-rose-500 text-rose-600 dark:text-rose-400';
  };

  if (!activeBusiness) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh]">
        <h2 className="text-xl font-bold">Select business first</h2>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Keywords List Table */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-slate-900 dark:text-white">Tracked Keywords</CardTitle>
                <CardDescription className="text-xs">Daily/weekly SEO rank checking logs.</CardDescription>
              </div>
              <Badge variant="info">{keywords.length} Tracked</Badge>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-12 text-center text-slate-400">Loading keywords...</div>
              ) : keywords.length === 0 ? (
                <div className="p-12 text-center text-slate-400">No keywords added yet. Add one below!</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Keyword</TableHead>
                      <TableHead>Target Geo</TableHead>
                      <TableHead>Current Rank</TableHead>
                      <TableHead>Change</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {keywords.map((kw) => (
                      <TableRow
                        key={kw._id}
                        className={`cursor-pointer transition-colors ${
                          selectedKeyword?._id === kw._id ? 'bg-blue-500/5 dark:bg-blue-500/10' : ''
                        }`}
                        onClick={() => setSelectedKeyword(kw)}
                      >
                        <TableCell className="font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                          <Search className="w-3.5 h-3.5 text-slate-400" />
                          {kw.keyword}
                        </TableCell>
                        <TableCell>
                          <span className="flex items-center gap-1 text-[11px] text-slate-500">
                            <MapPin className="w-3.5 h-3.5" />
                            {kw.location}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${getRankColorClass(kw.currentRank)}`}>
                            {kw.currentRank || '-'}
                          </span>
                        </TableCell>
                        <TableCell>
                          {kw.change > 0 ? (
                            <span className="text-emerald-500 font-bold flex items-center text-xs">
                              <ArrowUp className="w-3 h-3" /> +{kw.change}
                            </span>
                          ) : kw.change < 0 ? (
                            <span className="text-rose-500 font-bold flex items-center text-xs">
                              <ArrowDown className="w-3 h-3" /> {kw.change}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-xs font-medium">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedKeyword(kw);
                            }}
                          >
                            <Eye className="w-4 h-4 text-blue-500" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Add Keyword Form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-bold text-slate-900 dark:text-white">Add Keyword to Monitor</CardTitle>
            </CardHeader>
            <CardContent>
              {addError && (
                <Alert variant="danger" className="mb-4">
                  <span>{addError}</span>
                </Alert>
              )}

              <form onSubmit={handleAddKeyword} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div className="md:col-span-2">
                  <Input
                    label="Search Keyword Phrase"
                    required
                    placeholder="e.g. coffee shop near me"
                    value={newKeyword}
                    onChange={(e) => setNewKeyword(e.target.value)}
                  />
                </div>
                <div>
                  <Input
                    label="Geotarget Location"
                    required
                    placeholder="e.g. San Francisco, CA"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>
                <div>
                  <Select
                    label="Frequency"
                    value={frequency}
                    onChange={(e: any) => setFrequency(e.target.value)}
                    options={[
                      { value: 'Daily', label: 'Daily' },
                      { value: 'Weekly', label: 'Weekly' },
                      { value: 'Monthly', label: 'Monthly' }
                    ]}
                  />
                </div>
                <div className="md:col-span-4 flex justify-end">
                  <Button type="submit" className="flex items-center gap-1">
                    <Plus className="w-4 h-4" /> Start Tracking
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Heatmap Grid Tracker */}
        <div className="space-y-6">
          <Card className="h-full flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold text-slate-900 dark:text-white">Local Map Grid Heatmap</CardTitle>
                <CardDescription className="text-xs">
                  {selectedKeyword ? `Showing positions for "${selectedKeyword.keyword}"` : 'Select a keyword'}
                </CardDescription>
              </div>
              <Grid className="w-5 h-5 text-blue-500" />
            </CardHeader>
            <CardContent className="flex-1 flex flex-col items-center justify-center p-6">
              {loadingGrid ? (
                <div className="text-slate-400">Generating grid heatmap positions...</div>
              ) : !gridData ? (
                <div className="text-slate-400 text-center text-xs">Please select a keyword from the table to load its map grid tracker.</div>
              ) : (
                <div className="space-y-6 w-full flex flex-col items-center">
                  {/* Grid Display */}
                  <div className="grid grid-cols-3 gap-6 p-4 border border-slate-100 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-950/20 max-w-[280px]">
                    {gridData.coordinatesGrid.map((cell: any, idx: number) => (
                      <div
                        key={idx}
                        className={`w-14 h-14 rounded-2xl border-2 flex flex-col items-center justify-center text-xs font-black shadow-sm select-none transition-all duration-200 hover:scale-[1.05] ${getGridColorClass(cell.rank)}`}
                      >
                        {cell.rank}
                        <span className="text-[7px] text-slate-400 font-semibold block mt-0.5">Pos</span>
                      </div>
                    ))}
                  </div>

                  {/* Heatmap Info */}
                  <div className="text-xs text-slate-400 w-full text-center space-y-3">
                    <p className="leading-snug">Each node represents a Google Search query performed from that local geo-coordinate.</p>
                    <div className="flex justify-center gap-4 text-[10px] uppercase font-bold pt-2 border-t border-slate-100 dark:border-slate-850">
                      <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> 1 - 3</span>
                      <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> 4 - 10</span>
                      <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-500"></span> 11+</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
