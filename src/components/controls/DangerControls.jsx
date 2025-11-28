// Reset / Revert 區（危險區）

import React from "react";

export default function DangerControls({
  onResetSoft,
  onResetHard,
  onRevert,
  isFeatureUnlocked,
  getHighlightStyle,
  getLockedStyle,
}) {
  const canReset = isFeatureUnlocked("reset");
  const canRevert = isFeatureUnlocked("revert");

  const cardClass =
    "bg-slate-900/70 border border-rose-500/40 rounded-xl p-3 flex flex-col gap-3 shadow-sm";
  const highlightClass = getHighlightStyle
    ? getHighlightStyle("danger-zone")
    : "";

  return (
    <div className={`${cardClass} ${highlightClass}`}>
      <div className="flex items-center justify-between gap-2">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-rose-300">
            Danger Zone
          </h3>
          <p className="text-[11px] text-slate-400">
            Reset / Revert（會改寫歷史）
          </p>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-950/80 text-rose-300">
          use with care
        </span>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onResetSoft}
          disabled={!canReset}
          className={
            "flex-1 text-xs font-medium rounded-md px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-100 transition disabled:opacity-40 disabled:cursor-not-allowed " +
            (getLockedStyle ? getLockedStyle("reset") : "")
          }
        >
          reset --soft
        </button>
        <button
          onClick={onResetHard}
          disabled={!canReset}
          className={
            "flex-1 text-xs font-medium rounded-md px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white transition disabled:opacity-40 disabled:cursor-not-allowed " +
            (getLockedStyle ? getLockedStyle("reset") : "")
          }
        >
          reset --hard
        </button>
      </div>

      <button
        onClick={onRevert}
        disabled={!canRevert}
        className={
          "w-full text-xs font-medium rounded-md px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white transition disabled:opacity-40 disabled:cursor-not-allowed " +
          (getLockedStyle ? getLockedStyle("revert") : "")
        }
      >
        git revert HEAD
      </button>
    </div>
  );
}
/**
 * git reset --soft / --hard HEAD~1
 * [FIXED] 修正 staging 結構錯誤 (不再是陣列)
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
  let nextStaging = { ...repo.staging }; // 複製物件結構

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