"use client";

import React, { useMemo } from "react";

interface TrackCircuitMinimapProps {
  coordinates: [number, number][]; // [lng, lat][]
  name?: string;
  lengthKm?: number | string;
  className?: string;
  width?: number;
  height?: number;
  showStats?: boolean;
  showEndpoints?: boolean;
  allowDownload?: boolean;
  theme?: "neon-green" | "cyber-cyan" | "racing-red" | "electric-amber";
}

export function TrackCircuitMinimap({
  coordinates = [],
  name,
  lengthKm,
  className = "",
  width = 320,
  height = 200,
  showStats = false,
  showEndpoints = true,
  allowDownload = false,
  theme = "neon-green",
}: TrackCircuitMinimapProps) {
  // Theme color maps
  const colorMap = {
    "neon-green": {
      stroke: "#10b981",
      glow: "#059669",
      start: "#22c55e",
      end: "#ef4444",
      bgGradientFrom: "#064e3b",
      bgGradientTo: "#022c22",
    },
    "cyber-cyan": {
      stroke: "#06b6d4",
      glow: "#0891b2",
      start: "#38bdf8",
      end: "#f43f5e",
      bgGradientFrom: "#164e63",
      bgGradientTo: "#083344",
    },
    "racing-red": {
      stroke: "#f43f5e",
      glow: "#be123c",
      start: "#22c55e",
      end: "#e11d48",
      bgGradientFrom: "#4c0519",
      bgGradientTo: "#27020d",
    },
    "electric-amber": {
      stroke: "#f59e0b",
      glow: "#d97706",
      start: "#10b981",
      end: "#ef4444",
      bgGradientFrom: "#451a03",
      bgGradientTo: "#1c0a00",
    },
  };

  const colors = colorMap[theme] || colorMap["neon-green"];

  // Compute projection and SVG path
  const projection = useMemo(() => {
    if (!coordinates || coordinates.length < 2) return null;

    let minLng = Infinity;
    let maxLng = -Infinity;
    let minLat = Infinity;
    let maxLat = -Infinity;

    for (const [lng, lat] of coordinates) {
      if (lng < minLng) minLng = lng;
      if (lng > maxLng) maxLng = lng;
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
    }

    const centerLat = (minLat + maxLat) / 2;
    const cosLat = Math.cos((centerLat * Math.PI) / 180);

    // Aspect adjusted distances
    const deltaLngDeg = Math.max(maxLng - minLng, 0.0001);
    const deltaLatDeg = Math.max(maxLat - minLat, 0.0001);
    const aspectX = deltaLngDeg * cosLat;
    const aspectY = deltaLatDeg;

    const padding = 24;
    const viewWidth = width;
    const viewHeight = height;
    const drawWidth = viewWidth - padding * 2;
    const drawHeight = viewHeight - padding * 2;

    const scaleX = drawWidth / aspectX;
    const scaleY = drawHeight / aspectY;
    const scale = Math.min(scaleX, scaleY);

    const projectedW = aspectX * scale;
    const projectedH = aspectY * scale;
    const offsetX = (viewWidth - projectedW) / 2;
    const offsetY = (viewHeight - projectedH) / 2;

    const projectedPoints = coordinates.map(([lng, lat]) => {
      const x = offsetX + (lng - minLng) * cosLat * scale;
      const y = offsetY + (maxLat - lat) * scale;
      return [x, y] as [number, number];
    });

    // Build SVG path
    const pathData = projectedPoints.reduce((acc, [x, y], idx) => {
      return idx === 0 ? `M ${x.toFixed(1)} ${y.toFixed(1)}` : `${acc} L ${x.toFixed(1)} ${y.toFixed(1)}`;
    }, "");

    const startPt = projectedPoints[0];
    const endPt = projectedPoints[projectedPoints.length - 1];

    // Check if route is a loop/circuit
    const distStartEnd = Math.hypot(startPt[0] - endPt[0], startPt[1] - endPt[1]);
    const isCircuit = distStartEnd < 18;

    return {
      pathData,
      startPt,
      endPt,
      isCircuit,
      viewWidth,
      viewHeight,
      pointCount: coordinates.length,
    };
  }, [coordinates, width, height]);

  const handleDownloadSVG = () => {
    if (!projection) return;

    const svgContent = `<?xml version="1.0" standalone="no"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${projection.viewWidth} ${projection.viewHeight}" width="${projection.viewWidth}" height="${projection.viewHeight}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#090d16" />
      <stop offset="100%" stop-color="#020617" />
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="3" result="blur" />
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  <rect width="100%" height="100%" fill="url(#bg)" rx="16" />
  
  <!-- Subtle Grid Pattern -->
  <g opacity="0.08" stroke="#ffffff" stroke-width="1">
    ${Array.from({ length: 9 })
      .map((_, i) => `<line x1="${(i + 1) * 35}" y1="0" x2="${(i + 1) * 35}" y2="${projection.viewHeight}" />`)
      .join("")}
    ${Array.from({ length: 6 })
      .map((_, i) => `<line x1="0" y1="${(i + 1) * 35}" x2="${projection.viewWidth}" y2="${(i + 1) * 35}" />`)
      .join("")}
  </g>

  <!-- Track Glow Underlay -->
  <path d="${projection.pathData}" fill="none" stroke="${colors.glow}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" opacity="0.4" filter="url(#glow)" />
  
  <!-- Main Circuit Path -->
  <path d="${projection.pathData}" fill="none" stroke="${colors.stroke}" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" />

  <!-- Start Point -->
  <circle cx="${projection.startPt[0]}" cy="${projection.startPt[1]}" r="6" fill="${colors.start}" stroke="#ffffff" stroke-width="1.5" />
  
  <!-- End Point -->
  <circle cx="${projection.endPt[0]}" cy="${projection.endPt[1]}" r="6" fill="${colors.end}" stroke="#ffffff" stroke-width="1.5" />

  <!-- Metadata Label -->
  <text x="20" y="${projection.viewHeight - 20}" font-family="system-ui, sans-serif" font-size="12" font-weight="bold" fill="#ffffff">${name || "DriveRoutes Track"}</text>
  ${
    lengthKm
      ? `<text x="20" y="${projection.viewHeight - 8}" font-family="system-ui, sans-serif" font-size="10" fill="#94a3b8">${Number(lengthKm).toFixed(1)} km • ${projection.pointCount} points</text>`
      : ""
  }
  <text x="${projection.viewWidth - 20}" y="${projection.viewHeight - 12}" text-anchor="end" font-family="system-ui, sans-serif" font-size="10" font-weight="bold" fill="#10b981">DRIVEROUTES</text>
</svg>`;

    const blob = new Blob([svgContent], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${(name || "track-circuit").toLowerCase().replace(/[^a-z0-9]/g, "-")}-minimap.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (!projection) {
    return (
      <div
        className={`flex items-center justify-center bg-slate-950/80 border border-slate-800 rounded-xl text-slate-500 text-xs ${className}`}
        style={{ width: "100%", height }}
      >
        <span>No track geometry to display</span>
      </div>
    );
  }

  return (
    <div className={`relative group overflow-hidden rounded-xl bg-gradient-to-b from-slate-900/90 to-slate-950 border border-slate-800 shadow-inner ${className}`}>
      {/* SVG Canvas */}
      <svg
        viewBox={`0 0 ${projection.viewWidth} ${projection.viewHeight}`}
        className="w-full h-full block"
        style={{ aspectRatio: `${projection.viewWidth} / ${projection.viewHeight}` }}
      >
        <defs>
          <filter id={`glow-${theme}`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <linearGradient id={`trackGradient-${theme}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={colors.start} />
            <stop offset="100%" stopColor={colors.stroke} />
          </linearGradient>
        </defs>

        {/* Subtle grid lines background */}
        <g opacity="0.06" stroke="#94a3b8" strokeWidth="0.8">
          <line x1="25%" y1="0" x2="25%" y2="100%" />
          <line x1="50%" y1="0" x2="50%" y2="100%" />
          <line x1="75%" y1="0" x2="75%" y2="100%" />
          <line x1="0" y1="33%" x2="100%" y2="33%" />
          <line x1="0" y1="66%" x2="100%" y2="66%" />
        </g>

        {/* Outer track glow */}
        <path
          d={projection.pathData}
          fill="none"
          stroke={colors.glow}
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.4"
          filter={`url(#glow-${theme})`}
        />

        {/* Primary sharp circuit path */}
        <path
          d={projection.pathData}
          fill="none"
          stroke={`url(#trackGradient-${theme})`}
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="transition-all duration-300 group-hover:stroke-width-4"
        />

        {showEndpoints && (
          <>
            {/* Start Node */}
            <g>
              <circle
                cx={projection.startPt[0]}
                cy={projection.startPt[1]}
                r="7"
                fill={colors.start}
                opacity="0.3"
                className="animate-ping origin-center"
              />
              <circle
                cx={projection.startPt[0]}
                cy={projection.startPt[1]}
                r="4.5"
                fill={colors.start}
                stroke="#ffffff"
                strokeWidth="1.5"
              />
            </g>

            {/* End Node */}
            <g>
              <circle
                cx={projection.endPt[0]}
                cy={projection.endPt[1]}
                r="4.5"
                fill={colors.end}
                stroke="#ffffff"
                strokeWidth="1.5"
              />
            </g>
          </>
        )}
      </svg>

      {/* Top right badges */}
      <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 z-10">
        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800/80 border border-slate-700/80 text-slate-300 backdrop-blur-sm shadow-sm">
          {projection.isCircuit ? "Circuit Loop" : "Point-to-Point"}
        </span>

        {allowDownload && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDownloadSVG();
            }}
            title="Download vector track graphic (SVG)"
            className="p-1 rounded-md bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/80 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </button>
        )}
      </div>

      {/* Bottom overlay info if showStats is enabled */}
      {showStats && (
        <div className="absolute bottom-2 left-2.5 right-2.5 flex items-center justify-between text-[11px] text-slate-400 bg-slate-900/85 backdrop-blur-sm px-2.5 py-1 rounded-md border border-slate-800">
          <div className="font-medium text-slate-200 truncate mr-2">
            {name || "Track Circuit"}
          </div>
          <div className="flex items-center gap-2 whitespace-nowrap text-slate-400">
            {lengthKm && <span className="font-semibold text-emerald-400">{Number(lengthKm).toFixed(1)} km</span>}
            <span>•</span>
            <span>{projection.pointCount} pts</span>
          </div>
        </div>
      )}
    </div>
  );
}
