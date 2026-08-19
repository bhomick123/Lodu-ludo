import React from 'react';
import { motion } from 'motion/react';
import { Play, Check, ArrowLeft, Shuffle, Bot, User, Users, Shield, Sparkles } from 'lucide-react';
import { AIDifficulty, CharacterId, GameMode, PlayerColor, PlayerType } from '../types';
import { CharacterAvatar } from './CharacterAvatar';
import { CHARACTERS } from '../data/characters';
import { COLOR_CONFIG } from '../utils/ludoConstants';
import { sounds } from '../utils/audio';

interface CharacterSelectionProps {
  gameMode: GameMode;
  onSetGameMode: (mode: GameMode) => void;
  selectedCharacters: Record<number, CharacterId>;
  onSelectCharacter: (playerIndex: number, charId: CharacterId) => void;
  playerTypes: Record<number, PlayerType>;
  onTogglePlayerType: (playerIndex: number) => void;
  aiDifficulty: AIDifficulty;
  onSetAiDifficulty: (diff: AIDifficulty) => void;
  onRandomize: () => void;
  onStartGame: () => void;
  onBack: () => void;
}

const PLAYER_COLORS: PlayerColor[] = ['red', 'green', 'yellow', 'blue'];
const ALL_CHAR_IDS: CharacterId[] = ['modi', 'kejriwal', 'rahul', 'trump'];

export const CharacterSelection: React.FC<CharacterSelectionProps> = ({
  gameMode,
  onSetGameMode,
  selectedCharacters,
  onSelectCharacter,
  playerTypes,
  onTogglePlayerType,
  aiDifficulty,
  onSetAiDifficulty,
  onRandomize,
  onStartGame,
  onBack,
}) => {
  // Check which characters are already taken by other players
  const isCharTakenByOther = (charId: CharacterId, playerIndex: number) => {
    return Object.entries(selectedCharacters).some(
      ([pIdx, cId]) => Number(pIdx) !== playerIndex && cId === charId
    );
  };

  // Are all 4 players assigned unique characters?
  const uniqueCount = new Set(Object.values(selectedCharacters)).size;
  const isReady = uniqueCount === 4;

  const handleModeChange = (mode: GameMode) => {
    sounds.playButton();
    onSetGameMode(mode);
  };

  const handleDiffChange = (diff: AIDifficulty) => {
    sounds.playButton();
    onSetAiDifficulty(diff);
  };

  const hasAnyAI = Object.values(playerTypes).some((t) => t === 'ai');

  return (
    <div className="min-h-screen w-full bg-[#180d28] text-white flex flex-col justify-between p-3 sm:p-5 select-none overflow-y-auto">
      {/* Top Header */}
      <div className="max-w-xl w-full mx-auto flex items-center justify-between py-1">
        <button
          onClick={() => {
            sounds.playButton();
            onBack();
          }}
          className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors flex items-center gap-1 text-xs font-bold cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </button>

        <div className="text-center">
          <h1 className="text-lg sm:text-xl font-black tracking-tight text-amber-300">
            MATCH SETUP
          </h1>
          <p className="text-[11px] text-neutral-400">Configure players & leaders</p>
        </div>

        <button
          onClick={() => {
            sounds.playButton();
            onRandomize();
          }}
          className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-amber-300 transition-colors flex items-center gap-1 text-xs font-bold cursor-pointer"
          title="Randomize characters"
        >
          <Shuffle className="w-4 h-4" />
        </button>
      </div>

      {/* Mode & Difficulty Selector Card */}
      <div className="max-w-xl w-full mx-auto my-2 bg-neutral-900/90 border border-white/15 rounded-2xl p-3 sm:p-3.5 shadow-xl backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          {/* Mode Switch */}
          <div className="flex items-center gap-1.5 bg-neutral-950/80 p-1 rounded-xl border border-white/10 w-full sm:w-auto">
            <button
              onClick={() => handleModeChange('ai')}
              className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                gameMode === 'ai'
                  ? 'bg-amber-400 text-neutral-950 shadow-md'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Bot className="w-3.5 h-3.5" /> vs AI
            </button>
            <button
              onClick={() => handleModeChange('local')}
              className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                gameMode === 'local'
                  ? 'bg-amber-400 text-neutral-950 shadow-md'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" /> Pass & Play
            </button>
          </div>

          {/* AI Difficulty Selector (Visible when AI players exist) */}
          {hasAnyAI && (
            <div className="flex items-center gap-1.5 w-full sm:w-auto justify-end">
              <span className="text-[11px] font-bold text-neutral-400 shrink-0">AI Level:</span>
              <div className="flex items-center gap-1 bg-neutral-950/80 p-1 rounded-xl border border-white/10">
                <button
                  onClick={() => handleDiffChange('easy')}
                  className={`px-2 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                    aiDifficulty === 'easy'
                      ? 'bg-emerald-500 text-white font-extrabold shadow-sm'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  🟢 Easy
                </button>
                <button
                  onClick={() => handleDiffChange('medium')}
                  className={`px-2 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                    aiDifficulty === 'medium'
                      ? 'bg-amber-500 text-neutral-950 font-extrabold shadow-sm'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  🟡 Med
                </button>
                <button
                  onClick={() => handleDiffChange('hard')}
                  className={`px-2 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                    aiDifficulty === 'hard'
                      ? 'bg-rose-500 text-white font-extrabold shadow-sm'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  🔴 Hard
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 4 Player Selection Slots */}
      <div className="max-w-xl w-full mx-auto my-1 space-y-2.5 flex-1 flex flex-col justify-center">
        {[0, 1, 2, 3].map((playerIndex) => {
          const color = PLAYER_COLORS[playerIndex];
          const colorCfg = COLOR_CONFIG[color];
          const currentSelection = selectedCharacters[playerIndex];
          const currentChar = CHARACTERS[currentSelection];
          const isAI = playerTypes[playerIndex] === 'ai';

          return (
            <div
              key={playerIndex}
              className="bg-neutral-900/90 border border-white/15 rounded-2xl p-2.5 sm:p-3 shadow-xl backdrop-blur-sm"
            >
              {/* Player Tag & Human/AI Switch */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span
                    className="text-[10px] font-extrabold px-2 py-0.5 rounded-md text-white uppercase tracking-wider shadow-xs"
                    style={{ backgroundColor: colorCfg.bgHex }}
                  >
                    P{playerIndex + 1} ({colorCfg.name})
                  </span>

                  {/* Human / AI Toggle Button */}
                  <button
                    onClick={() => {
                      sounds.playButton();
                      onTogglePlayerType(playerIndex);
                    }}
                    className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold flex items-center gap-1 border transition-all cursor-pointer ${
                      isAI
                        ? 'bg-purple-900/80 border-purple-400/60 text-purple-200'
                        : 'bg-blue-900/80 border-blue-400/60 text-blue-200'
                    }`}
                    title="Click to toggle Human / AI"
                  >
                    {isAI ? (
                      <>
                        <Bot className="w-3 h-3 text-purple-300" /> AI
                      </>
                    ) : (
                      <>
                        <User className="w-3 h-3 text-blue-300" /> Human
                      </>
                    )}
                  </button>
                </div>

                {currentChar && (
                  <span className="text-[11px] text-amber-300/90 italic font-medium truncate max-w-[170px] sm:max-w-[220px]">
                    "{currentChar.catchphrase}"
                  </span>
                )}
              </div>

              {/* 4 Character Choice Pills */}
              <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
                {ALL_CHAR_IDS.map((charId) => {
                  const char = CHARACTERS[charId];
                  const isSelected = currentSelection === charId;
                  const isTaken = isCharTakenByOther(charId, playerIndex);

                  return (
                    <button
                      key={charId}
                      disabled={isTaken}
                      onClick={() => {
                        sounds.playButton();
                        onSelectCharacter(playerIndex, charId);
                      }}
                      className={`relative rounded-xl p-1.5 flex flex-col items-center justify-center transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-amber-400 text-neutral-950 font-bold ring-2 sm:ring-3 ring-amber-300 shadow-md scale-[1.02]'
                          : isTaken
                          ? 'bg-neutral-950/60 text-neutral-600 opacity-35 cursor-not-allowed border border-white/5'
                          : 'bg-neutral-800/80 hover:bg-neutral-700/80 text-white border border-white/10'
                      }`}
                    >
                      <CharacterAvatar id={charId} size="xs" className="w-7 h-7 sm:w-8 sm:h-8 mb-0.5" />
                      <span className="text-[10px] sm:text-[11px] truncate w-full text-center leading-tight">
                        {char.shortName}
                      </span>

                      {isSelected && (
                        <div className="absolute -top-1 -right-1 bg-neutral-950 text-amber-400 rounded-full p-0.5 shadow-xs">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Start Button */}
      <div className="max-w-xl w-full mx-auto py-1.5">
        <motion.button
          id="start-lodu-button"
          whileHover={{ scale: isReady ? 1.02 : 1 }}
          whileTap={{ scale: isReady ? 0.98 : 1 }}
          disabled={!isReady}
          onClick={() => {
            sounds.playButton();
            onStartGame();
          }}
          className={`w-full py-3.5 px-6 rounded-2xl font-black text-base uppercase tracking-wider flex items-center justify-center gap-2.5 shadow-2xl transition-all ${
            isReady
              ? 'bg-amber-400 hover:bg-amber-300 text-neutral-950 cursor-pointer shadow-amber-400/30'
              : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
          }`}
        >
          <Play className="w-5 h-5 fill-current" /> START MATCH
        </motion.button>
      </div>
    </div>
  );
};
