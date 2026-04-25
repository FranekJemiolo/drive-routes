"use client";

import { useState, useEffect } from "react";
import { Road } from "../../types";
import { fetchRoads } from "../../lib/api";
import Navbar from "../../components/Navbar";
import RoadCard from "../../components/RoadCard";

export default function RoadsPage() {
  const [roads, setRoads] = useState<Road[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadRoads() {
      try {
        const data = await fetchRoads();
        setRoads(data);
      } catch (error) {
        console.error("Failed to load roads:", error);
      } finally {
        setLoading(false);
      }
    }
    loadRoads();
  }, []);

  return (
    <div className="min-h-screen bg-slate-900">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-20">
        <h1 className="text-3xl font-bold text-white mb-6">All Roads</h1>
        
        {loading ? (
          <div className="text-white">Loading roads...</div>
        ) : roads.length === 0 ? (
          <div className="text-slate-400">No roads found</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {roads.map(road => (
              <RoadCard key={road.id} road={road} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
