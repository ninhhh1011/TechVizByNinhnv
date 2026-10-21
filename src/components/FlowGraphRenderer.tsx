import React, { useRef, useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Server,
  Database,
  Cpu,
  Layers,
  Send,
  Radio,
  Brain,
  Zap,
  AlertTriangle,
  RotateCcw,
  ShieldAlert,
} from 'lucide-react';
import {
  SimulationNode,
  SimulationStep,
} from '../types/simulation';

interface FlowGraphRendererProps {
  nodes: SimulationNode[];
  step: SimulationStep;
  activeNodeIds: Set<string>;
  speed: number;
  laneTitles?: string[];
}

interface NodePosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

const getNodeIcon = (iconName: string) => {
  switch (iconName.toLowerCase()) {
    case 'send':
      return <Send className="w-5 h-5" />;
    case 'layers':
      return <Layers className="w-5 h-5" />;
    case 'cpu':
      return <Cpu className="w-5 h-5" />;
    case 'database':
      return <Database className="w-5 h-5" />;
    case 'server':
      return <Server className="w-5 h-5" />;
    case 'radio':
      return <Radio className="w-5 h-5" />;
    case 'brain':
      return <Brain className="w-5 h-5" />;
    default:
      return <Zap className="w-5 h-5" />;
  }
};

export const FlowGraphRenderer: React.FC<FlowGraphRendererProps> = ({
  nodes,
  step,
  activeNodeIds,
  speed,
  laneTitles,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const [positions, setPositions] = useState<Map<string, NodePosition>>(new Map());

  // 1. Phân nhóm các Node thành các Cột / Tầng (Stages / Lanes) một cách linh hoạt (từ 2 đến 6 cột)
  const layers = useMemo(() => {
    // Thu thập danh sách các tầng xuất hiện theo thứ tự
    const layerOrder: string[] = [];
    const layerMap: Record<string, SimulationNode[]> = {};

    nodes.forEach((node) => {
      const layerKey = (node.layer || 'compute').toLowerCase();
      if (!layerMap[layerKey]) {
        layerOrder.push(layerKey);
        layerMap[layerKey] = [];
      }
      layerMap[layerKey].push(node);
    });

    // Nếu tất cả các node đều chung 1 tầng nhưng có nhiều node, tự động tách mỗi node thành 1 cột
    if (layerOrder.length === 1 && nodes.length > 1) {
      return nodes.map((node, idx) => ({
        key: node.id,
        title: laneTitles?.[idx] || node.name || `Thành phần ${idx + 1}`,
        nodes: [node],
      }));
    }

    // Ghép tiêu đề cột theo laneTitles truyền vào hoặc tự động suy luận thông minh
    return layerOrder.map((key, idx) => {
      let title = laneTitles?.[idx];
      if (!title) {
        switch (key) {
          case 'ingress':
          case 'client':
            title = 'Tiếp nhận (Client / Ingress)';
            break;
          case 'gateway':
            title = 'Điều phối (Gateway / Router)';
            break;
          case 'compute':
          case 'service':
            title = 'Xử lý (Compute / Service)';
            break;
          case 'storage':
          case 'database':
            title = 'Dữ liệu (Storage / DB)';
            break;
          case 'egress':
          case 'worker':
            title = 'Đầu ra (Egress / Workers)';
            break;
          default:
            title = key.charAt(0).toUpperCase() + key.slice(1);
        }
      }
      return {
        key,
        title,
        nodes: layerMap[key],
      };
    });
  }, [nodes, laneTitles]);

  // Dynamic CSS grid class based on number of columns
  const gridColsClass = useMemo(() => {
    const count = layers.length;
    if (count <= 1) return 'grid-cols-1';
    if (count === 2) return 'grid-cols-1 sm:grid-cols-2';
    if (count === 3) return 'grid-cols-1 sm:grid-cols-3';
    if (count === 4) return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4';
    if (count === 5) return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-5';
    return 'grid-cols-1 sm:grid-cols-3 lg:grid-cols-6';
  }, [layers.length]);

  // Measure node center positions relative to the container
  const updatePositions = () => {
    if (!containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const newPositions = new Map<string, NodePosition>();

    nodeRefs.current.forEach((el, id) => {
      if (el) {
        const rect = el.getBoundingClientRect();
        newPositions.set(id, {
          x: rect.left - containerRect.left + rect.width / 2,
          y: rect.top - containerRect.top + rect.height / 2,
          width: rect.width,
          height: rect.height,
        });
      }
    });

    setPositions(newPositions);
  };

  useEffect(() => {
    updatePositions();
    window.addEventListener('resize', updatePositions);
    const timer = setTimeout(updatePositions, 100);
    return () => {
      window.removeEventListener('resize', updatePositions);
      clearTimeout(timer);
    };
  }, [nodes, step]);

  // Animation duration calculated from speed
  const animDuration = Math.max(0.8, 2.2 / speed);

  return (
    <div
      ref={containerRef}
      className="relative w-full min-h-[500px] bg-white rounded-[16px] border border-[#EDEDED] shadow-[0_4px_16px_rgba(0,0,0,0.06)] p-5 sm:p-6 overflow-hidden flex flex-col justify-between"
    >
      {/* Background Architectural Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#F5F6F8_1px,transparent_1px),linear-gradient(to_bottom,#F5F6F8_1px,transparent_1px)] bg-[size:28px_28px] opacity-80 pointer-events-none" />

      {/* Header of Topology Stage */}
      <div className="relative z-10 flex items-center justify-between pb-3.5 border-b border-[#F0F0F0] mb-3">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-[#E31B23] animate-ping" />
          <span className="text-xs font-bold uppercase tracking-wider text-[#1A1A1A]">
            SƠ ĐỒ TRỰC QUAN HÓA TOÀN CẢNH (TOPOLOGY STAGE)
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs text-[#757575]">
          <span className="flex items-center gap-1.5 font-medium">
            <span className="w-2 h-2 rounded-full bg-[#E31B23]" /> Đang hoạt động
          </span>
          <span className="flex items-center gap-1.5 font-medium">
            <span className="w-2 h-2 rounded-full bg-red-400" /> Bị sập (Chaos)
          </span>
        </div>
      </div>

      {/* SVG Connecting Paths with Directional Arrowheads */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
        <defs>
          <linearGradient id="normalGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#E31B23" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#F23841" stopOpacity="0.95" />
          </linearGradient>

          <marker
            id="packetArrow"
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 1 L 9 5 L 0 9 z" fill="#E31B23" />
          </marker>

          <marker
            id="failedArrow"
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 1 L 9 5 L 0 9 z" fill="#EF4444" />
          </marker>
        </defs>

        {/* Directional Connection Tracks */}
        {(step.packets || []).map((pkt) => {
          const fromPos = positions.get(pkt.fromNodeId);
          let toId = pkt.toNodeId;

          const isTargetDown = !activeNodeIds.has(pkt.toNodeId);
          if (isTargetDown && pkt.fallbackToNodeId && activeNodeIds.has(pkt.fallbackToNodeId)) {
            toId = pkt.fallbackToNodeId;
          }

          const toPos = positions.get(toId);
          if (!fromPos || !toPos) return null;

          const startX = fromPos.x + fromPos.width / 2;
          const startY = fromPos.y;
          const endX = toPos.x - toPos.width / 2;
          const endY = toPos.y;

          const dx = endX - startX;
          const curveFactor = Math.max(30, Math.min(Math.abs(dx) * 0.45, 120));
          const pathD = `M ${startX} ${startY} C ${startX + curveFactor} ${startY}, ${
            endX - curveFactor
          } ${endY}, ${endX} ${endY}`;

          return (
            <g key={`track-${pkt.id}`}>
              {/* Background Dashed Track */}
              <path
                d={pathD}
                fill="none"
                stroke="#E5E7EB"
                strokeWidth="2.5"
                strokeDasharray="4 4"
              />
              {/* Active Directional Glow Path with Arrowhead */}
              <path
                d={pathD}
                fill="none"
                stroke="url(#normalGrad)"
                strokeWidth="2.5"
                strokeDasharray="6 4"
                markerEnd="url(#packetArrow)"
                opacity="0.85"
              />
            </g>
          );
        })}
      </svg>

      {/* Columns with Node Cards (No truncation, natural wrapping & adaptive lane titles) */}
      <div className={`relative z-20 grid ${gridColsClass} gap-4 sm:gap-5 my-auto py-3`}>
        {layers.map((layer) => (
          <div
            key={layer.key}
            className="flex flex-col gap-3 p-3 rounded-[14px] bg-[#F5F6F8]/70 border border-[#E5E7EB]/90 shadow-xs"
          >
            {/* Adaptive Lane Title */}
            <div className="text-[11px] font-extrabold uppercase tracking-wider text-[#4B5563] px-1 pb-1.5 border-b border-gray-200/90 flex items-center justify-between">
              <span>{layer.title}</span>
              <span className="text-[10px] font-mono text-gray-400 bg-white px-1.5 py-0.5 rounded border border-gray-200">
                {layer.nodes.length} node
              </span>
            </div>

            <div className="flex flex-col gap-3">
              {layer.nodes.map((node) => {
                const isActive = activeNodeIds.has(node.id);
                const isHighlighted = step.activeHighlights?.includes(node.id);

                return (
                  <div
                    key={node.id}
                    ref={(el) => {
                      if (el) nodeRefs.current.set(node.id, el);
                      else nodeRefs.current.delete(node.id);
                    }}
                    className={`relative p-3.5 rounded-[12px] border transition-all duration-300 min-h-[135px] flex flex-col justify-between ${
                      !isActive
                        ? 'bg-red-50/70 border-dashed border-red-300 shadow-none'
                        : isHighlighted
                        ? 'bg-[#FFFFFF] border-[#E31B23] shadow-[0_4px_16px_rgba(227,27,35,0.18)] ring-2 ring-red-100'
                        : 'bg-[#FFFFFF] border-[#EDEDED] shadow-[0_2px_8px_rgba(0,0,0,0.04)]'
                    }`}
                  >
                    {/* Node Header & Icon */}
                    <div className="flex items-start gap-2.5 mb-2">
                      <div
                        className={`p-2 rounded-lg transition-colors shrink-0 mt-0.5 ${
                          !isActive
                            ? 'bg-red-100 text-[#E31B23]'
                            : isHighlighted
                            ? 'bg-gradient-to-r from-[#D91820] to-[#F23841] text-white shadow-sm'
                            : 'bg-[#F5F6F8] text-[#5A5A5A]'
                        }`}
                      >
                        {getNodeIcon(node.icon)}
                      </div>
                      <div className="min-w-0 flex-1">
                        {/* 100% full text display with natural wrapping, zero truncation */}
                        <h4
                          className={`text-sm font-bold break-words leading-snug ${
                            !isActive ? 'text-red-700 line-through' : 'text-[#1A1A1A]'
                          }`}
                        >
                          {node.name}
                        </h4>
                        <p className="text-[11px] text-[#757575] break-words leading-tight mt-0.5 font-medium">
                          {node.role}
                        </p>
                      </div>
                    </div>

                    {/* Node Description (Full pedagogical detail without line clamp) */}
                    <p className="text-[11px] text-[#5A5A5A] leading-relaxed mb-3 break-words">
                      {node.description}
                    </p>

                    {/* Node Footer: Adaptive Lane Tag & Real-time Status */}
                    <div className="pt-2 border-t border-[#F0F0F0] flex items-center justify-between text-[10px]">
                      <span className="font-semibold text-gray-500 uppercase tracking-wider text-[10px]">
                        {layer.title || node.layer}
                      </span>
                      {isActive ? (
                        <span className="inline-flex items-center gap-1 font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          ONLINE
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded-full border border-red-200">
                          <ShieldAlert className="w-3 h-3" />
                          CRASHED
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Floating Animated Packets: Elevated Sky Corridor (Never obscuring Node Card contents) */}
      <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden">
        <AnimatePresence>
          {(step.packets || []).map((pkt) => {
            const fromPos = positions.get(pkt.fromNodeId);
            let toId = pkt.toNodeId;
            let packetStatus = pkt.type || 'normal';

            const isTargetDown = !activeNodeIds.has(pkt.toNodeId);
            const isSourceDown = !activeNodeIds.has(pkt.fromNodeId);

            if (isSourceDown) {
              packetStatus = 'failed';
            } else if (isTargetDown) {
              if (pkt.fallbackToNodeId && activeNodeIds.has(pkt.fallbackToNodeId)) {
                toId = pkt.fallbackToNodeId;
                packetStatus = 'rerouted';
              } else {
                packetStatus = 'failed';
              }
            }

            const toPos = positions.get(toId);
            if (!fromPos || !toPos) return null;

            // Elevated trajectory: fly right above the cards in the open clearance zone
            const pStartX = fromPos.x;
            const pStartY = Math.max(20, fromPos.y - fromPos.height / 2 - 28);
            const pEndX = packetStatus === 'failed' && isTargetDown ? (fromPos.x + toPos.x) / 2 : toPos.x;
            const pEndY = Math.max(20, toPos.y - toPos.height / 2 - 28);

            return (
              <motion.div
                key={`pkt-${pkt.id}-${step.stepIndex}-${toId}-${packetStatus}`}
                initial={{
                  x: pStartX - 60,
                  y: pStartY,
                  opacity: 0,
                  scale: 0.85,
                }}
                animate={{
                  x: [pStartX - 60, pEndX - 60],
                  y: [pStartY, pEndY],
                  opacity: [0, 1, 1, 0.95],
                  scale: [0.85, 1, 1, 0.9],
                }}
                transition={{
                  duration: animDuration,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  repeatDelay: 0.3,
                }}
                className="absolute left-0 top-0"
              >
                <div
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold shadow-xl backdrop-blur-md border ${
                    packetStatus === 'failed'
                      ? 'bg-red-600 text-white border-red-300 shadow-red-500/40'
                      : packetStatus === 'rerouted'
                      ? 'bg-amber-600 text-white border-amber-300 shadow-amber-500/40'
                      : 'bg-gradient-to-r from-[#D91820] to-[#F23841] text-white border-white/80 shadow-[0_4px_14px_rgba(227,27,35,0.45)]'
                  }`}
                >
                  {packetStatus === 'failed' ? (
                    <AlertTriangle className="w-3.5 h-3.5 text-white animate-bounce shrink-0" />
                  ) : packetStatus === 'rerouted' ? (
                    <RotateCcw className="w-3.5 h-3.5 text-white animate-spin shrink-0" />
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-white animate-ping shrink-0" />
                  )}
                  <span className="font-mono text-[11px] whitespace-nowrap">{pkt.label}</span>
                  {packetStatus === 'rerouted' && (
                    <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded uppercase tracking-wider">
                      Rerouted
                    </span>
                  )}
                  {packetStatus === 'failed' && (
                    <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded uppercase tracking-wider">
                      Dropped
                    </span>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
};
