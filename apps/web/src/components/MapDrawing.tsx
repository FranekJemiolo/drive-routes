"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
import "leaflet-draw";

interface MapDrawingProps {
  onGeometryChange: (geometry: { type: "LineString"; coordinates: [number, number][] }) => void;
}

export default function MapDrawing({ onGeometryChange }: MapDrawingProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const drawnItemsRef = useRef<L.FeatureGroup | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !mapRef.current || mapInstanceRef.current) return;

    // Initialize map
    const map = L.map(mapRef.current).setView([48.8566, 2.3522], 5); // Center on Europe

    // Add OpenStreetMap tiles
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    // Initialize the FeatureGroup to store editable layers
    const drawnItems = new L.FeatureGroup();
    map.addLayer(drawnItems);
    drawnItemsRef.current = drawnItems;

    // Initialize the draw control
    const drawControl = new L.Control.Draw({
      draw: {
        polygon: false,
        marker: false,
        circle: false,
        circlemarker: false,
        polyline: {
          shapeOptions: {
            color: "#10b981",
            weight: 4,
          },
        },
        rectangle: false,
      },
      edit: {
        featureGroup: drawnItems,
        remove: true,
      },
    });
    map.addControl(drawControl);

    // Handle draw created event
    map.on(L.Draw.Event.CREATED, (event: any) => {
      const layer = event.layer;
      drawnItems.addLayer(layer);

      // Convert to GeoJSON
      const geoJSON = layer.toGeoJSON();
      if (geoJSON.geometry && geoJSON.geometry.type === "LineString") {
        const coordinates = geoJSON.geometry.coordinates.map((coord: any) => 
          [coord[0], coord[1]] as [number, number]
        );
        onGeometryChange({
          type: "LineString",
          coordinates,
        });
      }
    });

    // Handle draw edited event
    map.on(L.Draw.Event.EDITED, (event: any) => {
      const layers = event.layers;
      layers.eachLayer((layer: any) => {
        const geoJSON = layer.toGeoJSON();
        if (geoJSON.geometry && geoJSON.geometry.type === "LineString") {
          const coordinates = geoJSON.geometry.coordinates.map((coord: any) => 
            [coord[0], coord[1]] as [number, number]
          );
          onGeometryChange({
            type: "LineString",
            coordinates,
          });
        }
      });
    });

    // Handle draw deleted event
    map.on(L.Draw.Event.DELETED, () => {
      onGeometryChange({
        type: "LineString",
        coordinates: [],
      });
    });

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [mounted, onGeometryChange]);

  if (!mounted) {
    return (
      <div className="w-full h-96 rounded-lg overflow-hidden border border-slate-700 flex items-center justify-center bg-slate-800">
        <div className="text-slate-400">Loading map...</div>
      </div>
    );
  }

  return (
    <div className="w-full h-96 rounded-lg overflow-hidden border border-slate-700">
      <div ref={mapRef} className="w-full h-full" />
    </div>
  );
}
