import React from "react";
import {
  GitBranch,
  RefreshCw,
  BookOpen,
  Trophy,
  Play,
  Settings
} from "lucide-react";
export default function ModeHeader({
    mode,
    progressiveMode,
    setProgressiveMode,
    onResetSystem,
    showSettings
}) {
    return (
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
                <button onClick={onResetSystem} className="p-2 bg-slate-700 hover:bg-red-600 rounded-md text-slate-300 hover:text-white transition-colors" title={mode === 'challenge' ? "重置本關" : "全部重置"}>
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
                                <button onClick={() => setShowSettings(false)} className="text-slate-400 hover:text-white"><X size={16} /></button>
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
    );
}