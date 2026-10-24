import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { PRESET_SCENARIOS } from './data/presets';
import { SimulationScenario } from './types/simulation';
import { HeroHeader } from './components/HeroHeader';
import { resolveQuery } from './services/capabilities';
import { FlowGraphRenderer } from './components/FlowGraphRenderer';
import { ArrayPointerRenderer } from './components/ArrayPointerRenderer';
import { GridPathRenderer } from './components/GridPathRenderer';
import { Swarm2DRenderer } from './components/Swarm2DRenderer';
import { TreeGraphRenderer } from './components/TreeGraphRenderer';
import { StorytellerBanner } from './components/StorytellerBanner';
import { PlaybackDock } from './components/PlaybackDock';
import { generateScenarioWithGroq } from './services/groq';
import { adaptPreset } from './services/scenarioContract';
import { useReducedMotion } from 'framer-motion';
import {
  AlertCircle,
  Sparkles,
  X,
  CheckCircle2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  Minimize2,
  Hand,
} from 'lucide-react';

const CURATED_PRESETS = PRESET_SCENARIOS.map((scenario) => adaptPreset(scenario).scenario);

export default function App() {
  const [customScenarios, setCustomScenarios] = useState<SimulationScenario[]>([]);
  const allScenarios = useMemo(() => [...CURATED_PRESETS, ...customScenarios], [customScenarios]);

  const [activeScenario, setActiveScenario] = useState<SimulationScenario>(CURATED_PRESETS[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState<number>(1);
  const [playbackSession, setPlaybackSession] = useState(0);
  const reducedMotion = useReducedMotion();
  const motionEnabled = isPlaying && !reducedMotion;

  // AI Generation State
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  // Set of currently active/online node IDs (Chaos Engineering state)
  const [activeNodeIds, setActiveNodeIds] = useState<Set<string>>(
    () => new Set(CURATED_PRESETS[0].nodes.map((n) => n.id))
  );

  // Zoom / Pan / Fullscreen State for Visualizer Canvas
  const stageContainerRef = useRef<HTMLDivElement>(null);
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

  const handleToggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        if (stageContainerRef.current?.requestFullscreen) {
          await stageContainerRef.current.requestFullscreen();
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

  // Mouse drag pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
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

  // Switch scenario handler
  const handleSelectScenario = useCallback((scenario: SimulationScenario) => {
    setPlaybackSession((session) => session + 1);
    setActiveScenario(scenario);
    setCurrentStepIndex(0);
    setIsPlaying(false);
    setActiveNodeIds(new Set(scenario.nodes.map((n) => n.id)));
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  // Filter presets based on search query (hỗ trợ bóc tách tiền tố "thuật toán", "công nghệ")
  const filteredScenarios = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return allScenarios;
    const cleanQ = q.replace(/^(thuật toán|giải thuật|công nghệ|hệ thống|mô hình)\s+/i, '').trim();
    return allScenarios.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        (cleanQ && s.title.toLowerCase().includes(cleanQ)) ||
        (s.subtitle && s.subtitle.toLowerCase().includes(q)) ||
        (cleanQ && s.subtitle && s.subtitle.toLowerCase().includes(cleanQ)) ||
        (s.summary && s.summary.toLowerCase().includes(q)) ||
        (cleanQ && s.summary && s.summary.toLowerCase().includes(cleanQ)) ||
        (s.category && s.category.toLowerCase().includes(q)) ||
        (s.tags &&
          s.tags.some((t) => {
            const tl = t.toLowerCase();
            return tl.includes(q) || (cleanQ && tl.includes(cleanQ));
          })) ||
        (s.nodes && s.nodes.some((n) => n.name.toLowerCase().includes(q)))
    );
  }, [allScenarios, searchQuery]);

  // When search matches a single exact scenario or first filtered scenario on Enter, we can provide immediate feedback
  const handleSearchSelect = (scenario: SimulationScenario) => {
    handleSelectScenario(scenario);
    setSearchQuery('');
  };

  // AI Scenario Generation with Groq or Instant Preset Selection
  const handleGenerateWithGroq = async (queryText: string) => {
    const trimmed = queryText.trim();
    if (!trimmed) return;

    // 1. Kiểm tra nhanh nếu từ khóa khớp với preset có sẵn (bóc tách các từ phụ như thuật toán, giải thuật...)
    const local = resolveQuery(trimmed, allScenarios);
    if (local) {
      if (local.status === 'accepted') {
        if (local.source === 'reference-runner') setCustomScenarios((prev) => [local.scenario, ...prev.filter((scenario) => scenario.id !== local.scenario.id)]);
        handleSelectScenario(local.scenario);
        setSearchQuery('');
        setGenerationError(null);
      } else setGenerationError(local.reason);
      return;
    }

    // 2. Kích hoạt trực tiếp Groq AI Pipeline (Cloudflare Functions / Environment Key)
    setIsGenerating(true);
    setGenerationError(null);

    try {
      const generated = await generateScenarioWithGroq(trimmed);
      if (generated.status === 'accepted') {
        setCustomScenarios((prev) => [generated.scenario, ...prev]);
        handleSelectScenario(generated.scenario);
        setSearchQuery('');
      } else {
        setGenerationError(generated.reason);
      }
    } catch (err: any) {
      console.error('Groq Generation Error:', err);
      const msg = err?.message || 'Lỗi khi phân tích và tạo kịch bản với Groq AI. Vui lòng thử lại sau giây lát.';
      setGenerationError(msg);
    } finally {
      setIsGenerating(false);
    }
  };

  // Step Controls
  const totalSteps = activeScenario.steps.length;
  const currentStep = activeScenario.steps[currentStepIndex] || activeScenario.steps[0];

  const handleNextStep = useCallback(() => {
    setIsPlaying(false);
    setCurrentStepIndex((prev) => (prev < totalSteps - 1 ? prev + 1 : prev));
  }, [totalSteps]);

  const handlePrevStep = useCallback(() => {
    setIsPlaying(false);
    setCurrentStepIndex((prev) => (prev > 0 ? prev - 1 : 0));
  }, []);

  const handleResetStep = useCallback(() => {
    setPlaybackSession((session) => session + 1);
    setCurrentStepIndex(0);
    setIsPlaying(false);
  }, []);

  const handleStepSelect = useCallback(
    (stepIdx: number) => {
      setPlaybackSession((session) => session + 1);
      setIsPlaying(false);
      setCurrentStepIndex(Math.max(0, Math.min(stepIdx, totalSteps - 1)));
    },
    [totalSteps]
  );

  // Global Keyboard Navigation (ArrowLeft / ArrowRight) with strict input/textarea focus guard
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement as HTMLElement | null;
      const target = e.target as HTMLElement | null;

      const isInputActive =
        (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.isContentEditable)) ||
        (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable));

      if (isInputActive) {
        return;
      }

      if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNextStep();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrevStep();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNextStep, handlePrevStep]);

  // Each frame owns one timer; seeking or changing speed cancels it.
  useEffect(() => {
    if (!isPlaying) return;
    if (currentStepIndex >= totalSteps - 1) {
      setIsPlaying(false);
      return;
    }
    const timer = setTimeout(() => setCurrentStepIndex((prev) => prev + 1), Math.round(3500 / speed));
    return () => clearTimeout(timer);
  }, [isPlaying, speed, totalSteps, currentStepIndex]);

  return (
    <div className="min-h-screen bg-[#F5F6F8] flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      {/* 1. Top Hero Header */}
      <HeroHeader
        scenarios={allScenarios}
        activeScenarioId={activeScenario.id}
        onSelectScenario={handleSelectScenario}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onGenerateWithGroq={handleGenerateWithGroq}
        isGenerating={isGenerating}
      />

      {/* Search results dropdown & Error banner container */}
      <div className="max-w-3xl mx-auto w-full px-4 -mt-6 mb-2 z-40 relative flex flex-col gap-3">
        {/* Generation Error / Fallback Card */}
        {generationError && (
          <div className="bg-white border-2 border-red-200 rounded-2xl p-4 sm:p-5 shadow-lg flex flex-col gap-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2 text-[#D91820]">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <h4 className="text-sm font-bold">Chưa thể mô phỏng chủ đề này</h4>
              </div>
              <button
                type="button"
                onClick={() => setGenerationError(null)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
                aria-label="Đóng thông báo"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">
              {generationError}
            </p>
            <div className="flex flex-wrap gap-2 pt-1 items-center">
              <span className="text-[11px] font-semibold text-gray-500 mr-1">Bạn có thể chọn xem ngay các kịch bản mẫu:</span>
              {CURATED_PRESETS.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    handleSelectScenario(s);
                    setGenerationError(null);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-[#E31B23] text-xs font-bold border border-red-200 transition-colors"
                >
                  {s.title}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Search results dropdown */}
        {searchQuery.trim().length > 0 && !isGenerating && !generationError && (
          <div className="bg-white rounded-xl shadow-xl border border-gray-200 p-2 divide-y divide-gray-100">
            {filteredScenarios.length === 0 ? (
              <div className="p-4 text-center flex flex-col items-center gap-2">
                <p className="text-xs text-gray-500">
                  Không tìm thấy kịch bản mẫu phù hợp với "{searchQuery}".
                </p>
                <button
                  type="button"
                  onClick={() => handleGenerateWithGroq(searchQuery)}
                  disabled={isGenerating}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#D91820] to-[#F23841] text-white text-xs font-bold shadow hover:opacity-90 transition-opacity"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  {isGenerating ? 'Đang kiểm tra...' : `Kiểm tra hỗ trợ cho "${searchQuery}"`}
                </button>
              </div>
            ) : (
              <>
                {filteredScenarios.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => handleSearchSelect(s)}
                    className="w-full text-left p-3 hover:bg-red-50/60 rounded-lg flex items-center justify-between transition-colors group"
                  >
                    <div>
                      <h5 className="text-sm font-bold text-[#1A1A1A] group-hover:text-[#E31B23]">
                        {s.title}
                      </h5>
                      <p className="text-xs text-gray-500">{s.subtitle}</p>
                    </div>
                    <span className="text-[11px] font-bold text-[#E31B23] bg-red-50 px-2 py-0.5 rounded">
                      Mở kịch bản →
                    </span>
                  </button>
                ))}

                {/* Always offer Groq AI generation option at the bottom */}
                <div className="pt-2 px-2 pb-1 flex items-center justify-between text-xs text-gray-500">
                  <span className="text-[11px]">Không tìm thấy điều bạn muốn?</span>
                  <button
                    type="button"
                    onClick={() => handleGenerateWithGroq(searchQuery)}
                    disabled={isGenerating}
                    className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#E31B23] hover:underline"
                  >
                    <Sparkles className="w-3 h-3" />
                    Kiểm tra chủ đề bằng AI &rarr;
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* 2. Main Workbench Content Area */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 flex-1 flex flex-col gap-5">
        {/* Storyteller Banner (Concise Step Info) */}
        <StorytellerBanner
          scenario={activeScenario}
          step={currentStep}
          totalSteps={totalSteps}
        />

        {/* Dynamic Stage Renderers or AI Generation Loading Skeleton */}
        {isGenerating ? (
          <div className="relative w-full min-h-[480px] bg-white rounded-[16px] border border-[#EDEDED] shadow-[0_4px_16px_rgba(0,0,0,0.06)] p-8 flex flex-col items-center justify-center text-center overflow-hidden">
            {/* Background Radar Grid */}
            <div className="absolute inset-0 bg-[radial-gradient(#E31B23_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none" />

            {/* Pulse Radar Animation */}
            <div className="relative mb-6">
              <div className="w-20 h-20 rounded-full bg-red-100/60 animate-ping absolute inset-0 m-auto" />
              <div className="w-20 h-20 rounded-full bg-red-50 border-2 border-red-200 text-[#E31B23] flex items-center justify-center relative z-10 shadow-md">
                <Sparkles className="w-8 h-8 animate-pulse text-[#E31B23]" />
              </div>
            </div>

            <h3 className="text-lg sm:text-xl font-black text-[#1A1A1A] tracking-tight mb-2">
              Đang kiểm tra chủ đề: <span className="text-[#E31B23]">"{searchQuery || 'Chủ đề mới'}"</span>
            </h3>
            <p className="text-xs sm:text-sm text-gray-500 max-w-md mb-6 leading-relaxed">
              Đang kiểm tra dữ liệu và khả năng hỗ trợ cho chủ đề này...
            </p>

            {/* Stepper Pulse */}
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-400">
              <span className="px-3 py-1 rounded-full bg-red-50 text-[#E31B23] border border-red-200 animate-pulse">
                1. Phân loại cấu trúc
              </span>
              <span>&rarr;</span>
              <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-600">
                2. Dựng dữ liệu trực quan
              </span>
              <span>&rarr;</span>
              <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-600">
                3. Hoàn tất kịch bản
              </span>
            </div>
          </div>
        ) : (
          <div
            ref={stageContainerRef}
            data-playing={motionEnabled}
            className={`simulation-stage w-full relative rounded-[16px] overflow-hidden ${
              isFullscreen ? 'fixed inset-0 z-50 p-6 bg-[#F5F6F8] flex flex-col justify-center' : ''
            }`}
          >
            {/* Floating Zoom / Pan / Fullscreen Toolbar in top-right corner of canvas */}
            <div className="absolute top-3.5 right-3.5 z-30 flex items-center gap-1.5 bg-white/95 backdrop-blur-md p-1 rounded-xl border border-gray-200 shadow-sm select-none">
              {/* Pan tool toggle */}
              <button
                type="button"
                onClick={() => setIsPanMode(!isPanMode)}
                className={`p-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  isPanMode
                    ? 'bg-red-50 text-[#E31B23] border border-red-200'
                    : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
                }`}
                title={isPanMode ? 'Tắt chế độ kéo khung vẽ' : 'Bật kéo khung vẽ (Pan)'}
              >
                <Hand className="w-3.5 h-3.5" />
              </button>

              <div className="h-4 w-[1px] bg-gray-200 mx-0.5" />

              {/* Zoom Out */}
              <button
                type="button"
                onClick={handleZoomOut}
                disabled={zoom <= 0.65}
                className="p-1.5 rounded-lg text-gray-500 hover:text-gray-800 hover:bg-gray-100 disabled:opacity-30 transition-colors cursor-pointer"
                title="Thu nhỏ (-)"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>

              {/* Zoom % */}
              <button
                type="button"
                onClick={handleResetView}
                className="px-2 py-0.5 text-[11px] font-mono font-bold text-gray-700 hover:text-[#E31B23] rounded transition-colors cursor-pointer"
                title="Đưa về 100%"
              >
                {Math.round(zoom * 100)}%
              </button>

              {/* Zoom In */}
              <button
                type="button"
                onClick={handleZoomIn}
                disabled={zoom >= 1.8}
                className="p-1.5 rounded-lg text-gray-500 hover:text-gray-800 hover:bg-gray-100 disabled:opacity-30 transition-colors cursor-pointer"
                title="Phóng to (+)"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>

              <div className="h-4 w-[1px] bg-gray-200 mx-0.5" />

              {/* Reset view */}
              <button
                type="button"
                onClick={handleResetView}
                className="p-1.5 rounded-lg text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors cursor-pointer"
                title="Đặt lại khung nhìn (1:1)"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>

              {/* Fullscreen */}
              <button
                type="button"
                onClick={handleToggleFullscreen}
                className="p-1.5 rounded-lg text-gray-500 hover:text-[#E31B23] hover:bg-gray-100 transition-colors cursor-pointer"
                title={isFullscreen ? 'Thu nhỏ cửa sổ' : 'Phóng to toàn màn hình'}
              >
                {isFullscreen ? (
                  <Minimize2 className="w-3.5 h-3.5 text-[#E31B23]" />
                ) : (
                  <Maximize2 className="w-3.5 h-3.5" />
                )}
              </button>
            </div>

            {/* Transformable Canvas with Pan & Zoom */}
            <div
              className={`w-full overflow-hidden ${
                isPanMode ? (isPanning ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-default'
              }`}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              <div
                style={{
                  transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                  transformOrigin: 'center center',
                  transition: isPanning ? 'none' : 'transform 150ms ease-out',
                }}
              >
                {activeScenario.rendererType === 'swarm-2d' ? (
                  <Swarm2DRenderer step={currentStep} speed={speed} isPlaying={motionEnabled} />
                ) : activeScenario.rendererType === 'tree-graph' ? (
                  <TreeGraphRenderer step={currentStep} speed={speed} isPlaying={motionEnabled} />
                ) : activeScenario.rendererType === 'array-pointer' ? (
                  <ArrayPointerRenderer step={currentStep} speed={speed} isPlaying={motionEnabled} />
                ) : activeScenario.rendererType === 'grid-path' ? (
                  <GridPathRenderer
                    key={`${activeScenario.id}:${playbackSession}:${currentStepIndex}`}
                    nodes={activeScenario.nodes}
                    step={currentStep}
                    activeNodeIds={activeNodeIds}
                    speed={speed}
                    config={activeScenario.defaultGridConfig}
                  />
                ) : (
                  <FlowGraphRenderer
                    nodes={activeScenario.nodes}
                    step={currentStep}
                    activeNodeIds={activeNodeIds}
                    speed={speed}
                    isPlaying={motionEnabled}
                    laneTitles={activeScenario.laneTitles}
                  />
                )}
              </div>
            </div>
          </div>
        )}

        {/* Playback Dock */}
        <PlaybackDock
          currentStepIndex={currentStepIndex}
          totalSteps={totalSteps}
          isPlaying={isPlaying}
          speed={speed}
          onPlayPause={() => {
            if (!isPlaying) setPlaybackSession((session) => session + 1);
            setIsPlaying(!isPlaying);
          }}
          onPrev={handlePrevStep}
          onNext={handleNextStep}
          onReset={handleResetStep}
          onStepSelect={handleStepSelect}
          onSpeedChange={setSpeed}
        />
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-[#EDEDED] bg-white py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-[#757575] gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#E31B23]" />
            <span className="font-semibold text-[#1A1A1A]">TechViz Sandbox</span> &bull; Red-White Fintech Theme
          </div>
          <div className="flex items-center gap-1 text-[11px]">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#E31B23]" />
            Đồng bộ 100% Design Tokens từ <code className="font-mono text-gray-700">designPhongCachTechComBank.md</code>
          </div>
        </div>
      </footer>
    </div>
  );
}
