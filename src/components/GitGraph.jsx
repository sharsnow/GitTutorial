// src/components/GitGraph.jsx
import React from 'react';

// 這些是畫圖用的常數（只在圖裡用，不放 App.jsx 裡讓它變胖）
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

// 分支顏色（main 固定藍色，其它用 color index）
function getBranchColor(branchName, colorIndices) {
  if (branchName === 'main') return MAIN_COLOR;
  const index = colorIndices[branchName];
  if (index === undefined) return '#94a3b8';
  return BRANCH_COLORS[index % BRANCH_COLORS.length];
}

export default function GitGraph({ repo }) {
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

      {/* 連線（parent / merge / cherry-pick） */}
      {repo.commits.map((commit) => {
        const end = getCoord(commit);
        const elements = [];

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
              />
            );
          }
        }

        return elements;
      })}

      {/* 節點 + 文字 + branch 標籤 */}
      {repo.commits.map((commit) => {
        const { x, y } = getCoord(commit);
        const currentId = getCurrentCommitId(repo);
        const isHead = currentId === commit.id;
        const nodeColor = getBranchColor(commit.branch, repo.branchColorIndices || {});

        return (
          <g key={commit.id}>
            <circle
              cx={x}
              cy={y}
              r={NODE_RADIUS}
              fill={nodeColor}
              className="cursor-pointer hover:stroke-white transition-colors"
              stroke="white"
              strokeWidth={isHead ? 4 : 2}
            />
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
                  />
                  <text
                    x={x}
                    y={y - 33}
                    textAnchor="middle"
                    fill="white"
                    fontSize="11"
                    fontWeight="bold"
                    style={{ textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}
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
