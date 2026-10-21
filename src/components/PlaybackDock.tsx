import { FC } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
  Gauge,
  Check,
  Keyboard,
} from 'lucide-react';

interface PlaybackDockProps {
  currentStepIndex: number;
  totalSteps: number;
  isPlaying: boolean;
  speed: number;
  onPlayPause: () => void;
  onPrev: () => void;
  onNext: () => void;
  onReset: () => void;
  onStepSelect: (stepIndex: number) => void;
  onSpeedChange: (speed: number) => void;
}

export const PlaybackDock: FC<PlaybackDockProps> = ({
  currentStepIndex,
  totalSteps,
  isPlaying,
  speed,
  onPlayPause,
  onPrev,
  onNext,
  onReset,
  onStepSelect,
  onSpeedChange,
}) => {
  const speeds = [0.5, 1, 2];

  return (
    <div className="w-full bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200 shadow-md p-3 sm:p-3.5 flex flex-col gap-2.5 transition-all select-none font-['Plus_Jakarta_Sans',sans-serif]">
      {/* 1. Timeline Track & Stepper (B1..Bn) */}
      <div className="relative flex items-center justify-between w-full px-2 sm:px-3 pt-1">
        {/* Connector Line Track */}
        <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-1 bg-slate-200 rounded-full z-0 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#D91820] to-[#E31B23] rounded-full transition-all duration-300"
            style={{
              width: totalSteps > 1 ? `${(currentStepIndex / (totalSteps - 1)) * 100}%` : '100%',
            }}
          />
        </div>

        {/* Stepper Buttons */}
        {Array.from({ length: totalSteps }).map((_, i) => {
          const isPassed = i < currentStepIndex;
          const isCurrent = i === currentStepIndex;

          return (
            <button
              key={i}
              type="button"
              onClick={() => onStepSelect(i)}
              className={`relative z-10 flex items-center justify-center transition-all duration-200 rounded-full cursor-pointer focus:outline-none ${
                isCurrent
                  ? 'w-7 h-7 sm:w-8 sm:h-8 bg-white border-2 border-[#E31B23] text-[#E31B23] font-black text-xs shadow-md ring-4 ring-red-100 scale-110'
                  : isPassed
                  ? 'w-6 h-6 sm:w-7 sm:h-7 bg-[#E31B23] text-white font-bold text-xs shadow-2xs hover:scale-105'
                  : 'w-6 h-6 sm:w-7 sm:h-7 bg-slate-100 text-slate-500 border border-slate-200 font-bold text-[11px] hover:border-[#E31B23] hover:text-[#E31B23] hover:bg-white'
              }`}
              title={`Chuyển đến Bước ${i + 1}`}
              aria-label={`Chuyển đến Bước ${i + 1}`}
            >
              {isPassed ? (
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              ) : (
                `B${i + 1}`
              )}
            </button>
          );
        })}
      </div>

      {/* 2. Controls & Shortcuts Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100">
        {/* Left: Playback Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Reset button */}
          <button
            type="button"
            onClick={onReset}
            aria-label="Về đầu kịch bản"
            title="Về bước đầu tiên"
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Prev button with shortcut badge */}
          <button
            type="button"
            onClick={onPrev}
            disabled={currentStepIndex === 0}
            aria-label="Bước trước"
            title="Bước trước (Phím ←)"
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
          >
            <SkipBack className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Lùi</span>
            <kbd className="hidden md:inline-block text-[9px] bg-white border border-slate-300 px-1 py-0.5 rounded text-slate-500">←</kbd>
          </button>

          {/* Play/Pause Button */}
          <button
            type="button"
            onClick={onPlayPause}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-gradient-to-r from-[#D91820] to-[#E31B23] text-white text-xs font-extrabold shadow-sm hover:opacity-95 transition-all active:scale-95 cursor-pointer"
          >
            {isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5 fill-white" />
                <span>Tạm dừng</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>Tự động</span>
              </>
            )}
          </button>

          {/* Next button with shortcut badge */}
          <button
            type="button"
            onClick={onNext}
            disabled={currentStepIndex >= totalSteps - 1}
            aria-label="Bước tiếp theo"
            title="Bước tiếp theo (Phím →)"
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
          >
            <span className="hidden sm:inline">Tiến</span>
            <kbd className="hidden md:inline-block text-[9px] bg-white border border-slate-300 px-1 py-0.5 rounded text-slate-500">→</kbd>
            <SkipForward className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Center: Step status info */}
        <div className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
          <span>Tiến trình:</span>
          <span className="text-[#E31B23] font-black">
            B{currentStepIndex + 1}
          </span>
          <span>/</span>
          <span className="font-bold text-slate-700">{totalSteps}</span>
        </div>

        {/* Right: Speed selector */}
        <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-xl border border-slate-200">
          <Gauge className="w-3 h-3 text-slate-400 ml-1.5 mr-0.5 shrink-0" />
          {speeds.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onSpeedChange(s)}
              className={`text-[11px] px-2 py-0.5 rounded-lg font-bold transition-all cursor-pointer ${
                speed === s
                  ? 'bg-white text-[#E31B23] shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
