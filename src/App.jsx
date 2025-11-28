import React, { useState, useEffect, useRef } from 'react';
import { GitCommit, GitBranch, GitMerge, ChevronRight, RefreshCw, Terminal, BookOpen, Play, CheckCircle, Info, ArrowRight, Trophy, RotateCcw, Undo2, History, AlertTriangle, Settings, X, GitPullRequest, Copy, Map as MapIcon, Lock, FileText } from 'lucide-react';

// Components
import ControlsPanel from "./components/controls/ControlsPanel.jsx";
import ConflictResolver from "./components/controls/ConflictResolver.jsx"; // 衝突解決面板
import GitGraph from './components/GitGraph.jsx';
import LogsPanel from "./components/logs/LogsPanel.jsx";
import MiniEditor from './components/editor/MiniEditor'; // 檔案編輯器
import CommitDetailModal from './components/modals/CommitDetailModal';
import DiffModal from './components/modals/DiffModal';

// Data
import { TUTORIAL_STEPS } from './data/tutorialSteps';
import { CHALLENGE_LEVELS } from './data/challengeLevels';

// Core & Actions
import { INITIAL_STATE } from './core/gitInitialState';
import {
  commitChanges,
  createBranchAtHead,
  checkoutBranch,
  mergeBranchIntoCurrent,
  rebaseCurrentOnto,
  cherryPickFromBranch,
  resetHead,
  revertHead,
  updateStagingContent, 
  resolveConflict,
  resetBranchToCommit,
  markDiffViewed
} from './core/gitActions.js';


export default function App() {
  const [repo, setRepo] = useState(INITIAL_STATE);
  const [newBranchName, setNewBranchName] = useState('feature');
  const [mode, setMode] = useState('tutorial'); // tutorial | challenge | playground
  const [stepIndex, setStepIndex] = useState(0);
  const [levelIndex, setLevelIndex] = useState(0);
  const [maxStepReached, setMaxStepReached] = useState(0);
  const [completedSteps, setCompletedSteps] = useState(new Set());

  const [showConfetti, setShowConfetti] = useState(false);
  const [levelComplete, setLevelComplete] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [progressiveMode, setProgressiveMode] = useState(true);

  const [mergeTarget, setMergeTarget] = useState("");
  const [advancedTarget, setAdvancedTarget] = useState("");

  const scrollRef = useRef(null);

  const [showDiffModal, setShowDiffModal] = useState(false);

  const handleResetToCommit = (commitId) => {
    setRepo(prev => resetBranchToCommit(prev, commitId));
  };

  // 拖曳相關
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, left: 0, top: 0 });

  // [設定] 教學模式中，第幾關之後解鎖編輯器 (Index 4 = 第 5 關)
  const EDITOR_UNLOCK_STEP_INDEX = 4; 

  const addLog = (msg) => {
    setRepo(prev => ({ ...prev, logs: [...prev.logs, msg] }));
  };

  const getTutorialGroups = () => {
    const groups = {};
    TUTORIAL_STEPS.forEach((step, idx) => {
      if (!groups[step.chapter]) groups[step.chapter] = [];
      groups[step.chapter].push({ ...step, index: idx });
    });
    return groups;
  };

  // --- Unlock Logic ---
const isFeatureUnlocked = (featureName) => {
    // 1. 非教學模式 -> 全開
    if (mode === 'playground' || mode === 'challenge') return true;

    // 2. 教學模式
    if (mode === 'tutorial') {
      // 循序漸進模式關閉 -> 全開 (這行是關鍵)
      if (!progressiveMode) return true;

      // 循序漸進模式開啟 -> 檢查目前關卡是否解鎖了該功能
      const limit = Math.max(stepIndex, maxStepReached);
      for (let i = 0; i <= limit; i++) {
        const step = TUTORIAL_STEPS[i];
        if (step && step.unlocks && step.unlocks.includes(featureName)) {
          return true;
        }
      }
      return false; // 沒找到就鎖住
    }
    return true;
  };

  const getLockedStyle = (featureName) => {
    if (isFeatureUnlocked(featureName)) return "";
    return `opacity-30 pointer-events-none grayscale blur-[1px] brightness-50 [&_*]:brightness-50 [&_*]:opacity-80`;
  };

  const isFeatureLocked = (featureName) => !isFeatureUnlocked(featureName);

  const getHighlightStyle = (zoneName) => {
    if (mode === 'tutorial') {
      const currentStep = TUTORIAL_STEPS[stepIndex];
      if (currentStep && currentStep.highlight === zoneName) {
        return "ring-2 ring-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.5)] border-yellow-400 transform scale-105 transition-all duration-300";
      }
    }
    return "";
  };

  // --- Git Actions Handlers ---

  const handleCommit = () => setRepo(prev => commitChanges(prev));

  const handleBranch = () => {
    const name = newBranchName.trim();
    if (!name) return addLog('錯誤：分支名稱為空');
    setRepo(prev => createBranchAtHead(prev, name));
  };

  const handleCheckout = (branchName) => setRepo(prev => checkoutBranch(prev, branchName));

  const handleMerge = () => {
    if (!mergeTarget) return addLog('錯誤：請先選擇要合併的分支');
    setRepo(prev => mergeBranchIntoCurrent(prev, mergeTarget));
    setMergeTarget('');
  };

  const handleRebase = () => {
    if (!advancedTarget) return addLog('錯誤：請先選擇要 Rebase 的目標分支');
    setRepo(prev => rebaseCurrentOnto(prev, advancedTarget));
    setAdvancedTarget('');
  };

  const handleCherryPick = () => {
    if (!advancedTarget) return addLog('錯誤：請先選擇要 Cherry-pick 的來源分支');
    setRepo(prev => cherryPickFromBranch(prev, advancedTarget));
    setAdvancedTarget('');
  };

  const handleReset = (type) => setRepo(prev => resetHead(prev, type));
  const handleRevert = () => setRepo(prev => revertHead(prev));

  // 處理編輯器內容更新
  const handleEditorUpdate = (newContent) => {
    setRepo(prev => updateStagingContent(prev, newContent));
  };

  // 處理衝突解決
  const handleResolveConflict = (resolvedContent) => {
    setRepo(prev => resolveConflict(prev, resolvedContent));
  };

  // --- Dragging Logic ---
  const handleMouseDown = (e) => {
    setIsDragging(true);
    dragStart.current = { x: e.pageX, y: e.pageY, left: scrollRef.current.scrollLeft, top: scrollRef.current.scrollTop };
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - dragStart.current.x;
    const y = e.pageY - dragStart.current.y;
    scrollRef.current.scrollLeft = dragStart.current.left - x;
    scrollRef.current.scrollTop = dragStart.current.top - y;
  };

  const handleMouseUp = () => setIsDragging(false);

  // --- System Reset & Mode Switching ---

  const handleResetSystem = () => {
    if (mode === 'challenge') {
      setRepo(JSON.parse(JSON.stringify(CHALLENGE_LEVELS[levelIndex].setup)));
      setLevelComplete(false);
      addLog(`--- 關卡重置 ---`);
    } else {
      setRepo(INITIAL_STATE);
      setStepIndex(0);
      setMaxStepReached(0);
      setCompletedSteps(new Set());
      setShowConfetti(false);
      setMergeTarget("");
      setAdvancedTarget("");
      addLog(`--- 系統重置 (教學進度已清除) ---`);
    }
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    setShowConfetti(false);
    setLevelComplete(false);
    setMergeTarget("");
    setAdvancedTarget("");

    if (newMode === 'tutorial') setProgressiveMode(true);
    else setProgressiveMode(false);

    if (newMode === 'challenge') {
      setLevelIndex(0);
      setRepo(JSON.parse(JSON.stringify(CHALLENGE_LEVELS[0].setup)));
    } else {
      setRepo(INITIAL_STATE);
      if (newMode === 'tutorial') {
        const safeStep = Math.min(maxStepReached, TUTORIAL_STEPS.length - 1);
        if (maxStepReached > 0) setStepIndex(safeStep);
        else setStepIndex(0);
      } else {
        setStepIndex(0);
      }
    }
  };

  const nextLevel = () => {
    if (levelIndex < CHALLENGE_LEVELS.length - 1) {
      const nextIdx = levelIndex + 1;
      setLevelIndex(nextIdx);
      setRepo(JSON.parse(JSON.stringify(CHALLENGE_LEVELS[nextIdx].setup)));
      setLevelComplete(false);
    } else {
      setShowConfetti(true);
    }
  };

  // --- node 可進行點擊 ---
  const [selectedCommit, setSelectedCommit] = useState(null);
  const handleNodeClick = (commitId) => {
    const commit = repo.commits.find(c => c.id === commitId);
    if (commit) {
      setSelectedCommit(commit);
    }
  };

  // --- Effects ---

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
  }, [repo.commits]);

  // 教學步驟檢查
  useEffect(() => {
    if (mode !== 'tutorial') return;
    const currentStep = TUTORIAL_STEPS[stepIndex];
    if (!currentStep || completedSteps.has(stepIndex)) return;

    if (!currentStep.check(repo)) return;

    const newCompleted = new Set(completedSteps);
    newCompleted.add(stepIndex);
    setCompletedSteps(newCompleted);

    const nextStepIdx = stepIndex + 1;
    if (nextStepIdx > maxStepReached) setMaxStepReached(nextStepIdx);

    const isLastStep = stepIndex === TUTORIAL_STEPS.length - 1;
    const allStepsDone = isLastStep && (newCompleted.size === TUTORIAL_STEPS.length);

    if (!isLastStep) {
      setTimeout(() => setStepIndex(prev => prev + 1), 500);
    } else if (allStepsDone) {
      setShowConfetti(true);
      addLog("恭喜！您已完成所有基礎教學！");
    }
  }, [repo, mode, stepIndex, completedSteps]);

  // [Logic] 決定編輯器是否顯示
const showEditor = 
    mode === 'playground' || 
    mode === 'challenge' || 
    (mode === 'tutorial' && !progressiveMode) || // 關閉循序漸進 -> 直接開啟
    (mode === 'tutorial' && progressiveMode && isFeatureUnlocked('editor')); // 開啟循序漸進 -> 檢查關卡解鎖

  return (
    <div className="flex flex-col h-screen bg-slate-900 text-slate-100 font-sans selection:bg-blue-500 selection:text-white">
      {/* Scrollbar CSS */}
      <style>{`
      .custom-scrollbar::-webkit-scrollbar { width: 14px; height: 14px; }
      .custom-scrollbar::-webkit-scrollbar-track { background: #0f172a; border-left: 1px solid #1e293b; border-top: 1px solid #1e293b; }
      .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #334155; border-radius: 7px; border: 3px solid #0f172a; }
      .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: #475569; }
      .custom-scrollbar::-webkit-scrollbar-corner { background: #0f172a; }
    `}</style>

      {/* --- HEADER --- */}
      <header className="bg-slate-800 p-4 border-b border-slate-700 flex justify-between items-center shadow-lg z-40 relative">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-2 rounded-lg">
            <GitBranch size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
              Git 圖解實驗室
            </h1>
            <p className="text-xs text-slate-400">專為新手設計的視覺化學習工具</p>
          </div>
        </div>
        
        <div className="flex gap-2 items-center">
          <button onClick={() => switchMode('tutorial')} className={`px-3 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${mode === 'tutorial' ? 'bg-blue-600 text-white shadow-blue-500/30 shadow-lg' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>
            <BookOpen size={16} /> <span className="hidden sm:inline">教學</span>
          </button>
          <button onClick={() => switchMode('challenge')} className={`px-3 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${mode === 'challenge' ? 'bg-orange-600 text-white shadow-orange-500/30 shadow-lg' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>
            <Trophy size={16} /> <span className="hidden sm:inline">挑戰</span>
          </button>
          <button onClick={() => switchMode('playground')} className={`px-3 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${mode === 'playground' ? 'bg-purple-600 text-white shadow-purple-500/30 shadow-lg' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>
            <Play size={16} /> <span className="hidden sm:inline">自由</span>
          </button>
          
          <div className="h-6 w-px bg-slate-600 mx-1"></div>

          <button onClick={handleResetSystem} className="p-2 bg-slate-700 hover:bg-red-600 rounded-md text-slate-300 hover:text-white transition-colors">
            {mode === 'challenge' ? <RotateCcw size={18} /> : <RefreshCw size={18} />}
          </button>
          <button onClick={() => setShowSettings(!showSettings)} className={`p-2 rounded-md transition-colors ${showSettings ? 'bg-slate-600 text-white' : 'bg-slate-700 text-slate-300 hover:text-white'}`}>
            <Settings size={18} />
          </button>
        </div>
        
        {/* Settings Dropdown */}
        {showSettings && (
          <div className="absolute right-4 top-16 w-64 bg-slate-800 border border-slate-600 rounded-lg shadow-xl p-4 z-50">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-slate-200">設定</h3>
              <button onClick={() => setShowSettings(false)} className="text-slate-400 hover:text-white"><X size={16}/></button>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-slate-300 block">循序漸進模式</span>
                  <span className="text-xs text-slate-500 block">隱藏尚未學習的功能</span>
                </div>
                <button onClick={() => setProgressiveMode(!progressiveMode)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${progressiveMode ? 'bg-blue-600' : 'bg-slate-600'}`}>
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${progressiveMode ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 flex overflow-hidden">
        
        {/* LEFT COLUMN: Graph & Controls */}
        <div className="flex-1 flex flex-col relative min-w-0">

          {/* Top Info Bar (Tutorial / Challenge info) */}
          <div className={`border-b p-4 transition-colors ${mode === 'challenge' ? 'bg-slate-800 border-orange-900/50' : 'bg-slate-800 border-slate-700'}`}>
            <div className="max-w-4xl mx-auto">
              {mode === 'tutorial' && !showConfetti && TUTORIAL_STEPS[stepIndex] && (
                <div className="flex items-start gap-4">
                  <div className="bg-blue-900/50 p-2 rounded-full text-blue-400 mt-1"><MapIcon size={20} /></div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <select
                        value={stepIndex}
                        onChange={(e) => setStepIndex(parseInt(e.target.value))}
                        className="bg-slate-900 border border-slate-600 rounded px-3 py-1 text-sm font-bold text-blue-200 focus:outline-none focus:border-blue-500"
                      >
                        {Object.entries(getTutorialGroups()).map(([chapter, steps]) => (
                          <optgroup label={chapter} key={chapter}>
                            {steps.map(step => (
                              <option key={step.id} value={step.index} disabled={progressiveMode && step.index > maxStepReached}>
                                {step.title} {progressiveMode && step.index > maxStepReached ? '(鎖定)' : (completedSteps.has(step.index) ? '✓' : '')}
                              </option>
                            ))}
                          </optgroup>
                        ))}
                      </select>
                      <span className="text-xs text-slate-500">{stepIndex + 1} / {TUTORIAL_STEPS.length}</span>
                    </div>
                    <p className="text-slate-300 mt-1">{TUTORIAL_STEPS[stepIndex].desc}</p>
                    <p className="text-sm text-yellow-500 mt-2 font-mono flex items-center gap-1"><ArrowRight size={14} /> 提示：{TUTORIAL_STEPS[stepIndex].hint}</p>
                  </div>
                </div>
              )}

              {mode === 'challenge' && !levelComplete && !showConfetti && (
                <div className="flex items-start gap-4">
                  <div className="bg-orange-900/50 p-2 rounded-full text-orange-400 mt-1"><Trophy size={20} /></div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-orange-100 flex items-center gap-2">
                      {CHALLENGE_LEVELS[levelIndex].title} <span className="text-xs font-normal bg-slate-700 px-2 py-0.5 rounded text-slate-300">Level {levelIndex + 1}</span>
                    </h3>
                    <p className="text-slate-300 mt-1">{CHALLENGE_LEVELS[levelIndex].desc}</p>
                    <p className="text-sm text-yellow-500 mt-2 font-mono flex items-center gap-1"><ArrowRight size={14} /> 目標：{CHALLENGE_LEVELS[levelIndex].hint}</p>
                  </div>
                </div>
              )}

              {mode === 'playground' && !showConfetti && (
                <div className="flex items-center gap-4 text-slate-400">
                  <Play size={20} /> <p>自由模式：盡情實驗吧！沒有任何限制。</p>
                </div>
              )}

              {mode === 'challenge' && levelComplete && !showConfetti && (
                <div className="flex items-center justify-between bg-green-900/20 p-2 rounded-lg border border-green-500/30">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="text-green-500" size={24} />
                    <div><h4 className="text-green-100 font-bold">挑戰成功！</h4><p className="text-green-200/70 text-sm">Git 技能熟練度 +1</p></div>
                  </div>
                  <button onClick={nextLevel} className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-md font-bold transition-colors flex items-center gap-2">
                    下一關 <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Confetti Overlay */}
          {showConfetti && (
            <div className="absolute inset-0 z-30 bg-slate-900/95 flex items-center justify-center p-6 animate-in fade-in backdrop-blur-sm">
              <div className="text-center max-w-md w-full bg-slate-800 p-8 rounded-2xl border border-slate-700 shadow-2xl">
                
                {/* 獎盃圖示 */}
                <div className="inline-flex items-center justify-center p-4 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full mb-6 text-white shadow-xl shadow-orange-500/20 animate-bounce">
                  <Trophy size={48} />
                </div>
                
                {/* 標題文字 */}
                <h2 className="text-3xl font-bold text-white mb-2">
                  {mode === 'tutorial' ? '教學模式完成！' : '全數通關！'}
                </h2>
                <p className="text-slate-400 mb-8 text-sm">
                  {mode === 'tutorial' 
                    ? '恭喜你掌握了 Git 的基礎！下一步想做什麼呢？' 
                    : '太厲害了！你已經征服了所有關卡！'}
                </p>

                {/* 按鈕群組 */}
                <div className="flex flex-col gap-3 w-full">
                  
                  {/* 1. 主要行動：前往挑戰 (或是自由模式) */}
                  <button 
                    onClick={() => mode === 'tutorial' ? switchMode('challenge') : switchMode('playground')} 
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-6 py-3.5 rounded-xl font-bold shadow-lg shadow-blue-500/25 transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2"
                  >
                    {mode === 'tutorial' ? <Trophy size={18} /> : <Play size={18} />}
                    {mode === 'tutorial' ? '前往挑戰模式 (Challenge)' : '自由探索 (Playground)'}
                  </button>

                  <div className="flex gap-3">
                    {/* 2. 重頭開始 (Restart) */}
                    <button 
                      onClick={handleResetSystem} 
                      className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-200 hover:text-white px-4 py-3 rounded-xl font-bold transition-colors flex items-center justify-center gap-2 text-sm"
                    >
                      <RotateCcw size={16} />
                      重頭開始
                    </button>

                    {/* 3. 留在這裡 (Stay) */}
                    <button 
                      onClick={() => setShowConfetti(false)} 
                      className="flex-1 bg-slate-800 border border-slate-600 hover:bg-slate-700 text-slate-400 hover:text-white px-4 py-3 rounded-xl font-bold transition-colors text-sm"
                    >
                      留在這裡
                    </button>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* Git Graph Area */}
          <div
            ref={scrollRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            // 確保這裡有 overflow-auto，這樣內容溢出時才能捲動/拖曳
            className={`custom-scrollbar flex-1 bg-slate-900 overflow-auto relative p-8 transition-colors ${isDragging ? 'cursor-grabbing select-none' : 'cursor-grab'}`}
            style={{ 
              backgroundImage: 'radial-gradient(#334155 1px, transparent 1px)', 
              backgroundSize: '20px 20px' 
            }}
          >
            {/* GitGraph 必須被包在这个 div 裡面 */}
            <GitGraph repo={repo} onNodeClick={handleNodeClick} />
          </div>

          {/* Controls Area (Swaps with ConflictResolver) */}
          <div className="bg-slate-800 border-t border-slate-700 p-4 min-h-[180px]">
              <ControlsPanel
                repo={repo}
                newBranchName={newBranchName}
                setNewBranchName={setNewBranchName}
                mergeTarget={mergeTarget}
                setMergeTarget={setMergeTarget}
                advancedTarget={advancedTarget}
                setAdvancedTarget={setAdvancedTarget}
                onCommit={handleCommit}
                onBranch={handleBranch}
                onCheckout={handleCheckout}
                onMerge={handleMerge}
                onRebase={handleRebase}
                onCherryPick={handleCherryPick}
                onResetSoft={() => handleReset("soft")}
                onResetHard={() => handleReset("hard")}
                onRevert={handleRevert}
                isFeatureUnlocked={isFeatureUnlocked}
                getHighlightStyle={getHighlightStyle}
                getLockedStyle={getLockedStyle}
              />
          </div>
        </div>

        {/* RIGHT COLUMN: Logs & Editor */}
        <div className="w-80 bg-slate-900 border-l border-slate-700 flex flex-col shadow-xl z-20">
          
          {/* Editor Area (Top of Sidebar) */}
          <div className="flex-none p-4 bg-slate-800/50 border-b border-slate-700">
             <MiniEditor 
               repo={repo}
               onUpdate={handleEditorUpdate}
               isVisible={showEditor}
               readOnly={repo.status === 'CONFLICT'} // 衝突時鎖定編輯器
               onOpenDiff={() => {
                 setRepo(prev => markDiffViewed(prev)); // 紀錄操作
                 setShowDiffModal(true);                // 開啟視窗
               }}
             />
             {/* 佔位符：如果編輯器隱藏，顯示一個空區域或提示 */}
             {!showEditor && (
               <div className="h-48 flex items-center justify-center border-2 border-dashed border-slate-700 rounded-lg text-slate-500 text-sm">
                 <p>編輯器尚未解鎖</p>
               </div>
             )}
          </div>

          {/* Logs Area (Bottom of Sidebar, flex-grow) */}
          <div className="flex-1 overflow-hidden flex flex-col">
            <LogsPanel
              repo={repo}
              mode={mode}
              progressiveMode={progressiveMode}
            />
          </div>
        </div>

      </main>
      {selectedCommit && (
        <CommitDetailModal 
          commit={selectedCommit} 
          onClose={() => setSelectedCommit(null)} 
          onResetToHere={handleResetToCommit} 
        />
      )}
      { repo.status === 'CONFLICT' &&(
        // 衝突發生時，顯示解決器
        <ConflictResolver 
          repo={repo} 
          onResolve={handleResolveConflict} 
        />
      )}
      {showDiffModal && (
        <DiffModal 
          repo={repo} 
          onClose={() => setShowDiffModal(false)} 
        />
      )}
    </div>
  );
}