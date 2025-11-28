// Git 初始狀態
// --- 初始狀態 ---
export const INITIAL_STATE = {
  commits: [
    { 
      id: 'c1', 
      message: 'Initial commit', 
      parent: null, 
      lane: 0, 
      branch: 'main', 
      x: 0,
      // 檔案內容快照：這是衝突檢測的基礎
      fileContent: 'Git Learning Lab\n---\n這是一個模擬檔案。' 
    }
  ],
  branches: {
    'main': 'c1'
  },
  head: 'main', 
  detachedHead: null, 
  branchLanes: { 'main': 0 }, 
  branchColorIndices: { 'main': -1 },
  // 新增教學用的旗標紀錄
  tutorialFlags: {
    hasViewedDiff: false
  },
  
  // 模擬工作目錄 (Working Directory)
  // 這代表使用者當前看到的、準備要 Commit 的內容
  staging: {
    content: 'Git Learning Lab\n---\n這是一個模擬檔案。',
    isDirty: false // 標記是否有未 Commit 的修改
  },

  // 衝突狀態管理
  // 當發生衝突時，status 會變成 'CONFLICT'，並且 conflictData 會填入資料
  status: 'IDLE', // 可能的值: 'IDLE' | 'CONFLICT'
  conflictData: null, // 結構範例: { base: '...', current: '...', incoming: '...' }

  logs: ['初始化 Git 儲存庫... 完成。', '目前位於 main 分支。']
};