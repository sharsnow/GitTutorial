import React, { useState, useEffect, useRef } from 'react';
import { GitCommit, GitBranch, GitMerge, ChevronRight, RefreshCw, Terminal, BookOpen, Play, CheckCircle, Info, ArrowRight, Trophy, RotateCcw, Undo2, History, AlertTriangle, Settings, X, GitPullRequest, Copy, Map as MapIcon, Lock } from 'lucide-react';
import { FileText } from 'lucide-react'; // 記得加 FileText

import ControlsPanel from "./components/controls/ControlsPanel.jsx";
import GitGraph from './components/GitGraph.jsx';
import LogsPanel from "./components/logs/LogsPanel.jsx";

import { TUTORIAL_STEPS } from './data/tutorialSteps';
import { CHALLENGE_LEVELS } from './data/challengeLevels';

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
} from './core/gitActions.js';


export default function App() {
  const [repo, setRepo] = useState(INITIAL_STATE);
  const [newBranchName, setNewBranchName] = useState('feature');
  const [mode, setMode] = useState('tutorial');
  const [stepIndex, setStepIndex] = useState(0);
  const [levelIndex, setLevelIndex] = useState(0);
  const [maxStepReached, setMaxStepReached] = useState(0);
  // 新增：記錄所有已完成的關卡索引
  const [completedSteps, setCompletedSteps] = useState(new Set());

  const [showConfetti, setShowConfetti] = useState(false);
  const [levelComplete, setLevelComplete] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [progressiveMode, setProgressiveMode] = useState(true);

  const [mergeTarget, setMergeTarget] = useState("");
  const [advancedTarget, setAdvancedTarget] = useState("");

  const scrollRef = useRef(null);

  // [新增] 拖曳功能相關變數
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, left: 0, top: 0 });


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


  const isFeatureUnlocked = (featureName) => {
    // 1. 自由模式 (Playground) 與 挑戰模式 (Challenge)：
    // 強制全部解鎖，忽略 Progressive Mode 設定
    if (mode === 'playground' || mode === 'challenge') return true;

    // 2. 教學模式 (Tutorial)：
    if (mode === 'tutorial') {
      // 如果使用者手動關閉「循序漸進模式」，則全部解鎖
      if (!progressiveMode) return true;

      // --- 核心修正邏輯 ---
      // 不只檢查「當前步驟 (stepIndex)」，而是檢查「目前為止到達的最遠步驟 (maxStepReached)」
      // 只要在已解鎖的進度範圍內，該功能就應該保持開啟，不會因為退回上一步而變灰。

      const limit = Math.max(stepIndex, maxStepReached);

      for (let i = 0; i <= limit; i++) {
        const step = TUTORIAL_STEPS[i];
        // 如果該步驟存在，且有定義 unlocks 清單，並包含此功能
        if (step && step.unlocks && step.unlocks.includes(featureName)) {
          return true; // 曾經解鎖過，就回傳 True
        }
      }

      // 如果找遍了所有已完成的步驟都沒解鎖過，才回傳 False
      return false;
    }

    return true;
  };

  const getLockedStyle = (featureName) => {
    if (isFeatureUnlocked(featureName)) return "";

    return `
      opacity-30 
      pointer-events-none 
      grayscale 
      blur-[1px] 
      brightness-50 
      [&_*]:brightness-50 
      [&_*]:opacity-80
    `;
  };

  // 🔹 新增這個，方便判斷是否鎖住
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

  // --- Git Actions ---

  const handleCommit = () => {
    setRepo(prev => commitChanges(prev));
  };

  const handleBranch = () => {
    const name = newBranchName.trim();
    if (!name) {
      addLog('錯誤：分支名稱為空');
      return;
    }
    setRepo(prev => createBranchAtHead(prev, name));
  };

  const handleCheckout = (branchName) => {
    setRepo(prev => checkoutBranch(prev, branchName));
  };

  const handleMerge = () => {
    const targetBranch = mergeTarget;
    if (!targetBranch) {
      addLog('錯誤：請先選擇要合併的分支 (Select target)');
      return;
    }
    setRepo(prev => mergeBranchIntoCurrent(prev, targetBranch));
    setMergeTarget('');
  };

  const handleRebase = () => {
    const targetBranch = advancedTarget;
    if (!targetBranch) {
      addLog('錯誤：請先選擇要 Rebase 的目標分支 (Select target)');
      return;
    }
    setRepo(prev => rebaseCurrentOnto(prev, targetBranch));
    setAdvancedTarget('');
  };

  const handleCherryPick = () => {
    const targetBranch = advancedTarget;
    if (!targetBranch) {
      addLog('錯誤：請先選擇要 Cherry-pick 的來源分支 (Select target)');
      return;
    }
    setRepo(prev => cherryPickFromBranch(prev, targetBranch));
    setAdvancedTarget('');
  };

  const handleReset = (type) => {
    setRepo(prev => resetHead(prev, type));
  };

  // [新增] 滑鼠按下：開始拖曳
  const handleMouseDown = (e) => {
    setIsDragging(true);
    // 記錄按下的瞬間，滑鼠的位置以及目前的捲動位置
    dragStart.current = {
      x: e.pageX,
      y: e.pageY,
      left: scrollRef.current.scrollLeft,
      top: scrollRef.current.scrollTop
    };
  };

  // [新增] 滑鼠移動：計算位移並捲動
  const handleMouseMove = (e) => {
    if (!isDragging) return;
    e.preventDefault(); // 防止拖曳時選取到文字

    // 計算移動距離
    const x = e.pageX - dragStart.current.x;
    const y = e.pageY - dragStart.current.y;

    // 更新捲軸位置 (原本位置 - 移動距離 = 反向拖曳效果)
    scrollRef.current.scrollLeft = dragStart.current.left - x;
    scrollRef.current.scrollTop = dragStart.current.top - y;
  };

  // [新增] 滑鼠放開或離開：停止拖曳
  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleRevert = () => {
    setRepo(prev => revertHead(prev));
  };

  const handleResetSystem = () => {
    if (mode === 'challenge') {
      setRepo(JSON.parse(JSON.stringify(CHALLENGE_LEVELS[levelIndex].setup)));
      setLevelComplete(false);
      addLog(`--- 關卡重置 ---`);
    } else {
      setRepo(INITIAL_STATE);
      setStepIndex(0);
      setMaxStepReached(0);
      setCompletedSteps(new Set()); // 清除所有完成紀錄
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
        if (maxStepReached > 0) {
          setStepIndex(safeStep);
        } else {
          setStepIndex(0);
        }
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

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
    }
  }, [repo.commits]);

  // --- 關鍵邏輯：檢查步驟完成 ---
  useEffect(() => {
    if (mode !== 'tutorial') return;

    const currentStep = TUTORIAL_STEPS[stepIndex];
    if (!currentStep) return;

    // 🚫 如果這個步驟已經標記完成，就不要再進來處理，避免無限 setState
    if (completedSteps.has(stepIndex)) return;

    // 🚫 如果條件還沒達成，也不用做任何事
    if (!currentStep.check(repo)) {
      return;
    }

    // ✅ 下面這段只會在「第一次達成這一步」時執行一次
    const newCompleted = new Set(completedSteps);
    newCompleted.add(stepIndex);
    setCompletedSteps(newCompleted);

    const nextStepIdx = stepIndex + 1;
    if (nextStepIdx > maxStepReached) {
      setMaxStepReached(nextStepIdx);
    }

    const currentTutorialStep = TUTORIAL_STEPS[stepIndex];
    const currentChallengeLevel = CHALLENGE_LEVELS[levelIndex];

    const totalSteps = TUTORIAL_STEPS.length;
    const totalLevels = CHALLENGE_LEVELS.length;

    // 安全一點，避免還沒載到資料爆掉
    const currentStepTitle = currentTutorialStep?.title ?? "";
    const currentStepDescription = currentTutorialStep?.description ?? "";
    const currentStepHint = currentTutorialStep?.hint ?? "";

    const currentLevelTitle = currentChallengeLevel?.title ?? "";
    const currentLevelDescription = currentChallengeLevel?.description ?? "";

    const isLastStep = stepIndex === TUTORIAL_STEPS.length - 1;
    const allStepsDone = isLastStep && (newCompleted.size === TUTORIAL_STEPS.length);

    if (!isLastStep) {
      // 使用 setStepIndex 的函数形式，避免依赖 stepIndex
      setTimeout(() => setStepIndex(prev => prev + 1), 500);
    } else if (allStepsDone) {
      setShowConfetti(true);
      addLog("恭喜！您已完成所有基礎教學！");
    } else {
      addLog(
        `恭喜完成 4-2！但您還有未完成的關卡 (${newCompleted.size}/${TUTORIAL_STEPS.length})`
      );
    }
  }, [repo, mode, stepIndex, completedSteps]);

  return (
    <div className="flex flex-col h-screen bg-slate-900 text-slate-100 font-sans selection:bg-blue-500 selection:text-white">
      {/* [新增] 這裡加入全域樣式來美化 Scrollbar */}
      <style>{`
      /* 定義捲軸寬度與高度 */
      .custom-scrollbar::-webkit-scrollbar {
        width: 14px;
        height: 14px;
      }
      /* 捲軸軌道 (背景) */
      .custom-scrollbar::-webkit-scrollbar-track {
        background: #0f172a; /* slate-900 */
        border-left: 1px solid #1e293b; /* slate-800 */
        border-top: 1px solid #1e293b;
      }
      /* 捲軸本體 (拉桿) */
      .custom-scrollbar::-webkit-scrollbar-thumb {
        background-color: #334155; /* slate-700 */
        border-radius: 7px;
        border: 3px solid #0f172a; /* 做出邊距效果 */
      }
      /* 滑鼠移過去時變亮 */
      .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background-color: #475569; /* slate-600 */
      }
      /* 角落 */
      .custom-scrollbar::-webkit-scrollbar-corner {
        background: #0f172a;
      }
    `}</style>

      <header className="bg-slate-800 p-4 border-b border-slate-700 flex justify-between items-center shadow-lg z-10 relative">
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
          <button 
            onClick={() => switchMode('tutorial')}
            className={`px-3 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${mode === 'tutorial' ? 'bg-blue-600 text-white shadow-blue-500/30 shadow-lg' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
          >
            <BookOpen size={16} /> <span className="hidden sm:inline">教學</span>
          </button>
          <button 
            onClick={() => switchMode('challenge')}
            className={`px-3 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${mode === 'challenge' ? 'bg-orange-600 text-white shadow-orange-500/30 shadow-lg' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
          >
            <Trophy size={16} /> <span className="hidden sm:inline">挑戰</span>
          </button>
          <button 
            onClick={() => switchMode('playground')}
            className={`px-3 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${mode === 'playground' ? 'bg-purple-600 text-white shadow-purple-500/30 shadow-lg' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
          >
            <Play size={16} /> <span className="hidden sm:inline">自由</span>
          </button>
          <button onClick={handleResetSystem} className="p-2 bg-slate-700 hover:bg-red-600 rounded-md text-slate-300 hover:text-white transition-colors" title={mode === 'challenge' ? "重置本關" : "全部重置"}>
            {mode === 'challenge' ? <RotateCcw size={18} /> : <RefreshCw size={18} />}
          </button>

          <div className="relative">
            <button 
              onClick={() => setShowSettings(!showSettings)} 
              className={`p-2 rounded-md transition-colors ${showSettings ? 'bg-slate-600 text-white' : 'bg-slate-700 text-slate-300 hover:text-white'}`}
              title="設定"
            >
              <Settings size={18} />
            </button>
            
            {showSettings && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-slate-800 border border-slate-600 rounded-lg shadow-xl p-4 z-50">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-bold text-slate-200">設定</h3>
                  <button onClick={() => setShowSettings(false)} className="text-slate-400 hover:text-white"><X size={16}/></button>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium text-slate-300 block">循序漸進模式</span>
                      <span className="text-xs text-slate-500 block">隱藏尚未學習的進階功能</span>
                    </div>
                    <button 
                      onClick={() => setProgressiveMode(!progressiveMode)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${progressiveMode ? 'bg-blue-600' : 'bg-slate-600'}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${progressiveMode ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col relative min-w-0">

          <div className={`border-b p-4 transition-colors ${mode === 'challenge' ? 'bg-slate-800 border-orange-900/50' : 'bg-slate-800 border-slate-700'}`}>
            <div className="max-w-4xl mx-auto">
              {mode === 'tutorial' && !showConfetti && TUTORIAL_STEPS[stepIndex] && (
                <div className="flex items-start gap-4">
                  <div className="bg-blue-900/50 p-2 rounded-full text-blue-400 mt-1">
                    <MapIcon size={20} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <select
                        value={stepIndex}
                        onChange={(e) => {
                          const idx = parseInt(e.target.value);
                          setStepIndex(idx);
                        }}
                        className="bg-slate-900 border border-slate-600 rounded px-3 py-1 text-sm font-bold text-blue-200 focus:outline-none focus:border-blue-500"
                      >
                        {Object.entries(getTutorialGroups()).map(([chapter, steps]) => (
                          <optgroup label={chapter} key={chapter}>
                            {steps.map(step => (
                              <option
                                key={step.id}
                                value={step.index}
                                disabled={progressiveMode && step.index > maxStepReached}
                              >
                                {/* 這裡的勾勾邏輯改為看 completedSteps */}
                                {step.title} {progressiveMode && step.index > maxStepReached ? '(鎖定)' : (completedSteps.has(step.index) ? '✓' : '')}
                              </option>
                            ))}
                          </optgroup>
                        ))}
                      </select>
                      <span className="text-xs text-slate-500">
                        {stepIndex + 1} / {TUTORIAL_STEPS.length}
                      </span>
                    </div>

                    <p className="text-slate-300 mt-1">{TUTORIAL_STEPS[stepIndex].desc}</p>
                    <p className="text-sm text-yellow-500 mt-2 font-mono flex items-center gap-1">
                      <ArrowRight size={14} /> 提示：{TUTORIAL_STEPS[stepIndex].hint}
                    </p>
                  </div>
                </div>
              )}

              {mode === 'challenge' && !levelComplete && !showConfetti && (
                <div className="flex items-start gap-4">
                  <div className="bg-orange-900/50 p-2 rounded-full text-orange-400 mt-1">
                    <Trophy size={20} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-orange-100 flex items-center gap-2">
                      {CHALLENGE_LEVELS[levelIndex].title}
                      <span className="text-xs font-normal bg-slate-700 px-2 py-0.5 rounded text-slate-300">
                        Level {levelIndex + 1}
                      </span>
                    </h3>
                    <p className="text-slate-300 mt-1">{CHALLENGE_LEVELS[levelIndex].desc}</p>
                    <p className="text-sm text-yellow-500 mt-2 font-mono flex items-center gap-1">
                      <ArrowRight size={14} /> 任務目標：{CHALLENGE_LEVELS[levelIndex].hint}
                    </p>
                  </div>
                </div>
              )}

              {mode === 'playground' && !showConfetti && (
                <div className="flex items-center gap-4 text-slate-400">
                  <Play size={20} />
                  <p>自由模式：盡情實驗吧！沒有任何限制。</p>
                </div>
              )}

              {mode === 'challenge' && levelComplete && !showConfetti && (
                <div className="flex items-center justify-between bg-green-900/20 p-2 rounded-lg border border-green-500/30">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="text-green-500" size={24} />
                    <div>
                      <h4 className="text-green-100 font-bold">挑戰成功！</h4>
                      <p className="text-green-200/70 text-sm">Git 技能熟練度 +1</p>
                    </div>
                  </div>
                  <button
                    onClick={nextLevel}
                    className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-md font-bold transition-colors flex items-center gap-2"
                  >
                    下一關 <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </div>
          </div>

          {showConfetti && (
            <div className="absolute inset-0 z-20 bg-slate-900/90 flex items-center justify-center p-6 animate-in fade-in">
              <div className="text-center max-w-lg">
                <div className="inline-flex items-center justify-center p-4 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full mb-6 text-white shadow-xl shadow-orange-500/20">
                  <Trophy size={48} />
                </div>
                <h2 className="text-3xl font-bold text-white mb-4">
                  {mode === 'tutorial' ? '教學模式完成！' : '全數通關！你是 Git 大師！'}
                </h2>
                <p className="text-slate-300 mb-8 text-lg">
                  {mode === 'tutorial'
                    ? '你已經掌握了基礎操作。準備好接受挑戰了嗎？'
                    : '所有的挑戰難題都已被你破解。現在你可以在自由模式中創造更複雜的歷史！'}
                </p>
                <div className="flex gap-4 justify-center">
                  {mode === 'tutorial' ? (
                    <button onClick={() => switchMode('challenge')} className="bg-orange-600 text-white px-8 py-3 rounded-full font-bold hover:bg-orange-500 transition-all transform hover:scale-105 shadow-lg">
                      前往挑戰模式
                    </button>
                  ) : (
                    <button onClick={() => { switchMode('playground'); setShowConfetti(false); }} className="bg-purple-600 text-white px-8 py-3 rounded-full font-bold hover:bg-purple-500 transition-all transform hover:scale-105 shadow-lg">
                      自由探索
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          <div
            ref={scrollRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp} // 滑鼠離開範圍也視為結束
            className={`custom-scrollbar flex-1 bg-slate-900 overflow-auto relative p-8 transition-colors ${isDragging ? 'cursor-grabbing select-none' : 'cursor-grab'
              }`}
            style={{ backgroundImage: 'radial-gradient(#334155 1px, transparent 1px)', backgroundSize: '20px 20px' }}
          >
            <GitGraph repo={repo} />
          </div>

          <div className="bg-slate-800 border-t border-slate-700 p-4">
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

        <LogsPanel
          repo={repo}
          mode={mode}
          progressiveMode={progressiveMode}
        />
      </main>
    </div>
  );
}