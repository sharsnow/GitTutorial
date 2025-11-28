import React from 'react';
//  確保引入 RotateCcw
import { X, GitCommit, FileText, ArrowUp, RotateCcw } from 'lucide-react'; 

//  確保這裡有接收 onResetToHere (之前可能漏了)
export default function CommitDetailModal({ commit, onClose, onResetToHere }) {
  if (!commit) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden transform transition-all scale-100">
        
        {/* Header */}
        <div className="bg-slate-800 p-4 flex justify-between items-center border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-full">
              <GitCommit className="text-white" size={20} />
            </div>
            <div>
              <h3 className="text-white font-bold text-lg">Commit {commit.id}</h3>
              <p className="text-slate-400 text-xs">{commit.message}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          
          {/* Metadata */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
              <span className="text-slate-500 text-xs uppercase font-bold block mb-1">Parent</span>
              <div className="flex items-center gap-1 text-blue-400 font-mono text-sm">
                <ArrowUp size={14} />
                {commit.parent || 'None (Root)'}
              </div>
            </div>
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
              <span className="text-slate-500 text-xs uppercase font-bold block mb-1">Branch</span>
              <span className="text-slate-300 font-mono text-sm">{commit.branch || 'Detached'}</span>
            </div>
          </div>

          {/* File Content Snapshot */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-sm font-bold flex items-center gap-2">
                <FileText size={16} /> main.txt 歷史快照
              </span>
              <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-1 rounded">Read Only</span>
            </div>
            <div className="bg-slate-950 rounded-lg border border-slate-800 p-4 overflow-auto max-h-48 custom-scrollbar">
              <pre className="text-slate-300 font-mono text-sm whitespace-pre-wrap leading-relaxed">
                {commit.fileContent || "(無內容)"}
              </pre>
            </div>
          </div>

        </div>
        
        {/* Footer */}
        <div className="bg-slate-800 p-4 border-t border-slate-700 flex gap-3 justify-end">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-slate-300 hover:text-white transition-colors text-sm"
          >
            關閉
          </button>
          
          {/* 救回按鈕 */}
          <button 
            onClick={() => {
              if (window.confirm(`確定要將分支重置回 ${commit.id} 嗎？\n這將會丟棄目前的暫存區變更。`)) {
                // 如果 onResetToHere 沒傳進來，這裡會報錯，所以要檢查
                if (typeof onResetToHere === 'function') {
                   onResetToHere(commit.id);
                   onClose();
                } else {
                   console.error("onResetToHere prop missing!");
                }
              }
            }}
            className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-md font-bold text-sm flex items-center gap-2 shadow-lg transition-all"
          >
            <RotateCcw size={16} />
            Reset {commit.branch ? commit.branch : 'HEAD'} to Here
          </button>
        </div>
      </div>
    </div>
  );
}