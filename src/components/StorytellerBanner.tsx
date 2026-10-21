import React, { FC, useState } from 'react';
import {
  BookOpen,
  Code2,
  Cpu,
  Variable,
  Layers,
  ChevronDown,
  ChevronUp,
  Sparkles,
  CheckCircle2,
  ExternalLink,
  HelpCircle,
} from 'lucide-react';
import { SimulationScenario, SimulationStep } from '../types/simulation';

interface StorytellerBannerProps {
  scenario: SimulationScenario;
  step: SimulationStep;
  totalSteps: number;
}

export const StorytellerBanner: FC<StorytellerBannerProps> = ({
  scenario,
  step,
  totalSteps,
}) => {
  const [isOverviewExpanded, setIsOverviewExpanded] = useState(true);

  // Fallback mental model & complexity if academicOverview is not explicitly present
  const academic = scenario.academicOverview;
  const mentalModel =
    academic?.mentalModel ||
    scenario.summary ||
    scenario.subtitle ||
    scenario.description ||
    'Hiểu nhanh nguyên lý hoạt động cốt lõi của chủ đề.';

  const complexityOrPrinciple =
    academic?.complexityOrPrinciple ||
    (scenario.category === 'Algorithms'
      ? 'Độ phức tạp thời gian: O(N log N) trung bình, không gian bộ nhớ: O(1) - O(N).'
      : 'Nguyên lý hệ thống: Tính khả dụng cao (HA), phân vùng dữ liệu và đảm bảo tính nhất quán cuối cùng.');

  const useCases = academic?.useCases && academic.useCases.length > 0
    ? academic.useCases
    : scenario.tags || ['Tối ưu hóa', 'Hệ thống chịu tải', 'Kỹ thuật phần mềm'];

  // Step state mutation or variables
  const stateVars = step.stateVariables || step.stateMutation || (
    typeof step.payloadSample === 'object' ? step.payloadSample : null
  );

  return (
    <div className="w-full flex flex-col gap-3 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* ========================================================= */}
      {/* 1. KHUNG TỔNG QUAN KIẾN THỨC (ACADEMIC CONCEPT OVERVIEW) */}
      {/* ========================================================= */}
      <div className="w-full bg-white rounded-[16px] border border-[#EDEDED] shadow-[0_4px_16px_rgba(0,0,0,0.05)] p-4 sm:p-5 transition-all">
        {/* Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#F0F0F0]">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="text-base sm:text-xl font-black text-[#1A1A1A] tracking-tight">
              {scenario.title}
            </span>
            <span className="text-[11px] font-bold text-[#E31B23] bg-red-50 border border-red-200 px-2.5 py-0.5 rounded-full">
              {scenario.category || 'Thuật toán & Hệ thống'}
            </span>
            {scenario.rendererType && (
              <span className="text-[10px] font-mono text-gray-500 bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
                Mode: {scenario.rendererType}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsOverviewExpanded(!isOverviewExpanded)}
              className="inline-flex items-center gap-1 text-xs font-bold text-gray-500 hover:text-[#E31B23] px-2.5 py-1 rounded-lg bg-gray-50 hover:bg-red-50 border border-gray-200 transition-colors cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5 text-[#E31B23]" />
              {isOverviewExpanded ? 'Thu gọn lý thuyết' : 'Mở rộng lý thuyết'}
              {isOverviewExpanded ? <ChevronUp className="w-3 h-3 ml-0.5" /> : <ChevronDown className="w-3 h-3 ml-0.5" />}
            </button>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-red-50 to-red-100/80 border border-red-200 text-[#D91820] font-black text-xs uppercase tracking-wider">
              Bước {step.stepIndex} / {totalSteps}
            </div>
          </div>
        </div>

        {/* 3 Academic Pillars Grid (Collapsible) */}
        {isOverviewExpanded && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3.5 mt-1">
            {/* Pillar 1: Bản chất & Mental Model */}
            <div className="flex flex-col p-3 rounded-xl bg-gradient-to-br from-[#FAFAFB] to-white border border-[#E5E7EB] shadow-xs">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#1A1A1A] mb-1.5">
                <div className="p-1 rounded-md bg-red-50 text-[#E31B23]">
                  <HelpCircle className="w-3.5 h-3.5" />
                </div>
                <span>Bản chất &amp; Mô hình Trực quan</span>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed font-normal">
                {mentalModel}
              </p>
            </div>

            {/* Pillar 2: Cơ sở lý thuyết & Độ phức tạp */}
            <div className="flex flex-col p-3 rounded-xl bg-gradient-to-br from-[#FAFAFB] to-white border border-[#E5E7EB] shadow-xs">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#1A1A1A] mb-1.5">
                <div className="p-1 rounded-md bg-blue-50 text-blue-600">
                  <Cpu className="w-3.5 h-3.5" />
                </div>
                <span>Cơ sở Lý thuyết &amp; Độ phức tạp</span>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed font-normal">
                {complexityOrPrinciple}
              </p>
            </div>

            {/* Pillar 3: Ứng dụng thực tế */}
            <div className="flex flex-col p-3 rounded-xl bg-gradient-to-br from-[#FAFAFB] to-white border border-[#E5E7EB] shadow-xs">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#1A1A1A] mb-1.5">
                <div className="p-1 rounded-md bg-emerald-50 text-emerald-600">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <span>Ứng dụng Thực tiễn</span>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-0.5">
                {useCases.map((uc, i) => (
                  <span
                    key={i}
                    className="text-[10px] font-semibold text-gray-700 bg-white border border-gray-200 px-2 py-0.5 rounded-md"
                  >
                    &bull; {uc}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* 2. KHUNG CHI TIẾT BƯỚC CHẠY (STEP DEEP-DIVE INSPECTOR)   */}
      {/* ========================================================= */}
      <div className="w-full bg-white rounded-[16px] border border-[#EDEDED] shadow-[0_4px_16px_rgba(0,0,0,0.05)] p-4 sm:p-5 transition-all">
        {/* 2.1 Diễn giải Bước hiện tại */}
        <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-3 p-3.5 rounded-xl bg-gradient-to-r from-red-50/70 via-red-50/30 to-white border border-red-100">
          <div className="flex items-center gap-2 shrink-0">
            <span className="w-2.5 h-2.5 rounded-full bg-[#E31B23] animate-ping" />
            <h3 className="text-sm sm:text-base font-extrabold text-[#1A1A1A]">
              {step.title}
            </h3>
          </div>
          <p className="text-xs sm:text-sm text-gray-700 leading-relaxed font-normal sm:ml-auto">
            {step.explanation}
          </p>
        </div>

        {/* 2.2 Hai cột Inspector: Mã giả/Công thức & Biến số trực tiếp */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 mt-3 pt-1">
          {/* Cột Trái: Công thức / Mã giả thực thi (logicCode) */}
          <div className="flex flex-col rounded-xl bg-[#1E1E24] text-white p-3.5 border border-gray-800 shadow-md">
            <div className="flex items-center justify-between pb-2 border-b border-gray-700/80 mb-2">
              <span className="text-[11px] font-bold text-gray-300 flex items-center gap-1.5 uppercase tracking-wider">
                <Code2 className="w-3.5 h-3.5 text-[#E31B23]" />
                Mã giả / Công thức thực thi
              </span>
              <span className="text-[10px] font-mono text-gray-400 bg-white/10 px-1.5 py-0.5 rounded">
                Step #{step.stepIndex}
              </span>
            </div>
            <pre className="font-mono text-xs text-red-200/90 whitespace-pre-wrap break-words leading-relaxed overflow-x-hidden">
              {step.logicCode || `// Thực thi bước ${step.stepIndex}: ${step.title}\nexecute(${step.stepIndex});`}
            </pre>
          </div>

          {/* Cột Phải: Biến số & Trạng thái thay đổi (stateVariables) */}
          <div className="flex flex-col rounded-xl bg-[#F5F6F8] p-3.5 border border-[#E5E7EB] shadow-xs justify-between">
            <div>
              <div className="flex items-center justify-between pb-2 border-b border-gray-200 mb-2.5">
                <span className="text-[11px] font-bold text-gray-700 flex items-center gap-1.5 uppercase tracking-wider">
                  <Variable className="w-3.5 h-3.5 text-[#E31B23]" />
                  Biến số &amp; Trạng thái trực tiếp
                </span>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                  LIVE MUTATION
                </span>
              </div>

              {stateVars && typeof stateVars === 'object' ? (
                <div className="grid grid-cols-2 sm:grid-cols-2 gap-2">
                  {Object.entries(stateVars).map(([key, val], idx) => (
                    <div
                      key={idx}
                      className="flex flex-col p-2 rounded-lg bg-white border border-gray-200 shadow-2xs"
                    >
                      <span className="text-[10px] font-semibold text-gray-500 truncate" title={key}>
                        {key}
                      </span>
                      <span className="font-mono text-xs font-bold text-[#1A1A1A] truncate" title={String(val)}>
                        {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-500 italic">
                  Đang ghi nhận biến số trạng thái...
                </p>
              )}
            </div>

            <div className="mt-2.5 pt-2 border-t border-gray-200/80 flex items-center justify-between text-[10px] text-gray-500">
              <span>Đồng bộ thời gian thực theo từng nhịp mô phỏng</span>
              <span className="font-bold text-[#E31B23]">TechViz Engine v2.0</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
