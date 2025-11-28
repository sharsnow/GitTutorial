/**
 * 衝突解決面板
 * 功能是讓使用者直觀地比較「目前分支」與「目標分支」的差異，並決定最終的內容。
 */
import React, { useState, useEffect } from 'react';
import { Check, AlertTriangle, FileText, Split } from 'lucide-react';

export default function ConflictResolver({ repo, onResolve }) {
  const { conflictData } = repo;
  
  const [selection, setSelection] = useState(null);
  const [finalContent, setFinalContent] = useState('');

  useEffect(() => {
    if (conflictData) {
      setSelection(null);
      setFinalContent(
        `<<<<<<< HEAD (${repo.head})\n${conflictData.currentContent}\n=======\n${conflictData.incomingContent}\n>>>>>>> ${conflictData.targetBranch}`
      );
    }
  }, [conflictData, repo.head]);

  if (!conflictData) return null;

  const handleSelect = (type) => {
    setSelection(type);
    if (type === 'current') {
      setFinalContent(conflictData.currentContent);
    } else if (type === 'incoming') {
      setFinalContent(conflictData.incomingContent);
    } else if (type === 'both') {
      setFinalContent(`${conflictData.currentContent}\n${conflictData.incomingContent}`);
    }
  };

  const handleContentChange = (e) => {
    setFinalContent(e.target.value);
    setSelection('manual');
  };

  return (
    // ✨ [修改 1] 外層改成全螢幕遮罩 (Modal Wrapper)
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
      
      {/* ✨ [修改 2] 視窗本體：加大寬高 (max-w-5xl, h-[85vh]) */}
      <div className="bg-slate-900 w-full max-w-5xl h-[90vh] flex flex-col rounded-xl border border-red-500/50 shadow-2xl overflow-hidden relative">
        
        {/* 🔴 頂部標題 */}
        <div className="flex items-center justify-between p-4 border-b border-red-500/30 bg-red-950/10">
          <div className="flex items-center gap-3 text-red-400">
            <div className="bg-red-900/50 p-2 rounded-lg animate-pulse">
              <AlertTriangle size={24} />
            </div>
            <div>
              <h2 className="font-bold text-xl text-red-100">合併衝突 (Merge Conflict)</h2>
              <p className="text-sm text-red-300/70">Git 無法自動合併，請比對並決定最終內容。</p>
            </div>
          </div>
          <div className="px-3 py-1 bg-red-900/30 rounded text-xs text-red-300 border border-red-500/30 font-mono">
             Merging: {repo.head} ⇦ {conflictData.targetBranch}
          </div>
        </div>

        {/* 內容區容器 */}
        <div className="flex-1 flex flex-col p-6 min-h-0 gap-4">

          {/* 🆚 上半部：比對區 (Current vs Incoming) */}
          <div className="flex gap-4 flex-1 min-h-0">
            {/* Current */}
            <div className={`flex-1 flex flex-col bg-slate-950 rounded-lg border-2 overflow-hidden transition-all ${selection === 'current' ? 'border-green-500 ring-1 ring-green-500/50' : 'border-slate-700'}`}>
              <div className="px-3 py-2 border-b border-slate-700 bg-slate-800 flex justify-between items-center">
                <span className="text-sm font-bold text-green-400 flex items-center gap-2">
                  <FileText size={14}/> {repo.head} (你的版本)
                </span>
                <button 
                  onClick={() => handleSelect('current')}
                  className={`text-xs px-3 py-1 rounded border transition-colors ${selection === 'current' ? 'bg-green-600 text-white border-green-500' : 'border-slate-600 text-slate-400 hover:bg-slate-700'}`}
                >
                  保留此變更
                </button>
              </div>
              <div className="p-4 text-sm font-mono text-slate-300 whitespace-pre-wrap overflow-auto custom-scrollbar flex-1">
                {conflictData.currentContent}
              </div>
            </div>

            {/* Icon */}
            <div className="flex items-center justify-center text-slate-600">
              <Split size={24} />
            </div>

            {/* Incoming */}
            <div className={`flex-1 flex flex-col bg-slate-950 rounded-lg border-2 overflow-hidden transition-all ${selection === 'incoming' ? 'border-blue-500 ring-1 ring-blue-500/50' : 'border-slate-700'}`}>
              <div className="px-3 py-2 border-b border-slate-700 bg-slate-800 flex justify-between items-center">
                <span className="text-sm font-bold text-blue-400 flex items-center gap-2">
                  <FileText size={14}/> {conflictData.targetBranch} (傳入版本)
                </span>
                <button 
                  onClick={() => handleSelect('incoming')}
                  className={`text-xs px-3 py-1 rounded border transition-colors ${selection === 'incoming' ? 'bg-blue-600 text-white border-blue-500' : 'border-slate-600 text-slate-400 hover:bg-slate-700'}`}
                >
                  保留此變更
                </button>
              </div>
              <div className="p-4 text-sm font-mono text-slate-300 whitespace-pre-wrap overflow-auto custom-scrollbar flex-1">
                {conflictData.incomingContent}
              </div>
            </div>
          </div>

          {/* 👇 下半部：結果編輯區 (Result) */}
          <div className="flex-1 flex flex-col min-h-0 border-t border-slate-700/50 pt-4">
            <div className="flex justify-between items-end mb-2">
              <label className="text-sm font-bold text-yellow-500 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></span>
                最終合併結果 (Result Preview)
                {selection === 'manual' && <span className="text-xs text-slate-500 font-normal ml-2">(已手動編輯)</span>}
              </label>
              <button 
                onClick={() => handleSelect('both')} 
                className="text-xs text-slate-400 hover:text-white underline decoration-slate-600 underline-offset-4"
              >
                同時保留兩者 (Keep Both)
              </button>
            </div>
            
            <div className="relative flex-1 rounded-lg overflow-hidden border border-slate-600 shadow-inner bg-[#1e1e1e]">
              <textarea
                value={finalContent}
                onChange={handleContentChange}
                className="w-full h-full bg-transparent text-gray-300 font-mono text-sm p-4 resize-none focus:outline-none focus:ring-1 focus:ring-yellow-500/50 custom-scrollbar leading-relaxed"
                spellCheck="false"
                placeholder="請在此編輯最終合併的內容..."
              />
            </div>
          </div>

        </div>

        {/* 底部按鈕區 */}
        <div className="p-4 border-t border-slate-800 bg-slate-900 flex justify-end">
           <button
            onClick={() => onResolve(finalContent)}
            className="w-full md:w-auto bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold py-3 px-8 rounded-lg shadow-lg flex items-center justify-center gap-2 transition-all transform active:scale-[0.99]"
          >
            <Check size={20} />
            解決衝突並提交 (Resolve & Commit)
          </button>
        </div>
      </div>
    </div>
  );
}