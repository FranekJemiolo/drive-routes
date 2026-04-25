"use client";

import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useState, useRef } from "react";
import { Road } from "../../types";
import { fetchRoadsInBBox } from "../../lib/api";

type Props = {
  onSelectRoad?: (road: Road) => void;
};

export default function LeafletMap({ onSelectRoad }: Props) {
  const [roads, setRoads] = useState<Road[]>([]);
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [isClient, setIsClient] = useState(false);
  const layersRef = useRef<L.Polyline[]>([]);

  // Initialize map
  useEffect(() => {
    setIsClient(true);

    if (!mapContainerRef.current || mapRef.current) return;

    try {
      // Create map
      const map = L.map(mapContainerRef.current, {
        center: [37.7749, -122.4194],
        zoom: 4,
        zoomControl: false, // Disable default zoom control
      });

      // Add custom zoom control in top-right corner
      L.control.zoom({
        position: 'topright'
      }).addTo(map);

      // Set z-index to ensure navbar stays on top
      const mapContainer = mapContainerRef.current;
      if (mapContainer) {
        mapContainer.style.zIndex = '0';
      }

      // Add tile layer
      const tileLayer = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
      });

      tileLayer.addTo(map);

      // Invalidate size to ensure proper rendering
      setTimeout(() => {
        map.invalidateSize();
      }, 100);

      // Handle move end to load roads
      map.on("moveend", async () => {
        const bounds = map.getBounds();
        const bbox = [
          bounds.getWest(),
          bounds.getSouth(),
          bounds.getEast(),
          bounds.getNorth(),
        ];
        const data = await fetchRoadsInBBox(bbox);
        setRoads(data);
      });

      mapRef.current = map;

    } catch (error) {
      console.error("Error initializing map:", error);
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [isClient]);

  // Load initial roads
  useEffect(() => {
    async function init() {
      const res = await fetchRoadsInBBox(null);
      setRoads(res);
    }
    init();
  }, []);

  // Update map when roads change
  useEffect(() => {
    if (!mapRef.current) return;

    // Remove existing layers
    layersRef.current.forEach(layer => layer.remove());
    layersRef.current = [];

    // Add new layers
    roads.forEach((road) => {
      if (!mapRef.current) return;
      
      const coordinates = road.geometry.coordinates.map(([lng, lat]) => [lat, lng] as [number, number]);
      const polyline = L.polyline(coordinates, {
        color: "#ef4444",
        weight: 4,
        opacity: 0.9,
      }).addTo(mapRef.current);

      // Add click handler
      polyline.on("click", () => onSelectRoad?.(road));

      // Add popup
      const popup = L.popup()
        .setLatLng(coordinates[0])
        .setContent(`
          <div style="color: #1e293b;">
            <div style="font-weight: bold; font-size: 1.125rem; margin-bottom: 0.25rem;">${road.name}</div>
            <div style="font-size: 0.875rem; color: #475569; margin-bottom: 0.5rem;">★ ${Number(road.rating_avg).toFixed(1)}</div>
            <div style="display: flex; flex-wrap: wrap; gap: 0.25rem;">
              ${road.tags.map(tag => `<span style="display: inline-block; background: #e2e8f0; color: #334155; padding: 0.25rem 0.5rem; border-radius: 0.25rem; font-size: 0.75rem; font-weight: 500;">${tag}</span>`).join('')}
            </div>
          </div>
        `);

      polyline.bindPopup(popup);
      layersRef.current.push(polyline);
    });
  }, [roads, onSelectRoad]);

  return (
    <div className="w-full relative" style={{ height: "100vh", paddingTop: "64px", zIndex: 0 }}>
      {/* Debug info */}
      <div className="absolute bottom-4 left-4 z-10 bg-slate-900/90 backdrop-blur-md border border-slate-800 px-4 py-2 rounded-lg text-white text-sm shadow-lg">
        <span className="text-slate-400">Roads loaded:</span> <span className="font-semibold text-green-400">{roads.length}</span>
      </div>

      {isClient ? (
        <div ref={mapContainerRef} className="h-full w-full" style={{ minHeight: "calc(100vh - 64px)", zIndex: 0 }} />
      ) : (
        <div className="h-full w-full flex items-center justify-center text-white">
          Loading map...
        </div>
      )}
    </div>
  );
}

function getRoadColor(rating: number | string) {
  const numRating = parseFloat(String(rating));
  if (numRating >= 8) return "#22c55e"; // green
  if (numRating >= 5) return "#f59e0b"; // orange
  return "#ef4444"; // red
}
