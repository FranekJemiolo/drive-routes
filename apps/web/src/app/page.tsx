"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Road } from "../types";
import RoadPanel from "../components/RoadPanel";

const LeafletMap = dynamic(() => import("../components/map/LeafletMap"), {
  ssr: false,
  loading: () => <div className="w-full h-screen bg-gray-900 flex items-center justify-center">Loading map...</div>
});

export default function HomePage() {
  const [selectedRoad, setSelectedRoad] = useState<Road | null>(null);

  return (
    <div className="relative w-full h-screen">
      <LeafletMap onSelectRoad={setSelectedRoad} />
      
      {/* Header */}
      <div className="absolute top-4 left-4 z-10">
        <h1 className="text-2xl font-bold text-white bg-black/50 px-4 py-2 rounded">
          DriveRoutes
        </h1>
        <p className="text-sm text-gray-300 bg-black/50 px-4 py-1 rounded">
          Discover the best driving roads
        </p>
      </div>

      {/* Road Info Panel */}
      {selectedRoad && (
        <RoadPanel 
          road={selectedRoad} 
          onClose={() => setSelectedRoad(null)} 
        />
      )}
    </div>
  );
}
