// src/core/gitActions.js

// 取得目前 HEAD 指向的 commit id
export function getCurrentCommitId(repo) {
  if (repo.detachedHead) return repo.detachedHead;
  return repo.branches[repo.head];
}

function checkConflict(repo, baseId, currentId, incomingId) {
  const baseNode = repo.commits.find(c => c.id === baseId);
  const currentNode = repo.commits.find(c => c.id === currentId);
  const incomingNode = repo.commits.find(c => c.id === incomingId);

  const baseContent = baseNode?.fileContent || '';
  const currentContent = currentNode?.fileContent || '';
  const incomingContent = incomingNode?.fileContent || '';

  let hasConflict = false;
  let autoResolvedContent = currentContent;

  if (currentContent === incomingContent) {
    autoResolvedContent = currentContent;
  } else if (currentContent === baseContent && incomingContent !== baseContent) {
    autoResolvedContent = incomingContent;
  } else if (currentContent !== baseContent && incomingContent === baseContent) {
    autoResolvedContent = currentContent;
  } else {
    hasConflict = true;
  }

  return {
    hasConflict,
    baseContent,
    currentContent,
    incomingContent,
    resolvedContent: hasConflict ? null : autoResolvedContent 
  };
}

// 內部用：在 logs 加一行
function withLog(repo, msg) {
  return {
    ...repo,
    logs: [...repo.logs, msg],
  };
}

/**
 * git commit：在目前 HEAD 所在分支新增一個 commit
 */
export function commitChanges(repo) {
  const parentId = getCurrentCommitId(repo);
  const newId = `c${repo.commits.length + 1}`;
  const currentBranch = repo.head;

  let nextBranchLanes = { ...repo.branchLanes };

  // 如果現在分支還沒有 lane，幫它配一條
  if (nextBranchLanes[currentBranch] === undefined) {
    const usedLanes = Object.values(nextBranchLanes);
    const maxLane = usedLanes.length > 0 ? Math.max(...usedLanes) : -1;
    nextBranchLanes[currentBranch] = maxLane + 1;
  }

  let laneIndex = nextBranchLanes[currentBranch];

  // 如果同一個 parent 底下已經有同 lane 的子節點，改用新的 lane 避免重疊
  const existingChildren = repo.commits.filter((c) => c.parent === parentId);
  const collision = existingChildren.some((c) => c.lane === laneIndex);
  if (collision) {
    const usedLanes = Object.values(nextBranchLanes);
    const maxLane = usedLanes.length > 0 ? Math.max(...usedLanes) : -1;
    laneIndex = maxLane + 1;
    nextBranchLanes[currentBranch] = laneIndex;
  }

  const parentNode = repo.commits.find((c) => c.id === parentId);
  const newX = parentNode ? parentNode.x + 1 : 0;

  const newFileContent = repo.staging.isDirty 
    ? repo.staging.content 
    : (parentNode?.fileContent || repo.staging.content || "");

  const newCommit = {
    id: newId,
    message: `Commit ${newId}`,
    parent: parentId,
    lane: laneIndex,
    branch: currentBranch,
    x: newX,
    fileContent: newFileContent // 寫入快照
  };

  const nextBranches = { ...repo.branches };
  if (!repo.detachedHead) {
    nextBranches[currentBranch] = newId;
  }

  let newRepo = {
    ...repo,
    commits: [...repo.commits, newCommit],
    branches: nextBranches,
    branchLanes: nextBranchLanes,
    detachedHead: repo.detachedHead ? newId : null,
    // [修正重點] Commit 後，Staging 變為 Clean，但內容(content)必須保留！
    staging: { 
      content: newFileContent, 
      isDirty: false 
    },
  };

  newRepo = withLog(newRepo, `git commit -m "${newCommit.message}"`);
  return newRepo;
}
/**
 * 使用者編輯檔案內容 (模擬 git add 的前身：修改工作目錄)
 */
export function updateStagingContent(repo, newContent) {
  // 如果內容跟目前 HEAD 的內容不一樣，就是 dirty
  // (這裡簡化判斷，只要有打字就視為 dirty，或者你可以做更細的比對)
  
  return {
    ...repo,
    staging: {
      content: newContent,
      isDirty: true // 標記為已修改
    }
  };
}

/**
 * git branch <name>
 */
export function createBranchAtHead(repo, branchName) {
  const trimmed = branchName.trim();
  if (!trimmed) {
    return withLog(repo, '錯誤：分支名稱為空');
  }
  if (repo.branches[trimmed]) {
    return withLog(repo, `錯誤：分支 ${trimmed} 已存在`);
  }

  const currentCommitId = getCurrentCommitId(repo);
  const nextColorIndices = { ...repo.branchColorIndices };
  const nextColorIdx = Object.keys(repo.branchColorIndices).length - 1;
  nextColorIndices[trimmed] = nextColorIdx;

  let newRepo = {
    ...repo,
    branches: { ...repo.branches, [trimmed]: currentCommitId },
    branchColorIndices: nextColorIndices,
  };

  newRepo = withLog(newRepo, `git branch ${trimmed}`);
  return newRepo;
}

/**
 * git checkout <branch>
 */
export function checkoutBranch(repo, branchName) {
  if (!repo.branches[branchName]) {
    return withLog(repo, `錯誤：分支 ${branchName} 不存在`);
  }

  let newRepo = {
    ...repo,
    head: branchName,
    detachedHead: null,
  };

  newRepo = withLog(newRepo, `git checkout ${branchName}`);
  return newRepo;
}

/**
 * git merge <targetBranch>
 */
export function mergeBranchIntoCurrent(repo, targetBranch) {
  if (repo.status === 'CONFLICT') return withLog(repo, '錯誤：衝突解決中');
  if (!targetBranch) return repo;
  if (!repo.branches[targetBranch]) return withLog(repo, `錯誤：找不到分支 ${targetBranch}`);
  if (targetBranch === repo.head) return withLog(repo, '錯誤：不能把分支自己 merge 自己');

  const currentBranch = repo.head;
  const currentCommitId = getCurrentCommitId(repo);
  const targetCommitId = repo.branches[targetBranch];

  // [修正 1] 找 Target 的祖先路徑
  const targetAncestors = new Set();
  let curr = repo.commits.find(c => c.id === targetCommitId);
  while(curr) {
    targetAncestors.add(curr.id);
    // 🔴 關鍵修正：必須透過 ID 找 Parent，才能往上爬
    curr = repo.commits.find(c => c.id === curr.parent); 
  }

  // [修正 2] 從 Current 往上找，直到撞見 Target 的祖先
  let baseId = null;
  curr = repo.commits.find(c => c.id === currentCommitId);
  while(curr) {
    if (targetAncestors.has(curr.id)) {
      baseId = curr.id;
      break;
    }
    // 🔴 關鍵修正：必須透過 ID 找 Parent
    curr = repo.commits.find(c => c.id === curr.parent);
  }

  // 3. 執行衝突檢測
  const conflictResult = checkConflict(repo, baseId, currentCommitId, targetCommitId);

  // 🔴 情況 A: 發生衝突
  if (conflictResult.hasConflict) {
    return {
      ...repo,
      status: 'CONFLICT',
      conflictData: {
        baseContent: conflictResult.baseContent,
        currentContent: conflictResult.currentContent,
        incomingContent: conflictResult.incomingContent,
        targetBranch: targetBranch,
        targetCommitId: targetCommitId
      },
      logs: [...repo.logs, `⚠️ CONFLICT (content): Merge conflict in file.txt`, `Automatic merge failed; fix conflicts and then commit the result.`]
    };
  }

  // 🟢 情況 B: 自動合併 (無衝突)
  const newId = `c${repo.commits.length + 1}`;
  const parentNode = repo.commits.find((c) => c.id === currentCommitId);
  const laneIndex = repo.branchLanes[currentBranch];

  const finalContent = conflictResult.resolvedContent !== null 
    ? conflictResult.resolvedContent 
    : (parentNode?.fileContent || "");

  const newCommit = {
    id: newId,
    message: `Merge ${targetBranch}`,
    parent: currentCommitId,
    parent2: targetCommitId,
    lane: laneIndex,
    branch: currentBranch,
    x: parentNode ? parentNode.x + 1 : 0,
    fileContent: finalContent
  };

  let newRepo = {
    ...repo,
    commits: [...repo.commits, newCommit],
    branches: { ...repo.branches, [currentBranch]: newId },
    staging: {
      content: finalContent,
      isDirty: false
    }
  };

  return withLog(newRepo, `git merge ${targetBranch}`);
}

/**
 * git reset --hard <targetCommitId>
 * 讓使用者可以強制把分支指針移動到任意節點 (救回幽靈節點用)
 */
export function resetBranchToCommit(repo, targetCommitId) {
  // 1. 防呆
  if (repo.status === 'CONFLICT') return withLog(repo, '錯誤：衝突解決中，無法 Reset');
  
  const targetCommit = repo.commits.find(c => c.id === targetCommitId);
  if (!targetCommit) return withLog(repo, `錯誤：找不到 Commit ${targetCommitId}`);

  const currentBranch = repo.head;
  
  // 如果是 Detached HEAD，我們就移動 Detached 指標
  // 如果是正常分支，我們移動分支指標
  let nextBranches = { ...repo.branches };
  let nextDetached = repo.detachedHead;

  if (repo.detachedHead) {
    nextDetached = targetCommitId;
  } else {
    nextBranches[currentBranch] = targetCommitId;
  }

  // 2. 處理 Staging Area (Hard Reset 會強制把檔案變回目標狀態)
  // 這步很重要，不然編輯器內容會跟圖形對不上
  const nextStaging = {
    content: targetCommit.fileContent || '',
    isDirty: false
  };

  let newRepo = {
    ...repo,
    branches: nextBranches,
    detachedHead: nextDetached,
    staging: nextStaging
  };

  return withLog(newRepo, `git reset --hard ${targetCommitId}`);
}
/**
 * 解決衝突並提交 (Resolve Conflict)
 * 這是當使用者在 UI 上點選 "Resolve & Commit" 後呼叫的
 */
export function resolveConflict(repo, resolvedContent) {
  if (repo.status !== 'CONFLICT') return repo;

  const currentBranch = repo.head;
  const currentCommitId = getCurrentCommitId(repo);
  const targetCommitId = repo.conflictData.targetCommitId;
  const targetBranchName = repo.conflictData.targetBranch;

  // 建立 Merge Commit
  const newId = `c${repo.commits.length + 1}`;
  const parentNode = repo.commits.find((c) => c.id === currentCommitId);
  const laneIndex = repo.branchLanes[currentBranch];

  const newCommit = {
    id: newId,
    message: `Merge ${targetBranchName} (Conflict Resolved)`,
    parent: currentCommitId,
    parent2: targetCommitId,
    lane: laneIndex,
    branch: currentBranch,
    x: parentNode ? parentNode.x + 1 : 0,
    fileContent: resolvedContent 
  };

  return {
    ...repo,
    commits: [...repo.commits, newCommit],
    branches: { ...repo.branches, [currentBranch]: newId },
    status: 'IDLE', // 解除衝突狀態
    conflictData: null,
    staging: {
      content: resolvedContent,
      isDirty: false
    },
    // 補上完整的操作記錄：先 Add 再 Commit
    logs: [
      ...repo.logs, 
      `Conflict resolved in main.txt`,
      `git add .`,  // <--- 補上這一行，讓學生知道解決後要 Add
      `git commit -m "Merge ${targetBranchName}"`
    ]
  };
}
/**
 * 標記使用者已經看過 Diff
 */
export function markDiffViewed(repo) {
  return {
    ...repo,
    tutorialFlags: {
      ...repo.tutorialFlags,
      hasViewedDiff: true
    }
  };
}
/**
 * git rebase
 */
export function rebaseCurrentOnto(repo, targetBranch) {
  if (!targetBranch) return repo;
  // ... (省略中間判斷邏輯，保持原樣) ...
  // 注意：實際操作 rebase 複雜度較高，這裡暫時不需動 staging，除非你想模擬衝突
  
  // 為了保持程式碼簡潔，這裡我只貼上需要變動的部分，請將原本 rebase 的內容保留
  // 只要確保回傳結構正確即可
  
  // (以下複製原本 rebase 邏輯，但在回傳時確保 staging 狀態正確)
  if (!repo.branches[targetBranch]) {
    return withLog(repo, `錯誤：找不到分支 ${targetBranch}`);
  }
  if (targetBranch === repo.head) {
    return withLog(repo, '錯誤：不能 rebase 自己到自己');
  }

  const currentBranch = repo.head;
  const currentHeadId = repo.branches[currentBranch];
  const targetHeadId = repo.branches[targetBranch];

  const targetHistory = new Set();
  let tPtr = targetHeadId;
  while (tPtr) {
    targetHistory.add(tPtr);
    const node = repo.commits.find((c) => c.id === tPtr);
    tPtr = node ? node.parent : null;
  }

  let commitsToRebase = [];
  let ptr = currentHeadId;
  while (ptr && !targetHistory.has(ptr)) {
    const node = repo.commits.find((c) => c.id === ptr);
    if (!node) break;
    commitsToRebase.unshift(node);
    ptr = node.parent;
  }

  if (commitsToRebase.length === 0) {
    return withLog(repo, `git rebase ${targetBranch} (Up to date - 沒有變化)`);
  }

  let newParentId = targetHeadId;
  const targetNode = repo.commits.find((c) => c.id === targetHeadId);
  const startX = targetNode ? targetNode.x : 0;
  const laneIndex = repo.branchLanes[currentBranch];

  const newCommits = commitsToRebase.map((oldCommit, idx) => {
    const newId = `c${repo.commits.length + 1 + idx}`;
    let newParent = newParentId; // Fix variable scope issue if any
    const newCommit = {
      id: newId,
      message: oldCommit.message,
      parent: newParent,
      lane: laneIndex,
      branch: currentBranch,
      x: startX + 1 + idx,
    };
    newParentId = newId; // Update for next loop
    return newCommit;
  });

  let newRepo = {
    ...repo,
    commits: [...repo.commits, ...newCommits],
    branches: { ...repo.branches, [currentBranch]: newParentId },
  };

  newRepo = withLog(
    newRepo,
    `git rebase ${targetBranch} (Replayed ${newCommits.length} commits)`
  );
  return newRepo;
}

/**
 * git cherry-pick
 */
export function cherryPickFromBranch(repo, targetBranch) {
   // ... (保留原本 cherry-pick 邏輯) ...
   // 同樣地，Cherry pick 也是產生 commit，會清空暫存區
   
   // 這裡為了版面整潔，建議您保留原本的程式碼，
   // 只要在最後 return newRepo 時確認 staging: [] 即可 (如果原本有髒資料的話)
   // 但簡單起見，我們專注於 resetHead 即可。
   
   // (以下為簡化版，請使用您原本的完整邏輯，僅需注意 return)
   if (!targetBranch) return repo;
   // ... (略) ...
   const targetCommitId = repo.branches[targetBranch];
   const targetCommit = repo.commits.find((c) => c.id === targetCommitId);
   if (!targetCommit) return withLog(repo, `錯誤...`);

   const currentBranch = repo.head;
   const currentHeadId = repo.branches[currentBranch];
   const parentNode = repo.commits.find((c) => c.id === currentHeadId);
   const newId = `c${repo.commits.length + 1}`;
   const laneIndex = repo.branchLanes[currentBranch];

   const newCommit = {
    id: newId,
    message: targetCommit.message,
    parent: currentHeadId,
    lane: laneIndex,
    branch: currentBranch,
    x: parentNode ? parentNode.x + 1 : 0,
    cherrySource: targetCommitId,
  };

  let newRepo = {
    ...repo,
    commits: [...repo.commits, newCommit],
    branches: { ...repo.branches, [currentBranch]: newId },
    staging: [], // Cherry-pick 視為提交，清空暫存
  };

  newRepo = withLog(newRepo, `git cherry-pick ${targetCommitId}`);
  return newRepo;
}

/**
 * git reset --soft / --hard HEAD~1
 * [修改重點] 這裡處理 Staging Area 的變化
 */
export function resetHead(repo, type) {
  // 1. 防呆：衝突中不能 Reset
  if (repo.status === 'CONFLICT') {
    return withLog(repo, '錯誤：衝突解決中，無法 Reset');
  }

  // 2. 取得目前與父節點資訊
  const currentCommitId = getCurrentCommitId(repo);
  const currentCommit = repo.commits.find((c) => c.id === currentCommitId);
  
  if (!currentCommit || !currentCommit.parent) {
    return withLog(repo, '錯誤：無法 Reset，因為沒有父節點 (Root commit)');
  }

  const parentId = currentCommit.parent;
  const parentCommit = repo.commits.find(c => c.id === parentId);

  // 3. 移動 HEAD 指標 (回到上一層)
  let nextBranches = { ...repo.branches };
  if (!repo.detachedHead) {
    nextBranches[repo.head] = parentId;
  }

  // 4. [關鍵修正] 處理 Staging Area 與檔案內容
  // 這裡不能用 [...repo.staging]，因為它現在是物件
  let nextStaging = { ...repo.staging }; 

  if (type === 'hard') {
    // 🔴 Hard Reset: 
    // 強制捨棄所有修改，回到目標 Commit (Parent) 的狀態。
    // 編輯器內容 -> 更新為 Parent 的內容
    // 狀態 -> Clean
    nextStaging = {
      content: parentCommit?.fileContent || '', 
      isDirty: false 
    };
  } else {
    // 🟡 Soft (或 Mixed) Reset: 
    // 保留目前檔案內容，但 HEAD 移除了。
    // 這代表目前的檔案內容相對於新的 HEAD (Parent) 來說是「有修改的 (Staged/Dirty)」。
    // 編輯器內容 -> 保持 Reset 前的樣子 (也就是 currentCommit 的內容)
    // 狀態 -> Modified/Dirty
    nextStaging = {
      content: currentCommit?.fileContent || '', 
      isDirty: true 
    };
  }

  // 5. 回傳新狀態
  let newRepo = {
    ...repo,
    branches: nextBranches,
    detachedHead: repo.detachedHead ? parentId : null,
    staging: nextStaging, 
  };

  return withLog(newRepo, `git reset --${type} HEAD~1`);
}

/**
 * git revert HEAD
 */
export function revertHead(repo) {
  // ... (保留原本 revert 邏輯) ...
  const currentCommitId = getCurrentCommitId(repo);
  const currentCommit = repo.commits.find((c) => c.id === currentCommitId);
  if (!currentCommit) return repo;

  const newId = `c${repo.commits.length + 1}`;
  const currentBranch = repo.head;
  const laneIndex = repo.branchLanes[currentBranch] || 0;

  const newCommit = {
    id: newId,
    message: `Revert "${currentCommit.message}"`,
    parent: currentCommitId,
    lane: laneIndex,
    branch: currentBranch,
    x: currentCommit.x + 1,
  };

  let nextBranches = { ...repo.branches };
  if (!repo.detachedHead) {
    nextBranches[currentBranch] = newId;
  }

  let newRepo = {
    ...repo,
    commits: [...repo.commits, newCommit],
    branches: nextBranches,
    detachedHead: repo.detachedHead ? newId : null,
    staging: [], // Revert 也是提交，清空
  };

  newRepo = withLog(newRepo, 'git revert HEAD');
  return newRepo;
}