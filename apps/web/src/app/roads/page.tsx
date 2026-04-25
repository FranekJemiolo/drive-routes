"use client";

import { useState, useEffect, useMemo } from "react";
import { Road } from "../../types";
import { fetchRoads } from "../../lib/api";
import Navbar from "../../components/Navbar";
import RoadCard from "../../components/RoadCard";

type SortOption = "rating-asc" | "rating-desc" | "distance-asc" | "distance-desc";

export default function RoadsPage() {
  const [roads, setRoads] = useState<Road[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortOption>("rating-desc");
  const [countryFilter, setCountryFilter] = useState<string>("all");

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

  // Get unique countries
  const countries = useMemo(() => {
    const uniqueCountries = Array.from(new Set(roads.map(r => r.country).filter(Boolean)));
    return uniqueCountries.sort();
  }, [roads]);

  // Filter and sort roads
  const filteredAndSortedRoads = useMemo(() => {
    let filtered = roads;

    // Filter by country
    if (countryFilter !== "all") {
      filtered = filtered.filter(r => r.country === countryFilter);
    }

    // Sort
    const sorted = [...filtered].sort((a, b) => {
      const aRating = Number(a.rating_avg);
      const bRating = Number(b.rating_avg);
      const aDistance = Number(a.length_km);
      const bDistance = Number(b.length_km);

      switch (sortBy) {
        case "rating-asc":
          return aRating - bRating;
        case "rating-desc":
          return bRating - aRating;
        case "distance-asc":
          return aDistance - bDistance;
        case "distance-desc":
          return bDistance - aDistance;
        default:
          return 0;
      }
    });

    return sorted;
  }, [roads, sortBy, countryFilter]);

  return (
    <div className="min-h-screen bg-slate-900">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-20">
        <h1 className="text-3xl font-bold text-white mb-6">All Roads</h1>
        
        {/* Filters and Sort */}
        <div className="flex flex-wrap gap-4 mb-6">
          {/* Country Filter */}
          <div className="flex items-center gap-2">
            <label className="text-slate-300 text-sm">Country:</label>
            <select
              value={countryFilter}
              onChange={(e) => setCountryFilter(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="all">All Countries</option>
              {countries.map(country => (
                <option key={country} value={country}>{country}</option>
              ))}
            </select>
          </div>

          {/* Sort By */}
          <div className="flex items-center gap-2">
            <label className="text-slate-300 text-sm">Sort by:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="rating-desc">Rating (High to Low)</option>
              <option value="rating-asc">Rating (Low to High)</option>
              <option value="distance-desc">Distance (Long to Short)</option>
              <option value="distance-asc">Distance (Short to Long)</option>
            </select>
          </div>
        </div>
        
        {loading ? (
          <div className="text-white">Loading roads...</div>
        ) : filteredAndSortedRoads.length === 0 ? (
          <div className="text-slate-400">No roads found</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAndSortedRoads.map(road => (
              <RoadCard key={road.id} road={road} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
