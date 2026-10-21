import { useState, useEffect, useMemo, useCallback } from 'react';
import { PRESET_SCENARIOS } from './data/presets';
import { SimulationScenario } from './types/simulation';
import { HeroHeader } from './components/HeroHeader';
import { FlowGraphRenderer } from './components/FlowGraphRenderer';
import { ArrayPointerRenderer } from './components/ArrayPointerRenderer';
import { GridPathRenderer } from './components/GridPathRenderer';
import { Swarm2DRenderer } from './components/Swarm2DRenderer';
import { TreeGraphRenderer } from './components/TreeGraphRenderer';
import { StorytellerBanner } from './components/StorytellerBanner';
import { PlaybackDock } from './components/PlaybackDock';
import { StudioStage } from './components/StudioStage';
import { generateScenarioWithGroq } from './services/groq';
import { AlertCircle, Sparkles, X } from 'lucide-react';

export default function App() {
  const [customScenarios, setCustomScenarios] = useState<SimulationScenario[]>([]);
  const allScenarios = useMemo(() => [...PRESET_SCENARIOS, ...customScenarios], [customScenarios]);

  const [activeScenario, setActiveScenario] = useState<SimulationScenario>(PRESET_SCENARIOS[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState<number>(1);

  // AI Generation State
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  // Set of currently active/online node IDs
  const [activeNodeIds, setActiveNodeIds] = useState<Set<string>>(
    () => new Set(PRESET_SCENARIOS[0].nodes.map((n) => n.id))
  );

  // Switch scenario handler
  const handleSelectScenario = useCallback((scenario: SimulationScenario) => {
    setActiveScenario(scenario);
    setCurrentStepIndex(0);
    setIsPlaying(false);
    setActiveNodeIds(new Set(scenario.nodes.map((n) => n.id)));
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

  // Select from search results
  const handleSearchSelect = (scenario: SimulationScenario) => {
    handleSelectScenario(scenario);
    setSearchQuery('');
  };

  // AI Scenario Generation with Groq or Instant Preset Selection
  const handleGenerateWithGroq = async (queryText: string) => {
    const trimmed = queryText.trim();
    if (!trimmed) return;

    const lower = trimmed.toLowerCase();
    const cleanLower = lower.replace(/^(thuật toán|giải thuật|công nghệ|hệ thống|mô hình)\s+/i, '').trim();
    const matchedPreset = allScenarios.find((s) => {
      const titleLower = s.title.toLowerCase();
      const idLower = s.id.toLowerCase();
      return (
        titleLower.includes(lower) ||
        (cleanLower && titleLower.includes(cleanLower)) ||
        idLower.includes(lower) ||
        (cleanLower && idLower.includes(cleanLower)) ||
        lower.includes(titleLower) ||
        (cleanLower && cleanLower.includes(titleLower)) ||
        (s.tags &&
          s.tags.some((t) => {
            const tl = t.toLowerCase();
            return tl === lower || tl === cleanLower || lower.includes(tl) || (cleanLower && cleanLower.includes(tl));
          }))
      );
    });

    if (matchedPreset) {
      handleSelectScenario(matchedPreset);
      setSearchQuery('');
      setGenerationError(null);
      return;
    }

    setIsGenerating(true);
    setGenerationError(null);

    try {
      const generated = await generateScenarioWithGroq(trimmed);
      setCustomScenarios((prev) => [generated, ...prev]);
      handleSelectScenario(generated);
      setSearchQuery('');
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
    setCurrentStepIndex((prev) => (prev < totalSteps - 1 ? prev + 1 : prev));
  }, [totalSteps]);

  const handlePrevStep = useCallback(() => {
    setCurrentStepIndex((prev) => (prev > 0 ? prev - 1 : 0));
  }, []);

  const handleResetStep = useCallback(() => {
    setCurrentStepIndex(0);
    setIsPlaying(false);
  }, []);

  const handleStepSelect = useCallback(
    (stepIdx: number) => {
      setCurrentStepIndex(Math.max(0, Math.min(stepIdx, totalSteps - 1)));
    },
    [totalSteps]
  );

  // Global Keyboard Navigation (ArrowLeft / ArrowRight) with strict input/textarea guard
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

  // Auto-play interval
  useEffect(() => {
    if (!isPlaying) return;

    const intervalTime = Math.round(3500 / speed);
    const timer = setInterval(() => {
      setCurrentStepIndex((prev) => {
        if (prev >= totalSteps - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [isPlaying, speed, totalSteps]);

  // Kiểm tra điều kiện hiển thị mảng: chỉ khi step hiện tại có arrayData hợp lệ
  const isArrayVisualizerActive =
    activeScenario.rendererType === 'array-pointer' &&
    Boolean(currentStep.arrayData?.array && currentStep.arrayData.array.length > 0);

  return (
    <div className="h-screen w-screen bg-[#F8FAFC] flex flex-col overflow-hidden font-['Plus_Jakarta_Sans',sans-serif] text-slate-800">
      {/* 1. Header (Compact & Focused) */}
      <HeroHeader
        scenarios={allScenarios}
        activeScenarioId={activeScenario.id}
        onSelectScenario={handleSelectScenario}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onGenerateWithGroq={handleGenerateWithGroq}
        isGenerating={isGenerating}
      />

      {/* Floating Overlay: Search Results Dropdown & Error Banner */}
      {(searchQuery.trim().length > 0 && !isGenerating) || generationError ? (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-50 max-w-2xl w-full px-4 flex flex-col gap-2">
          {/* Generation Error Banner */}
          {generationError && (
            <div className="bg-white border-2 border-red-200 rounded-2xl p-4 shadow-xl flex flex-col gap-2.5 backdrop-blur-md">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2 text-[#D91820]">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <h4 className="text-sm font-bold">Chưa thể sinh kịch bản cho chủ đề này</h4>
                </div>
                <button
                  type="button"
                  onClick={() => setGenerationError(null)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded"
                  aria-label="Đóng thông báo"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                {generationError}
              </p>
              <div className="flex flex-wrap gap-1.5 pt-1 items-center">
                <span className="text-[11px] font-semibold text-slate-500 mr-1">Gợi ý xem kịch bản mẫu:</span>
                {PRESET_SCENARIOS.slice(0, 4).map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      handleSelectScenario(s);
                      setGenerationError(null);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-[#E31B23] text-xs font-bold border border-red-200 transition-colors"
                  >
                    {s.title}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Search Results Dropdown */}
          {searchQuery.trim().length > 0 && !isGenerating && !generationError && (
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-2 divide-y divide-slate-100 max-h-[380px] overflow-y-auto">
              {filteredScenarios.length === 0 ? (
                <div className="p-4 text-center flex flex-col items-center gap-2">
                  <p className="text-xs text-slate-500">
                    Không tìm thấy kịch bản mẫu khớp với "{searchQuery}".
                  </p>
                  <button
                    type="button"
                    onClick={() => handleGenerateWithGroq(searchQuery)}
                    disabled={isGenerating}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#D91820] to-[#E31B23] text-white text-xs font-bold shadow-xs hover:opacity-95 transition-opacity"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Sinh kịch bản "{searchQuery}" bằng AI
                  </button>
                </div>
              ) : (
                <>
                  {filteredScenarios.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => handleSearchSelect(s)}
                      className="w-full text-left p-2.5 hover:bg-red-50/70 rounded-xl flex items-center justify-between transition-colors group cursor-pointer"
                    >
                      <div className="min-w-0 pr-2">
                        <h5 className="text-xs font-bold text-slate-900 group-hover:text-[#E31B23] truncate">
                          {s.title}
                        </h5>
                        <p className="text-[11px] text-slate-500 truncate">{s.subtitle}</p>
                      </div>
                      <span className="text-[11px] font-bold text-[#E31B23] bg-red-50 px-2 py-0.5 rounded-full shrink-0">
                        Xem &rarr;
                      </span>
                    </button>
                  ))}

                  <div className="pt-2 px-2 pb-1 flex items-center justify-between text-xs text-slate-500">
                    <span className="text-[11px]">Không tìm thấy chủ đề cần xem?</span>
                    <button
                      type="button"
                      onClick={() => handleGenerateWithGroq(searchQuery)}
                      disabled={isGenerating}
                      className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#E31B23] hover:underline cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3" />
                      Sinh mới bằng Groq AI &rarr;
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      ) : null}

      {/* 2. Main "Split-View Studio Layout" (100% Zero-Scroll Viewport Fill) */}
      <main className="flex-1 w-full p-2.5 sm:p-3 overflow-hidden flex flex-col lg:flex-row gap-3 min-h-0">
        {/* CỘT TRÁI (35% Chiều rộng): Khung Kiến thức, Mã giả, Biến số */}
        <div className="w-full lg:w-[360px] xl:w-[410px] 2xl:w-[450px] h-full shrink-0 flex flex-col min-h-0">
          <StorytellerBanner
            scenario={activeScenario}
            step={currentStep}
            totalSteps={totalSteps}
          />
        </div>

        {/* CỘT PHẢI (65% Chiều rộng): Sân khấu Trực quan hóa + Floating Playback Dock */}
        <div className="flex-1 h-full min-w-0 flex flex-col min-h-0">
          <StudioStage
            scenarioTitle={activeScenario.title}
            category={activeScenario.category}
            rendererType={activeScenario.rendererType}
            playbackDock={
              <PlaybackDock
                currentStepIndex={currentStepIndex}
                totalSteps={totalSteps}
                isPlaying={isPlaying}
                speed={speed}
                onPlayPause={() => setIsPlaying(!isPlaying)}
                onPrev={handlePrevStep}
                onNext={handleNextStep}
                onReset={handleResetStep}
                onStepSelect={handleStepSelect}
                onSpeedChange={setSpeed}
              />
            }
          >
            {isGenerating ? (
              <div className="relative w-full h-full min-h-[440px] bg-white rounded-2xl border border-slate-200/90 shadow-xs p-8 flex flex-col items-center justify-center text-center overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(#E31B23_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none" />

                <div className="relative mb-5">
                  <div className="w-16 h-16 rounded-full bg-red-100/60 animate-ping absolute inset-0 m-auto" />
                  <div className="w-16 h-16 rounded-full bg-red-50 border-2 border-red-200 text-[#E31B23] flex items-center justify-center relative z-10 shadow-sm">
                    <Sparkles className="w-7 h-7 animate-pulse text-[#E31B23]" />
                  </div>
                </div>

                <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight mb-1.5">
                  Đang phân tích &amp; dựng mô phỏng: <span className="text-[#E31B23]">"{searchQuery || 'Chủ đề mới'}"</span>
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mb-5 leading-relaxed">
                  Groq AI đang tự động phân loại cấu trúc thuật toán và sinh các bước mô phỏng tương tác sinh động...
                </p>

                <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
                  <span className="px-2.5 py-0.5 rounded-full bg-red-50 text-[#E31B23] border border-red-200 animate-pulse">
                    1. Phân loại cấu trúc
                  </span>
                  <span>&rarr;</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
                    2. Dựng dữ liệu trực quan
                  </span>
                  <span>&rarr;</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
                    3. Hoàn tất kịch bản
                  </span>
                </div>
              </div>
            ) : (
              <div className="w-full h-full">
                {activeScenario.rendererType === 'swarm-2d' ? (
                  <Swarm2DRenderer step={currentStep} speed={speed} />
                ) : activeScenario.rendererType === 'tree-graph' ? (
                  <TreeGraphRenderer step={currentStep} speed={speed} />
                ) : isArrayVisualizerActive ? (
                  <ArrayPointerRenderer step={currentStep} speed={speed} />
                ) : activeScenario.rendererType === 'grid-path' ? (
                  <GridPathRenderer
                    nodes={activeScenario.nodes}
                    step={currentStep}
                    activeNodeIds={activeNodeIds}
                    speed={speed}
                  />
                ) : (
                  <FlowGraphRenderer
                    nodes={activeScenario.nodes}
                    step={currentStep}
                    activeNodeIds={activeNodeIds}
                    speed={speed}
                    laneTitles={activeScenario.laneTitles}
                  />
                )}
              </div>
            )}
          </StudioStage>
        </div>
      </main>
    </div>
  );
}
