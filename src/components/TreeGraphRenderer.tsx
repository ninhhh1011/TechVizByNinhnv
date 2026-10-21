import React, { FC, useMemo, useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { GitBranch, Sparkles, CheckCircle2, Eye, Info } from 'lucide-react';
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

    // Group by level
    const levelMap = new Map<number, TreeNodeItem[]>();
    let highestLevel = 0;

    treeNodes.forEach((node) => {
      const lvl = node.level ?? 0;
      highestLevel = Math.max(highestLevel, lvl);
      const list = levelMap.get(lvl) || [];
      list.push(node);
      levelMap.set(lvl, list);
    });

    // Compute (x, y) for each node
    levelMap.forEach((nodesInLevel, level) => {
      const count = nodesInLevel.length;
      // y evenly distributed based on level
      const yStep = highestLevel === 0 ? 50 : 16 + (level / highestLevel) * 68;

      nodesInLevel.forEach((node, idx) => {
        // x evenly distributed in this level
        const xStep = count === 1 ? 50 : 12 + ((idx + 0.5) / count) * 76;
        map.set(node.id, {
          x: xStep,
          y: yStep,
          node,
        });
      });
    });

    // Build connections list (from parent to child)
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

  // Framer motion spring
  const springTransition = {
    type: 'spring' as const,
    stiffness: 260,
    damping: 24,
    duration: Math.max(0.3, 0.8 / speed),
  };

  if (!treeData || treeNodes.length === 0) {
    return (
      <div className="relative w-full min-h-[480px] bg-white rounded-[16px] border border-[#EDEDED] shadow-[0_4px_16px_rgba(0,0,0,0.06)] p-8 flex flex-col items-center justify-center text-center">
        <div className="w-14 h-14 rounded-2xl bg-red-50 text-[#E31B23] flex items-center justify-center mb-4">
          <GitBranch className="w-7 h-7" />
        </div>
        <h3 className="text-base font-bold text-[#1A1A1A] mb-1">
          Chưa có dữ liệu cây &amp; phân nhánh (Tree Graph Data)
        </h3>
        <p className="text-xs text-[#757575] max-w-md">
          Bước này hiện chưa cấu hình <code>treeData</code> hoặc <code>visualData.treeNodes</code>.
        </p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full min-h-[500px] bg-white rounded-[16px] border border-[#EDEDED] shadow-[0_4px_16px_rgba(0,0,0,0.06)] p-5 sm:p-6 overflow-hidden flex flex-col justify-between select-none"
    >
      {/* Background Architectural Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#F5F6F8_1px,transparent_1px),linear-gradient(to_bottom,#F5F6F8_1px,transparent_1px)] bg-[size:28px_28px] opacity-80 pointer-events-none" />

      {/* 1. Header Toolbar */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 pb-3.5 border-b border-[#F0F0F0] mb-2">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-[#E31B23] animate-ping" />
          <span className="text-xs font-bold uppercase tracking-wider text-[#1A1A1A]">
            TRỰC QUAN HÓA CÂY PHÂN NHÁNH &amp; ĐỆ QUY (TREE &amp; HIERARCHY STAGE)
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 border border-red-200 text-[#D91820] font-bold text-[11px]">
            <GitBranch className="w-3.5 h-3.5" />
            Độ sâu / Tầng: {maxLevel + 1} tầng
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 border border-gray-200 text-gray-700 font-medium text-[11px]">
            Tổng nút: {treeNodes.length} nodes
          </span>
        </div>
      </div>

      {/* 2. Main Visual Canvas */}
      <div className="relative z-20 w-full flex-1 min-h-[380px] sm:min-h-[420px] rounded-[14px] bg-[#FAFAFB] border border-[#E5E7EB] overflow-hidden my-2 shadow-inner">
        {/* SVG Connecting Edges */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
          <defs>
            <linearGradient id="treeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#E31B23" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#F23841" stopOpacity="0.4" />
            </linearGradient>
          </defs>

          {connections.map(({ fromId, toId, fromPos, toPos }) => {
            const isConnectingActive =
              activeNodeId === toId || activeNodeId === fromId ||
              fromPos.node.status === 'visiting' || toPos.node.status === 'visiting';

            return (
              <line
                key={`edge-${fromId}-${toId}`}
                x1={`${fromPos.x}%`}
                y1={`${fromPos.y}%`}
                x2={`${toPos.x}%`}
                y2={`${toPos.y}%`}
                stroke={isConnectingActive ? '#E31B23' : '#D1D5DB'}
                strokeWidth={isConnectingActive ? 2.5 : 1.5}
                strokeDasharray={isConnectingActive ? undefined : '4 3'}
                className="transition-all duration-300"
              />
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
                className={`relative px-3.5 py-2 rounded-[12px] border transition-all duration-300 flex flex-col items-center justify-center min-w-[70px] shadow-sm ${
                  isCurrentActive
                    ? 'bg-gradient-to-r from-[#D91820] to-[#F23841] text-white border-[#B80D14] ring-4 ring-red-200 shadow-lg scale-105'
                    : isVisited
                    ? 'bg-emerald-50 text-emerald-900 border-emerald-300 shadow-sm'
                    : isHighlight
                    ? 'bg-amber-50 text-amber-900 border-amber-300 ring-2 ring-amber-100'
                    : 'bg-white text-gray-800 border-gray-200 hover:border-red-300'
                }`}
              >
                {/* Node Status Indicator Dot */}
                {isCurrentActive && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-white animate-ping" />
                )}

                {/* Node Title / Label */}
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider ${
                    isCurrentActive ? 'text-white/90' : 'text-gray-500'
                  }`}
                >
                  {node.label}
                </span>

                {/* Node Main Value */}
                {node.value !== undefined && (
                  <span
                    className={`font-mono text-xs sm:text-sm font-extrabold ${
                      isCurrentActive ? 'text-white' : 'text-[#1A1A1A]'
                    }`}
                  >
                    {node.value}
                  </span>
                )}

                {/* Level / Subtitle Badge */}
                {node.details && (
                  <span
                    className={`text-[9px] mt-0.5 max-w-[90px] truncate ${
                      isCurrentActive ? 'text-white/80' : 'text-gray-400'
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
      <div className="relative z-10 pt-3 border-t border-[#F0F0F0] flex flex-wrap items-center justify-between text-xs text-[#757575] gap-2">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-[#1A1A1A]">Cấu trúc:</span>
          <span>Phân tầng từ gốc (Root) đến lá (Leaf)</span>
          {treeData.explanationDetail && (
            <>
              <span>&bull;</span>
              <span className="text-[#E31B23] font-medium">{treeData.explanationDetail}</span>
            </>
          )}
        </div>

        <div className="flex items-center gap-3 text-[11px]">
          <span className="flex items-center gap-1.5 text-[#D91820] font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-[#E31B23]" /> Đang duyệt (Visiting)
          </span>
          <span className="flex items-center gap-1.5 text-emerald-700 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Đã duyệt (Visited)
          </span>
          <span className="flex items-center gap-1.5 text-gray-500">
            <span className="w-2.5 h-2.5 rounded-full bg-gray-200 border border-gray-400" /> Chưa xét
          </span>
        </div>
      </div>
    </div>
  );
};
