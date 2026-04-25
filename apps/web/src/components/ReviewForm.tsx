import { useState } from "react";
import { Review } from "../types";

interface ReviewFormProps {
  roadId: string;
  existingReview?: Review;
  onSubmit: (review: { score: number; text?: string }) => Promise<void>;
  onCancel?: () => void;
}

export function ReviewForm({ roadId, existingReview, onSubmit, onCancel }: ReviewFormProps) {
  const [score, setScore] = useState(existingReview?.score || 5);
  const [text, setText] = useState(existingReview?.text || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit({ score, text: text.trim() || undefined });
      if (!existingReview) {
        // Reset form only for new reviews
        setScore(5);
        setText("");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-slate-800 border border-slate-700 rounded-lg p-4 mb-4">
      <h3 className="text-lg font-semibold text-slate-200 mb-4">
        {existingReview ? "Edit Your Review" : "Write a Review"}
      </h3>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Rating (1-10)
        </label>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min="1"
            max="10"
            value={score}
            onChange={(e) => setScore(parseInt(e.target.value))}
            className="flex-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
          <div className="flex items-center gap-1 bg-slate-700 px-3 py-1.5 rounded min-w-[80px] justify-center">
            <span className="text-yellow-400">★</span>
            <span className="font-semibold text-slate-200 text-lg">{score}</span>
            <span className="text-slate-400 text-sm">/10</span>
          </div>
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Your Review (optional)
        </label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Share your experience on this road..."
          rows={4}
          className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
      </div>

      <div className="flex gap-2 justify-end">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-4 py-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Submitting..." : existingReview ? "Update Review" : "Submit Review"}
        </button>
      </div>
    </form>
  );
}
