"use client";

import { useState, useEffect } from "react";
import { Road } from "../../types";
import RoadCard from "../../components/RoadCard";
import { isAuthenticated, getUser } from "../../lib/auth";
import { getRoadsByUserId, getSavedRoutes, getRoad } from "../../lib/browser-storage";

export default function MyRoutesPage() {
  const [savedRoads, setSavedRoads] = useState<Road[]>([]);
  const [createdRoads, setCreatedRoads] = useState<Road[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'saved' | 'created'>('saved');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    if (!isAuthenticated()) {
      setLoading(false);
      return;
    }

    const user = getUser();
    if (user) {
      // Get routes created by user
      const userCreatedRoads = getRoadsByUserId(user.id);
      setCreatedRoads(userCreatedRoads);

      // Get routes saved by user
      const savedRouteIds = getSavedRoutes(user.id);
      const savedRoadsData = savedRouteIds
        .map(id => getRoad(id))
        .filter((road): road is Road => road !== null);
      setSavedRoads(savedRoadsData);
    }
    setLoading(false);
  }, [mounted]);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-slate-950 pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center text-slate-400">Loading...</div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated()) {
    return (
      <div className="min-h-screen bg-slate-950 pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-white mb-4">My Routes</h1>
            <p className="text-slate-400">Please sign in to view your saved routes.</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center text-slate-400">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-white mb-8">My Routes</h1>
        
        {/* Tabs */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveTab('saved')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'saved'
                ? 'bg-green-500 text-white'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            Saved ({savedRoads.length})
          </button>
          <button
            onClick={() => setActiveTab('created')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'created'
                ? 'bg-green-500 text-white'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            Created ({createdRoads.length})
          </button>
        </div>
        
        {loading ? (
          <div className="text-center text-slate-400">Loading...</div>
        ) : activeTab === 'saved' && savedRoads.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">No saved routes yet</h2>
            <p className="text-slate-400 mb-6">Click the heart icon on any route to save it here.</p>
            <a
              href="/roads"
              className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-lg font-medium transition-colors"
            >
              Browse Roads
            </a>
          </div>
        ) : activeTab === 'created' && createdRoads.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0121 18.382V7.618a1 1 0 00-.553-.894L15 7m0 13V7" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">No created routes yet</h2>
            <p className="text-slate-400 mb-6">Start creating your own driving routes!</p>
            <a
              href="/"
              className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-lg font-medium transition-colors"
            >
              Create Route
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(activeTab === 'saved' ? savedRoads : createdRoads).map((road) => (
              <RoadCard key={road.id} road={road} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
