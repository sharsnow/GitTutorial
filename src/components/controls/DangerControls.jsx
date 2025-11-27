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
