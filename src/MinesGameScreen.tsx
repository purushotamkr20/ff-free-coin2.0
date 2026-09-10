import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

const getMultiplier = (mines: number, hits: number) => {
  if (hits === 0) return 1.0;
  
  if (mines === 3) {
      if (hits === 1) return 1.5;
      if (hits === 2) return 2.0;
      if (hits === 3) return 2.3;
      if (hits === 4) return 2.6;
      if (hits === 5) return 3.0;
      return parseFloat((3.0 + (hits - 5) * 0.5).toFixed(2));
  }

  let mult = 1.0;
  for (let i = 0; i < hits; i++) {
    mult *= (25 - i) / (25 - mines - i);
  }
  return parseFloat(mult.toFixed(2));
};

export const MinesGameScreen = ({ currentUser, setCurrentUser, setSelectedGame, isHoldUnlocked = false }: any) => {
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'crashed' | 'cashed_out'>('idle');
  const [betAmount, setBetAmount] = useState<number>(10);
  const [minesCount, setMinesCount] = useState<number>(3);
  const [grid, setGrid] = useState<any[]>(Array(25).fill({ revealed: false }));
  const [safeHits, setSafeHits] = useState(0);
  const [showMenu, setShowMenu] = useState(false);

  const updateCoins = async (amountDelta: number) => {
    if (!currentUser) return;
    setCurrentUser((prev: any) => prev ? { ...prev, coins: (prev.coins || 0) + amountDelta } : prev);
    try {
      await fetch('/api/add-coins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile: currentUser.mobile, amount: amountDelta })
      });
    } catch (e) {
      console.error(e);
    }
  };

  const startGame = () => {
    if ((currentUser?.coins || 0) < betAmount) {
      alert("Insufficient balance!");
      return;
    }
    updateCoins(-betAmount);
    
    // Generate mines
    const newGrid = Array(25).fill({ isMine: false, revealed: false });
    let minesPlaced = 0;
    while (minesPlaced < minesCount) {
      const rand = Math.floor(Math.random() * 25);
      if (!newGrid[rand].isMine) {
        newGrid[rand] = { isMine: true, revealed: false };
        minesPlaced++;
      }
    }
    
    setGrid(newGrid);
    setSafeHits(0);
    setGameState('playing');
  };

  const handleTileClick = (index: number) => {
    if (gameState !== 'playing' || grid[index].revealed) return;

    const newGrid = grid.map((tile, i) => i === index ? { ...tile } : tile);

    if (isHoldUnlocked) {
      // 5-second hold secret mode: GUARANTEED SAFE TILE!
      if (newGrid[index].isMine) {
        newGrid[index].isMine = false;
        // Relocate mine to another unrevealed tile if available
        const available = newGrid.map((t, idx) => (!t.revealed && idx !== index && !t.isMine) ? idx : -1).filter(idx => idx !== -1);
        if (available.length > 0) {
          const rand = available[Math.floor(Math.random() * available.length)];
          newGrid[rand] = { ...newGrid[rand], isMine: true };
        }
      }
      newGrid[index].revealed = true;
      setGrid(newGrid);
      setSafeHits(prev => prev + 1);
    } else {
      // Normal single click/tap mode: EVERY CLICK IS A BOMB / BOOM!
      newGrid[index].isMine = true;
      newGrid[index].revealed = true;
      setGameState('crashed');
      // Reveal all tiles showing mines
      const finalGrid = newGrid.map(tile => ({ ...tile, revealed: true }));
      setGrid(finalGrid);
    }
  };

  const cashOut = () => {
    if (gameState !== 'playing' || safeHits === 0) return;
    const mult = getMultiplier(minesCount, safeHits);
    const win = betAmount * mult;
    updateCoins(win);
    setGameState('cashed_out');
    // Reveal everything
    const finalGrid = grid.map(tile => ({ ...tile, revealed: true }));
    setGrid(finalGrid);
  };

  const currentMult = getMultiplier(minesCount, safeHits);

  return (
    <div className="flex flex-col h-full bg-[#1b3260] text-white font-sans overflow-hidden relative">
      {/* Header */}
      <div className="flex items-center justify-between p-3 z-10">
        <div className="flex flex-col leading-none">
          <span className="text-2xl font-black italic text-[#ffc107]" style={{ textShadow: '1px 1px 0px #b91c1c, -1px -1px 0 #b91c1c, 1px -1px 0 #b91c1c, -1px 1px 0 #b91c1c, 2px 2px 0px #d32f2f' }}>MINES</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-[#11244e] px-3 py-1.5 rounded flex items-center gap-2 min-w-[120px] justify-between shadow-inner">
            <span className="font-bold text-lg">{(currentUser?.coins || 0).toFixed(2)}</span>
            <span className="text-white font-bold">INR</span>
          </div>
          <button onClick={() => setShowMenu(!showMenu)} className="text-[#8ab4f8] hover:text-white p-1">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
          </button>
        </div>
      </div>

      {showMenu && (
        <div className="absolute top-16 right-3 bg-[#11244e] rounded-lg shadow-xl z-50 py-1 min-w-[150px] border border-[#2b529f]">
          <button 
            onClick={() => setSelectedGame(null)} 
            className="w-full text-left px-4 py-3 hover:bg-[#1e3b70] font-bold text-red-400 flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
            Exit Game
          </button>
        </div>
      )}

      {/* Grid */}
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="grid grid-cols-5 gap-2 w-full max-w-[400px] aspect-square">
          {grid.map((tile, i) => (
            <button
              key={i}
              onClick={() => handleTileClick(i)}
              disabled={gameState !== 'playing' || tile.revealed}
              className={`relative rounded-lg shadow-sm overflow-hidden flex items-center justify-center w-full h-full transition-colors duration-150 ${
                !tile.revealed 
                  ? 'bg-[#3b82f6] border-b-[4px] border-[#2563eb] hover:bg-[#2563eb]' 
                  : tile.isMine
                    ? 'bg-[#1e1b4b] border border-[#312e81]'
                    : 'bg-[#0f172a] border border-[#1e293b]'
              }`}
            >
              {tile.revealed ? (
                tile.isMine ? (
                  <span className="text-[24px]">💣</span>
                ) : (
                  <span className="text-[24px] text-green-400">★</span>
                )
              ) : null}
            </button>
          ))}
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="px-3 pb-4 pt-2 bg-[#1b3260] flex gap-2 items-center justify-between z-30">
        <div className="flex bg-[#11244e] rounded-xl overflow-hidden flex-1 border border-[#2b529f] h-[55px]">
           <div className="bg-[#1e3b70] w-[45%] flex flex-col items-center justify-center text-[#64b5f6] border-r border-[#2b529f]">
             <span className="text-[16px] leading-none mb-0.5">🪙</span>
             <span className="text-[11px] font-bold uppercase">Bet</span>
           </div>
           <div className="w-[55%] flex items-center justify-center px-1">
             <input 
                type="number" 
                value={betAmount} 
                onChange={(e) => setBetAmount(Number(e.target.value))}
                className="bg-transparent text-white font-bold text-xl outline-none w-full text-center"
                disabled={gameState === 'playing'}
              />
           </div>
        </div>

        <div className="flex bg-[#11244e] rounded-xl overflow-hidden flex-1 border border-[#2b529f] h-[55px]">
           <div className="bg-[#1e3b70] w-[45%] flex flex-col items-center justify-center text-[#64b5f6] border-r border-[#2b529f]">
             <span className="text-[16px] leading-none mb-0.5">💣</span>
             <span className="text-[11px] font-bold uppercase">Mines</span>
           </div>
           <div className="w-[55%] flex items-center justify-center px-1">
              <select 
                value={minesCount} 
                onChange={(e) => setMinesCount(Number(e.target.value))}
                className="bg-transparent text-white font-bold text-xl outline-none w-full appearance-none text-center"
                disabled={gameState === 'playing'}
              >
                {[1,2,3,4,5,6,7,8,9,10,15,20,24].map(n => (
                  <option key={n} value={n} className="bg-[#1a3673]">{n}</option>
                ))}
              </select>
           </div>
        </div>
        
        {gameState === 'playing' && safeHits > 0 ? (
          <button 
            onClick={cashOut}
            className="w-[85px] h-[55px] bg-[#d32f2f] hover:bg-[#c62828] rounded-xl font-black text-white text-sm shadow-lg border-b-[4px] border-[#b71c1c] active:border-b-0 active:translate-y-1 flex flex-col items-center justify-center"
          >
            <span className="text-[11px] leading-none mb-1">CASH OUT</span>
            <span className="text-[12px] font-bold text-red-100">{(betAmount * currentMult).toFixed(2)}</span>
          </button>
        ) : (
          <button 
            onClick={startGame}
            disabled={gameState === 'playing'}
            className={`w-[85px] h-[55px] rounded-xl font-black text-white text-lg shadow-lg border-b-[4px] active:border-b-0 active:translate-y-1 flex items-center justify-center ${gameState === 'playing' ? 'bg-[#388e3c] border-[#2e7d32] opacity-50' : 'bg-[#43a047] hover:bg-[#388e3c] border-[#2e7d32]'}`}
          >
            BET
          </button>
        )}
      </div>
      
      {/* Result Overlay */}
      <AnimatePresence>
        {(gameState === 'crashed' || gameState === 'cashed_out') && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-6 rounded-2xl shadow-2xl flex flex-col items-center justify-center text-center z-40 backdrop-blur-md min-w-[250px] ${gameState === 'cashed_out' ? 'bg-[#43a047]/90 border-[3px] border-[#81c784]' : 'bg-[#e53935]/90 border-[3px] border-[#ef5350]'}`}
          >
            {gameState === 'cashed_out' ? (
              <>
                <span className="text-5xl mb-2 drop-shadow-md">🎉</span>
                <span className="text-white font-black text-2xl drop-shadow-md">YOU WON!</span>
                <span className="text-yellow-300 font-black text-4xl mt-2 drop-shadow-md">+{(betAmount * currentMult).toFixed(2)}</span>
              </>
            ) : (
              <>
                <span className="text-5xl mb-2 drop-shadow-md">💣</span>
                <span className="text-white font-black text-3xl drop-shadow-md">BOOM!</span>
                <span className="text-white/90 font-bold mt-3 text-lg bg-black/20 px-4 py-1 rounded-full">Lost {(betAmount).toFixed(2)}</span>
              </>
            )}
            <button 
              onClick={() => { setGameState('idle'); setGrid(Array(25).fill({ revealed: false })); setSafeHits(0); }}
              className="mt-6 bg-white text-[#11244e] font-black text-lg px-8 py-3 rounded-xl shadow-lg hover:bg-gray-100 active:scale-95 transition-transform"
            >
              Play Again
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
