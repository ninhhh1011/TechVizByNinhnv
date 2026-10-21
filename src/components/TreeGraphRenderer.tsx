import React, { FC, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { GitBranch, Sparkles } from 'lucide-react';
import { SimulationStep, TreeNodeItem } from '../types/simulation';

export interface TreeGraphRendererProps {
  step: SimulationStep;
  speed?: number;
}

interface ComputedNodePosition {
  x: number; // percentage 0 to 100
  y: number; // percentage 0 to 100
  node: TreeNodeItem;
}

export const TreeGraphRenderer: FC<TreeGraphRendererProps> = ({
  step,
  speed = 1,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // 1. Resolve treeData from step.treeData or step.visualData
  const treeData = useMemo(() => {
    if (step.treeData && step.treeData.treeNodes?.length > 0) {
      return step.treeData;
    }
    const vd = step.visualData;
    if (vd?.treeNodes && Array.isArray(vd.treeNodes) && vd.treeNodes.length > 0) {
      return {
        treeNodes: vd.treeNodes as TreeNodeItem[],
        activeNodeId: vd.activeNodeId,
        comparingNodeIds: vd.comparingNodeIds,
        highlightPathIds: vd.highlightPathIds,
        explanationDetail: vd.explanationDetail,
      };
    }
    return undefined;
  }, [step.treeData, step.visualData]);

  const treeNodes = treeData?.treeNodes || [];
  const activeNodeId = treeData?.activeNodeId;

  // 2. Group nodes by level and compute layout positions
  const { positionsMap, maxLevel, connections } = useMemo(() => {
    const map = new Map<string, ComputedNodePosition>();
    if (treeNodes.length === 0) {
      return { positionsMap: map, maxLevel: 0, connections: [] };
    }

    const levelMap = new Map<number, TreeNodeItem[]>();
    let highestLevel = 0;

    treeNodes.forEach((node) => {
      const lvl = node.level ?? 0;
      highestLevel = Math.max(highestLevel, lvl);
      const list = levelMap.get(lvl) || [];
      list.push(node);
      levelMap.set(lvl, list);
    });

    levelMap.forEach((nodesInLevel, level) => {
      const count = nodesInLevel.length;
      const yStep = highestLevel === 0 ? 50 : 16 + (level / highestLevel) * 68;

      nodesInLevel.forEach((node, idx) => {
        const xStep = count === 1 ? 50 : 12 + ((idx + 0.5) / count) * 76;
        map.set(node.id, {
          x: xStep,
          y: yStep,
          node,
        });
      });
    });

    const links: Array<{ fromId: string; toId: string; fromPos: ComputedNodePosition; toPos: ComputedNodePosition }> = [];
    treeNodes.forEach((node) => {
      if (node.parentId && map.has(node.parentId) && map.has(node.id)) {
        links.push({
          fromId: node.parentId,
          toId: node.id,
          fromPos: map.get(node.parentId)!,
          toPos: map.get(node.id)!,
        });
      }
    });

    return { positionsMap: map, maxLevel: highestLevel, connections: links };
  }, [treeNodes]);

  const springTransition = {
    type: 'spring' as const,
    stiffness: 280,
    damping: 24,
    duration: Math.max(0.3, 0.8 / speed),
  };

  if (!treeData || treeNodes.length === 0) {
    return (
      <div className="relative w-full h-full min-h-[440px] bg-white rounded-2xl border border-slate-200/90 shadow-xs p-8 flex flex-col items-center justify-center text-center">
        <div className="w-12 h-12 rounded-xl bg-red-50 text-[#E31B23] flex items-center justify-center mb-3">
          <GitBranch className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-bold text-slate-800 mb-1">
          Chưa có dữ liệu cây &amp; phân nhánh (Tree Graph Data)
        </h3>
        <p className="text-xs text-slate-500 max-w-sm">
          Bước này hiện chưa cấu hình dữ liệu cây nhị phân hoặc phân cấp.
        </p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full min-h-[440px] bg-white rounded-2xl border border-slate-200/90 shadow-xs p-4 sm:p-5 overflow-hidden flex flex-col justify-between select-none font-['Plus_Jakarta_Sans',sans-serif]"
    >
      {/* Background Architectural Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#F1F5F9_1px,transparent_1px),linear-gradient(to_bottom,#F1F5F9_1px,transparent_1px)] bg-[size:28px_28px] opacity-70 pointer-events-none" />

      {/* 1. Header Toolbar */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-100 mb-2">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#E31B23] animate-ping" />
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-800">
            Trực quan hóa Cây &amp; Đệ quy (Tree &amp; Hierarchy Stage)
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-50 border border-red-200 text-[#E31B23] font-bold text-[10px]">
            <GitBranch className="w-3 h-3" />
            Độ sâu: {maxLevel + 1} tầng
          </span>
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-600 font-semibold text-[10px]">
            Tổng: {treeNodes.length} nút
          </span>
        </div>
      </div>

      {/* 2. Main Visual Canvas */}
      <div className="relative z-20 w-full flex-1 min-h-[300px] rounded-xl bg-slate-50/70 border border-slate-200/80 overflow-hidden my-1 shadow-inner">
        {/* SVG Connecting Edges with Animated Flow */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
          <defs>
            <linearGradient id="treeEdgeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#E31B23" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#F23841" stopOpacity="0.4" />
            </linearGradient>
          </defs>

          {connections.map(({ fromId, toId, fromPos, toPos }) => {
            const isConnectingActive =
              activeNodeId === toId || activeNodeId === fromId ||
              fromPos.node.status === 'visiting' || toPos.node.status === 'visiting';

            return (
              <g key={`edge-${fromId}-${toId}`}>
                <line
                  x1={`${fromPos.x}%`}
                  y1={`${fromPos.y}%`}
                  x2={`${toPos.x}%`}
                  y2={`${toPos.y}%`}
                  stroke={isConnectingActive ? '#E31B23' : '#CBD5E1'}
                  strokeWidth={isConnectingActive ? 2.5 : 1.5}
                  strokeDasharray={isConnectingActive ? '6 4' : '3 3'}
                  className="transition-all duration-300"
                >
                  {isConnectingActive && (
                    <animate
                      attributeName="stroke-dashoffset"
                      from="20"
                      to="0"
                      dur="0.8s"
                      repeatCount="indefinite"
                    />
                  )}
                </line>
              </g>
            );
          })}
        </svg>

        {/* Render Tree Nodes */}
        {treeNodes.map((node) => {
          const pos = positionsMap.get(node.id);
          if (!pos) return null;

          const isCurrentActive = activeNodeId === node.id || node.status === 'visiting';
          const isVisited = node.status === 'visited';
          const isHighlight = node.status === 'highlight';

          return (
            <motion.div
              key={node.id}
              layout
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1, left: `${pos.x}%`, top: `${pos.y}%` }}
              transition={springTransition}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 z-20 cursor-pointer group"
            >
              <div
                className={`relative px-3 py-1.5 rounded-xl border transition-all duration-300 flex flex-col items-center justify-center min-w-[64px] shadow-xs ${
                  isCurrentActive
                    ? 'bg-gradient-to-r from-[#D91820] to-[#E31B23] text-white border-[#B80D14] ring-4 ring-red-100 shadow-md scale-105 z-30'
                    : isVisited
                    ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                    : isHighlight
                    ? 'bg-amber-50 text-amber-900 border-amber-300 ring-2 ring-amber-100'
                    : 'bg-white text-slate-800 border-slate-200 hover:border-red-300'
                }`}
              >
                {isCurrentActive && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-white animate-ping" />
                )}

                <span
                  className={`text-[9px] font-extrabold uppercase tracking-wider ${
                    isCurrentActive ? 'text-white/90' : 'text-slate-400'
                  }`}
                >
                  {node.label}
                </span>

                {node.value !== undefined && (
                  <span
                    className={`font-mono text-xs font-black ${
                      isCurrentActive ? 'text-white' : 'text-slate-900'
                    }`}
                  >
                    {node.value}
                  </span>
                )}

                {node.details && (
                  <span
                    className={`text-[8px] mt-0.5 max-w-[80px] truncate ${
                      isCurrentActive ? 'text-white/80' : 'text-slate-400'
                    }`}
                    title={node.details}
                  >
                    {node.details}
                  </span>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* 3. Footer Metadata */}
      <div className="relative z-10 pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between text-[11px] text-slate-500 gap-1.5">
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-slate-700">Duyệt:</span>
          <span>Từ gốc (Root) đến nhánh lá (Leaf)</span>
          {treeData.explanationDetail && (
            <span className="text-[#E31B23] font-medium ml-1">
              &bull; {treeData.explanationDetail}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2.5 text-[10px]">
          <span className="flex items-center gap-1 text-[#E31B23] font-bold">
            <span className="w-2 h-2 rounded-full bg-[#E31B23]" /> Visiting
          </span>
          <span className="flex items-center gap-1 text-emerald-700 font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-500" /> Visited
          </span>
          <span className="flex items-center gap-1 text-slate-400">
            <span className="w-2 h-2 rounded-full bg-slate-200" /> Pending
          </span>
        </div>
      </div>
    </div>
  );
};
