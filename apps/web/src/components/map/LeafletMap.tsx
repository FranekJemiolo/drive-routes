"use client";

import { MapContainer, TileLayer, Polyline, useMapEvents, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useState } from "react";
import { Road } from "../../types";
import { fetchRoadsInBBox } from "../../lib/api";

type Props = {
  onSelectRoad?: (road: Road) => void;
};

export default function LeafletMap({ onSelectRoad }: Props) {
  const [roads, setRoads] = useState<Road[]>([]);

  // Load roads by viewport
  function MapEvents() {
    const map = useMapEvents({
      moveend: async () => {
        const bounds = map.getBounds();
        const bbox = [
          bounds.getWest(),
          bounds.getSouth(),
          bounds.getEast(),
          bounds.getNorth(),
        ];
        const data = await fetchRoadsInBBox(bbox);
        setRoads(data);
      },
    });
    return null;
  }

  // Initial load
  useEffect(() => {
    async function init() {
      const res = await fetchRoadsInBBox(null);
      setRoads(res);
    }
    init();
  }, []);

  return (
    <div className="w-full h-screen">
      <MapContainer
        center={[52.2297, 21.0122]}
        zoom={10}
        className="h-full w-full"
      >
        {/* OpenStreetMap BASE LAYER (FREE) */}
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* viewport listener */}
        <MapEvents />

        {/* ROAD RENDERING */}
        {roads.map((road) => (
          <Polyline
            key={road.id}
            positions={road.geometry.coordinates.map(([lng, lat]) => [
              lat,
              lng,
            ])}
            pathOptions={{
              color: getRoadColor(road.rating_avg),
              weight: 4,
              opacity: 0.85,
            }}
            eventHandlers={{
              click: () => onSelectRoad?.(road),
            }}
          >
            <Popup>
              <div>
                <strong>{road.name}</strong>
                <br />
                Rating: {road.rating_avg}
                <br />
                {road.tags.map(tag => (
                  <span key={tag} className="inline-block bg-gray-200 rounded px-2 py-1 text-xs mr-1">
                    {tag}
                  </span>
                ))}
              </div>
            </Popup>
          </Polyline>
        ))}
      </MapContainer>
    </div>
  );
}

function getRoadColor(rating: number) {
  if (rating >= 8) return "#22c55e"; // green
  if (rating >= 5) return "#f59e0b"; // orange
  return "#ef4444"; // red
}
