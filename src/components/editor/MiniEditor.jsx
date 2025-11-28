/**
 * 這個元件設計重點：
 * 視覺風格：模擬簡單的程式碼編輯器（黑底白字）。
 * 防呆機制：內建我們剛才討論的字數/行數限制。
狀態回饋：右上角會顯示「📝 Modified」或「✅ Clean」。
 * 
 */


// src/components/editor/MiniEditor.jsx
import React, { useState, useEffect } from 'react';
import { FileText, AlertCircle, CheckCircle, FileDiff } from 'lucide-react';

const validateInput = (text) => {
  const MAX_LINES = 10;
  const MAX_LENGTH = 300;
  
  if (text.length > MAX_LENGTH) return `字數太多囉 (${text.length}/${MAX_LENGTH})`;
  if (text.split('\n').length > MAX_LINES) return `行數太多囉 (請保持在 ${MAX_LINES} 行內)`;
  return null;
};

const MiniEditor = ({ 
  repo, 
  onUpdate, 
  isVisible = true,   // 控制顯示/隱藏 (教學模式用)
  readOnly = false,    // 控制是否唯讀 (例如衝突解決時可能鎖定)
  onOpenDiff
}) => {
  const [content, setContent] = useState('');
  const [error, setError] = useState(null);

  // 當 Repo 的 staging 改變時，同步更新編輯器內容
  // (例如切換分支時，內容會變)
  useEffect(() => {
    if (repo && repo.staging) {
      setContent(repo.staging.content || '');
    }
  }, [repo.staging, repo.head]); // 監聽 head 變化確保切換分支時更新

  const handleChange = (e) => {
    const newText = e.target.value;
    const validationError = validateInput(newText);
    
    if (validationError) {
      setError(validationError);
    } else {
      setError(null);
      setContent(newText);
      onUpdate(newText);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="flex flex-col w-full bg-slate-800 rounded-lg border border-slate-700 shadow-xl overflow-hidden mt-4 transition-all hover:border-slate-600">
      {/* Header Bar */}
      <div className="flex items-center justify-between px-3 py-2 bg-slate-900 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-slate-300">
            <FileText size={16} className="text-blue-400" />
            <span className="text-sm font-mono font-bold">main.txt</span>
          </div>

        {/*  Diff 按鈕 */}
          <button
            onClick={onOpenDiff}
            title="查看與上個版本的差異 (Git Diff)"
            className="flex items-center gap-1 px-2 py-0.5 rounded hover:bg-slate-700 text-slate-400 hover:text-purple-400 transition-colors text-xs border border-transparent hover:border-slate-600"
          >
            <FileDiff size={14} />
            <span className="hidden sm:inline">Diff</span>
          </button>
        </div>
        
        {/* Status Indicator */}
        <div className="flex items-center gap-2">
          {error ? (
            <span className="text-xs text-red-400 flex items-center gap-1 animate-pulse">
              <AlertCircle size={12} /> {error}
            </span>
          ) : repo.staging.isDirty ? (
            <span className="text-xs text-yellow-400 flex items-center gap-1">
              📝 Modified
            </span>
          ) : (
            <span className="text-xs text-green-400 flex items-center gap-1">
              ✅ Clean
            </span>
          )}
        </div>
      </div>

      {/* Text Area */}
      <div className="relative">
        <textarea
          value={content}
          onChange={handleChange}
          disabled={readOnly}
          className={`w-full h-48 bg-[#1e1e1e] text-gray-300 font-mono text-sm p-3 resize-none focus:outline-none focus:ring-1 focus:ring-blue-500/50 custom-scrollbar 
            ${readOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
          spellCheck="false"
        />
        
        {/* 唯讀遮罩提示 (Optional) */}
        {readOnly && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none">
            <span className="text-white/50 text-sm font-bold bg-black/60 px-3 py-1 rounded">
              唯讀模式 (Read Only)
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default MiniEditor;