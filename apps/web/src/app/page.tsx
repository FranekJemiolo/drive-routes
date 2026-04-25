"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Road } from "../types";
import RoadPanel from "../components/RoadPanel";
import Navbar from "../components/Navbar";
import ToastContainer from "../components/ui/toast";

const LeafletMap = dynamic(() => import("../components/map/LeafletMap"), {
  ssr: false,
  loading: () => <div className="w-full h-screen bg-gray-900 flex items-center justify-center">Loading map...</div>,
});

export default function HomePage() {
  const [selectedRoad, setSelectedRoad] = useState<Road | null>(null);

  return (
    <div className="relative w-full h-screen">
      <Navbar />
      <ToastContainer />
      
      <LeafletMap onSelectRoad={setSelectedRoad} />

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
