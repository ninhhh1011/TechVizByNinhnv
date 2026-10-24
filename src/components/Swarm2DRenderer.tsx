import React, { FC, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Compass,
  Target,
  Activity,
  Layers,
  Award,
  ArrowUpRight,
} from 'lucide-react';
import { SimulationStep, SwarmParticle } from '../types/simulation';
import { pickBestParticle } from '../utils/renderState';

export interface Swarm2DRendererProps {
  step: SimulationStep;
  speed?: number;
  isPlaying?: boolean;
}

export const Swarm2DRenderer: FC<Swarm2DRendererProps> = ({
  step,
  speed = 1,
  isPlaying = false,
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
        iteration: vd.iteration,
        bestFitness: vd.gBest?.fitness,
        objective: vd.objective as 'min' | 'max' | undefined,
      };
    }
    return undefined;
  }, [step.swarmData, step.visualData]);

  const particles = swarmData?.particles || [];
  const target = swarmData?.target || swarmData?.gBest;
  const iteration = swarmData?.iteration;

  // Best particle calculation
  const bestParticle = useMemo(() => {
    return pickBestParticle(particles, swarmData?.objective);
  }, [particles, swarmData?.objective]);

  const springTransition = {
    type: 'spring' as const,
    stiffness: 190,
    damping: 22,
    duration: Math.max(0.4, 1.2 / speed),
  };

  if (!swarmData || particles.length === 0) {
    return (
      <div className="relative w-full h-full min-h-[440px] bg-white rounded-2xl border border-slate-200/90 shadow-xs p-8 flex flex-col items-center justify-center text-center">
        <div className="w-12 h-12 rounded-xl bg-red-50 text-[#E31B23] flex items-center justify-center mb-3">
          <Compass className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-bold text-slate-800 mb-1">
          Chưa có dữ liệu không gian bầy đàn (Swarm 2D)
        </h3>
        <p className="text-xs text-slate-500 max-w-sm">
          Bước này hiện chưa cấu hình dữ liệu bầy đàn hoặc hàm mục tiêu tối ưu.
        </p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full min-h-[440px] bg-white rounded-2xl border border-slate-200/90 shadow-xs p-4 sm:p-5 overflow-hidden flex flex-col justify-between select-none font-['Plus_Jakarta_Sans',sans-serif]">
      <ul className="sr-only" aria-label="Trạng thái các hạt">
        {particles.map((p) => <li key={p.id}>{p.label || p.id}: x={p.x}, y={p.y}, fitness={p.fitness ?? 'chưa có'}{bestParticle?.id === p.id ? ', dẫn đầu theo dữ liệu được khai báo' : ''}</li>)}
      </ul>
      {/* Background Architectural Coordinate Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#F1F5F9_1px,transparent_1px),linear-gradient(to_bottom,#F1F5F9_1px,transparent_1px)] bg-[size:32px_32px] opacity-75 pointer-events-none" />

      {/* Decorative Contour Lines (Equipotential Gradient Field) */}
      {target && <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20">
        <circle cx={`${target.x}%`} cy={`${target.y}%`} r="60" fill="none" stroke="#E31B23" strokeWidth="1" strokeDasharray="3 3" />
        <circle cx={`${target.x}%`} cy={`${target.y}%`} r="120" fill="none" stroke="#E31B23" strokeWidth="1" strokeDasharray="4 4" />
        <circle cx={`${target.x}%`} cy={`${target.y}%`} r="190" fill="none" stroke="#E31B23" strokeWidth="1" strokeDasharray="5 5" />
      </svg>}

      {/* 1. Header Toolbar */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-100 mb-2">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#E31B23] animate-ping" />
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-800">
            Không gian Bầy đàn &amp; Hàm Mục tiêu (Swarm 2D Stage)
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs">
          {iteration !== undefined && (
            <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-50 border border-red-200 text-[#E31B23] font-bold text-[10px]">
              <Activity className="w-3 h-3" />
              Vòng lặp: #{iteration}
            </span>
          )}
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-600 font-semibold text-[10px]">
            <Layers className="w-3 h-3 text-[#E31B23]" />
            Số hạt: {particles.length}
          </span>
        </div>
      </div>

      {/* 2. Main 2D Coordinate Arena */}
      <div className="relative z-20 w-full flex-1 min-h-[300px] rounded-xl bg-slate-50/70 border border-slate-200/80 overflow-hidden my-1 shadow-inner">
        {/* Subtle Axes */}
        <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-slate-200 pointer-events-none" />
        <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-slate-200 pointer-events-none" />

        <span className="absolute bottom-1 right-2 text-[9px] font-mono text-slate-400">Trục X &rarr;</span>
        <span className="absolute top-1 left-2 text-[9px] font-mono text-slate-400">&uarr; Trục Y</span>

        {/* Global Optimum Target (gBest / Extrema) */}
        {target && <div
          className="absolute transform -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10 transition-all duration-500"
          style={{ left: `${target.x}%`, top: `${target.y}%` }}
        >
          <div className="w-16 h-16 rounded-full bg-red-200/40 animate-ping absolute inset-0 -m-4" />
          <div className="w-10 h-10 rounded-full bg-red-100/60 animate-pulse absolute inset-0 -m-1" />

          <div className="relative flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-[#D91820] to-[#E31B23] text-white text-[10px] font-extrabold shadow-md border border-white">
            <Target className="w-3 h-3 animate-spin" />
            <span className="font-mono">Mục tiêu khai báo ({Math.round(target.x)}, {Math.round(target.y)})</span>
          </div>
        </div>}

        {/* Particles */}
        {particles.map((p, idx) => {
          const isBest = bestParticle?.id === p.id;
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
              transition={isPlaying ? springTransition : { duration: 0 }}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 z-20 cursor-pointer group"
            >
              {/* Particle Vector Arrow */}
              {(p.vx !== undefined || p.vy !== undefined) && (
                <div
                  className="absolute left-1/2 top-1/2 w-6 h-[2px] bg-red-300 origin-left pointer-events-none"
                  style={{
                    transform: `rotate(${Math.atan2(p.vy || 0, p.vx || 0)}rad)`,
                  }}
                >
                  <ArrowUpRight className="w-2.5 h-2.5 text-[#E31B23] -mt-1 ml-auto" />
                </div>
              )}

              {/* Particle Bead */}
              <div className="relative flex items-center justify-center">
                <div
                  className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center font-bold text-[9px] shadow-sm transition-all duration-300 ${
                    isBest
                      ? 'bg-gradient-to-br from-[#E31B23] to-[#B80D14] text-white ring-4 ring-red-100 scale-110 z-30'
                      : 'bg-white text-slate-800 border-2 border-red-300 hover:border-[#E31B23] hover:scale-110'
                  }`}
                >
                  {isBest ? <Award className="w-3.5 h-3.5 text-white" /> : (p.label || `P${idx + 1}`)}
                </div>

                {/* Tooltip */}
                <div className="absolute bottom-full mb-1 flex flex-col items-center pointer-events-none opacity-85 group-hover:opacity-100 transition-opacity">
                  <span
                    className={`px-1.5 py-0.5 rounded text-[8px] font-mono whitespace-nowrap shadow-2xs border ${
                      isBest
                        ? 'bg-slate-900 text-white border-black font-bold'
                        : 'bg-white text-slate-700 border-slate-200'
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
      <div className="relative z-10 pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between text-[11px] text-slate-500 gap-1.5">
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-slate-700">Mục tiêu:</span>
          <span>
            <strong className="text-[#E31B23]">{target ? `(${Math.round(target.x)}, ${Math.round(target.y)})` : 'Chưa khai báo mục tiêu'}</strong>
          </span>
          {bestParticle && (
            <>
              <span>&bull;</span>
              <span>
                Dẫn đầu: <strong className="text-emerald-700">{bestParticle.label || bestParticle.id}</strong> (f = {bestParticle.fitness ?? 'chưa có điểm'})
              </span>
            </>
          )}
        </div>

        <div className="flex items-center gap-2 text-[10px]">
          <span className="flex items-center gap-1 text-[#E31B23] font-bold">
            <span className="w-2 h-2 rounded-full bg-[#E31B23]" /> Vị trí hiện tại
          </span>
          <span className="flex items-center gap-1 text-slate-400">
            Vector vận tốc được khai báo
          </span>
        </div>
      </div>
    </div>
  );
};
