// Git 初始狀態（僅負責資料，不包含任何 UI 邏輯）
// --- 初始狀態 ---
export const INITIAL_STATE = {
  commits: [
    { id: 'c1', message: 'Initial commit', parent: null, lane: 0, branch: 'main', x: 0 }
  ],
  branches: {
    'main': 'c1'
  },
  head: 'main', 
  detachedHead: null, 
  branchLanes: { 'main': 0 }, 
  branchColorIndices: { 'main': -1 },
  logs: ['初始化 Git 儲存庫... 完成。', '目前位於 main 分支。']
};