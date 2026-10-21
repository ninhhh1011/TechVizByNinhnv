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
import { SimulationNode, SimulationStep } from '../types/simulation';

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
  switch (iconName?.toLowerCase()) {
    case 'send':
      return <Send className="w-4 h-4" />;
    case 'layers':
      return <Layers className="w-4 h-4" />;
    case 'cpu':
      return <Cpu className="w-4 h-4" />;
    case 'database':
      return <Database className="w-4 h-4" />;
    case 'server':
      return <Server className="w-4 h-4" />;
    case 'radio':
      return <Radio className="w-4 h-4" />;
    case 'brain':
      return <Brain className="w-4 h-4" />;
    default:
      return <Zap className="w-4 h-4" />;
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

  // 1. Phân nhóm các Node thành các Tầng / Cột linh hoạt (từ 2 đến 6 cột)
  const layers = useMemo(() => {
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

    if (layerOrder.length === 1 && nodes.length > 1) {
      return nodes.map((node, idx) => ({
        key: node.id,
        title: laneTitles?.[idx] || node.name || `Tầng ${idx + 1}`,
        nodes: [node],
      }));
    }

    return layerOrder.map((key, idx) => {
      let title = laneTitles?.[idx];
      if (!title) {
        switch (key) {
          case 'ingress':
          case 'client':
            title = 'Tiếp nhận (Ingress)';
            break;
          case 'gateway':
            title = 'Điều phối (Gateway)';
            break;
          case 'compute':
          case 'service':
            title = 'Xử lý (Compute)';
            break;
          case 'storage':
          case 'database':
            title = 'Dữ liệu (Storage)';
            break;
          case 'egress':
          case 'worker':
            title = 'Đầu ra (Egress)';
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

  // Measure node center positions using offset coordinates for zoom robustness
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
    const timer = setTimeout(updatePositions, 80);
    return () => {
      window.removeEventListener('resize', updatePositions);
      clearTimeout(timer);
    };
  }, [nodes, step]);

  const animDuration = Math.max(0.7, 2.0 / speed);
  const hasActiveHighlights = (step.activeHighlights?.length ?? 0) > 0;

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full min-h-[440px] bg-white rounded-2xl border border-slate-200/90 shadow-xs p-4 sm:p-5 overflow-hidden flex flex-col justify-between font-['Plus_Jakarta_Sans',sans-serif] select-none"
    >
      {/* Background Architectural Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#F1F5F9_1px,transparent_1px),linear-gradient(to_bottom,#F1F5F9_1px,transparent_1px)] bg-[size:28px_28px] opacity-70 pointer-events-none" />

      {/* Header of Topology Stage */}
      <div className="relative z-10 flex items-center justify-between pb-2.5 border-b border-slate-100 mb-2">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#E31B23] animate-ping" />
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-800">
            Sơ đồ Trực quan Hệ thống (Flow Graph Stage)
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span className="flex items-center gap-1.5 font-semibold text-[11px]">
            <span className="w-2 h-2 rounded-full bg-[#E31B23]" /> Đang xử lý
          </span>
          <span className="flex items-center gap-1.5 font-semibold text-[11px]">
            <span className="w-2 h-2 rounded-full bg-slate-300" /> Chờ lượt
          </span>
        </div>
      </div>

      {/* SVG Connecting Paths with Flowing Animated Strokes */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
        <defs>
          <linearGradient id="flowGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#E31B23" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#F23841" stopOpacity="0.95" />
          </linearGradient>

          <marker
            id="flowArrow"
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 1 L 9 5 L 0 9 z" fill="#E31B23" />
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
              {/* Background Base Track */}
              <path
                d={pathD}
                fill="none"
                stroke="#E2E8F0"
                strokeWidth="2.5"
                strokeDasharray="4 4"
              />
              {/* Active Flowing Animated Dash Stream */}
              <path
                d={pathD}
                fill="none"
                stroke="url(#flowGrad)"
                strokeWidth="2.5"
                strokeDasharray="8 6"
                markerEnd="url(#flowArrow)"
                opacity="0.9"
              >
                <animate
                  attributeName="stroke-dashoffset"
                  from="28"
                  to="0"
                  dur={`${Math.max(0.6, 1.6 / speed)}s`}
                  repeatCount="indefinite"
                />
              </path>
            </g>
          );
        })}
      </svg>

      {/* Columns with Node Cards */}
      <div className={`relative z-20 grid ${gridColsClass} gap-3 sm:gap-4 my-auto py-2`}>
        {layers.map((layer) => (
          <div
            key={layer.key}
            className="flex flex-col gap-2.5 p-2.5 rounded-xl bg-slate-50/80 border border-slate-200/80 shadow-2xs"
          >
            {/* Lane Title */}
            <div className="text-[10px] font-black uppercase tracking-wider text-slate-500 px-1 pb-1 border-b border-slate-200 flex items-center justify-between">
              <span>{layer.title}</span>
              <span className="font-mono text-slate-400 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                {layer.nodes.length}
              </span>
            </div>

            <div className="flex flex-col gap-2.5">
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
                    className={`relative p-3 rounded-xl border transition-all duration-300 min-h-[110px] flex flex-col justify-between ${
                      !isActive
                        ? 'bg-red-50/60 border-dashed border-red-300 opacity-60'
                        : isHighlighted
                        ? 'bg-white border-[#E31B23] shadow-[0_8px_24px_rgba(227,27,35,0.22)] ring-4 ring-red-100 scale-[1.02] z-20'
                        : hasActiveHighlights
                        ? 'bg-white/70 border-slate-200 opacity-65'
                        : 'bg-white border-slate-200 shadow-xs hover:border-slate-300'
                    }`}
                  >
                    {/* Node Header & Icon */}
                    <div className="flex items-start gap-2 mb-1.5">
                      <div
                        className={`p-1.5 rounded-lg transition-colors shrink-0 ${
                          !isActive
                            ? 'bg-red-100 text-[#E31B23]'
                            : isHighlighted
                            ? 'bg-gradient-to-r from-[#D91820] to-[#E31B23] text-white shadow-xs'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {getNodeIcon(node.icon)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4
                          className={`text-xs font-black break-words leading-tight ${
                            !isActive ? 'text-red-700 line-through' : 'text-slate-900'
                          }`}
                        >
                          {node.name}
                        </h4>
                        <p className="text-[10px] text-slate-500 break-words leading-tight mt-0.5 font-medium">
                          {node.role}
                        </p>
                      </div>
                    </div>

                    {/* Node Description */}
                    <p className="text-[10px] text-slate-600 leading-relaxed mb-2 break-words">
                      {node.description}
                    </p>

                    {/* Node Footer */}
                    <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between text-[9px]">
                      <span className="font-bold text-slate-400 uppercase tracking-wider">
                        {layer.title || node.layer}
                      </span>
                      {isActive ? (
                        <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          ONLINE
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 font-bold text-red-700 bg-red-100 px-1.5 py-0.5 rounded-full border border-red-200">
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

      {/* Floating Animated Packets */}
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

            const pStartX = fromPos.x;
            const pStartY = Math.max(16, fromPos.y - fromPos.height / 2 - 24);
            const pEndX = packetStatus === 'failed' && isTargetDown ? (fromPos.x + toPos.x) / 2 : toPos.x;
            const pEndY = Math.max(16, toPos.y - toPos.height / 2 - 24);

            return (
              <motion.div
                key={`pkt-${pkt.id}-${step.stepIndex}-${toId}-${packetStatus}`}
                initial={{
                  x: pStartX - 50,
                  y: pStartY,
                  opacity: 0,
                  scale: 0.85,
                }}
                animate={{
                  x: [pStartX - 50, pEndX - 50],
                  y: [pStartY, pEndY],
                  opacity: [0, 1, 1, 0.95],
                  scale: [0.85, 1, 1, 0.9],
                }}
                transition={{
                  duration: animDuration,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  repeatDelay: 0.25,
                }}
                className="absolute left-0 top-0"
              >
                <div
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold shadow-md backdrop-blur-md border ${
                    packetStatus === 'failed'
                      ? 'bg-red-600 text-white border-red-300 shadow-red-500/40'
                      : packetStatus === 'rerouted'
                      ? 'bg-amber-600 text-white border-amber-300 shadow-amber-500/40'
                      : 'bg-gradient-to-r from-[#D91820] to-[#E31B23] text-white border-white/80 shadow-[0_4px_12px_rgba(227,27,35,0.4)]'
                  }`}
                >
                  {packetStatus === 'failed' ? (
                    <AlertTriangle className="w-3 h-3 text-white animate-bounce shrink-0" />
                  ) : packetStatus === 'rerouted' ? (
                    <RotateCcw className="w-3 h-3 text-white animate-spin shrink-0" />
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping shrink-0" />
                  )}
                  <span className="font-mono text-[10px] whitespace-nowrap">{pkt.label}</span>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
};
