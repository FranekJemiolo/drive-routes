"use client";

import { useState, useEffect } from "react";
import { Road, Review } from "../types";
import { fetchRoadDetail, fetchReviews } from "../lib/api";
import { ReviewsList } from "./ReviewsList";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { createPortal } from "react-dom";

type Props = {
  roadId: string | null;
  onClose: () => void;
};

export default function RoadDetailModal({ roadId, onClose }: Props) {
  const [road, setRoad] = useState<Road | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!roadId) {
      setLoading(false);
      return;
    }

    const id = roadId;

    async function loadData() {
      try {
        const [roadData, reviewsData] = await Promise.all([
          fetchRoadDetail(id),
          fetchReviews(id)
        ]);
        setRoad(roadData);
        setReviews(reviewsData);
      } catch (error) {
        console.error("Failed to load road:", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [roadId]);

  const handleReviewsChange = async () => {
    if (!roadId) return;
    const [updatedRoad, updatedReviews] = await Promise.all([
      fetchRoadDetail(roadId),
      fetchReviews(roadId)
    ]);
    if (updatedRoad) setRoad(updatedRoad);
    setReviews(updatedReviews);
  };

  function openInGoogleMaps() {
    if (!road?.geometry?.coordinates?.length) return;
    const coords = road.geometry.coordinates;
    const start = coords[0];
    const end = coords[coords.length - 1];
    
    const maxWaypoints = 8;
    const totalPoints = coords.length;
    let url = `https://www.google.com/maps/dir/?api=1&origin=${start[1]},${start[0]}&destination=${end[1]},${end[0]}`;
    
    if (totalPoints > 2) {
      const step = Math.floor((totalPoints - 2) / Math.min(maxWaypoints, totalPoints - 2));
      const waypoints: string[] = [];
      for (let i = 1; i < totalPoints - 1; i += step) {
        if (waypoints.length >= maxWaypoints) break;
        const point = coords[i];
        waypoints.push(`${point[1]},${point[0]}`);
      }
      if (waypoints.length > 0) {
        url += `&waypoints=${waypoints.join('|')}`;
      }
    }
    window.open(url, "_blank");
  }

  function openInAppleMaps() {
    if (!road?.geometry?.coordinates?.length) return;
    const coords = road.geometry.coordinates;
    const start = coords[0];
    const end = coords[coords.length - 1];
    
    const maxWaypoints = 3;
    const totalPoints = coords.length;
    let url = `http://maps.apple.com/?saddr=${start[1]},${start[0]}`;
    
    if (totalPoints > 2) {
      const step = Math.floor((totalPoints - 2) / Math.min(maxWaypoints, totalPoints - 2));
      const waypoints: string[] = [];
      for (let i = 1; i < totalPoints - 1; i += step) {
        if (waypoints.length >= maxWaypoints) break;
        const point = coords[i];
        waypoints.push(`${point[1]},${point[0]}`);
      }
      if (waypoints.length > 0) {
        waypoints.push(`${end[1]},${end[0]}`);
        url += `&daddr=${waypoints.join('+to:')}`;
      } else {
        url += `&daddr=${end[1]},${end[0]}`;
      }
    } else {
      url += `&daddr=${end[1]},${end[0]}`;
    }
    window.open(url, "_blank");
  }

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
          <div className="text-white py-8 text-center">Loading road details...</div>
        ) : !road ? (
          <div className="text-slate-400 py-8 text-center">Road not found</div>
        ) : (
          <>
            <h2 className="text-2xl font-bold text-white mb-2">{road.name}</h2>
            <p className="text-slate-400 mb-4">
              {road.countries && road.countries.length > 0 ? road.countries.join(", ") : "Unknown"} {road.region ? `• ${road.region}` : ''}
            </p>
            
            {road.description && (
              <p className="text-slate-300 mb-6 leading-relaxed">{road.description}</p>
            )}

            <div className="flex items-center gap-6 mb-6">
              <div className={`px-4 py-2 rounded-full text-lg font-semibold ${
                Number(road.rating_avg) >= 8 ? 'bg-green-500/20 text-green-400' :
                Number(road.rating_avg) >= 5 ? 'bg-yellow-500/20 text-yellow-400' :
                Number(road.rating_avg) > 0 ? 'bg-red-500/20 text-red-400' :
                'bg-slate-700 text-slate-400'
              }`}>
                ★ {Number(road.rating_avg) > 0 ? Number(road.rating_avg).toFixed(1) : "New"}
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
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="bg-slate-800 text-slate-200"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              <Button
                onClick={openInGoogleMaps}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white text-sm py-2.5"
              >
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0121 18.382V7.618a1 1 0 00-.553-.894L15 7m0 13V7" />
                </svg>
                Google Maps
              </Button>

              <Button
                onClick={openInAppleMaps}
                variant="outline"
                className="w-full border-slate-700 hover:bg-slate-800 text-white text-sm py-2.5"
              >
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                Apple Maps
              </Button>
            </div>

            {/* Reviews Section */}
            <div className="border-t border-slate-700 pt-6 mb-6">
              <ReviewsList
                roadId={road.id}
                reviews={reviews}
                onReviewsChange={handleReviewsChange}
              />
            </div>

            <Button
              onClick={onClose}
              variant="outline"
              className="w-full border-slate-700 hover:bg-slate-800 text-white"
            >
              Close
            </Button>
          </>
        )}
      </div>
    </div>,
    document.body
  );
}
