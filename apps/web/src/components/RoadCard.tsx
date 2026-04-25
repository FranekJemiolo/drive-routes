"use client";

import { Road } from "../types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Badge } from "./ui/badge";
import { useEffect, useRef } from "react";
import L from "leaflet";

type Props = {
  road: Road;
};

export default function RoadCard({ road }: Props) {
  const rating = Number(road.rating_avg);
  const length = Number(road.length_km);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;

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
        color: "#22c55e",
        weight: 3,
        opacity: 0.8,
      }).addTo(map);

      // Fit map to road bounds
      map.fitBounds(polyline.getBounds(), { padding: [20, 20] });
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [road.geometry]);

  return (
    <Card className="bg-slate-800/50 border-slate-700 hover:bg-slate-800 transition-colors cursor-pointer">
      <CardHeader>
        <CardTitle className="text-white text-lg">{road.name}</CardTitle>
        <CardDescription className="text-slate-400">
          {road.country} • {road.region}
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
          <span className="text-slate-400 text-sm">{length.toFixed(1)} km</span>
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
