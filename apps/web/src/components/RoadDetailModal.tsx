"use client";

import { useState, useEffect } from "react";
import { Road } from "../types";
import { fetchRoadDetail } from "../lib/api";
import { createPortal } from "react-dom";

type Props = {
  roadId: string | null;
  onClose: () => void;
};

export default function RoadDetailModal({ roadId, onClose }: Props) {
  const [road, setRoad] = useState<Road | null>(null);
  const [loading, setLoading] = useState(true);

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
      } catch (error) {
        console.error("Failed to load road:", error);
      } finally {
        setLoading(false);
      }
    }
    loadRoad();
  }, [roadId]);

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
