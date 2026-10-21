import React, { FC, useState } from 'react';
import {
  BookOpen,
  Code2,
  Cpu,
  Variable,
  Layers,
  Sparkles,
  CheckCircle2,
  HelpCircle,
  Briefcase,
  Copy,
  Check,
  ChevronRight,
  Zap,
} from 'lucide-react';
import { SimulationScenario, SimulationStep } from '../types/simulation';

interface StorytellerBannerProps {
  scenario: SimulationScenario;
  step: SimulationStep;
  totalSteps: number;
}

type TabType = 'mentalModel' | 'complexity' | 'useCases';

export const StorytellerBanner: FC<StorytellerBannerProps> = ({
  scenario,
  step,
  totalSteps,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('mentalModel');
  const [copiedCode, setCopiedCode] = useState(false);

  // Fallbacks for academic pillars
  const academic = scenario.academicOverview;
  const mentalModel =
    academic?.mentalModel ||
    scenario.summary ||
    scenario.subtitle ||
    scenario.description ||
    'Hiểu nhanh nguyên lý hoạt động cốt lõi qua mô hình trực quan sinh động.';

  const complexityOrPrinciple =
    academic?.complexityOrPrinciple ||
    (scenario.category === 'Algorithms'
      ? 'Độ phức tạp thời gian: O(N log N) trung bình, không gian bộ nhớ: O(1) - O(N).'
      : 'Nguyên lý hệ thống: Khả năng mở rộng ngang (Horizontal Scaling), phân vùng dữ liệu và đảm bảo tính nhất quán.');

  const useCases =
    academic?.useCases && academic.useCases.length > 0
      ? academic.useCases
      : scenario.tags || ['Tối ưu hóa', 'Hệ thống chịu tải cao', 'Fintech Architecture'];

  // State variables or mutations
  const stateVars =
    step.stateVariables ||
    step.stateMutation ||
    (typeof step.payloadSample === 'object' && step.payloadSample !== null
      ? step.payloadSample
      : null);

  const handleCopyCode = () => {
    const code = step.logicCode || `// Step #${step.stepIndex}: ${step.title}\nexecute(${step.stepIndex});`;
    navigator.clipboard?.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 1800);
  };

  return (
    <aside className="w-full h-full flex flex-col gap-3 font-['Plus_Jakarta_Sans',sans-serif] text-slate-800 select-none">
      {/* ========================================================= */}
      {/* 1. KHUNG TỔNG QUAN KIẾN THỨC (ACADEMIC KNOWLEDGE TABS)    */}
      {/* ========================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-4 flex flex-col gap-3 shrink-0 transition-all">
        {/* Scenario Header Info */}
        <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-slate-100">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#E31B23] bg-red-50 border border-red-200/80 px-2 py-0.5 rounded-full">
                {scenario.category || 'Thuật toán & Hệ thống'}
              </span>
              <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200/80">
                Mode: {scenario.rendererType || 'flow-graph'}
              </span>
            </div>
            <h2 className="text-base font-black text-slate-900 tracking-tight leading-snug truncate" title={scenario.title}>
              {scenario.title}
            </h2>
          </div>

          <div className="shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-50 text-[#E31B23] border border-red-200/90 text-[11px] font-extrabold">
            <span className="w-1.5 h-1.5 rounded-full bg-[#E31B23] animate-ping mr-0.5" />
            B{step.stepIndex + 1}/{totalSteps}
          </div>
        </div>

        {/* 3 Segmented Tabs */}
        <div className="grid grid-cols-3 gap-1 bg-slate-100/90 p-1 rounded-xl text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('mentalModel')}
            className={`flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg transition-all cursor-pointer ${
              activeTab === 'mentalModel'
                ? 'bg-white text-slate-900 shadow-xs font-extrabold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5 text-[#E31B23]" />
            <span className="truncate">Bản chất</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('complexity')}
            className={`flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg transition-all cursor-pointer ${
              activeTab === 'complexity'
                ? 'bg-white text-slate-900 shadow-xs font-extrabold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Cpu className="w-3.5 h-3.5 text-blue-600" />
            <span className="truncate">Lý thuyết</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('useCases')}
            className={`flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg transition-all cursor-pointer ${
              activeTab === 'useCases'
                ? 'bg-white text-slate-900 shadow-xs font-extrabold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5 text-emerald-600" />
            <span className="truncate">Thực tế</span>
          </button>
        </div>

        {/* Tab Content Display */}
        <div className="text-xs text-slate-600 leading-relaxed min-h-[58px] flex items-center">
          {activeTab === 'mentalModel' && (
            <div className="flex items-start gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 w-full">
              <Zap className="w-3.5 h-3.5 text-[#E31B23] shrink-0 mt-0.5" />
              <p className="font-medium text-slate-700 leading-relaxed text-xs">
                {mentalModel}
              </p>
            </div>
          )}

          {activeTab === 'complexity' && (
            <div className="flex items-start gap-2 bg-blue-50/60 p-2.5 rounded-xl border border-blue-200/70 w-full">
              <Cpu className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
              <p className="font-medium text-blue-900 leading-relaxed text-xs">
                {complexityOrPrinciple}
              </p>
            </div>
          )}

          {activeTab === 'useCases' && (
            <div className="flex flex-wrap gap-1.5 w-full bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-200/70">
              {useCases.map((uc, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-900 bg-white border border-emerald-200 px-2 py-0.5 rounded-md shadow-2xs"
                >
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  {uc}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2. KHUNG CHI TIẾT BƯỚC ĐANG CHẠY (STEP DEEP INSPECTOR)     */}
      {/* ========================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-4 flex-1 flex flex-col gap-3 min-h-0 overflow-y-auto no-scrollbar">
        {/* Step Title & Subtitle Badge */}
        <div className="p-3 rounded-xl bg-gradient-to-r from-red-50/80 via-red-50/30 to-slate-50 border border-red-100 flex flex-col gap-1 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#E31B23] animate-ping shrink-0" />
            <h3 className="text-sm font-black text-slate-900 tracking-tight">
              {step.title}
            </h3>
          </div>
          <p className="text-xs text-slate-700 leading-relaxed font-normal mt-0.5">
            {step.explanation}
          </p>
        </div>

        {/* Section 2.1: Pseudocode & Logic Execution (`logicCode`) */}
        <div className="flex flex-col rounded-xl bg-[#18181B] text-slate-200 p-3 border border-slate-800 shadow-sm shrink-0">
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-800/90 mb-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Code2 className="w-3 h-3 text-[#E31B23]" />
              Mã giả / Công thức thực thi
            </span>
            <button
              type="button"
              onClick={handleCopyCode}
              className="inline-flex items-center gap-1 text-[10px] text-slate-400 hover:text-white px-1.5 py-0.5 rounded bg-white/5 hover:bg-white/10 transition-colors"
              title="Sao chép mã giả"
            >
              {copiedCode ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span className="text-emerald-400">Đã sao chép</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>

          <pre className="font-mono text-[11px] text-red-200/95 leading-relaxed overflow-x-auto whitespace-pre-wrap break-words py-0.5 max-h-[140px]">
            {step.logicCode || `// Bước ${step.stepIndex + 1}: ${step.title}\nexecute(step_${step.stepIndex + 1});`}
          </pre>
        </div>

        {/* Section 2.2: Live State Variables Table (`stateVariables`) */}
        <div className="flex flex-col rounded-xl bg-slate-50 p-3 border border-slate-200/90 shadow-2xs flex-1">
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-200 mb-2 shrink-0">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
              <Variable className="w-3 h-3 text-[#E31B23]" />
              Biến số &amp; Trạng thái trực tiếp
            </span>
            <span className="text-[9px] font-black text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full border border-emerald-300">
              LIVE MUTATION
            </span>
          </div>

          {stateVars && typeof stateVars === 'object' && Object.keys(stateVars).length > 0 ? (
            <div className="grid grid-cols-2 gap-1.5 overflow-y-auto max-h-[160px] pr-0.5">
              {Object.entries(stateVars).map(([key, val], idx) => (
                <div
                  key={idx}
                  className="flex flex-col p-2 rounded-lg bg-white border border-slate-200/80 shadow-2xs transition-all hover:border-red-200"
                >
                  <span className="text-[10px] font-bold text-slate-500 truncate" title={key}>
                    {key}
                  </span>
                  <span
                    className="font-mono text-xs font-black text-slate-900 truncate mt-0.5"
                    title={typeof val === 'object' ? JSON.stringify(val) : String(val)}
                  >
                    {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center p-4 text-xs text-slate-400 italic">
              Đồng bộ dữ liệu biến số theo từng nhịp mô phỏng...
            </div>
          )}

          <div className="mt-auto pt-2 border-t border-slate-200/80 flex items-center justify-between text-[10px] text-slate-400 shrink-0">
            <span>Tự động cập nhật theo nhịp</span>
            <span className="font-bold text-[#E31B23]">TechViz Engine v2.5</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
