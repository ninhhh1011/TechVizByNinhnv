import { FC, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Volume2,
  VolumeX,
  BarChart3,
  Box,
  ArrowDown,
  Info,
} from 'lucide-react';
import { SimulationStep, ArrayPointer } from '../types/simulation';
import { playValueTone } from '../utils/audio';

export interface ArrayPointerRendererProps {
  step: SimulationStep;
  speed?: number;
  audioEnabled?: boolean;
  barView?: boolean;
  highlightComparisons?: boolean;
  showPointerBadges?: boolean;
}

/**
 * Trả về màu sắc Techcombank chuẩn cho từng loại tên con trỏ.
 */
function getPointerColor(name: string, customColor?: string): { bg: string; text: string; border: string } {
  if (customColor) {
    return { bg: customColor, text: '#FFFFFF', border: customColor };
  }
  const n = name.trim().toLowerCase();
  switch (n) {
    case 'pivot':
      return { bg: '#E31B23', text: '#FFFFFF', border: '#B80D14' }; // Đỏ chuẩn Techcombank
    case 'left':
    case 'low':
      return { bg: '#2563EB', text: '#FFFFFF', border: '#1D4ED8' }; // Xanh dương
    case 'right':
    case 'high':
      return { bg: '#7C3AED', text: '#FFFFFF', border: '#6D28D9' }; // Tím
    case 'mid':
    case 'middle':
      return { bg: '#D97706', text: '#FFFFFF', border: '#B45309' }; // Hổ phách
    case 'i':
      return { bg: '#0891B2', text: '#FFFFFF', border: '#0E7490' }; // Cyan đậm
    case 'j':
      return { bg: '#DB2777', text: '#FFFFFF', border: '#BE185D' }; // Hồng Magenta
    default:
      return { bg: '#4B5563', text: '#FFFFFF', border: '#374151' }; // Xám trung tính
  }
}

export const ArrayPointerRenderer: FC<ArrayPointerRendererProps> = ({
  step,
  speed = 1,
  audioEnabled = true,
  barView = true,
  highlightComparisons = true,
  showPointerBadges = true,
}) => {
  // Hỗ trợ cả cấu trúc arrayData lẫn visualData tinh gọn từ AI
  const arrayData = useMemo(() => {
    if (step?.arrayData?.array && step.arrayData.array.length > 0) {
      return step.arrayData;
    }
    const vd = step?.visualData;
    if (vd?.array && Array.isArray(vd.array) && vd.array.length > 0) {
      const generatedPointers: ArrayPointer[] = [];
      if (Array.isArray(vd.pointers)) {
        generatedPointers.push(...vd.pointers);
      } else if (vd.pointers && typeof vd.pointers === 'object') {
        Object.entries(vd.pointers).forEach(([name, idx]) => {
          generatedPointers.push({ name, index: Number(idx), label: `Con trỏ ${name}` });
        });
      }
      if (vd.pivotIndex !== undefined && !generatedPointers.some((p) => p.name.toLowerCase() === 'pivot')) {
        generatedPointers.push({ name: 'pivot', index: Number(vd.pivotIndex), label: 'Pivot' });
      }

      return {
        array: vd.array,
        pointers: generatedPointers,
        comparingIndices: vd.comparingIndices || vd.comparing || vd.activeIndices || [],
        swappedIndices: vd.swappedIndices || vd.swapped || [],
        sortedIndices: vd.sortedIndices || vd.sorted || [],
        soundFrequencyIndex: step?.arrayData?.soundFrequencyIndex,
      };
    }
    return undefined;
  }, [step?.arrayData, step?.visualData]);

  const array = arrayData?.array || [];
  const pointers = arrayData?.pointers || [];
  const comparingIndices = arrayData?.comparingIndices || [];
  const swappedIndices = arrayData?.swappedIndices || [];
  const sortedIndices = arrayData?.sortedIndices || [];

  // Tính giá trị min và max để chuẩn hóa chiều cao cột (chống NaN tuyệt đối)
  const { minVal, maxVal } = useMemo(() => {
    if (array.length === 0) return { minVal: 0, maxVal: 100 };
    const numArr = array.map((v) => {
      const n = typeof v === 'number' ? v : Number(v);
      return isNaN(n) ? 0 : n;
    });
    const min = Math.min(...numArr);
    const max = Math.max(...numArr);
    return {
      minVal: isNaN(min) ? 0 : min,
      maxVal: isNaN(max) ? 100 : max,
    };
  }, [array]);

  // Tự động phát âm thanh Web Audio khi bước mô phỏng thay đổi
  useEffect(() => {
    if (!audioEnabled || array.length === 0) return;

    let targetIdx: number | undefined;

    if (
      arrayData?.soundFrequencyIndex !== undefined &&
      arrayData.soundFrequencyIndex >= 0 &&
      arrayData.soundFrequencyIndex < array.length
    ) {
      targetIdx = arrayData.soundFrequencyIndex;
    } else if (swappedIndices.length > 0 && swappedIndices[0] < array.length) {
      targetIdx = swappedIndices[0];
    } else if (comparingIndices.length > 0 && comparingIndices[0] < array.length) {
      targetIdx = comparingIndices[0];
    } else if (pointers.length > 0 && pointers[0].index >= 0 && pointers[0].index < array.length) {
      targetIdx = pointers[0].index;
    }

    if (targetIdx !== undefined && targetIdx >= 0 && targetIdx < array.length) {
      playValueTone(array[targetIdx], minVal, maxVal);
    }
  }, [step?.stepIndex, audioEnabled, array, arrayData, minVal, maxVal, swappedIndices, comparingIndices, pointers]);

  // Map gom nhóm pointers theo index
  const pointersByIndex = useMemo(() => {
    const map = new Map<number, ArrayPointer[]>();
    if (!showPointerBadges) return map;

    pointers.forEach((p) => {
      const list = map.get(p.index) || [];
      list.push(p);
      map.set(p.index, list);
    });
    return map;
  }, [pointers, showPointerBadges]);

  // Framer Motion spring transition dựa theo speed
  const springTransition = {
    type: 'spring' as const,
    stiffness: 320,
    damping: 26,
    duration: Math.max(0.2, 0.6 / speed),
  };

  if (!arrayData || array.length === 0) {
    return (
      <div className="relative w-full h-full min-h-[440px] bg-white rounded-2xl border border-slate-200/90 shadow-xs p-8 flex flex-col items-center justify-center text-center font-['Plus_Jakarta_Sans',sans-serif]">
        <div className="w-12 h-12 rounded-xl bg-red-50 text-[#E31B23] flex items-center justify-center mb-3">
          <Info className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-bold text-slate-800 mb-1">
          Chưa có dữ liệu mảng (Array Step Data)
        </h3>
        <p className="text-xs text-slate-500 max-w-sm">
          Bước này hiện chưa cấu hình <code>arrayData</code>. Vui lòng chọn một kịch bản thuật toán như QuickSort hoặc Binary Search.
        </p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full min-h-[440px] bg-white rounded-2xl border border-slate-200/90 shadow-xs p-4 sm:p-5 overflow-hidden flex flex-col justify-between select-none font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Nền lưới kỹ thuật Architectural Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#F1F5F9_1px,transparent_1px),linear-gradient(to_bottom,#F1F5F9_1px,transparent_1px)] bg-[size:28px_28px] opacity-70 pointer-events-none" />

      {/* 1. Header của Stage */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-100 mb-2">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#E31B23] animate-ping" />
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-800">
            Trực quan hóa Mảng &amp; Hai Con Trỏ (Array &amp; Two-Pointer Stage)
          </span>
        </div>

        {/* Feature status badges */}
        <div className="flex items-center gap-2 text-[10px] font-semibold text-slate-600">
          <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200">
            {barView ? (
              <>
                <BarChart3 className="w-3 h-3 text-[#E31B23]" /> Cột cao độ
              </>
            ) : (
              <>
                <Box className="w-3 h-3 text-[#E31B23]" /> Ô vuông (Boxes)
              </>
            )}
          </span>

          <span
            className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full border ${
              audioEnabled
                ? 'bg-red-50 text-[#E31B23] border-red-200 font-bold'
                : 'bg-slate-100 border-slate-200 text-slate-400'
            }`}
          >
            {audioEnabled ? (
              <>
                <Volume2 className="w-3 h-3" /> Âm thanh: Bật
              </>
            ) : (
              <>
                <VolumeX className="w-3 h-3" /> Âm thanh: Tắt
              </>
            )}
          </span>
        </div>
      </div>

      {/* 2. Visual Legend Bar */}
      <div className="relative z-10 flex flex-wrap items-center gap-3 py-1.5 px-3 rounded-[10px] bg-[#F5F6F8]/70 border border-[#E5E7EB]/80 text-[11px] mb-4">
        <span className="font-semibold text-[#1A1A1A]">Chú giải:</span>

        <span className="flex items-center gap-1.5 text-[#5A5A5A]">
          <span className="w-3 h-3 rounded-[3px] bg-white border border-[#EDEDED] shadow-sm inline-block" />
          Bình thường
        </span>

        {highlightComparisons && (
          <span className="flex items-center gap-1.5 text-[#D91820] font-medium">
            <span className="w-3 h-3 rounded-[3px] bg-[#E31B23] shadow-sm inline-block" />
            Đang so sánh
          </span>
        )}

        <span className="flex items-center gap-1.5 text-[#8B080D] font-medium">
          <span className="w-3 h-3 rounded-[3px] bg-[#A80B12] shadow-sm inline-block" />
          Vừa hoán đổi (Swap)
        </span>

        <span className="flex items-center gap-1.5 text-emerald-700 font-medium">
          <span className="w-3 h-3 rounded-[3px] bg-[#10B981] shadow-sm inline-block" />
          Đã chốt vị trí (Sorted)
        </span>
      </div>

      {/* 3. Main Interactive Array Stage */}
      <div className="relative z-10 my-auto py-6 flex-1 flex flex-col justify-center items-center">
        <div className="w-full flex items-end justify-center gap-2.5 sm:gap-4 md:gap-5 px-2 min-h-[260px] overflow-x-auto">
          {array.map((value, idx) => {
            const isComparing = highlightComparisons && comparingIndices.includes(idx);
            const isSwapped = swappedIndices.includes(idx);
            const isSorted = sortedIndices.includes(idx);
            const elementPointers = pointersByIndex.get(idx) || [];

            // Tính toán chiều cao cột khi ở chế độ Bars (chống NaN)
            const numVal = typeof value === 'number' && !isNaN(value) ? value : Number(value) || 0;
            const safeRange = maxVal === minVal ? 1 : Math.max(1, maxVal - minVal);
            const normalizedHeight = Math.max(0, Math.min(1, (numVal - minVal) / safeRange));
            // Chiều cao từ 56px đến 210px
            const barHeightPx = isNaN(normalizedHeight) ? 100 : Math.round(56 + normalizedHeight * 154);

            // Xác định màu sắc và style của item
            let itemBg = 'bg-white border-[#EDEDED] text-[#1A1A1A] shadow-[0_2px_8px_rgba(0,0,0,0.04)]';
            let itemGlow = '';

            if (isSwapped) {
              itemBg = 'bg-gradient-to-t from-[#8B080D] to-[#A80B12] border-[#8B080D] text-white shadow-[0_6px_20px_rgba(168,11,18,0.4)] ring-2 ring-red-300';
              itemGlow = 'scale-105';
            } else if (isComparing) {
              itemBg = 'bg-gradient-to-t from-[#D91820] to-[#F04E55] border-[#E31B23] text-white shadow-[0_6px_20px_rgba(227,27,35,0.35)] ring-2 ring-red-200 animate-pulse';
            } else if (isSorted) {
              itemBg = 'bg-gradient-to-t from-[#059669] to-[#10B981] border-[#059669] text-white shadow-[0_4px_14px_rgba(16,185,129,0.3)]';
            }

            return (
              <motion.div
                layout
                key={`val-${value}-${idx}`}
                transition={springTransition}
                className="flex flex-col items-center flex-shrink-0 group relative"
                style={{ width: barView ? 'clamp(44px, 5.5vw, 68px)' : 'clamp(52px, 6.5vw, 76px)' }}
              >
                {/* 3.1 Pointer Badges & Down Arrows */}
                <div className="h-16 flex flex-col items-center justify-end pb-1.5 w-full">
                  <AnimatePresence>
                    {elementPointers.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.8 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -6, scale: 0.8 }}
                        className="flex flex-col items-center gap-0.5"
                      >
                        {/* Huy hiệu các con trỏ trỏ vào vị trí này */}
                        <div className="flex flex-wrap items-center justify-center gap-1 max-w-[90px]">
                          {elementPointers.map((p, pIdx) => {
                            const pColors = getPointerColor(p.name, p.color);
                            return (
                              <span
                                key={`${p.name}-${pIdx}`}
                                style={{
                                  backgroundColor: pColors.bg,
                                  borderColor: pColors.border,
                                }}
                                className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-tight text-white border shadow-sm flex items-center gap-0.5"
                                title={p.label || `Con trỏ ${p.name}`}
                              >
                                {p.name}
                              </span>
                            );
                          })}
                        </div>
                        {/* Mũi tên chỉ xuống */}
                        <motion.div
                          animate={{ y: [0, 2, 0] }}
                          transition={{ repeat: Infinity, duration: 1.2 }}
                        >
                          <ArrowDown className="w-4 h-4 text-[#E31B23]" strokeWidth={2.5} />
                        </motion.div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* 3.2 Main Column / Box Element */}
                <motion.div
                  layout
                  animate={
                    isSwapped
                      ? { scale: [1, 1.12, 1] }
                      : isComparing
                      ? { scale: [1, 1.04, 1] }
                      : { scale: 1 }
                  }
                  transition={{ duration: 0.4 }}
                  style={{
                    height: barView ? `${barHeightPx}px` : '72px',
                  }}
                  className={`w-full rounded-[14px] border flex flex-col items-center justify-between p-2.5 transition-all duration-200 cursor-pointer ${itemBg} ${itemGlow}`}
                >
                  {/* Indicator chấm trạng thái ở đỉnh cột */}
                  <div className="w-full flex items-center justify-between">
                    <span
                      className={`text-[9px] font-bold uppercase tracking-wider ${
                        isComparing || isSwapped || isSorted ? 'text-white/80' : 'text-[#757575]'
                      }`}
                    >
                      {isSwapped ? 'SWAP' : isComparing ? 'COMP' : isSorted ? 'DONE' : ''}
                    </span>
                    {(isComparing || isSwapped) && (
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                    )}
                  </div>

                  {/* Giá trị số chính giữa / đỉnh cột */}
                  <span
                    className={`font-mono font-extrabold text-base sm:text-lg tracking-tight ${
                      isComparing || isSwapped || isSorted ? 'text-white' : 'text-[#1A1A1A]'
                    }`}
                  >
                    {value}
                  </span>

                  {/* Vạch kẻ thẩm mỹ đáy cột */}
                  <div
                    className={`w-full h-1 rounded-full ${
                      isComparing || isSwapped || isSorted ? 'bg-white/30' : 'bg-gray-100'
                    }`}
                  />
                </motion.div>

                {/* 3.3 Index Badge bên dưới */}
                <div className="mt-2 text-center">
                  <span className="font-mono text-[11px] font-semibold text-[#757575] bg-[#F5F6F8] px-2 py-0.5 rounded-[6px] border border-[#EDEDED]">
                    [{idx}]
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* 4. Footer Metadata của Stage */}
      <div className="relative z-10 pt-3 border-t border-[#F0F0F0] flex flex-wrap items-center justify-between text-xs text-[#757575] gap-2">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-[#1A1A1A]">Mảng:</span>
          <span>
            Độ dài N = <strong className="text-[#1A1A1A]">{array.length}</strong>
          </span>
          <span>&bull;</span>
          <span>
            Phạm vi: [{minVal} ... {maxVal}]
          </span>
        </div>

        <div className="flex items-center gap-3 text-[11px]">
          {comparingIndices.length > 0 && (
            <span className="text-[#D91820] font-medium">
              So sánh: [{comparingIndices.join(', ')}]
            </span>
          )}
          {swappedIndices.length > 0 && (
            <span className="text-[#8B080D] font-bold">
              Hoán đổi: [{swappedIndices.join(', ')}]
            </span>
          )}
          {sortedIndices.length > 0 && (
            <span className="text-emerald-700 font-medium">
              Đã chốt: {sortedIndices.length}/{array.length}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
