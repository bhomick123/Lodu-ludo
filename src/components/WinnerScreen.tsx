import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { Trophy, RotateCcw, Users, Home, Sparkles, Crown } from 'lucide-react';
import { Player } from '../types';
import { CharacterAvatar } from './CharacterAvatar';
import { CHARACTERS } from '../data/characters';
import { COLOR_CONFIG } from '../utils/ludoConstants';
import { sounds } from '../utils/audio';

interface WinnerScreenProps {
  winner: Player;
  onPlayAgain: () => void;
  onChangeCharacters: () => void;
  onGoHome: () => void;
}

export const WinnerScreen: React.FC<WinnerScreenProps> = ({
  winner,
  onPlayAgain,
  onChangeCharacters,
  onGoHome,
}) => {
  const char = CHARACTERS[winner.characterId];
  const colorCfg = COLOR_CONFIG[winner.color];

  useEffect(() => {
    sounds.playWinFanfare();
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-neutral-950/90 backdrop-blur-xl flex items-center justify-center p-4 selection:bg-amber-400">
      <motion.div
        initial={{ opacity: 0, scale: 0.85, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', damping: 20, stiffness: 260 }}
        className="w-full max-w-md bg-neutral-900 border border-white/20 rounded-3xl p-6 sm:p-8 text-center text-white shadow-2xl relative overflow-hidden"
      >
        {/* Decorative Golden Ambient Glow */}
        <div
          className="absolute -top-24 -left-24 w-48 h-48 rounded-full blur-3xl opacity-40 pointer-events-none"
          style={{ backgroundColor: colorCfg.bgHex }}
        />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 rounded-full bg-amber-500 blur-3xl opacity-30 pointer-events-none" />

        {/* Animated Trophy Icon */}
        <motion.div
          animate={{ rotate: [-8, 8, -8], scale: [1, 1.08, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-3xl bg-amber-400/20 border-2 border-amber-400/80 flex items-center justify-center mb-4 shadow-lg text-amber-300"
        >
          <Trophy className="w-8 h-8 sm:w-10 sm:h-10 fill-amber-400 text-amber-950" />
        </motion.div>

        {/* Title */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 text-xs font-black uppercase tracking-widest mb-2">
          <Sparkles className="w-3.5 h-3.5" /> LODU CHAMPION 🏆
        </div>

        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1">
          {winner.name} Wins!
        </h2>

        {/* Winner Avatar Card */}
        <div className="my-6 p-4 rounded-2xl bg-neutral-800/80 border border-white/10 flex flex-col items-center shadow-inner relative">
          <div className="relative mb-3">
            <div
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-full p-1.5 shadow-2xl flex items-center justify-center border-4"
              style={{ backgroundColor: colorCfg.bgHex, borderColor: '#F59E0B' }}
            >
              <CharacterAvatar id={winner.characterId} size="lg" />
            </div>
            <div className="absolute -top-2 -right-2 bg-amber-400 text-neutral-950 p-1.5 rounded-full shadow-md">
              <Crown className="w-5 h-5 fill-current" />
            </div>
          </div>

          <span
            className="text-xs uppercase font-extrabold px-2.5 py-0.5 rounded-full mb-1"
            style={{ backgroundColor: colorCfg.bgHex }}
          >
            {colorCfg.name} Master
          </span>

          <p className="text-sm sm:text-base font-semibold text-amber-200 italic mt-2 text-center max-w-xs">
            "{char?.winQuote || 'Victory achieved!'}"
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5">
          <motion.button
            id="play-again-btn"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onPlayAgain}
            className="w-full py-3.5 px-6 rounded-2xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-amber-400/20 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 stroke-[2.5]" /> PLAY AGAIN
          </motion.button>

          <div className="grid grid-cols-2 gap-2.5">
            <motion.button
              id="change-characters-btn"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onChangeCharacters}
              className="py-3 px-3 rounded-2xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-white/10 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Users className="w-4 h-4" /> Change Heroes
            </motion.button>

            <motion.button
              id="go-home-btn"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onGoHome}
              className="py-3 px-3 rounded-2xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-white/10 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Home className="w-4 h-4" /> Home
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
