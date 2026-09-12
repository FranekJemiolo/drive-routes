"use client";

import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { createPortal } from "react-dom";
import { createRoad, parseGPXString } from "../lib/api";
import { getUser } from "../lib/auth";
import dynamic from "next/dynamic";
import { TrackCircuitMinimap } from "./TrackCircuitMinimap";

const MapDrawing = dynamic(() => import("./MapDrawing"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-96 rounded-xl overflow-hidden border border-slate-700 flex items-center justify-center bg-slate-900">
      <div className="text-slate-400">Loading map editor...</div>
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
    if (!coords || coords.length < 2) return 0;
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

  const currentLength = geometry ? calculateLength(geometry.coordinates) : 0;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-md p-3 sm:p-6 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 w-full max-w-4xl shadow-2xl max-h-[92vh] overflow-y-auto relative z-[10000] my-auto">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Create Driving Route</h2>
            <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
              Draw a custom circuit on the map or import a GPS track log to share
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {error && (
          <div className="mb-5 p-3.5 bg-red-500/15 border border-red-500/40 rounded-xl text-red-400 text-sm flex items-center gap-2">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Method Switcher Tabs */}
        <div className="flex gap-2 p-1.5 bg-slate-950/80 rounded-xl mb-6 border border-slate-800">
          <button
            type="button"
            onClick={() => setCreationMethod('draw')}
            className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
              creationMethod === 'draw'
                ? 'bg-gradient-to-r from-emerald-600 to-green-600 text-white shadow-lg'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <span>✏️</span> Draw Circuit on Map
          </button>
          <button
            type="button"
            onClick={() => setCreationMethod('gpx')}
            className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
              creationMethod === 'gpx'
                ? 'bg-gradient-to-r from-emerald-600 to-green-600 text-white shadow-lg'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <span>📁</span> Upload GPX Track
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Route Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm"
                placeholder="e.g., Grossglockner Alpine Circuit"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Country
                </label>
                <input
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm"
                  placeholder="e.g., Austria"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Region / State
                </label>
                <input
                  type="text"
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm"
                  placeholder="e.g., High Alps"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm resize-none"
              placeholder="Key highlights, apex turns, road surface, scenic overlooks..."
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Tags
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm"
              placeholder="mountain, curves, coastal, scenic (comma-separated)"
            />
          </div>

          {/* Route Geometry / Circuit Area */}
          <div className="pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-200">
                Proposed Track & Circuit Geometry *
              </label>
              {geometry && geometry.coordinates.length > 0 && (
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-emerald-400 font-semibold">{geometry.coordinates.length} points</span>
                  <span className="text-slate-500">•</span>
                  <span className="text-white font-semibold">{currentLength.toFixed(1)} km</span>
                </div>
              )}
            </div>

            {creationMethod === 'draw' ? (
              <div className="space-y-4">
                {mounted && (
                  <MapDrawing
                    onGeometryChange={setGeometry}
                    initialCoordinates={geometry?.coordinates}
                  />
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-6 border-2 border-dashed border-slate-700 hover:border-emerald-500/60 rounded-2xl bg-slate-950/60 text-center transition-all">
                  <input
                    type="file"
                    id="gpx-file-input"
                    accept=".gpx,application/gpx+xml"
                    onChange={handleGPXFileUpload}
                    className="hidden"
                  />
                  <label
                    htmlFor="gpx-file-input"
                    className="cursor-pointer flex flex-col items-center justify-center gap-2.5"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-2xl border border-emerald-500/20 shadow-inner">
                      📁
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white">
                        {gpxFileName ? gpxFileName : "Click or drag & drop a .gpx file"}
                      </div>
                      <div className="text-xs text-slate-400 mt-1">
                        Accepts tracks recorded from Strava, Garmin, OsmAnd, Gaia GPS, or Google Earth
                      </div>
                    </div>
                  </label>
                </div>

                {/* When GPX is loaded, show map preview as well */}
                {geometry && geometry.coordinates.length > 0 && mounted && (
                  <div className="mt-4">
                    <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                      Geographic Map Inspection
                    </div>
                    <MapDrawing
                      onGeometryChange={setGeometry}
                      initialCoordinates={geometry.coordinates}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Standalone Circuit Graphic Preview & Export */}
            {geometry && geometry.coordinates.length > 1 && (
              <div className="mt-5 p-4 rounded-2xl bg-slate-950/90 border border-slate-800 shadow-xl">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                      Circuit Track Silhouette (Minimap Graphic)
                    </span>
                  </div>
                  <span className="text-xs text-slate-400">
                    Sleek standalone view without map tiles
                  </span>
                </div>

                <TrackCircuitMinimap
                  coordinates={geometry.coordinates}
                  name={name || "Proposed Track"}
                  lengthKm={currentLength}
                  height={220}
                  showStats={true}
                  allowDownload={true}
                  theme="neon-green"
                />
              </div>
            )}
          </div>

          <div className="flex space-x-3 pt-4 border-t border-slate-800">
            <Button
              type="submit"
              disabled={loading || !geometry || geometry.coordinates.length < 2}
              className="flex-1 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 disabled:opacity-50 text-white font-semibold py-3 shadow-lg shadow-emerald-950/50"
            >
              {loading ? "Publishing Route..." : "Publish Driving Route"}
            </Button>
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              className="border-slate-700 hover:bg-slate-800 text-slate-300 hover:text-white px-6 py-3"
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
