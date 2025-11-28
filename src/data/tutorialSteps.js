// src/data/tutorialSteps.js

export const TUTORIAL_STEPS = [
  // --- Chapter 1: 基礎操作 ---
  {
    id: 1,
    chapter: "第一章：時光穿梭",
    title: "1-1 建立提交 (Commit)",
    desc: "歡迎來到 Git 實驗室！Git 會將專案的歷史記錄成一個個節點。請試著點擊「提交 (Commit)」按鈕兩次，建立你的歷史紀錄。",
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
    desc: "建立分支後，我們需要「切換」過去才能開始工作。請切換到 'feature' 分支。",
    check: (state) => state.head === 'feature',
    hint: "點擊 'feature' 分支旁的 'Checkout' 按鈕。",
    unlocks: ['commit', 'branch', 'checkout'],
    highlight: 'checkout-zone'
  },

  // --- Chapter 2: 合併與刪除 ---
  {
    id: 4,
    chapter: "第二章：平行宇宙",
    title: "2-1 製造分歧 (Diverge)",
    desc: "為了理解合併，我們需要兩條分開的歷史線。現在你在 'feature'。請先 Commit 一次。然後切回 'main'，也 Commit 一次。這樣圖形就會分岔。",
    check: (state) => {
      const mainHead = state.commits.find(c => c.id === state.branches['main']);
      const featHead = state.commits.find(c => c.id === state.branches['feature']);
      if (!mainHead || !featHead) return false;
      return mainHead.id !== featHead.id && mainHead.parent !== featHead.id && featHead.parent !== mainHead.id;
    },
    hint: "1. Commit (feature) -> 2. Checkout main -> 3. Commit (main)",
    unlocks: ['commit', 'branch', 'checkout'],
    highlight: 'commit-zone'
  },
  {
    id: 5,
    chapter: "第二章：平行宇宙",
    title: "2-2 分支合併 (Merge)",
    desc: "現在兩邊都有新進度了。請確保你站在 'main' 分支上，然後將 'feature' 合併進來。",
    check: (state) => {
      const lastCommit = state.commits[state.commits.length - 1];
      return state.head === 'main' && lastCommit.message.includes('Merge');
    },
    hint: "Checkout main (如果還沒) -> 選擇 feature -> 點擊 Merge。",
    unlocks: ['commit', 'branch', 'checkout', 'merge'],
    highlight: 'merge-zone'
  },

  // --- Chapter 3: 檔案與修改 (NEW) ---
  {
    id: 6,
    chapter: "第三章：檔案與修改",
    title: "3-1 修改檔案 (Edit)",
    desc: "恭喜解鎖編輯器！現在我們可以真的寫 code 了。請在右上的編輯器輸入一些文字，你會發現狀態變成 'Modified'。",
    check: (state) => state.staging.isDirty,
    hint: "在右上角的黑色編輯器打幾個字。",
    unlocks: ['commit', 'branch', 'checkout', 'merge', 'editor'], // 解鎖編輯器
    highlight: 'editor-zone'
  },
  {
    id: 7,
    chapter: "第三章：檔案與修改",
    title: "3-2 檢視差異 (Diff)",
    desc: "在提交之前，檢查自己改了什麼是好習慣。請先點擊編輯器標題列上的 'Diff' 按鈕，確認修改內容後，再進行提交。", // 微調敘述
    check: (state) => {
      // 1. [NEW] 嚴格檢查：必須真的點開過 Diff 按鈕
      if (!state.tutorialFlags?.hasViewedDiff) return false;

      // 2. 必須是乾淨的 (已提交)
      if (state.staging.isDirty) return false;
      
      // 3. 必須至少有 2 個 Commit
      if (state.commits.length <= 1) return false;

      return true;
    }, 
    hint: "一定要先點擊 'Diff' 按鈕打開比對視窗，然後再 Commit 喔！",
    unlocks: ['commit', 'branch', 'checkout', 'merge', 'editor'],
    highlight: 'editor-zone'
  },
  // --- Chapter 4: 衝突實戰 (NEW) ---
  {
    id: 8,
    chapter: "第四章：衝突的藝術",
    title: "4-1 製造衝突 (Conflict)",
    desc: "我們要來模擬最令人頭痛的情況：兩個人改了同一行程式碼。1. 在 main 修改檔案並 Commit。 2. 切換到 feature 修改同一行並 Commit。",
    check: (state) => {
      const mainId = state.branches['main'];
      const featId = state.branches['feature'];
      if (!mainId || !featId || mainId === featId) return false;

      const mainC = state.commits.find(c => c.id === mainId);
      const featC = state.commits.find(c => c.id === featId);

      // 1. 基本檢查：內容必須不同
      if (mainC.fileContent === featC.fileContent) return false;

      // 2. 嚴格檢查：確認彼此是否有「祖先關係」
      // 定義一個簡單的爬樹函數：檢查 suspectAncestor 是否為 startNode 的祖先
      const isAncestor = (suspectAncestor, startNodeId) => {
        let queue = [startNodeId];
        let visited = new Set();
        while (queue.length > 0) {
          const currId = queue.shift();
          if (visited.has(currId)) continue;
          visited.add(currId);

          if (currId === suspectAncestor) return true; // 找到了！它是祖先

          const node = state.commits.find(c => c.id === currId);
          if (node) {
            if (node.parent) queue.push(node.parent);
            if (node.parent2) queue.push(node.parent2);
          }
        }
        return false;
      };

      // 情況 A：feature 是 main 的祖先 (代表 main 只是進度領先，沒有分岔) -> 失敗
      if (isAncestor(featId, mainId)) return false;

      // 情況 B：main 是 feature 的祖先 (代表 feature 只是進度領先，沒有分岔) -> 失敗
      if (isAncestor(mainId, featId)) return false;

      // 只有當雙方「互不為祖先」時，才是真正的分岔衝突 -> 過關
      return true;
    },
    hint: "1. Main 改 'A' -> Commit. 2. Checkout feature -> 改 'B' -> Commit.",
    unlocks: ['commit', 'branch', 'checkout', 'merge', 'editor'],
    highlight: 'editor-zone'
  },
  {
    id: 9,
    chapter: "第四章：衝突的藝術",
    title: "4-2 解決衝突 (Resolve)",
    desc: "現在兩個分支內容打架了。請切回 main，執行 Merge feature。系統會報錯，請使用衝突解決面板來修復它！",
    check: (state) => {
      // 檢查是否產生了 Merge Commit 且狀態為 IDLE (已解決)
      const last = state.commits[state.commits.length - 1];
      return state.status === 'IDLE' && last.message.includes('Conflict Resolved');
    },
    hint: "Checkout main -> Merge feature -> 在彈出視窗選 'Keep Both' 或任一邊 -> Resolve & Commit。",
    unlocks: ['commit', 'branch', 'checkout', 'merge', 'editor'],
    highlight: 'merge-zone'
  },

  // --- Chapter 5: 救援行動 (NEW) ---
  {
    id: 10,
    chapter: "第五章：救援行動",
    title: "5-1 誤刪歷史 (Reset Hard)",
    desc: "有時候我們會手滑。請使用 'Reset Hard' 讓你的進度退回到上一步。別擔心，這是在為救援做準備。",
    check: (state) => state.logs.some(l => l.includes('reset --hard')),
    hint: "點擊 Danger Zone 的 'reset --hard'。",
    unlocks: ['commit', 'branch', 'checkout', 'merge', 'editor', 'reset'],
    highlight: 'danger-zone'
  },
  {
    id: 11,
    chapter: "第五章：救援行動",
    title: "5-2 尋找幽靈 (Ghost Node)",
    desc: "你會發現剛剛的 Commit 變成了半透明的「幽靈節點」。Git 沒有真的刪除它！請點擊那個半透明的節點，使用「Reset to Here」把它救回來。",
    check: (state) => {
      // 檢查 HEAD 是否指回了最新的那個節點 (原本被拋棄的)
      // 這裡簡化檢查：只要 commit 數量沒有變少，且 head 指向最後一個 ID
      const lastCommit = state.commits[state.commits.length - 1];
      return state.branches[state.head] === lastCommit.id;
    },
    hint: "點擊變淡的節點 -> 在彈出視窗按 'Reset main to Here'。",
    unlocks: ['commit', 'branch', 'checkout', 'merge', 'editor', 'reset'],
    highlight: 'graph-zone'
  },

  // --- Chapter 6: 選修課程 (Moved) ---
  {
    id: 12, 
    chapter: "第六章：選修課程",
    title: "6-1 隔空取物 (Cherry-pick)",
    desc: "只想複製某個 Commit 而不是整個分支？請建立新分支並 Commit，然後切回 main 使用 Cherry-pick 把該 Commit 複製過來。",
    check: (state) => state.commits.some(c => c.cherrySource),
    hint: "Branch fix -> Commit -> Checkout main -> Select fix -> Cherry-pick。",
    // 🔴 [FIX] 這裡補上了 'cherry-pick'
    unlocks: ['commit', 'branch', 'checkout', 'merge', 'editor', 'reset', 'advanced', 'cherry-pick'],
    highlight: 'advanced-zone'
  },
  {
    id: 13, 
    chapter: "第六章：選修課程",
    title: "6-2 整理歷史 (Rebase)",
    desc: "Rebase 可以把分岔的歷史拉直。請切換到副分支，對 main 執行 Rebase。",
    check: (state) => state.logs.some(l => l.includes('git rebase')),
    hint: "Checkout feature -> Select main -> Rebase。",
    // 🔴 [FIX] 這裡補上了 'rebase'
    unlocks: ['commit', 'branch', 'checkout', 'merge', 'editor', 'reset', 'advanced', 'rebase'],
    highlight: 'advanced-zone'
  }
];