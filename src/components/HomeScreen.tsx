import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Play, Volume2, VolumeX, Sparkles, BookOpen, Crown, Dices, Shield, X } from 'lucide-react';
import { CharacterAvatar } from './CharacterAvatar';
import { CHARACTERS } from '../data/characters';
import { sounds } from '../utils/audio';

interface HomeScreenProps {
  onStart: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onStart }) => {
  const [isMuted, setIsMuted] = useState(sounds.getMuted());
  const [showRules, setShowRules] = useState(false);

  const toggleSound = () => {
    const muted = sounds.toggleMute();
    setIsMuted(muted);
  };

  const characterList = Object.values(CHARACTERS);

  return (
    <div className="min-h-screen w-full bg-[#180d28] text-white flex flex-col justify-between p-4 sm:p-6 relative overflow-hidden select-none">
      {/* Background ambient lighting */}
      <div className="absolute -top-32 -left-32 w-80 h-80 rounded-full bg-purple-600/20 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-80 h-80 rounded-full bg-amber-500/20 blur-3xl pointer-events-none" />

      {/* Top Navbar */}
      <div className="max-w-xl w-full mx-auto flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-400 text-neutral-950 flex items-center justify-center font-black text-sm shadow-md">
            <Dices className="w-5 h-5" />
          </div>
          <span className="text-xs font-black tracking-widest text-amber-300 uppercase">
            Pass & Play Ludo
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowRules(true)}
            className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors flex items-center gap-1.5 text-xs font-bold cursor-pointer"
            title="How to play"
          >
            <BookOpen className="w-4 h-4 text-amber-300" />
            <span className="hidden sm:inline">Rules</span>
          </button>

          <button
            onClick={toggleSound}
            className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            title={isMuted ? 'Unmute audio' : 'Mute audio'}
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4 text-rose-400" />
            ) : (
              <Volume2 className="w-4 h-4 text-emerald-400" />
            )}
          </button>
        </div>
      </div>

      {/* Hero Center Section */}
      <div className="max-w-xl w-full mx-auto my-auto py-6 flex flex-col items-center text-center z-10">
        {/* Main Badge */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 text-xs font-extrabold tracking-widest uppercase mb-4"
        >
          <Sparkles className="w-4 h-4" /> 4-Player Local Multiplayer
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-5xl sm:text-6xl font-black tracking-tight text-white drop-shadow-2xl"
        >
          LODU <span className="text-amber-400">LUDO</span>
        </motion.h1>

        <p className="text-sm sm:text-base text-neutral-300 max-w-sm mt-2 font-medium">
          The ultimate 4-player pass-and-play political showdown for four friends on one phone.
        </p>

        {/* 4 Featured Caricature Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 w-full my-8">
          {characterList.map((char) => (
            <motion.div
              key={char.id}
              whileHover={{ scale: 1.05, y: -2 }}
              className="bg-neutral-900/80 border border-white/15 rounded-2xl p-3 flex flex-col items-center shadow-lg backdrop-blur-sm"
            >
              <div className="w-14 h-14 rounded-full p-1 bg-white/10 flex items-center justify-center mb-2 shadow-inner">
                <CharacterAvatar id={char.id} size="md" />
              </div>
              <span className="text-xs font-black text-white truncate max-w-full">
                {char.name}
              </span>
              <span className="text-[10px] text-amber-300/80 font-medium truncate max-w-full mt-0.5">
                {char.tagline}
              </span>
            </motion.div>
          ))}
        </div>

        {/* Play Button */}
        <motion.button
          id="play-game-button"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={onStart}
          className="w-full py-4 px-8 rounded-2xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-black text-lg uppercase tracking-wider flex items-center justify-center gap-3 shadow-2xl shadow-amber-400/30 cursor-pointer transition-all"
        >
          <Play className="w-6 h-6 fill-current" /> PLAY 4-PLAYER LODU
        </motion.button>
      </div>

      {/* Footer Info */}
      <div className="max-w-xl w-full mx-auto text-center py-2 text-xs text-neutral-500 z-10">
        Authentic Ludo Rules • 4 Tokens • Animated Dice • Token Cutting
      </div>

      {/* Rules Modal */}
      {showRules && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-md bg-neutral-900 border border-white/20 rounded-3xl p-6 text-white shadow-2xl max-h-[85vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-amber-400" />
                <h3 className="text-lg font-bold">Lodu Ludo Rules</h3>
              </div>
              <button
                onClick={() => setShowRules(false)}
                className="p-1 rounded-lg hover:bg-white/10 text-neutral-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 my-4 text-xs sm:text-sm text-neutral-300 leading-relaxed">
              <div className="flex gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-amber-400/20 text-amber-300 font-bold flex items-center justify-center shrink-0">1</div>
                <p><strong>Roll 6 to Release:</strong> Roll a 6 to bring a goti out of base onto your colored starting square.</p>
              </div>

              <div className="flex gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-amber-400/20 text-amber-300 font-bold flex items-center justify-center shrink-0">2</div>
                <p><strong>Extra Turns:</strong> Rolling a 6, cutting an opponent's goti, or landing a token into Home grants an extra roll!</p>
              </div>

              <div className="flex gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-amber-400/20 text-amber-300 font-bold flex items-center justify-center shrink-0">3</div>
                <p><strong>Goti Cutting:</strong> Landing on an opponent's token on any regular square sends their token straight back to base!</p>
              </div>

              <div className="flex gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-amber-400/20 text-amber-300 font-bold flex items-center justify-center shrink-0">4</div>
                <p><strong>Safe Star Squares:</strong> 8 squares with Star ⭐ icons are safe zones where gotis cannot be cut.</p>
              </div>

              <div className="flex gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-amber-400/20 text-amber-300 font-bold flex items-center justify-center shrink-0">5</div>
                <p><strong>Exact Roll to Win:</strong> An exact roll is required to enter the final center Home. First player with all 4 tokens in Home wins!</p>
              </div>
            </div>

            <button
              onClick={() => setShowRules(false)}
              className="w-full py-3 rounded-xl bg-amber-400 text-neutral-950 font-bold text-xs uppercase tracking-wider"
            >
              GOT IT, LET'S PLAY
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
};
