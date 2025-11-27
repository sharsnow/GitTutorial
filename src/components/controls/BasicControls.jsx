// Commit + Branch + Checkout（基礎區）

import React from "react";

export default function BasicControls({
  branches,
  currentBranch,
  newBranchName,
  setNewBranchName,
  onCommit,
  onBranch,
  onCheckout,
  isFeatureUnlocked,
  getHighlightStyle,
  getLockedStyle,
}) {
  const canCommit = isFeatureUnlocked("commit");
  const canBranch = isFeatureUnlocked("branch");
  const canCheckout = isFeatureUnlocked("checkout");

  const cardClass =
    "bg-slate-900/70 border border-slate-700/70 rounded-xl p-3 flex flex-col gap-3 shadow-sm";
  const highlightClass = getHighlightStyle
    ? getHighlightStyle("basic-zone")
    : "";

  return (
    <div className={`${cardClass} ${highlightClass}`}>
      <div className="flex items-center justify-between gap-2">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-300">
            Basic Git
          </h3>
          <p className="text-[11px] text-slate-400">
            Commit / 新分支 / 切換分支
          </p>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
          {currentBranch || "HEAD"}
        </span>
      </div>

      {/* Commit */}
      <button
        onClick={onCommit}
        disabled={!canCommit}
        className={
          "w-full text-xs font-medium rounded-md px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-white transition disabled:opacity-40 disabled:cursor-not-allowed " +
          (getLockedStyle ? getLockedStyle("commit") : "")
        }
      >
        git commit
      </button>

      {/* Branch name + create */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={newBranchName}
          onChange={(e) => setNewBranchName(e.target.value)}
          placeholder="new-branch-name"
          className="flex-1 bg-slate-900/80 border border-slate-700 rounded-md px-2 py-1 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        />
        <button
          onClick={onBranch}
          disabled={!canBranch}
          className={
            "text-xs font-medium rounded-md px-2.5 py-1 bg-sky-500 hover:bg-sky-400 text-white transition disabled:opacity-40 disabled:cursor-not-allowed " +
            (getLockedStyle ? getLockedStyle("branch") : "")
          }
        >
          branch
        </button>
      </div>

      {/* Checkout */}
      <div className="flex items-center gap-2">
        <select
          className="flex-1 bg-slate-900/80 border border-slate-700 rounded-md px-2 py-1 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-500"
          value={currentBranch}
          onChange={(e) => onCheckout(e.target.value)}
          disabled={!canCheckout || branches.length === 0}
        >
          {branches.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
        <span className="text-[10px] text-slate-400 whitespace-nowrap">
          git checkout
        </span>
      </div>
    </div>
  );
}
