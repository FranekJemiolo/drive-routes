"use client";

import { Road } from "../types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Badge } from "./ui/badge";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated, getUser } from "../lib/auth";
import { isRouteSaved, saveRoute, unsaveRoute } from "../lib/browser-storage";

type Props = {
  road: Road;
};

export default function RoadCard({ road }: Props) {
  const router = useRouter();
  const rating = Number(road.rating_avg);
  const length = Number(road.length_km);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [L, setL] = useState<any>(null);
  const [leafletCss, setLeafletCss] = useState<any>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    setAuthenticated(isAuthenticated());
    if (isAuthenticated()) {
      const user = getUser();
      if (user) {
        setIsSaved(isRouteSaved(user.id, road.id));
      }
    }
  }, [road.id]);

  const handleSaveToggle = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    if (!authenticated) return;
    
    const user = getUser();
    if (!user) return;

    if (isSaved) {
      unsaveRoute(user.id, road.id);
      setIsSaved(false);
    } else {
      saveRoute(user.id, road.id);
      setIsSaved(true);
    }
  };

  useEffect(() => {
    // Dynamic import Leaflet only on client side
    import("leaflet").then((leaflet) => {
      setL(leaflet.default);
    });
    import("leaflet/dist/leaflet.css").then(() => {
      setLeafletCss(true);
    });
  }, []);

  useEffect(() => {
    if (!mapRef.current || !L) return;

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

    // Add OpenStreetMap tiles
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap",
    }).addTo(map);

    // Draw road geometry
    if (road.geometry && road.geometry.coordinates) {
      const coords: [number, number][] = road.geometry.coordinates.map((coord: number[]) => [coord[1], coord[0]]);
      
      const polyline = L.polyline(coords, {
        color: "#ef4444",
        weight: 3,
        opacity: 0.8,
      }).addTo(map);

      // Fit map to road bounds
      map.fitBounds(polyline.getBounds(), { padding: [20, 20] });
    }

    // Invalidate map size to ensure proper rendering
    setTimeout(() => {
      map.invalidateSize();
    }, 100);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [road.geometry, L]);

  return (
    <Card 
      className="bg-slate-800/50 border-slate-700 hover:bg-slate-800 transition-colors cursor-pointer"
      onClick={() => router.push(`/roads/${road.id}`)}
    >
      <CardHeader>
        <CardTitle className="text-white text-lg">{road.name}</CardTitle>
        <CardDescription className="text-slate-400">
          {road.countries && road.countries.length > 0 ? road.countries.join(", ") : "Unknown"} • {road.region}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Miniature map */}
        <div ref={mapRef} className="w-full h-32 bg-slate-700 rounded-lg" />

        {/* Rating and stats */}
        <div className="flex items-center justify-between">
          <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
            rating >= 8 ? 'bg-green-500/20 text-green-400' :
            rating >= 5 ? 'bg-yellow-500/20 text-yellow-400' :
            'bg-red-500/20 text-red-400'
          }`}>
            ★ {rating.toFixed(1)}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-slate-400 text-sm">{length.toFixed(1)} km</span>
            {authenticated && (
              <button
                onClick={handleSaveToggle}
                className={`p-2 rounded-full transition-colors ${
                  isSaved 
                    ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' 
                    : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                }`}
                title={isSaved ? "Remove from saved" : "Save route"}
              >
                <svg className="w-5 h-5" fill={isSaved ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Tags */}
        {road.tags && road.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {road.tags.slice(0, 3).map(tag => (
              <Badge key={tag} variant="secondary" className="bg-slate-700 text-slate-200 text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
