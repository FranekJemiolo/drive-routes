"use client";

import { Road } from "../types";

type Props = {
  road: Road;
  onClose: () => void;
};

export default function RoadPanel({ road, onClose }: Props) {
  function openInGoogleMaps() {
    const coords = road.geometry.coordinates;
    const start = coords[0];
    const end = coords[coords.length - 1];
    
    const url = `https://www.google.com/maps/dir/?api=1&origin=${start[1]},${start[0]}&destination=${end[1]},${end[0]}`;
    window.open(url, "_blank");
  }

  function openInAppleMaps() {
    const coords = road.geometry.coordinates;
    const start = coords[0];
    const end = coords[coords.length - 1];
    
    const url = `http://maps.apple.com/?saddr=${start[1]},${start[0]}&daddr=${end[1]},${end[0]}`;
    window.open(url, "_blank");
  }

  return (
    <div className="absolute right-4 top-4 w-80 bg-black/90 text-white p-4 rounded-xl shadow-lg z-10">
      <div className="flex justify-between items-start mb-3">
        <h2 className="text-lg font-bold">{road.name}</h2>
        <button 
          onClick={onClose}
          className="text-gray-400 hover:text-white text-xl"
        >
          ×
        </button>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-400">Rating:</span>
          <span className="font-semibold">{road.rating_avg.toFixed(1)}</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-400">Length:</span>
          <span>{road.length_km.toFixed(1)} km</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-400">Reviews:</span>
          <span>{road.rating_count}</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-400">Saves:</span>
          <span>{road.save_count}</span>
        </div>
      </div>

      {road.tags.length > 0 && (
        <div className="mt-3">
          <div className="flex flex-wrap gap-1">
            {road.tags.map(tag => (
              <span key={tag} className="inline-block bg-gray-700 rounded px-2 py-1 text-xs">
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {road.description && (
        <p className="mt-3 text-sm text-gray-300">{road.description}</p>
      )}

      <div className="mt-4 space-y-2">
        <button
          onClick={openInGoogleMaps}
          className="w-full bg-green-500 hover:bg-green-600 text-black font-semibold py-2 px-4 rounded"
        >
          Navigate (Google Maps)
        </button>
        
        <button
          onClick={openInAppleMaps}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded"
        >
          Navigate (Apple Maps)
        </button>
      </div>
    </div>
  );
}
