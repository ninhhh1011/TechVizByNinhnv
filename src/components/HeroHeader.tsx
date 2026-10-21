import { FC } from 'react';
import { Search, Sparkles, Loader2, X, Compass, Terminal } from 'lucide-react';
import { SimulationScenario } from '../types/simulation';

interface HeroHeaderProps {
  scenarios: SimulationScenario[];
  activeScenarioId: string;
  onSelectScenario: (scenario: SimulationScenario) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onGenerateWithGroq?: (query: string) => void;
  isGenerating?: boolean;
}

const getShortChipName = (s: SimulationScenario): string => {
  switch (s.id) {
    case 'apache-kafka':
      return 'Kafka';
    case 'redis-cache':
      return 'Redis Cache';
    case 'rag-pipeline':
      return 'RAG Pipeline';
    case 'quick-sort':
      return 'QuickSort';
    case 'binary-search':
      return 'Binary Search';
    case 'astar-dijkstra-grid':
      return 'A* Grid';
    case 'genetic-algorithm-ga':
      return 'PSO 2D';
    case 'merge-sort':
      return 'MergeSort';
    case 'bubble-sort':
      return 'BubbleSort';
    case 'load-balancer':
      return 'Load Balancer';
    case 'token-bucket':
      return 'Rate Limiter';
    default:
      return s.title;
  }
};

export const HeroHeader: FC<HeroHeaderProps> = ({
  scenarios,
  activeScenarioId,
  onSelectScenario,
  searchQuery,
  onSearchChange,
  onGenerateWithGroq,
  isGenerating = false,
}) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim() && onGenerateWithGroq && !isGenerating) {
      onGenerateWithGroq(searchQuery.trim());
    }
  };

  return (
    <header className="relative w-full bg-white border-b border-slate-200/90 shadow-xs z-30 select-none">
      <div className="max-w-[1720px] mx-auto px-4 sm:px-6 py-2.5 flex flex-col lg:flex-row items-center justify-between gap-2.5">
        
        {/* 1. Left Brand Identity (Compact & Professional) */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#D91820] to-[#E31B23] flex items-center justify-center text-white shadow-sm">
            <Compass className="w-4 h-4 animate-spin-slow" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-base font-black tracking-tight text-slate-900 font-['Plus_Jakarta_Sans',sans-serif]">
              TechViz <span className="text-[#E31B23]">Studio</span>
            </span>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200/80">
              Zero-Scroll v2.5
            </span>
          </div>
        </div>

        {/* 2. Center: High-Prominence Search Input with Immediate Accessibility */}
        <div className="w-full lg:max-w-2xl flex-1 flex items-center">
          <div className="w-full relative flex items-center bg-slate-50 hover:bg-slate-100/80 focus-within:bg-white rounded-xl border border-slate-300/80 focus-within:border-[#E31B23] focus-within:ring-2 focus-within:ring-red-100 transition-all p-1 shadow-2xs">
            <Search className="w-4 h-4 text-slate-400 ml-2.5 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Nhập tên thuật toán hoặc công nghệ bất kỳ (VD: MergeSort, LRU Cache, A*, Kafka...)"
              className="w-full bg-transparent border-0 outline-none px-3 py-1.5 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 font-medium focus:ring-0"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200/60 mr-1.5 transition-colors"
                title="Xóa tìm kiếm"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            {onGenerateWithGroq && (
              <button
                type="button"
                onClick={() => searchQuery.trim() && onGenerateWithGroq(searchQuery.trim())}
                disabled={!searchQuery.trim() || isGenerating}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-[#D91820] to-[#E31B23] text-white text-xs font-bold shadow-xs hover:opacity-95 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
              >
                {isGenerating ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5" />
                )}
                <span className="hidden sm:inline">Trực quan hóa</span>
              </button>
            )}
          </div>
        </div>

        {/* 3. Right: Quick Chips Carousel (Compact & Scrollable) */}
        <div className="w-full lg:w-auto flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 shrink-0">
          <span className="text-[11px] font-semibold text-slate-400 shrink-0 flex items-center gap-1 mr-1">
            <Terminal className="w-3 h-3 text-[#E31B23]" /> Mẫu:
          </span>
          {scenarios.map((scenario) => {
            const isSelected = scenario.id === activeScenarioId;
            return (
              <button
                key={scenario.id}
                type="button"
                onClick={() => onSelectScenario(scenario)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-200 border cursor-pointer ${
                  isSelected
                    ? 'bg-red-50 text-[#E31B23] border-red-200 shadow-2xs font-bold scale-102'
                    : 'bg-white text-slate-600 hover:text-slate-900 border-slate-200/90 hover:bg-slate-50'
                }`}
              >
                {getShortChipName(scenario)}
              </button>
            );
          })}
        </div>

      </div>
    </header>
  );
};
