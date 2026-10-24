import { FC } from 'react';
import { Button } from '@heroui/react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
  Gauge,
  Check,
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
    <div className="w-full bg-[#FFFFFF] rounded-[14px] border border-[#EDEDED] shadow-[0_4px_16px_rgba(0,0,0,0.06)] p-4 sm:p-5 flex flex-col gap-4 transition-all">
      {/* ========================================================= */}
      {/* HÀNG 1: TIMELINE & STEPPER MỐC BƯỚC (B1, B2, B3, ...)    */}
      {/* Tách biệt hoàn toàn, không dùng absolute ra ngoài phạm vi */}
      {/* ========================================================= */}
      <div className="w-full pb-3 border-b border-[#F0F0F0] flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs text-[#757575] px-1 font-medium">
          <span>Tiến trình kịch bản</span>
          <span className="text-[#D91820] font-bold">
            Hoàn thành {Math.round(((currentStepIndex + 1) / totalSteps) * 100)}%
          </span>
        </div>

        <div className="w-full overflow-x-auto">
        <div className="relative flex items-center justify-between w-full px-2 sm:px-4 py-2" style={{ minWidth: totalSteps * 44 }}>
          {/* Đường dẫn nền (Connector track) */}
          <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-1.5 bg-[#EDEDED] rounded-full z-0 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#D91820] to-[#E31B23] rounded-full transition-all duration-300"
              style={{
                width: totalSteps > 1 ? `${(currentStepIndex / (totalSteps - 1)) * 100}%` : '100%',
              }}
            />
          </div>

          {/* Các mốc bước B1, B2, B3, B4... dạng nút bấm tương tác */}
          {Array.from({ length: totalSteps }).map((_, i) => {
            const isPassed = i < currentStepIndex;
            const isCurrent = i === currentStepIndex;

            return (
              <button
                key={i}
                type="button"
                onClick={() => onStepSelect(i)}
                className={`relative z-10 flex items-center justify-center transition-all duration-200 rounded-full cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#E31B23]/40 ${
                  isCurrent
                    ? 'w-9 h-9 bg-white border-2 border-[#E31B23] text-[#E31B23] font-extrabold text-xs shadow-md ring-4 ring-red-100 scale-110'
                    : isPassed
                    ? 'w-8 h-8 bg-[#E31B23] text-white font-bold text-xs shadow-sm hover:scale-105'
                    : 'w-8 h-8 bg-[#F5F6F8] text-[#757575] border border-gray-200 font-bold text-xs hover:border-[#E31B23] hover:text-[#E31B23] hover:bg-white'
                }`}
                title={`Chuyển đến Bước ${i + 1}`}
                aria-label={`Chuyển đến Bước ${i + 1}`}
                aria-current={isCurrent ? 'step' : undefined}
              >
                {isPassed ? (
                  <Check className="w-4 h-4 stroke-[3]" />
                ) : (
                  `B${i + 1}`
                )}
              </button>
            );
          })}
        </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* HÀNG 2: CỤM NÚT ĐIỀU KHIỂN (PHÂN BỔ 3 CỤM CÂN ĐỐI)       */}
      {/* ========================================================= */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-0.5">
        {/* Cụm 1: Playback Controls (Reset, Prev, Play/Pause, Next) */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Nút Reset */}
          <Button
            isIconOnly
            size="sm"
            variant="flat"
            onClick={onReset}
            aria-label="Về đầu kịch bản"
            title="Về bước đầu tiên"
            className="bg-[#F5F6F8] text-[#1A1A1A] hover:bg-gray-200 rounded-xl"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>

          {/* Nút Bước trước */}
          <Button
            isIconOnly
            size="sm"
            variant="flat"
            onClick={onPrev}
            disabled={currentStepIndex === 0}
            aria-label="Bước trước"
            title="Bước trước"
            className="bg-[#F5F6F8] text-[#1A1A1A] hover:bg-gray-200 disabled:opacity-40 rounded-xl"
          >
            <SkipBack className="w-4 h-4" />
          </Button>

          {/* Nút Chạy tự động / Tạm dừng */}
          <Button
            size="sm"
            color="primary"
            onClick={onPlayPause}
            className="bg-gradient-to-r from-[#D91820] to-[#F23841] text-white font-bold px-4 h-9 shadow-[0_2px_8px_rgba(227,27,35,0.35)] rounded-xl transition-transform active:scale-95"
            startContent={
              isPlaying ? (
                <Pause className="w-4 h-4 fill-white" />
              ) : (
                <Play className="w-4 h-4 fill-white ml-0.5" />
              )
            }
          >
            {isPlaying ? 'Tạm dừng' : 'Chạy tự động'}
          </Button>

          {/* Nút Bước tiếp theo */}
          <Button
            isIconOnly
            size="sm"
            variant="flat"
            onClick={onNext}
            disabled={currentStepIndex >= totalSteps - 1}
            aria-label="Bước tiếp theo"
            title="Bước tiếp theo"
            className="bg-[#F5F6F8] text-[#1A1A1A] hover:bg-gray-200 disabled:opacity-40 rounded-xl"
          >
            <SkipForward className="w-4 h-4" />
          </Button>
        </div>

        {/* Cụm 2: Text trạng thái ở giữa */}
        <div className="text-xs sm:text-sm font-medium text-[#5A5A5A] text-center">
          Đang xem:{' '}
          <span className="text-[#D91820] font-extrabold text-sm sm:text-base">
            Bước {currentStepIndex + 1}
          </span>{' '}
          / {totalSteps}
        </div>

        {/* Cụm 3: Bộ chọn tốc độ (0.5x, 1x, 2x) */}
        <div className="flex items-center gap-1 bg-[#F5F6F8] p-1 rounded-xl border border-[#EDEDED]">
          <Gauge className="w-3.5 h-3.5 text-[#757575] ml-1.5 mr-0.5 shrink-0" />
          {speeds.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onSpeedChange(s)}
              aria-pressed={speed === s}
              className={`text-xs px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                speed === s
                  ? 'bg-white text-[#E31B23] shadow-sm'
                  : 'text-[#757575] hover:text-[#1A1A1A] hover:bg-white/60'
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
