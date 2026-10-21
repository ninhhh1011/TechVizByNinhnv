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
import { ApiKeyModal } from './components/ApiKeyModal';
import { generateScenarioWithGroq } from './services/groq';
import { hasGroqApiKey } from './services/apiKey';
import { AlertCircle, Sparkles, X, CheckCircle2 } from 'lucide-react';

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
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);

  // Set of currently active/online node IDs (Chaos Engineering state)
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

  // Filter presets based on search query
  const filteredScenarios = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return allScenarios;
    return allScenarios.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        (s.subtitle && s.subtitle.toLowerCase().includes(q)) ||
        (s.summary && s.summary.toLowerCase().includes(q)) ||
        (s.category && s.category.toLowerCase().includes(q)) ||
        (s.tags && s.tags.some((t) => t.toLowerCase().includes(q))) ||
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

    // 1. Kiểm tra nhanh nếu từ khóa khớp với preset có sẵn
    const lower = trimmed.toLowerCase();
    const matchedPreset = allScenarios.find(
      (s) =>
        s.title.toLowerCase().includes(lower) ||
        s.id.toLowerCase().includes(lower) ||
        lower.includes(s.title.toLowerCase()) ||
        (s.tags && s.tags.some((t) => t.toLowerCase() === lower))
    );

    if (matchedPreset) {
      handleSelectScenario(matchedPreset);
      setSearchQuery('');
      setGenerationError(null);
      return;
    }

    // 2. Nếu là chủ đề tự do mới, gọi Groq AI
    if (!hasGroqApiKey()) {
      setGenerationError('MISSING_API_KEY: Vui lòng thiết lập Groq API Key để kích hoạt tính năng sinh mô phỏng kịch bản mới.');
      setIsKeyModalOpen(true);
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
      const msg = err?.message || 'Lỗi khi phân tích và tạo kịch bản với Groq Cloud API. Vui lòng thử lại.';
      if (msg.includes('MISSING_API_KEY') || msg.includes('INVALID_API_KEY')) {
        setIsKeyModalOpen(true);
      }
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

  const handleStepSelect = useCallback((stepIdx: number) => {
    setCurrentStepIndex(Math.max(0, Math.min(stepIdx, totalSteps - 1)));
  }, [totalSteps]);

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

  // Kiểm tra điều kiện hiển thị mảng: chỉ khi step hiện tại thực sự có dữ liệu array hợp lệ
  const isArrayVisualizerActive =
    activeScenario.rendererType === 'array-pointer' &&
    Boolean(currentStep.arrayData?.array && currentStep.arrayData.array.length > 0);

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
              {generationError.includes('MISSING_API_KEY')
                ? 'Chưa cấu hình Groq API Key. Bạn có thể cài đặt key hoặc thử nhanh các thuật toán / công nghệ sẵn có dưới đây.'
                : 'Hệ thống hỗ trợ trực quan hóa tối ưu cho các thuật toán mảng, tìm đường và kiến trúc phân tán. Bạn có thể chọn xem ngay các kịch bản mẫu:'}
            </p>
            <div className="flex flex-wrap gap-2 pt-1 items-center">
              {PRESET_SCENARIOS.map((s) => (
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
              <button
                type="button"
                onClick={() => setIsKeyModalOpen(true)}
                className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold border border-gray-300 transition-colors sm:ml-auto"
              >
                Cài đặt Groq Key
              </button>
            </div>
          </div>
        )}

        {/* Search results dropdown (Tự động ẩn ngay khi isGenerating hoặc có generationError để không đè layout) */}
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
                  {isGenerating ? 'Đang tạo bằng AI...' : `Tự động sinh kịch bản "${searchQuery}" bằng Groq AI`}
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
                    Sinh mới bằng Groq AI &rarr;
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* 2. Main Workbench Content Area (Full-Width Hero Visualizer) */}
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
              Đang phân tích &amp; dựng mô phỏng: <span className="text-[#E31B23]">"{searchQuery || 'Chủ đề mới'}"</span>
            </h3>
            <p className="text-xs sm:text-sm text-gray-500 max-w-md mb-6 leading-relaxed">
              Trí tuệ nhân tạo đang tự động phân loại cấu trúc thuật toán và kiến tạo các bước mô phỏng tương tác sinh động...
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
          <div className="w-full">
            {activeScenario.rendererType === 'swarm-2d' ? (
              <Swarm2DRenderer
                step={currentStep}
                speed={speed}
              />
            ) : activeScenario.rendererType === 'tree-graph' ? (
              <TreeGraphRenderer
                step={currentStep}
                speed={speed}
              />
            ) : isArrayVisualizerActive ? (
              <ArrayPointerRenderer
                step={currentStep}
                speed={speed}
              />
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

        {/* Playback Dock */}
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

      {/* Groq API Key Configuration Modal */}
      <ApiKeyModal
        isOpen={isKeyModalOpen}
        onClose={() => setIsKeyModalOpen(false)}
        onKeySaved={() => {
          setGenerationError(null);
        }}
      />
    </div>
  );
}
