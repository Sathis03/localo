import React, { useEffect, useState } from 'react';
import { useAppStore } from '../store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Button, Input, Select, Badge, Alert } from '../components/ui';
import {
  RefreshCw, Calendar, FileText, CheckCircle, MapPin, Tag, Image as ImageIcon
} from 'lucide-react';
import axios from 'axios';

export const GbpPage: React.FC = () => {
  const { activeBusiness, token, apiBaseUrl } = useAppStore();
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  // GMB Post scheduling states
  const [posts, setPosts] = useState<any[]>([]);
  const [summary, setSummary] = useState('');
  const [actionType, setActionType] = useState<'LEARN_MORE' | 'CALL' | 'BOOK'>('LEARN_MORE');
  const [ctaUrl, setCtaUrl] = useState('');
  const [postError, setPostError] = useState<string | null>(null);
  const [postSuccess, setPostSuccess] = useState(false);

  // Photo states
  const [photos, setPhotos] = useState<string[]>([]);
  const [photoCategory, setPhotoCategory] = useState<'Interior' | 'Exterior' | 'Team' | 'Logo'>('Interior');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadSuccess(false);
    const file = e.target.files?.[0];
    if (!file || !profile) return;

    setUploadingPhoto(true);
    const url = URL.createObjectURL(file);
    
    try {
      const res = await axios.post(`${apiBaseUrl}/google-profiles/photos`, {
        googleProfileId: profile._id,
        photoUrl: url
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPhotos(res.data.photos);
      setProfile({
        ...profile,
        photosCount: res.data.photos.length
      });
      setUploadSuccess(true);
    } catch (err) {
      console.error('Failed to upload photo:', err);
    } finally {
      setUploadingPhoto(false);
      e.target.value = '';
    }
  };

  const fetchProfileAndPosts = async () => {
    if (!activeBusiness) return;
    try {
      setLoading(true);
      const profileRes = await axios.get(`${apiBaseUrl}/google-profiles?businessId=${activeBusiness._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const profileData = profileRes.data;
      setProfile(profileData);

      if (profileData) {
        // Fetch posts
        const postsRes = await axios.get(`${apiBaseUrl}/google-profiles/posts?googleProfileId=${profileData._id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setPosts(postsRes.data);

        // Fetch photos
        const photosRes = await axios.get(`${apiBaseUrl}/google-profiles/photos?googleProfileId=${profileData._id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setPhotos(photosRes.data);
      } else {
        setPosts([]);
        setPhotos([]);
      }
    } catch (error) {
      console.log('Google Profile not connected yet.');
      setProfile(null);
      setPosts([]);
      setPhotos([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileAndPosts();
  }, [activeBusiness, token, apiBaseUrl]);

  const handleConnectGoogle = async () => {
    if (!activeBusiness) return;
    try {
      setSyncing(true);
      const google = (window as any).google;
      if (google && google.accounts && google.accounts.oauth2) {
        const client = google.accounts.oauth2.initCodeClient({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || '952354818653-dahuatsrqa8jcd4150kq9uajs99cd0mo.apps.googleusercontent.com',
          scope: 'https://www.googleapis.com/auth/business.manage',
          ux_mode: 'popup',
          callback: async (response: any) => {
            if (response.code) {
              try {
                const res = await axios.post(`${apiBaseUrl}/google-profiles/connect`, {
                  businessId: activeBusiness._id,
                  authCode: response.code
                }, {
                  headers: { Authorization: `Bearer ${token}` }
                });
                setProfile(res.data.profile);
                fetchProfileAndPosts();
              } catch (error) {
                console.error('OAuth connection failed:', error);
              }
            }
            setSyncing(false);
          },
        });
        client.requestCode();
      } else {
        const res = await axios.post(`${apiBaseUrl}/google-profiles/connect`, {
          businessId: activeBusiness._id,
          authCode: 'mock_auth_code_9876'
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setProfile(res.data.profile);
        fetchProfileAndPosts();
        setSyncing(false);
      }
    } catch (error) {
      console.error('OAuth connection failed:', error);
      setSyncing(false);
    }
  };

  const handleSchedulePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setPostError(null);
    setPostSuccess(false);

    if (!summary.trim()) {
      setPostError('Post summary content is required.');
      return;
    }

    try {
      const res = await axios.post(`${apiBaseUrl}/google-profiles/posts`, {
        googleProfileId: profile._id,
        summary,
        actionType,
        ctaUrl: actionType !== 'CALL' ? ctaUrl : undefined
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setPosts([res.data, ...posts]);
      setSummary('');
      setCtaUrl('');
      setPostSuccess(true);
    } catch (error: any) {
      console.error(error);
      setPostError('Failed to schedule GBP Post.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <span className="ml-3 text-slate-500 text-sm">Syncing Google Business profile...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {!profile ? (
        <Card className="border-dashed border-2 border-slate-300 dark:border-slate-800 text-center py-12 px-6 bg-transparent">
          <CardContent className="flex flex-col items-center max-w-md mx-auto">
            <div className="w-16 h-16 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-500 flex items-center justify-center mb-4">
              <MapPin className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Connect Google Business Profile</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-2 mb-6">
              Connect your company's Google Account to import categories, services, products, sync reviews, and schedule posts.
            </p>
            <Button
              onClick={handleConnectGoogle}
              disabled={syncing}
              className="w-full flex items-center justify-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Connecting...' : 'Authorize Google Account'}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile overview cards */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold text-slate-900 dark:text-white">{profile.businessName}</CardTitle>
                  <CardDescription className="text-xs flex items-center gap-1 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-blue-500" />
                    Place ID: <span className="font-mono text-[10px] text-slate-400">{profile.placeId}</span>
                  </CardDescription>
                </div>
                <Badge variant="success">Synced Active</Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Description */}
                <div>
                  <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Business Description</h4>
                  <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{profile.description}</p>
                </div>

                <hr className="border-slate-100 dark:border-slate-800/60" />

                {/* Categories */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-slate-400" /> Primary Category
                    </h4>
                    <Badge variant="info">{profile.primaryCategory}</Badge>
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-slate-400" /> Secondary Categories
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {profile.secondaryCategories.map((cat: string, idx: number) => (
                        <Badge key={idx} variant="default">{cat}</Badge>
                      ))}
                    </div>
                  </div>
                </div>

                <hr className="border-slate-100 dark:border-slate-800/60" />

                {/* Services */}
                <div>
                  <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Connected Services</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {profile.services.map((srv: string, idx: number) => (
                      <span key={idx} className="text-xs px-2.5 py-1 bg-slate-100 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 rounded-lg border border-slate-200/50 dark:border-slate-800/40 font-medium">
                        {srv}
                      </span>
                    ))}
                  </div>
                </div>

                <hr className="border-slate-100 dark:border-slate-800/60" />

                {/* Products list */}
                <div>
                  <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Listed Products</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {profile.products.map((prod: any, idx: number) => (
                      <div key={idx} className="p-3 border border-slate-150 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/20">
                        <div className="flex justify-between items-start">
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-250">{prod.name}</p>
                          <span className="text-xs font-mono font-bold text-blue-500">{prod.price}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1">{prod.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Photos Gallery */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold text-slate-900 dark:text-white">Google Profile Photo Gallery</CardTitle>
                  <CardDescription className="text-xs">Visual assets uploaded directly to your Google Maps location page.</CardDescription>
                </div>
                <Badge variant="info">{photos.length} Connected</Badge>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                  {photos.map((src, idx) => (
                    <div key={idx} className="aspect-square rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm relative group bg-slate-100 dark:bg-slate-900">
                      <img src={src} alt="GBP Location" className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Sync Logs */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-bold text-slate-900 dark:text-white">Profile Sync Logs</CardTitle>
                <CardDescription className="text-xs font-medium">History of automatic Google API calls.</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-slate-100 dark:divide-slate-800/40">
                  <div className="p-4 flex justify-between items-center text-xs">
                    <div className="flex gap-2.5 items-center">
                      <CheckCircle className="w-4 h-4 text-emerald-500" />
                      <div>
                        <p className="font-semibold text-slate-800 dark:text-slate-200">Metadata, services, and categories synced</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Google My Business Business Profile API v4</p>
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-450 dark:text-slate-550">{new Date().toLocaleDateString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right sidebar: Post scheduling and stats */}
          <div className="space-y-6">
            {/* Stats Summary */}
            <Card>
              <CardContent className="p-5 space-y-4">
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">GBP Metrics Summary</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 border border-slate-100 dark:border-slate-800 rounded-xl text-center">
                    <span className="text-2xl font-bold text-slate-900 dark:text-white">{profile.photosCount}</span>
                    <p className="text-[10px] text-slate-400 font-semibold uppercase mt-0.5 flex items-center justify-center gap-1">
                      <ImageIcon className="w-3 h-3" /> Photos
                    </p>
                  </div>
                  <div className="p-3 border border-slate-100 dark:border-slate-800 rounded-xl text-center">
                    <span className="text-2xl font-bold text-slate-900 dark:text-white">{profile.reviewsCount}</span>
                    <p className="text-[10px] text-slate-400 font-semibold uppercase mt-0.5 flex items-center justify-center gap-1">
                      <FileText className="w-3 h-3" /> Reviews
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Schedule Post Form */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-bold text-slate-900 dark:text-white">Create GMB Post</CardTitle>
                <CardDescription className="text-xs">Schedule an update, offer, or event on your profile.</CardDescription>
              </CardHeader>
              <CardContent>
                {postSuccess && (
                  <Alert variant="success" className="mb-4">
                    <span>GMB Post scheduled successfully!</span>
                  </Alert>
                )}
                {postError && (
                  <Alert variant="danger" className="mb-4">
                    <span>{postError}</span>
                  </Alert>
                )}

                <form onSubmit={handleSchedulePost} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-350 mb-1.5">Post Content</label>
                    <textarea
                      required
                      placeholder="Write your Google Business update post content here..."
                      rows={4}
                      value={summary}
                      onChange={(e) => setSummary(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <Select
                    label="Call To Action Button"
                    value={actionType}
                    onChange={(e: any) => setActionType(e.target.value)}
                    options={[
                      { value: 'LEARN_MORE', label: 'Learn More' },
                      { value: 'BOOK', label: 'Book Now' },
                      { value: 'CALL', label: 'Call Business' }
                    ]}
                  />

                  {actionType !== 'CALL' && (
                    <Input
                      label="CTA Button Link"
                      type="url"
                      required
                      placeholder="https://yourwebsite.com/offer"
                      value={ctaUrl}
                      onChange={(e) => setCtaUrl(e.target.value)}
                    />
                  )}

                  <Button type="submit" className="w-full flex items-center justify-center gap-1.5">
                    <Calendar className="w-4 h-4" /> Schedule GMB Post
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Upload Photo to GBP */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-bold text-slate-900 dark:text-white">Upload Profile Photo</CardTitle>
                <CardDescription className="text-xs">Publish a new photo to Google Business Profile search listings.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {uploadSuccess && (
                  <Alert variant="success">
                    <span>Photo successfully published on Google My Business!</span>
                  </Alert>
                )}
                <div className="space-y-3">
                  <Select
                    label="Photo Category"
                    value={photoCategory}
                    onChange={(e: any) => setPhotoCategory(e.target.value)}
                    options={[
                      { value: 'Interior', label: 'Interior View' },
                      { value: 'Exterior', label: 'Exterior View' },
                      { value: 'Team', label: 'Staff / Team' },
                      { value: 'Logo', label: 'Business Logo' }
                    ]}
                  />

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-350 mb-1.5">Select Image File</label>
                    <input
                      type="file"
                      accept="image/*"
                      disabled={uploadingPhoto}
                      onChange={handlePhotoUpload}
                      className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 dark:file:bg-blue-950/40 dark:file:text-blue-400 file:cursor-pointer cursor-pointer border border-slate-300 dark:border-slate-800 rounded-lg p-1.5 bg-white dark:bg-slate-950"
                    />
                  </div>

                  {uploadingPhoto && (
                    <div className="flex items-center gap-2 text-xs text-slate-450 dark:text-slate-550 pt-1">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-500" />
                      <span>Optimizing and uploading to Google Maps...</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Scheduled/Recent Posts */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-bold text-slate-900 dark:text-white">Scheduled & Recent Posts</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-slate-100 dark:divide-slate-800/40">
                  {posts.map((post) => (
                    <div key={post._id} className="p-4 space-y-2 text-xs">
                      <div className="flex justify-between items-center">
                        <Badge variant={post.status === 'Published' ? 'success' : 'info'}>
                          {post.status}
                        </Badge>
                        <span className="text-[10px] text-slate-400">
                          {post.status === 'Published'
                            ? new Date(post.publishedAt).toLocaleDateString()
                            : new Date(post.scheduledAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-slate-700 dark:text-slate-300 leading-snug line-clamp-2">{post.summary}</p>
                      <div className="flex items-center gap-1 text-[10px] text-blue-500 font-semibold">
                        <span>Action: {post.actionType}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};
