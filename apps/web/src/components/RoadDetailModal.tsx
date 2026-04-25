"use client";

import { useState, useEffect } from "react";
import { Road, Review } from "../types";
import { fetchRoadDetail } from "../lib/api";
import { getReviews, createReview as createBrowserReview } from "../lib/browser-storage";
import { isAuthenticated, getUser } from "../lib/auth";
import { createPortal } from "react-dom";

type Props = {
  roadId: string | null;
  onClose: () => void;
};

export default function RoadDetailModal({ roadId, onClose }: Props) {
  const [road, setRoad] = useState<Road | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewScore, setReviewScore] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    if (!roadId) {
      setLoading(false);
      return;
    }

    const id = roadId;

    async function loadRoad() {
      try {
        const data = await fetchRoadDetail(id);
        setRoad(data);
        // Load reviews for this road
        const roadReviews = getReviews(id);
        setReviews(roadReviews);
      } catch (error) {
        console.error("Failed to load road:", error);
      } finally {
        setLoading(false);
      }
    }
    loadRoad();
  }, [roadId]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated() || !roadId) return;

    const user = getUser();
    if (!user) return;

    setSubmittingReview(true);
    try {
      createBrowserReview({
        road_id: roadId,
        user_id: user.id,
        score: reviewScore,
        text: reviewText
      });

      // Reload reviews and road data
      const roadReviews = getReviews(roadId);
      setReviews(roadReviews);
      const updatedRoad = await fetchRoadDetail(roadId);
      setRoad(updatedRoad);

      // Reset form
      setReviewText("");
      setReviewScore(5);
      setShowReviewForm(false);
    } catch (error) {
      console.error("Failed to submit review:", error);
    } finally {
      setSubmittingReview(false);
    }
  };

  if (!roadId) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto relative z-[10000]" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {loading ? (
          <div className="text-white">Loading road...</div>
        ) : !road ? (
          <div className="text-slate-400">Road not found</div>
        ) : (
          <>
            <h2 className="text-2xl font-bold text-white mb-2">{road.name}</h2>
            <p className="text-slate-400 mb-4">
              {road.countries && road.countries.length > 0 ? road.countries.join(", ") : "Unknown"} • {road.region}
            </p>
            
            {road.description && (
              <p className="text-slate-300 mb-6">{road.description}</p>
            )}

            <div className="flex items-center gap-6 mb-6">
              <div className={`px-4 py-2 rounded-full text-lg font-semibold ${
                Number(road.rating_avg) >= 8 ? 'bg-green-500/20 text-green-400' :
                Number(road.rating_avg) >= 5 ? 'bg-yellow-500/20 text-yellow-400' :
                'bg-red-500/20 text-red-400'
              }`}>
                ★ {Number(road.rating_avg).toFixed(1)}
              </div>
              <div className="text-slate-400">
                {road.rating_count} {road.rating_count === 1 ? 'review' : 'reviews'}
              </div>
              <div className="text-slate-400">
                {Number(road.length_km).toFixed(1)} km
              </div>
            </div>

            {road.tags && road.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {road.tags.map(tag => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-slate-700 text-slate-200 rounded-full text-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Reviews Section */}
            <div className="border-t border-slate-700 pt-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-white">Reviews</h3>
                {isAuthenticated() && (
                  <button
                    onClick={() => setShowReviewForm(!showReviewForm)}
                    className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    {showReviewForm ? "Cancel" : "Write Review"}
                  </button>
                )}
              </div>

              {/* Review Form */}
              {showReviewForm && (
                <form onSubmit={handleSubmitReview} className="mb-6 p-4 bg-slate-800 rounded-lg">
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-300 mb-2">Rating</label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
                        <button
                          key={score}
                          type="button"
                          onClick={() => setReviewScore(score)}
                          className={`w-8 h-8 rounded-full font-medium transition-colors ${
                            reviewScore === score
                              ? 'bg-green-500 text-white'
                              : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                          }`}
                        >
                          {score}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-300 mb-2">Your Review</label>
                    <textarea
                      value={reviewText}
                      onChange={(e) => setReviewText(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Share your experience on this road..."
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={submittingReview}
                    className="w-full px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-slate-600 text-white rounded-lg font-medium transition-colors"
                  >
                    {submittingReview ? "Submitting..." : "Submit Review"}
                  </button>
                </form>
              )}

              {/* Reviews List */}
              {reviews.length === 0 ? (
                <p className="text-slate-400 text-center py-4">No reviews yet. Be the first to review!</p>
              ) : (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div key={review.id} className="p-4 bg-slate-800 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className={`px-2 py-1 rounded-full text-sm font-semibold ${
                          review.score >= 8 ? 'bg-green-500/20 text-green-400' :
                          review.score >= 5 ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-red-500/20 text-red-400'
                        }`}>
                          ★ {review.score}/10
                        </div>
                        <span className="text-xs text-slate-500">
                          {new Date(review.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      {review.text && (
                        <p className="text-slate-300 text-sm">{review.text}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={onClose}
              className="w-full px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
            >
              Close
            </button>
          </>
        )}
      </div>
    </div>,
    document.body
  );
}
