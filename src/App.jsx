import React, { useState, useEffect, useRef } from 'react';
import { GitCommit, GitBranch, GitMerge, ChevronRight, RefreshCw, Terminal, BookOpen, Play, CheckCircle, Info, ArrowRight, Trophy, RotateCcw, Undo2, History, AlertTriangle, Settings, X, GitPullRequest, Copy, Map as MapIcon, Lock } from 'lucide-react';

// --- 常數設定 ---
const LANE_HEIGHT = 60;
const NODE_RADIUS = 18;
const X_SPACING = 80;

// --- 配色盤 ---
const BRANCH_COLORS = [
  '#ec4899', // Pink
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#8b5cf6', // Violet
  '#06b6d4', // Cyan
  '#f43f5e', // Rose
  '#84cc16', // Lime
];

const MAIN_COLOR = '#3b82f6'; // Blue for main

// --- 初始狀態 ---
const INITIAL_STATE = {
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

// --- 教學模式資料 (11 關) ---
const TUTORIAL_STEPS = [
  // --- Chapter 1: 時光穿梭 ---
  {
    id: 1,
    chapter: "第一章：時光穿梭",
    title: "1-1 建立提交 (Commit)",
    desc: "Git 的核心是「提交」。想像每次提交都是幫檔案拍一張快照。請試著點擊「提交 (Commit)」按鈕兩次，建立一些歷史紀錄。",
    check: (state) => state.commits.length >= 3,
    hint: "點擊下方的 'Commit' 按鈕兩次。",
    unlocks: ['commit'],
    highlight: 'commit-zone'
  },
  {
    id: 2,
    chapter: "第一章：時光穿梭",
    title: "1-2 建立分支 (Branch)",
    desc: "分支讓你可以同時進行不同的開發工作。請建立一個名為 'feature' 的新分支。",
    check: (state) => state.branches.hasOwnProperty('feature'),
    hint: "輸入 'feature' 並點擊 'Branch' 按鈕。",
    unlocks: ['commit', 'branch'],
    highlight: 'branch-zone'
  },
  {
    id: 3,
    chapter: "第一章：時光穿梭",
    title: "1-3 切換時空 (Checkout)",
    desc: "建立分支後，我們需要「切換」過去才能開始工作。請切換到 'feature' 分支，並在那裡新增一個提交。",
    check: (state) => state.head === 'feature' && state.commits.find(c => c.branch === 'feature'),
    hint: "先點 'Checkout' 切換到 feature，再點 'Commit'。",
    unlocks: ['commit', 'branch', 'checkout'],
    highlight: 'checkout-zone'
  },
  
  // --- Chapter 2: 平行宇宙 ---
  {
    id: 4,
    chapter: "第二章：平行宇宙",
    title: "2-1 製造分歧 (Diverge)",
    desc: "為了理解合併，我們需要兩條分開的歷史線。現在你已經在 'feature' 有了提交。請切換回 'main' 分支，並在 main 上也做一個新的提交。這樣歷史線就會變成 Y 字型分岔。",
    check: (state) => {
      const mainHead = state.commits.find(c => c.id === state.branches['main']);
      const featHead = state.commits.find(c => c.id === state.branches['feature']);
      if (!mainHead || !featHead) return false;
      return mainHead.id !== featHead.id && mainHead.parent !== featHead.id && featHead.parent !== mainHead.id;
    },
    hint: "Checkout main -> Commit。確保出現分岔的圖形。",
    unlocks: ['commit', 'branch', 'checkout'],
    highlight: 'commit-zone'
  },
  {
    id: 5,
    chapter: "第二章：平行宇宙",
    title: "2-2 分支合併 (Merge)",
    desc: "現在兩邊都有新進度了。我們把 'feature' 的成果合併回 'main' 吧！請確保你站在 'main' 分支上，然後合併 'feature'。",
    check: (state) => {
      const lastCommit = state.commits[state.commits.length - 1];
      return state.head === 'main' && lastCommit.message.includes('Merge');
    },
    hint: "Checkout main (如果還沒) -> 選擇 feature -> 點擊 Merge。",
    unlocks: ['commit', 'branch', 'checkout', 'merge'],
    highlight: 'merge-zone'
  },
  {
    id: 6,
    chapter: "第二章：平行宇宙",
    title: "2-3 刪除分支 (Cleanup)",
    desc: "合併完成後，'feature' 分支的任務結束了。雖然這裡沒有刪除按鈕，但在真實世界中，我們通常會刪除已合併的分支。這一步是觀念確認：請隨意再做一個 Commit，象徵專案繼續前進。",
    check: (state) => {
       const mergeCommitIndex = state.commits.findIndex(c => c.message.includes('Merge'));
       return state.commits.length > mergeCommitIndex + 1;
    },
    hint: "點擊 Commit 繼續開發。",
    unlocks: ['commit', 'branch', 'checkout', 'merge'],
    highlight: 'commit-zone'
  },

  // --- Chapter 3: 後悔藥 ---
  {
    id: 7,
    chapter: "第三章：後悔藥",
    title: "3-1 負荊請罪 (Revert)",
    desc: "剛才的提交好像有 Bug！但我們不想破壞歷史紀錄（例如已經推送到遠端）。請使用 `Revert` 來新增一個「抵銷」的提交。",
    check: (state) => state.logs.some(l => l.toLowerCase().includes('git revert')),
    hint: "點擊紅色區域的 'Revert' 按鈕。",
    unlocks: ['commit', 'branch', 'checkout', 'merge', 'danger'],
    highlight: 'danger-zone'
  },
  {
    id: 8,
    chapter: "第三章：後悔藥",
    title: "3-2 溫柔重置 (Reset Soft)",
    desc: "如果只是私有分支，想回到上一步並「保留檔案修改」（例如想重新整理 Commit）。請使用 `Reset (Soft)`。你會發現 HEAD 往回退了，但工作內容還在（這裡用 Log 模擬檔案保留）。",
    check: (state) => state.logs.some(l => l.includes('--soft')),
    hint: "點擊紅色區域的 'Soft' 按鈕。觀察 HEAD 指針移動。",
    unlocks: ['commit', 'branch', 'checkout', 'merge', 'danger'],
    highlight: 'danger-zone'
  },
  {
    id: 9,
    chapter: "第三章：後悔藥",
    title: "3-3 強硬重置 (Reset Hard)",
    desc: "有時候我們想徹底放棄剛才的實驗，「完全不保留」。請先做一個隨意的 Commit (當作是寫爛的程式碼)，然後使用 `Reset (Hard)` 讓它徹底消失。",
    check: (state) => {
        const lastLog = state.logs[state.logs.length - 1];
        return lastLog && lastLog.includes('--hard');
    },
    hint: "先點 Commit -> 再點紅色區域的 'Hard' 按鈕。",
    unlocks: ['commit', 'branch', 'checkout', 'merge', 'danger'],
    highlight: 'danger-zone'
  },

  // --- Chapter 4: 高級重塑 ---
  {
    id: 10,
    chapter: "第四章：高級重塑",
    title: "4-1 隔空取物 (Cherry-pick)",
    desc: "有時候我們不需要整個分支，只想要隔壁分支的「某一個」功能。請建立一個新分支 'fix'，提交一次。然後切回 'main'，使用 Cherry-pick 把那個提交「複製」過來。(觀察橘色虛線！)",
    check: (state) => {
      return state.commits.some(c => c.cherrySource);
    },
    hint: "Branch fix -> Checkout fix -> Commit -> Checkout main -> 選擇 fix -> 點擊 Pick。",
    unlocks: ['commit', 'branch', 'checkout', 'merge', 'danger', 'advanced'],
    highlight: 'advanced-zone'
  },
  {
    id: 11,
    chapter: "第四章：高級重塑",
    title: "4-2 整理歷史 (Rebase)",
    desc: "這是最後的挑戰！Rebase 可以把分岔的歷史「拉直」。為了看到效果，請務必先製造分岔：1. 在 main 提交一次 2. 切換到 fix 提交一次 3. 在 fix 執行 Rebase main。",
    check: (state) => {
        const lastLog = state.logs[state.logs.length - 1] || "";
        return lastLog.includes('git rebase') && !lastLog.includes('Up to date');
    },
    hint: "Checkout main -> Commit -> Checkout fix -> Commit -> 選擇 main -> 點擊 Rebase。",
    unlocks: ['commit', 'branch', 'checkout', 'merge', 'danger', 'advanced'],
    highlight: 'advanced-zone'
  }
];

// ... (CHALLENGE_LEVELS 保持不變) ...
const CHALLENGE_LEVELS = [
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

export default function App() {
  const [repo, setRepo] = useState(INITIAL_STATE);
  const [newBranchName, setNewBranchName] = useState('feature');
  const [mode, setMode] = useState('tutorial'); 
  const [stepIndex, setStepIndex] = useState(0); 
  const [levelIndex, setLevelIndex] = useState(0); 
  const [maxStepReached, setMaxStepReached] = useState(0); 
  // 新增：記錄所有已完成的關卡索引
  const [completedSteps, setCompletedSteps] = useState(new Set());

  const [showConfetti, setShowConfetti] = useState(false);
  const [levelComplete, setLevelComplete] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [progressiveMode, setProgressiveMode] = useState(true);
  
  const [mergeTarget, setMergeTarget] = useState("");
  const [advancedTarget, setAdvancedTarget] = useState("");

  const scrollRef = useRef(null);

  // --- Helpers ---
  const getCurrentCommitId = () => {
    if (repo.detachedHead) return repo.detachedHead;
    return repo.branches[repo.head];
  };

  const addLog = (msg) => {
    setRepo(prev => ({ ...prev, logs: [...prev.logs, msg] }));
  };

  const getBranchColor = (branchName, colorIndices) => {
    if (branchName === 'main') return MAIN_COLOR;
    const index = colorIndices[branchName];
    if (index === undefined) return '#94a3b8'; 
    return BRANCH_COLORS[index % BRANCH_COLORS.length];
  };

  const isFeatureUnlocked = (featureName) => {
    if (mode === 'playground' && !progressiveMode) return true;
    if (mode === 'challenge') return true; 

    if (mode === 'tutorial') {
      if (!progressiveMode) return true;
      const currentStep = TUTORIAL_STEPS[stepIndex];
      if (!currentStep || !currentStep.unlocks) return true;
      return currentStep.unlocks.includes(featureName);
    }
    
    return true;
  };

  const getLockedStyle = (featureName) => {
    if (isFeatureUnlocked(featureName)) return "";
    return "opacity-20 pointer-events-none grayscale filter blur-[1px]";
  };

  const getHighlightStyle = (zoneName) => {
    if (mode === 'tutorial') {
      const currentStep = TUTORIAL_STEPS[stepIndex];
      if (currentStep && currentStep.highlight === zoneName) {
        return "ring-2 ring-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.5)] border-yellow-400 transform scale-105 transition-all duration-300";
      }
    }
    return "";
  };

  // --- Git Actions ---

  const handleCommit = () => {
    const parentId = getCurrentCommitId();
    const newId = `c${repo.commits.length + 1}`;
    const currentBranch = repo.head;
    
    let nextBranchLanes = { ...repo.branchLanes };
    if (nextBranchLanes[currentBranch] === undefined) {
      const usedLanes = Object.values(nextBranchLanes);
      const maxLane = usedLanes.length > 0 ? Math.max(...usedLanes) : -1;
      nextBranchLanes[currentBranch] = maxLane + 1;
    }

    let laneIndex = nextBranchLanes[currentBranch];
    
    const existingChildren = repo.commits.filter(c => c.parent === parentId);
    const collision = existingChildren.some(c => c.lane === laneIndex);
    
    if (collision) {
       const usedLanes = Object.values(nextBranchLanes);
       const maxLane = usedLanes.length > 0 ? Math.max(...usedLanes) : -1;
       laneIndex = maxLane + 1;
       nextBranchLanes[currentBranch] = laneIndex; 
    }

    const parentNode = repo.commits.find(c => c.id === parentId);
    const newX = parentNode ? parentNode.x + 1 : 0;

    const newCommit = {
      id: newId,
      message: `Commit ${newId}`,
      parent: parentId,
      lane: laneIndex, 
      branch: currentBranch,
      x: newX
    };

    setRepo(prev => {
      const nextBranches = { ...prev.branches };
      if (!prev.detachedHead) {
        nextBranches[prev.head] = newId;
      }
      return {
        ...prev,
        commits: [...prev.commits, newCommit],
        branches: nextBranches,
        branchLanes: nextBranchLanes,
        detachedHead: prev.detachedHead ? newId : null,
        logs: [...prev.logs, `git commit -m "${newCommit.message}"`]
      };
    });
  };

  const handleBranch = () => {
    if (!newBranchName || repo.branches[newBranchName]) {
      addLog(`錯誤：分支名稱為空或已存在`);
      return;
    }
    const currentCommitId = getCurrentCommitId();
    const nextColorIndices = { ...repo.branchColorIndices };
    const nextColorIdx = Object.keys(repo.branchColorIndices).length - 1; 
    nextColorIndices[newBranchName] = nextColorIdx;

    setRepo(prev => ({
      ...prev,
      branches: { ...prev.branches, [newBranchName]: currentCommitId },
      branchColorIndices: nextColorIndices,
      logs: [...prev.logs, `git branch ${newBranchName}`]
    }));
  };

  const handleCheckout = (branchName) => {
    if (!repo.branches[branchName]) return;
    setRepo(prev => ({
      ...prev,
      head: branchName,
      detachedHead: null,
      logs: [...prev.logs, `git checkout ${branchName}`]
    }));
  };

  const handleMerge = () => {
    const targetBranch = mergeTarget;
    if (!targetBranch) {
      addLog(`錯誤：請先選擇要合併的分支 (Select target)`);
      return;
    }
    if (targetBranch === repo.head) return;
    
    const currentCommitId = getCurrentCommitId();
    const targetCommitId = repo.branches[targetBranch];
    const currentBranch = repo.head;
    
    const newId = `c${repo.commits.length + 1}`;
    const parentNode = repo.commits.find(c => c.id === currentCommitId);
    const laneIndex = repo.branchLanes[currentBranch];

    const newCommit = {
      id: newId,
      message: `Merge ${targetBranch}`,
      parent: currentCommitId,
      parent2: targetCommitId, 
      lane: laneIndex,
      branch: currentBranch,
      x: parentNode.x + 1
    };

    setRepo(prev => ({
      ...prev,
      commits: [...prev.commits, newCommit],
      branches: { ...prev.branches, [prev.head]: newId },
      logs: [...prev.logs, `git merge ${targetBranch}`]
    }));
    setMergeTarget(""); 
  };

  const handleRebase = () => {
    const targetBranch = advancedTarget;
    if (!targetBranch) {
      addLog(`錯誤：請先選擇要 Rebase 的目標分支 (Select target)`);
      return;
    }
    if (targetBranch === repo.head) return;
    
    const currentBranch = repo.head;
    const currentHeadId = repo.branches[currentBranch];
    const targetHeadId = repo.branches[targetBranch];

    let commitsToRebase = [];
    let ptr = currentHeadId;
    const targetHistory = new Set();
    let tPtr = targetHeadId;
    while(tPtr) {
      targetHistory.add(tPtr);
      const node = repo.commits.find(c => c.id === tPtr);
      tPtr = node ? node.parent : null;
    }

    while (ptr && !targetHistory.has(ptr)) {
      const node = repo.commits.find(c => c.id === ptr);
      if (!node) break;
      commitsToRebase.unshift(node);
      ptr = node.parent;
    }
    
    if (commitsToRebase.length === 0) {
      addLog(`git rebase ${targetBranch} (Up to date - 沒有變化)`);
      return;
    }

    let newParentId = targetHeadId;
    let newCommits = [];
    let startX = repo.commits.find(c => c.id === targetHeadId).x;
    const laneIndex = repo.branchLanes[currentBranch];

    commitsToRebase.forEach((oldCommit, idx) => {
      const newId = `c${repo.commits.length + 1 + idx}`; 
      const newCommit = {
        id: newId,
        message: oldCommit.message,
        parent: newParentId,
        lane: laneIndex,
        branch: currentBranch,
        x: startX + 1 + idx
      };
      newCommits.push(newCommit);
      newParentId = newId;
    });

    setRepo(prev => {
      const nextBranches = { ...prev.branches, [currentBranch]: newParentId };
      return {
        ...prev,
        commits: [...prev.commits, ...newCommits],
        branches: nextBranches,
        logs: [...prev.logs, `git rebase ${targetBranch} (Replayed ${newCommits.length} commits)`]
      };
    });
    setAdvancedTarget(""); 
  };

  const handleCherryPick = () => {
    const targetBranch = advancedTarget;
    if (!targetBranch) {
      addLog(`錯誤：請先選擇要 Cherry-pick 的來源分支 (Select target)`);
      return;
    }
    if (targetBranch === repo.head) return;
    
    const targetCommitId = repo.branches[targetBranch];
    const targetCommit = repo.commits.find(c => c.id === targetCommitId);
    if (!targetCommit) return;

    const currentBranch = repo.head;
    const currentHeadId = repo.branches[currentBranch];
    const parentNode = repo.commits.find(c => c.id === currentHeadId);
    const newId = `c${repo.commits.length + 1}`;
    const laneIndex = repo.branchLanes[currentBranch];

    const newCommit = {
      id: newId,
      message: `${targetCommit.message}`,
      parent: currentHeadId,
      lane: laneIndex,
      branch: currentBranch,
      x: parentNode.x + 1,
      cherrySource: targetCommitId 
    };

    setRepo(prev => {
      const nextBranches = { ...prev.branches, [currentBranch]: newId };
      return {
        ...prev,
        commits: [...prev.commits, newCommit],
        branches: nextBranches,
        logs: [...prev.logs, `git cherry-pick ${targetCommitId}`]
      };
    });
    setAdvancedTarget("");
  };

  const handleReset = (type) => { 
    const currentCommitId = getCurrentCommitId();
    const currentCommit = repo.commits.find(c => c.id === currentCommitId);

    if (!currentCommit || !currentCommit.parent) {
      addLog(`錯誤：無法 Reset，因為沒有父節點 (Root commit)`);
      return;
    }

    const parentId = currentCommit.parent;

    setRepo(prev => {
      const nextBranches = { ...prev.branches };
      if (!prev.detachedHead) {
        nextBranches[prev.head] = parentId;
      }
      return {
        ...prev,
        branches: nextBranches,
        detachedHead: prev.detachedHead ? parentId : null,
        logs: [...prev.logs, `git reset --${type} HEAD~1`]
      };
    });
  };

  const handleRevert = () => {
    const currentCommitId = getCurrentCommitId();
    const currentCommit = repo.commits.find(c => c.id === currentCommitId);
    if (!currentCommit) return;

    const newId = `c${repo.commits.length + 1}`;
    const currentBranch = repo.head;
    const laneIndex = repo.branchLanes[currentBranch] || 0;
    
    const newCommit = {
      id: newId,
      message: `Revert "${currentCommit.message}"`,
      parent: currentCommitId,
      lane: laneIndex,
      branch: currentBranch,
      x: currentCommit.x + 1
    };

    setRepo(prev => {
      const nextBranches = { ...prev.branches };
      if (!prev.detachedHead) {
        nextBranches[prev.head] = newId;
      }
      return {
        ...prev,
        commits: [...prev.commits, newCommit],
        branches: nextBranches,
        detachedHead: prev.detachedHead ? newId : null,
        logs: [...prev.logs, `git revert HEAD`]
      };
    });
  };

  const handleResetSystem = () => {
    if (mode === 'challenge') {
      setRepo(JSON.parse(JSON.stringify(CHALLENGE_LEVELS[levelIndex].setup)));
      setLevelComplete(false);
      addLog(`--- 關卡重置 ---`);
    } else {
      setRepo(INITIAL_STATE);
      setStepIndex(0); 
      setMaxStepReached(0); 
      setCompletedSteps(new Set()); // 清除所有完成紀錄
      setShowConfetti(false);
      setMergeTarget("");
      setAdvancedTarget("");
      addLog(`--- 系統重置 (教學進度已清除) ---`);
    }
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    setShowConfetti(false);
    setLevelComplete(false);
    setMergeTarget("");
    setAdvancedTarget("");
    
    if (newMode === 'tutorial') setProgressiveMode(true);
    else setProgressiveMode(false);

    if (newMode === 'challenge') {
      setLevelIndex(0);
      setRepo(JSON.parse(JSON.stringify(CHALLENGE_LEVELS[0].setup)));
    } else {
      setRepo(INITIAL_STATE);
      if (newMode === 'tutorial') {
         const safeStep = Math.min(maxStepReached, TUTORIAL_STEPS.length - 1);
         if (maxStepReached > 0) {
            setStepIndex(safeStep); 
         } else {
            setStepIndex(0);
         }
      } else {
         setStepIndex(0);
      }
    }
  };

  const nextLevel = () => {
    if (levelIndex < CHALLENGE_LEVELS.length - 1) {
      const nextIdx = levelIndex + 1;
      setLevelIndex(nextIdx);
      setRepo(JSON.parse(JSON.stringify(CHALLENGE_LEVELS[nextIdx].setup)));
      setLevelComplete(false);
    } else {
      setShowConfetti(true);
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
    }
  }, [repo.commits]);

  // --- 關鍵邏輯：檢查步驟完成 ---
  useEffect(() => {
    if (mode === 'tutorial') {
      const currentStep = TUTORIAL_STEPS[stepIndex];
      if (currentStep && currentStep.check(repo)) {
        
        // 1. 標記此步驟為已完成
        const newCompleted = new Set(completedSteps);
        newCompleted.add(stepIndex);
        setCompletedSteps(newCompleted);

        // 2. 更新最高到達進度 (解鎖下一關)
        const nextStepIdx = stepIndex + 1;
        if (nextStepIdx > maxStepReached) {
           setMaxStepReached(nextStepIdx);
        }

        // 3. 判斷是否全部破關
        const isLastStep = stepIndex === TUTORIAL_STEPS.length - 1;
        // 嚴格檢查：必須是最後一關，而且所有步驟都已完成
        const allStepsDone = isLastStep && (newCompleted.size === TUTORIAL_STEPS.length);

        if (!isLastStep) {
          setTimeout(() => setStepIndex(prev => prev + 1), 800);
        } else if (allStepsDone) {
          setShowConfetti(true);
          addLog("恭喜！您已完成所有基礎教學！");
        } else {
          // 雖然到了最後一關，但前面有缺漏
          addLog(`恭喜完成 4-2！但您還有未完成的關卡 (${newCompleted.size}/${TUTORIAL_STEPS.length})`);
        }
      }
    }
  }, [repo, mode, stepIndex, maxStepReached, completedSteps]);

  useEffect(() => {
    if (mode === 'challenge' && !levelComplete && !showConfetti) {
      const currentLevel = CHALLENGE_LEVELS[levelIndex];
      if (currentLevel.check(repo)) {
        setLevelComplete(true);
        addLog(`>>> 挑戰成功！ <<<`);
      }
    }
  }, [repo, mode, levelIndex, levelComplete, showConfetti]);

  const getTutorialGroups = () => {
    const groups = {};
    TUTORIAL_STEPS.forEach((step, idx) => {
      if (!groups[step.chapter]) groups[step.chapter] = [];
      groups[step.chapter].push({ ...step, index: idx });
    });
    return groups;
  };

  // --- Render Graph ---
  const renderGraph = () => {
    const getCoord = (commit) => ({
      x: 50 + commit.x * X_SPACING,
      y: 50 + commit.lane * LANE_HEIGHT
    });

    return (
      <svg height={Math.max(300, (Object.keys(repo.branchLanes).length + 1) * LANE_HEIGHT)} width={Math.max(600, 100 + repo.commits.length * X_SPACING)} className="block">
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

        {repo.commits.map(commit => {
          const end = getCoord(commit);
          const elements = [];

          if (commit.parent) {
            const start = getCoord(repo.commits.find(c => c.id === commit.parent));
            let pathD = `M ${start.x} ${start.y} `;
            if (start.y !== end.y) {
              pathD += `C ${start.x + 40} ${start.y}, ${end.x - 40} ${end.y}, ${end.x} ${end.y}`;
            } else {
              pathD += `L ${end.x} ${end.y}`;
            }
            elements.push(
              <path key={`line-${commit.id}`} d={pathD} stroke="#94a3b8" strokeWidth="2" fill="none" markerEnd="url(#arrowhead)" />
            );
          }

          if (commit.parent2) {
             const start2 = getCoord(repo.commits.find(c => c.id === commit.parent2));
             elements.push(
               <path key={`line-merge-${commit.id}`} 
                     d={`M ${start2.x} ${start2.y} C ${start2.x + 40} ${start2.y}, ${end.x - 40} ${end.y}, ${end.x} ${end.y}`} 
                     stroke="#a855f7" strokeWidth="2" strokeDasharray="5,3" fill="none" markerEnd="url(#arrowhead-merge)" />
             );
          }

          if (commit.cherrySource) {
             const startCherry = getCoord(repo.commits.find(c => c.id === commit.cherrySource));
             if (startCherry) {
               const midX = (startCherry.x + end.x) / 2;
               const midY = Math.min(startCherry.y, end.y) - 40;
               elements.push(
                 <path key={`line-pick-${commit.id}`} 
                       d={`M ${startCherry.x} ${startCherry.y} Q ${midX} ${midY} ${end.x} ${end.y}`} 
                       stroke="#f97316" strokeWidth="1.5" strokeDasharray="2,2" fill="none" markerEnd="url(#arrowhead-pick)" />
               );
             }
          }
          return elements;
        })}

        {repo.commits.map(commit => {
          const { x, y } = getCoord(commit);
          const isHead = getCurrentCommitId() === commit.id;
          const nodeColor = getBranchColor(commit.branch, repo.branchColorIndices);
          
          return (
            <g key={commit.id} onClick={() => console.log(commit)}>
              <circle 
                cx={x} cy={y} r={NODE_RADIUS} 
                fill={nodeColor}
                className="cursor-pointer hover:stroke-white transition-colors"
                stroke="white" strokeWidth={isHead ? 4 : 2}
              />
              <text x={x} y={y + 5} textAnchor="middle" fill="white" fontSize="10" fontWeight="bold" pointerEvents="none">
                {commit.id}
              </text>
              <text x={x} y={y + 35} textAnchor="middle" fill="#94a3b8" fontSize="10">
                {commit.message}
              </text>
              
              {Object.entries(repo.branches).map(([bName, cId]) => {
                if (cId === commit.id) {
                  const badgeColor = getBranchColor(bName, repo.branchColorIndices);
                  return (
                    <g key={bName}>
                      <rect x={x - 25} y={y - 48} width={50 + bName.length * 6} height="22" rx="4" fill={badgeColor} stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
                      <text x={x} y={y - 33} textAnchor="middle" fill="white" fontSize="11" fontWeight="bold" style={{textShadow: '0 1px 2px rgba(0,0,0,0.3)'}}>
                        {bName}
                      </text>
                      {repo.head === bName && (
                         <text x={x} y={y - 52} textAnchor="middle" fill="#fbbf24" fontSize="10" fontWeight="bold">HEAD ▼</text>
                      )}
                    </g>
                  );
                }
                return null;
              })}
            </g>
          );
        })}
      </svg>
    );
  };

  return (
    <div className="flex flex-col h-screen bg-slate-900 text-slate-100 font-sans selection:bg-blue-500 selection:text-white">
      <header className="bg-slate-800 p-4 border-b border-slate-700 flex justify-between items-center shadow-lg z-10 relative">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-2 rounded-lg">
            <GitBranch size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
              Git 圖解實驗室
            </h1>
            <p className="text-xs text-slate-400">專為新手設計的視覺化學習工具</p>
          </div>
        </div>
        
        <div className="flex gap-2 items-center">
          <button 
            onClick={() => switchMode('tutorial')}
            className={`px-3 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${mode === 'tutorial' ? 'bg-blue-600 text-white shadow-blue-500/30 shadow-lg' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
          >
            <BookOpen size={16} /> <span className="hidden sm:inline">教學</span>
          </button>
          <button 
            onClick={() => switchMode('challenge')}
            className={`px-3 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${mode === 'challenge' ? 'bg-orange-600 text-white shadow-orange-500/30 shadow-lg' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
          >
            <Trophy size={16} /> <span className="hidden sm:inline">挑戰</span>
          </button>
          <button 
            onClick={() => switchMode('playground')}
            className={`px-3 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${mode === 'playground' ? 'bg-purple-600 text-white shadow-purple-500/30 shadow-lg' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
          >
            <Play size={16} /> <span className="hidden sm:inline">自由</span>
          </button>
          <button onClick={handleResetSystem} className="p-2 bg-slate-700 hover:bg-red-600 rounded-md text-slate-300 hover:text-white transition-colors" title={mode === 'challenge' ? "重置本關" : "全部重置"}>
            {mode === 'challenge' ? <RotateCcw size={18} /> : <RefreshCw size={18} />}
          </button>

          <div className="relative">
            <button 
              onClick={() => setShowSettings(!showSettings)} 
              className={`p-2 rounded-md transition-colors ${showSettings ? 'bg-slate-600 text-white' : 'bg-slate-700 text-slate-300 hover:text-white'}`}
              title="設定"
            >
              <Settings size={18} />
            </button>
            
            {showSettings && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-slate-800 border border-slate-600 rounded-lg shadow-xl p-4 z-50">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-bold text-slate-200">設定</h3>
                  <button onClick={() => setShowSettings(false)} className="text-slate-400 hover:text-white"><X size={16}/></button>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium text-slate-300 block">循序漸進模式</span>
                      <span className="text-xs text-slate-500 block">隱藏尚未學習的進階功能</span>
                    </div>
                    <button 
                      onClick={() => setProgressiveMode(!progressiveMode)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${progressiveMode ? 'bg-blue-600' : 'bg-slate-600'}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${progressiveMode ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col relative">
          
          <div className={`border-b p-4 transition-colors ${mode === 'challenge' ? 'bg-slate-800 border-orange-900/50' : 'bg-slate-800 border-slate-700'}`}>
             <div className="max-w-4xl mx-auto">
                {mode === 'tutorial' && !showConfetti && TUTORIAL_STEPS[stepIndex] && (
                   <div className="flex items-start gap-4">
                     <div className="bg-blue-900/50 p-2 rounded-full text-blue-400 mt-1">
                       <MapIcon size={20} />
                     </div>
                     <div className="flex-1">
                       <div className="flex items-center gap-3 mb-2">
                          <select 
                            value={stepIndex}
                            onChange={(e) => {
                               const idx = parseInt(e.target.value);
                               setStepIndex(idx);
                            }}
                            className="bg-slate-900 border border-slate-600 rounded px-3 py-1 text-sm font-bold text-blue-200 focus:outline-none focus:border-blue-500"
                          >
                            {Object.entries(getTutorialGroups()).map(([chapter, steps]) => (
                               <optgroup label={chapter} key={chapter}>
                                  {steps.map(step => (
                                     <option 
                                       key={step.id} 
                                       value={step.index} 
                                       disabled={progressiveMode && step.index > maxStepReached}
                                     >
                                       {/* 這裡的勾勾邏輯改為看 completedSteps */}
                                       {step.title} {progressiveMode && step.index > maxStepReached ? '(鎖定)' : (completedSteps.has(step.index) ? '✓' : '')}
                                     </option>
                                  ))}
                               </optgroup>
                            ))}
                          </select>
                          <span className="text-xs text-slate-500">
                             {stepIndex + 1} / {TUTORIAL_STEPS.length}
                          </span>
                       </div>
                       
                       <p className="text-slate-300 mt-1">{TUTORIAL_STEPS[stepIndex].desc}</p>
                       <p className="text-sm text-yellow-500 mt-2 font-mono flex items-center gap-1">
                         <ArrowRight size={14} /> 提示：{TUTORIAL_STEPS[stepIndex].hint}
                       </p>
                     </div>
                   </div>
                )}

                {mode === 'challenge' && !levelComplete && !showConfetti && (
                   <div className="flex items-start gap-4">
                     <div className="bg-orange-900/50 p-2 rounded-full text-orange-400 mt-1">
                       <Trophy size={20} />
                     </div>
                     <div className="flex-1">
                       <h3 className="text-lg font-bold text-orange-100 flex items-center gap-2">
                         {CHALLENGE_LEVELS[levelIndex].title}
                         <span className="text-xs font-normal bg-slate-700 px-2 py-0.5 rounded text-slate-300">
                           Level {levelIndex + 1}
                         </span>
                       </h3>
                       <p className="text-slate-300 mt-1">{CHALLENGE_LEVELS[levelIndex].desc}</p>
                       <p className="text-sm text-yellow-500 mt-2 font-mono flex items-center gap-1">
                         <ArrowRight size={14} /> 任務目標：{CHALLENGE_LEVELS[levelIndex].hint}
                       </p>
                     </div>
                   </div>
                )}
                
                {mode === 'playground' && !showConfetti && (
                  <div className="flex items-center gap-4 text-slate-400">
                    <Play size={20} />
                    <p>自由模式：盡情實驗吧！沒有任何限制。</p>
                  </div>
                )}

                {mode === 'challenge' && levelComplete && !showConfetti && (
                  <div className="flex items-center justify-between bg-green-900/20 p-2 rounded-lg border border-green-500/30">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="text-green-500" size={24} />
                      <div>
                        <h4 className="text-green-100 font-bold">挑戰成功！</h4>
                        <p className="text-green-200/70 text-sm">Git 技能熟練度 +1</p>
                      </div>
                    </div>
                    <button 
                      onClick={nextLevel}
                      className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-md font-bold transition-colors flex items-center gap-2"
                    >
                      下一關 <ChevronRight size={16} />
                    </button>
                  </div>
                )}
             </div>
          </div>

          {showConfetti && (
             <div className="absolute inset-0 z-20 bg-slate-900/90 flex items-center justify-center p-6 animate-in fade-in">
                <div className="text-center max-w-lg">
                  <div className="inline-flex items-center justify-center p-4 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full mb-6 text-white shadow-xl shadow-orange-500/20">
                    <Trophy size={48} />
                  </div>
                  <h2 className="text-3xl font-bold text-white mb-4">
                    {mode === 'tutorial' ? '教學模式完成！' : '全數通關！你是 Git 大師！'}
                  </h2>
                  <p className="text-slate-300 mb-8 text-lg">
                    {mode === 'tutorial' 
                      ? '你已經掌握了基礎操作。準備好接受挑戰了嗎？' 
                      : '所有的挑戰難題都已被你破解。現在你可以在自由模式中創造更複雜的歷史！'}
                  </p>
                  <div className="flex gap-4 justify-center">
                    {mode === 'tutorial' ? (
                       <button onClick={() => switchMode('challenge')} className="bg-orange-600 text-white px-8 py-3 rounded-full font-bold hover:bg-orange-500 transition-all transform hover:scale-105 shadow-lg">
                         前往挑戰模式
                       </button>
                    ) : (
                       <button onClick={() => { switchMode('playground'); setShowConfetti(false); }} className="bg-purple-600 text-white px-8 py-3 rounded-full font-bold hover:bg-purple-500 transition-all transform hover:scale-105 shadow-lg">
                         自由探索
                       </button>
                    )}
                  </div>
                </div>
             </div>
          )}

          <div 
            ref={scrollRef}
            className="flex-1 bg-slate-900 overflow-auto relative p-8 cursor-grab active:cursor-grabbing" 
            style={{ backgroundImage: 'radial-gradient(#334155 1px, transparent 1px)', backgroundSize: '20px 20px' }}
          >
             {renderGraph()}
          </div>

          <div className="bg-slate-800 border-t border-slate-700 p-4">
             <div className="flex flex-wrap gap-4 items-center justify-center">
                
                <div className={`flex items-center gap-2 bg-slate-900/50 p-2 rounded-lg border border-slate-700 transition-all duration-500 ${getLockedStyle('commit')} ${getHighlightStyle('commit-zone')}`}>
                   <button 
                     onClick={handleCommit}
                     className="flex flex-col items-center gap-1 px-4 py-2 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white rounded transition-all w-24"
                   >
                     <GitCommit size={20} />
                     <span className="text-xs font-bold">Commit</span>
                   </button>
                </div>

                <div className={`flex items-center gap-2 bg-slate-900/50 p-2 rounded-lg border border-slate-700 transition-all duration-500 ${getLockedStyle('branch')} ${getHighlightStyle('branch-zone')}`}>
                   <input 
                     type="text" 
                     value={newBranchName}
                     onChange={(e) => setNewBranchName(e.target.value)}
                     className="bg-slate-800 border border-slate-600 rounded px-2 py-1 text-sm w-24 text-center focus:border-purple-500 focus:outline-none"
                     placeholder="分支名"
                   />
                   <button 
                     onClick={handleBranch}
                     className="flex flex-col items-center gap-1 px-4 py-2 bg-purple-600 hover:bg-purple-500 active:scale-95 text-white rounded transition-all w-24"
                   >
                     <GitBranch size={20} />
                     <span className="text-xs font-bold">Branch</span>
                   </button>
                </div>

                <div className={`flex items-center gap-2 bg-slate-900/50 p-2 rounded-lg border border-slate-700 transition-all duration-500 ${getLockedStyle('checkout')} ${getHighlightStyle('checkout-zone')}`}>
                   <select 
                     value={repo.head} 
                     onChange={(e) => handleCheckout(e.target.value)}
                     className="bg-slate-800 border border-slate-600 rounded px-2 py-1 text-sm w-24 focus:border-green-500 focus:outline-none"
                   >
                     {Object.keys(repo.branches).map(b => (
                       <option key={b} value={b}>{b}</option>
                     ))}
                   </select>
                   <button 
                     onClick={() => {}} 
                     className="flex flex-col items-center gap-1 px-4 py-2 bg-green-600 hover:bg-green-500 opacity-80 cursor-default text-white rounded w-24"
                   >
                     <ChevronRight size={20} />
                     <span className="text-xs font-bold">Checkout</span>
                   </button>
                </div>

                <div className={`flex items-center gap-2 bg-slate-900/50 p-2 rounded-lg border border-slate-700 transition-all duration-500 ${getLockedStyle('merge')} ${getHighlightStyle('merge-zone')}`}>
                    <select 
                     value={mergeTarget}
                     onChange={(e) => setMergeTarget(e.target.value)}
                     className="bg-slate-800 border border-slate-600 rounded px-2 py-1 text-sm w-24 focus:border-orange-500 focus:outline-none"
                   >
                     <option value="" disabled>來源分支</option>
                     {Object.keys(repo.branches).filter(b => b !== repo.head).map(b => (
                       <option key={b} value={b}>{b}</option>
                     ))}
                   </select>
                   <button 
                     onClick={handleMerge}
                     className="flex flex-col items-center gap-1 px-4 py-2 bg-orange-600 hover:bg-orange-500 active:scale-95 text-white rounded transition-all w-24"
                   >
                     <GitMerge size={20} />
                     <span className="text-xs font-bold">Merge</span>
                   </button>
                </div>

                 <div className={`flex items-center gap-2 bg-indigo-900/20 p-2 rounded-lg border border-indigo-900/50 transition-all duration-500 ${getLockedStyle('advanced')} ${getHighlightStyle('advanced-zone')}`}>
                     <select 
                      value={advancedTarget}
                      onChange={(e) => setAdvancedTarget(e.target.value)}
                      className="bg-slate-800 border border-slate-600 rounded px-2 py-1 text-sm w-24 focus:border-indigo-500 focus:outline-none"
                    >
                      <option value="" disabled>來源分支</option>
                      {Object.keys(repo.branches).filter(b => b !== repo.head).map(b => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                    
                    <div className="flex gap-1">
                      <button 
                        onClick={handleRebase}
                        className="flex flex-col items-center gap-1 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white rounded transition-all w-16"
                        title="Rebase (變基：接上分支)"
                      >
                        <GitPullRequest size={18} />
                        <span className="text-[10px] font-bold">Rebase</span>
                      </button>
                      <button 
                        onClick={handleCherryPick}
                        className="flex flex-col items-center gap-1 px-3 py-2 bg-pink-600 hover:bg-pink-500 active:scale-95 text-white rounded transition-all w-16"
                        title="Cherry Pick (揀選：複製單個 Commit)"
                      >
                        <Copy size={18} />
                        <span className="text-[10px] font-bold">Pick</span>
                      </button>
                    </div>
                 </div>

                <div className={`flex items-center gap-2 bg-red-900/20 p-2 rounded-lg border border-red-900/50 relative group transition-all duration-500 ${getLockedStyle('danger')} ${getHighlightStyle('danger-zone')}`}>
                   <div className="absolute -top-3 left-2 bg-red-900 text-xs text-red-200 px-2 py-0.5 rounded shadow-sm flex items-center gap-1">
                     <AlertTriangle size={10} /> Danger
                   </div>
                   
                   <div className="flex gap-1">
                      <button 
                       onClick={() => handleReset('soft')}
                       className="flex flex-col items-center gap-1 px-3 py-2 bg-red-800/60 hover:bg-red-700 active:scale-95 text-white rounded transition-all w-16"
                       title="Reset Soft (保留檔案)"
                     >
                       <Undo2 size={18} />
                       <span className="text-[10px] font-bold">Soft</span>
                     </button>
                     <button 
                       onClick={() => handleReset('hard')}
                       className="flex flex-col items-center gap-1 px-3 py-2 bg-red-700 hover:bg-red-600 active:scale-95 text-white rounded transition-all w-16"
                       title="Reset Hard (丟棄檔案)"
                     >
                       <Undo2 size={18} />
                       <span className="text-[10px] font-bold">Hard</span>
                     </button>
                   </div>
                   
                   <div className="w-px h-8 bg-red-800/50 mx-1"></div>

                   <button 
                     onClick={handleRevert}
                     className="flex flex-col items-center gap-1 px-3 py-2 bg-slate-700 hover:bg-slate-600 active:scale-95 text-white rounded transition-all w-16"
                     title="Revert (新增抵銷 Commit)"
                   >
                     <History size={18} />
                     <span className="text-[10px] font-bold">Revert</span>
                   </button>
                </div>

             </div>
          </div>
        </div>

        <div className="w-80 bg-black border-l border-slate-700 flex flex-col font-mono text-sm hidden md:flex">
          <div className="bg-slate-800 px-4 py-2 text-xs text-slate-400 flex items-center gap-2 uppercase tracking-wider font-bold">
            <Terminal size={12} />
            Command History
          </div>
          <div className="flex-1 p-4 overflow-auto text-slate-300 space-y-1">
            {repo.logs.map((log, i) => (
              <div key={i} className="break-all">
                <span className="text-green-500 mr-2">$</span>
                {log}
              </div>
            ))}
            <div className="animate-pulse text-green-500">_</div>
          </div>
          
          <div className="p-4 bg-slate-900 border-t border-slate-800">
             <h4 className="text-slate-400 text-xs mb-2 font-sans uppercase font-bold">Status</h4>
             <div className="space-y-2">
                <div className="flex justify-between">
                   <span className="text-slate-500">HEAD:</span>
                   <span className="text-yellow-400 font-bold">{repo.head}</span>
                </div>
                <div className="flex justify-between">
                   <span className="text-slate-500">Branches:</span>
                   <span className="text-slate-300">{Object.keys(repo.branches).join(', ')}</span>
                </div>
                <div className="flex justify-between">
                   <span className="text-slate-500">Mode:</span>
                   <span className={`font-bold uppercase text-xs px-2 rounded ${mode === 'challenge' ? 'bg-orange-600 text-white' : 'bg-slate-700 text-slate-300'}`}>{mode}</span>
                </div>
                <div className="flex justify-between">
                   <span className="text-slate-500">Progressive:</span>
                   <span className={`font-bold uppercase text-xs px-2 rounded ${progressiveMode ? 'bg-green-600 text-white' : 'bg-slate-700 text-slate-300'}`}>{progressiveMode ? 'ON' : 'OFF'}</span>
                </div>
             </div>
          </div>
        </div>
      </main>
    </div>
  );
}