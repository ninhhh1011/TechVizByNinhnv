import { FC } from 'react';
import { Chip, Button } from '@heroui/react';
import { Search, Sparkles, Terminal, Loader2, X } from 'lucide-react';
import { SimulationScenario } from '../types/simulation';
import { getShortChipName } from '../services/capabilities';
export { getShortChipName } from '../services/capabilities';

interface HeroHeaderProps {
  scenarios: SimulationScenario[];
  activeScenarioId: string;
  onSelectScenario: (scenario: SimulationScenario) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onGenerateWithGroq?: (query: string) => void;
  isGenerating?: boolean;
}

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
    <header className="relative w-full bg-gradient-to-b from-[#B80D14] via-[#E31B23] to-[#F5F6F8] pt-8 pb-12 px-4 sm:px-6 lg:px-8 text-white transition-all overflow-hidden">
      {/* Background Decorative Grid */}
      <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px]" />

      <div className="relative max-w-7xl mx-auto flex flex-col items-center text-center">
        {/* Top Glassmorphism Pill Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-[16px] bg-gradient-to-br from-white/35 to-white/15 backdrop-blur-[12px] border border-white/65 shadow-[inset_0_1px_2px_rgba(255,255,255,0.5)] mb-3">
          <Sparkles className="w-4 h-4 text-white drop-shadow" />
          <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-white">
            PHÒNG LAB TRỰC QUAN HÓA HỆ THỐNG
          </span>
        </div>

        {/* Title & Slogan */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white drop-shadow-sm mb-3">
          TechViz Sandbox <span className="font-light text-white/90">Encyclopedia</span>
        </h1>
        <p className="max-w-2xl text-white/90 text-sm sm:text-base mb-6 leading-relaxed">
          Khám phá kịch bản thuật toán &amp; công nghệ đã được biên soạn. Với chủ đề khác, hệ thống sẽ kiểm tra khả năng hỗ trợ trước khi hiển thị mô phỏng.
        </p>

        {/* Central Search Bar with AI Generation Trigger (Padded container & borderless input) */}
        <div className="w-full max-w-3xl shadow-xl rounded-2xl bg-white/95 backdrop-blur-md pl-4 sm:pl-5 pr-1.5 sm:pr-2 py-1.5 border border-white/40 mb-3 transition-all hover:shadow-2xl flex items-center gap-3">
          {/* Icon kính lúp với khoảng đệm trái rộng rãi */}
          <Search className="w-5 h-5 text-[#E31B23] shrink-0" />

          {/* Ô nhập input co giãn mượt mà, hoàn toàn không viền, không outline */}
          <div className="flex-1 flex items-center min-w-0">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Nhập thuật toán hoặc công nghệ (VD: Kafka, Bubble pass [3,1,2])"
              aria-label="Chủ đề cần trực quan hóa"
              maxLength={200}
              className="w-full bg-transparent border-0 outline-none text-xs sm:text-sm text-[#1A1A1A] placeholder:text-[#757575] font-medium py-2.5 focus:outline-none focus:ring-0"
              style={{
                border: 'none',
                outline: 'none',
                boxShadow: 'none',
                background: 'transparent',
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="p-1 text-gray-400 hover:text-[#E31B23] transition-colors shrink-0 ml-1 rounded-full hover:bg-gray-100"
                aria-label="Xóa nội dung tìm kiếm"
                title="Xóa tìm kiếm"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Nút bấm Trực quan hóa */}
          {onGenerateWithGroq && (
            <Button
              size="md"
              color="primary"
              onClick={() => searchQuery.trim() && onGenerateWithGroq(searchQuery.trim())}
              disabled={!searchQuery.trim() || isGenerating}
              className="bg-gradient-to-r from-[#D91820] to-[#F23841] text-white font-bold text-xs sm:text-sm h-11 sm:h-12 px-4 sm:px-6 shadow-md shrink-0 rounded-xl flex items-center gap-1.5 transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              startContent={
                isGenerating ? (
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                ) : (
                  <Sparkles className="w-4 h-4 text-white" />
                )
              }
            >
              {isGenerating ? 'Đang kiểm tra...' : 'Trực quan hóa'}
            </Button>
          )}
        </div>

        {/* Preset Quick Chips */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
          <span className="text-xs text-white/80 font-medium mr-1 flex items-center gap-1">
            <Terminal className="w-3.5 h-3.5" /> Thử nhanh:
          </span>
          {scenarios.map((scenario) => {
            const isSelected = scenario.id === activeScenarioId;
            return (
              <Chip
                as="button"
                type="button"
                aria-pressed={isSelected}
                key={scenario.id}
                onClick={() => onSelectScenario(scenario)}
                className={`cursor-pointer transition-all duration-200 font-semibold text-xs py-1 px-3 ${
                  isSelected
                    ? 'bg-white text-[#E31B23] shadow-md scale-105 font-bold'
                    : 'bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm border border-white/30'
                }`}
                variant="flat"
              >
                {getShortChipName(scenario)}
              </Chip>
            );
          })}
        </div>
      </div>
    </header>
  );
};
