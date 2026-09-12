"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
import "leaflet-draw";

type TileLayerType = "dark" | "satellite" | "streets" | "terrain";

interface MapDrawingProps {
  onGeometryChange: (geometry: { type: "LineString"; coordinates: [number, number][] }) => void;
  initialCoordinates?: [number, number][];
}

const TILE_LAYERS: Record<TileLayerType, { url: string; attribution: string }> = {
  dark: {
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
  },
  satellite: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: '&copy; Esri, Maxar, Earthstar Geographics',
  },
  terrain: {
    url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
    attribution: '&copy; OpenTopoMap contributors',
  },
  streets: {
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: '&copy; OpenStreetMap contributors',
  },
};

export default function MapDrawing({ onGeometryChange, initialCoordinates }: MapDrawingProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const drawnItemsRef = useRef<L.FeatureGroup | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const startMarkerRef = useRef<L.Marker | null>(null);
  const endMarkerRef = useRef<L.Marker | null>(null);
  const [activeLayer, setActiveLayer] = useState<TileLayerType>("dark");
  const [mounted, setMounted] = useState(false);
  const [hasPoints, setHasPoints] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const updateMarkers = useCallback((coords: [number, number][]) => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    // Remove old markers
    if (startMarkerRef.current) {
      startMarkerRef.current.remove();
      startMarkerRef.current = null;
    }
    if (endMarkerRef.current) {
      endMarkerRef.current.remove();
      endMarkerRef.current = null;
    }

    if (coords.length === 0) {
      setHasPoints(false);
      return;
    }

    setHasPoints(true);

    const startCoord = coords[0];
    const endCoord = coords[coords.length - 1];

    // Start marker icon
    const startIcon = L.divIcon({
      className: "custom-map-marker",
      html: `<div style="display:flex;align-items:center;justify-content:center;width:24px;height:24px;background:#10b981;border:2px solid #ffffff;border-radius:50%;box-shadow:0 0 10px #10b981;color:#ffffff;font-size:10px;font-weight:bold;">S</div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });

    // End marker icon
    const endIcon = L.divIcon({
      className: "custom-map-marker",
      html: `<div style="display:flex;align-items:center;justify-content:center;width:24px;height:24px;background:#ef4444;border:2px solid #ffffff;border-radius:50%;box-shadow:0 0 10px #ef4444;color:#ffffff;font-size:10px;font-weight:bold;">F</div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });

    startMarkerRef.current = L.marker([startCoord[1], startCoord[0]], { icon: startIcon }).addTo(map);

    if (coords.length > 1) {
      endMarkerRef.current = L.marker([endCoord[1], endCoord[0]], { icon: endIcon }).addTo(map);
    }
  }, []);

  // Initialize map
  useEffect(() => {
    if (!mounted || !mapRef.current || mapInstanceRef.current) return;

    // Default center
    const defaultCenter: [number, number] = [46.5, 10.5]; // Central Alps region for driving passes
    const map = L.map(mapRef.current, {
      zoomControl: false,
    }).setView(defaultCenter, 6);

    L.control.zoom({ position: "topright" }).addTo(map);

    // Initial tile layer
    const tileLayer = L.tileLayer(TILE_LAYERS.dark.url, {
      attribution: TILE_LAYERS.dark.attribution,
      maxZoom: 19,
    }).addTo(map);
    tileLayerRef.current = tileLayer;

    // FeatureGroup to store drawn layers
    const drawnItems = new L.FeatureGroup();
    map.addLayer(drawnItems);
    drawnItemsRef.current = drawnItems;

    // Drawing control
    const drawControl = new L.Control.Draw({
      position: "topleft",
      draw: {
        polygon: false,
        marker: false,
        circle: false,
        circlemarker: false,
        rectangle: false,
        polyline: {
          shapeOptions: {
            color: "#10b981",
            weight: 5,
            opacity: 0.95,
          },
        },
      },
      edit: {
        featureGroup: drawnItems,
        remove: true,
      },
    });
    map.addControl(drawControl);

    // Event handlers
    map.on(L.Draw.Event.CREATED, (event: any) => {
      drawnItems.clearLayers();
      const layer = event.layer;
      drawnItems.addLayer(layer);

      const geoJSON = layer.toGeoJSON();
      if (geoJSON.geometry && geoJSON.geometry.type === "LineString") {
        const coordinates = geoJSON.geometry.coordinates.map((coord: any) => [coord[0], coord[1]] as [number, number]);
        onGeometryChange({
          type: "LineString",
          coordinates,
        });
        updateMarkers(coordinates);
      }
    });

    map.on(L.Draw.Event.EDITED, (event: any) => {
      const layers = event.layers;
      layers.eachLayer((layer: any) => {
        const geoJSON = layer.toGeoJSON();
        if (geoJSON.geometry && geoJSON.geometry.type === "LineString") {
          const coordinates = geoJSON.geometry.coordinates.map((coord: any) => [coord[0], coord[1]] as [number, number]);
          onGeometryChange({
            type: "LineString",
            coordinates,
          });
          updateMarkers(coordinates);
        }
      });
    });

    map.on(L.Draw.Event.DELETED, () => {
      onGeometryChange({
        type: "LineString",
        coordinates: [],
      });
      updateMarkers([]);
    });

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [mounted, onGeometryChange, updateMarkers]);

  // Load initialCoordinates if provided (e.g. from GPX file)
  useEffect(() => {
    if (!mapInstanceRef.current || !drawnItemsRef.current || !initialCoordinates || initialCoordinates.length === 0) {
      return;
    }

    const drawnItems = drawnItemsRef.current;
    drawnItems.clearLayers();

    const latLngs: [number, number][] = initialCoordinates.map(([lng, lat]) => [lat, lng]);
    const polyline = L.polyline(latLngs, {
      color: "#10b981",
      weight: 5,
      opacity: 0.95,
    });

    drawnItems.addLayer(polyline);
    updateMarkers(initialCoordinates);

    mapInstanceRef.current.fitBounds(polyline.getBounds(), { padding: [40, 40] });
  }, [initialCoordinates, updateMarkers]);

  // Handle tile layer change
  const handleLayerChange = (layerKey: TileLayerType) => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return;
    setActiveLayer(layerKey);

    mapInstanceRef.current.removeLayer(tileLayerRef.current);
    const newLayer = L.tileLayer(TILE_LAYERS[layerKey].url, {
      attribution: TILE_LAYERS[layerKey].attribution,
      maxZoom: 19,
    });
    newLayer.addTo(mapInstanceRef.current);
    tileLayerRef.current = newLayer;
  };

  const handleFitBounds = () => {
    if (!mapInstanceRef.current || !drawnItemsRef.current) return;
    const layers = drawnItemsRef.current.getLayers();
    if (layers.length > 0) {
      const bounds = drawnItemsRef.current.getBounds();
      if (bounds.isValid()) {
        mapInstanceRef.current.fitBounds(bounds, { padding: [40, 40] });
      }
    }
  };

  const handleClear = () => {
    if (!drawnItemsRef.current) return;
    drawnItemsRef.current.clearLayers();
    updateMarkers([]);
    onGeometryChange({
      type: "LineString",
      coordinates: [],
    });
  };

  if (!mounted) {
    return (
      <div className="w-full h-96 rounded-xl overflow-hidden border border-slate-700 flex items-center justify-center bg-slate-900">
        <div className="text-slate-400">Loading map editor...</div>
      </div>
    );
  }

  return (
    <div className="relative w-full rounded-xl overflow-hidden border border-slate-700/80 shadow-2xl group">
      {/* Map Canvas */}
      <div ref={mapRef} className="w-full h-[400px] bg-slate-950" />

      {/* Top Map Action Toolbar */}
      <div className="absolute top-3 right-12 z-[1000] flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md p-1 rounded-lg border border-slate-700/80 shadow-lg">
        <button
          type="button"
          onClick={() => handleLayerChange("dark")}
          className={`px-2.5 py-1 text-xs font-medium rounded transition-all ${
            activeLayer === "dark" ? "bg-emerald-500 text-white shadow-sm" : "text-slate-300 hover:text-white"
          }`}
        >
          Dark
        </button>
        <button
          type="button"
          onClick={() => handleLayerChange("satellite")}
          className={`px-2.5 py-1 text-xs font-medium rounded transition-all ${
            activeLayer === "satellite" ? "bg-emerald-500 text-white shadow-sm" : "text-slate-300 hover:text-white"
          }`}
        >
          Satellite
        </button>
        <button
          type="button"
          onClick={() => handleLayerChange("terrain")}
          className={`px-2.5 py-1 text-xs font-medium rounded transition-all ${
            activeLayer === "terrain" ? "bg-emerald-500 text-white shadow-sm" : "text-slate-300 hover:text-white"
          }`}
        >
          Terrain
        </button>
        <button
          type="button"
          onClick={() => handleLayerChange("streets")}
          className={`px-2.5 py-1 text-xs font-medium rounded transition-all ${
            activeLayer === "streets" ? "bg-emerald-500 text-white shadow-sm" : "text-slate-300 hover:text-white"
          }`}
        >
          Street
        </button>
      </div>

      {/* Bottom Floating Controls */}
      <div className="absolute bottom-3 left-3 right-3 z-[1000] flex items-center justify-between pointer-events-none">
        <div className="pointer-events-auto bg-slate-900/90 backdrop-blur-md border border-slate-700/80 px-3 py-1.5 rounded-lg text-xs text-slate-300 shadow-md">
          {hasPoints ? (
            <span className="text-emerald-400 font-medium">✓ Click edit tool in top-left to adjust nodes</span>
          ) : (
            <span>Use the <strong>Polyline tool</strong> in the top-left to draw points</span>
          )}
        </div>

        {hasPoints && (
          <div className="pointer-events-auto flex items-center gap-2">
            <button
              type="button"
              onClick={handleFitBounds}
              className="px-2.5 py-1.5 bg-slate-800/90 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg text-xs font-medium border border-slate-700 shadow-md transition-colors"
            >
              Fit Track
            </button>
            <button
              type="button"
              onClick={handleClear}
              className="px-2.5 py-1.5 bg-red-950/80 hover:bg-red-900/90 text-red-300 hover:text-red-100 rounded-lg text-xs font-medium border border-red-800/50 shadow-md transition-colors"
            >
              Reset Track
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
