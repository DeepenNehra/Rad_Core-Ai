import React, { useState } from 'react';
import { PathologyFinding, GroundingData } from '../types';

interface ImageViewerProps {
  grounding?: GroundingData;
  findings: PathologyFinding[];
  modality: string;
}

export const ImageViewer: React.FC<ImageViewerProps> = ({ grounding, findings, modality }) => {
  const [viewMode, setViewMode] = useState<'annotated' | 'heatmap' | 'split'>('annotated');
  const [zoom, setZoom] = useState<number>(1);

  const hasAnnotated = Boolean(grounding?.annotated_image_b64);
  const hasHeatmap = Boolean(grounding?.heatmap_image_b64);

  const criticalCount = findings.filter((f) => f.is_critical).length;

  return (
    <div className="bg-medical-panel rounded-xl border border-medical-border p-4 shadow-xl flex flex-col h-full">
      {/* Viewer Header */}
      <div className="flex items-center justify-between pb-3 border-b border-medical-border mb-3">
        <div className="flex items-center space-x-2">
          <span className="text-base font-semibold text-white">🩻 Grounded Scan Viewer</span>
          <span className="text-xs px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-mono">
            {modality}
          </span>
          {criticalCount > 0 && (
            <span className="text-xs px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 animate-pulse font-semibold">
              🚨 {criticalCount} Critical
            </span>
          )}
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center space-x-1 bg-medical-dark p-0.5 rounded-lg border border-medical-border text-xs">
          <button
            onClick={() => setViewMode('annotated')}
            disabled={!hasAnnotated}
            className={`px-2.5 py-1 rounded transition-colors ${
              viewMode === 'annotated'
                ? 'bg-cyan-500 text-black font-semibold'
                : 'text-medical-muted hover:text-white'
            }`}
          >
            Bounding Boxes
          </button>
          <button
            onClick={() => setViewMode('heatmap')}
            disabled={!hasHeatmap}
            className={`px-2.5 py-1 rounded transition-colors ${
              viewMode === 'heatmap'
                ? 'bg-cyan-500 text-black font-semibold'
                : 'text-medical-muted hover:text-white'
            }`}
          >
            Attention Heatmap
          </button>
          <button
            onClick={() => setViewMode('split')}
            disabled={!hasAnnotated || !hasHeatmap}
            className={`px-2.5 py-1 rounded transition-colors ${
              viewMode === 'split'
                ? 'bg-cyan-500 text-black font-semibold'
                : 'text-medical-muted hover:text-white'
            }`}
          >
            Side-by-Side
          </button>
        </div>
      </div>

      {/* Canvas / Image Display Area */}
      <div className="relative flex-1 bg-black rounded-lg overflow-hidden border border-medical-border/60 flex items-center justify-center min-h-[360px] max-h-[520px]">
        {!hasAnnotated && !hasHeatmap ? (
          <div className="text-center p-8 text-medical-muted">
            <span className="text-4xl block mb-2">📷</span>
            <p className="text-sm font-medium">Scan Image Ready</p>
            <p className="text-xs mt-1">Run grounded clinical analysis to project localized boxes</p>
          </div>
        ) : viewMode === 'split' && hasAnnotated && hasHeatmap ? (
          <div className="grid grid-cols-2 gap-2 w-full h-full p-2">
            <div className="relative flex flex-col items-center justify-center bg-zinc-950 rounded border border-medical-border/40 overflow-hidden">
              <span className="absolute top-2 left-2 text-[10px] bg-black/70 px-2 py-0.5 rounded text-cyan-300 z-10">
                Localization Overlay
              </span>
              <img
                src={`data:image/png;base64,${grounding?.annotated_image_b64}`}
                alt="Bounding box projection"
                className="max-h-[460px] w-auto object-contain transition-transform"
                style={{ transform: `scale(${zoom})` }}
              />
            </div>
            <div className="relative flex flex-col items-center justify-center bg-zinc-950 rounded border border-medical-border/40 overflow-hidden">
              <span className="absolute top-2 left-2 text-[10px] bg-black/70 px-2 py-0.5 rounded text-amber-300 z-10">
                Attention Salience
              </span>
              <img
                src={`data:image/png;base64,${grounding?.heatmap_image_b64}`}
                alt="Attention heatmap"
                className="max-h-[460px] w-auto object-contain transition-transform"
                style={{ transform: `scale(${zoom})` }}
              />
            </div>
          </div>
        ) : (
          <div className="relative w-full h-full flex items-center justify-center p-2">
            <img
              src={`data:image/png;base64,${
                viewMode === 'heatmap' && hasHeatmap
                  ? grounding?.heatmap_image_b64
                  : grounding?.annotated_image_b64
              }`}
              alt="Medical Scan Visualization"
              className="max-h-[480px] w-auto object-contain rounded transition-transform"
              style={{ transform: `scale(${zoom})` }}
            />
          </div>
        )}

        {/* Zoom Controls */}
        <div className="absolute bottom-3 right-3 flex items-center space-x-1 bg-medical-dark/90 px-2 py-1 rounded-md border border-medical-border backdrop-blur">
          <button
            onClick={() => setZoom((z) => Math.max(0.7, z - 0.15))}
            className="w-6 h-6 flex items-center justify-center text-xs text-medical-text hover:text-white"
            title="Zoom Out"
          >
            -
          </button>
          <span className="text-[11px] font-mono text-medical-muted w-10 text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => setZoom((z) => Math.min(2.5, z + 0.15))}
            className="w-6 h-6 flex items-center justify-center text-xs text-medical-text hover:text-white"
            title="Zoom In"
          >
            +
          </button>
          <button
            onClick={() => setZoom(1)}
            className="text-[10px] text-cyan-400 hover:underline px-1"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Visual Annotation Legend */}
      <div className="mt-3 pt-2 border-t border-medical-border flex flex-wrap items-center justify-between text-xs text-medical-muted gap-2">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-red-500 inline-block" />
            <span className="text-[11px]">Critical (Urgent)</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-amber-500 inline-block" />
            <span className="text-[11px]">High Confidence (≥80%)</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-yellow-400 inline-block" />
            <span className="text-[11px]">Moderate Confidence</span>
          </div>
        </div>

        <span className="text-[11px] font-mono text-cyan-400">
          Spatial Projection: 2D Anatomical Bounds
        </span>
      </div>
    </div>
  );
};
