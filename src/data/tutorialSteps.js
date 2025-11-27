// --- 教學模式資料 關卡內容 ---

// --- 教學模式資料 (11 關) ---
export const TUTORIAL_STEPS = [
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
    hint: "點擊紅色區域的 'Revert' 按鈕來建立反向提交。",
    unlocks: ['commit', 'branch', 'checkout', 'merge', 'revert'],
    highlight: 'danger-zone'
  },
  {
    id: 8,
    chapter: "第三章：後悔藥",
    title: "3-2 溫柔重置 (Reset Soft)",
    desc: "如果只是私有分支，想回到上一步並「保留檔案修改」（例如想重新整理 Commit）。請使用 `Reset (Soft)`。你會發現 HEAD 往回退了，但工作內容還在（這裡用 Log 模擬檔案保留）。",
    check: (state) => state.logs.some(l => l.includes('--soft')),
    hint: "點擊紅色區域的 'Soft' 按鈕。觀察 HEAD 指針移動。",
    unlocks: ['commit', 'branch', 'checkout', 'merge', 'reset'],
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
    unlocks: ['commit', 'branch', 'checkout', 'merge', 'reset'],
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
