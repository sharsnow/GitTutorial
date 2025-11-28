// src/data/challengeLevels.js
import { INITIAL_STATE } from '../core/gitInitialState';

export const CHALLENGE_LEVELS = [
  {
    id: 1,
    title: "挑戰 Level 1: 雙管齊下",
    desc: "專案需要同時進行開發。請建立一個名為 'dev' 的分支。並且：main 分支要有 2 個新提交，dev 分支也要有 1 個新提交。",
    hint: "記得利用 Checkout 在分支間切換。",
    setup: INITIAL_STATE,
    check: (state) => {
      const mainCommits = state.commits.filter(c => c.branch === 'main').length;
      const devCommits = state.commits.filter(c => c.branch === 'dev').length;
      return state.branches['dev'] && mainCommits >= 3 && devCommits >= 1;
    }
  },
  {
    id: 2,
    title: "挑戰 Level 2: 內容修正",
    desc: "我們發現了一個 Bug！請建立 'fix' 分支，將檔案內容修改為 'Bug Fixed' 並提交。然後切回 'main' 將其合併。",
    hint: "Branch fix -> 修改編輯器文字 -> Commit -> Checkout main -> Merge fix",
    setup: INITIAL_STATE,
    check: (state) => {
      const headId = state.branches['main'];
      const headCommit = state.commits.find(c => c.id === headId);
      // 檢查最新 Commit 的內容是否包含關鍵字
      return state.head === 'main' && headCommit.fileContent.includes('Bug Fixed');
    }
  },
  {
    id: 3,
    title: "挑戰 Level 3: 衝突大師",
    desc: "系統已建立兩個衝突的分支。請將 'feature' 合併入 'main'，並在衝突解決時選擇「同時保留兩者 (Keep Both)」。",
    hint: "Merge feature -> 出現紅框 -> Resolve -> 選擇 Both -> Commit",
    setup: {
      ...INITIAL_STATE,
      commits: [
        { id: 'c1', message: 'Init', parent: null, lane: 0, branch: 'main', x: 0, fileContent: 'Base Content' },
        { id: 'c2', message: 'Main Update', parent: 'c1', lane: 0, branch: 'main', x: 1, fileContent: 'Base Content\nUpdate A' },
        { id: 'c3', message: 'Feat Update', parent: 'c1', lane: 1, branch: 'feature', x: 1, fileContent: 'Base Content\nUpdate B' }
      ],
      branches: { 'main': 'c2', 'feature': 'c3' },
      branchLanes: { 'main': 0, 'feature': 1 },
      branchColorIndices: { 'main': -1, 'feature': 0 },
      head: 'main'
    },
    check: (state) => {
      const headId = state.branches['main'];
      const headCommit = state.commits.find(c => c.id === headId);
      // 檢查內容是否同時包含 A 和 B
      return headCommit.fileContent.includes('Update A') && headCommit.fileContent.includes('Update B');
    }
  },
  {
    id: 4,
    title: "挑戰 Level 4: 覆水難收",
    desc: "c3 是一個錯誤的提交。請使用 Reset 將 main 分支退回到 c2。",
    hint: "Reset Hard",
    setup: {
      ...INITIAL_STATE,
      commits: [
        { id: 'c1', message: 'Init', parent: null, lane: 0, branch: 'main', x: 0 },
        { id: 'c2', message: 'Good', parent: 'c1', lane: 0, branch: 'main', x: 1 },
        { id: 'c3', message: 'Bad', parent: 'c2', lane: 0, branch: 'main', x: 2 }
      ],
      branches: { 'main': 'c3' },
      branchLanes: { 'main': 0 },
      branchColorIndices: { 'main': -1 },
      head: 'main'
    },
    check: (state) => state.branches['main'] === 'c2'
  },
  {
    id: 5,
    title: "挑戰 Level 5: 時空救援",
    desc: "糟糕！我們剛剛不小心 Reset 掉了 c3 (它現在是幽靈節點)。請找出它，並將 main 分支重置回 c3。",
    hint: "點擊那個半透明的節點 -> 點擊 'Reset main to Here'",
    setup: {
      ...INITIAL_STATE,
      commits: [
        { id: 'c1', message: 'Init', parent: null, lane: 0, branch: 'main', x: 0 },
        { id: 'c2', message: 'Step 1', parent: 'c1', lane: 0, branch: 'main', x: 1 },
        { id: 'c3', message: 'Step 2 (Lost)', parent: 'c2', lane: 0, branch: 'main', x: 2 }
      ],
      branches: { 'main': 'c2' }, // 指標退回 c2 了
      branchLanes: { 'main': 0 },
      branchColorIndices: { 'main': -1 },
      head: 'main'
    },
    check: (state) => state.branches['main'] === 'c3'
  }
];