"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Road } from "../../../types";
import { fetchRoadDetail } from "../../../lib/api";
import Navbar from "../../../components/Navbar";

type Props = {
  roadId: string;
};

export default function RoadDetailClient({ roadId }: Props) {
  const router = useRouter();
  const [road, setRoad] = useState<Road | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadRoad() {
      try {
        const data = await fetchRoadDetail(roadId);
        setRoad(data);
      } catch (error) {
        console.error("Failed to load road:", error);
      } finally {
        setLoading(false);
      }
    }
    loadRoad();
  }, [roadId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-20">
          <div className="text-white">Loading road...</div>
        </div>
      </div>
    );
  }

  if (!road) {
    return (
      <div className="min-h-screen bg-slate-900">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-20">
          <div className="text-slate-400">Road not found</div>
          <button
            onClick={() => router.push("/roads")}
            className="mt-4 text-green-400 hover:text-green-300"
          >
            ← Back to Roads
          </button>
        </div>
      </div>
    );
  }

  const rating = Number(road.rating_avg);
  const length = Number(road.length_km);

  return (
    <div className="min-h-screen bg-slate-900">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-20">
        <button
          onClick={() => router.push("/roads")}
          className="text-slate-400 hover:text-white mb-6 inline-flex items-center"
        >
          ← Back to Roads
        </button>

        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">{road.name}</h1>
          <p className="text-slate-400 mb-4">
            {road.countries && road.countries.length > 0 ? road.countries.join(", ") : "Unknown"} • {road.region}
          </p>
          
          {road.description && (
            <p className="text-slate-300 mb-6">{road.description}</p>
          )}

          <div className="flex items-center gap-6 mb-6">
            <div className={`px-4 py-2 rounded-full text-lg font-semibold ${
              rating >= 8 ? 'bg-green-500/20 text-green-400' :
              rating >= 5 ? 'bg-yellow-500/20 text-yellow-400' :
              'bg-red-500/20 text-red-400'
            }`}>
              ★ {rating.toFixed(1)}
            </div>
            <div className="text-slate-400">
              {road.rating_count} {road.rating_count === 1 ? 'review' : 'reviews'}
            </div>
            <div className="text-slate-400">
              {length.toFixed(1)} km
            </div>
          </div>

          {road.tags && road.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {road.tags.map(tag => (
                <span
                  key={tag}
                  className="px-3 py-1 bg-slate-700 text-slate-200 rounded-full text-sm"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
