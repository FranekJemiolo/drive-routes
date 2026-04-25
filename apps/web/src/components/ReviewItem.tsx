import { Review } from "../types";

interface ReviewItemProps {
  review: Review;
  currentUserId?: string;
  onEdit?: (review: Review) => void;
  onDelete?: (reviewId: string) => void;
}

export function ReviewItem({ review, currentUserId, onEdit, onDelete }: ReviewItemProps) {
  const isOwner = currentUserId === review.user_id;
  const date = new Date(review.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 mb-3">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-slate-300 font-semibold">
            {review.user?.username?.[0]?.toUpperCase() || 'U'}
          </div>
          <div>
            <div className="font-medium text-slate-200">
              {review.user?.username || 'Anonymous'}
            </div>
            <div className="text-xs text-slate-400">{date}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-700 px-2 py-1 rounded">
            <span className="text-yellow-400">★</span>
            <span className="font-semibold text-slate-200">{review.score}</span>
            <span className="text-slate-400 text-sm">/10</span>
          </div>
          {isOwner && (
            <div className="flex gap-1">
              {onEdit && (
                <button
                  onClick={() => onEdit(review)}
                  className="text-slate-400 hover:text-slate-200 text-sm px-2 py-1 rounded hover:bg-slate-700 transition-colors"
                >
                  Edit
                </button>
              )}
              {onDelete && (
                <button
                  onClick={() => onDelete(review.id)}
                  className="text-red-400 hover:text-red-300 text-sm px-2 py-1 rounded hover:bg-slate-700 transition-colors"
                >
                  Delete
                </button>
              )}
            </div>
          )}
        </div>
      </div>
      {review.text && (
        <p className="text-slate-300 text-sm leading-relaxed">{review.text}</p>
      )}
    </div>
  );
}
