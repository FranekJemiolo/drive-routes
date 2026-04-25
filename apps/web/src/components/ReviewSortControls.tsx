import { ReviewSortOption } from "../types";

interface ReviewSortControlsProps {
  currentSort: ReviewSortOption;
  onSortChange: (sort: ReviewSortOption) => void;
}

export function ReviewSortControls({ currentSort, onSortChange }: ReviewSortControlsProps) {
  const sortOptions: { value: ReviewSortOption; label: string }[] = [
    { value: 'recency_desc', label: 'Newest First' },
    { value: 'recency_asc', label: 'Oldest First' },
    { value: 'score_desc', label: 'Highest Score' },
    { value: 'score_asc', label: 'Lowest Score' },
  ];

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-slate-400">Sort by:</span>
      <select
        value={currentSort}
        onChange={(e) => onSortChange(e.target.value as ReviewSortOption)}
        className="bg-slate-800 border border-slate-700 rounded px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {sortOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
