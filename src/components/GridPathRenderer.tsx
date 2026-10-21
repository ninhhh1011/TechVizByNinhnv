import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Sparkles,
  Trash2,
  RotateCcw,
  Flag,
  Target,
  Compass,
  Move,
  Hash,
  Navigation,
  CheckCircle2,
  AlertCircle,
  Footprints,
  Info,
} from 'lucide-react';
import { SimulationNode, SimulationStep } from '../types/simulation';
import { DEFAULT_GRID_CONFIG } from '../data/gridPresets';

export interface GridPathRendererProps {
  nodes?: SimulationNode[];
  step: SimulationStep;
  activeNodeIds: Set<string>;
  speed?: number;
  rows?: number;
  cols?: number;
}

interface PathResult {
  visitedOrder: [number, number][];
  visitedSet: Set<string>;
  path: [number, number][];
  pathSet: Set<string>;
  costs: Map<string, number>;
  found: boolean;
  totalCost: number;
}

export const GridPathRenderer: React.FC<GridPathRendererProps> = ({
  nodes,
  step,
  activeNodeIds,
  rows = DEFAULT_GRID_CONFIG.rows,
  cols = DEFAULT_GRID_CONFIG.cols,
}) => {
  // 1. Resolve 4 Switch States from activeNodeIds (with multiple fallback keys)
  const useHeuristic =
    activeNodeIds.has('useHeuristic') ||
    activeNodeIds.has('node-heuristic') ||
    (nodes?.[0] ? activeNodeIds.has(nodes[0].id) : true);

  const allowDiagonal =
    activeNodeIds.has('allowDiagonal') ||
    activeNodeIds.has('node-diagonal') ||
    (nodes?.[1] ? activeNodeIds.has(nodes[1].id) : false);

  const showWeights =
    activeNodeIds.has('showWeights') ||
    activeNodeIds.has('node-weights') ||
    (nodes?.[2] ? activeNodeIds.has(nodes[2].id) : true);

  const autoTracePath =
    activeNodeIds.has('autoTracePath') ||
    activeNodeIds.has('node-trace') ||
    (nodes?.[3] ? activeNodeIds.has(nodes[3].id) : true);

  // 2. Start & Target coordinates
  const start = useMemo<[number, number]>(
    () => step.gridData?.start || DEFAULT_GRID_CONFIG.start,
    [step.gridData?.start]
  );
  const end = useMemo<[number, number]>(
    () => step.gridData?.end || DEFAULT_GRID_CONFIG.end,
    [step.gridData?.end]
  );

  // 3. Wall Management (allows real-time drawing & erasing)
  const [walls, setWalls] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    const presetWalls = DEFAULT_GRID_CONFIG.initialWalls || [];
    presetWalls.forEach(([r, c]) => initial.add(`${r},${c}`));
    return initial;
  });

  // Track if user has customized walls or wants step-by-step playback view
  const [isInteractiveMode, setIsInteractiveMode] = useState(false);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [dragMode, setDragMode] = useState<'add' | 'remove' | null>(null);

  // Global mouse up listener for smooth drag release
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      setIsMouseDown(false);
      setDragMode(null);
    };
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, []);

  // When step changes, if not in manual interactive drawing, sync to step's scenario
  const prevStepRef = useRef<number>(step.stepIndex);
  useEffect(() => {
    if (prevStepRef.current !== step.stepIndex) {
      prevStepRef.current = step.stepIndex;
      // When user uses playback buttons, keep preset walls synced
      if (!isInteractiveMode) {
        const initial = new Set<string>();
        const presetWalls = DEFAULT_GRID_CONFIG.initialWalls || [];
        presetWalls.forEach(([r, c]) => initial.add(`${r},${c}`));
        setWalls(initial);
      }
    }
  }, [step.stepIndex, isInteractiveMode]);

  // 4. Live A* / Dijkstra Solver Engine
  const liveResult = useMemo<PathResult>(() => {
    const [sr, sc] = start;
    const [er, ec] = end;
    const startKey = `${sr},${sc}`;
    const endKey = `${er},${ec}`;

    const gScore = new Map<string, number>();
    const fScore = new Map<string, number>();
    const cameFrom = new Map<string, [number, number]>();
    const visitedOrder: [number, number][] = [];
    const visitedSet = new Set<string>();

    const h = (r: number, c: number): number => {
      if (!useHeuristic) return 0;
      const dx = Math.abs(r - er);
      const dy = Math.abs(c - ec);
      if (allowDiagonal) {
        // Octile distance for 8-direction movement
        return Math.max(dx, dy) + (Math.SQRT2 - 1) * Math.min(dx, dy);
      }
      // Manhattan distance for 4-direction movement
      return dx + dy;
    };

    gScore.set(startKey, 0);
    fScore.set(startKey, h(sr, sc));

    const openSet: string[] = [startKey];
    const closedSet = new Set<string>();

    // Movement vectors: 4-way or 8-way
    const dirs: [number, number, number][] = allowDiagonal
      ? [
          [-1, 0, 1],
          [1, 0, 1],
          [0, -1, 1],
          [0, 1, 1],
          [-1, -1, Math.SQRT2],
          [-1, 1, Math.SQRT2],
          [1, -1, Math.SQRT2],
          [1, 1, Math.SQRT2],
        ]
      : [
          [-1, 0, 1],
          [1, 0, 1],
          [0, -1, 1],
          [0, 1, 1],
        ];

    let found = false;

    while (openSet.length > 0) {
      // Find node in openSet with minimum fScore
      let bestIdx = 0;
      let bestF = fScore.get(openSet[0]) ?? Infinity;
      for (let i = 1; i < openSet.length; i++) {
        const f = fScore.get(openSet[i]) ?? Infinity;
        if (f < bestF) {
          bestF = f;
          bestIdx = i;
        }
      }

      const currentKey = openSet.splice(bestIdx, 1)[0];
      closedSet.add(currentKey);
      const [cr, cc] = currentKey.split(',').map(Number);
      visitedOrder.push([cr, cc]);
      visitedSet.add(currentKey);

      if (currentKey === endKey) {
        found = true;
        break;
      }

      const curG = gScore.get(currentKey) ?? Infinity;

      for (const [dr, dc, moveCost] of dirs) {
        const nr = cr + dr;
        const nc = cc + dc;

        if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
        const nKey = `${nr},${nc}`;
        if (walls.has(nKey) || closedSet.has(nKey)) continue;

        const tentativeG = curG + moveCost;
        const prevG = gScore.get(nKey) ?? Infinity;

        if (tentativeG < prevG) {
          cameFrom.set(nKey, [cr, cc]);
          gScore.set(nKey, tentativeG);
          const f = tentativeG + h(nr, nc);
          fScore.set(nKey, f);

          if (!openSet.includes(nKey)) {
            openSet.push(nKey);
          }
        }
      }
    }

    // Backtracking
    const path: [number, number][] = [];
    const pathSet = new Set<string>();

    if (found) {
      let curr: [number, number] | undefined = [er, ec];
      while (curr) {
        path.unshift(curr);
        pathSet.add(`${curr[0]},${curr[1]}`);
        if (curr[0] === sr && curr[1] === sc) break;
        curr = cameFrom.get(`${curr[0]},${curr[1]}`);
      }
    }

    return {
      visitedOrder,
      visitedSet,
      path,
      pathSet,
      costs: useHeuristic ? fScore : gScore,
      found,
      totalCost: found ? gScore.get(endKey) ?? 0 : 0,
    };
  }, [start, end, walls, useHeuristic, allowDiagonal, rows, cols]);

  // Determine active display data: Step snapshot or Live Solver
  const displayResult = useMemo(() => {
    // If user drew walls or chose interactive mode, use live solver
    if (isInteractiveMode) {
      return liveResult;
    }

    // Otherwise in Step Playback mode:
    if (step.stepIndex === 4) {
      return liveResult;
    }

    // For Steps 1, 2, 3: use step.gridData snapshot if present
    if (step.gridData?.visited && step.gridData.visited.length > 0) {
      const vSet = new Set<string>();
      step.gridData.visited.forEach(([r, c]) => vSet.add(`${r},${c}`));
      const pSet = new Set<string>();
      (step.gridData.path || []).forEach(([r, c]) => pSet.add(`${r},${c}`));

      return {
        visitedOrder: step.gridData.visited,
        visitedSet: vSet,
        path: step.gridData.path || [],
        pathSet: pSet,
        costs: liveResult.costs,
        found: (step.gridData.path || []).length > 0,
        totalCost: (step.gridData.path || []).length,
      };
    }

    return liveResult;
  }, [isInteractiveMode, step.stepIndex, step.gridData, liveResult]);

  // 5. Mouse Interaction Handlers for Wall Drawing
  const toggleCell = useCallback(
    (r: number, c: number, mode: 'add' | 'remove') => {
      // Never turn Start or Target into a wall
      if ((r === start[0] && c === start[1]) || (r === end[0] && c === end[1])) {
        return;
      }

      setIsInteractiveMode(true);
      const key = `${r},${c}`;
      setWalls((prev) => {
        const next = new Set(prev);
        if (mode === 'add') {
          next.add(key);
        } else {
          next.delete(key);
        }
        return next;
      });
    },
    [start, end]
  );

  const handleMouseDown = useCallback(
    (r: number, c: number, e: React.MouseEvent) => {
      e.preventDefault();
      const key = `${r},${c}`;
      const mode = walls.has(key) ? 'remove' : 'add';
      setIsMouseDown(true);
      setDragMode(mode);
      toggleCell(r, c, mode);
    },
    [walls, toggleCell]
  );

  const handleMouseEnter = useCallback(
    (r: number, c: number) => {
      if (!isMouseDown || !dragMode) return;
      toggleCell(r, c, dragMode);
    },
    [isMouseDown, dragMode, toggleCell]
  );

  // 6. Maze and Wall Actions
  const handleGenerateMaze = useCallback(() => {
    setIsInteractiveMode(true);
    const newWalls = new Set<string>();

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        // Protect start, end, and immediate paths
        if (
          (Math.abs(r - start[0]) <= 1 && Math.abs(c - start[1]) <= 1) ||
          (Math.abs(r - end[0]) <= 1 && Math.abs(c - end[1]) <= 1)
        ) {
          continue;
        }

        // Generate dynamic obstacle walls (approx 28% density with structured corridors)
        if (c % 4 === 2 && r !== (c % 3 === 0 ? 2 : 9)) {
          newWalls.add(`${r},${c}`);
        } else if (Math.random() < 0.16) {
          newWalls.add(`${r},${c}`);
        }
      }
    }
    setWalls(newWalls);
  }, [rows, cols, start, end]);

  const handleClearWalls = useCallback(() => {
    setIsInteractiveMode(true);
    setWalls(new Set());
  }, []);

  const handleResetToPreset = useCallback(() => {
    setIsInteractiveMode(false);
    const initial = new Set<string>();
    const presetWalls = DEFAULT_GRID_CONFIG.initialWalls || [];
    presetWalls.forEach(([r, c]) => initial.add(`${r},${c}`));
    setWalls(initial);
  }, []);

  return (
    <div className="relative w-full min-h-[460px] bg-white rounded-[16px] border border-[#EDEDED] shadow-[0_4px_12px_rgba(0,0,0,0.05)] p-4 sm:p-6 overflow-hidden flex flex-col justify-between select-none font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Background Architectural Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#F5F6F8_1px,transparent_1px),linear-gradient(to_bottom,#F5F6F8_1px,transparent_1px)] bg-[size:24px_24px] opacity-70 pointer-events-none" />

      {/* 1. Header Toolbar of Grid Stage */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 pb-3.5 border-b border-[#F0F0F0] mb-3">
        {/* Left: Title & Live Algorithm Badge */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#E31B23] opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-[#E31B23]" />
            </span>
            <span className="text-xs font-extrabold uppercase tracking-wider text-[#1A1A1A]">
              TRỰC QUAN HÓA TÌM ĐƯỜNG TỐI ƯU (GRID PATHFINDING STAGE)
            </span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full transition-colors ${
                useHeuristic
                  ? 'bg-red-50 text-[#D91820] border border-red-200'
                  : 'bg-blue-50 text-blue-700 border border-blue-200'
              }`}
            >
              <Compass className="w-3 h-3" />
              {useHeuristic ? 'Thuật toán: A* (Heuristic h)' : 'Thuật toán: Dijkstra (Duyệt đều)'}
            </span>

            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-[#4B5563] border border-gray-200">
              <Move className="w-3 h-3" />
              {allowDiagonal ? '8 Hướng (Đi chéo)' : '4 Hướng'}
            </span>

            <span
              className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full transition-colors ${
                showWeights
                  ? 'bg-amber-50 text-amber-800 border border-amber-200'
                  : 'bg-gray-100 text-gray-400 border border-gray-200'
              }`}
            >
              <Hash className="w-3 h-3" />
              {showWeights ? 'Trọng số f(n): BẬT' : 'Trọng số: TẮT'}
            </span>

            <span
              className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full transition-colors ${
                autoTracePath
                  ? 'bg-red-50 text-[#E31B23] border border-red-200'
                  : 'bg-gray-100 text-gray-400 border border-gray-200'
              }`}
            >
              <Navigation className="w-3 h-3" />
              {autoTracePath ? 'Truy vết: BẬT' : 'Truy vết: TẮT'}
            </span>
          </div>
        </div>

        {/* Right: Quick Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleGenerateMaze}
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#F5F6F8] hover:bg-red-50 text-[#1A1A1A] hover:text-[#E31B23] border border-gray-200 transition-colors"
            title="Tạo ngẫu nhiên chướng ngại vật trên bản đồ"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#E31B23]" />
            <span>Tạo Mê cung</span>
          </button>

          <button
            type="button"
            onClick={handleClearWalls}
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#F5F6F8] hover:bg-gray-200 text-[#5A5A5A] border border-gray-200 transition-colors"
            title="Xóa toàn bộ tường chắn về lưới trống"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Xóa tường</span>
          </button>

          <button
            type="button"
            onClick={handleResetToPreset}
            className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg border transition-colors ${
              isInteractiveMode
                ? 'bg-red-50 text-[#D91820] border-red-200 hover:bg-red-100'
                : 'bg-[#F5F6F8] text-gray-500 border-gray-200 hover:bg-gray-100'
            }`}
            title="Khôi phục trạng thái chuẩn theo kịch bản"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Kịch bản chuẩn</span>
          </button>
        </div>
      </div>

      {/* 2. Interactive 2D Grid Canvas */}
      <div className="relative z-10 my-auto py-2 flex flex-col items-center justify-center overflow-x-auto">
        <div
          className="grid gap-[3px] p-2 bg-[#FAFAFA] rounded-[12px] border border-[#E5E7EB] shadow-inner select-none"
          style={{
            gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
          }}
          onMouseLeave={() => {
            setIsMouseDown(false);
            setDragMode(null);
          }}
        >
          {Array.from({ length: rows }).map((_, r) =>
            Array.from({ length: cols }).map((_, c) => {
              const key = `${r},${c}`;
              const isStart = r === start[0] && c === start[1];
              const isEnd = r === end[0] && c === end[1];
              const isWall = walls.has(key);
              const isPath = autoTracePath && displayResult.pathSet.has(key);
              const isVisited = displayResult.visitedSet.has(key);
              const costVal = displayResult.costs.get(key);

              // Cell Styling Tokens
              let cellClass =
                'bg-white border-[#E5E7EB] text-gray-400 hover:border-red-300 hover:bg-red-50/40';

              if (isStart) {
                cellClass =
                  'bg-[#10B981] border-[#059669] text-white shadow-[0_0_10px_rgba(16,185,129,0.5)] z-20 scale-105';
              } else if (isEnd) {
                cellClass =
                  'bg-[#E31B23] border-[#B80D14] text-white shadow-[0_0_12px_rgba(227,27,35,0.7)] z-20 scale-105';
              } else if (isPath) {
                cellClass =
                  'bg-[#E31B23] border-[#B80D14] text-white shadow-[0_0_12px_rgba(227,27,35,0.65)] font-bold z-10 scale-105 animate-pulse';
              } else if (isWall) {
                cellClass =
                  'bg-[#1F2937] border-[#111827] shadow-sm cursor-pointer scale-95';
              } else if (isVisited) {
                cellClass =
                  'bg-[#FEE2E2] border-[#FDA4AF] text-[#991B1B] hover:bg-[#FCD34D] transition-colors duration-150';
              }

              return (
                <div
                  key={key}
                  onMouseDown={(e) => handleMouseDown(r, c, e)}
                  onMouseEnter={() => handleMouseEnter(r, c)}
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-[5px] border flex items-center justify-center cursor-pointer transition-all duration-100 ${cellClass}`}
                  title={`Tọa độ [${r}, ${c}]${costVal !== undefined ? ` • Chi phí: ${costVal.toFixed(1)}` : ''}`}
                >
                  {isStart ? (
                    <Flag className="w-3.5 h-3.5 text-white" />
                  ) : isEnd ? (
                    <Target className="w-3.5 h-3.5 text-white" />
                  ) : isWall ? (
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-500/40" />
                  ) : showWeights && costVal !== undefined && (isVisited || isPath) ? (
                    <span
                      className={`text-[9px] font-mono font-bold leading-none select-none ${
                        isPath ? 'text-white' : 'text-[#A80B12]'
                      }`}
                    >
                      {Math.round(costVal)}
                    </span>
                  ) : null}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 3. Bottom Status & Statistics Dock */}
      <div className="relative z-10 pt-3 border-t border-[#F0F0F0] flex flex-wrap items-center justify-between gap-3 text-xs text-[#5A5A5A]">
        {/* Left: Statistics & Solver State */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-1.5">
            <Footprints className="w-4 h-4 text-[#E31B23]" />
            <span>
              Quãng đường tối ưu:{' '}
              <strong className="text-[#1A1A1A] font-mono text-sm">
                {displayResult.found
                  ? allowDiagonal
                    ? displayResult.totalCost.toFixed(1)
                    : `${displayResult.path.length} bước`
                  : 'Không có đường'}
              </strong>
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <Hash className="w-4 h-4 text-[#5A5A5A]" />
            <span>
              Số ô đã duyệt:{' '}
              <strong className="text-[#D91820] font-mono text-sm">
                {displayResult.visitedSet.size}
              </strong>
              <span className="text-[10px] text-gray-400 ml-1">
                ({((displayResult.visitedSet.size / (rows * cols)) * 100).toFixed(1)}% bản đồ)
              </span>
            </span>
          </div>

          <div>
            {displayResult.found ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                Đã chạm đích thành công
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                <AlertCircle className="w-3 h-3 text-[#E31B23]" />
                Tường chắn chặn kín đích
              </span>
            )}
          </div>
        </div>

        {/* Right: Legend Guide */}
        <div className="flex items-center gap-3 text-[11px] text-[#757575] flex-wrap">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded bg-[#10B981]" /> Xuất phát (S)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded bg-[#E31B23]" /> Đích (T)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded bg-[#1F2937]" /> Tường chắn
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded bg-[#FEE2E2] border border-[#FDA4AF]" /> Đã duyệt
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded bg-[#E31B23] shadow-[0_0_6px_rgba(227,27,35,0.7)]" />{' '}
            Đường ngắn nhất
          </span>
        </div>
      </div>

      {/* Helpful Hint Footnote */}
      <div className="relative z-10 mt-2 flex items-center justify-between text-[11px] text-gray-400">
        <span className="flex items-center gap-1">
          <Info className="w-3 h-3 text-gray-400" />
          Nhấn giữ chuột kéo trên lưới để vẽ hoặc xóa tường chắn. Thuật toán sẽ tự động tính lại đường đi ngay tức thì!
        </span>
        {isInteractiveMode && (
          <span className="text-[#D91820] font-semibold">
            ● Chế độ Tương tác Tự do (Live Canvas)
          </span>
        )}
      </div>
    </div>
  );
};
