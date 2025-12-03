import React, { useState, useEffect } from 'react';
import Globe3D from './components/Globe3D';
import { TARGETS } from './constants';
import { GameTarget, GeoJsonFeature } from './types';
import { Trophy, RefreshCw, Puzzle, Map, Lightbulb } from 'lucide-react';
import confetti from 'canvas-confetti';

const App: React.FC = () => {
  const [placedTargets, setPlacedTargets] = useState<string[]>([]);
  const [lastMessage, setLastMessage] = useState<{text: string, type: 'success' | 'error' | 'info'} | null>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [activeHint, setActiveHint] = useState<GameTarget | null>(null);
  
  // Initialize or Reset
  const resetGame = () => {
    setPlacedTargets([]);
    setLastMessage({ text: "拖动右侧的拼图到地球上的正确位置！", type: 'info' });
    setDraggedId(null);
    setActiveHint(null);
  };

  useEffect(() => {
    resetGame();
  }, []);

  const handleWin = () => {
    confetti({
      particleCount: 200,
      spread: 100,
      origin: { y: 0.6 },
      colors: ['#10b981', '#3b82f6', '#fbbf24']
    });
    setLastMessage({ text: "恭喜！拼图完成！", type: 'success' });
  };

  // Hint Logic
  const handleHint = () => {
    const unplaced = TARGETS.filter(t => !placedTargets.includes(t.id));
    if (unplaced.length === 0) return;

    // Pick a random unplaced target
    const randomTarget = unplaced[Math.floor(Math.random() * unplaced.length)];
    setActiveHint(randomTarget);
    setLastMessage({ text: `提示：试着找找 ${randomTarget.name}！`, type: 'info' });

    // Clear hint after 3 seconds to let user play
    setTimeout(() => {
      setActiveHint(null);
    }, 3000);
  };

  // Drag Handlers for the Dock Items
  const handleDragStart = (e: React.DragEvent, targetId: string) => {
    setDraggedId(targetId);
    e.dataTransfer.setData('text/plain', targetId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggedId(null);
  };

  // Drop Logic from Globe
  const handlePieceDrop = (pieceId: string, lat: number, lng: number, hitFeature: GeoJsonFeature | null) => {
    setDraggedId(null); // Reset drag state on drop
    const target = TARGETS.find(t => t.id === pieceId);
    if (!target) return;

    let isCorrect = false;

    if (target.type === 'CONTINENT') {
      // Check if dropped on the correct continent polygon
      if (hitFeature && hitFeature.properties.CONTINENT) {
         if (target.matchKeys?.includes(hitFeature.properties.CONTINENT)) {
           isCorrect = true;
         } else {
           setLastMessage({ text: `这里是 ${hitFeature.properties.CONTINENT}，不是 ${target.name}哦`, type: 'error' });
         }
      } else {
         setLastMessage({ text: "请把陆地拼图放在陆地上！", type: 'error' });
      }
    } else if (target.type === 'OCEAN') {
      // Check distance for oceans
      if (target.lat !== undefined && target.lng !== undefined) {
        const R = 6371; 
        const dLat = (target.lat - lat) * (Math.PI / 180);
        const dLon = (target.lng - lng) * (Math.PI / 180);
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(lat * Math.PI / 180) * Math.cos(target.lat * Math.PI / 180) *
                  Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const dist = R * c;

        if (dist < 2500) {
          isCorrect = true;
        } else {
          setLastMessage({ text: "这里好像不是这片海域...", type: 'error' });
        }
      }
    }

    if (isCorrect) {
      if (!placedTargets.includes(target.id)) {
        const newPlaced = [...placedTargets, target.id];
        setPlacedTargets(newPlaced);
        setLastMessage({ text: `正确！放置了 ${target.name}`, type: 'success' });
        
        // Check Win
        if (newPlaced.length === TARGETS.length) {
          handleWin();
        }
      }
    }
  };

  // Filter unplaced targets
  const unplacedTargets = TARGETS.filter(t => !placedTargets.includes(t.id));

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden font-sans select-none">
      
      {/* 3D Globe Layer */}
      <div className="absolute inset-0 z-0">
        <Globe3D 
          targets={TARGETS}
          placedTargets={placedTargets}
          activeHint={activeHint}
          onPieceDrop={handlePieceDrop}
        />
      </div>

      {/* Header UI */}
      <div className="absolute top-0 left-0 p-6 pointer-events-none w-full flex justify-between items-start z-10">
        <div className="bg-slate-900/90 backdrop-blur-md p-4 rounded-2xl border border-slate-700/50 shadow-2xl pointer-events-auto max-w-sm transition-all hover:border-slate-500">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg shadow-lg">
              <Map className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-black bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                世界拼图 3D
              </h1>
            </div>
          </div>
          
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mt-3 mb-1">
            <div 
              className="bg-emerald-500 h-full transition-all duration-500 ease-out"
              style={{ width: `${(placedTargets.length / TARGETS.length) * 100}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-slate-400 font-medium">
            <span>进度</span>
            <span>{placedTargets.length} / {TARGETS.length}</span>
          </div>
        </div>

        {/* Status Message Bubble */}
        {lastMessage && (
          <div className={`
            pointer-events-auto px-6 py-3 rounded-xl backdrop-blur-md shadow-lg border border-white/10
            animate-in fade-in slide-in-from-top-4 duration-300
            ${lastMessage.type === 'success' ? 'bg-emerald-500/20 text-emerald-200 border-emerald-500/30' : ''}
            ${lastMessage.type === 'error' ? 'bg-red-500/20 text-red-200 border-red-500/30' : ''}
            ${lastMessage.type === 'info' ? 'bg-blue-500/20 text-blue-200 border-blue-500/30' : ''}
          `}>
            <span className="font-medium">{lastMessage.text}</span>
          </div>
        )}
        
        <div className="flex gap-2">
          <button 
            onClick={handleHint}
            disabled={unplacedTargets.length === 0}
            className="pointer-events-auto bg-yellow-500/80 hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed text-white p-3 rounded-xl border border-yellow-400/50 transition-all hover:scale-105 active:scale-95 shadow-xl"
            title="提示 (Hint)"
          >
            <Lightbulb size={20} />
          </button>
          
          <button 
            onClick={resetGame}
            className="pointer-events-auto bg-slate-800/80 hover:bg-slate-700 text-white p-3 rounded-xl border border-slate-600 transition-all hover:scale-105 active:scale-95 shadow-xl"
            title="重置游戏"
          >
            <RefreshCw size={20} />
          </button>
        </div>
      </div>

      {/* Right Side Dock (Puzzle Pieces) */}
      <div className="absolute top-1/2 right-4 -translate-y-1/2 z-20 pointer-events-none flex flex-col items-end gap-2 max-h-[85vh]">
        <div className="bg-slate-900/90 backdrop-blur-xl p-4 rounded-2xl border border-slate-700/50 shadow-2xl pointer-events-auto overflow-y-auto w-48 no-scrollbar flex flex-col gap-3 min-h-[300px]">
          <div className="flex items-center gap-2 text-slate-400 text-sm font-bold uppercase tracking-wider mb-2 border-b border-slate-700 pb-2">
            <Puzzle size={14} /> 待拼图块 ({unplacedTargets.length})
          </div>

          {unplacedTargets.length === 0 ? (
             <div className="flex flex-col items-center justify-center py-10 text-emerald-500 text-center animate-pulse">
                <Trophy size={48} className="mb-2 opacity-80" />
                <span className="font-bold">全部完成!</span>
             </div>
          ) : (
            unplacedTargets.map(target => {
              const isDragging = draggedId === target.id;
              const isHinted = activeHint?.id === target.id;
              return (
                <div
                  key={target.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, target.id)}
                  onDragEnd={handleDragEnd}
                  className={`
                    group relative cursor-grab active:cursor-grabbing
                    p-3 rounded-xl border
                    transition-all duration-200
                    ${isDragging 
                      ? 'bg-slate-800 border-blue-400 shadow-[0_0_15px_rgba(96,165,250,0.5)] scale-100 z-10 ring-1 ring-blue-400/30' 
                      : isHinted
                        ? 'bg-yellow-900/40 border-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.4)] animate-pulse'
                        : 'bg-gradient-to-r from-slate-800 to-slate-800/50 border-slate-700/50 hover:from-slate-700 hover:to-slate-700/50 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/10 hover:border-blue-500/30'
                    }
                  `}
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className={`w-3 h-8 rounded-full shadow-[0_0_10px_inset_rgba(0,0,0,0.5)] transition-opacity ${isDragging ? 'opacity-80' : 'opacity-100'}`}
                      style={{ backgroundColor: target.color || '#94a3b8' }}
                    />
                    <div>
                      <div className={`font-bold text-sm transition-colors ${isDragging ? 'text-blue-100' : isHinted ? 'text-yellow-200' : 'text-slate-200'}`}>{target.name}</div>
                      <div className="text-[10px] text-slate-500 font-mono uppercase">{target.type === 'CONTINENT' ? '陆地' : '海洋'}</div>
                    </div>
                  </div>
                  {/* Drag Indicator */}
                  <div className={`absolute right-2 top-1/2 -translate-y-1/2 transition-opacity text-white ${isDragging ? 'opacity-100' : 'opacity-0 group-hover:opacity-20'}`}>
                     <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M7 19c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0-6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0-6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm6 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0-6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0-6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
      
      {/* Footer Hint */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 pointer-events-none text-center">
         <p className="text-slate-500/50 text-xs uppercase tracking-[0.2em]">GeoGlobe 3D • Drag & Drop</p>
      </div>

      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

export default App;