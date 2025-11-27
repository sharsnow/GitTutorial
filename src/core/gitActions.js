// src/core/gitActions.js

// 取得目前 HEAD 指向的 commit id
export function getCurrentCommitId(repo) {
  if (repo.detachedHead) return repo.detachedHead;
  return repo.branches[repo.head];
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

  const newCommit = {
    id: newId,
    message: `Commit ${newId}`,
    parent: parentId,
    lane: laneIndex,
    branch: currentBranch,
    x: newX,
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
    // [修改點 1] Commit 後，暫存區(staging) 應該被清空 (變成永久儲存了)
    staging: [], 
  };

  newRepo = withLog(newRepo, `git commit -m "${newCommit.message}"`);
  return newRepo;
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
  if (!targetBranch) return repo;
  if (!repo.branches[targetBranch]) {
    return withLog(repo, `錯誤：找不到分支 ${targetBranch}`);
  }
  if (targetBranch === repo.head) {
    return withLog(repo, '錯誤：不能把分支自己 merge 自己');
  }

  const currentCommitId = getCurrentCommitId(repo);
  const targetCommitId = repo.branches[targetBranch];
  const currentBranch = repo.head;

  const newId = `c${repo.commits.length + 1}`;
  const parentNode = repo.commits.find((c) => c.id === currentCommitId);
  const laneIndex = repo.branchLanes[currentBranch];

  const newCommit = {
    id: newId,
    message: `Merge ${targetBranch}`,
    parent: currentCommitId,
    parent2: targetCommitId,
    lane: laneIndex,
    branch: currentBranch,
    x: parentNode ? parentNode.x + 1 : 0,
  };

  let newRepo = {
    ...repo,
    commits: [...repo.commits, newCommit],
    branches: { ...repo.branches, [currentBranch]: newId },
    staging: [], // Merge 產生新的 commit，也會清空暫存
  };

  newRepo = withLog(newRepo, `git merge ${targetBranch}`);
  return newRepo;
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
  const currentCommitId = getCurrentCommitId(repo);
  const currentCommit = repo.commits.find((c) => c.id === currentCommitId);
  if (!currentCommit || !currentCommit.parent) {
    return withLog(repo, '錯誤：無法 Reset，因為沒有父節點 (Root commit)');
  }

  const parentId = currentCommit.parent;

  let nextBranches = { ...repo.branches };
  if (!repo.detachedHead) {
    nextBranches[repo.head] = parentId;
  }

  // [修改點 2] 處理 Staging Area
  // 如果 repo.staging 不存在，先給它空陣列
  let nextStaging = repo.staging ? [...repo.staging] : [];

  if (type === 'soft') {
    // Soft: 檔案內容保留 (變成 Staged)
    // 我們模擬把被移除的 commit 內容變成一個檔案項目
    nextStaging.push(`📄 ${currentCommit.message} 的變更內容`); 
  } else if (type === 'hard') {
    // Hard: 檔案內容直接丟棄 (Staging 清空)
    nextStaging = []; 
  }

  let newRepo = {
    ...repo,
    branches: nextBranches,
    detachedHead: repo.detachedHead ? parentId : null,
    staging: nextStaging, // 更新暫存區狀態
  };

  newRepo = withLog(newRepo, `git reset --${type} HEAD~1`);
  return newRepo;
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