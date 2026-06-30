import React, { useEffect, useState } from 'react';
import { useAppStore } from '../store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Button, Input, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Alert, Badge } from '../components/ui';
import { Plus, Users, Star, BarChart3, Globe, ShieldAlert } from 'lucide-react';
import axios from 'axios';

export const CompetitorsPage: React.FC = () => {
  const { activeBusiness, token, apiBaseUrl } = useAppStore();
  const [competitors, setCompetitors] = useState<any[]>([]);
  const [myProfile, setMyProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // Add competitor form
  const [name, setName] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [primaryCategory, setPrimaryCategory] = useState('');
  const [addError, setAddError] = useState<string | null>(null);

  const fetchCompetitors = async () => {
    if (!activeBusiness) return;
    try {
      setLoading(true);
      const res = await axios.get(`${apiBaseUrl}/competitors?businessId=${activeBusiness._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCompetitors(res.data);

      try {
        const profileRes = await axios.get(`${apiBaseUrl}/google-profiles?businessId=${activeBusiness._id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMyProfile(profileRes.data);
      } catch (e) {
        setMyProfile(null);
      }
    } catch (error) {
      console.error('Failed to fetch competitors:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompetitors();
  }, [activeBusiness, token, apiBaseUrl]);

  const handleAddCompetitor = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);
    if (!name.trim()) {
      setAddError('Competitor name is required.');
      return;
    }

    try {
      await axios.post(`${apiBaseUrl}/competitors`, {
        businessId: activeBusiness?._id,
        name,
        websiteUrl,
        primaryCategory
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setName('');
      setWebsiteUrl('');
      setPrimaryCategory('');
      fetchCompetitors();
    } catch (error: any) {
      setAddError('Failed to add competitor.');
    }
  };

  const getInsights = () => {
    if (competitors.length === 0) {
      return (
        <p className="text-slate-500 dark:text-slate-400 text-xs">
          Add competitors to analyze review and photo count gaps.
        </p>
      );
    }

    const reviewLeader = [...competitors].sort((a, b) => (b.reviewsCount || 0) - (a.reviewsCount || 0))[0];
    const photoLeader = [...competitors].sort((a, b) => (b.photosCount || 0) - (a.photosCount || 0))[0];

    const myReviews = myProfile?.reviewsCount || 0;
    const myPhotos = myProfile?.photosCount || 0;

    const reviewGap = (reviewLeader.reviewsCount || 0) - myReviews;
    const photoGap = (photoLeader.photosCount || 0) - myPhotos;

    return (
      <div className="space-y-4">
        <div className="p-4 bg-blue-500/5 border border-blue-500/10 rounded-xl space-y-2 text-xs">
          <h4 className="font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
            <BarChart3 className="w-4 h-4" /> Review Gap Opportunity
          </h4>
          {reviewGap > 0 ? (
            <p className="text-slate-600 dark:text-slate-350 leading-relaxed">
              Competitor <strong>{reviewLeader.name}</strong> leads with <strong>{reviewLeader.reviewsCount}</strong> reviews. You currently have <strong>{myReviews}</strong>. Collect <strong>{reviewGap + 5}</strong> more high-rating reviews to close the competitive gap.
            </p>
          ) : (
            <p className="text-slate-600 dark:text-slate-350 leading-relaxed">
              Great job! You lead local reviews with <strong>{myReviews}</strong> reviews, ahead of <strong>{reviewLeader.name}</strong> (who has {reviewLeader.reviewsCount}). Maintain your lead by collecting 2-3 reviews weekly!
            </p>
          )}
        </div>

        <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-xl space-y-2 text-xs">
          <h4 className="font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4" /> Photo Signal Delta
          </h4>
          {photoGap > 0 ? (
            <p className="text-slate-600 dark:text-slate-350 leading-relaxed">
              <strong>{photoLeader.name}</strong> has published <strong>{photoLeader.photosCount}</strong> photos. Your profile currently has <strong>{myPhotos}</strong> photos. We recommend uploading <strong>{photoGap + 3}</strong> high-resolution geotagged photos to match their search visual signals.
            </p>
          ) : (
            <p className="text-slate-600 dark:text-slate-350 leading-relaxed">
              Your profile has <strong>{myPhotos}</strong> photos, exceeding <strong>{photoLeader.name}</strong>'s count of <strong>{photoLeader.photosCount}</strong>. Keep sharing visual updates to retain your visual relevance.
            </p>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return <div className="text-center py-12 text-slate-400">Loading competitor profiles...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Competitor Profiles Table */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-slate-900 dark:text-white">Local Competitors</CardTitle>
                <CardDescription className="text-xs">Compare GBP metrics of your local competitors.</CardDescription>
              </div>
              <Users className="w-5 h-5 text-blue-500" />
            </CardHeader>
            <CardContent className="p-0">
              {competitors.length === 0 ? (
                <div className="p-12 text-center text-slate-400">No competitors added yet. Add one below!</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Business Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Average Rating</TableHead>
                      <TableHead>Reviews Count</TableHead>
                      <TableHead>Photos</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {competitors.map((comp) => (
                      <TableRow key={comp._id}>
                        <TableCell className="font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                          {comp.name}
                          {comp.websiteUrl && (
                            <a href={comp.websiteUrl} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline">
                              <Globe className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="default">{comp.primaryCategory || 'Local Business'}</Badge>
                        </TableCell>
                        <TableCell>
                          <span className="flex items-center gap-1 font-bold text-slate-800 dark:text-slate-205">
                            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                            {comp.averageRating || '0.0'}
                          </span>
                        </TableCell>
                        <TableCell>{comp.reviewsCount || 0} Reviews</TableCell>
                        <TableCell>{comp.photosCount || 0} Photos</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Add Competitor Form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-bold text-slate-900 dark:text-white">Add New Competitor</CardTitle>
              <CardDescription className="text-xs">Add competitor details to compare local search metrics.</CardDescription>
            </CardHeader>
            <CardContent>
              {addError && (
                <Alert variant="danger" className="mb-4">
                  <span>{addError}</span>
                </Alert>
              )}

              <form onSubmit={handleAddCompetitor} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div>
                  <Input
                    label="Competitor Name"
                    required
                    placeholder="e.g. Rival Bakery Shop"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div>
                  <Input
                    label="Website URL"
                    placeholder="https://rivalbakery.com"
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                  />
                </div>
                <div>
                  <Input
                    label="Primary Category"
                    placeholder="e.g. Bakery"
                    value={primaryCategory}
                    onChange={(e) => setPrimaryCategory(e.target.value)}
                  />
                </div>
                <div className="md:col-span-3 flex justify-end">
                  <Button type="submit" className="flex items-center gap-1">
                    <Plus className="w-4 h-4" /> Add Competitor
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Competitor Insights Panel */}
        <div>
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-sm font-bold text-slate-900 dark:text-white">Competitor Insights</CardTitle>
              <CardDescription className="text-xs">Identified search opportunities.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {getInsights()}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
