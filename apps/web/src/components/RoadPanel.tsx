"use client";

import { Road } from "../types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";

type Props = {
  road: Road;
  onClose: () => void;
};

export default function RoadPanel({ road, onClose }: Props) {
  function openInGoogleMaps() {
    const coords = road.geometry.coordinates;
    const start = coords[0];
    const end = coords[coords.length - 1];
    
    // Google Maps supports up to 8 waypoints (excluding origin and destination)
    // We'll sample points along the route to create waypoints
    const maxWaypoints = 8;
    const totalPoints = coords.length;
    
    let url = `https://www.google.com/maps/dir/?api=1&origin=${start[1]},${start[0]}&destination=${end[1]},${end[0]}`;
    
    // Add waypoints if route has enough points
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
    const coords = road.geometry.coordinates;
    const start = coords[0];
    const end = coords[coords.length - 1];
    
    // Apple Maps supports up to 3 waypoints (excluding origin and destination)
    const maxWaypoints = 3;
    const totalPoints = coords.length;
    
    let url = `http://maps.apple.com/?saddr=${start[1]},${start[0]}&daddr=${end[1]},${end[0]}`;
    
    // Add waypoints if route has enough points
    if (totalPoints > 2) {
      const step = Math.floor((totalPoints - 2) / Math.min(maxWaypoints, totalPoints - 2));
      const waypoints: string[] = [];
      
      for (let i = 1; i < totalPoints - 1; i += step) {
        if (waypoints.length >= maxWaypoints) break;
        const point = coords[i];
        waypoints.push(`${point[1]},${point[0]}`);
      }
      
      if (waypoints.length > 0) {
        url += `&dirflg=d&${waypoints.map((wp, idx) => `dirflg=d&${idx === 0 ? 'daddr' : 'to'}=${wp}`).join('&')}`;
      }
    }
    
    window.open(url, "_blank");
  }

  const rating = Number(road.rating_avg);
  const length = Number(road.length_km);

  return (
    <div className="absolute right-4 top-20 w-96 z-10">
      <Card className="bg-slate-900/95 backdrop-blur-md border-slate-800 text-white shadow-2xl">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <CardTitle className="text-xl font-bold text-white mb-1">{road.name}</CardTitle>
              <CardDescription className="text-slate-400">
                {road.country} • {road.region}
              </CardDescription>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors p-1 hover:bg-slate-800 rounded"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Rating Badge */}
          <div className="flex items-center space-x-2">
            <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
              rating >= 8 ? 'bg-green-500/20 text-green-400' :
              rating >= 5 ? 'bg-yellow-500/20 text-yellow-400' :
              'bg-red-500/20 text-red-400'
            }`}>
              ★ {rating.toFixed(1)}
            </div>
            <span className="text-slate-400 text-sm">{road.rating_count} reviews</span>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-800/50 rounded-lg p-3">
              <div className="text-xs text-slate-400 mb-1">Length</div>
              <div className="text-lg font-semibold">{length.toFixed(1)} km</div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-3">
              <div className="text-xs text-slate-400 mb-1">Saves</div>
              <div className="text-lg font-semibold">{road.save_count}</div>
            </div>
          </div>

          {/* Tags */}
          {road.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {road.tags.map(tag => (
                <Badge key={tag} variant="secondary" className="bg-slate-800 text-slate-200 hover:bg-slate-700">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Description */}
          {road.description && (
            <p className="text-sm text-slate-300 leading-relaxed">{road.description}</p>
          )}

          {/* Navigation Buttons */}
          <div className="space-y-2 pt-2">
            <Button
              onClick={openInGoogleMaps}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
            >
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0121 18.382V7.618a1 1 0 00-.553-.894L15 7m0 13V7" />
              </svg>
              Navigate with Google Maps
            </Button>

            <Button
              onClick={openInAppleMaps}
              variant="outline"
              className="w-full border-slate-700 hover:bg-slate-800 text-white"
            >
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              Navigate with Apple Maps
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
