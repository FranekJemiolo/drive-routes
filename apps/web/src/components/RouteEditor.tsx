"use client";

import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { createPortal } from "react-dom";
import { createRoad, parseGPXString } from "../lib/api";
import { getUser } from "../lib/auth";
import dynamic from "next/dynamic";

const MapDrawing = dynamic(() => import("./MapDrawing"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-96 rounded-lg overflow-hidden border border-slate-700 flex items-center justify-center bg-slate-800">
      <div className="text-slate-400">Loading map...</div>
    </div>
  ),
});

interface RouteEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onRouteCreated?: () => void;
}

export function RouteEditor({ isOpen, onClose, onRouteCreated }: RouteEditorProps) {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [creationMethod, setCreationMethod] = useState<'draw' | 'gpx'>('draw');
  const [gpxFileName, setGpxFileName] = useState("");
  const [gpxParsedStats, setGpxParsedStats] = useState<{ points: number; lengthKm: number } | null>(null);
  
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [country, setCountry] = useState("");
  const [region, setRegion] = useState("");
  const [geometry, setGeometry] = useState<{ type: "LineString"; coordinates: [number, number][] } | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Calculate distance between two coordinates in km using Haversine formula
  const calculateDistance = (coord1: [number, number], coord2: [number, number]): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (coord2[1] - coord1[1]) * Math.PI / 180;
    const dLon = (coord2[0] - coord1[0]) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(coord1[1] * Math.PI / 180) * Math.cos(coord2[1] * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Calculate total length from geometry
  const calculateLength = (coords: [number, number][]): number => {
    if (coords.length < 2) return 0;
    let totalLength = 0;
    for (let i = 0; i < coords.length - 1; i++) {
      totalLength += calculateDistance(coords[i], coords[i + 1]);
    }
    return totalLength;
  };

  const handleGPXFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError("");
    setGpxFileName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = parseGPXString(text);

        if (!parsed.coordinates || parsed.coordinates.length < 2) {
          setError("GPX file does not contain valid track points (<trkpt> or <rtept>).");
          return;
        }

        setGeometry({
          type: "LineString",
          coordinates: parsed.coordinates
        });
        setGpxParsedStats({
          points: parsed.coordinates.length,
          lengthKm: parsed.lengthKm
        });

        // Auto-fill name if empty
        if (!name && parsed.name) {
          setName(parsed.name);
        } else if (!name) {
          setName(file.name.replace(/\.[^/.]+$/, ""));
        }

        // Add gpx-import tag if not present
        if (!tags) {
          setTags("gpx-import");
        } else if (!tags.includes("gpx-import")) {
          setTags(`${tags}, gpx-import`);
        }
      } catch (err: any) {
        console.error("Failed to parse GPX:", err);
        setError("Failed to parse GPX file. Please ensure it is a valid GPX document.");
      }
    };
    reader.readAsText(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!geometry || geometry.coordinates.length === 0) {
      setError(creationMethod === 'draw' ? "Please draw a route on the map" : "Please select a valid GPX file");
      setLoading(false);
      return;
    }

    try {
      // Parse tags from comma-separated string
      const tagsArray = tags.split(',').map(t => t.trim()).filter(t => t.length > 0);
      
      // Calculate length from geometry
      const lengthKm = calculateLength(geometry.coordinates);
      
      const user = getUser();
      
      await createRoad({
        name,
        description,
        geometry,
        length_km: lengthKm,
        tags: tagsArray,
        countries: country ? [country] : [],
        region
      }, user?.id);

      // Reset form
      setName("");
      setDescription("");
      setTags("");
      setCountry("");
      setRegion("");
      setGeometry(null);
      setGpxFileName("");
      setGpxParsedStats(null);

      onClose();
      if (onRouteCreated) {
        onRouteCreated();
      }
    } catch (err: any) {
      setError(err.message || "Failed to create route");
    } finally {
      setLoading(false);
    }
  };

  if (!mounted || !isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto relative z-[10000]">
        <h2 className="text-xl font-bold text-white mb-4">Add New Route</h2>
        
        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Method Switcher Tabs */}
        <div className="flex gap-2 p-1 bg-slate-800/80 rounded-lg mb-4 border border-slate-700">
          <button
            type="button"
            onClick={() => setCreationMethod('draw')}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${
              creationMethod === 'draw'
                ? 'bg-green-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            ✏️ Draw on Map
          </button>
          <button
            type="button"
            onClick={() => setCreationMethod('gpx')}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${
              creationMethod === 'gpx'
                ? 'bg-green-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            📁 Upload GPX File
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Route Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="e.g., Alpine Pass Loop"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Describe the route, highlights, and driving experience..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Country</label>
              <input
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="e.g., United States, Germany, Austria"
              />
              <p className="text-xs text-slate-500 mt-1">Full country name</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Region</label>
              <input
                type="text"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="e.g., California, Bavaria"
              />
              <p className="text-xs text-slate-500 mt-1">Full region name</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Tags</label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="e.g., mountain, scenic, twisty (comma-separated)"
            />
            <p className="text-xs text-slate-500 mt-1">Separate multiple tags with commas</p>
          </div>

          {creationMethod === 'draw' ? (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Route Geometry *</label>
              <p className="text-xs text-slate-500 mb-2">Draw your route on the map below using the polyline tool</p>
              {mounted && (
                <MapDrawing onGeometryChange={setGeometry} />
              )}
              {geometry && geometry.coordinates.length > 0 && (
                <p className="text-xs text-green-400 mt-2">
                  ✓ Route drawn with {geometry.coordinates.length} points
                </p>
              )}
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Upload GPX Track *</label>
              <div className="p-6 border-2 border-dashed border-slate-700 hover:border-green-500/50 rounded-xl bg-slate-800/40 text-center transition-colors">
                <input
                  type="file"
                  id="gpx-file-input"
                  accept=".gpx,application/gpx+xml"
                  onChange={handleGPXFileUpload}
                  className="hidden"
                />
                <label
                  htmlFor="gpx-file-input"
                  className="cursor-pointer flex flex-col items-center justify-center gap-2"
                >
                  <div className="w-12 h-12 rounded-full bg-green-500/10 text-green-400 flex items-center justify-center text-xl">
                    📁
                  </div>
                  <div className="text-sm font-medium text-white">
                    {gpxFileName ? gpxFileName : "Click to select a .gpx file"}
                  </div>
                  <div className="text-xs text-slate-400">
                    Supports track logs from Garmin, Strava, OsmAnd, Gaia GPS, etc.
                  </div>
                </label>
              </div>

              {gpxParsedStats && (
                <div className="mt-3 p-3 bg-slate-800 border border-green-500/30 rounded-lg flex items-center justify-between text-xs">
                  <div className="text-green-400 font-medium">
                    ✓ Track loaded: {gpxParsedStats.points} points
                  </div>
                  <div className="text-slate-300">
                    Approx. length: <span className="font-semibold text-white">{gpxParsedStats.lengthKm.toFixed(1)} km</span>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex space-x-3 pt-4">
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
            >
              {loading ? "Creating..." : "Create Route"}
            </Button>
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              className="flex-1 border-slate-700 hover:bg-slate-800 text-white"
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
