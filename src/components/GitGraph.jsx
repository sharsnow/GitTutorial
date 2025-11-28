// src/components/GitGraph.jsx
import React, { useMemo } from 'react'; // ✨ [修正] 這裡補上了 useMemo

// 這些是畫圖用的常數
const LANE_HEIGHT = 60;
const NODE_RADIUS = 18;
const X_SPACING = 80;

const BRANCH_COLORS = [
  '#ec4899', // Pink
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#8b5cf6', // Violet
  '#06b6d4', // Cyan
  '#f43f5e', // Rose
  '#84cc16', // Lime
];

const MAIN_COLOR = '#3b82f6';

// 取得目前 HEAD 所指向的 commit id
function getCurrentCommitId(repo) {
  if (repo.detachedHead) return repo.detachedHead;
  return repo.branches[repo.head];
}

// 分支顏色
function getBranchColor(branchName, colorIndices) {
  if (branchName === 'main') return MAIN_COLOR;
  const index = colorIndices[branchName];
  if (index === undefined) return '#94a3b8';
  return BRANCH_COLORS[index % BRANCH_COLORS.length];
}

// [演算法] 計算哪些 Commit 是活著的 (可從 Branch/HEAD 到達)
function getReachableCommits(repo) {
  const reachable = new Set();
  const queue = [];

  // 1. 把所有 Branch 的頂端加入佇列
  Object.values(repo.branches).forEach(commitId => queue.push(commitId));
  
  // 2. 把目前的 HEAD 加入佇列 (如果是 Detached HEAD)
  if (repo.detachedHead) queue.push(repo.detachedHead);

  // 3. 往回追朔
  while (queue.length > 0) {
    const id = queue.pop();
    if (!id || reachable.has(id)) continue;

    reachable.add(id);
    
    // 找到該 commit 物件，把它的 parent 也加入佇列
    const commit = repo.commits.find(c => c.id === id);
    if (commit) {
      if (commit.parent) queue.push(commit.parent);
      if (commit.parent2) queue.push(commit.parent2); // Merge parent
    }
  }
  return reachable;
}

export default function GitGraph({ repo, onNodeClick }) {
  // 使用 useMemo 優化效能，只在 commit 變更時重算可達性
  const reachableSet = useMemo(() => getReachableCommits(repo), [repo.commits, repo.branches, repo.detachedHead]);

  const branchCount = Object.keys(repo.branchLanes || {}).length;
  const svgHeight = Math.max(300, (branchCount + 1) * LANE_HEIGHT);
  const svgWidth = Math.max(600, 200 + (repo.commits.length || 1) * X_SPACING);

  const getCoord = (commit) => ({
    x: 50 + commit.x * X_SPACING,
    y: 50 + commit.lane * LANE_HEIGHT,
  });

  return (
    <svg
      height={svgHeight}
      width={svgWidth}
      style={{
        minWidth: svgWidth,
        minHeight: svgHeight,
        maxWidth: 'none', 
      }}
      className="block"
    >
      <defs>
        <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="28" refY="3.5" orient="auto">
          <polygon points="0 0, 10 3.5, 0 7" fill="#94a3b8" />
        </marker>
        <marker id="arrowhead-merge" markerWidth="10" markerHeight="7" refX="28" refY="3.5" orient="auto">
          <polygon points="0 0, 10 3.5, 0 7" fill="#a855f7" />
        </marker>
        <marker id="arrowhead-pick" markerWidth="10" markerHeight="7" refX="28" refY="3.5" orient="auto">
          <polygon points="0 0, 10 3.5, 0 7" fill="#f97316" />
        </marker>
      </defs>

      {/* 連線繪製 */}
      {repo.commits.map((commit) => {
        const end = getCoord(commit);
        const elements = [];
        
        // 判斷是否為幽靈節點，調整透明度
        const isGhost = !reachableSet.has(commit.id);
        const opacity = isGhost ? 0.2 : 1;
        const lineStyle = { opacity, transition: 'opacity 0.5s ease-in-out' };

        // 一般 parent 線
        if (commit.parent) {
          const parent = repo.commits.find((c) => c.id === commit.parent);
          if (parent) {
            const start = getCoord(parent);
            let pathD = `M ${start.x} ${start.y} `;
            if (start.y !== end.y) {
              pathD += `C ${start.x + 40} ${start.y}, ${end.x - 40} ${end.y}, ${end.x} ${end.y}`;
            } else {
              pathD += `L ${end.x} ${end.y}`;
            }
            elements.push(
              <path
                key={`line-${commit.id}`}
                d={pathD}
                stroke="#94a3b8"
                strokeWidth="2"
                fill="none"
                markerEnd="url(#arrowhead)"
                style={lineStyle}
              />
            );
          }
        }

        // Merge 第二條 parent 線（虛線紫色）
        if (commit.parent2) {
          const parent2 = repo.commits.find((c) => c.id === commit.parent2);
          if (parent2) {
            const start2 = getCoord(parent2);
            elements.push(
              <path
                key={`line-merge-${commit.id}`}
                d={`M ${start2.x} ${start2.y} C ${start2.x + 40} ${start2.y}, ${end.x - 40} ${end.y}, ${end.x} ${end.y}`}
                stroke="#a855f7"
                strokeWidth="2"
                strokeDasharray="5,3"
                fill="none"
                markerEnd="url(#arrowhead-merge)"
                style={lineStyle}
              />
            );
          }
        }

        // Cherry-pick 虛線橘色弧線
        if (commit.cherrySource) {
          const source = repo.commits.find((c) => c.id === commit.cherrySource);
          if (source) {
            const startCherry = getCoord(source);
            const midX = (startCherry.x + end.x) / 2;
            const midY = Math.min(startCherry.y, end.y) - 40;
            elements.push(
              <path
                key={`line-pick-${commit.id}`}
                d={`M ${startCherry.x} ${startCherry.y} Q ${midX} ${midY} ${end.x} ${end.y}`}
                stroke="#f97316"
                strokeWidth="1.5"
                strokeDasharray="2,2"
                fill="none"
                markerEnd="url(#arrowhead-pick)"
                style={lineStyle}
              />
            );
          }
        }

        return elements;
      })}

      {/* 節點繪製 */}
      {repo.commits.map((commit) => {
        const { x, y } = getCoord(commit);
        const currentId = getCurrentCommitId(repo);
        const isHead = currentId === commit.id;
        const nodeColor = getBranchColor(commit.branch, repo.branchColorIndices || {});

        // 幽靈節點樣式處理
        const isGhost = !reachableSet.has(commit.id);
        const nodeStyle = { 
          opacity: isGhost ? 0.3 : 1, 
          filter: isGhost ? 'grayscale(100%)' : 'none',
          transition: 'all 0.5s ease-in-out'
        };

        return (
          <g 
            key={commit.id} 
            onClick={() => onNodeClick && onNodeClick(commit.id)}
            className="cursor-pointer group"
            style={nodeStyle}
          >
            <circle
              cx={x}
              cy={y}
              r={NODE_RADIUS}
              fill={nodeColor}
              className="transition-all duration-200 group-hover:scale-110" 
              stroke="white"
              strokeWidth={isHead ? 4 : 2}
            />
            {/* 隱形的大圓，增加點擊區域 */}
            <circle cx={x} cy={y} r={NODE_RADIUS * 1.5} fill="transparent" />

            <text
              x={x}
              y={y + 5}
              textAnchor="middle"
              fill="white"
              fontSize="10"
              fontWeight="bold"
              pointerEvents="none"
            >
              {commit.id}
            </text>
            <text
              x={x}
              y={y + 35}
              textAnchor="middle"
              fill="#94a3b8"
              fontSize="10"
              className="group-hover:fill-slate-200 transition-colors"
            >
              {commit.message}
            </text>

            {/* Branch 標籤 + HEAD 標示 */}
            {Object.entries(repo.branches).map(([bName, cId]) => {
              if (cId !== commit.id) return null;

              const badgeColor = getBranchColor(bName, repo.branchColorIndices || {});
              const rectWidth = 50 + bName.length * 6;

              return (
                <g key={bName}>
                  <rect
                    x={x - 25}
                    y={y - 48}
                    width={rectWidth}
                    height="22"
                    rx="4"
                    fill={badgeColor}
                    stroke="rgba(255,255,255,0.2)"
                    strokeWidth="1"
                    className="group-hover:stroke-white transition-colors"
                  />
                  <text
                    x={x}
                    y={y - 33}
                    textAnchor="middle"
                    fill="white"
                    fontSize="11"
                    fontWeight="bold"
                    style={{ textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}
                    pointerEvents="none"
                  >
                    {bName}
                  </text>
                  {repo.head === bName && (
                    <text
                      x={x}
                      y={y - 52}
                      textAnchor="middle"
                      fill="#fbbf24"
                      fontSize="10"
                      fontWeight="bold"
                    >
                      HEAD ▼
                    </text>
                  )}
                </g>
              );
            })}
          </g>
        );
      })}
    </svg>
  );
}