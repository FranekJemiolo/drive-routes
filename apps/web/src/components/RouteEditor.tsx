"use client";

import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { createPortal } from "react-dom";
import { createRoad } from "../lib/api";

interface RouteEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onRouteCreated?: () => void;
}

export function RouteEditor({ isOpen, onClose, onRouteCreated }: RouteEditorProps) {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [country, setCountry] = useState("");
  const [region, setRegion] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Parse tags from comma-separated string
      const tagsArray = tags.split(',').map(t => t.trim()).filter(t => t.length > 0);
      
      // For now, create a simple line geometry (placeholder)
      // In production, this would come from map drawing or GPX import
      const geometry: {
        type: "LineString";
        coordinates: [number, number][];
      } = {
        type: "LineString",
        coordinates: [
          [0, 0],
          [1, 1]
        ]
      };

      await createRoad({
        name,
        description,
        geometry,
        tags: tagsArray,
        countries: country ? [country] : [],
        region
      });

      // Reset form
      setName("");
      setDescription("");
      setTags("");
      setCountry("");
      setRegion("");

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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-white mb-4">Add New Route</h2>
        
        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

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
                placeholder="e.g., US, DE, AT"
              />
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

          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
            <p className="text-sm text-slate-400 mb-2">
              <strong className="text-slate-300">Route Geometry:</strong>
            </p>
            <p className="text-xs text-slate-500">
              For this demo, a placeholder geometry will be used. In production, you would draw the route on the map or import a GPX file.
            </p>
          </div>

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
