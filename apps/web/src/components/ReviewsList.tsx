import { useState, useEffect } from "react";
import { Review, ReviewSortOption } from "../types";
import { ReviewItem } from "./ReviewItem";
import { ReviewForm } from "./ReviewForm";
import { ReviewSortControls } from "./ReviewSortControls";
import { createReview, updateReview, deleteReview } from "../lib/api";
import { getUser } from "../lib/auth";

interface ReviewsListProps {
  roadId: string;
  reviews: Review[];
  onReviewsChange?: () => void;
}

export function ReviewsList({ roadId, reviews, onReviewsChange }: ReviewsListProps) {
  const [sort, setSort] = useState<ReviewSortOption>('recency_desc');
  const [showForm, setShowForm] = useState(false);
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | undefined>();

  useEffect(() => {
    const user = getUser();
    setCurrentUserId(user?.id);
  }, []);

  const userReview = currentUserId ? reviews.find(r => r.user_id === currentUserId) : null;

  const sortedReviews = [...reviews].sort((a, b) => {
    if (sort === 'score_asc') return a.score - b.score;
    if (sort === 'score_desc') return b.score - a.score;
    if (sort === 'recency_asc') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    if (sort === 'recency_desc') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    return 0;
  });

  const handleCreateReview = async (review: { score: number; text?: string }) => {
    await createReview(roadId, review);
    setShowForm(false);
    onReviewsChange?.();
  };

  const handleUpdateReview = async (review: { score: number; text?: string }) => {
    if (editingReview) {
      await updateReview(editingReview.id, review);
      setEditingReview(null);
      onReviewsChange?.();
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (confirm("Are you sure you want to delete this review?")) {
      await deleteReview(reviewId);
      onReviewsChange?.();
    }
  };

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-slate-200">
          Reviews ({reviews.length})
        </h2>
        <ReviewSortControls currentSort={sort} onSortChange={setSort} />
      </div>

      {currentUserId && !userReview && !showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="w-full mb-4 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          Write a Review
        </button>
      )}

      {showForm && (
        <ReviewForm
          roadId={roadId}
          onSubmit={handleCreateReview}
          onCancel={() => setShowForm(false)}
        />
      )}

      {editingReview && (
        <ReviewForm
          roadId={roadId}
          existingReview={editingReview}
          onSubmit={handleUpdateReview}
          onCancel={() => setEditingReview(null)}
        />
      )}

      {sortedReviews.length === 0 ? (
        <div className="text-center py-8 text-slate-400">
          No reviews yet. Be the first to review this road!
        </div>
      ) : (
        <div>
          {sortedReviews.map((review) => (
            <ReviewItem
              key={review.id}
              review={review}
              currentUserId={currentUserId}
              onEdit={currentUserId === review.user_id ? setEditingReview : undefined}
              onDelete={currentUserId === review.user_id ? handleDeleteReview : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}
