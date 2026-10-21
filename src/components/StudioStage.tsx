import React, { FC, useState, useRef, useEffect, ReactNode } from 'react';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  Minimize2,
  Hand,
  Sparkles,
  Move,
} from 'lucide-react';

interface StudioStageProps {
  children: ReactNode;
  playbackDock: ReactNode;
  scenarioTitle: string;
  category?: string;
  rendererType?: string;
}

export const StudioStage: FC<StudioStageProps> = ({
  children,
  playbackDock,
  scenarioTitle,
  category,
  rendererType,
}) => {
  const stageRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [isPanMode, setIsPanMode] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const startDragRef = useRef<{ x: number; y: number; panX: number; panY: number }>({
    x: 0,
    y: 0,
    panX: 0,
    panY: 0,
  });

  // Track fullscreen state change
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Zoom handlers
  const handleZoomIn = () => {
    setZoom((prev) => Math.min(1.8, Math.round((prev + 0.15) * 100) / 100));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(0.65, Math.round((prev - 0.15) * 100) / 100));
  };

  const handleResetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Fullscreen toggle handler
  const handleToggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        if (stageRef.current?.requestFullscreen) {
          await stageRef.current.requestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        }
      }
    } catch (err) {
      console.warn('Fullscreen request failed:', err);
    }
  };

  // Mouse pan event handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    // Only pan if Pan Mode is active OR middle mouse button OR holding Alt
    if (isPanMode || e.button === 1 || e.altKey) {
      e.preventDefault();
      setIsPanning(true);
      startDragRef.current = {
        x: e.clientX,
        y: e.clientY,
        panX: pan.x,
        panY: pan.y,
      };
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning) return;
    e.preventDefault();
    const dx = e.clientX - startDragRef.current.x;
    const dy = e.clientY - startDragRef.current.y;
    setPan({
      x: startDragRef.current.panX + dx,
      y: startDragRef.current.panY + dy,
    });
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  return (
    <section
      ref={stageRef}
      className={`w-full h-full flex flex-col justify-between relative overflow-hidden select-none font-['Plus_Jakarta_Sans',sans-serif] ${
        isFullscreen ? 'bg-[#F8FAFC] p-4' : 'bg-transparent'
      }`}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* 1. Sân khấu Trực quan (Top Area with Floating Controls Bar) */}
      <div className="relative w-full flex-1 min-h-0 flex flex-col overflow-hidden">
        {/* Floating Controls Bar at top-right */}
        <div className="absolute top-2.5 right-2.5 z-40 flex items-center gap-1.5 bg-white/95 backdrop-blur-md p-1 rounded-xl border border-slate-200/90 shadow-sm">
          {/* Pan Tool Toggle Button */}
          <button
            type="button"
            onClick={() => setIsPanMode(!isPanMode)}
            className={`p-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              isPanMode
                ? 'bg-red-50 text-[#E31B23] border border-red-200'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
            }`}
            title={isPanMode ? 'Tắt chế độ kéo bản đồ' : 'Bật chế độ kéo khung vẽ (Pan)'}
          >
            <Hand className="w-3.5 h-3.5" />
          </button>

          <div className="h-4 w-[1px] bg-slate-200 mx-0.5" />

          {/* Zoom Out Button */}
          <button
            type="button"
            onClick={handleZoomOut}
            disabled={zoom <= 0.65}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 disabled:opacity-30 transition-colors cursor-pointer"
            title="Thu nhỏ (-)"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>

          {/* Zoom Percentage (Click to reset) */}
          <button
            type="button"
            onClick={handleResetView}
            className="px-2 py-0.5 text-[11px] font-mono font-bold text-slate-700 hover:text-[#E31B23] rounded transition-colors cursor-pointer"
            title="Nhấn để đưa về 100%"
          >
            {Math.round(zoom * 100)}%
          </button>

          {/* Zoom In Button */}
          <button
            type="button"
            onClick={handleZoomIn}
            disabled={zoom >= 1.8}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 disabled:opacity-30 transition-colors cursor-pointer"
            title="Phóng to (+)"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>

          <div className="h-4 w-[1px] bg-slate-200 mx-0.5" />

          {/* Reset View Button */}
          <button
            type="button"
            onClick={handleResetView}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Đặt lại khung nhìn (1:1)"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Fullscreen Button */}
          <button
            type="button"
            onClick={handleToggleFullscreen}
            className="p-1.5 rounded-lg text-slate-500 hover:text-[#E31B23] hover:bg-slate-100 transition-colors cursor-pointer"
            title={isFullscreen ? 'Thu nhỏ cửa sổ' : 'Phóng to toàn màn hình'}
          >
            {isFullscreen ? (
              <Minimize2 className="w-3.5 h-3.5 text-[#E31B23]" />
            ) : (
              <Maximize2 className="w-3.5 h-3.5" />
            )}
          </button>
        </div>

        {/* Transformable Canvas Viewport */}
        <div
          className={`w-full h-full flex-1 relative overflow-hidden ${
            isPanMode ? (isPanning ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-default'
          }`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
        >
          <div
            className="w-full h-full transition-transform duration-150 origin-center"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: 'center center',
            }}
          >
            {children}
          </div>
        </div>
      </div>

      {/* 2. Floating Playback Dock at Bottom */}
      <div className="w-full pt-2.5 shrink-0 z-30">
        {playbackDock}
      </div>
    </section>
  );
};
