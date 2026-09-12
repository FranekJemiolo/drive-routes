"use client";

import { Road } from "../types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Badge } from "./ui/badge";
import { useEffect, useRef, useState } from "react";
import { isAuthenticated, getUser } from "../lib/auth";
import { fetchSavedRouteIds, toggleSaveRoute } from "../lib/api";
import RoadDetailModal from "./RoadDetailModal";
import { TrackCircuitMinimap } from "./TrackCircuitMinimap";

type Props = {
  road: Road;
};

export default function RoadCard({ road }: Props) {
  const rating = Number(road.rating_avg);
  const length = Number(road.length_km);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [L, setL] = useState<any>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [viewMode, setViewMode] = useState<"circuit" | "map">("circuit");

  useEffect(() => {
    setAuthenticated(isAuthenticated());
    if (isAuthenticated()) {
      const user = getUser();
      if (user) {
        fetchSavedRouteIds(user.id).then(savedIds => {
          setIsSaved(savedIds.includes(road.id));
        }).catch(() => {});
      }
    }
  }, [road.id]);

  const handleSaveToggle = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    if (!authenticated) return;
    
    try {
      const newStatus = await toggleSaveRoute(road.id, isSaved);
      setIsSaved(newStatus);
    } catch (err) {
      console.error("Failed to toggle save route:", err);
    }
  };

  useEffect(() => {
    if (viewMode === "map" && !L) {
      import("leaflet").then((leaflet) => {
        setL(leaflet.default);
      });
      import("leaflet/dist/leaflet.css");
    }
  }, [viewMode, L]);

  useEffect(() => {
    if (viewMode !== "map" || !mapRef.current || !L) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    // Initialize map
    const map = L.map(mapRef.current, {
      center: [0, 0],
      zoom: 2,
      zoomControl: false,
      attributionControl: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      boxZoom: false,
      keyboard: false,
    });

    mapInstanceRef.current = map;

    // Use dark tiles for consistent dark theme
    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      attribution: "© CARTO",
    }).addTo(map);

    // Draw road geometry
    if (road.geometry && road.geometry.coordinates) {
      const coords: [number, number][] = road.geometry.coordinates.map((coord: number[]) => [coord[1], coord[0]]);
      
      const routeColor = road.rating_count === 0 
        ? "#38bdf8" 
        : rating >= 8 
        ? "#22c55e" 
        : rating >= 5 
        ? "#f59e0b" 
        : "#ef4444";

      const polyline = L.polyline(coords, {
        color: routeColor,
        weight: 3.5,
        opacity: 0.9,
      }).addTo(map);

      // Fit map to road bounds
      map.fitBounds(polyline.getBounds(), { padding: [15, 15] });
    }

    setTimeout(() => {
      map.invalidateSize();
    }, 120);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [viewMode, road.geometry, rating, road.rating_count, L]);

  const coordinates = road.geometry?.coordinates || [];

  return (
    <>
      <Card 
        className="bg-slate-900/70 border-slate-800 hover:border-slate-700 hover:bg-slate-900/95 transition-all duration-200 cursor-pointer shadow-lg hover:shadow-xl group flex flex-col justify-between overflow-hidden"
        onClick={() => setShowDetail(true)}
      >
        <div>
          <CardHeader className="p-5 pb-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <CardTitle className="text-white text-lg font-bold group-hover:text-emerald-400 transition-colors truncate">
                  {road.name}
                </CardTitle>
                <CardDescription className="text-slate-400 text-xs mt-0.5 truncate">
                  {road.countries && road.countries.length > 0 ? road.countries.join(", ") : "Unknown"} {road.region ? `• ${road.region}` : ''}
                </CardDescription>
              </div>

              {/* View Switcher: Circuit Minimap vs Map */}
              <div 
                className="flex items-center bg-slate-950/80 p-0.5 rounded-lg border border-slate-800 flex-shrink-0"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={() => setViewMode("circuit")}
                  title="Circuit Minimap View"
                  className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-all ${
                    viewMode === "circuit" 
                      ? "bg-emerald-500 text-white shadow-sm" 
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Circuit
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("map")}
                  title="Map View"
                  className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-all ${
                    viewMode === "map" 
                      ? "bg-emerald-500 text-white shadow-sm" 
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Map
                </button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-5 pt-0 space-y-4">
            {/* Visual Route Preview: Circuit Minimap or Map */}
            <div className="w-full h-36 rounded-xl overflow-hidden relative">
              {viewMode === "circuit" ? (
                <TrackCircuitMinimap
                  coordinates={coordinates}
                  name={road.name}
                  lengthKm={length}
                  height={144}
                  showStats={false}
                  allowDownload={false}
                  theme={rating >= 8 ? "neon-green" : rating >= 5 ? "electric-amber" : "cyber-cyan"}
                  className="w-full h-full"
                />
              ) : (
                <div ref={mapRef} className="w-full h-full bg-slate-950 rounded-xl" />
              )}
            </div>

            {/* Rating and stats */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2">
                <div className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  rating >= 8 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                  rating >= 5 ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                  rating > 0 ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                  'bg-slate-800 text-slate-400 border border-slate-700'
                }`}>
                  ★ {rating > 0 ? rating.toFixed(1) : "New"}
                </div>
                <span className="text-slate-500 text-xs">
                  {road.rating_count} {road.rating_count === 1 ? 'review' : 'reviews'}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-slate-300 font-medium text-xs">
                  {length > 0 ? `${length.toFixed(1)} km` : ""}
                </span>
                {authenticated && (
                  <button
                    onClick={handleSaveToggle}
                    className={`p-1.5 rounded-full transition-all ${
                      isSaved 
                        ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' 
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                    }`}
                    title={isSaved ? "Remove from saved" : "Save route"}
                  >
                    <svg className="w-4 h-4" fill={isSaved ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* Tags */}
            {road.tags && road.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {road.tags.slice(0, 3).map(tag => (
                  <Badge key={tag} variant="secondary" className="bg-slate-800 text-slate-300 text-[11px] font-normal px-2 py-0.5 border border-slate-700/50">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </div>
      </Card>

      <RoadDetailModal roadId={showDetail ? road.id : null} onClose={() => setShowDetail(false)} />
    </>
  );
}
