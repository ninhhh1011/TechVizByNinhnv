import React, { FC, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Compass,
  Sparkles,
  Target,
  Activity,
  Layers,
  Award,
  ArrowUpRight,
} from 'lucide-react';
import { SimulationStep, SwarmParticle } from '../types/simulation';

export interface Swarm2DRendererProps {
  step: SimulationStep;
  speed?: number;
}

export const Swarm2DRenderer: FC<Swarm2DRendererProps> = ({
  step,
  speed = 1,
}) => {
  // 1. Resolve swarmData from step.swarmData or step.visualData
  const swarmData = useMemo(() => {
    if (step.swarmData && step.swarmData.particles?.length > 0) {
      return step.swarmData;
    }
    const vd = step.visualData;
    if (vd?.particles && Array.isArray(vd.particles) && vd.particles.length > 0) {
      return {
        particles: vd.particles as SwarmParticle[],
        target: vd.target,
        gBest: vd.gBest,
        iteration: vd.iteration ?? step.stepIndex,
        bestFitness: vd.gBest?.fitness,
      };
    }
    return undefined;
  }, [step.swarmData, step.visualData, step.stepIndex]);

  const particles = swarmData?.particles || [];
  const target = swarmData?.target || swarmData?.gBest || { x: 50, y: 50, label: 'Cực trị tối ưu Toàn cục (gBest)' };
  const iteration = swarmData?.iteration ?? step.stepIndex;

  // Best particle calculation
  const bestParticle = useMemo(() => {
    if (particles.length === 0) return null;
    const explicitBest = particles.find((p) => p.isBest);
    if (explicitBest) return explicitBest;
    // Find particle closest to target
    return [...particles].sort((a, b) => {
      const distA = Math.hypot(a.x - target.x, a.y - target.y);
      const distB = Math.hypot(b.x - target.x, b.y - target.y);
      return distA - distB;
    })[0];
  }, [particles, target]);

  // Spring transition based on playback speed
  const springTransition = {
    type: 'spring' as const,
    stiffness: 180,
    damping: 22,
    duration: Math.max(0.4, 1.2 / speed),
  };

  if (!swarmData || particles.length === 0) {
    return (
      <div className="relative w-full min-h-[480px] bg-white rounded-[16px] border border-[#EDEDED] shadow-[0_4px_16px_rgba(0,0,0,0.06)] p-8 flex flex-col items-center justify-center text-center">
        <div className="w-14 h-14 rounded-2xl bg-red-50 text-[#E31B23] flex items-center justify-center mb-4">
          <Compass className="w-7 h-7" />
        </div>
        <h3 className="text-base font-bold text-[#1A1A1A] mb-1">
          Chưa có dữ liệu không gian bầy đàn (Swarm 2D)
        </h3>
        <p className="text-xs text-[#757575] max-w-md">
          Bước này hiện chưa cấu hình <code>swarmData</code> hoặc <code>visualData.particles</code>.
        </p>
      </div>
    );
  }

  return (
    <div className="relative w-full min-h-[500px] bg-white rounded-[16px] border border-[#EDEDED] shadow-[0_4px_16px_rgba(0,0,0,0.06)] p-5 sm:p-6 overflow-hidden flex flex-col justify-between select-none">
      {/* Background Architectural Coordinate Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#F5F6F8_1px,transparent_1px),linear-gradient(to_bottom,#F5F6F8_1px,transparent_1px)] bg-[size:32px_32px] opacity-90 pointer-events-none" />

      {/* Decorative Contour Lines (Equipotential Gradient Field) */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20">
        <circle cx={`${target.x}%`} cy={`${target.y}%`} r="60" fill="none" stroke="#E31B23" strokeWidth="1" strokeDasharray="3 3" />
        <circle cx={`${target.x}%`} cy={`${target.y}%`} r="120" fill="none" stroke="#E31B23" strokeWidth="1" strokeDasharray="4 4" />
        <circle cx={`${target.x}%`} cy={`${target.y}%`} r="190" fill="none" stroke="#E31B23" strokeWidth="1" strokeDasharray="5 5" />
      </svg>

      {/* 1. Header Toolbar */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 pb-3.5 border-b border-[#F0F0F0] mb-2">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-[#E31B23] animate-ping" />
          <span className="text-xs font-bold uppercase tracking-wider text-[#1A1A1A]">
            MÔ PHỎNG KHÔNG GIAN BẦY ĐÀN 2D (SWARM &amp; FITNESS SPACE)
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 border border-red-200 text-[#D91820] font-bold text-[11px]">
            <Activity className="w-3.5 h-3.5" />
            Thế hệ / Vòng lặp: #{iteration}
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 border border-gray-200 text-gray-700 font-medium text-[11px]">
            <Layers className="w-3.5 h-3.5 text-[#E31B23]" />
            Số hạt: {particles.length}
          </span>
        </div>
      </div>

      {/* 2. Main 2D Coordinate Arena */}
      <div className="relative z-20 w-full flex-1 min-h-[380px] sm:min-h-[420px] rounded-[14px] bg-[#FAFAFB] border border-[#E5E7EB] overflow-hidden my-2 shadow-inner">
        {/* Subtle Axes */}
        <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-gray-200 pointer-events-none" />
        <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-gray-200 pointer-events-none" />

        {/* Axis Labels */}
        <span className="absolute bottom-1 right-2 text-[10px] font-mono text-gray-400">Trục X &rarr;</span>
        <span className="absolute top-1 left-2 text-[10px] font-mono text-gray-400">&uarr; Trục Y</span>

        {/* Global Optimum Target (gBest / Extrema) */}
        <div
          className="absolute transform -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10 transition-all duration-500"
          style={{ left: `${target.x}%`, top: `${target.y}%` }}
        >
          {/* Pulsing Ripple Rings */}
          <div className="w-20 h-20 rounded-full bg-red-200/40 animate-ping absolute inset-0 -m-6" />
          <div className="w-12 h-12 rounded-full bg-red-100/60 animate-pulse absolute inset-0 -m-2" />

          {/* Core Target Pill */}
          <div className="relative flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-[#D91820] to-[#F23841] text-white text-[11px] font-bold shadow-lg border border-white">
            <Target className="w-3.5 h-3.5 animate-spin" />
            <span className="font-mono">gBest ({Math.round(target.x)}, {Math.round(target.y)})</span>
          </div>
        </div>

        {/* Particles */}
        {particles.map((p, idx) => {
          const isBest = p.isBest || (bestParticle && bestParticle.id === p.id);
          const px = Math.max(4, Math.min(96, p.x));
          const py = Math.max(4, Math.min(96, p.y));

          return (
            <motion.div
              key={p.id || `particle-${idx}`}
              layout
              initial={false}
              animate={{
                left: `${px}%`,
                top: `${py}%`,
              }}
              transition={springTransition}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 z-20 cursor-pointer group"
            >
              {/* Particle Vector Arrow if velocity is defined */}
              {(p.vx !== undefined || p.vy !== undefined) && (
                <div
                  className="absolute left-1/2 top-1/2 w-8 h-[2px] bg-red-300 origin-left pointer-events-none"
                  style={{
                    transform: `rotate(${Math.atan2(p.vy || 0, p.vx || 0)}rad)`,
                  }}
                >
                  <ArrowUpRight className="w-3 h-3 text-[#E31B23] -mt-1.5 ml-auto" />
                </div>
              )}

              {/* Particle Bead */}
              <div className="relative flex items-center justify-center">
                <div
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-[10px] shadow-md transition-all duration-300 ${
                    isBest
                      ? 'bg-gradient-to-br from-[#E31B23] to-[#B80D14] text-white ring-4 ring-red-200 scale-110'
                      : 'bg-white text-gray-800 border-2 border-red-300 hover:border-[#E31B23] hover:scale-110'
                  }`}
                >
                  {isBest ? <Award className="w-4 h-4 text-white" /> : (p.label || `P${idx + 1}`)}
                </div>

                {/* Live Fitness / Coordinate Tooltip */}
                <div className="absolute bottom-full mb-1 flex flex-col items-center pointer-events-none opacity-90 group-hover:opacity-100 transition-opacity">
                  <span
                    className={`px-1.5 py-0.5 rounded text-[9px] font-mono whitespace-nowrap shadow-sm border ${
                      isBest
                        ? 'bg-[#1A1A1A] text-white border-black font-bold'
                        : 'bg-white text-gray-700 border-gray-200'
                    }`}
                  >
                    {p.fitness !== undefined ? `f: ${p.fitness.toFixed(1)}` : `(${Math.round(px)}, ${Math.round(py)})`}
                  </span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* 3. Footer Metadata */}
      <div className="relative z-10 pt-3 border-t border-[#F0F0F0] flex flex-wrap items-center justify-between text-xs text-[#757575] gap-2">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-[#1A1A1A]">Hội tụ:</span>
          <span>
            Điểm cực trị: <strong className="text-[#E31B23]">({Math.round(target.x)}, {Math.round(target.y)})</strong>
          </span>
          {bestParticle && (
            <>
              <span>&bull;</span>
              <span>
                Cá thể dẫn đầu: <strong className="text-emerald-700">{bestParticle.label || bestParticle.id}</strong> (f = {bestParticle.fitness ?? 'Tối ưu'})
              </span>
            </>
          )}
        </div>

        <div className="flex items-center gap-3 text-[11px]">
          <span className="flex items-center gap-1 text-[#E31B23] font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-[#E31B23]" /> Vị trí hiện tại
          </span>
          <span className="flex items-center gap-1 text-gray-500">
            <Sparkles className="w-3 h-3 text-amber-500" /> Vector gia tốc hướng gBest
          </span>
        </div>
      </div>
    </div>
  );
};
