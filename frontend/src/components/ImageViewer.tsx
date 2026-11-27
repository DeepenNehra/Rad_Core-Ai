import React, { useState } from 'react';
import {
  ScanLine,
  Layers,
  Flame,
  Columns2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  Minimize2,
  SunMedium,
  Contrast,
  AlertTriangle,
  ImageOff,
} from 'lucide-react';
import { PathologyFinding, GroundingData } from '../types';

interface ImageViewerProps {
  grounding?: GroundingData;
  findings: PathologyFinding[];
  modality: string;
}

export const ImageViewer: React.FC<ImageViewerProps> = ({ grounding, findings, modality }) => {
  const [viewMode, setViewMode] = useState<'annotated' | 'heatmap' | 'split'>('annotated');
  const [zoom, setZoom] = useState<number>(1);
  const [brightness, setBrightness] = useState<number>(100);
  const [contrast, setContrast] = useState<number>(100);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const hasAnnotated = Boolean(grounding?.annotated_image_b64);
  const hasHeatmap = Boolean(grounding?.heatmap_image_b64);
  const criticalCount = findings.filter((f) => f.is_critical).length;

  const filterStyle = {
    transform: `scale(${zoom})`,
    filter: `brightness(${brightness}%) contrast(${contrast}%)`,
  };

  const resetControls = () => {
    setZoom(1);
    setBrightness(100);
    setContrast(100);
  };

  return (
    <div
      className={`${
        isFullscreen
          ? 'fixed inset-0 z-50 bg-slate-950 p-6 flex flex-col'
          : 'bg-medical-panel/95 rounded-2xl border border-medical-border p-4 shadow-2xl flex flex-col h-full'
      }`}
    >
      {/* Viewer Header */}
      <div className="flex flex-wrap items-center justify-between pb-3 border-b border-medical-border mb-3 gap-2">
        <div className="flex items-center space-x-2">
          <ScanLine className="w-4 h-4 text-cyan-400" />
          <span className="text-sm font-bold text-white">PACS Grounded Scan Viewer</span>
          <span className="text-[11px] px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-300 border border-cyan-500/25 font-mono">
            {modality}
          </span>
          {criticalCount > 0 && (
            <span className="text-[11px] px-2 py-0.5 rounded-md bg-rose-500/15 text-rose-300 border border-rose-500/35 flex items-center gap-1 font-semibold animate-pulse">
              <AlertTriangle className="w-3 h-3" />
              {criticalCount} Critical
            </span>
          )}
        </div>

        {/* Mode Switcher */}
        <div className="flex items-center gap-1.5">
          <div className="flex items-center space-x-1 bg-medical-dark p-0.5 rounded-xl border border-medical-border text-xs">
            <button
              onClick={() => setViewMode('annotated')}
              disabled={!hasAnnotated}
              className={`px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all disabled:opacity-40 ${
                viewMode === 'annotated'
                  ? 'bg-cyan-500 text-slate-950 font-semibold'
                  : 'text-medical-muted hover:text-white'
              }`}
            >
              <Layers className="w-3 h-3" />
              <span>Boxes</span>
            </button>
            <button
              onClick={() => setViewMode('heatmap')}
              disabled={!hasHeatmap}
              className={`px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all disabled:opacity-40 ${
                viewMode === 'heatmap'
                  ? 'bg-cyan-500 text-slate-950 font-semibold'
                  : 'text-medical-muted hover:text-white'
              }`}
            >
              <Flame className="w-3 h-3" />
              <span>Heatmap</span>
            </button>
            <button
              onClick={() => setViewMode('split')}
              disabled={!hasAnnotated || !hasHeatmap}
              className={`px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all disabled:opacity-40 ${
                viewMode === 'split'
                  ? 'bg-cyan-500 text-slate-950 font-semibold'
                  : 'text-medical-muted hover:text-white'
              }`}
            >
              <Columns2 className="w-3 h-3" />
              <span>Split</span>
            </button>
          </div>

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 rounded-lg bg-medical-dark border border-medical-border text-medical-muted hover:text-white transition-colors"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Viewport'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Viewport */}
      <div
        className={`relative flex-1 bg-black rounded-xl overflow-hidden border border-medical-border/60 flex items-center justify-center ${
          isFullscreen ? 'min-h-0' : 'min-h-[360px] max-h-[500px]'
        }`}
      >
        {!hasAnnotated && !hasHeatmap ? (
          <div className="text-center p-8 text-medical-muted space-y-2">
            <ImageOff className="w-10 h-10 mx-auto text-medical-muted/60" />
            <p className="text-sm font-medium text-white">Historical Record View</p>
            <p className="text-xs max-w-xs mx-auto">
              Raw pixel buffers are omitted from lightweight archive snapshots to preserve database storage.
            </p>
          </div>
        ) : viewMode === 'split' && hasAnnotated && hasHeatmap ? (
          <div className="grid grid-cols-2 gap-2 w-full h-full p-2">
            <div className="relative flex flex-col items-center justify-center bg-zinc-950 rounded-lg border border-medical-border/40 overflow-hidden">
              <span className="absolute top-2 left-2 text-[10px] bg-black/80 px-2 py-0.5 rounded text-cyan-300 z-10 border border-cyan-500/30">
                Localization Overlay
              </span>
              <img
                src={`data:image/png;base64,${grounding?.annotated_image_b64}`}
                alt="Bounding box projection"
                className="max-h-[450px] w-auto object-contain transition-transform duration-150"
                style={filterStyle}
              />
            </div>
            <div className="relative flex flex-col items-center justify-center bg-zinc-950 rounded-lg border border-medical-border/40 overflow-hidden">
              <span className="absolute top-2 left-2 text-[10px] bg-black/80 px-2 py-0.5 rounded text-amber-300 z-10 border border-amber-500/30">
                Attention Salience
              </span>
              <img
                src={`data:image/png;base64,${grounding?.heatmap_image_b64}`}
                alt="Attention heatmap"
                className="max-h-[450px] w-auto object-contain transition-transform duration-150"
                style={filterStyle}
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
              className={`${
                isFullscreen ? 'max-h-[75vh]' : 'max-h-[460px]'
              } w-auto object-contain rounded transition-transform duration-150`}
              style={filterStyle}
            />
          </div>
        )}

        {/* Floating Zoom Controls */}
        {(hasAnnotated || hasHeatmap) && (
          <div className="absolute bottom-3 right-3 flex items-center space-x-1 bg-medical-dark/90 px-2.5 py-1.5 rounded-xl border border-medical-border backdrop-blur-md">
            <button
              onClick={() => setZoom((z) => Math.max(0.7, +(z - 0.15).toFixed(2)))}
              className="p-1 text-medical-text hover:text-white"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-mono text-cyan-300 w-10 text-center tabular-nums">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom((z) => Math.min(2.5, +(z + 0.15).toFixed(2)))}
              className="p-1 text-medical-text hover:text-white"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={resetControls}
              className="p-1 text-cyan-400 hover:text-cyan-200 ml-1 border-l border-medical-border pl-2"
              title="Reset Zoom & Windowing"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* PACS Windowing Sliders + Legend */}
      <div className="mt-3 pt-2.5 border-t border-medical-border flex flex-wrap items-center justify-between gap-3 text-[11px] text-medical-muted">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-red-500 inline-block" />
            <span>Critical</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-amber-500 inline-block" />
            <span>High (≥80%)</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-yellow-400 inline-block" />
            <span>Moderate</span>
          </div>
        </div>

        {(hasAnnotated || hasHeatmap) && (
          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-1.5">
              <SunMedium className="w-3.5 h-3.5 text-cyan-400" />
              <input
                type="range"
                min={60}
                max={160}
                value={brightness}
                onChange={(e) => setBrightness(Number(e.target.value))}
                className="w-16 accent-cyan-400 cursor-pointer"
                title={`Brightness: ${brightness}%`}
              />
            </label>
            <label className="flex items-center gap-1.5">
              <Contrast className="w-3.5 h-3.5 text-cyan-400" />
              <input
                type="range"
                min={60}
                max={180}
                value={contrast}
                onChange={(e) => setContrast(Number(e.target.value))}
                className="w-16 accent-cyan-400 cursor-pointer"
                title={`Contrast: ${contrast}%`}
              />
            </label>
          </div>
        )}
      </div>
    </div>
  );
};
