// Rebase + Cherry-pick

import React from "react";

export default function AdvancedControls({
  branches,
  currentBranch,
  advancedTarget,
  setAdvancedTarget,
  onRebase,
  onCherryPick,
  isFeatureUnlocked,
  getHighlightStyle,
  getLockedStyle,
}) {
  const canRebase = isFeatureUnlocked("rebase");
  const canCherryPick = isFeatureUnlocked("cherry-pick");

  const availableTargets = branches.filter((b) => b !== currentBranch);

  const cardClass =
    "bg-slate-900/70 border border-slate-700/70 rounded-xl p-3 flex flex-col gap-3 shadow-sm";
  const highlightClass = getHighlightStyle
    ? getHighlightStyle("advanced-zone")
    : "";
    const advancedLockedClass = getLockedStyle ? getLockedStyle("advanced") : "";
    const isAdvancedLocked = !!advancedLockedClass;

    return (
    <div
        className={
        `${cardClass} ${highlightClass} ` +
        (isAdvancedLocked ? "opacity-60" : "")
        }
    >
        <div className="flex items-center justify-between gap-2">
        <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-300">
            Advanced
            </h3>
            <p className="text-[11px] text-slate-400">
            Rebase / Cherry-pick
            </p>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-cyan-300">
            history tools
        </span>
        </div>

        <div className="flex items-center gap-2">
        <select
            className={
            "flex-1 bg-slate-900/80 border border-slate-700 rounded-md px-2 py-1 text-xs text-slate-100 " +
            "focus:outline-none focus:ring-1 focus:ring-cyan-500 " +
            (isAdvancedLocked ? "opacity-40 blur-[1px] pointer-events-none" : "")
            }
            value={advancedTarget || ""}
            onChange={(e) => setAdvancedTarget(e.target.value)}
            disabled={isAdvancedLocked || availableTargets.length === 0}
        >
            <option value="" disabled>
            {isAdvancedLocked ? "尚未解鎖，無法選擇…" : "選擇目標分支…"}
            </option>
            {availableTargets.map((b) => (
            <option key={b} value={b}>
                {b}
            </option>
            ))}
        </select>
        </div>

        <div className="flex items-center gap-2">
        <button
            onClick={onRebase}
            disabled={isAdvancedLocked || !canRebase || !advancedTarget}
            className={
            "flex-1 text-xs font-medium rounded-md px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-white transition " +
            "disabled:opacity-40 disabled:cursor-not-allowed"
            }
        >
            rebase {advancedTarget || ""}
        </button>

        <button
            onClick={onCherryPick}
            disabled={isAdvancedLocked || !canCherryPick || !advancedTarget}
            className={
            "flex-1 text-xs font-medium rounded-md px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-white transition " +
            "disabled:opacity-40 disabled:cursor-not-allowed"
            }
        >
            cherry-pick
        </button>
        </div>
    </div>
    );
}
