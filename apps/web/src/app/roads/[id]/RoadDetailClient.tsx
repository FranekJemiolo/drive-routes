"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Road, Review } from "../../../types";
import { fetchRoadDetail, fetchReviews, toggleSaveRoute, fetchSavedRouteIds } from "../../../lib/api";
import Navbar from "../../../components/Navbar";
import { ReviewsList } from "../../../components/ReviewsList";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import { isAuthenticated, getUser } from "../../../lib/auth";
import { TrackCircuitMinimap } from "../../../components/TrackCircuitMinimap";

type Props = {
  roadId: string;
};

export default function RoadDetailClient({ roadId }: Props) {
  const router = useRouter();
  const [road, setRoad] = useState<Road | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [savingRoute, setSavingRoute] = useState(false);
  const [previewMode, setPreviewMode] = useState<"circuit" | "map">("circuit");
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [L, setL] = useState<any>(null);

  useEffect(() => {
    import("leaflet").then((leaflet) => {
      setL(leaflet.default);
    });
  }, []);

  useEffect(() => {
    async function loadData() {
      try {
        const [roadData, reviewsData] = await Promise.all([
          fetchRoadDetail(roadId),
          fetchReviews(roadId)
        ]);
        setRoad(roadData);
        setReviews(reviewsData);

        if (isAuthenticated()) {
          const user = getUser();
          const savedIds = await fetchSavedRouteIds(user?.id);
          setIsSaved(savedIds.includes(roadId));
        }
      } catch (error) {
        console.error("Failed to load road details:", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [roadId]);

  // Render Leaflet map
  useEffect(() => {
    if (!mapRef.current || !L || !road?.geometry?.coordinates) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const map = L.map(mapRef.current, {
      center: [0, 0],
      zoom: 4,
      scrollWheelZoom: false,
    });

    mapInstanceRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);

    const coords: [number, number][] = road.geometry.coordinates.map((coord: number[]) => [coord[1], coord[0]]);
    const polyline = L.polyline(coords, {
      color: "#10b981",
      weight: 5,
      opacity: 0.9,
    }).addTo(map);

    map.fitBounds(polyline.getBounds(), { padding: [30, 30] });

    setTimeout(() => {
      map.invalidateSize();
    }, 150);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [road, L]);

  const handleToggleSave = async () => {
    if (!isAuthenticated()) {
      router.push("/roads");
      return;
    }
    setSavingRoute(true);
    try {
      const newStatus = await toggleSaveRoute(roadId, isSaved);
      setIsSaved(newStatus);
      if (road) {
        setRoad({
          ...road,
          save_count: newStatus ? (road.save_count || 0) + 1 : Math.max(0, (road.save_count || 0) - 1)
        });
      }
    } catch (err) {
      console.error("Failed to toggle save route:", err);
    } finally {
      setSavingRoute(false);
    }
  };

  const handleReviewsChange = async () => {
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

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
          <div className="text-white">Loading road...</div>
        </div>
      </div>
    );
  }

  if (!road) {
    return (
      <div className="min-h-screen bg-slate-900">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
          <div className="text-slate-400">Road not found</div>
          <button
            onClick={() => router.push("/roads")}
            className="mt-4 text-green-400 hover:text-green-300"
          >
            ← Back to Roads
          </button>
        </div>
      </div>
    );
  }

  const rating = Number(road.rating_avg);
  const length = Number(road.length_km);

  return (
    <div className="min-h-screen bg-slate-900">
      <Navbar />
      
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        <button
          onClick={() => router.push("/roads")}
          className="text-slate-400 hover:text-white mb-6 inline-flex items-center text-sm font-medium transition-colors"
        >
          ← Back to Roads
        </button>

        {/* Hero Card */}
        <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-6 sm:p-8 mb-8 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">{road.name}</h1>
              <p className="text-slate-400 text-sm sm:text-base">
                {road.countries && road.countries.length > 0 ? road.countries.join(", ") : "Unknown"} {road.region ? `• ${road.region}` : ''}
              </p>
            </div>

            {/* Save Route Button */}
            <button
              onClick={handleToggleSave}
              disabled={savingRoute}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                isSaved
                  ? 'bg-red-500/20 text-red-400 border border-red-500/40 hover:bg-red-500/30'
                  : 'bg-slate-700 hover:bg-slate-600 text-slate-200 border border-slate-600'
              }`}
            >
              <svg className="w-5 h-5" fill={isSaved ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              {isSaved ? "Saved" : "Save Route"}
            </button>
          </div>

          {road.description && (
            <p className="text-slate-300 text-base leading-relaxed mb-6">{road.description}</p>
          )}

          {/* Stats Bar */}
          <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-slate-900/60 rounded-xl border border-slate-800">
            <div>
              <div className="text-xs text-slate-400 uppercase tracking-wider mb-1">Rating</div>
              <div className="flex items-center gap-2">
                <div className={`px-2.5 py-0.5 rounded-full text-sm font-semibold ${
                  rating >= 8 ? 'bg-green-500/20 text-green-400' :
                  rating >= 5 ? 'bg-yellow-500/20 text-yellow-400' :
                  rating > 0 ? 'bg-red-500/20 text-red-400' :
                  'bg-slate-700 text-slate-400'
                }`}>
                  ★ {rating > 0 ? rating.toFixed(1) : "New"}
                </div>
                <span className="text-xs text-slate-400">({road.rating_count})</span>
              </div>
            </div>

            <div>
              <div className="text-xs text-slate-400 uppercase tracking-wider mb-1">Distance</div>
              <div className="text-lg font-bold text-white">{length.toFixed(1)} km</div>
            </div>

            <div>
              <div className="text-xs text-slate-400 uppercase tracking-wider mb-1">Saves</div>
              <div className="text-lg font-bold text-white">{road.save_count || 0}</div>
            </div>
          </div>

          {/* Tags */}
          {road.tags && road.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {road.tags.map(tag => (
                <Badge key={tag} variant="secondary" className="bg-slate-700 text-slate-200">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Map & Circuit Preview */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <span>Route Visualizer</span>
                <span className="text-slate-500">•</span>
                <span className="text-slate-400 font-normal">{previewMode === "circuit" ? "Circuit Minimap Graphic" : "Interactive Map"}</span>
              </h2>

              <div className="flex items-center gap-2">
                <div className="flex items-center bg-slate-900/90 p-1 rounded-lg border border-slate-700 text-xs">
                  <button
                    type="button"
                    onClick={() => setPreviewMode("circuit")}
                    className={`px-3 py-1 rounded-md font-medium transition-all ${
                      previewMode === "circuit"
                        ? "bg-emerald-500 text-white shadow-sm"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Circuit Graphic
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewMode("map")}
                    className={`px-3 py-1 rounded-md font-medium transition-all ${
                      previewMode === "map"
                        ? "bg-emerald-500 text-white shadow-sm"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Geographic Map
                  </button>
                </div>
              </div>
            </div>

            {previewMode === "circuit" ? (
              <TrackCircuitMinimap
                coordinates={road.geometry?.coordinates || []}
                name={road.name}
                lengthKm={length}
                height={320}
                showStats={true}
                allowDownload={true}
                theme={rating >= 8 ? "neon-green" : rating >= 5 ? "electric-amber" : "cyber-cyan"}
                className="w-full"
              />
            ) : (
              <div ref={mapRef} className="w-full h-80 rounded-xl overflow-hidden border border-slate-700 bg-slate-950" />
            )}
          </div>

          {/* Navigation Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <Button
              onClick={openInGoogleMaps}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-medium py-3"
            >
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0121 18.382V7.618a1 1 0 00-.553-.894L15 7m0 13V7" />
              </svg>
              Navigate with Google Maps
            </Button>

            <Button
              onClick={openInAppleMaps}
              variant="outline"
              className="w-full border-slate-700 hover:bg-slate-700 text-white font-medium py-3"
            >
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              Navigate with Apple Maps
            </Button>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-6 sm:p-8 shadow-xl">
          <ReviewsList
            roadId={road.id}
            reviews={reviews}
            onReviewsChange={handleReviewsChange}
          />
        </div>
      </div>
    </div>
  );
}
