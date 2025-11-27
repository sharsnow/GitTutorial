// src/data/challengeLevels.js
import { INITIAL_STATE } from '../core/gitInitialState';


// --- 挑戰模式關卡設定 ---
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
    title: "挑戰 Level 2: 殊途同歸",
    desc: "我們發現了一個 Bug！請建立 'fix' 分支並提交一次修復，然後切換回 'main' 並將其合併。最後 HEAD 必須停在 main 上。",
    hint: "Branch -> Checkout -> Commit -> Checkout main -> Merge fix",
    setup: {
      ...INITIAL_STATE,
      commits: [
        { id: 'c1', message: 'Initial commit', parent: null, lane: 0, branch: 'main', x: 0 },
        { id: 'c2', message: 'Work in progress', parent: 'c1', lane: 0, branch: 'main', x: 1 }
      ],
      branches: { 'main': 'c2' },
      branchLanes: { 'main': 0 },
      branchColorIndices: { 'main': -1 },
      head: 'main'
    },
    check: (state) => {
      const last = state.commits[state.commits.length - 1];
      return state.head === 'main' && last.message.includes('Merge') && (last.message.includes('fix') || state.logs.some(l => l.includes('merge fix')));
    }
  },
  {
    id: 3,
    title: "挑戰 Level 3: 歷史分流",
    desc: "製造一個分叉的歷史結構。建立兩個分支 'a' 和 'b'。讓它們各自擁有一個獨立的提交（不包含合併）。最後讓 HEAD 停在 main 上。",
    hint: "做完 a 的提交後，記得要 checkout 回 main 或父節點，再建立 b 分支。",
    setup: INITIAL_STATE,
    check: (state) => {
      const hasA = state.branches['a'];
      const hasB = state.branches['b'];
      const commitA = state.commits.find(c => c.branch === 'a');
      const commitB = state.commits.find(c => c.branch === 'b');
      return state.head === 'main' && hasA && hasB && commitA && commitB;
    }
  },
  {
    id: 4,
    title: "挑戰 Level 4: 覆水難收？",
    desc: "我們不小心提交了一個含有錯誤程式碼的 Commit (c3)。請使用 `Reset` 指令將 `main` 分支退回到 `c2`，徹底抹除這個錯誤。",
    hint: "使用 Reset (Soft 或 Hard 皆可) 退回上一步。",
    setup: {
      ...INITIAL_STATE,
      commits: [
        { id: 'c1', message: 'Initial commit', parent: null, lane: 0, branch: 'main', x: 0 },
        { id: 'c2', message: 'Stable version', parent: 'c1', lane: 0, branch: 'main', x: 1 },
        { id: 'c3', message: 'Buggy code!!', parent: 'c2', lane: 0, branch: 'main', x: 2 }
      ],
      branches: { 'main': 'c3' },
      branchLanes: { 'main': 0 },
      branchColorIndices: { 'main': -1 },
      head: 'main'
    },
    check: (state) => {
      // 檢查 main 分支是否指向 c2
      return state.branches['main'] === 'c2';
    }
  },
  {
    id: 5,
    title: "挑戰 Level 5: 整理線圖 (Rebase)",
    desc: "目前歷史線圖分叉了。我們希望保持線圖整潔（一直線）。請將 `feat` 分支的修改 `Rebase` 到 `main` 分支的最新進度上。",
    hint: "切換到 feat 分支，然後選擇 main 並執行 Rebase。",
    setup: {
      ...INITIAL_STATE,
      commits: [
        { id: 'c1', message: 'Initial commit', parent: null, lane: 0, branch: 'main', x: 0 },
        { id: 'c2', message: 'Main update', parent: 'c1', lane: 0, branch: 'main', x: 1 },
        { id: 'c3', message: 'Feature work', parent: 'c1', lane: 1, branch: 'feat', x: 1 }
      ],
      branches: { 'main': 'c2', 'feat': 'c3' },
      branchLanes: { 'main': 0, 'feat': 1 },
      branchColorIndices: { 'main': -1, 'feat': 0 },
      head: 'feat'
    },
    check: (state) => {
      // 檢查 feat 的最新 commit 的 parent 是否是 main 的 commit (c2)
      const featHeadId = state.branches['feat'];
      const featHead = state.commits.find(c => c.id === featHeadId);
      return featHead && featHead.parent === 'c2';
    }
  }
];