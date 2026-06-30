import React, { useEffect, useState } from 'react';
import { useAppStore } from '../store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Button, Badge } from '../components/ui';
import { Star, MessageCircle, Sparkles, Filter, Check } from 'lucide-react';
import axios from 'axios';

export const ReviewsPage: React.FC = () => {
  const { activeBusiness, token, apiBaseUrl } = useAppStore();
  const [reviews, setReviews] = useState<any[]>([]);
  const [filteredReviews, setFilteredReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sentimentFilter, setSentimentFilter] = useState<'All' | 'Positive' | 'Neutral' | 'Negative'>('All');

  // Reply state
  const [selectedReview, setSelectedReview] = useState<any>(null);
  const [replyText, setReplyText] = useState('');
  const [generatingAi, setGeneratingAi] = useState(false);
  const [submittingReply, setSubmittingReply] = useState(false);
  const [autoReplyingReviewId, setAutoReplyingReviewId] = useState<string | null>(null);
  const [bulkAutoReplying, setBulkAutoReplying] = useState(false);

  const fetchReviews = async () => {
    if (!activeBusiness) return;
    try {
      setLoading(true);
      const res = await axios.get(`${apiBaseUrl}/reviews?businessId=${activeBusiness._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReviews(res.data);
      setFilteredReviews(res.data);
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAutoReply = async (reviewId: string) => {
    try {
      setAutoReplyingReviewId(reviewId);
      await axios.post(`${apiBaseUrl}/reviews/auto-reply`, {
        reviewId
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchReviews();
    } catch (err) {
      console.error('Failed to auto reply:', err);
    } finally {
      setAutoReplyingReviewId(null);
    }
  };

  const handleAutoReplyAll = async () => {
    if (!activeBusiness) return;
    try {
      setBulkAutoReplying(true);
      const res = await axios.post(`${apiBaseUrl}/reviews/auto-reply-all`, {
        businessId: activeBusiness._id
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReviews(res.data);
      setFilteredReviews(res.data);
    } catch (err) {
      console.error('Failed to auto reply all:', err);
    } finally {
      setBulkAutoReplying(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [activeBusiness, token, apiBaseUrl]);

  useEffect(() => {
    if (sentimentFilter === 'All') {
      setFilteredReviews(reviews);
    } else {
      setFilteredReviews(reviews.filter((r) => r.sentiment === sentimentFilter));
    }
  }, [sentimentFilter, reviews]);

  const handleGenerateAiResponse = async (review: any) => {
    setSelectedReview(review);
    setReplyText('');
    try {
      setGeneratingAi(true);
      const res = await axios.post(`${apiBaseUrl}/reviews/ai-reply`, {
        comment: review.comment,
        rating: review.rating
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReplyText(res.data.responseText);
    } catch (error) {
      console.error('Failed to generate AI response:', error);
    } finally {
      setGeneratingAi(false);
    }
  };

  const handlePostReply = async (reviewId: string) => {
    if (!replyText.trim()) return;
    try {
      setSubmittingReply(true);
      await axios.post(`${apiBaseUrl}/reviews/reply`, {
        reviewId,
        replyText,
        replyType: 'AI'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Update local review state
      setReviews(reviews.map((r) => (r._id === reviewId ? { ...r, isReplied: true } : r)));
      setSelectedReview(null);
      setReplyText('');
    } catch (error) {
      console.error('Failed to post review reply:', error);
    } finally {
      setSubmittingReply(false);
    }
  };

  const getSentimentBadge = (sentiment: string) => {
    if (sentiment === 'Positive') return <Badge variant="success">Positive</Badge>;
    if (sentiment === 'Neutral') return <Badge variant="warning">Neutral</Badge>;
    return <Badge variant="danger">Negative</Badge>;
  };

  if (loading) {
    return <div className="text-center py-12 text-slate-400">Loading Google reviews...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Filters Header */}
      <Card>
        <CardContent className="p-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex flex-col md:flex-row md:items-center gap-4 flex-1">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-blue-500" />
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Filter reviews by sentiment:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {(['All', 'Positive', 'Neutral', 'Negative'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setSentimentFilter(filter)}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg cursor-pointer transition-all ${
                    sentimentFilter === filter
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-350'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>
          {reviews.some((r) => !r.isReplied) && (
            <Button
              onClick={handleAutoReplyAll}
              disabled={bulkAutoReplying}
              className="w-full md:w-auto flex items-center justify-center gap-1.5 text-xs bg-purple-600 hover:bg-purple-750 text-white font-semibold"
            >
              <Sparkles className="w-4 h-4" />
              {bulkAutoReplying ? 'Auto-Replying All...' : 'Auto-Reply All Unanswered (AI)'}
            </Button>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Reviews List */}
        <div className="lg:col-span-2 space-y-4">
          {filteredReviews.length === 0 ? (
            <Card className="text-center py-12 text-slate-400 bg-transparent border-dashed">
              <CardContent>No reviews found matching selection.</CardContent>
            </Card>
          ) : (
            filteredReviews.map((rev) => (
              <Card key={rev._id} className="hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
                <CardContent className="p-5 space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="flex gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-700 dark:text-slate-350 text-sm border border-slate-200 dark:border-slate-700">
                        {rev.reviewerName[0]}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white">{rev.reviewerName}</h4>
                        <div className="flex gap-0.5 mt-0.5">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3 h-3 ${
                                i < rev.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200 dark:text-slate-700'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      {getSentimentBadge(rev.sentiment)}
                      <span className="text-[10px] text-slate-450 dark:text-slate-550">
                        {new Date(rev.publishDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {rev.comment && (
                    <p className="text-xs text-slate-650 dark:text-slate-300 italic leading-relaxed pl-13 border-l-2 border-slate-100 dark:border-slate-800">
                      "{rev.comment}"
                    </p>
                  )}

                  <div className="flex justify-between items-center pt-2 pl-13">
                    <span className="text-[10px] font-semibold flex items-center gap-1">
                      {rev.isReplied ? (
                        <span className="text-emerald-500 flex items-center gap-0.5"><Check className="w-3.5 h-3.5" /> Replied to Google</span>
                      ) : (
                        <span className="text-amber-500">Unanswered</span>
                      )}
                    </span>

                    {!rev.isReplied && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAutoReply(rev._id)}
                          disabled={autoReplyingReviewId === rev._id}
                          className="flex items-center gap-1.5 cursor-pointer text-xs"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-purple-550" />
                          {autoReplyingReviewId === rev._id ? 'Replying...' : 'Auto Reply (AI)'}
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleGenerateAiResponse(rev)}
                          className="flex items-center gap-1.5 cursor-pointer text-xs"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                          AI Editor
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Reply Editor (Right Sidebar) */}
        <div>
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <MessageCircle className="w-4 h-4 text-blue-500" /> Reply to Review
              </CardTitle>
              <CardDescription className="text-xs">
                {selectedReview ? `Reviewer: ${selectedReview.reviewerName}` : 'Select a review to answer.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedReview ? (
                <div className="space-y-4">
                  <div className="p-3 bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-850 rounded-xl text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">{selectedReview.reviewerName}</span>
                      <span className="text-amber-500 flex font-semibold gap-0.5"><Star className="w-3 h-3 fill-amber-500" /> {selectedReview.rating}</span>
                    </div>
                    <p className="italic text-slate-500 dark:text-slate-400">"{selectedReview.comment || 'No comment text left.'}"</p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-350 mb-1.5">Reply Message</label>
                    <textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Write your response message..."
                      rows={5}
                      className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => handleGenerateAiResponse(selectedReview)}
                      disabled={generatingAi}
                      className="flex-1 flex items-center justify-center gap-1 text-xs"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                      {generatingAi ? 'Writing...' : 'Regen AI'}
                    </Button>
                    <Button
                      onClick={() => handlePostReply(selectedReview._id)}
                      disabled={submittingReply || !replyText.trim()}
                      className="flex-1 text-xs font-semibold"
                    >
                      {submittingReply ? 'Posting...' : 'Publish Reply'}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-slate-400 text-xs">
                  Click on the "AI Response" button of any unanswered review to auto-generate a professional response.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
