// Merge 區塊

import React from "react";

export default function MergeControls({
  branches,
  currentBranch,
  mergeTarget,
  setMergeTarget,
  onMerge,
  isFeatureUnlocked,
  getHighlightStyle,
  getLockedStyle,
}) {
  const canMerge = isFeatureUnlocked("merge");

  const availableTargets = branches.filter((b) => b !== currentBranch);

  const cardClass =
    "bg-slate-900/70 border border-slate-700/70 rounded-xl p-3 flex flex-col gap-3 shadow-sm";
  const highlightClass = getHighlightStyle
    ? getHighlightStyle("merge-zone")
    : "";

    const lockedClass = getLockedStyle ? getLockedStyle("merge") : "";
    const isLocked = !!lockedClass;

    return (
    <div className={`${cardClass} ${highlightClass} ${isLocked ? "opacity-60" : ""}`}>
        <div className="flex items-center justify-between gap-2">
        <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-300">
            Merge
            </h3>
            <p className="text-[11px] text-slate-400">
            將另一個分支合併到目前分支
            </p>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-amber-300">
            git merge
        </span>
        </div>

        <div className="flex items-center gap-2">
        <select
            className={
            "flex-1 bg-slate-900/80 border border-slate-700 rounded-md px-2 py-1 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-violet-500 " +
            (isLocked ? "opacity-40 blur-[1px] pointer-events-none" : "")
            }
            value={mergeTarget || ""}
            onChange={(e) => setMergeTarget(e.target.value)}
            disabled={isLocked || availableTargets.length === 0}
        >
            <option value="" disabled>
            {isLocked ? "尚未解鎖，無法選擇…" : "選擇要合併的分支…"}
            </option>
            {availableTargets.map((b) => (
            <option key={b} value={b}>
                {b}
            </option>
            ))}
        </select>
        </div>

        <button
        onClick={onMerge}
        disabled={isLocked || !canMerge || !mergeTarget}
        className={
            "w-full text-xs font-medium rounded-md px-3 py-1.5 bg-violet-500 hover:bg-violet-400 text-white transition disabled:opacity-40 disabled:cursor-not-allowed " +
            lockedClass
        }
        >
        merge {mergeTarget || ""}
        </button>
    </div>
    );
}
