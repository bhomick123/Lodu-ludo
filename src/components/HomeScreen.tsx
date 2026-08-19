import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Volume2, 
  VolumeX, 
  Sparkles, 
  BookOpen, 
  Crown, 
  Dices, 
  Bot, 
  Users, 
  X, 
  ChevronRight, 
  ShieldCheck, 
  Coins, 
  Gamepad2
} from 'lucide-react';
import { CharacterAvatar } from './CharacterAvatar';
import { CHARACTERS } from '../data/characters';
import { sounds } from '../utils/audio';
import { GameMode } from '../types';

interface HomeScreenProps {
  onStart: (mode: GameMode) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onStart }) => {
  const [isMuted, setIsMuted] = useState(sounds.getMuted());
  const [showRules, setShowRules] = useState(false);
  const [selectedLeaderQuote, setSelectedLeaderQuote] = useState<string | null>(null);

  const toggleSound = () => {
    const muted = sounds.toggleMute();
    setIsMuted(muted);
  };

  const characterList = Object.values(CHARACTERS);

  return (
    <div className="min-h-screen w-full bg-[#140824] text-white flex flex-col justify-between pb-18 relative select-none overflow-x-hidden">
      {/* Background ambient lighting */}
      <div className="fixed -top-32 -left-32 w-96 h-96 rounded-full bg-purple-700/20 blur-3xl pointer-events-none" />
      <div className="fixed top-1/2 -right-32 w-80 h-80 rounded-full bg-amber-500/15 blur-3xl pointer-events-none" />
      <div className="fixed -bottom-20 left-1/4 w-96 h-96 rounded-full bg-blue-600/15 blur-3xl pointer-events-none" />

      {/* TOP HEADER */}
      <header className="sticky top-0 z-40 bg-[#140824]/90 backdrop-blur-md border-b border-white/10 px-4 py-2.5">
        <div className="max-w-md mx-auto flex items-center justify-between">
          {/* Logo & Brand */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 text-neutral-950 flex items-center justify-center font-black shadow-md shadow-amber-500/25">
              <Dices className="w-5 h-5" />
            </div>
            <div>
              <span className="text-sm font-black tracking-wider text-white">
                LUCKY <span className="text-amber-400">LUDO</span>
              </span>
              <div className="text-[9px] text-amber-300/80 font-bold uppercase tracking-widest leading-none">
                Political Edition
              </div>
            </div>
          </div>

          {/* Top Action Pills (Coins, Rules, Audio) */}
          <div className="flex items-center gap-1.5">
            {/* Currency Pill */}
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-neutral-900/80 border border-amber-400/30 text-amber-300 text-[11px] font-black shadow-inner">
              <Coins className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span>2,500</span>
            </div>

            {/* Rules Button */}
            <button
              onClick={() => {
                sounds.playButton();
                setShowRules(true);
              }}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/15 text-white transition-colors cursor-pointer"
              title="Game Rules"
            >
              <BookOpen className="w-4 h-4 text-amber-300" />
            </button>

            {/* Audio Toggle Button */}
            <button
              onClick={toggleSound}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/15 text-white transition-colors cursor-pointer"
              title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
            >
              {isMuted ? (
                <VolumeX className="w-4 h-4 text-rose-400" />
              ) : (
                <Volume2 className="w-4 h-4 text-emerald-400" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="max-w-md w-full mx-auto px-4 py-3 space-y-4 z-10 flex-1">
        {/* HERO BANNER */}
        <section className="relative rounded-3xl bg-gradient-to-br from-purple-900/80 via-neutral-900/90 to-neutral-950 border border-white/15 p-4 shadow-2xl overflow-hidden">
          {/* Subtle Glow */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />

          <div className="flex items-center justify-between mb-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[10px] font-black uppercase tracking-wider">
              <Sparkles className="w-3 h-3" /> Season 1 • Election Special
            </span>
            <span className="text-[10px] text-neutral-400 font-bold">
              4 Players • 57 Steps
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
            Battle for the <span className="text-amber-400">Board!</span>
          </h1>
          <p className="text-xs text-neutral-300 mt-1 font-medium leading-relaxed">
            Lead Modi, Kejriwal, Rahul, or Trump to victory with authentic dice rolls, token cutting, and star safe zones!
          </p>

          {/* 4 Political Leaders Interactive Showcase */}
          <div className="grid grid-cols-4 gap-2 mt-3 pt-3 border-t border-white/10">
            {characterList.map((char) => (
              <motion.button
                key={char.id}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  sounds.playButton();
                  setSelectedLeaderQuote(
                    selectedLeaderQuote === char.id ? null : char.id
                  );
                }}
                className={`flex flex-col items-center p-1.5 rounded-2xl border transition-all cursor-pointer ${
                  selectedLeaderQuote === char.id
                    ? 'bg-amber-400/20 border-amber-400 ring-2 ring-amber-400/40'
                    : 'bg-white/5 hover:bg-white/10 border-white/10'
                }`}
              >
                <div className="w-11 h-11 rounded-full p-0.5 bg-neutral-900 border border-white/20 shadow-md flex items-center justify-center mb-1">
                  <CharacterAvatar id={char.id} size="xs" />
                </div>
                <span className="text-[10px] font-extrabold text-white truncate w-full text-center">
                  {char.shortName}
                </span>
              </motion.button>
            ))}
          </div>

          {/* Selected Leader Speech Bubble Preview */}
          <AnimatePresence>
            {selectedLeaderQuote && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-2.5 p-2 rounded-xl bg-amber-400/10 border border-amber-400/30 text-amber-200 text-[11px] font-semibold italic text-center"
              >
                "{CHARACTERS[selectedLeaderQuote]?.catchphrase}"
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* PRIMARY GAME MODES SECTION */}
        <section className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-black uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
              <Gamepad2 className="w-4 h-4 text-amber-400" /> Choose Game Mode
            </h2>
            <span className="text-[10px] text-neutral-400 font-bold">2-4 Players</span>
          </div>

          <div className="grid grid-cols-1 gap-2.5">
            {/* 1. PASS & PLAY */}
            <motion.button
              id="home-pass-and-play-btn"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                sounds.playButton();
                onStart('local');
              }}
              className="relative w-full p-4 rounded-3xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-neutral-950 shadow-xl shadow-amber-500/20 flex items-center justify-between border-2 border-amber-300 cursor-pointer overflow-hidden group"
            >
              <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 pointer-events-none" />

              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-neutral-950 text-amber-400 flex items-center justify-center shadow-lg font-black shrink-0">
                  <Users className="w-6 h-6" />
                </div>
                <div className="text-left">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-black uppercase tracking-tight text-neutral-950">
                      PASS & PLAY
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-neutral-950 text-amber-400 text-[9px] font-black uppercase">
                      LOCAL
                    </span>
                  </div>
                  <p className="text-[11px] font-bold text-neutral-800 leading-tight mt-0.5">
                    2, 3, or 4 Players on one device with custom names & leaders
                  </p>
                </div>
              </div>

              <div className="w-8 h-8 rounded-full bg-neutral-950/15 flex items-center justify-center shrink-0">
                <ChevronRight className="w-5 h-5 text-neutral-950 stroke-[3]" />
              </div>
            </motion.button>

            {/* 2. PLAY VS COMPUTER (AI) */}
            <motion.button
              id="home-play-vs-ai-btn"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                sounds.playButton();
                onStart('ai');
              }}
              className="relative w-full p-4 rounded-3xl bg-gradient-to-r from-purple-900/90 via-indigo-900/90 to-purple-900/90 border border-purple-400/40 text-white shadow-xl shadow-purple-900/30 flex items-center justify-between cursor-pointer overflow-hidden group"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-purple-600/30 border border-purple-400/40 text-purple-300 flex items-center justify-center shadow-lg font-black shrink-0">
                  <Bot className="w-6 h-6" />
                </div>
                <div className="text-left">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-black uppercase tracking-tight text-white">
                      VS COMPUTER
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-neutral-950 text-[9px] font-black uppercase">
                      SMART AI
                    </span>
                  </div>
                  <p className="text-[11px] font-medium text-purple-200/80 leading-tight mt-0.5">
                    Challenge Easy, Medium, or Hard AI with tactical move logic
                  </p>
                </div>
              </div>

              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                <ChevronRight className="w-5 h-5 text-white stroke-[3]" />
              </div>
            </motion.button>

            {/* 3. FRIENDS ROOM (ACTIVE MULTIPLAYER) */}
            <motion.button
              id="home-friends-room-btn"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                sounds.playButton();
                onStart('friends');
              }}
              className="relative w-full p-4 rounded-3xl bg-gradient-to-r from-emerald-900/90 via-teal-900/90 to-emerald-900/90 border-2 border-emerald-400/50 text-white shadow-xl shadow-emerald-950/40 flex items-center justify-between cursor-pointer overflow-hidden group"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/25 border border-emerald-400/40 text-emerald-300 flex items-center justify-center shadow-lg font-black shrink-0">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div className="text-left">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-black uppercase tracking-tight text-white">
                      FRIENDS ROOM
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-400 text-neutral-950 text-[9px] font-black uppercase">
                      ROOM CODE
                    </span>
                  </div>
                  <p className="text-[11px] font-medium text-emerald-200/80 leading-tight mt-0.5">
                    Create or join private room lobby to play with friends (2-4P)
                  </p>
                </div>
              </div>

              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                <ChevronRight className="w-5 h-5 text-white stroke-[3]" />
              </div>
            </motion.button>
          </div>
        </section>
      </main>

      {/* FOOTER CONTROLS */}
      <footer className="max-w-md w-full mx-auto px-4 py-2 flex items-center justify-between text-neutral-400 text-xs z-10">
        <button
          onClick={() => {
            sounds.playButton();
            setShowRules(true);
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-300 font-bold transition-colors cursor-pointer"
        >
          <BookOpen className="w-4 h-4 text-amber-400" /> Game Rules
        </button>

        <div className="text-[10px] text-neutral-500 font-semibold">
          v1.0 MVP • 100% Authentic Ludo
        </div>
      </footer>

      {/* LUDO RULES MODAL */}
      {showRules && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-md bg-neutral-900 border border-white/20 rounded-3xl p-6 text-white shadow-2xl max-h-[85vh] overflow-y-auto select-none"
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-amber-400" />
                <h3 className="text-lg font-black">Official Ludo Rules</h3>
              </div>
              <button
                onClick={() => {
                  sounds.playButton();
                  setShowRules(false);
                }}
                className="p-1.5 rounded-lg hover:bg-white/10 text-neutral-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 my-4 text-xs sm:text-sm text-neutral-300 leading-relaxed">
              <div className="flex gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-amber-400/20 text-amber-300 font-bold flex items-center justify-center shrink-0">
                  1
                </div>
                <p>
                  <strong>Roll 6 to Release:</strong> Roll a 6 to bring a goti out of base onto your colored starting square.
                </p>
              </div>

              <div className="flex gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-amber-400/20 text-amber-300 font-bold flex items-center justify-center shrink-0">
                  2
                </div>
                <p>
                  <strong>Extra Turns:</strong> Rolling a 6, cutting an opponent's goti, or landing a token into Home grants an extra roll!
                </p>
              </div>

              <div className="flex gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-amber-400/20 text-amber-300 font-bold flex items-center justify-center shrink-0">
                  3
                </div>
                <p>
                  <strong>Goti Cutting (Capture):</strong> Landing on an opponent's goti on any regular square sends their token straight back to base!
                </p>
              </div>

              <div className="flex gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-amber-400/20 text-amber-300 font-bold flex items-center justify-center shrink-0">
                  4
                </div>
                <p>
                  <strong>Safe Star Squares:</strong> 8 squares with Star ⭐ icons are safe zones where gotis cannot be cut.
                </p>
              </div>

              <div className="flex gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-amber-400/20 text-amber-300 font-bold flex items-center justify-center shrink-0">
                  5
                </div>
                <p>
                  <strong>2-Token Block / Stack:</strong> Stacking 2 of your own gotis creates a protective block that opponents cannot pass or cut!
                </p>
              </div>

              <div className="flex gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-amber-400/20 text-amber-300 font-bold flex items-center justify-center shrink-0">
                  6
                </div>
                <p>
                  <strong>Exact Roll to Win:</strong> An exact roll is required to enter the final center Home (step 57). First player with all 4 tokens in Home wins!
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                sounds.playButton();
                setShowRules(false);
              }}
              className="w-full py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-black text-xs uppercase tracking-wider cursor-pointer shadow-lg transition-all"
            >
              GOT IT, LET'S PLAY
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
};
