//  統一接收 App 的 props，分給子元件

import React from "react";
import BasicControls from "./BasicControls.jsx";
import MergeControls from "./MergeControls.jsx";
import AdvancedControls from "./AdvancedControls.jsx";
import DangerControls from "./DangerControls.jsx";

export default function ControlsPanel({
  repo,
  newBranchName,
  setNewBranchName,
  mergeTarget,
  setMergeTarget,
  advancedTarget,
  setAdvancedTarget,
  onCommit,
  onBranch,
  onCheckout,
  onMerge,
  onRebase,
  onCherryPick,
  onResetSoft,
  onResetHard,
  onRevert,
  isFeatureUnlocked,
  getHighlightStyle,
  getLockedStyle,
}) {
  const branches = Object.keys(repo.branches || {});
  const currentBranch = repo.head;

  return (
    <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
      <BasicControls
        branches={branches}
        currentBranch={currentBranch}
        newBranchName={newBranchName}
        setNewBranchName={setNewBranchName}
        onCommit={onCommit}
        onBranch={onBranch}
        onCheckout={onCheckout}
        isFeatureUnlocked={isFeatureUnlocked}
        getHighlightStyle={getHighlightStyle}
        getLockedStyle={getLockedStyle}
      />

      <MergeControls
        branches={branches}
        currentBranch={currentBranch}
        mergeTarget={mergeTarget}
        setMergeTarget={setMergeTarget}
        onMerge={onMerge}
        isFeatureUnlocked={isFeatureUnlocked}
        getHighlightStyle={getHighlightStyle}
        getLockedStyle={getLockedStyle}
      />

      <AdvancedControls
        branches={branches}
        currentBranch={currentBranch}
        advancedTarget={advancedTarget}
        setAdvancedTarget={setAdvancedTarget}
        onRebase={onRebase}
        onCherryPick={onCherryPick}
        isFeatureUnlocked={isFeatureUnlocked}
        getHighlightStyle={getHighlightStyle}
        getLockedStyle={getLockedStyle}
      />

      <DangerControls
        onResetSoft={onResetSoft}
        onResetHard={onResetHard}
        onRevert={onRevert}
        isFeatureUnlocked={isFeatureUnlocked}
        getHighlightStyle={getHighlightStyle}
        getLockedStyle={getLockedStyle}
      />
    </div>
  );
}