/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef, ChangeEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import { MinesGameScreen } from "./MinesGameScreen";
import { 
  LogIn, UserPlus, MessageCircle, TrendingUp, ShieldCheck, Zap, 
  Phone, Lock, Mail, User, ArrowLeft, Wallet, Coins, Check, 
  Gamepad2, CircleDollarSign, UserCircle2, Bell, Menu, Download, Smartphone,
  History, Trophy, Clock, ChevronDown, Minus, Plus, RefreshCw, Search,
  Upload, XCircle
} from "lucide-react";

type ViewState = "landing" | "login" | "register" | "dashboard" | "wallet" | "qr" | "secret_gate" | "secret_admin" | "notifications";
type DashboardTab = "earn" | "games" | "profile" | "history";

interface Notification {
  id: string;
  message: string;
  timestamp: number;
  read: boolean;
}

interface UserData {
  mobile: string;
  password: string;
  gmail?: string;
  username?: string;
  coins: number;
  photo?: string;
  joinedAt: number;
  notifications: Notification[];
}

interface FinancialRequest {
  id: string;
  userMobile: string;
  username: string;
  amount: number;
  type: "deposit" | "withdraw";
  status: "pending" | "completed";
  timestamp: number;
  utr?: string;
}

interface AdminParticipantCardProps {
  key?: string;
  participant: any;
  gameIndex: number;
  matchIndex: number;
  onSaved: () => any;
}

function AdminParticipantCard({ participant, gameIndex, matchIndex, onSaved }: AdminParticipantCardProps) {
  const [status, setStatus] = useState(participant.status || "pending");
  const [kills, setKills] = useState(participant.kills?.toString() || "0");
  const [prizeEarned, setPrizeEarned] = useState(participant.prizeEarned?.toString() || "0");
  const [saving, setSaving] = useState(false);

  const originalStatus = participant.status || "pending";
  const originalKills = participant.kills?.toString() || "0";
  const originalPrize = participant.prizeEarned?.toString() || "0";

  const hasChanges = status !== originalStatus || kills !== originalKills || prizeEarned !== originalPrize;

  const handleUpdate = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/resolve-participant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gameIndex,
          matchIndex,
          participantMobile: participant.mobile,
          status,
          kills: parseInt(kills) || 0,
          prizeEarned: parseInt(prizeEarned) || 0
        })
      });
      const data = await res.json();
      if (data.success) {
        alert("Participant result was successfully declared and balance updated!");
        onSaved();
      } else {
        alert(data.message || "Failed to save");
      }
    } catch (e) {
      alert("Error saving outcome");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-black/40 border border-white/5 p-3 rounded-xl flex flex-col gap-3">
      <div className="flex justify-between items-center">
        <div>
          <span className="text-[10px] bg-white/10 px-2.5 py-0.5 rounded border border-white/5 font-mono mr-2 text-dragon-gold">SLOT #{participant.slot}</span>
          <span className="text-xs font-black uppercase text-white">{participant.name}</span>
          <span className="block text-[8px] text-gray-500 font-bold uppercase mt-0.5">{participant.mobile}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <select 
            value={status} 
            onChange={(e) => setStatus(e.target.value)}
            className="bg-black text-[10px] font-black uppercase text-white border border-white/15 px-2 py-1.5 rounded-lg outline-none"
          >
            <option value="pending">Pending</option>
            <option value="win">Win</option>
            <option value="loss">Loss</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="flex flex-col gap-1">
          <label className="text-[8px] font-black uppercase text-gray-500">Kills</label>
          <input 
            type="number"
            value={kills}
            onChange={(e) => setKills(e.target.value)}
            className="bg-black/60 border border-white/10 rounded-lg px-2.5 py-1.5 text-center text-xs text-white"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[8px] font-black uppercase text-gray-500">Prize Won (₹)</label>
          <input 
            type="number"
            value={prizeEarned}
            onChange={(e) => setPrizeEarned(e.target.value)}
            className="bg-black/60 border border-white/10 rounded-lg px-2.5 py-1.5 text-center text-xs text-white"
          />
        </div>
      </div>

      <button
        disabled={saving}
        onClick={handleUpdate}
        className={`w-full bg-dragon-gold hover:bg-yellow-400 text-black font-black uppercase text-[8px] tracking-widest py-2 rounded-lg transition-all ${hasChanges ? "animate-[pulse_1.5s_ease-in-out_infinite] shadow-[0_0_15px_rgba(255,215,0,0.5)]" : ""}`}
      >
        {saving ? "Saving..." : "Declare Result"}
      </button>
    </div>
  );
}



const BetPanel = ({ 
  hasClose = false, 
  currentMultiplier = 1.00, 
  gameState = 'waiting',
  currentUser,
  updateCoins,
  onCashout,
  onBetPlaced
}: any) => {
  const [betAmount, setBetAmount] = useState("10.00");
  const [isAuto, setIsAuto] = useState(false);
  const [autoCashout, setAutoCashout] = useState("2.00");
  const [isAutoCashoutEnabled, setIsAutoCashoutEnabled] = useState(true);
  const [hasCashedOut, setHasCashedOut] = useState(false);
  const [cashoutAmount, setCashoutAmount] = useState(0);
  const [isBetPlaced, setIsBetPlaced] = useState(false);
  const [isBetQueued, setIsBetQueued] = useState(false);
  
  useEffect(() => {
    if (gameState === 'waiting') {
      setHasCashedOut(false);
      setCashoutAmount(0);
      
      let betActiveThisRound = isBetPlaced;
      
      if (isBetQueued) {
         const amount = parseFloat(betAmount);
         if (amount > 0 && (currentUser?.coins || 0) >= amount) {
           setIsBetPlaced(true);
           updateCoins(-amount);
           betActiveThisRound = true;
           onBetPlaced?.(amount);
         }
         setIsBetQueued(false);
      }

      if (isAuto && !betActiveThisRound) {
        const amount = parseFloat(betAmount);
        if (amount > 0 && (currentUser?.coins || 0) >= amount) {
           setIsBetPlaced(true);
           updateCoins(-amount);
           onBetPlaced?.(amount);
        }
      } else if (!isAuto && hasCashedOut) {
         // reset bet state if it was manual and cashed out
         setIsBetPlaced(false);
      }
    } else if (gameState === 'crashed') {
        if (isBetPlaced && !hasCashedOut) {
            // Lost the bet
            setIsBetPlaced(false);
            onCashout?.(0, 0, parseFloat(betAmount), true);
        }
        if (isAuto) {
            setIsBetPlaced(false);
        }
    }
  }, [gameState, isAuto]);

  useEffect(() => {
    if (isAuto && isAutoCashoutEnabled && isBetPlaced && !hasCashedOut && gameState === 'flying') {
      const target = parseFloat(autoCashout);
      if (!isNaN(target) && currentMultiplier >= target) {
        setHasCashedOut(true);
        const won = parseFloat(betAmount) * target;
        setCashoutAmount(won);
        updateCoins(won);
        onCashout?.(won, target, parseFloat(betAmount), false);
      }
    }
    // reset if multiplier resets
    if (currentMultiplier === 1.00 && gameState === 'waiting') {
      setHasCashedOut(false);
      if (!isAuto && !isBetQueued) {
         setIsBetPlaced(false);
      }
      setCashoutAmount(0);
    }
  }, [currentMultiplier, gameState]);

  const handleAction = () => {
    if (gameState === 'waiting') {
      if (!isBetPlaced) {
        const amount = parseFloat(betAmount);
        if (amount <= 0 || (currentUser?.coins || 0) < amount) {
          alert("Insufficient coins or invalid amount!");
          return;
        }
        setIsBetPlaced(true);
        updateCoins(-amount);
        onBetPlaced?.(amount);
      } else {
        // Cancel bet
        setIsBetPlaced(false);
        updateCoins(parseFloat(betAmount));
      }
    } else if (gameState === 'flying' || gameState === 'crashed') {
      if (isBetPlaced && !hasCashedOut && gameState === 'flying') {
        // Cash out
        setHasCashedOut(true);
        const won = parseFloat(betAmount) * currentMultiplier;
        setCashoutAmount(won);
        updateCoins(won);
        onCashout?.(won, currentMultiplier, parseFloat(betAmount), false);
      } else {
        // Queue or Cancel Queue for next round
        setIsBetQueued(!isBetQueued);
      }
    }
  };

  const getButtonState = () => {
    if (hasCashedOut) {
      if (isBetQueued) return { text: 'Cancel', sub: 'Waiting for next round', style: 'bg-[#d92b2b] hover:bg-[#c32626] border-[#991d1d]' };
      return { text: 'Bet', sub: 'Next round', style: 'bg-[#22aa11] hover:bg-[#1d910f] border-[#166d0c]' };
    }
    
    if (gameState === 'waiting') {
        if (isBetPlaced) return { text: 'Cancel', style: 'bg-[#d92b2b] hover:bg-[#c32626] border-[#991d1d]' };
        return { text: 'Bet', style: 'bg-[#22aa11] hover:bg-[#1d910f] border-[#166d0c]' };
    }
    
    // Flying or Crashed
    if (gameState === 'flying' && isBetPlaced && !hasCashedOut) {
        return { text: 'Cash Out', style: 'bg-[#ff9900] hover:bg-[#e68a00] border-[#cc7a00]' };
    }
    
    // No active bet this round, queue logic
    if (isBetQueued) {
        return { text: 'Cancel', sub: 'Waiting for next round', style: 'bg-[#d92b2b] hover:bg-[#c32626] border-[#991d1d]' };
    }
    
    return { text: 'Bet', sub: 'Next round', style: 'bg-[#22aa11] hover:bg-[#1d910f] border-[#166d0c]' };
  };

  const btnState = getButtonState();

  return (
    <div className="bg-[#1c1c1c] rounded-[18px] p-2 flex flex-col gap-2 relative border border-[#2a2a2a] mx-auto w-full max-w-[500px]">
      {hasClose && (
        <button className="absolute top-2 right-2 w-6 h-6 bg-[#2b2b2b] rounded-md flex items-center justify-center border border-[#333] z-10 hover:bg-[#333]">
          <Minus size={14} className="text-[#a3a3a3]" strokeWidth={3} />
        </button>
      )}

      <div className="flex justify-center mb-1">
        <div className="bg-black/80 rounded-[20px] flex p-1 w-[220px]">
          <button 
            onClick={() => setIsAuto(false)}
            className={`flex-1 text-center py-1.5 rounded-[16px] text-[13px] font-bold ${!isAuto ? 'bg-[#3a3a3a] text-[#ddd] shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
          >
            Bet
          </button>
          <button 
            onClick={() => setIsAuto(true)}
            className={`flex-1 text-center py-1.5 rounded-[16px] text-[13px] font-bold ${isAuto ? 'bg-[#3a3a3a] text-[#ddd] shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
          >
            Auto
          </button>
        </div>
      </div>

      <div className="flex gap-2 h-full">
        <div className="flex-[0.9] flex flex-col justify-between h-full min-h-[76px]">
          <div className="bg-black/90 rounded-full flex items-center justify-between px-1 py-1 border border-[#111]">
            <button 
              onClick={() => setBetAmount(prev => (Math.max(1, parseFloat(prev) - 10)).toFixed(2))}
              className="w-7 h-7 rounded-full border border-gray-600 flex items-center justify-center text-gray-400 hover:text-white"
            >
              <Minus size={14} strokeWidth={2.5} />
            </button>
            <input 
              type="text" 
              value={betAmount}
              onChange={(e) => setBetAmount(e.target.value)}
              className="w-16 bg-transparent text-center text-white font-bold text-lg outline-none"
            />
            <button 
              onClick={() => setBetAmount(prev => (parseFloat(prev) + 10).toFixed(2))}
              className="w-7 h-7 rounded-full border border-gray-600 flex items-center justify-center text-gray-400 hover:text-white"
            >
              <Plus size={14} strokeWidth={2.5} />
            </button>
          </div>
          
          <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 mt-1">
            {[100, 200, 500, 1000].map(val => (
              <button 
                key={val} 
                onClick={() => setBetAmount(val.toFixed(2))}
                className="text-[#999] text-[13px] font-bold py-0.5 bg-transparent hover:text-white transition-colors text-center"
              >
                {val.toLocaleString()}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-[1.1] h-full flex flex-col gap-1">
          <button 
            onClick={handleAction}
            className={`w-full flex-1 min-h-[76px] rounded-2xl flex flex-col items-center justify-center border-b-[4px] active:border-b-0 active:translate-y-[4px] transition-all shadow-lg relative overflow-hidden group ${btnState.style}`}
          >
            <span className="text-white text-[15px] tracking-wide font-normal mb-0 z-10 flex items-center gap-1">
              {btnState.text} {btnState.sub && <span className="text-[10px] opacity-70">({btnState.sub})</span>}
            </span>
            <div className="flex items-baseline gap-1 z-10">
              <span className="text-white text-[24px] font-bold leading-none">
                {isBetQueued ? betAmount : hasCashedOut ? cashoutAmount.toFixed(2) : (gameState === 'flying' && isBetPlaced && !hasCashedOut) ? (parseFloat(betAmount) * currentMultiplier).toFixed(2) : betAmount}
              </span>
              <span className="text-white text-[15px] font-medium">INR</span>
            </div>
          </button>
        </div>
      </div>
      
      {isAuto && (
        <div className="mt-1 pt-2 border-t border-[#333] flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer group">
            <div className="relative">
              <input 
                type="checkbox" 
                checked={isAutoCashoutEnabled}
                onChange={() => setIsAutoCashoutEnabled(!isAutoCashoutEnabled)}
                className="sr-only"
              />
              <div className={`block w-10 h-5 rounded-full transition-colors ${isAutoCashoutEnabled ? 'bg-[#22aa11]' : 'bg-[#444]'}`}></div>
              <div className={`absolute left-0.5 top-0.5 bg-white w-4 h-4 rounded-full transition-transform ${isAutoCashoutEnabled ? 'translate-x-5' : 'translate-x-0'}`}></div>
            </div>
            <span className="text-[#bbb] text-xs font-semibold group-hover:text-white transition-colors">Auto Cashout</span>
          </label>
          
          <div className="flex items-center gap-2">
            <div className={`flex items-center bg-black/50 border ${isAutoCashoutEnabled ? 'border-[#555]' : 'border-[#333] opacity-50'} rounded-full px-3 py-1 transition-all`}>
              <input 
                type="text" 
                disabled={!isAutoCashoutEnabled}
                value={autoCashout}
                onChange={(e) => setAutoCashout(e.target.value)}
                className="w-12 bg-transparent text-white font-bold text-sm outline-none text-right"
              />
              <span className="text-[#888] font-bold text-sm ml-1">x</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
const StatsPanel = ({ 
  currentMultiplier, 
  gameState, 
  currentUser,
  myBetHistory,
  users = [],
  activeUserBets = []
}: any) => {
  const [activeTab, setActiveTab] = useState<'all' | 'my' | 'rank'>('all');
  const [bets, setBets] = useState<any[]>([]);

  // Generate simulated bets using ONLY real registered users
  useEffect(() => {
    if (gameState === 'waiting') {
      const activeUsers = users.filter((u: any) => u.mobile !== currentUser?.mobile);
      // We can randomly choose which users bet this round, or just make all of them bet.
      // Let's have a random subset of registered users bet.
      const numBets = Math.max(0, Math.floor(Math.random() * activeUsers.length));
      const shuffled = [...activeUsers].sort(() => 0.5 - Math.random());
      const selectedUsers = activeUsers.length > 0 ? shuffled.slice(0, numBets || activeUsers.length) : [];
      
      const initialBets = selectedUsers.map((u: any) => ({
        id: u.mobile,
        user: u.username || u.name || `User-${u.mobile?.slice(-4)}`,
        bet: (Math.random() * (u.coins > 1000 ? 500 : 50) + 10).toFixed(2), // Simulate reasonable bet
        multiplier: null,
        win: null,
        avatar: u.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.mobile}`,
        cashedOut: false,
        targetMultiplier: (1.1 + Math.random() * 5).toFixed(2),
        isReal: true
      }));
      setBets(initialBets.sort((a, b) => parseFloat(b.bet) - parseFloat(a.bet)));
    }
  }, [gameState, users, currentUser]);

  // Simulate players cashing out during flying state
  useEffect(() => {
    if (gameState === 'flying') {
      setBets(prevBets => {
        let changed = false;
        const newBets = prevBets.map(bet => {
          if (!bet.cashedOut && currentMultiplier >= parseFloat(bet.targetMultiplier)) {
            changed = true;
            return {
              ...bet,
              cashedOut: true,
              multiplier: parseFloat(bet.targetMultiplier).toFixed(2),
              win: (parseFloat(bet.bet) * parseFloat(bet.targetMultiplier)).toFixed(2)
            };
          }
          return bet;
        });
        return changed ? newBets : prevBets;
      });
    }
  }, [currentMultiplier, gameState]);
  
  // Inject the real user's current bet if it exists (for all bets view)
  const myCurrentBets = activeUserBets.map((b: any) => ({
    id: `my-${b.id}`,
    user: currentUser?.username || currentUser?.name || currentUser?.mobile || 'You',
    bet: b.bet,
    multiplier: b.multiplier?.toFixed(2) || null,
    win: b.win?.toFixed(2) || null,
    avatar: currentUser?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser?.mobile}`,
    cashedOut: b.cashedOut,
    targetMultiplier: '0.00',
    isReal: true
  }));

  const allBetsDisplay = [...myCurrentBets, ...bets].sort((a, b) => parseFloat(b.bet) - parseFloat(a.bet));

  const renderAllBets = () => (
    <>
      <div className="flex items-center justify-between mb-2 px-1">
        <h3 className="text-white font-bold text-sm flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
          {allBetsDisplay.length} Players
        </h3>
      </div>
      <div className="flex text-gray-500 text-[10px] font-bold uppercase tracking-wider mb-2 px-2">
        <div className="flex-1">User</div>
        <div className="w-16 text-right">Bet</div>
        <div className="w-12 text-right">Mult</div>
        <div className="w-20 text-right">Cash out</div>
      </div>
      <div className="flex-1 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
        {allBetsDisplay.map((bet) => (
          <div key={bet.id} className={`flex items-center px-2 py-1.5 rounded-lg transition-colors ${bet.cashedOut ? 'bg-[#22aa11]/20 border border-[#22aa11]/30' : 'bg-white/5 border border-transparent'}`}>
            <div className="flex-1 flex items-center gap-2 overflow-hidden">
              <div className="w-5 h-5 rounded-full bg-black flex-shrink-0 overflow-hidden">
                 <img src={bet.avatar} alt="avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </div>
              <span className="text-gray-300 text-[11px] font-medium truncate">{bet.user}</span>
            </div>
            <div className="w-16 text-right text-gray-300 text-[11px] font-medium">₹ {bet.bet}</div>
            <div className="w-12 text-right">
              {bet.cashedOut ? (
                <span className="text-[#22aa11] text-[11px] font-bold">{bet.multiplier}x</span>
              ) : (
                <span className="text-gray-600 text-[11px]">-</span>
              )}
            </div>
            <div className="w-20 text-right">
              {bet.cashedOut ? (
                <span className="text-white text-[11px] font-bold">₹ {bet.win}</span>
              ) : (
                <span className="text-gray-600 text-[11px]">-</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  );

  const renderMyBets = () => (
    <>
      <div className="flex text-gray-500 text-[10px] font-bold uppercase tracking-wider mb-2 px-2 mt-2">
        <div className="w-20 text-left">Bet</div>
        <div className="w-16 text-right">Mult</div>
        <div className="flex-1 text-right">Cash out</div>
      </div>
      <div className="flex-1 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
        {myBetHistory.length === 0 && <div className="text-gray-500 text-xs text-center mt-4">No bets yet</div>}
        {myBetHistory.map((bet: any, idx: number) => (
          <div key={idx} className={`flex items-center px-2 py-1.5 rounded-lg transition-colors ${bet.win > 0 ? 'bg-[#22aa11]/20 border border-[#22aa11]/30' : 'bg-red-500/10 border border-red-500/20'}`}>
            <div className="w-20 text-left text-gray-300 text-[11px] font-medium">₹ {bet.betAmount}</div>
            <div className="w-16 text-right">
              {bet.win > 0 ? (
                <span className="text-[#22aa11] text-[11px] font-bold">{bet.multiplier}x</span>
              ) : (
                <span className="text-red-500 text-[11px] font-bold">0.00x</span>
              )}
            </div>
            <div className="flex-1 text-right">
              {bet.win > 0 ? (
                <span className="text-white text-[11px] font-bold">₹ {bet.win.toFixed(2)}</span>
              ) : (
                <span className="text-gray-500 text-[11px] font-bold">-₹ {bet.betAmount}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  );

  const renderRank = () => {
    // Top 20 from current generated bets (could also include history, but let's just do current/simulated top winners)
    const rankedBets = [...bets].filter(b => b.cashedOut).sort((a, b) => parseFloat(b.win) - parseFloat(a.win)).slice(0, 20);
    return (
      <>
        <div className="flex text-gray-500 text-[10px] font-bold uppercase tracking-wider mb-2 px-2 mt-2">
          <div className="flex-1">Top Winners</div>
          <div className="w-16 text-right">Mult</div>
          <div className="w-20 text-right">Won</div>
        </div>
        <div className="flex-1 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
          {rankedBets.map((bet) => (
            <div key={bet.id} className="flex items-center px-2 py-1.5 rounded-lg transition-colors bg-[#ff9900]/10 border border-[#ff9900]/30">
              <div className="flex-1 flex items-center gap-2 overflow-hidden">
                <div className="w-5 h-5 rounded-full bg-black flex-shrink-0 overflow-hidden">
                   <img src={bet.avatar} alt="avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
                <span className="text-[#ffb84d] text-[11px] font-bold truncate">{bet.user}</span>
              </div>
              <div className="w-16 text-right">
                <span className="text-white text-[11px] font-bold">{bet.multiplier}x</span>
              </div>
              <div className="w-20 text-right">
                <span className="text-[#ff9900] text-[11px] font-bold">₹ {bet.win}</span>
              </div>
            </div>
          ))}
        </div>
      </>
    );
  };

  return (
    <div className="flex flex-col h-[400px] lg:h-full w-full">
      {/* Tabs at the very top (thin) */}
      <div className="flex rounded-lg overflow-hidden bg-[#2a2a2a] mb-2 border border-[#333]">
        <button 
          onClick={() => setActiveTab('all')}
          className={`flex-1 py-1.5 text-[11px] font-black uppercase ${activeTab === 'all' ? 'bg-[#3a3a3a] text-white' : 'text-gray-400 hover:text-white'}`}
        >
          All Bets
        </button>
        <div className="w-[1px] bg-[#1a1a1a]"></div>
        <button 
          onClick={() => setActiveTab('my')}
          className={`flex-1 py-1.5 text-[11px] font-black uppercase ${activeTab === 'my' ? 'bg-[#3a3a3a] text-white' : 'text-gray-400 hover:text-white'}`}
        >
          My Bets
        </button>
        <div className="w-[1px] bg-[#1a1a1a]"></div>
        <button 
          onClick={() => setActiveTab('rank')}
          className={`flex-1 py-1.5 text-[11px] font-black uppercase flex items-center justify-center gap-1 ${activeTab === 'rank' ? 'bg-[#3a3a3a] text-[#ff9900]' : 'text-gray-400 hover:text-white'}`}
        >
          <Trophy size={10} /> Rank
        </button>
      </div>

      {activeTab === 'all' && renderAllBets()}
      {activeTab === 'my' && renderMyBets()}
      {activeTab === 'rank' && renderRank()}
      
    </div>
  );
};
const AviatorGameScreen = ({ currentUser, setCurrentUser, isAviatorMenuOpen, setIsAviatorMenuOpen, setSelectedGame, users, isHoldUnlocked = false }: any) => {
  const [gameState, setGameState] = useState<'waiting' | 'flying' | 'crashed'>('waiting');
  const [progress, setProgress] = useState(100);
  const [planePos, setPlanePos] = useState({ x: 0, y: 0 });
  const [currentMultiplier, setCurrentMultiplier] = useState(1.00);
  const [crashMultiplier, setCrashMultiplier] = useState(3.53);
  const [myBetHistory, setMyBetHistory] = useState<any[]>([]);  // Generate a random crash point for each round
  const [activeUserBets, setActiveUserBets] = useState<any[]>([]);

  const activeUserBetsRef = useRef<any[]>([]);
  activeUserBetsRef.current = activeUserBets;

  const addBetToHistory = (betRecord: any) => {
    setMyBetHistory((prev) => [...prev, betRecord]);
  };
  
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
      console.error('Failed to update coins', e);
    }
  };

  const calculateCrashPoint = (hasBetPlaced: boolean) => {
    if (isHoldUnlocked) {
      // Opened after holding 5s on box -> High multipliers (5x, 10x, 20x, 35x+)
      const rand = Math.random();
      if (rand < 0.5) {
        return parseFloat((5.00 + Math.random() * 5.00).toFixed(2));
      } else {
        return parseFloat((10.00 + Math.random() * 30.00).toFixed(2));
      }
    } else {
      // Normal single click entry:
      if (hasBetPlaced) {
        // User placed a bet -> plane MUST crash strictly below 1.50x (1.01x to 1.48x)
        return parseFloat((1.01 + Math.random() * 0.44).toFixed(2));
      } else {
        // User did NOT place a bet -> plane flies high (5x, 10x, 20x+)
        const rand = Math.random();
        if (rand < 0.5) {
          return parseFloat((5.00 + Math.random() * 5.00).toFixed(2));
        } else {
          return parseFloat((10.00 + Math.random() * 25.00).toFixed(2));
        }
      }
    }
  };

  useEffect(() => {
    let animationFrameId: number;
    let startTime = Date.now();
    let currentPhase = gameState;

    if (currentPhase === 'waiting') {
      const duration = 5000; // 5 seconds wait
      const animateProgress = () => {
        const now = Date.now();
        const elapsed = now - startTime;
        const newProgress = Math.max(0, 100 - (elapsed / duration) * 100);
        setProgress(newProgress);
        
        if (elapsed < duration) {
          animationFrameId = requestAnimationFrame(animateProgress);
        } else {
          const hasUserBet = activeUserBetsRef.current.some((b: any) => !b.cashedOut);
          const nextCrash = calculateCrashPoint(hasUserBet);
          setCrashMultiplier(nextCrash);
          setGameState('flying');
        }
      };
      animationFrameId = requestAnimationFrame(animateProgress);
    } else if (currentPhase === 'flying') {
      const animatePlane = () => {
        const now = Date.now();
        const elapsed = now - startTime;
        
        // Multiplier increases 1.0x every 5 seconds (0.2x per second)
        const currentMult = Math.max(1.00, Math.exp((elapsed / 1000) * 0.1)); 
        
        if (currentMult >= crashMultiplier) {
          setCurrentMultiplier(crashMultiplier);
          setGameState('crashed');
          return;
        }
        setCurrentMultiplier(currentMult);
        
        // Fly path logic (exponential)
        const t = Math.min(elapsed / 15000, 1);
        const newX = Math.pow(t, 0.8) * 400;
        const newY = Math.pow(t, 1.2) * 200;
        setPlanePos({ x: newX, y: -newY });
        
        animationFrameId = requestAnimationFrame(animatePlane);
      }
      animationFrameId = requestAnimationFrame(animatePlane);
    } else if (currentPhase === 'crashed') {
        const waitBeforeRestart = setTimeout(() => {
            setGameState('waiting');
            setCurrentMultiplier(1.00);
            setPlanePos({ x: 0, y: 0 });
            setProgress(100);
            setActiveUserBets([]);
        }, 5000); // 5 seconds crash display
        return () => clearTimeout(waitBeforeRestart);
    }

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [gameState, crashMultiplier, isHoldUnlocked]);

  const getMultiplierColor = (mult) => {
    if (mult < 2.00) return '#ffffff'; // White
    if (mult < 10.00) return '#9333ea'; // Purple 
    return '#e82735'; // Red
  };

  return (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col h-full bg-black fixed inset-0 z-[100] font-sans overflow-y-auto pb-6"
        >
          {/* Top Header */}
          <div className="flex items-center justify-between px-2 py-2 bg-[#0a0a0a] border-b border-[#222]">
            {/* Left: Logo + Icons */}
            <div className="flex items-center gap-1">
              <span className="text-[#e82735] font-black italic text-xl tracking-tighter" style={{ fontFamily: 'Impact, sans-serif' }}>Uono-Aviator</span>
              <div className="flex items-center gap-1 opacity-50 ml-1">
                <div className="w-3.5 h-3.5 rounded-full bg-[#333] flex items-center justify-center text-gray-300 font-bold text-[9px]">?</div>
                <ShieldCheck size={14} className="text-green-600" strokeWidth={2.5} />
              </div>
            </div>
            
            {/* Center: Balance */}
            <div className="bg-[#1c1c1c] rounded-full px-3 py-0.5 flex items-center gap-1.5 border border-[#333]">
              <span className="text-[#28a745] font-black text-sm">{parseFloat(currentUser?.coins?.toString() || "0").toFixed(2)}</span>
              <span className="text-gray-500 font-bold text-[10px]">INR</span>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-1.5 relative">
              <div className="w-[32px] h-[32px] rounded-[10px] border-[2px] border-[#0e4e41] bg-[#0c2e28] flex items-center justify-center cursor-pointer hover:bg-[#113a33]">
                <Clock size={16} className="text-white" strokeWidth={2} />
              </div>
              <button onClick={() => setIsAviatorMenuOpen(!isAviatorMenuOpen)} className="w-[32px] h-[32px] rounded-[10px] border-[2px] border-[#0e4e41] bg-[#0c2e28] flex flex-col justify-center items-center gap-[3px] cursor-pointer hover:bg-[#113a33] focus:outline-none">
                <div className="w-[16px] h-[2px] bg-white rounded-full"></div>
                <div className="w-[16px] h-[2px] bg-white rounded-full"></div>
                <div className="w-[16px] h-[2px] bg-white rounded-full"></div>
              </button>
              
              {isAviatorMenuOpen && (
                <div className="absolute top-12 right-0 mt-1 bg-[#1a1a1a] border border-[#333] rounded-lg shadow-xl overflow-hidden min-w-[120px] z-[200]">
                  <button 
                    onClick={() => {
                      setIsAviatorMenuOpen(false);
                      setSelectedGame(null);
                    }}
                    className="w-full text-left px-4 py-3 text-white text-[13px] font-bold hover:bg-[#2a2a2a] transition-colors"
                  >
                    Exit Game
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 p-2 flex flex-col lg:flex-row gap-4 relative mt-4 w-full max-w-6xl mx-auto">
            {/* Left Column (Game & Bet Panel) */}
            <div className="flex flex-col gap-2 flex-[2] w-full max-w-[500px] mx-auto lg:mx-0">
            
            {/* Top Right History Dropdown for Game Area */}
            <div className="flex justify-end mb-1 mr-2 absolute right-0 top-0 z-10">
              <div className="bg-[#1c1c1c] rounded-full px-2 py-0.5 flex items-center gap-1 border border-[#333] cursor-pointer hover:bg-[#2a2a2a]">
                <Clock size={12} className="text-gray-400" />
                <ChevronDown size={14} className="text-gray-400" />
              </div>
            </div>

            {/* Game Screen Canvas */}
            <div className="relative w-full aspect-[16/10] rounded-[24px] border border-[#222] overflow-hidden bg-black mx-auto max-w-[500px]"
              style={{
                 backgroundImage: `repeating-conic-gradient(from 0deg, #0f0f0f 0deg 8deg, #050505 8deg 16deg)`
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none"></div>
              
              {/* Center Logo & Text */}
              {gameState === 'waiting' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center pt-6">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-[#e82735] font-black italic text-5xl tracking-tighter" style={{ fontFamily: 'Impact, sans-serif' }}>UONO</span>
                    <div className="h-10 w-[1px] bg-gray-500/30"></div>
                    <div className="flex flex-col items-center">
                      <svg width="50" height="30" viewBox="0 0 100 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="mb-0.5 transform -rotate-12 overflow-visible">
                        <path d="M90 20C90 20 85 10 75 15L35 30L20 15L15 20L25 35L10 40C10 40 5 40 5 45L15 45L20 55C20 55 25 55 25 50L30 40L75 25C85 20 90 20 90 20Z" fill="#e82735"/>
                        <line x1="90" y1="5" x2="95" y2="35" stroke="#e82735" strokeWidth="3"/>
                      </svg>
                      <div className="text-[#e82735] italic font-bold text-xl leading-none" style={{ fontFamily: 'cursive' }}>Aviator</div>
                    </div>
                  </div>
                  
                  <p className="text-white font-bold text-[11px] tracking-widest mb-2 z-10 relative">DAILY 1,000,000 LEADERBOARD PRIZE</p>
                  
                  {/* Progress Bar */}
                  <div className="w-[65%] max-w-[240px] h-2 bg-[#222] rounded-full overflow-hidden relative z-10">
                    <div className="h-full bg-[#e82735]" style={{ width: `${progress}%` }}></div>
                  </div>
                </div>
              )}
              
                            {/* Multiplier Display */}
              {(gameState === 'flying' || gameState === 'crashed') && (
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
                  {gameState === 'crashed' && (
                    <span className="text-[#e82735] font-black text-4xl mb-2" style={{ fontFamily: 'Impact, sans-serif' }}>
                      FLEW AWAY!
                    </span>
                  )}
                  <span 
                    className="font-black text-7xl transition-colors duration-300" 
                    style={{ 
                      fontFamily: 'Impact, sans-serif', 
                      color: getMultiplierColor(currentMultiplier),
                      textShadow: `0 0 20px ${getMultiplierColor(currentMultiplier)}80` // Add some glow
                    }}
                  >
                    {currentMultiplier.toFixed(2)}x
                  </span>
                </div>
              )}

              {/* SVG Curve for the trail */}
              {gameState === 'flying' && (
                <svg viewBox="0 0 500 312" preserveAspectRatio="none" className="absolute inset-0 w-full h-full pointer-events-none z-0" style={{ overflow: 'visible' }}>
                  <path 
                    d={`M 40 ${280} Q ${40 + planePos.x * 0.5} ${280 + planePos.y * 0.8} ${40 + planePos.x} ${280 + planePos.y}`} 
                    fill="none" 
                    stroke="#e82735" 
                    strokeWidth="4" 
                    strokeLinecap="round" 
                  />
                  {/* Fill area under the curve */}
                  <path 
                    d={`M 40 ${280} Q ${40 + planePos.x * 0.5} ${280 + planePos.y * 0.8} ${40 + planePos.x} ${280 + planePos.y} L ${40 + planePos.x} 312 L 40 312 Z`} 
                    fill="url(#trail-gradient)" 
                    opacity="0.3"
                  />
                  <defs>
                    <linearGradient id="trail-gradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#e82735" stopOpacity="0.8" />
                      <stop offset="100%" stopColor="#e82735" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                </svg>
              )}
              {/* Small Plane at bottom left */}
              {gameState !== 'crashed' && (
                <div 
                  className="absolute text-[#e82735] z-10"
                  style={{
                    left: 0,
                    bottom: 0, 
                    width: '100%',
                    height: '100%',
                    pointerEvents: 'none'
                  }}
                >
                  <svg viewBox="0 0 500 312" preserveAspectRatio="none" className="w-full h-full overflow-visible">
                    <g transform={`translate(${40 + planePos.x}, ${280 + planePos.y}) rotate(${gameState === 'flying' ? -15 - planePos.x * 0.03 : -15})`}>
                      {/* The plane icon centered on its tip/tail */}
                      <g transform="translate(-40, -15)" style={{ filter: "drop-shadow(0px 8px 10px rgba(232,39,53,0.6))" }}>
                        {/* Fuselage */}
                        <path d="M75,15 C75,5 30,10 10,12 C5,12.5 2,15 2,15 C2,15 5,17.5 10,18 C30,20 75,25 75,15 Z" fill="#e82735" stroke="white" strokeWidth="1.5" />
                        {/* Cockpit */}
                        <path d="M45,11 C50,8 60,10 65,13 L45,13 Z" fill="white" opacity="0.9" />
                        {/* Wing */}
                        <path d="M35,15 L15,35 L30,35 L50,18 Z" fill="#c41a24" stroke="white" strokeWidth="1" />
                        {/* Tail */}
                        <path d="M12,12 L5,2 L20,10 Z" fill="#e82735" stroke="white" strokeWidth="1" />
                        {/* Propeller */}
                        <ellipse cx="76" cy="15" rx="2" ry="12" fill="#eeeeee" className="animate-spin" style={{ transformOrigin: '76px 15px', animationDuration: '0.2s' }} />
                      </g>
                    </g>
                  </svg>
                </div>
              )}
            </div>

            {/* Betting Panels Container */}
            <div className="flex flex-col gap-2 mt-2 w-full max-w-[500px] mx-auto">
              <BetPanel currentMultiplier={currentMultiplier} gameState={gameState} currentUser={currentUser} updateCoins={updateCoins} 
                onCashout={(win: any, mult: any, amt: any, isCrash: any) => { 
                  setMyBetHistory(prev => [{win: isCrash ? 0 : win, multiplier: isCrash ? 0 : mult, betAmount: amt}, ...prev]);
                  setActiveUserBets(prev => prev.map(b => b.id === 'panel1' ? { ...b, cashedOut: true, multiplier: mult, win: win } : b));
                }} 
                onBetPlaced={(amt: any) => {
                  setActiveUserBets(prev => [...prev.filter(b => b.id !== 'panel1'), { id: 'panel1', bet: amt, cashedOut: false, multiplier: null, win: null }]);
                }} 
              />
              <BetPanel hasClose={true} currentMultiplier={currentMultiplier} gameState={gameState} currentUser={currentUser} updateCoins={updateCoins} 
                onCashout={(win: any, mult: any, amt: any, isCrash: any) => { 
                  setMyBetHistory(prev => [{win: isCrash ? 0 : win, multiplier: isCrash ? 0 : mult, betAmount: amt}, ...prev]);
                  setActiveUserBets(prev => prev.map(b => b.id === 'panel2' ? { ...b, cashedOut: true, multiplier: mult, win: win } : b));
                }} 
                onBetPlaced={(amt: any) => {
                  setActiveUserBets(prev => [...prev.filter(b => b.id !== 'panel2'), { id: 'panel2', bet: amt, cashedOut: false, multiplier: null, win: null }]);
                }} 
              />
            </div>
            </div> {/* End Left Column */}
            
            {/* Right Column (Live Bets) */}
            <div className="flex-1 w-full max-w-[500px] mx-auto lg:max-w-none bg-[#1c1c1c] rounded-[24px] border border-[#2a2a2a] p-4 flex flex-col lg:h-auto h-[500px] overflow-hidden">
              <StatsPanel currentMultiplier={currentMultiplier} gameState={gameState} myBetHistory={myBetHistory} currentUser={currentUser} users={users} activeUserBets={activeUserBets} />
            </div>

          </div>
        </motion.div>
  );
};
export default function App() {
  const [view, setView] = useState<ViewState>("landing");
  const [activeTab, setActiveTab] = useState<DashboardTab>("games");
  const [adminTab, setAdminTab] = useState<number>(0);
  const [adminQrInput, setAdminQrInput] = useState("");
  const [adminUpiInput, setAdminUpiInput] = useState("");
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [isRefreshingData, setIsRefreshingData] = useState(false);
  
  // Real Database state synced from Server
  const [users, setUsers] = useState<UserData[]>([]);
  const [currentUser, setCurrentUser] = useState<UserData | null>(null);
  const [financialRequests, setFinancialRequests] = useState<FinancialRequest[]>([]);
  const [games, setGames] = useState<any[]>([]);
  const [earnLinks, setEarnLinks] = useState<any[]>([]);
  const [appSettings, setAppSettings] = useState({
    qrCode: "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=purushotamkumar0896@paytm",
    upiId: "purushotamkumar0896@paytm"
  });

  // Fetch data from server
  const refreshData = async () => {
    setIsRefreshingData(true);
    try {
      const res = await fetch("/api/data");
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        console.warn("Skipping data update: received HTML or non-JSON response from server.");
        return;
      }
      const data = await res.json();
      if (!data || !data.users || !data.games) {
        console.warn("Skipping data update: parsed JSON was empty or missing core collections.");
        return;
      }
      setUsers(data.users);
      setFinancialRequests(data.financialRequests);
      setGames(data.games);
      setEarnLinks(data.earnLinks || []);
      if (data.appSettings) setAppSettings(data.appSettings);
      
      // Update current user if logged in
      if (currentUser) {
        const updatedMe = data.users.find((u: UserData) => u.mobile === currentUser.mobile);
        if (updatedMe) setCurrentUser(updatedMe);
      }
    } catch (err) {
      console.error("Failed to fetch data cleanly:", err);
    } finally {
      setIsRefreshingData(false);
    }
  };

  const handleDeleteUser = async (mobile: string, username: string) => {
    if (!confirm(`Are you sure you want to delete user account ${username} (${mobile})?`)) return;
    try {
      const res = await fetch("/api/delete-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile })
      });
      const data = await res.json();
      if (data.success) {
        setUsers(data.users);
        alert(`Account ${username} deleted successfully.`);
      } else {
        alert(data.message || "Failed to delete user account.");
      }
    } catch (e) {
      alert("Error deleting user");
    }
  };

  useEffect(() => {
    refreshData();
    // Poll for updates every 3 seconds to keep live cross-device user registrations in real-time
    const interval = setInterval(refreshData, 3000);
    return () => clearInterval(interval);
  }, [currentUser?.mobile]);

  // Handle URL Router for isolated/secret Admin panel access
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const adminParam = params.get("admin");
    if (adminParam === "PURUSHOTAM_KR_20" || adminParam === "admin") {
      setView("secret_admin");
    } else if (adminParam === "gate") {
      setView("secret_gate");
    }
  }, []);

  // PWA installation states
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isAppInstalled, setIsAppInstalled] = useState(false);
  const [showNotificationPrompt, setShowNotificationPrompt] = useState(false);
  const [installTimer, setInstallTimer] = useState<number>(5);
  const installTimerRef = useRef<NodeJS.Timeout | null>(null);

  const getPwaStoreKey = () => {
    return view === "secret_admin" ? "pwa_gt_admin_permanently_hidden" : "pwa_gt_user_permanently_hidden";
  };

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Save the event so it can be triggered on demand
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsAppInstalled(true);
      setShowNotificationPrompt(false);
      localStorage.setItem(getPwaStoreKey(), "true");
      setDeferredPrompt(null);
      console.log("PWA installed successfully!");
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    if (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) {
      setIsAppInstalled(true);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, [view]);

  // Global auto-trigger check on load or view change
  useEffect(() => {
    const storeKey = getPwaStoreKey();
    const isPermanentlyHidden = localStorage.getItem(storeKey) === "true";
    const isStandalone = window.matchMedia && window.matchMedia("(display-mode: standalone)").matches;

    if (!isPermanentlyHidden && !isStandalone && !isAppInstalled) {
      // Prompt exactly after 1.5 seconds of app load
      const startTimeout = setTimeout(() => {
        setShowNotificationPrompt(true);
        setInstallTimer(5); // Reset countdown timer to 5
      }, 1500);

      return () => clearTimeout(startTimeout);
    } else {
      setShowNotificationPrompt(false);
    }
  }, [view, isAppInstalled]);

  // Manage the 5-second install countdown
  useEffect(() => {
    if (showNotificationPrompt) {
      if (installTimer > 0) {
        installTimerRef.current = setTimeout(() => {
          setInstallTimer((prev) => prev - 1);
        }, 1000);
      } else {
        // 5 seconds are up! Slide up and hide permanently for this session
        setShowNotificationPrompt(false);
        localStorage.setItem(getPwaStoreKey(), "true");
      }
    }
    return () => {
      if (installTimerRef.current) clearTimeout(installTimerRef.current);
    };
  }, [showNotificationPrompt, installTimer, view]);

  const handleDismissBanner = () => {
    setShowNotificationPrompt(false);
    localStorage.setItem(getPwaStoreKey(), "true");
  };

  const triggerPwaInstall = async () => {
    const storeKey = getPwaStoreKey();
    setShowNotificationPrompt(false);
    localStorage.setItem(storeKey, "true");

    const appTitle = view === "secret_admin" ? "GT Clash Admin App" : "GT Clash";

    if (!deferredPrompt) {
      alert(`To install the ${appTitle} icon on your home screen:\n\n1. In Google Chrome: Tap the three dots menu (top right) and click 'Install app' or 'Add to Home Screen'.\n2. In Safari (iOS): Tap the Share button at the bottom and choose 'Add to Home Screen'.\n\nEnjoy using the direct, standalone app version on your device!`);
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`Installation outcome: ${outcome}`);
    if (outcome === 'accepted') {
      setIsAppInstalled(true);
    }
    setDeferredPrompt(null);
  };

  // Form States
  const [loginMobile, setLoginMobile] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  
  const [regMobile, setRegMobile] = useState("");
  const [regGmail, setRegGmail] = useState("");
  const [regUsername, setRegUsername] = useState("");
  const [regPassword, setRegPassword] = useState("");

  // Forgot Password States
  const [forgotMobile, setForgotMobile] = useState("");
  const [forgotOtpInput, setForgotOtpInput] = useState("");
  const [forgotNewPassword, setForgotNewPassword] = useState("");
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState("");
  const [forgotStep, setForgotStep] = useState<1 | 2 | 3>(1); // 1 = Mobile, 2 = OTP, 3 = Password Reset
  const [simulatedOtp, setSimulatedOtp] = useState("");

  // Profile Edit States
  const [isEditing, setIsEditing] = useState(false);
  const [editUsername, setEditUsername] = useState("");
  const [editPhoto, setEditPhoto] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  // Wallet States
  const [depositAmount, setDepositAmount] = useState("");
  const [walletMode, setWalletMode] = useState<"deposit" | "withdraw">("deposit");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [depositUTR, setDepositUTR] = useState("");
  const presetAmounts = [10, 20, 30, 40, 50, 100, 200];

  // Deposit Screenshot & AI Verification States
  const [depositScreenshot, setDepositScreenshot] = useState<string | null>(null);
  const [isVerifyingDeposit, setIsVerifyingDeposit] = useState<boolean>(false);
  const [verificationCountdown, setVerificationCountdown] = useState<number>(10);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const depositScreenshotInputRef = useRef<HTMLInputElement | null>(null);

  // Timer States
  const [timeLeft, setTimeLeft] = useState(300);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Carousel State
  const [carouselIndex, setCarouselIndex] = useState(0);

  const [selectedGame, setSelectedGame] = useState<number | null>(null);
  const [isWithdrawSuccess, setIsWithdrawSuccess] = useState(false);
  const [isDepositSuccess, setIsDepositSuccess] = useState(false);
  const [isAviatorMenuOpen, setIsAviatorMenuOpen] = useState(false);

  // Aviator 5-Second Hold State & Handlers
  const [isAviatorHoldUnlocked, setIsAviatorHoldUnlocked] = useState<boolean>(false);
  const aviatorHoldTimerRef = useRef<NodeJS.Timeout | null>(null);
  const aviatorPressStartTimeRef = useRef<number>(0);
  const aviatorTriggeredRef = useRef<boolean>(false);

  const handleAviatorPressStart = () => {
    aviatorPressStartTimeRef.current = Date.now();
    aviatorTriggeredRef.current = false;
    if (aviatorHoldTimerRef.current) {
      clearTimeout(aviatorHoldTimerRef.current);
    }
    // Hold for 5 seconds (5000ms) without showing any timer or counter anywhere
    aviatorHoldTimerRef.current = setTimeout(() => {
      aviatorTriggeredRef.current = true;
      setIsAviatorHoldUnlocked(true);
      setSelectedGame(0);
    }, 5000);
  };

  const handleAviatorPressEnd = () => {
    if (aviatorHoldTimerRef.current) {
      clearTimeout(aviatorHoldTimerRef.current);
      aviatorHoldTimerRef.current = null;
    }
    if (aviatorTriggeredRef.current) return;

    const duration = Date.now() - aviatorPressStartTimeRef.current;
    if (duration < 5000) {
      // Normal single click / short tap
      setIsAviatorHoldUnlocked(false);
      setSelectedGame(0);
    }
  };

  const handleAviatorPressCancel = () => {
    if (aviatorHoldTimerRef.current) {
      clearTimeout(aviatorHoldTimerRef.current);
      aviatorHoldTimerRef.current = null;
    }
  };

  // Mines 5-Second Hold State & Handlers
  const [isMinesHoldUnlocked, setIsMinesHoldUnlocked] = useState<boolean>(false);
  const minesHoldTimerRef = useRef<NodeJS.Timeout | null>(null);
  const minesPressStartTimeRef = useRef<number>(0);
  const minesTriggeredRef = useRef<boolean>(false);

  const handleMinesPressStart = () => {
    minesPressStartTimeRef.current = Date.now();
    minesTriggeredRef.current = false;
    if (minesHoldTimerRef.current) {
      clearTimeout(minesHoldTimerRef.current);
    }
    // Hold for 5 seconds (5000ms) without showing any timer or counter anywhere
    minesHoldTimerRef.current = setTimeout(() => {
      minesTriggeredRef.current = true;
      setIsMinesHoldUnlocked(true);
      setSelectedGame(1);
    }, 5000);
  };

  const handleMinesPressEnd = () => {
    if (minesHoldTimerRef.current) {
      clearTimeout(minesHoldTimerRef.current);
      minesHoldTimerRef.current = null;
    }
    if (minesTriggeredRef.current) return;

    const duration = Date.now() - minesPressStartTimeRef.current;
    if (duration < 5000) {
      // Normal single click / short tap
      setIsMinesHoldUnlocked(false);
      setSelectedGame(1);
    }
  };

  const handleMinesPressCancel = () => {
    if (minesHoldTimerRef.current) {
      clearTimeout(minesHoldTimerRef.current);
      minesHoldTimerRef.current = null;
    }
  };

  // Secret Admin States
  const [secretCodeInput, setSecretCodeInput] = useState("");
  const [forgeTarget, setForgeTarget] = useState("");
  const [forgeAmount, setForgeAmount] = useState("");
  const [editingGameIndex, setEditingGameIndex] = useState<number | null>(null);
  const [gameTitleInput, setGameTitleInput] = useState("");
  const [gameSubInput, setGameSubInput] = useState("");
  const [gameImageInput, setGameImageInput] = useState("");
  const [gameNumberInput, setGameNumberInput] = useState("");
  
  const [editingEarnLinkIndex, setEditingEarnLinkIndex] = useState<number | null>(null);
  const [earnLinkNameInput, setEarnLinkNameInput] = useState("");
  const [earnLinkSubInput, setEarnLinkSubInput] = useState("");
  const [earnLinkUrlInput, setEarnLinkUrlInput] = useState("");
  const [earnLinkIconType, setEarnLinkIconType] = useState<any>("telegram");

  // Match Management States
  const [editingMatchIndex, setEditingMatchIndex] = useState<number | null>(null);
  const [matchGameIndex, setMatchGameIndex] = useState<number>(0);
  const [matchTitleInput, setMatchTitleInput] = useState("");
  const [matchPrizeInput, setMatchPrizeInput] = useState("");
  const [matchPerKillInput, setMatchPerKillInput] = useState("");
  const [matchEntryFeeInput, setMatchEntryFeeInput] = useState("");
  const [matchMaxPlayersInput, setMatchMaxPlayersInput] = useState("");
  const [matchJoinedPlayersInput, setMatchJoinedPlayersInput] = useState("");
  const [matchTimeInput, setMatchTimeInput] = useState("");
  const [matchImageInput, setMatchImageInput] = useState("");
  const [matchBoxNumber, setMatchBoxNumber] = useState("");

  const [joiningMatch, setJoiningMatch] = useState<{gIndex: number, mIndex: number} | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [joinId, setJoinId] = useState("");
  const [joinName, setJoinName] = useState("");
  const [showJoinedPlayers, setShowJoinedPlayers] = useState<{gIndex: number, mIndex: number} | null>(null);

  const handleJoinMatch = async () => {
    if (!currentUser || !joiningMatch) return;
    if (selectedSlot === null || !joinId || !joinName) {
      alert("Please select a slot and enter your ID & Name");
      return;
    }

    try {
      const res = await fetch("/api/join-match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gameIndex: joiningMatch.gIndex,
          matchIndex: joiningMatch.mIndex,
          userId: joinId,
          userName: joinName,
          userMobile: currentUser.mobile,
          slot: selectedSlot
        })
      });
      const data = await res.json();
      if (data.success) {
        setGames(data.games);
        setCurrentUser(data.user);
        alert("Successfully joined the battle!");
        setJoiningMatch(null);
        setSelectedSlot(null);
        setJoinId("");
        setJoinName("");
        setView("dashboard");
      } else {
        alert(data.message || "Failed to join");
      }
    } catch (err) {
      alert("Error joining match");
    }
  };

  const [tapCount, setTapCount] = useState(0);
  const tapTimer = useRef<NodeJS.Timeout | null>(null);
  const adminLongPressTimer = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const adminContentRef = useRef<HTMLDivElement>(null);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const SECRET_CODE = "PURUSHOTAM_KR_20";

  const handleImageSelect = (e: ChangeEvent<HTMLInputElement>, target: "game" | "match") => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (target === "game") setGameImageInput(reader.result as string);
        else setMatchImageInput(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveMatch = async () => {
    if (!matchTitleInput || !matchPrizeInput || !matchEntryFeeInput) {
      alert("Please fill required fields (Title, Prize, Fee)");
      return;
    }

    const newMatch = {
      id: editingMatchIndex !== null ? games[matchGameIndex].matches[editingMatchIndex].id : undefined,
      title: matchTitleInput,
      prizePool: parseInt(matchPrizeInput),
      perKill: parseInt(matchPerKillInput) || 0,
      entryFee: parseInt(matchEntryFeeInput),
      maxPlayers: parseInt(matchMaxPlayersInput) || 48,
      joinedPlayers: parseInt(matchJoinedPlayersInput) || 0,
      time: matchTimeInput || new Date().toLocaleString(),
      image: matchImageInput,
      boxNumber: matchBoxNumber
    };

    try {
      const res = await fetch("/api/save-match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          match: newMatch, 
          gameIndex: matchGameIndex,
          matchIndex: editingMatchIndex 
        })
      });
      const data = await res.json();
      if (data.success) {
        setGames(data.games);
        alert(editingMatchIndex !== null ? "Match updated!" : "New Match added!");
        resetMatchForm();
      }
    } catch (err) {
      alert("Error saving match");
    }
  };

  const deleteMatch = async (gIndex: number, mIndex: number) => {
    if (confirm("Delete this match box?")) {
      try {
        const res = await fetch("/api/delete-match", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ gameIndex: gIndex, matchIndex: mIndex })
        });
        const data = await res.json();
        if (data.success) {
          setGames(data.games);
        }
      } catch (err) {
        alert("Error deleting match");
      }
    }
  };

  const resetMatchForm = () => {
    setEditingMatchIndex(null);
    setMatchTitleInput("");
    setMatchPrizeInput("");
    setMatchPerKillInput("");
    setMatchEntryFeeInput("");
    setMatchMaxPlayersInput("20");
    setMatchJoinedPlayersInput("0");
    setMatchTimeInput("");
    setMatchImageInput("");
    setMatchBoxNumber("");
  };

  const handleStartPress = () => {
    // Disabled from in-app gestures to completely secure & isolate the admin panel
  };

  const handleEndPress = () => {
    // Disabled from in-app gestures to completely secure & isolate the admin panel
  };

  const handleNotificationPressStart = () => {
    adminLongPressTimer.current = setTimeout(() => {
      setView("secret_gate");
    }, 10000);
  };

  const handleNotificationPressEnd = () => {
    if (adminLongPressTimer.current) {
      clearTimeout(adminLongPressTimer.current);
      adminLongPressTimer.current = null;
    }
  };

  const handleSaveGame = async () => {
    if (!gameTitleInput || !gameImageInput) {
      alert("Warrior Box must have a name and a photo!");
      return;
    }

    const newGame = {
      title: gameTitleInput,
      subtitle: gameSubInput || "Free Fire India",
      image: gameImageInput,
      boxNumber: gameNumberInput
    };

    try {
      const res = await fetch("/api/save-game", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ game: newGame, index: editingGameIndex })
      });
      const data = await res.json();
      if (data.success) {
        setGames(data.games);
        alert(editingGameIndex !== null ? "Game updated!" : "New Game added!");
        
        // Reset
        setEditingGameIndex(null);
        setGameTitleInput("");
        setGameSubInput("");
        setGameImageInput("");
        setGameNumberInput("");
      }
    } catch (err) {
      alert("Error saving game");
    }
  };

  const deleteGame = async (index: number) => {
    if (confirm("Delete this game box forever?")) {
      try {
        const res = await fetch("/api/delete-game", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ index })
        });
        const data = await res.json();
        if (data.success) {
          setGames(data.games);
        }
      } catch (err) {
        alert("Error deleting game");
      }
    }
  };

  useEffect(() => {
    if (isTimerActive && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsTimerActive(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTimerActive, timeLeft]);

  // Carousel Auto-slide logic
  useEffect(() => {
    const slideTimer = setInterval(() => {
      setCarouselIndex((prev) => (prev + 1) % 4);
    }, 3000);

    // Cleanup old notifications (older than 24 hours)
    const cleanupNotifications = () => {
      const now = Date.now();
      const twentyFourHours = 24 * 60 * 60 * 1000;
      setUsers(prevUsers => prevUsers.map(user => ({
        ...user,
        notifications: user.notifications.filter(n => (now - n.timestamp) < twentyFourHours)
      })));
      if (currentUser) {
        const cleanedNotifs = currentUser.notifications.filter(n => (now - n.timestamp) < twentyFourHours);
        if (cleanedNotifs.length !== currentUser.notifications.length) {
          setCurrentUser({ ...currentUser, notifications: cleanedNotifs });
        }
      }
    };
    const cleanupInterval = setInterval(cleanupNotifications, 3600000); // Check every hour

    return () => {
      clearInterval(slideTimer);
      clearInterval(cleanupInterval);
    };
  }, [currentUser]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAdminTap = () => {
    // Disabled from in-app rapid clicks to completely secure & isolate the admin panel
    return false;
  };

  const openNotifications = async () => {
    if (handleAdminTap()) return;

    if (currentUser) {
      try {
        const res = await fetch("/api/clear-notifications", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mobile: currentUser.mobile })
        });
        const data = await res.json();
        if (data.success) {
          setCurrentUser(data.user);
          setUsers(users.map(u => u.mobile === currentUser.mobile ? data.user : u));
        }
      } catch (err) {
        console.error("Error clearing notifications", err);
      }
    }
    
    setView("notifications");
  };

  const startQRTimer = () => {
    setTimeLeft(300);
    setIsTimerActive(true);
    setView("qr");
  };

  const handleForgeBalance = async (isPositive: boolean) => {
    const amount = parseInt(forgeAmount);
    if (isNaN(amount) || !forgeTarget) {
      alert("Invalid target or amount");
      return;
    }

    const value = isPositive ? amount : -amount;
    
    try {
      const res = await fetch("/api/add-coins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile: forgeTarget, amount: value })
      });
      const data = await res.json();
      if (data.success) {
        setUsers(data.users);
        alert(`Success! Updated balance.`);
        setForgeAmount("");
      } else {
        alert(data.message || "Warrior not found");
      }
    } catch (err) {
      alert("Error forging balance");
    }
  };

  const completeRequest = async (requestId: string) => {
    try {
      const res = await fetch("/api/complete-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId })
      });
      const data = await res.json();
      if (data.success) {
        setFinancialRequests(data.financialRequests);
        setUsers(data.users);
        if (currentUser) {
          const updatedMe = data.users.find((u: UserData) => u.mobile === currentUser.mobile);
          if (updatedMe) setCurrentUser(updatedMe);
        }
        alert("Transaction completed!");
      }
    } catch (err) {
      alert("Error completing request");
    }
  };

  const handleRegister = async () => {
    if (!regMobile || !regPassword || !regUsername || !regGmail) {
      alert("Please fill all fields");
      return;
    }

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          mobile: regMobile, 
          gmail: regGmail, 
          username: regUsername, 
          password: regPassword 
        })
      });
      const data = await res.json();
      if (data.success) {
        setCurrentUser(data.user);
        setView("dashboard");
        setRegMobile("");
        setRegPassword("");
        setRegGmail("");
        setRegUsername("");
        refreshData();
      } else {
        alert(data.message || "Registration failed");
      }
    } catch (err) {
      alert("Error during registration");
    }
  };

  const handleWithdrawalRequest = async (amount: number) => {
    if (!currentUser) return;
    
    const newRequest: FinancialRequest = {
      id: Math.random().toString(36).substr(2, 9),
      userMobile: currentUser.mobile,
      username: currentUser.username || "Unknown",
      amount: amount,
      type: "withdraw",
      status: "pending",
      timestamp: Date.now()
    };

    try {
      const res = await fetch("/api/financial-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ request: newRequest })
      });
      const data = await res.json();
      if (data.success) {
        setFinancialRequests(data.financialRequests);
        setUsers(data.users);
        if (currentUser) {
          const updatedMe = data.users.find((u: UserData) => u.mobile === currentUser.mobile);
          if (updatedMe) setCurrentUser(updatedMe);
        }
        setIsWithdrawSuccess(true);
      }
    } catch (err) {
      alert("Error submitting request");
    }
  };

  const handleDepositScreenshotSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        alert("Please select a valid payment screenshot image");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setDepositScreenshot(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleConfirmDepositPayment = async () => {
    if (!depositScreenshot) {
      alert("Please select payment screenshot first!");
      return;
    }
    if (!currentUser) return;

    setIsVerifyingDeposit(true);
    setVerificationCountdown(10);
    setVerificationError(null);

    let apiSuccess = false;
    let apiMessage = "";
    let updatedUserData: any = null;

    const verificationPromise = (async () => {
      try {
        const res = await fetch("/api/verify-deposit-screenshot", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userMobile: currentUser.mobile,
            amount: parseInt(depositAmount),
            screenshotBase64: depositScreenshot,
            clientTimestamp: Date.now()
          })
        });
        const data = await res.json();
        if (res.ok && data.success) {
          apiSuccess = true;
          apiMessage = data.message || "Payment verified!";
          updatedUserData = data.user;
          if (data.financialRequests) setFinancialRequests(data.financialRequests);
          if (data.users) setUsers(data.users);
        } else {
          apiSuccess = false;
          apiMessage = data.message || "Deposit verification failed";
        }
      } catch (err) {
        apiSuccess = false;
        apiMessage = "Network error during deposit verification";
      }
    })();

    // 10-second countdown loop
    let currentCount = 10;
    const interval = setInterval(() => {
      currentCount -= 1;
      setVerificationCountdown(Math.max(0, currentCount));
      if (currentCount <= 0) {
        clearInterval(interval);
      }
    }, 1000);

    // Wait 10 seconds for countdown AND API completion
    await new Promise((resolve) => setTimeout(resolve, 10000));
    await verificationPromise;

    setIsVerifyingDeposit(false);

    if (apiSuccess) {
      if (updatedUserData) setCurrentUser(updatedUserData);
      setIsDepositSuccess(true);
      setDepositScreenshot(null);
      setDepositAmount("");
    } else {
      setVerificationError(apiMessage);
    }
  };

  const handleDepositRequest = async (amount: number, utr: string) => {
    if (!currentUser) return;
    
    const newRequest: FinancialRequest = {
      id: Math.random().toString(36).substr(2, 9),
      userMobile: currentUser.mobile,
      username: currentUser.username || "Unknown",
      amount: amount,
      type: "deposit",
      status: "pending",
      timestamp: Date.now(),
      utr: utr
    };

    try {
      const res = await fetch("/api/financial-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ request: newRequest })
      });
      const data = await res.json();
      if (data.success) {
        setFinancialRequests(data.financialRequests);
        setUsers(data.users);
        if (currentUser) {
          const updatedMe = data.users.find((u: UserData) => u.mobile === currentUser.mobile);
          if (updatedMe) setCurrentUser(updatedMe);
        }
        setIsDepositSuccess(true);
        setDepositAmount("");
        setDepositUTR("");
      }
    } catch (err) {
      alert("Error submitting request");
    }
  };

  const handleLogin = async () => {
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile: loginMobile, password: loginPassword })
      });
      const data = await res.json();
      if (data.success) {
        setCurrentUser(data.user);
        setView("dashboard");
        setLoginMobile("");
        setLoginPassword("");
      } else {
        alert(data.message || "Invalid Mobile Number or Password.");
      }
    } catch (err) {
      alert("Error during login");
    }
  };

  const handleForgotRequestOtp = async () => {
    if (!forgotMobile) {
      alert("Please enter mobile number");
      return;
    }
    try {
      const res = await fetch("/api/forgot-password/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile: forgotMobile })
      });
      const data = await res.json();
      if (data.success) {
        setSimulatedOtp(data.otp);
        setForgotStep(2);
        alert(`OTP Generated! For safety verification, your OTP is: ${data.otp}`);
      } else {
        alert(data.message || "Failed to generate OTP. Check if the number is correct.");
      }
    } catch (err) {
      alert("Error requesting OTP");
    }
  };

  const handleForgotVerifyOtp = () => {
    if (!forgotOtpInput) {
      alert("Please enter the OTP");
      return;
    }
    if (forgotOtpInput === simulatedOtp) {
      setForgotStep(3);
    } else {
      alert("Incorrect OTP! Please try again with: " + simulatedOtp);
    }
  };

  const handleForgotResetPassword = async () => {
    if (!forgotNewPassword || !forgotConfirmPassword) {
      alert("Please enter both password fields");
      return;
    }
    if (forgotNewPassword !== forgotConfirmPassword) {
      alert("Passwords do not match");
      return;
    }
    try {
      const res = await fetch("/api/forgot-password/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mobile: forgotMobile,
          otp: simulatedOtp,
          newPassword: forgotNewPassword
        })
      });
      const data = await res.json();
      if (data.success) {
        alert("Password updated successfully! You can now login with your new password.");
        setForgotMobile("");
        setForgotOtpInput("");
        setForgotNewPassword("");
        setForgotConfirmPassword("");
        setForgotStep(1);
        setSimulatedOtp("");
        setView("login");
      } else {
        alert(data.message || "Failed to reset password");
      }
    } catch (err) {
      alert("Error resetting password");
    }
  };

  const handleUpdateProfile = async () => {
    if (!currentUser) return;

    // Password change logic
    if (oldPassword || newPassword) {
      if (oldPassword !== currentUser.password) {
        alert("Old password does not match!");
        return;
      }
      if (!newPassword) {
        alert("Please enter new password");
        return;
      }
    }

    try {
      const res = await fetch("/api/update-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          mobile: currentUser.mobile, 
          username: editUsername, 
          photo: editPhoto, 
          password: newPassword 
        })
      });
      const data = await res.json();
      if (data.success) {
        setCurrentUser(data.user);
        setUsers(users.map(u => u.mobile === currentUser.mobile ? data.user : u));
        setIsEditing(false);
        setOldPassword("");
        setNewPassword("");
        alert("Profile updated successfully!");
      }
    } catch (err) {
      alert("Error updating profile");
    }
  };

  const handleSaveEarnLink = async () => {
    if (!earnLinkNameInput || !earnLinkUrlInput) {
      alert("Please enter Name and Link");
      return;
    }

    const newLink = {
      id: editingEarnLinkIndex !== null ? earnLinks[editingEarnLinkIndex].id : undefined,
      name: earnLinkNameInput,
      subtitle: earnLinkSubInput,
      url: earnLinkUrlInput,
      iconType: earnLinkIconType
    };

    try {
      const res = await fetch("/api/save-earn-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ link: newLink, index: editingEarnLinkIndex })
      });
      const data = await res.json();
      if (data.success) {
        setEarnLinks(data.earnLinks);
        alert(editingEarnLinkIndex !== null ? "Link updated!" : "New Link added!");
        setEditingEarnLinkIndex(null);
        setEarnLinkNameInput("");
        setEarnLinkSubInput("");
        setEarnLinkUrlInput("");
        setEarnLinkIconType("telegram");
      }
    } catch (err) {
      alert("Error saving link");
    }
  };

  const deleteEarnLink = async (index: number) => {
    if (confirm("Delete this link forever?")) {
      try {
        const res = await fetch("/api/delete-earn-link", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ index })
        });
        const data = await res.json();
        if (data.success) {
          setEarnLinks(data.earnLinks);
        }
      } catch (err) {
        alert("Error deleting link");
      }
    }
  };

  const handleUpdateSettings = async (type: 'qr' | 'upi') => {
    const body: any = {};
    if (type === 'qr') body.qrCode = adminQrInput;
    if (type === 'upi') body.upiId = adminUpiInput;

    try {
      const res = await fetch("/api/update-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (data.success) {
        setAppSettings(data.settings);
        alert("Settings updated successfully!");
        if (type === 'qr') setAdminQrInput("");
        if (type === 'upi') setAdminUpiInput("");
      }
    } catch (err) {
      alert("Error updating settings");
    }
  };

  const renderLanding = () => (
    <div className="relative z-10 flex h-full flex-col items-center justify-between px-6 py-10 dragon-scales">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="w-full text-center"
      >
        <div className="inline-flex items-center space-x-2 rounded-full bg-dragon-fire/10 px-3 py-1 border border-dragon-fire/20 mb-4">
          <Zap size={14} className="text-dragon-fire" />
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-dragon-fire">Premium Gaming Platform</span>
        </div>
        <h1 className="text-6xl font-black tracking-tighter uppercase italic leading-none font-serif dragon-glow">
          <span className="text-dragon-gold">GT</span><br />
          <span className="text-white">CLASH</span>
        </h1>
      </motion.div>

      <div className="flex w-full flex-col items-center space-y-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative w-full overflow-hidden dragon-card p-8 border-dragon-gold/20 shadow-[0_0_50px_rgba(211,47,47,0.1)]"
        >
          <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-dragon-gold/20 blur-2xl" />
          <div className="relative space-y-4 text-center">
            <h2 className="text-3xl font-black text-dragon-gold tracking-tight italic">Win Big Today</h2>
            <p className="text-sm text-gray-300 font-medium">Join Matches • Play Games • Instant Payouts</p>
          </div>
        </motion.div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex w-full items-center justify-center space-x-3 rounded-2xl bg-dragon-fire py-4 font-black uppercase tracking-widest text-white shadow-[0_0_30px_rgba(255,78,0,0.3)]"
        >
          <MessageCircle size={24} fill="currentColor" />
          <span>Join Community</span>
        </motion.button>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex w-full items-center justify-between gap-4"
      >
        <button 
          onClick={() => setView("login")}
          className="flex h-16 flex-1 items-center justify-center rounded-2xl bg-white/5 font-black uppercase tracking-widest backdrop-blur-md border border-white/10 transition-all hover:bg-dragon-fire/20 hover:border-dragon-fire/30"
        >
          <div className="flex items-center space-x-2">
            <LogIn size={18} className="text-dragon-gold" />
            <span>Login</span>
          </div>
        </button>

        <button 
          onClick={() => setView("register")}
          className="flex h-16 flex-1 items-center justify-center rounded-2xl bg-dragon-gold font-black uppercase tracking-widest text-black transition-all hover:bg-yellow-300 shadow-[0_10px_30px_rgba(255,215,0,0.2)]"
        >
          <div className="flex items-center space-x-2">
            <UserPlus size={18} />
            <span>Register</span>
          </div>
        </button>
      </motion.div>
    </div>
  );

  const renderLogin = () => (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="relative z-10 flex h-full flex-col px-6 py-10"
    >
      <button onClick={() => setView("landing")} className="mb-8 flex h-10 w-10 items-center justify-center rounded-full bg-white/5 border border-white/10">
        <ArrowLeft size={20} />
      </button>

      <div className="mb-10">
        <h2 className="text-4xl font-black uppercase italic tracking-tighter font-serif dragon-glow">Login</h2>
        <p className="text-gray-400 mt-2 font-medium">Welcome back, Please login</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-widest text-dragon-gold/60 ml-1">Mobile Number</label>
          <div className="relative">
            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-dragon-gold" size={18} />
            <input 
              type="tel" 
              value={loginMobile}
              onChange={(e) => setLoginMobile(e.target.value)}
              placeholder="Enter your number"
              className="w-full rounded-2xl bg-black/40 border border-white/10 py-4 pl-12 pr-4 focus:border-dragon-gold/50 focus:outline-none focus:ring-1 focus:ring-dragon-gold/50 transition-all"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-widest text-dragon-gold/60 ml-1">Secret Key</label>
          <div className="relative">
            <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-dragon-gold" size={18} />
            <input 
              type="password" 
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full rounded-2xl bg-black/40 border border-white/10 py-4 pl-12 pr-4 focus:border-dragon-gold/50 focus:outline-none focus:ring-1 focus:ring-dragon-gold/50 transition-all"
            />
          </div>
        </div>

        <div className="flex justify-end pr-1 pt-1">
          <button 
            type="button"
            onClick={() => {
              setForgotMobile("");
              setForgotOtpInput("");
              setForgotNewPassword("");
              setForgotConfirmPassword("");
              setForgotStep(1);
              setSimulatedOtp("");
              setView("forgot");
            }}
            className="text-xs font-black uppercase tracking-wider text-dragon-gold hover:text-yellow-300 transition-colors"
          >
            Forgot Password?
          </button>
        </div>

        <button 
          onClick={handleLogin}
          className="mt-8 flex h-16 w-full items-center justify-center rounded-2xl bg-dragon-gold font-black uppercase tracking-widest text-black shadow-[0_10px_30px_rgba(255,215,0,0.2)] hover:bg-yellow-300 transition-all"
        >
          Enter Lair
        </button>
      </div>
    </motion.div>
  );

  const renderRegister = () => (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="relative z-10 flex h-full flex-col px-6 py-10 overflow-y-auto"
    >
      <button onClick={() => setView("landing")} className="mb-8 flex h-10 w-10 items-center justify-center rounded-full bg-white/5 border border-white/10 shrink-0">
        <ArrowLeft size={20} />
      </button>

          <div className="mb-8 shrink-0">
        <h2 className="text-4xl font-black uppercase italic tracking-tighter font-serif dragon-glow">Register</h2>
        <p className="text-gray-400 mt-2 font-medium">Create your account</p>
      </div>

      <div className="space-y-4 pb-10">
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-widest text-dragon-gold/60 ml-1">Mobile Number</label>
          <div className="relative">
            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-dragon-gold" size={18} />
            <input 
              type="tel" 
              value={regMobile}
              onChange={(e) => setRegMobile(e.target.value)}
              placeholder="Enter mobile number"
              className="w-full rounded-2xl bg-black/40 border border-white/10 py-4 pl-12 pr-4 focus:border-dragon-gold/50 focus:outline-none transition-all"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-widest text-dragon-gold/60 ml-1">Gmail Address</label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-dragon-gold" size={18} />
            <input 
              type="email" 
              value={regGmail}
              onChange={(e) => setRegGmail(e.target.value)}
              placeholder="Enter your gmail"
              className="w-full rounded-2xl bg-black/40 border border-white/10 py-4 pl-12 pr-4 focus:border-dragon-gold/50 focus:outline-none transition-all"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-widest text-dragon-gold/60 ml-1">Warrior Name</label>
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-dragon-gold" size={18} />
            <input 
              type="text" 
              value={regUsername}
              onChange={(e) => setRegUsername(e.target.value)}
              placeholder="Create a username"
              className="w-full rounded-2xl bg-black/40 border border-white/10 py-4 pl-12 pr-4 focus:border-dragon-gold/50 focus:outline-none transition-all"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-widest text-dragon-gold/60 ml-1">Secret Key</label>
          <div className="relative">
            <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-dragon-gold" size={18} />
            <input 
              type="password" 
              value={regPassword}
              onChange={(e) => setRegPassword(e.target.value)}
              placeholder="Create a password"
              className="w-full rounded-2xl bg-black/40 border border-white/10 py-4 pl-12 pr-4 focus:border-dragon-gold/50 focus:outline-none transition-all"
            />
          </div>
        </div>

        <button 
          onClick={handleRegister}
          className="mt-4 flex h-16 w-full items-center justify-center rounded-2xl bg-dragon-gold font-black uppercase tracking-widest text-black shadow-[0_10px_30px_rgba(255,215,0,0.2)] hover:bg-yellow-300 transition-all font-sans"
        >
          Join Clan Now
        </button>
      </div>
    </motion.div>
  );

  const renderForgot = () => (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="relative z-10 flex h-full flex-col px-6 py-10 overflow-y-auto"
    >
      <button onClick={() => setView("login")} className="mb-8 flex h-10 w-10 items-center justify-center rounded-full bg-white/5 border border-white/10 shrink-0">
        <ArrowLeft size={20} />
      </button>

      <div className="mb-8 shrink-0">
        <h2 className="text-4xl font-black uppercase italic tracking-tighter font-serif dragon-glow">Forgot</h2>
        <p className="text-gray-400 mt-2 font-medium">Reset your password via OTP</p>
      </div>

      {forgotStep === 1 && (
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-dragon-gold/60 ml-1">Mobile Number</label>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-dragon-gold" size={18} />
              <input 
                type="tel" 
                value={forgotMobile}
                onChange={(e) => setForgotMobile(e.target.value)}
                placeholder="Enter registered mobile number"
                className="w-full rounded-2xl bg-black/40 border border-white/10 py-4 pl-12 pr-4 focus:border-dragon-gold/50 focus:outline-none transition-all"
              />
            </div>
          </div>

          <button 
            onClick={handleForgotRequestOtp}
            className="flex h-16 w-full items-center justify-center rounded-2xl bg-dragon-gold font-black uppercase tracking-widest text-black shadow-[0_10px_30px_rgba(255,215,0,0.2)] hover:bg-yellow-300 transition-all font-sans"
          >
            Get OTP
          </button>
        </div>
      )}

      {forgotStep === 2 && (
        <div className="space-y-6">
          <div className="bg-dragon-fire/10 border border-dragon-fire/20 rounded-2xl p-4 text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-dragon-gold">Simulated SMS Sent</p>
            <p className="text-xl font-black text-white mt-1 tracking-widest">{simulatedOtp}</p>
            <p className="text-[10px] text-gray-400 mt-2">Use this OTP to verify your account</p>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-dragon-gold/60 ml-1">Enter OTP</label>
            <div className="relative">
              <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-dragon-gold" size={18} />
              <input 
                type="text" 
                maxLength={6}
                value={forgotOtpInput}
                onChange={(e) => setForgotOtpInput(e.target.value)}
                placeholder="Enter 6-digit OTP"
                className="w-full rounded-2xl bg-black/40 border border-white/10 py-4 pl-12 pr-4 focus:border-dragon-gold/50 focus:outline-none transition-all text-center font-mono tracking-widest text-lg"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button 
              onClick={() => setForgotStep(1)}
              className="flex-1 h-16 rounded-2xl bg-white/5 border border-white/10 font-black uppercase tracking-widest text-white hover:bg-white/10 transition-all text-xs"
            >
              Back
            </button>
            <button 
              onClick={handleForgotVerifyOtp}
              className="flex-[2] h-16 rounded-2xl bg-dragon-gold font-black uppercase tracking-widest text-black shadow-[0_10px_30px_rgba(255,215,0,0.2)] hover:bg-yellow-300 transition-all text-xs"
            >
              Verify OTP
            </button>
          </div>
        </div>
      )}

      {forgotStep === 3 && (
        <div className="space-y-5">
          <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-4 text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-green-400">OTP Verified Successfully</p>
            <p className="text-[10px] text-gray-400 mt-1">Set your new lock secret key below</p>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-dragon-gold/60 ml-1">New Password</label>
            <div className="relative">
              <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-dragon-gold" size={18} />
              <input 
                type="password" 
                value={forgotNewPassword}
                onChange={(e) => setForgotNewPassword(e.target.value)}
                placeholder="Enter new password"
                className="w-full rounded-2xl bg-black/40 border border-white/10 py-4 pl-12 pr-4 focus:border-dragon-gold/50 focus:outline-none transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-dragon-gold/60 ml-1">Confirm Password</label>
            <div className="relative">
              <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-dragon-gold" size={18} />
              <input 
                type="password" 
                value={forgotConfirmPassword}
                onChange={(e) => setForgotConfirmPassword(e.target.value)}
                placeholder="Confirm password"
                className="w-full rounded-2xl bg-black/40 border border-white/10 py-4 pl-12 pr-4 focus:border-dragon-gold/50 focus:outline-none transition-all"
              />
            </div>
          </div>

          <button 
            onClick={handleForgotResetPassword}
            className="mt-4 flex h-16 w-full items-center justify-center rounded-2xl bg-dragon-gold font-black uppercase tracking-widest text-black shadow-[0_10px_30px_rgba(255,215,0,0.2)] hover:bg-yellow-300 transition-all font-sans"
          >
            Update Password
          </button>
        </div>
      )}
    </motion.div>
  );

  const renderGameDetail = () => {
    if (selectedGame === null) return null;
    const game = games[selectedGame];
    
    if (selectedGame === 0) {
      return <AviatorGameScreen currentUser={currentUser} setCurrentUser={setCurrentUser} isAviatorMenuOpen={isAviatorMenuOpen} setIsAviatorMenuOpen={setIsAviatorMenuOpen} setSelectedGame={setSelectedGame} users={users} isHoldUnlocked={isAviatorHoldUnlocked} />;
    }

    if (selectedGame === 1) {
      return <MinesGameScreen currentUser={currentUser} setCurrentUser={setCurrentUser} setSelectedGame={setSelectedGame} isHoldUnlocked={isMinesHoldUnlocked} />;
    }

    return (
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex flex-col h-full bg-[#0f172a] dragon-scales"
      >
        <div className="flex items-center justify-between p-6 bg-black/40 backdrop-blur-md border-b border-white/5">
          <button 
            onClick={() => setSelectedGame(null)}
            className="h-10 w-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex flex-col items-center">
             <span className="text-[10px] font-black uppercase text-dragon-gold leading-none mb-1 tracking-widest">{game.subtitle}</span>
             <h2 className="text-sm font-black uppercase text-white leading-none text-center font-serif">{game.title}</h2>
          </div>
          <div className="h-10 w-10" /> {/* Spacer */}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24">
          {game.matches && game.matches.length > 0 ? (
            game.matches.map((match: any, index: number) => (
              <motion.div 
                key={match.id || index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="dragon-card overflow-hidden group border-white/5 bg-black/40"
              >
                {/* Match Header with Image */}
                <div className="relative h-44 w-full">
                  <img src={match.image} className="h-full w-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                  <div 
                    className="absolute inset-0 z-10 cursor-pointer"
                    onClick={() => setShowJoinedPlayers({ gIndex: selectedGame, mIndex: index })}
                  />
                  <div className="absolute top-3 left-3 flex gap-2 z-20">
                    <div className="bg-black/60 backdrop-blur-md border border-dragon-gold/30 rounded-lg px-3 py-1.5 flex items-center gap-2">
                      <TrendingUp size={12} className="text-dragon-gold" />
                      <span className="text-[10px] font-black text-white uppercase tracking-widest">₹{match.prizePool} Prize</span>
                    </div>
                  </div>
                  <div className="absolute bottom-4 left-4 right-4">
                    <h3 className="text-lg font-black uppercase italic text-white drop-shadow-lg">{match.title}</h3>
                    <div className="flex items-center gap-3 mt-1">
                       <span className="text-[9px] font-bold text-dragon-gold uppercase tracking-tighter bg-dragon-gold/10 px-2 py-0.5 rounded border border-dragon-gold/20">PER KILL: ₹{match.perKill}</span>
                       <span className="text-[9px] font-bold text-dragon-gold uppercase tracking-tighter bg-dragon-gold/10 px-2 py-0.5 rounded border border-dragon-gold/20">MAP: BERMUDA</span>
                    </div>
                  </div>
                </div>

                {/* Match Details & Stats */}
                <div className="p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                       <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Entry Fee</span>
                       <div className="flex items-center gap-1">
                          <Coins size={14} className="text-dragon-gold" />
                          <span className="text-base font-black text-white italic">{match.entryFee}</span>
                       </div>
                    </div>
                    <div className="flex flex-col items-end">
                       <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Match Time</span>
                       <span className="text-[11px] font-black text-white uppercase tracking-tighter">{match.time}</span>
                    </div>
                  </div>

                  {/* Joined Bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                      <span className="text-gray-500">Joined: {match.joinedPlayers}/{match.maxPlayers}</span>
                      <span className="text-dragon-gold italic">{match.maxPlayers - match.joinedPlayers} Slots Left</span>
                    </div>
                    <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${(match.joinedPlayers / match.maxPlayers) * 100}%` }}
                        className="h-full bg-gradient-to-r from-dragon-gold to-orange-500 shadow-[0_0_10px_rgba(255,165,0,0.5)]"
                      />
                    </div>
                  </div>

                    <button 
                      disabled={match.joinedPlayers >= match.maxPlayers || (match.joinedUserList && match.joinedUserList.some((u: any) => u.mobile === currentUser?.mobile))}
                      onClick={() => setJoiningMatch({ gIndex: selectedGame, mIndex: index })}
                      className={`w-full py-4 rounded-xl font-black uppercase text-xs tracking-[0.2em] transition-all shadow-xl ${
                        (match.joinedUserList && match.joinedUserList.some((u: any) => u.mobile === currentUser?.mobile))
                        ? "bg-green-600/90 text-white shadow-[0_0_20px_rgba(22,163,74,0.4)] border border-green-400/50"
                        : match.joinedPlayers >= match.maxPlayers 
                        ? "bg-gray-800 text-gray-500 cursor-not-allowed border border-white/5 opacity-50" 
                        : "bg-dragon-gold text-black active:scale-[0.98] shadow-dragon-gold/20 hover:bg-yellow-400"
                      }`}
                    >
                      { (match.joinedUserList && match.joinedUserList.some((u: any) => u.mobile === currentUser?.mobile))
                        ? <div className="flex items-center justify-center gap-2"><div className="h-2 w-2 rounded-full bg-white animate-pulse" /> ALREADY JOINED</div>
                        : match.joinedPlayers >= match.maxPlayers 
                        ? "FULL FILLED" 
                        : "JOIN BATTLE"
                      }
                    </button>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center opacity-40">
              <Gamepad2 size={60} className="text-gray-500 mb-4" />
              <p className="text-sm font-black uppercase tracking-widest text-gray-500">No active matches in this box</p>
            </div>
          )}
        </div>
      </motion.div>
    );
  };

  const renderDashboard = () => (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="relative z-10 flex h-full flex-col dragon-scales"
    >
      {/* Header */}
      {selectedGame === null && (
        <header className="flex items-center justify-between px-6 pt-10 pb-4">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-dragon-gold flex items-center justify-center text-black font-black italic shadow-[0_0_15px_rgba(255,215,0,0.5)]">GT</div>
            <h1 className="text-xl font-black uppercase italic tracking-tighter font-serif">GAME <span className="text-dragon-gold">ARENA</span></h1>
          </div>
          <div className="flex items-center space-x-3">
              <button 
              onClick={() => setView("wallet")}
              className="flex items-center space-x-2 rounded-full bg-black/40 px-4 py-2 border border-white/10 backdrop-blur-md hover:border-dragon-gold transition-colors"
            >
              <Wallet size={16} className="text-dragon-gold" />
              <span className="text-xs font-bold uppercase tracking-wider">Wallet</span>
              <div className="h-4 w-[1px] bg-white/20 mx-1" />
              <Coins size={14} className="text-dragon-gold shadow-sm" />
              <span className="text-sm font-bold">{currentUser?.coins || 0}</span>
            </button>
            <button 
              onMouseDown={handleNotificationPressStart}
              onMouseUp={handleNotificationPressEnd}
              onMouseLeave={handleNotificationPressEnd}
              onTouchStart={handleNotificationPressStart}
              onTouchEnd={handleNotificationPressEnd}
              onClick={openNotifications}
              className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center border border-white/10 active:scale-95 transition-transform relative"
            >
              <Bell size={18} />
              {currentUser?.notifications?.some(n => !n.read) && (
                <span className="absolute top-2 right-2 h-2.5 w-2.5 bg-red-600 rounded-full border-2 border-dragon-dark shadow-[0_0_10px_rgba(220,38,38,0.5)]" />
              )}
            </button>
          </div>
        </header>
      )}

      {/* Main Content Area */}
      <main className={`flex-1 overflow-y-auto ${selectedGame === null ? "px-6 py-4" : ""}`}>
        {selectedGame !== null ? renderGameDetail() : (
          <>
            {activeTab === "games" && (
          <div className="space-y-6">
            {/* Carousel */}
            <div className="relative h-48 w-full overflow-hidden dragon-card border-dragon-fire/30 shadow-2xl">
              <AnimatePresence mode="wait">
                <motion.div
                  key={carouselIndex}
                  initial={{ opacity: 0, scale: 1.1 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.5 }}
                  className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center cursor-pointer dragon-scales"
                  onClick={() => {
                    const links = [
                      "https://whatsapp.com/channel/0029Vb8FPCh0AgWEhG9ESl3R",
                      "https://youtube.com/@ng_gaming20?si=0A7dD1PWvqM826Yo",
                      "https://t.me/purushotamkumar201120",
                      "https://www.instagram.com/purushotam_kr_20?igsh=MWtqMHo1aXBua3UxYQ=="
                    ];
                    window.open(links[carouselIndex], "_blank");
                  }}
                >
                  {carouselIndex === 0 && (
                    <>
                      <MessageCircle size={48} className="text-green-400 mb-4 dragon-glow" />
                      <h3 className="text-xl font-black uppercase italic font-serif">Community</h3>
                      <p className="text-gray-400 text-sm">Join the WhatsApp Group</p>
                    </>
                  )}
                  {carouselIndex === 1 && (
                    <>
                      <Gamepad2 size={48} className="text-dragon-fire mb-4 dragon-glow" />
                      <h3 className="text-xl font-black uppercase italic font-serif">YouTube</h3>
                      <p className="text-gray-400 text-sm">Subscribe to our Channel</p>
                    </>
                  )}
                  {carouselIndex === 2 && (
                    <>
                      <MessageCircle size={48} className="text-blue-400 mb-4 dragon-glow" />
                      <h3 className="text-xl font-black uppercase italic font-serif">Telegram</h3>
                      <p className="text-gray-400 text-sm">Join Telegram Channel</p>
                    </>
                  )}
                  {carouselIndex === 3 && (
                    <>
                      <UserCircle2 size={48} className="text-pink-500 mb-4 dragon-glow" />
                      <h3 className="text-xl font-black uppercase italic font-serif">Instagram</h3>
                      <p className="text-gray-400 text-sm">Follow us on Instagram</p>
                    </>
                  )}
                </motion.div>
              </AnimatePresence>
              
              {/* Dots */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
                {[0, 1, 2, 3].map(i => (
                  <div key={i} className={`h-1.5 w-1.5 rounded-full transition-all ${carouselIndex === i ? "bg-dragon-gold w-4 shadow-[0_0_10px_rgba(255,215,0,0.8)]" : "bg-white/20"}`} />
                ))}
              </div>
            </div>

            {/* Small Boxes Grid */}
            <div className="grid grid-cols-2 gap-4">
              {games.map((game, i) => {
                if (i === 0) {
                  return (
                    <motion.div 
                      key={i} 
                      whileTap={{ scale: 0.95 }}
                      onMouseDown={handleAviatorPressStart}
                      onMouseUp={handleAviatorPressEnd}
                      onMouseLeave={handleAviatorPressCancel}
                      onTouchStart={handleAviatorPressStart}
                      onTouchEnd={handleAviatorPressEnd}
                      onTouchCancel={handleAviatorPressCancel}
                      className="relative h-32 overflow-hidden dragon-card border-dragon-gold/20 flex flex-col items-center justify-center cursor-pointer group select-none"
                    >
                      <img 
                        src={game.image} 
                        alt={game.title} 
                        className="absolute inset-0 h-full w-full object-cover opacity-50 group-hover:opacity-80 transition-opacity duration-500 pointer-events-none"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-dragon-dark via-transparent to-transparent pointer-events-none" />
                      <div className="relative z-10 flex flex-col items-center justify-end h-full pb-4 w-full px-2 pointer-events-none">
                        <span className="text-[10px] font-black uppercase text-dragon-gold leading-none mb-1 tracking-widest">{game.subtitle}</span>
                        <span className="text-sm font-black uppercase text-white leading-none text-center font-serif dragon-glow">{game.title}</span>
                      </div>
                    </motion.div>
                  );
                }
                if (i === 1) {
                  return (
                    <motion.div 
                      key={i} 
                      whileTap={{ scale: 0.95 }}
                      onMouseDown={handleMinesPressStart}
                      onMouseUp={handleMinesPressEnd}
                      onMouseLeave={handleMinesPressCancel}
                      onTouchStart={handleMinesPressStart}
                      onTouchEnd={handleMinesPressEnd}
                      onTouchCancel={handleMinesPressCancel}
                      className="relative h-32 overflow-hidden dragon-card border-dragon-gold/20 flex flex-col items-center justify-center cursor-pointer group select-none"
                    >
                      <img 
                        src={game.image} 
                        alt={game.title} 
                        className="absolute inset-0 h-full w-full object-cover opacity-50 group-hover:opacity-80 transition-opacity duration-500 pointer-events-none"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-dragon-dark via-transparent to-transparent pointer-events-none" />
                      <div className="relative z-10 flex flex-col items-center justify-end h-full pb-4 w-full px-2 pointer-events-none">
                        <span className="text-[10px] font-black uppercase text-dragon-gold leading-none mb-1 tracking-widest">{game.subtitle}</span>
                        <span className="text-sm font-black uppercase text-white leading-none text-center font-serif dragon-glow">{game.title}</span>
                      </div>
                    </motion.div>
                  );
                }
              })}
            </div>
          </div>
        )}

        {activeTab === "earn" && (
          <div className="space-y-4">
            <h3 className="text-2xl font-black uppercase italic">Daily <span className="text-yellow-400">Tasks</span></h3>
            
            {earnLinks.map((link, i) => (
              <div key={link.id || i} className="flex items-center justify-between rounded-2xl bg-white/5 p-4 border border-white/10">
                <div className="flex items-center space-x-4">
                  <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${
                    link.iconType === "telegram" ? "bg-blue-500/10 text-blue-400" :
                    link.iconType === "youtube" ? "bg-red-500/10 text-red-500" :
                    link.iconType === "instagram" ? "bg-pink-500/10 text-pink-500" :
                    "bg-green-500/10 text-green-400"
                  }`}>
                    {link.iconType === "telegram" && <MessageCircle size={24} />}
                    {link.iconType === "youtube" && <Gamepad2 size={24} />}
                    {link.iconType === "instagram" && <UserCircle2 size={24} />}
                    {link.iconType === "whatsapp" && <MessageCircle size={24} />}
                  </div>
                  <div className="max-w-[150px]">
                    <h4 className="font-bold text-sm truncate">{link.name}</h4>
                    <p className="text-xs text-gray-500 truncate">{link.subtitle}</p>
                  </div>
                </div>
                <button 
                  onClick={() => window.open(link.url, "_blank")}
                  className={`rounded-lg px-4 py-2 text-[10px] font-black uppercase text-white ${
                    link.iconType === "telegram" ? "bg-blue-500" :
                    link.iconType === "youtube" ? "bg-red-500" :
                    link.iconType === "instagram" ? "bg-pink-500" :
                    "bg-green-500"
                  }`}
                >
                  {link.iconType === "youtube" ? "Subscribe" : link.iconType === "telegram" ? "Join" : "Follow"}
                </button>
              </div>
            ))}

            {earnLinks.length === 0 && (
              <div className="text-center py-10">
                <p className="text-gray-500 text-sm font-bold uppercase tracking-widest">No tasks available yet</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "profile" && (
          <div className="flex flex-col items-center space-y-6 pt-6 pb-10">
            <div className="relative">
              <div className="h-24 w-24 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 p-1">
                <div className="h-full w-full rounded-full bg-[#0f172a] overflow-hidden flex items-center justify-center">
                  {currentUser?.photo ? (
                    <img src={currentUser.photo} alt="Profile" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <UserCircle2 size={60} className="text-yellow-400" />
                  )}
                </div>
              </div>
              <button 
                onClick={() => {
                  setIsEditing(true);
                  setEditUsername(currentUser?.username || "");
                  setEditPhoto(currentUser?.photo || "");
                }}
                className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-yellow-400 border-4 border-[#0f172a] flex items-center justify-center text-black"
              >
                <Menu size={14} />
              </button>
            </div>

            {isEditing ? (
              <div className="w-full space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1">Profile Photo URL</label>
                  <input 
                    type="text" 
                    value={editPhoto}
                    onChange={(e) => setEditPhoto(e.target.value)}
                    placeholder="Paste image URL"
                    className="w-full rounded-xl bg-white/5 border border-white/10 py-3 px-4 text-sm focus:border-yellow-400/50 focus:outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1">Username</label>
                  <input 
                    type="text" 
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value)}
                    placeholder="Enter new username"
                    className="w-full rounded-xl bg-white/5 border border-white/10 py-3 px-4 text-sm focus:border-yellow-400/50 focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1">Old Password</label>
                    <input 
                      type="password" 
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      placeholder="Old password"
                      className="w-full rounded-xl bg-white/5 border border-white/10 py-3 px-4 text-sm focus:border-yellow-400/50 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1">New Password</label>
                    <input 
                      type="password" 
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="New password"
                      className="w-full rounded-xl bg-white/5 border border-white/10 py-3 px-4 text-sm focus:border-yellow-400/50 focus:outline-none"
                    />
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button 
                    onClick={() => setIsEditing(false)}
                    className="flex-1 rounded-xl bg-white/5 py-3 font-bold text-sm border border-white/10"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleUpdateProfile}
                    className="flex-1 rounded-xl bg-yellow-400 py-3 font-bold text-sm text-black"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="text-center">
                  <h3 className="text-2xl font-black uppercase italic">{currentUser?.username || "Player"}</h3>
                  <div className="flex flex-col space-y-1 mt-1">
                    <p className="text-gray-500 text-sm">{currentUser?.mobile}</p>
                    <p className="text-gray-500 text-xs">{currentUser?.gmail}</p>
                  </div>
                </div>
                <div className="w-full grid grid-cols-2 gap-4">
                  <div className="rounded-2xl bg-white/5 p-4 border border-white/10 text-center">
                    <p className="text-xs text-gray-500 uppercase font-bold">Total Games</p>
                    <p className="text-xl font-black">0</p>
                  </div>
                  <div className="rounded-2xl bg-white/5 p-4 border border-white/10 text-center">
                    <p className="text-xs text-gray-500 uppercase font-bold">Total Wins</p>
                    <p className="text-xl font-black text-green-400">0</p>
                  </div>
                </div>
                <button 
                  onClick={() => setView("landing")}
                  className="w-full rounded-2xl bg-red-500/10 py-4 font-bold text-red-500 border border-red-500/20"
                >
                  Logout
                </button>
              </>
            )}
          </div>
        )}

        {activeTab === "history" && (
          <div className="space-y-4 pt-2 pb-10">
            <div className="flex items-center gap-3 mb-2">
              <History size={20} className="text-dragon-gold" />
              <h2 className="text-xl font-black uppercase italic tracking-wider font-serif">Tournament <span className="text-dragon-gold">History</span></h2>
            </div>
            
            <div className="space-y-4">
              {(() => {
                const joinedMatches: Array<{ gameTitle: string, match: any }> = [];
                games.forEach(g => {
                  if (g.matches) {
                    g.matches.forEach((m: any) => {
                      if (m.joinedUserList && m.joinedUserList.some((u: any) => u.mobile === currentUser?.mobile)) {
                        joinedMatches.push({ gameTitle: g.title, match: m });
                      }
                    });
                  }
                });

                if (joinedMatches.length === 0) {
                  return (
                    <div className="dragon-card p-8 text-center border-dashed border-white/5 opacity-40">
                      <History size={48} className="mx-auto mb-3 text-gray-500" />
                      <p className="text-xs font-black uppercase tracking-widest text-gray-400">No joined tournaments yet</p>
                      <p className="text-[10px] text-gray-500 mt-1 font-medium">Join any battle to see its live history and stats here!</p>
                    </div>
                  );
                }

                return joinedMatches.map(({ gameTitle, match }, idx) => {
                  const myUserInMatch = match.joinedUserList.find((u: any) => u.mobile === currentUser?.mobile);
                  const status = myUserInMatch?.status || "pending";
                  const prizeEarned = myUserInMatch?.prizeEarned || 0;
                  const kills = myUserInMatch?.kills || 0;
                  const playSlot = myUserInMatch?.slot;

                  return (
                    <div key={match.id || idx} className="dragon-card p-5 border-white/5 space-y-4 relative overflow-hidden bg-gradient-to-br from-black to-white/[0.02]">
                      <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                        status === "win" ? "bg-green-500" :
                        status === "loss" ? "bg-dragon-red" :
                        "bg-dragon-gold animate-pulse"
                      }`} />

                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <span className="text-[9px] font-bold text-dragon-gold uppercase tracking-widest bg-dragon-gold/10 px-2 py-0.5 rounded border border-dragon-gold/20 mr-2">{gameTitle}</span>
                          <span className="text-[9px] text-gray-500 font-bold uppercase">{match.time}</span>
                          <h3 className="text-sm font-black uppercase tracking-tight text-white mt-1.5">{match.title}</h3>
                        </div>

                        <div className="text-right">
                          {status === "win" ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-green-400 tracking-wider bg-green-500/10 px-2.5 py-1 rounded-full border border-green-500/20">
                              <Trophy size={10} /> Win
                            </span>
                          ) : status === "loss" ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-red-400 tracking-wider bg-red-500/10 px-2.5 py-1 rounded-full border border-red-500/20">
                              Loss
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-yellow-400 tracking-wider bg-yellow-400/10 px-2.5 py-1 rounded-full border border-yellow-400/20 animate-pulse">
                              Pending
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 bg-black/30 p-3 rounded-xl border border-white/5 text-center text-xs">
                        <div>
                          <p className="text-[8px] font-bold text-gray-500 uppercase tracking-widest">Selected Slot</p>
                          <p className="font-mono text-xs font-black text-white mt-0.5">#{playSlot || "N/A"}</p>
                        </div>
                        <div>
                          <p className="text-[8px] font-bold text-gray-500 uppercase tracking-widest">Kills</p>
                          <p className="font-mono text-xs font-black text-white mt-0.5">{kills}</p>
                        </div>
                        <div>
                          <p className="text-[8px] font-bold text-gray-500 uppercase tracking-widest">Prize Won</p>
                          <p className="font-mono text-xs font-black text-dragon-gold mt-0.5">₹{prizeEarned}</p>
                        </div>
                      </div>

                      <div className="flex justify-between items-center pt-1 border-t border-white/5 text-[9px] font-black uppercase text-gray-400 tracking-widest">
                        <span>Entry Fee Paid: <span className="text-white italic">₹{match.entryFee}</span></span>
                        <span>Room Key/Pass: <span className="text-dragon-gold">{match.boxNumber || "Will update soon!"}</span></span>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        )}
      </>
    )}
  </main>

      {/* Bottom Navigation */}
      {selectedGame === null && (
          <nav className="h-20 dragon-card backdrop-blur-2xl border-t border-white/5 flex items-center justify-around px-2 pb-2">
          <button 
            onMouseDown={handleStartPress}
            onMouseUp={handleEndPress}
            onTouchStart={handleStartPress}
            onTouchEnd={handleEndPress}
            onClick={() => {
              if (handleAdminTap()) return;
              setActiveTab("earn");
            }}
            className={`flex flex-col items-center space-y-1 transition-all ${activeTab === "earn" ? "text-dragon-gold" : "text-gray-500"}`}
          >
            <CircleDollarSign size={20} className={activeTab === "earn" ? "dragon-glow" : ""} />
            <span className="text-[9px] font-bold uppercase tracking-wider">Earnings</span>
          </button>
          
          <button 
            onMouseDown={handleStartPress}
            onMouseUp={handleEndPress}
            onTouchStart={handleStartPress}
            onTouchEnd={handleEndPress}
            onClick={() => {
              if (handleAdminTap()) return;
              setActiveTab("games");
            }}
            className={`flex flex-col items-center space-y-1 transition-all ${activeTab === "games" ? "text-dragon-gold" : "text-gray-500"}`}
          >
            <Gamepad2 size={20} className={activeTab === "games" ? "dragon-glow" : ""} />
            <span className="text-[9px] font-bold uppercase tracking-wider">Arena</span>
          </button>

          <button 
            onMouseDown={handleStartPress}
            onMouseUp={handleEndPress}
            onTouchStart={handleStartPress}
            onTouchEnd={handleEndPress}
            onClick={() => {
              if (handleAdminTap()) return;
              setActiveTab("history");
            }}
            className={`flex flex-col items-center space-y-1 transition-all ${activeTab === "history" ? "text-dragon-gold" : "text-gray-500"}`}
          >
            <History size={20} className={activeTab === "history" ? "dragon-glow" : ""} />
            <span className="text-[9px] font-bold uppercase tracking-wider">History</span>
          </button>
 
          <button 
            onMouseDown={handleStartPress}
            onMouseUp={handleEndPress}
            onTouchStart={handleStartPress}
            onTouchEnd={handleEndPress}
            onClick={() => {
              if (handleAdminTap()) return;
              setActiveTab("profile");
            }}
            className={`flex flex-col items-center space-y-1 transition-all ${activeTab === "profile" ? "text-dragon-gold" : "text-gray-500"}`}
          >
            <UserCircle2 size={20} className={activeTab === "profile" ? "dragon-glow" : ""} />
            <span className="text-[9px] font-bold uppercase tracking-wider">Profile</span>
          </button>
        </nav>
      )}
    </motion.div>
  );

  const renderWallet = () => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="relative z-10 flex h-full flex-col px-6 py-10 dragon-scales"
    >
      <div className="flex items-center justify-between mb-8">
        <button onClick={() => setView("dashboard")} className="flex h-10 w-10 items-center justify-center rounded-full bg-black/40 border border-white/10">
          <ArrowLeft size={20} />
        </button>
        {!isWithdrawSuccess && (
          <div className="flex rounded-full bg-black/40 p-1 border border-white/10">
            <button 
              onClick={() => setWalletMode("deposit")}
              className={`px-6 py-2 rounded-full text-xs font-bold uppercase transition-all ${walletMode === "deposit" ? "bg-dragon-gold text-black shadow-[0_0_10px_rgba(255,215,0,0.3)]" : "text-gray-400"}`}
            >
              Deposit
            </button>
            <button 
              onClick={() => setWalletMode("withdraw")}
              className={`px-6 py-2 rounded-full text-xs font-bold uppercase transition-all ${walletMode === "withdraw" ? "bg-dragon-gold text-black shadow-[0_0_10px_rgba(255,215,0,0.3)]" : "text-gray-400"}`}
            >
              Withdraw
            </button>
          </div>
        )}
      </div>

      {isWithdrawSuccess ? (
        <div className="flex-1 flex flex-col items-center justify-center space-y-6 text-center">
          <div className="h-20 w-20 rounded-full bg-green-500/10 flex items-center justify-center border border-green-500/20">
            <ShieldCheck size={40} className="text-green-500" />
          </div>
          <div>
            <h2 className="text-2xl font-black uppercase italic text-white">Request Sent!</h2>
            <p className="text-gray-400 text-sm mt-2">Your withdrawal request is being processed.</p>
          </div>
          <button 
            onClick={() => {
              setIsWithdrawSuccess(false);
              setView("dashboard");
            }}
            className="w-full max-w-[200px] bg-dragon-gold text-black py-4 rounded-xl font-black uppercase tracking-widest shadow-lg"
          >
            OK
          </button>
        </div>
      ) : walletMode === "deposit" ? (
        <>
          <div className="mb-10 text-center">
            <h2 className="text-4xl font-black uppercase italic tracking-tighter font-serif dragon-glow">Deposit</h2>
            <p className="text-gray-400 mt-2 font-medium">Deposit coins to play matches</p>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-dragon-gold/60 ml-1">Amount</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-dragon-gold font-bold font-serif">₹</div>
                <input 
                  type="number" 
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full rounded-2xl bg-black/40 border border-white/10 py-4 pl-10 pr-4 text-2xl font-black focus:border-dragon-gold/50 focus:outline-none transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {presetAmounts.map(amount => (
                <button 
                  key={amount}
                  onClick={() => setDepositAmount(amount.toString())}
                  className="rounded-xl bg-black/40 border border-white/10 py-3 text-sm font-bold transition-all hover:bg-dragon-gold hover:text-black hover:border-dragon-gold"
                >
                  ₹{amount}
                </button>
              ))}
            </div>

            <button 
              onClick={() => {
                if (!depositAmount || parseInt(depositAmount) < 10) {
                  alert("Minimum deposit is ₹10");
                  return;
                }
                startQRTimer();
              }}
              className="mt-8 flex h-16 w-full items-center justify-center rounded-2xl bg-dragon-gold font-black uppercase tracking-widest text-black shadow-[0_10px_30px_rgba(255,215,0,0.2)] hover:bg-yellow-300 transition-all font-sans"
            >
              Initiate Deposit
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="mb-10 text-center">
            <h2 className="text-4xl font-black uppercase italic tracking-tighter font-serif dragon-glow">Withdrawal</h2>
            <p className="text-gray-400 mt-2 font-medium">Transfer your winnings to your account</p>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-dragon-gold/60 ml-1">Coins to Withdraw</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-dragon-gold font-bold">
                  <Coins size={16} />
                </div>
                <input 
                  type="number" 
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="Min 50"
                  className="w-full rounded-2xl bg-black/40 border border-white/10 py-4 pl-12 pr-4 text-2xl font-black focus:border-dragon-gold/50 focus:outline-none"
                />
              </div>
            </div>

            <div className="dragon-card p-4 space-y-3 border-dragon-gold/20">
              <div className="flex justify-between text-xs font-bold uppercase tracking-wider">
                <span className="text-gray-500">Amount to Receive</span>
                <span className="text-green-400 dragon-glow">₹{withdrawAmount ? Math.max(0, parseInt(withdrawAmount) - 20) : 0}</span>
              </div>
              <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-gray-600">
                <span>Processing Fee</span>
                <span>₹20</span>
              </div>
              <div className="h-[1px] bg-white/10" />
              <div className="space-y-1">
                <p className="text-[10px] text-dragon-gold/70 font-bold uppercase tracking-widest">Withdrawal Rules:</p>
                <p className="text-[9px] text-gray-500 font-medium">• 50 Coins = ₹30 (₹20 Fee)</p>
                <p className="text-[9px] text-gray-500 font-medium">• 100 Coins = ₹80 (₹20 Fee)</p>
                <p className="text-[9px] text-gray-500 font-medium">• A ₹20 fee is applied per claim</p>
              </div>
            </div>

            <button 
              onClick={() => {
                const amount = parseInt(withdrawAmount);
                if (!withdrawAmount || amount < 50) {
                  alert("Minimum withdrawal is 50 Coins");
                  return;
                }
                if ((currentUser?.coins || 0) < amount) {
                  alert("Insufficient coins!");
                  return;
                }
                handleWithdrawalRequest(amount);
              }}
              className="mt-8 flex h-16 w-full items-center justify-center rounded-2xl bg-dragon-gold font-black uppercase tracking-widest text-black shadow-[0_10px_30px_rgba(255,215,0,0.2)] hover:bg-yellow-300 transition-all font-sans"
            >
              Confirm Withdrawal
            </button>
          </div>
        </>
      )}
    </motion.div>
  );

  const renderNotifications = () => (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="relative z-10 flex h-full flex-col px-6 py-10 dragon-scales"
    >
      <div className="flex items-center justify-between mb-8">
        <button onClick={() => setView("dashboard")} className="flex h-10 w-10 items-center justify-center rounded-full bg-black/40 border border-white/10">
          <ArrowLeft size={20} />
        </button>
        <h3 className="text-xl font-black uppercase italic text-dragon-gold font-serif">Notifications</h3>
      </div>

      <div className="flex-1 space-y-4">
        {currentUser?.notifications && currentUser.notifications.length > 0 ? (
          currentUser.notifications.map((notif) => (
            <motion.div 
              key={notif.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="dragon-card p-4 border-dragon-gold/20 flex items-start space-x-3 bg-black/40"
            >
              <div className="h-2 w-2 rounded-full bg-red-600 mt-2 shrink-0 shadow-[0_0_8px_rgba(220,38,38,0.6)]" />
              <div className="flex-1">
                <p className="text-sm font-bold text-white">{notif.message}</p>
                <p className="text-[10px] text-gray-500 mt-1 uppercase font-bold tracking-widest">{new Date(notif.timestamp).toLocaleString()}</p>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500 italic space-y-2">
            <Bell size={40} className="opacity-10" />
            <p className="text-xs uppercase tracking-widest font-bold">No notifications yet</p>
          </div>
        )}
      </div>
    </motion.div>
  );

  const renderQR = () => (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="relative z-10 flex h-full flex-col items-center justify-center px-6 py-10 dragon-scales"
    >
      {/* 10-Second Verifying Overlay Screen */}
      <AnimatePresence>
        {isVerifyingDeposit && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex flex-col items-center justify-center px-6 backdrop-blur-2xl bg-black/90 text-center"
          >
            <div className="relative flex items-center justify-center mb-6">
              <div className="h-36 w-36 rounded-full border-4 border-dragon-gold/20 animate-ping absolute" />
              <div className="h-28 w-28 rounded-full border-4 border-t-dragon-gold border-r-dragon-gold/30 border-b-dragon-gold/10 border-l-dragon-gold/60 animate-spin" />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-black text-dragon-gold font-mono">{verificationCountdown}</span>
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">sec</span>
              </div>
            </div>

            <div className="space-y-2 max-w-xs">
              <h3 className="text-2xl font-black uppercase text-white font-serif tracking-wide dragon-glow">
                Verifying Payment...
              </h3>
              <p className="text-xs font-bold text-dragon-gold uppercase tracking-widest">
                AI Scanning Screenshot & Time
              </p>
              <p className="text-[10px] text-gray-400 font-medium leading-relaxed">
                Checking if payment amount (₹{depositAmount}) matches and timestamp is strictly within 5 minutes...
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Verification Failure Error Modal */}
      <AnimatePresence>
        {verificationError && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 z-[120] flex items-center justify-center px-6 backdrop-blur-xl bg-black/80"
          >
            <div className="w-full max-w-sm dragon-card p-6 border-red-500/50 text-center space-y-4 bg-black/90 shadow-[0_0_50px_rgba(239,68,68,0.3)]">
              <div className="h-16 w-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto border border-red-500/30">
                <XCircle size={36} className="text-red-500" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-black uppercase text-red-500 font-serif">Deposit Rejected</h3>
                <p className="text-xs text-gray-300 font-bold leading-relaxed">{verificationError}</p>
              </div>
              <button 
                onClick={() => setVerificationError(null)}
                className="w-full py-3 bg-red-500 text-white font-black uppercase tracking-widest rounded-xl hover:bg-red-600 transition-all text-xs"
              >
                Try Again
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isDepositSuccess && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            className="fixed inset-0 z-[100] flex items-center justify-center px-6 backdrop-blur-xl bg-black/60"
          >
            <div className="w-full max-w-sm dragon-card p-10 border-dragon-gold text-center space-y-6">
              <div className="h-24 w-24 rounded-full bg-dragon-gold flex items-center justify-center mx-auto shadow-[0_0_50px_rgba(255,215,0,0.4)] animate-bounce">
                <Check size={48} className="text-black" />
              </div>
              <div className="space-y-2">
                <h2 className="text-3xl font-black uppercase text-dragon-gold font-serif dragon-glow">Payment Verified</h2>
                <p className="text-gray-300 font-bold uppercase tracking-widest text-xs">₹{depositAmount} Credited to Wallet</p>
              </div>
              <button 
                onClick={() => {
                  setIsDepositSuccess(false);
                  setView("dashboard");
                  setActiveTab("games");
                }}
                className="w-full py-4 bg-dragon-gold text-black font-black uppercase tracking-widest rounded-2xl shadow-lg hover:bg-yellow-300 transition-all font-sans"
              >
                OK
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button onClick={() => setView("dashboard")} className="absolute top-10 left-6 flex h-10 w-10 items-center justify-center rounded-full bg-black/40 border border-white/10">
        <ArrowLeft size={20} />
      </button>

      <div className="w-full flex flex-col items-center justify-center -mt-6">
        <div className="bg-white p-5 rounded-3xl shadow-[0_0_40px_rgba(255,255,255,0.15)] flex flex-col items-center justify-center w-full max-w-[240px]">
          {/* Amount (Inside white box, at the top) */}
          <div className="text-center mb-3">
            <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-0.5">Amount to Pay</p>
            <p className="text-2xl font-black text-black tracking-tight">₹{depositAmount}</p>
          </div>
          
          {/* QR Code */}
          <div className="mb-3">
            <img 
              src={appSettings.qrCode} 
              alt="Payment QR" 
              className="h-36 w-36 object-contain rounded-lg border border-gray-100"
              referrerPolicy="no-referrer"
            />
          </div>

          {/* UPI ID (Inside white box, at the bottom) */}
          <div className="text-center w-full bg-gray-50 py-2 rounded-xl border border-gray-100">
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">UPI ID</p>
            <p className="text-xs text-black font-black tracking-wide">{appSettings.upiId}</p>
          </div>
        </div>
      </div>

      {/* Hidden File Input */}
      <input 
        type="file" 
        ref={depositScreenshotInputRef} 
        onChange={handleDepositScreenshotSelect} 
        accept="image/*" 
        className="hidden" 
      />

      {/* Big Box for Screenshot Upload */}
      <div className="mt-6 w-full max-w-[280px] space-y-3">
        <label className="text-[10px] font-black uppercase tracking-widest text-dragon-gold/80 ml-1">
          Upload Payment Screenshot
        </label>
        
        <div 
          onClick={() => depositScreenshotInputRef.current?.click()}
          className={`relative h-36 w-full rounded-2xl border-2 border-dashed overflow-hidden flex flex-col items-center justify-center cursor-pointer transition-all duration-300 group bg-black/40 ${
            depositScreenshot ? "border-green-500/60 shadow-[0_0_20px_rgba(34,197,94,0.2)]" : "border-dragon-gold/40 hover:border-dragon-gold hover:bg-black/60"
          }`}
        >
          {depositScreenshot ? (
            <>
              <img src={depositScreenshot} alt="Payment Screenshot" className="absolute inset-0 h-full w-full object-cover opacity-80" />
              <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-[10px] font-black uppercase bg-dragon-gold text-black px-3 py-1.5 rounded-full shadow-lg">Change Screenshot</span>
              </div>
              <div className="absolute top-2 right-2 bg-green-500 text-black p-1 rounded-full shadow-md">
                <Check size={14} />
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center p-4 text-center space-y-2">
              <div className="h-10 w-10 rounded-full bg-dragon-gold/10 flex items-center justify-center border border-dragon-gold/30 text-dragon-gold group-hover:scale-110 transition-transform">
                <Upload size={20} />
              </div>
              <span className="text-xs font-black uppercase text-white tracking-wider">Tap to Select Photo</span>
              <span className="text-[9px] font-bold text-gray-400">Upload payment receipt screenshot</span>
            </div>
          )}
        </div>

        <p className="text-[9px] text-gray-400 font-medium text-center italic leading-tight">
          • Payment time must be within last 5 minutes<br />
          • Screenshot amount must match ₹{depositAmount}
        </p>

        <button 
          disabled={!depositScreenshot || isVerifyingDeposit}
          onClick={handleConfirmDepositPayment}
          className={`w-full flex h-14 items-center justify-center rounded-2xl font-black uppercase tracking-widest transition-all shadow-xl font-sans text-xs ${
            !depositScreenshot
              ? "bg-gray-800 text-gray-500 cursor-not-allowed border border-white/5 opacity-50"
              : "bg-dragon-gold text-black hover:bg-yellow-300 active:scale-[0.98] shadow-dragon-gold/20"
          }`}
        >
          Confirm Payment
        </button>
      </div>
    </motion.div>
  );

  const renderSecretGate = () => (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="relative z-20 flex h-full flex-col px-6 py-10 dragon-scales bg-dragon-dark"
    >
      <button onClick={() => setView("dashboard")} className="mb-10 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 border border-white/10 hover:bg-dragon-fire/20 transition-colors">
        <ArrowLeft size={24} className="text-dragon-gold" />
      </button>

      <div className="flex-1 flex flex-col items-center justify-center space-y-10">
        <div className="text-center">
          <div className="h-20 w-20 rounded-3xl bg-dragon-red/20 flex items-center justify-center mx-auto mb-6 border border-dragon-red/30 shadow-[0_0_30px_rgba(211,47,47,0.2)]">
            <Lock size={40} className="text-dragon-red" />
          </div>
          <h2 className="text-3xl font-black uppercase tracking-tighter text-white font-serif dragon-glow">Internal Access</h2>
          <p className="text-gray-500 text-sm mt-1 uppercase tracking-widest font-bold">Authorized Personnel Only</p>
        </div>

        <div className="w-full space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-dragon-gold/60 ml-2">Verification Code</label>
            <input 
              type="text" 
              value={secretCodeInput}
              onChange={(e) => setSecretCodeInput(e.target.value)}
              placeholder="Enter access code"
              className="w-full rounded-2xl bg-black px-6 py-5 border border-white/10 focus:border-dragon-fire/50 focus:outline-none text-center font-mono tracking-[0.3em] font-black text-dragon-fire"
            />
          </div>

          <button 
            onClick={() => {
              if (secretCodeInput === SECRET_CODE) {
                setView("secret_admin");
                setSecretCodeInput("");
              } else {
                alert("ACCESS DENIED");
              }
            }}
            className="w-full h-16 rounded-2xl bg-white/5 border border-white/10 font-black uppercase tracking-[0.2em] transition-all hover:bg-dragon-fire hover:text-white"
          >
            Authenticate
          </button>
        </div>
      </div>
    </motion.div>
  );

  const renderSecretAdmin = () => (
    <motion.div 
      initial={{ opacity: 0, scale: 1.1 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="relative z-20 flex h-full flex-col dragon-scales bg-dragon-dark"
    >
      <div className="flex items-center justify-between px-6 pt-10 mb-4 shrink-0">
        <button onClick={() => setView("dashboard")} className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 border border-white/10">
          <ArrowLeft size={24} />
        </button>
        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-dragon-gold dragon-glow">Terminal Access</span>
      </div>

      {/* Static Sub-banner fallback */}
      {!localStorage.getItem("pwa_gt_admin_permanently_hidden") && !isAppInstalled && (
        <div className="mx-6 mb-4 p-4 rounded-2xl bg-gradient-to-r from-purple-950/40 to-black border border-purple-500/35 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative h-10 w-10 rounded-xl border border-purple-500/30 overflow-hidden bg-black/50 shrink-0">
              <img 
                src="/admin-logo.png" 
                alt="Admin Logo" 
                className="h-full w-full object-cover" 
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=150";
                }}
              />
            </div>
            <div className="flex-1">
              <h4 className="text-[11px] font-black uppercase tracking-wider text-white">Direct Homescreen Installer</h4>
              <p className="text-[9px] text-gray-400 font-medium leading-none mt-1">Enjoy a clean fullscreen experience without address bars!</p>
            </div>
          </div>
          <button 
            onClick={triggerPwaInstall}
            className="flex h-8 px-2.5 items-center gap-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-black uppercase tracking-widest text-[8px] transition-all"
          >
            Install App
          </button>
        </div>
      )}

      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Content Area */}
        <div ref={adminContentRef} className="flex-1 overflow-y-auto px-6 pb-24 space-y-6">
          
          {/* Tab 1: Warriors (Users List) */}
          {adminTab === 0 && (
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-black/40 p-3.5 rounded-2xl border border-white/10">
                <div>
                  <h3 className="text-xl font-black uppercase italic text-dragon-gold font-serif">Clan Warriors</h3>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">
                    Live Registered Accounts (Cross-Device)
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => refreshData()}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-dragon-gold/20 border border-dragon-gold/40 text-dragon-gold text-[10px] font-black uppercase hover:bg-dragon-gold/30 transition-all active:scale-95"
                  >
                    <RefreshCw size={12} className={isRefreshingData ? "animate-spin" : ""} />
                    {isRefreshingData ? "Syncing..." : "Sync Live"}
                  </button>
                  <span className="text-[10px] font-mono bg-white/10 px-2.5 py-1 rounded-xl text-dragon-gold font-bold">{users.length} Users</span>
                </div>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search user by Mobile, Username or Gmail..."
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:border-dragon-gold focus:outline-none placeholder-gray-500 font-medium"
                />
              </div>

              <div className="space-y-3">
                {[...users]
                  .filter(u => {
                    if (!userSearchQuery.trim()) return true;
                    const q = userSearchQuery.toLowerCase();
                    return (
                      (u.username && u.username.toLowerCase().includes(q)) ||
                      (u.mobile && u.mobile.includes(q)) ||
                      (u.gmail && u.gmail.toLowerCase().includes(q))
                    );
                  })
                  .sort((a,b) => b.joinedAt - a.joinedAt)
                  .map((user, i) => (
                    <div key={user.mobile || i} className="dragon-card p-4 relative overflow-hidden border-white/5 bg-black/40">
                      {Date.now() - user.joinedAt < 3600000 && (
                        <div className="absolute top-0 right-0 bg-dragon-fire text-[8px] font-black px-2 py-1 uppercase tracking-tighter rounded-bl-lg animate-pulse shadow-[0_0_10px_rgba(255,78,0,0.5)]">
                          NEW REGISTERED
                        </div>
                      )}
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="text-sm font-black text-white flex items-center gap-2">
                            {user.username || "Anonymous Warrior"}
                            {user.mobile === "9693908559" && (
                              <span className="text-[8px] bg-yellow-500/20 text-yellow-400 px-1.5 py-0.5 rounded font-mono border border-yellow-500/30">
                                ROOT ADMIN
                              </span>
                            )}
                          </p>
                          <p className="text-[10px] font-mono text-gray-400 mt-0.5">ID / Phone: <span className="text-white font-bold">{user.mobile}</span></p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-bold text-dragon-gold">₹{user.coins}</p>
                          <p className="text-[8px] text-gray-500">{new Date(user.joinedAt).toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-white/5">
                        <div className="flex flex-col">
                          <span className="text-[8px] uppercase text-gray-500 font-bold">Gmail</span>
                          <span className="text-[10px] truncate max-w-full text-gray-300 font-medium">{user.gmail || "N/A"}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[8px] uppercase text-gray-500 font-bold">Password</span>
                          <span className="text-[10px] font-mono text-dragon-red font-bold">{user.password}</span>
                        </div>
                      </div>
                      {user.mobile !== "9693908559" && (
                        <div className="mt-3 pt-2 border-t border-white/5 flex justify-end">
                          <button
                            onClick={() => handleDeleteUser(user.mobile, user.username || user.mobile)}
                            className="text-[9px] font-black text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 px-2.5 py-1 rounded-lg border border-red-500/20 uppercase tracking-widest transition-all"
                          >
                            Delete Account
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                {users.length === 0 && (
                  <div className="text-center py-10 text-gray-500 text-xs font-bold uppercase tracking-widest">
                    No registered users yet
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab 2: The Forge (Balance Management) */}
          {adminTab === 1 && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-xl font-black uppercase italic text-dragon-gold font-serif dragon-glow">The Forge</h3>
                <p className="text-xs text-gray-500 uppercase tracking-widest mt-1">Alter warrior destiny</p>
              </div>

              <div className="space-y-4 dragon-card p-6 border-dragon-gold/20">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Target Phone/Username</label>
                  <input 
                    type="text"
                    value={forgeTarget}
                    onChange={(e) => setForgeTarget(e.target.value)}
                    placeholder="Enter identifier"
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:border-dragon-gold focus:outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Gold Amount</label>
                  <input 
                    type="number"
                    value={forgeAmount}
                    onChange={(e) => setForgeAmount(e.target.value)}
                    placeholder="0"
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-5 text-2xl font-black text-center focus:border-dragon-gold focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4 pt-4">
                  <button 
                    onClick={() => handleForgeBalance(true)}
                    className="bg-green-500/20 border border-green-500/40 text-green-400 py-4 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-green-500/40 transition-all"
                  >
                    + ADD GOLD
                  </button>
                  <button 
                    onClick={() => handleForgeBalance(false)}
                    className="bg-dragon-red/20 border border-dragon-red/40 text-dragon-red py-4 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-dragon-red/40 transition-all"
                  >
                    - REMOVE GOLD
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Withdrawals */}
          {adminTab === 2 && (
            <div className="space-y-4">
              <h3 className="text-xl font-black uppercase italic text-dragon-gold font-serif">Withdrawals</h3>
              <div className="space-y-3">
                {financialRequests.filter(r => r.type === "withdraw").map((req, i) => (
                  <div key={i} className="dragon-card p-4 space-y-3 border-dragon-fire/20">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        <div className={`h-2 w-2 rounded-full ${req.status === "pending" ? "bg-yellow-400 animate-pulse" : "bg-green-400"}`} />
                        <span className="text-sm font-black">{req.username}</span>
                      </div>
                      <span className="text-dragon-fire font-black">₹{req.amount}</span>
                    </div>
                    <div className="flex justify-between text-[8px] uppercase font-bold text-gray-500 tracking-widest">
                      <span>{req.userMobile}</span>
                      <span>{new Date(req.timestamp).toLocaleString()}</span>
                    </div>
                    {req.status === "pending" && (
                      <button 
                        onClick={() => completeRequest(req.id)}
                        className="w-full bg-dragon-gold text-black py-2 rounded-lg text-[10px] font-black uppercase tracking-widest"
                      >
                        Confirm Success
                      </button>
                    )}
                    {req.status === "completed" && (
                      <div className="w-full bg-green-500/10 text-green-400 py-2 rounded-lg text-[8px] font-black uppercase tracking-widest text-center border border-green-500/20">
                        Payment Dispatched
                      </div>
                    )}
                  </div>
                ))}
                {financialRequests.filter(r => r.type === "withdraw").length === 0 && (
                  <div className="text-center py-10 text-gray-500 text-xs italic">No pending withdrawal requests</div>
                )}
              </div>
            </div>
          )}

          {/* Tab 4: Deposits */}
          {adminTab === 6 && (
            <div className="space-y-4">
              <h3 className="text-xl font-black uppercase italic text-dragon-gold font-serif">Deposit Requests</h3>
              <div className="space-y-3">
                {financialRequests.filter(r => r.type === "deposit").map((req, i) => (
                  <div key={i} className="dragon-card p-4 space-y-3 border-dragon-fire/20">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        <div className={`h-2 w-2 rounded-full ${req.status === "pending" ? "bg-yellow-400 animate-pulse" : "bg-green-400"}`} />
                        <span className="text-sm font-black">{req.username}</span>
                      </div>
                      <span className="text-green-400 font-black">₹{req.amount}</span>
                    </div>
                    <div className="flex justify-between text-[8px] uppercase font-bold text-gray-500 tracking-widest">
                      <span>{req.userMobile}</span>
                      <span>{new Date(req.timestamp).toLocaleString()}</span>
                    </div>
                    {req.utr && (
                      <div className="bg-black/20 p-2 rounded border border-white/5">
                        <p className="text-[8px] uppercase text-gray-500 font-bold mb-1">UTR Number</p>
                        <p className="text-xs font-mono text-dragon-gold tracking-widest">{req.utr}</p>
                      </div>
                    )}
                    {req.status === "pending" && (
                      <button 
                        onClick={() => completeRequest(req.id)}
                        className="w-full bg-dragon-gold text-black py-2 rounded-lg text-[10px] font-black uppercase tracking-widest"
                      >
                        Confirm Payment
                      </button>
                    )}
                    {req.status === "completed" && (
                      <div className="w-full bg-green-500/10 text-green-400 py-2 rounded-lg text-[8px] font-black uppercase tracking-widest text-center border border-green-500/20">
                        Deposit Credited
                      </div>
                    )}
                  </div>
                ))}
                {financialRequests.filter(r => r.type === "deposit").length === 0 && (
                  <div className="text-center py-10 text-gray-500 text-xs italic">No pending deposit requests</div>
                )}
              </div>
            </div>
          )}

          {/* Tab 4: Vault (Overview/History) */}
          {adminTab === 3 && (
            <div className="space-y-6">
              <h3 className="text-xl font-black uppercase italic text-dragon-gold font-serif">Financial Vault</h3>
              <div className="dragon-card p-6 border-dragon-gold/30 flex flex-col items-center">
                 <span className="text-[8px] font-black uppercase text-gray-500 mb-2">Estimated Clan Wealth</span>
                 <span className="text-4xl font-black text-white px-6">₹{users.reduce((acc, u) => acc + u.coins, 0)}</span>
              </div>
              
              <div className="space-y-3">
                <span className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Transaction Records</span>
                {financialRequests.slice(0, 10).map((req, i) => (
                  <div key={i} className="bg-black/40 p-3 rounded-lg border border-white/5 flex justify-between items-center text-xs">
                    <div className="flex flex-col">
                      <span className="font-bold text-white">{req.username}</span>
                      <span className="text-[8px] text-gray-600 uppercase">{req.type}</span>
                    </div>
                    <div className="text-right">
                      <span className={req.type === "deposit" ? "text-green-500" : "text-dragon-red"}>
                        {req.type === "deposit" ? "+" : "-"}₹{req.amount}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 5: Games Dashboard (Boxes) */}
          {adminTab === 4 && (
            <div className="space-y-6 pb-20">
              <div className="flex justify-between items-center px-2">
                <h3 className="text-xl font-black uppercase italic text-dragon-gold font-serif">Game Boxes</h3>
                <div className="h-px flex-1 mx-4 bg-white/10" />
              </div>
              
              {/* Add/Edit Box Form */}
              <div className={`dragon-card p-6 space-y-5 transition-all duration-500 ${editingGameIndex !== null ? 'border-dragon-gold shadow-[0_0_30px_rgba(255,215,0,0.2)]' : 'border-dragon-gold/20'}`}>
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-[0.2em] text-dragon-fire">
                    {editingGameIndex !== null ? "Edit Game Box" : "Create New Box"}
                  </h4>
                  {editingGameIndex !== null && (
                    <div className="flex items-center gap-2">
                       <span className="h-2 w-2 rounded-full bg-dragon-gold animate-ping" />
                       <div className="text-[10px] font-black text-dragon-gold uppercase">Edit Mode</div>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Box Visual</label>
                    <input 
                      type="file" 
                      ref={fileInputRef}
                      onChange={(e) => handleImageSelect(e, "game")}
                      accept="image/*"
                      className="hidden"
                    />
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="relative h-32 w-full rounded-2xl border-2 border-dashed border-white/10 overflow-hidden flex flex-col items-center justify-center cursor-pointer hover:border-dragon-gold/50 transition-all group bg-black/20"
                    >
                      {gameImageInput ? (
                        <>
                          <img src={gameImageInput} className="absolute inset-0 h-full w-full object-cover opacity-60" />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-[10px] font-black uppercase bg-dragon-gold text-black px-3 py-1 rounded-full">Change Photo</span>
                          </div>
                        </>
                      ) : (
                        <>
                          <UserCircle2 size={32} className="text-white/20 mb-2" />
                          <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Open Gallery</span>
                        </>
                      )}
                    </div>
                  </div>

                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Box Name</label>
                          <input 
                            type="text" 
                            placeholder="e.g. ULTRA 1V1"
                            value={gameTitleInput}
                            onChange={(e) => setGameTitleInput(e.target.value)}
                            className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold focus:border-dragon-gold focus:outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Box #</label>
                          <input 
                            type="text" 
                            placeholder="e.g. 01"
                            value={gameNumberInput}
                            onChange={(e) => setGameNumberInput(e.target.value)}
                            className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold focus:border-dragon-gold focus:outline-none text-dragon-gold"
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Sub-Tag</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Free Fire India"
                        value={gameSubInput}
                        onChange={(e) => setGameSubInput(e.target.value)}
                        className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-xs focus:border-dragon-gold focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button 
                      onClick={handleSaveGame}
                      className="flex-[2] bg-dragon-fire text-white font-black uppercase py-4 rounded-xl shadow-[0_0_20px_rgba(255,78,0,0.2)] active:scale-95 transition-all text-xs tracking-widest"
                    >
                      {editingGameIndex !== null ? "Update Box" : "Create Box"}
                    </button>
                    {editingGameIndex !== null && (
                      <button 
                        onClick={() => {
                          if(confirm("Confirm removal?")) {
                            deleteGame(editingGameIndex);
                            setEditingGameIndex(null);
                            setGameTitleInput("");
                            setGameSubInput("");
                            setGameImageInput("");
                            setGameNumberInput("");
                          }
                        }}
                        className="flex-1 bg-dragon-red/20 border border-dragon-red/30 text-dragon-red rounded-xl font-bold text-[10px] uppercase px-2"
                      >
                        Delete
                      </button>
                    )}
                    <button 
                      onClick={() => {
                        setEditingGameIndex(null);
                        setGameTitleInput("");
                        setGameSubInput("");
                        setGameImageInput("");
                        setGameNumberInput("");
                      }}
                      className="flex-1 bg-white/5 border border-white/10 rounded-xl text-gray-500 font-bold text-[8px] uppercase"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>


              <div className="grid grid-cols-2 gap-4">
                {games.map((game, i) => (
                  <div 
                    key={i} 
                    onMouseDown={() => {
                      adminLongPressTimer.current = setTimeout(() => deleteGame(i), 3000);
                    }}
                    onMouseUp={() => clearTimeout(adminLongPressTimer.current!)}
                    onMouseLeave={() => clearTimeout(adminLongPressTimer.current!)}
                    onTouchStart={() => {
                      adminLongPressTimer.current = setTimeout(() => deleteGame(i), 3000);
                    }}
                    onTouchEnd={() => clearTimeout(adminLongPressTimer.current!)}
                    className="relative group overflow-hidden dragon-card border-white/5 rounded-2xl h-44 shadow-lg cursor-pointer active:scale-95 transition-all"
                  >
                    <img src={game.image} className="absolute inset-0 h-full w-full object-cover opacity-40 group-hover:opacity-60 transition-opacity" />
                    <div className="absolute inset-0 bg-gradient-to-t from-dragon-dark via-transparent to-transparent" />
                    
                    <div className="absolute top-2 right-2 flex gap-1">
                       <button 
                        onClick={() => {
                          setEditingGameIndex(i);
                          setGameTitleInput(game.title);
                          setGameSubInput(game.subtitle);
                          setGameImageInput(game.image);
                          adminContentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="h-9 w-9 rounded-lg bg-dragon-gold text-black flex items-center justify-center backdrop-blur-md border border-dragon-gold/30 active:scale-95 transition-all shadow-[0_0_15px_rgba(255,215,0,0.4)] z-50 hover:bg-yellow-400"
                      >
                        <Menu size={18} />
                      </button>
                    </div>

                    <div className="relative z-10 h-full p-4 flex flex-col justify-end">
                      <p className="text-[9px] font-black uppercase text-dragon-gold tracking-widest mb-1 italic truncate">{game.subtitle}</p>
                      <p className="text-sm font-black uppercase text-white truncate mb-3 font-serif dragon-glow">{game.title}</p>
                      
                      <div className="flex gap-2">
                        <button 
                          onClick={() => {
                            setEditingGameIndex(i);
                            setGameTitleInput(game.title);
                            setGameSubInput(game.subtitle);
                            setGameImageInput(game.image);
                            setGameNumberInput(game.boxNumber || "");
                            adminContentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className="flex-1 bg-white/10 py-2 rounded-lg text-[10px] font-black uppercase tracking-tighter hover:bg-dragon-gold hover:text-black transition-all border border-white/5"
                        >
                          Modify
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteGame(i);
                          }}
                          className="px-3 bg-dragon-red/10 border border-dragon-red/20 text-dragon-red py-2 rounded-lg text-[10px] font-black uppercase hover:bg-dragon-red hover:text-white transition-all"
                        >
                          <Zap size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 5: App Settings */}
          {adminTab === 5 && (
            <div className="space-y-6">
              <h3 className="text-xl font-black uppercase italic text-dragon-gold font-serif">System Settings</h3>
              
              <div className="dragon-card p-6 border-white/5 space-y-6">
                {/* QR Update */}
                <div className="space-y-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Deposit QR Code</p>
                  <div className="flex flex-col items-center gap-4">
                    <div className="h-40 w-40 dragon-card border-white/10 flex items-center justify-center bg-black/40 p-2">
                      <img src={adminQrInput || appSettings.qrCode} alt="Preview" className="h-full w-full object-contain" referrerPolicy="no-referrer" />
                    </div>
                    <div className="w-full flex gap-2">
                       <input 
                        type="file" 
                        accept="image/*"
                        id="admin-qr-file"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                             const reader = new FileReader();
                             reader.onload = (ev) => setAdminQrInput(ev.target?.result as string);
                             reader.readAsDataURL(file);
                          }
                        }}
                      />
                      <label 
                        htmlFor="admin-qr-file"
                        className="flex-1 bg-white/5 border border-white/10 py-3 rounded-xl text-[10px] font-black uppercase text-center cursor-pointer hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                      >
                        <Menu size={14} /> Open Gallery
                      </label>
                      {adminQrInput && (
                        <button 
                          onClick={() => handleUpdateSettings('qr')}
                          className="bg-dragon-gold text-black px-6 py-3 rounded-xl text-[10px] font-black uppercase shadow-lg shadow-dragon-gold/20"
                        >
                          Confirm QR
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="h-px bg-white/5 w-full" />

                {/* UPI Update */}
                <div className="space-y-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Receiver UPI ID</p>
                  <div className="space-y-2">
                    <input 
                      type="text"
                      placeholder="Enter new UPI ID"
                      value={adminUpiInput}
                      onChange={(e) => setAdminUpiInput(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 px-4 py-3 rounded-xl text-sm font-bold focus:border-dragon-gold outline-none"
                    />
                    <button 
                      onClick={() => handleUpdateSettings('upi')}
                      className="w-full bg-dragon-fire text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all"
                    >
                      Confirm UPI ID
                    </button>
                  </div>
                </div>
              </div>

              <div className="dragon-card p-6 border-white/5 space-y-4">
                 <p className="text-[10px] font-black uppercase tracking-widest text-dragon-gold mb-2">Live Preview</p>
                 <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400 font-bold uppercase">Current UPI:</span>
                    <span className="text-xs text-white font-black">{appSettings.upiId}</span>
                 </div>
              </div>
            </div>
          )}

          {/* Tab 7: Earn Links (And Section Management) */}
          {adminTab === 7 && (
            <div className="space-y-6">
              <h3 className="text-xl font-black uppercase italic text-dragon-gold font-serif">Earn Section Links</h3>
              
              {/* Form to Add/Edit */}
              <div className="dragon-card p-6 border-dragon-gold/30 space-y-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-dragon-gold">
                  {editingEarnLinkIndex !== null ? "Edit Link" : "Add New Task Link"}
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-gray-500 uppercase ml-1">Icon Type</label>
                    <select 
                      value={earnLinkIconType}
                      onChange={(e) => setEarnLinkIconType(e.target.value as any)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-3 text-xs font-bold text-white outline-none focus:border-dragon-gold"
                    >
                      <option value="telegram">Telegram</option>
                      <option value="youtube">YouTube</option>
                      <option value="instagram">Instagram</option>
                      <option value="whatsapp">WhatsApp</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-gray-500 uppercase ml-1">Task Name</label>
                    <input 
                      type="text"
                      placeholder="e.g. Join Group"
                      value={earnLinkNameInput}
                      onChange={(e) => setEarnLinkNameInput(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-dragon-gold"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-gray-500 uppercase ml-1">Subtitle</label>
                  <input 
                    type="text"
                    placeholder="e.g. Official Updates"
                    value={earnLinkSubInput}
                    onChange={(e) => setEarnLinkSubInput(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-dragon-gold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-gray-500 uppercase ml-1">URL (https://...)</label>
                  <input 
                    type="text"
                    placeholder="e.g. https://t.me/..."
                    value={earnLinkUrlInput}
                    onChange={(e) => setEarnLinkUrlInput(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-dragon-gold"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <button 
                    onClick={handleSaveEarnLink}
                    className="flex-1 bg-dragon-gold text-black font-black uppercase text-[10px] tracking-widest py-4 rounded-xl shadow-[0_10px_20px_rgba(255,215,0,0.2)]"
                  >
                    {editingEarnLinkIndex !== null ? "Update Link" : "Confirm & Add"}
                  </button>
                  {editingEarnLinkIndex !== null && (
                    <button 
                      onClick={() => {
                        setEditingEarnLinkIndex(null);
                        setEarnLinkNameInput("");
                        setEarnLinkSubInput("");
                        setEarnLinkUrlInput("");
                      }}
                      className="px-6 bg-white/5 border border-white/10 text-gray-500 font-black uppercase text-[10px] rounded-xl"
                    >
                      X
                    </button>
                  )}
                </div>
              </div>

              {/* List of links */}
              <div className="space-y-3">
                {earnLinks.map((link, i) => (
                  <div key={link.id || i} className="dragon-card p-4 border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                        link.iconType === "telegram" ? "bg-blue-500/10 text-blue-400" :
                        link.iconType === "youtube" ? "bg-red-500/10 text-red-500" :
                        link.iconType === "instagram" ? "bg-pink-500/10 text-pink-500" :
                        "bg-green-500/10 text-green-400"
                      }`}>
                        {link.iconType === "telegram" && <MessageCircle size={20} />}
                        {link.iconType === "youtube" && <Gamepad2 size={20} />}
                        {link.iconType === "instagram" && <UserCircle2 size={20} />}
                        {link.iconType === "whatsapp" && <MessageCircle size={20} />}
                      </div>
                      <div className="max-w-[120px]">
                        <p className="text-xs font-black uppercase truncate">{link.name}</p>
                        <p className="text-[8px] text-gray-500 uppercase truncate">{link.subtitle}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                       <button 
                        onClick={() => {
                          setEditingEarnLinkIndex(i);
                          setEarnLinkNameInput(link.name);
                          setEarnLinkSubInput(link.subtitle);
                          setEarnLinkUrlInput(link.url);
                          setEarnLinkIconType(link.iconType);
                          adminContentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="h-8 w-8 bg-white/5 border border-white/10 rounded flex items-center justify-center text-gray-400 hover:text-dragon-gold"
                      >
                        <Menu size={14} />
                      </button>
                      <button 
                        onClick={() => deleteEarnLink(i)}
                        className="h-8 w-8 bg-dragon-fire/10 border border-dragon-fire/20 rounded flex items-center justify-center text-dragon-fire hover:bg-dragon-fire hover:text-white"
                      >
                        <Zap size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 8: Match Management */}
          {adminTab === 8 && (
            <div className="space-y-6">
              <h3 className="text-xl font-black uppercase italic text-dragon-gold font-serif">Add/Edit Match</h3>
              
              <div className="dragon-card p-6 border-dragon-gold/30 space-y-4">
                {/* 1. Gallery Button at Top */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Match Image (Gallery)</label>
                  <div 
                    onClick={() => {
                      const input = document.createElement("input");
                      input.type = "file";
                      input.accept = "image/*";
                      input.onchange = (e: any) => handleImageSelect(e, "match");
                      input.click();
                    }}
                    className="relative h-44 w-full rounded-2xl border-2 border-dashed border-white/10 overflow-hidden flex flex-col items-center justify-center cursor-pointer hover:border-dragon-gold/50 transition-all bg-black/20"
                  >
                    {matchImageInput ? (
                      <img src={matchImageInput} className="absolute inset-0 h-full w-full object-cover" />
                    ) : (
                      <div className="text-center">
                        <Gamepad2 size={32} className="mx-auto text-dragon-gold mb-2" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500 underline">Tap to Open Gallery</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. Match Title */}
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-gray-500 uppercase ml-1">Match Title</label>
                  <input 
                    type="text"
                    placeholder="e.g. SQUAD - PER KILL 10"
                    value={matchTitleInput}
                    onChange={(e) => setMatchTitleInput(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-dragon-gold"
                  />
                </div>

                {/* 3. Prize / Price */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-gray-500 uppercase ml-1">Prize Pool (₹)</label>
                    <input 
                      type="number"
                      placeholder="e.g. 500"
                      value={matchPrizeInput}
                      onChange={(e) => setMatchPrizeInput(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-dragon-gold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-gray-500 uppercase ml-1">Per Kill (₹)</label>
                    <input 
                      type="number"
                      placeholder="e.g. 10"
                      value={matchPerKillInput}
                      onChange={(e) => setMatchPerKillInput(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-dragon-gold"
                    />
                  </div>
                </div>

                {/* 4. Players & Join Fee */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-gray-500 uppercase ml-1">Max Players (Capacity)</label>
                    <input 
                      type="number"
                      placeholder="e.g. 48"
                      value={matchMaxPlayersInput}
                      onChange={(e) => setMatchMaxPlayersInput(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-dragon-gold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-gray-500 uppercase ml-1">Join Fee (Coins)</label>
                    <input 
                      type="number"
                      placeholder="e.g. 30"
                      value={matchEntryFeeInput}
                      onChange={(e) => setMatchEntryFeeInput(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-dragon-gold"
                    />
                  </div>
                </div>

                {/* 5. Box Selection & Box Number */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-gray-500 uppercase ml-1">Select Box (Game)</label>
                    <select 
                      value={matchGameIndex}
                      onChange={(e) => setMatchGameIndex(parseInt(e.target.value))}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-3 text-xs font-bold text-dragon-gold outline-none focus:border-dragon-gold"
                    >
                      {games.map((g, idx) => (
                        <option key={idx} value={idx}>{idx + 1}. {g.title}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-gray-500 uppercase ml-1">Box Number (Display)</label>
                    <input 
                      type="text"
                      placeholder="Box #02"
                      value={matchBoxNumber}
                      onChange={(e) => setMatchBoxNumber(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-dragon-gold"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-gray-500 uppercase ml-1">Time & Date</label>
                  <input 
                    type="text"
                    placeholder="e.g. 14/05/2026 08:30 PM"
                    value={matchTimeInput}
                    onChange={(e) => setMatchTimeInput(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-dragon-gold"
                  />
                </div>

                  <div className="flex gap-2 pt-2">
                    <button 
                      onClick={handleSaveMatch}
                      className="flex-1 bg-dragon-gold text-black font-black uppercase text-xs tracking-widest py-4 rounded-xl shadow-xl active:scale-[0.98] transition-all"
                    >
                      {editingMatchIndex !== null ? "Update Match" : "Add to Box Now"}
                    </button>
                    {editingMatchIndex !== null && (
                      <button 
                        onClick={() => {
                          if (confirm("Permanently remove this match?")) {
                            deleteMatch(matchGameIndex, editingMatchIndex);
                            resetMatchForm();
                          }
                        }}
                        className="bg-dragon-red/20 border border-dragon-red/30 text-dragon-red px-6 rounded-xl font-black uppercase text-[10px] tracking-widest"
                      >
                        Delete
                      </button>
                    )}
                    <button 
                      onClick={resetMatchForm}
                      className="px-6 bg-white/5 border border-white/10 text-gray-500 font-black uppercase text-xs rounded-xl"
                    >
                      Reset
                    </button>
                  </div>
              </div>

              {editingMatchIndex !== null && (
                <div className="dragon-card p-6 border-dragon-gold/30 space-y-4">
                  <h4 className="text-xs font-black uppercase tracking-[0.2em] text-dragon-gold">
                    🏆 Declare Match Outcomes
                  </h4>
                  <p className="text-[10px] text-gray-400">
                    Declare and update status, kills, and coins won for players in this match. Updates credit standard coin balances and triggers instantaneous notifications.
                  </p>

                  <div className="space-y-3">
                    {(() => {
                      const selectedMatch = games[matchGameIndex]?.matches?.[editingMatchIndex];
                      if (!selectedMatch?.joinedUserList || selectedMatch.joinedUserList.length === 0) {
                        return (
                          <div className="py-6 text-center text-[10px] font-black uppercase text-gray-500 tracking-wider">
                            No slots joined in this match yet
                          </div>
                        );
                      }

                      return selectedMatch.joinedUserList.map((participant: any) => (
                        <AdminParticipantCard
                          key={`${participant.mobile}-${participant.slot}`}
                          participant={participant}
                          gameIndex={matchGameIndex}
                          matchIndex={editingMatchIndex}
                          onSaved={() => refreshData()}
                        />
                      ));
                    })()}
                  </div>
                </div>
              )}

              {/* List Area */}
              <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                  <h4 className="text-[10px] font-black uppercase text-gray-500 tracking-[0.2em]">Active in {games[matchGameIndex]?.title}</h4>
                  <div className="h-px flex-1 ml-4 bg-white/5" />
                </div>
                
                {games[matchGameIndex]?.matches?.map((m: any, i: number) => (
                  <div 
                    key={m.id || i} 
                    onMouseDown={() => {
                      adminLongPressTimer.current = setTimeout(() => deleteMatch(matchGameIndex, i), 3000);
                    }}
                    onMouseUp={() => clearTimeout(adminLongPressTimer.current!)}
                    onMouseLeave={() => clearTimeout(adminLongPressTimer.current!)}
                    onTouchStart={() => {
                      adminLongPressTimer.current = setTimeout(() => deleteMatch(matchGameIndex, i), 3000);
                    }}
                    onTouchEnd={() => clearTimeout(adminLongPressTimer.current!)}
                    className="dragon-card p-4 border-white/5 flex items-center justify-between cursor-pointer active:bg-white/5 transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-14 w-14 rounded-xl overflow-hidden shrink-0 border border-white/10 relative">
                        <img src={m.image} className="h-full w-full object-cover" />
                        <div className="absolute inset-0 bg-black/20" />
                        <div className="absolute top-0 left-0 bg-black/60 px-1 py-0.5">
                           <span className="text-[7px] font-black text-dragon-gold">{m.boxNumber || "#"+(i+1)}</span>
                        </div>
                      </div>
                      <div className="max-w-[150px]">
                        <p className="text-sm font-black uppercase truncate text-white">{m.title}</p>
                        <p className="text-[10px] text-dragon-gold font-bold">₹{m.prizePool} PRIZE • {m.joinedPlayers}/{m.maxPlayers}</p>
                        <p className="text-[8px] text-gray-500 font-bold uppercase">{m.time}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingMatchIndex(i);
                          setMatchTitleInput(m.title);
                          setMatchPrizeInput(m.prizePool.toString());
                          setMatchPerKillInput(m.perKill.toString());
                          setMatchEntryFeeInput(m.entryFee.toString());
                          setMatchMaxPlayersInput(m.maxPlayers.toString());
                          setMatchJoinedPlayersInput(m.joinedPlayers.toString());
                          setMatchTimeInput(m.time);
                          setMatchImageInput(m.image);
                          setMatchBoxNumber(m.boxNumber || "");
                          adminContentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="h-10 w-10 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-gray-400 hover:text-dragon-gold transition-colors"
                      >
                        <Menu size={16} />
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteMatch(matchGameIndex, i);
                        }}
                        className="h-10 w-10 bg-dragon-red/10 border border-dragon-red/20 rounded-xl flex items-center justify-center text-dragon-red hover:bg-dragon-red hover:text-white transition-all"
                      >
                        <Zap size={16} />
                      </button>
                    </div>
                  </div>
                ))}
                
                {(!games[matchGameIndex]?.matches || games[matchGameIndex].matches.length === 0) && (
                  <div className="py-12 text-center opacity-30">
                    <Zap size={40} className="mx-auto text-gray-500 mb-2" />
                    <p className="text-[10px] font-black uppercase tracking-widest">No match in this box</p>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Bottom Tab Bar */}
        <div className="absolute bottom-0 inset-x-0 h-20 dragon-card border-t border-white/10 flex items-center justify-around px-2 backdrop-blur-2xl">
          <button onClick={() => setAdminTab(0)} className={`flex flex-col items-center gap-1 ${adminTab === 0 ? "text-dragon-gold" : "text-gray-500"}`}>
            <UserCircle2 size={20} />
            <span className="text-[8px] font-black uppercase">Users</span>
          </button>
          <button onClick={() => setAdminTab(1)} className={`flex flex-col items-center gap-1 ${adminTab === 1 ? "text-dragon-gold" : "text-gray-500"}`}>
            <Zap size={20} />
            <span className="text-[8px] font-black uppercase">Coins</span>
          </button>
          <button onClick={() => setAdminTab(2)} className={`flex flex-col items-center gap-1 ${adminTab === 2 ? "text-dragon-gold" : "text-gray-500"}`}>
            <Coins size={20} />
            <span className="text-[8px] font-black uppercase">Withdraws</span>
          </button>
          <button onClick={() => setAdminTab(6)} className={`relative flex flex-col items-center gap-1 ${adminTab === 6 ? "text-dragon-gold" : "text-gray-500"}`}>
            <Wallet size={20} />
            <span className="text-[8px] font-black uppercase">Deposits</span>
            {financialRequests.filter(r => r.type === "deposit" && r.status === "pending").length > 0 && (
              <div className="absolute -top-1 -right-1 flex h-3 w-3 bg-red-600 rounded-full animate-ping" />
            )}
            {financialRequests.filter(r => r.type === "deposit" && r.status === "pending").length > 0 && (
               <div className="absolute -top-8 -right-4 bg-white/10 border border-white/10 backdrop-blur-md px-2 py-1 rounded-md whitespace-nowrap">
                  <p className="text-[6px] font-black uppercase text-dragon-gold">
                    Latest: ₹{financialRequests.find(r => r.type === "deposit" && r.status === "pending")?.amount} Added
                  </p>
               </div>
            )}
          </button>
          <button onClick={() => setAdminTab(4)} className={`flex flex-col items-center gap-1 ${adminTab === 4 ? "text-dragon-gold" : "text-gray-500"}`}>
            <Gamepad2 size={20} />
            <span className="text-[8px] font-black uppercase">Games</span>
          </button>
          <button onClick={() => setAdminTab(5)} className={`flex flex-col items-center gap-1 ${adminTab === 5 ? "text-dragon-gold" : "text-gray-500"}`}>
            <ShieldCheck size={20} />
            <span className="text-[8px] font-black uppercase">System</span>
          </button>
          <button onClick={() => setAdminTab(7)} className={`flex flex-col items-center gap-1 ${adminTab === 7 ? "text-dragon-gold" : "text-gray-500"}`}>
            <MessageCircle size={20} />
            <span className="text-[8px] font-black uppercase">Tasks</span>
          </button>
          <button onClick={() => setAdminTab(8)} className={`flex flex-col items-center gap-1 ${adminTab === 8 ? "text-dragon-gold" : "text-gray-500"}`}>
            <Zap size={20} />
            <span className="text-[8px] font-black uppercase">Matches</span>
          </button>
          <button onClick={() => refreshData()} className="flex flex-col items-center gap-1 text-gray-500 active:text-dragon-gold">
            <TrendingUp size={20} />
            <span className="text-[8px] font-black uppercase">Sync</span>
          </button>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="relative h-screen w-full overflow-hidden bg-dragon-dark font-sans text-white">
      {/* Global Chrome-Style sliding notification dropdown */}
      <AnimatePresence>
        {showNotificationPrompt && (
          <motion.div
            initial={{ y: -150, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -150, opacity: 0 }}
            transition={{ type: "spring", stiffness: 280, damping: 22 }}
            className={`fixed top-4 left-4 right-4 z-[99999] p-4 rounded-3xl bg-black/95 border-2 ${
              view === "secret_admin" ? "border-yellow-500/40 shadow-[0_12px_30px_rgba(234,179,8,0.4)]" : "border-purple-500/40 shadow-[0_12px_30px_rgba(168,85,247,0.4)]"
            } flex items-center justify-between gap-3 backdrop-blur-md`}
          >
            <div className="flex items-center gap-3">
              <div className={`relative h-12 w-12 rounded-2xl border-2 ${
                view === "secret_admin" ? "border-yellow-500/50 shadow-[0_0_15px_rgba(234,179,8,0.3)]" : "border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.3)]"
              } overflow-hidden bg-black/90 shrink-0`}>
                <img 
                  src={view === "secret_admin" ? "/admin-logo.png" : "/user-logo.png"} 
                  alt="App Logo" 
                  className="h-full w-full object-cover" 
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=150";
                  }}
                />
              </div>
              <div className="flex-1">
                <h4 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-1.5 leading-none">
                  <span className={`h-1.5 w-1.5 rounded-full ${view === "secret_admin" ? "bg-yellow-500 animate-ping" : "bg-green-500 animate-ping"} shrink-0`} />
                  {view === "secret_admin" ? "GT Clash Admin" : "GT Clash App"}
                </h4>
                <p className="text-[10px] text-gray-400 font-bold leading-tight mt-1">
                  {view === "secret_admin" ? "Natively install the Admin Control Center!" : "Natively install standard game app now!"} 
                  <span className={`${view === "secret_admin" ? "text-yellow-400" : "text-purple-400"} font-extrabold animate-pulse bg-white/5 px-1.5 py-0.5 rounded ml-1 text-[9px]`}>({installTimer}s left)</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button 
                onClick={triggerPwaInstall}
                className={`flex h-9 px-3 items-center gap-1 rounded-xl ${
                  view === "secret_admin" ? "bg-yellow-600 hover:bg-yellow-500" : "bg-purple-600 hover:bg-purple-500"
                } active:scale-95 text-white font-black uppercase tracking-widest text-[9px] transition-all`}
              >
                <Download size={11} className="animate-bounce" />
                Install
              </button>
              <button 
                onClick={handleDismissBanner}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 border border-white/10 text-gray-500 hover:text-white transition-all text-[11px] font-black"
              >
                ✕
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute inset-0 z-0 overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20 mix-blend-overlay scale-110"
          style={{ 
            backgroundImage: `url('https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=2070&auto=format&fit=crop')`,
          }}
        />
        <div className="absolute inset-0 dragon-gradient" />
        
        {/* Big "P" Watermark */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="text-[70vh] font-black text-dragon-red/[0.05] select-none leading-none font-serif">P</span>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {view === "landing" && renderLanding()}
        {view === "login" && renderLogin()}
        {view === "register" && renderRegister()}
        {view === "forgot" && renderForgot()}
        {view === "dashboard" && renderDashboard()}
        {view === "wallet" && renderWallet()}
        {view === "qr" && renderQR()}
        {view === "notifications" && renderNotifications()}
        {view === "secret_gate" && renderSecretGate()}
        {view === "secret_admin" && renderSecretAdmin()}
      </AnimatePresence>

      {/* Join Match Slot Selection Overlay */}
      <AnimatePresence>
        {joiningMatch && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="w-full max-w-md bg-dragon-dark border border-dragon-gold/30 rounded-[2.5rem] overflow-hidden flex flex-col max-h-[90vh] shadow-[0_0_100px_rgba(255,215,0,0.15)]"
            >
              <div className="p-8 border-b border-white/5 flex justify-between items-center bg-black/40">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-dragon-gold flex items-center justify-center text-black shadow-lg">
                    <Zap size={24} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black uppercase italic text-dragon-gold leading-none">Select Slot</h3>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em] mt-1">Warrior position in battlefield</p>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    setJoiningMatch(null);
                    setSelectedSlot(null);
                  }}
                  className="h-12 w-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-red-500/20 hover:text-red-500 transition-all"
                >
                  <ArrowLeft size={20} className="rotate-90" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 dragon-scales">
                <div className="grid grid-cols-4 gap-4">
                  {Array.from({ length: games[joiningMatch.gIndex].matches[joiningMatch.mIndex].maxPlayers }).map((_, idx) => {
                    const slotNum = idx + 1;
                    const joinedUser = games[joiningMatch.gIndex].matches[joiningMatch.mIndex].joinedUserList?.find((u: any) => u.slot === slotNum);
                    const isMe = joinedUser?.mobile === currentUser?.mobile;
                    const isSelected = selectedSlot === slotNum;
                    
                    return (
                      <button
                        key={slotNum}
                        disabled={!!joinedUser}
                        onClick={() => setSelectedSlot(slotNum)}
                        className={`aspect-square w-full rounded-2xl border-2 flex flex-col items-center justify-center relative transition-all duration-300 ${
                          isMe
                          ? "bg-green-600/20 border-green-500 shadow-[0_0_20px_rgba(34,197,94,0.4)]"
                          : joinedUser 
                          ? "bg-dragon-red/10 border-dragon-red/20 opacity-40 cursor-not-allowed" 
                          : isSelected
                          ? "bg-dragon-gold/20 border-dragon-gold shadow-[0_0_20px_rgba(255,215,0,0.4)] scale-105"
                          : "bg-black/40 border-white/5 hover:border-dragon-gold/30"
                        }`}
                      >
                        <span className={`text-lg font-black italic ${joinedUser ? "text-dragon-red/40" : isSelected ? "text-dragon-gold" : "text-gray-600"}`}>
                          {slotNum.toString().padStart(2, '0')}
                        </span>
                        {joinedUser && <ShieldCheck size={12} className="absolute top-2 right-2 text-dragon-red/40" />}
                        {isSelected && !joinedUser && <Check size={18} className="text-dragon-gold mt-1" />}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-10 space-y-6">
                  <div className="space-y-4 pt-6 border-t border-white/5">
                    <div className="space-y-2">
                       <div className="flex items-center gap-2 mb-1">
                          <Zap size={12} className="text-dragon-gold" />
                          <label className="text-[10px] font-black uppercase tracking-widest text-dragon-gold/70">Warrior Game ID</label>
                       </div>
                      <input 
                        type="text"
                        placeholder="Enter your system identifier"
                        value={joinId}
                        onChange={(e) => setJoinId(e.target.value)}
                        className="w-full bg-black/60 border border-white/10 rounded-2xl px-6 py-5 text-sm font-bold focus:border-dragon-gold outline-none transition-all focus:ring-1 focus:ring-dragon-gold/20"
                      />
                    </div>
                    <div className="space-y-2">
                       <div className="flex items-center gap-2 mb-1">
                          <User size={12} className="text-dragon-gold" />
                          <label className="text-[10px] font-black uppercase tracking-widest text-dragon-gold/70">Battlefield Name</label>
                       </div>
                      <input 
                        type="text"
                        placeholder="Name to show on leaderboard"
                        value={joinName}
                        onChange={(e) => setJoinName(e.target.value)}
                        className="w-full bg-black/60 border border-white/10 rounded-2xl px-6 py-5 text-sm font-bold focus:border-dragon-gold outline-none transition-all focus:ring-1 focus:ring-dragon-gold/20"
                      />
                    </div>
                  </div>

                  <button 
                    onClick={handleJoinMatch}
                    disabled={selectedSlot === null}
                    className={`w-full py-6 rounded-2xl font-black uppercase tracking-[0.3em] text-sm shadow-2xl transition-all relative overflow-hidden group ${
                      selectedSlot === null
                      ? "bg-gray-800 text-gray-500 cursor-not-allowed"
                      : "bg-dragon-gold text-black hover:bg-yellow-300 shadow-dragon-gold/30 active:scale-95"
                    }`}
                  >
                    <span className="relative z-10">ENTER BATTLEFIELD</span>
                    <motion.div 
                       className="absolute inset-0 bg-white/20 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 skew-x-12"
                    />
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {showJoinedPlayers && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="w-full max-w-md bg-dragon-dark border border-dragon-gold/30 rounded-[2.5rem] overflow-hidden flex flex-col max-h-[85vh] shadow-[0_0_100px_rgba(255,215,0,0.1)]"
            >
              <div className="p-8 border-b border-white/5 flex justify-between items-center bg-black/40">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-dragon-gold flex items-center justify-center text-black shadow-lg">
                    <ShieldCheck size={24} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black uppercase italic text-dragon-gold leading-none">Combatants</h3>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em] mt-1">Warrior active list</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowJoinedPlayers(null)}
                  className="h-12 w-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-red-500/20 transition-all"
                >
                  <ArrowLeft size={20} className="rotate-90" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 dragon-scales">
                <div className="space-y-4">
                  {games[showJoinedPlayers.gIndex].matches[showJoinedPlayers.mIndex].joinedUserList && 
                   games[showJoinedPlayers.gIndex].matches[showJoinedPlayers.mIndex].joinedUserList.length > 0 ? (
                    games[showJoinedPlayers.gIndex].matches[showJoinedPlayers.mIndex].joinedUserList.map((player: any, pIdx: number) => (
                      <motion.div 
                        key={pIdx} 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: pIdx * 0.05 }}
                        className="bg-black/40 border border-white/5 p-5 rounded-2xl flex justify-between items-center group hover:border-dragon-gold/30 transition-all"
                      >
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-dragon-gold font-black text-lg italic group-hover:bg-dragon-gold group-hover:text-black transition-all">
                            {player.slot.toString().padStart(2, '0')}
                          </div>
                          <div>
                            <p className="text-base font-black uppercase italic text-white truncate max-w-[150px] tracking-tight">{player.name}</p>
                            <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mt-0.5">Warrior ID: {player.id}</p>
                          </div>
                        </div>
                        <div className="text-right">
                           <div className="flex items-center gap-1.5 bg-dragon-gold/10 px-3 py-1.5 rounded-xl border border-dragon-gold/20">
                              <Zap size={10} className="text-dragon-gold" />
                              <span className="text-[9px] font-black uppercase text-dragon-gold tracking-[0.2em]">REGISTERED</span>
                           </div>
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <div className="py-24 text-center opacity-20 space-y-4">
                      <Gamepad2 size={80} className="mx-auto text-gray-400 animate-pulse" />
                      <p className="text-xs font-black uppercase tracking-[0.4em] text-gray-400 italic">Arena empty...</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute top-1/4 -left-20 h-96 w-96 rounded-full bg-dragon-red/10 blur-[120px] animate-pulse" />
      <div className="absolute bottom-1/4 -right-20 h-96 w-96 rounded-full bg-dragon-fire/10 blur-[120px] animate-pulse delay-1000" />
    </div>
  );
}




