/**
 * 讓使用者在按下 Commit 之前，清楚地看到：「我現在的暫存區 (Staging) 跟上一個版本 (HEAD) 到底差在哪裡？」
 */
import React from 'react';
import { X, GitCommit, FileText, ArrowRight, FileDiff } from 'lucide-react';

export default function DiffModal({ repo, onClose }) {
  // 1. 取得 HEAD 的內容 (舊版本)
  const headCommitId = repo.branches[repo.head] || repo.detachedHead;
  const headCommit = repo.commits.find(c => c.id === headCommitId);
  const headContent = headCommit ? (headCommit.fileContent || '') : '(Initial / Empty)';

  // 2. 取得 Staging 的內容 (新版本)
  const stagingContent = repo.staging.content;
  const isDirty = repo.staging.isDirty;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-5xl h-[80vh] flex flex-col mx-4 overflow-hidden">
        
        {/* Header */}
        <div className="bg-slate-800 p-4 flex justify-between items-center border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="bg-purple-600 p-2 rounded-full">
              <FileDiff className="text-white" size={20} />
            </div>
            <div>
              <h3 className="text-white font-bold text-lg">檢視差異 (Git Diff)</h3>
              <p className="text-slate-400 text-xs flex items-center gap-2">
                Comparing: <span className="text-purple-300 font-mono">HEAD ({repo.head})</span> 
                <ArrowRight size={12}/> 
                <span className="text-yellow-300 font-mono">Working Directory</span>
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Body: 左右比對 */}
        <div className="flex-1 flex gap-0 min-h-0 bg-slate-950">
          
          {/* 👈 左側：HEAD (Old) */}
          <div className="flex-1 flex flex-col border-r border-slate-800">
            <div className="px-4 py-2 bg-slate-900/50 border-b border-slate-800 flex justify-between items-center">
              <span className="text-xs font-bold text-purple-400 flex items-center gap-2">
                <GitCommit size={14} /> HEAD (Last Commit)
              </span>
            </div>
            <div className="flex-1 p-4 overflow-auto custom-scrollbar">
              <pre className="text-slate-400 font-mono text-sm whitespace-pre-wrap leading-relaxed select-none opacity-80">
                {headContent}
              </pre>
            </div>
          </div>

          {/* 👉 右側：Staging (New) */}
          <div className="flex-1 flex flex-col">
            <div className="px-4 py-2 bg-slate-900/50 border-b border-slate-800 flex justify-between items-center">
              <span className="text-xs font-bold text-yellow-400 flex items-center gap-2">
                <FileText size={14} /> Working Directory (Current)
              </span>
              {isDirty ? (
                <span className="text-[10px] bg-yellow-900/50 text-yellow-200 px-2 py-0.5 rounded border border-yellow-700/50">Modified</span>
              ) : (
                <span className="text-[10px] bg-green-900/50 text-green-200 px-2 py-0.5 rounded border border-green-700/50">Clean</span>
              )}
            </div>
            <div className="flex-1 p-4 overflow-auto custom-scrollbar bg-yellow-900/5">
              <pre className="text-yellow-100 font-mono text-sm whitespace-pre-wrap leading-relaxed">
                {stagingContent}
              </pre>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-800 p-4 border-t border-slate-700 flex justify-end">
          <button 
            onClick={onClose}
            className="bg-slate-700 hover:bg-slate-600 text-white px-6 py-2 rounded-md font-medium transition-colors"
          >
            關閉
          </button>
        </div>
      </div>
    </div>
  );
}