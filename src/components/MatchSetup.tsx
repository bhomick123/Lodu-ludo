import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
  Shuffle, 
  Bot, 
  User, 
  Users, 
  Play, 
  Check, 
  Sparkles, 
  Lock, 
  Crown, 
  Volume2, 
  HelpCircle,
  Gamepad2,
  Swords
} from 'lucide-react';
import { 
  AIDifficulty, 
  CharacterId, 
  GameMode, 
  GameSubMode, 
  PlayerColor, 
  PlayerCount, 
  PlayerType 
} from '../types';
import { CharacterAvatar } from './CharacterAvatar';
import { CHARACTERS } from '../data/characters';
import { COLOR_CONFIG } from '../utils/ludoConstants';
import { sounds } from '../utils/audio';

interface MatchSetupProps {
  gameMode: GameMode;
  onSetGameMode: (mode: GameMode) => void;
  subMode: GameSubMode;
  onSetSubMode: (subMode: GameSubMode) => void;
  playerCount: PlayerCount;
  onSetPlayerCount: (count: PlayerCount) => void;
  selectedCharacters: Record<number, CharacterId>;
  onSelectCharacter: (playerIndex: number, charId: CharacterId) => void;
  playerTypes: Record<number, PlayerType>;
  onTogglePlayerType: (playerIndex: number) => void;
  playerNames: Record<number, string>;
  onUpdatePlayerName: (playerIndex: number, name: string) => void;
  aiDifficulty: AIDifficulty;
  onSetAiDifficulty: (diff: AIDifficulty) => void;
  onRandomize: () => void;
  onStartGame: () => void;
  onBack: () => void;
}

const PLAYER_COLORS: PlayerColor[] = ['red', 'green', 'yellow', 'blue'];
const ALL_CHAR_IDS: CharacterId[] = ['modi', 'kejriwal', 'rahul', 'trump'];

/**
 * Returns the active player indices (0-3) for a given player count:
 * - 2 Players: [3, 1] (Blue Bottom-Left Human/P1 & Green Top-Right AI/P2)
 * - 3 Players: [3, 0, 1] (Blue Bottom-Left Human/P1, Red Top-Left AI/P2, Green Top-Right AI/P3)
 * - 4 Players: [3, 0, 1, 2] (Blue Bottom-Left Human/P1, Red Top-Left AI/P2, Green Top-Right AI/P3, Yellow Bottom-Right AI/P4)
 */
export function getActivePlayerIndices(count: PlayerCount): number[] {
  if (count === 2) return [3, 1];
  if (count === 3) return [3, 0, 1];
  return [3, 0, 1, 2];
}

export const MatchSetup: React.FC<MatchSetupProps> = ({
  gameMode,
  onSetGameMode,
  subMode,
  onSetSubMode,
  playerCount,
  onSetPlayerCount,
  selectedCharacters,
  onSelectCharacter,
  playerTypes,
  onTogglePlayerType,
  playerNames,
  onUpdatePlayerName,
  aiDifficulty,
  onSetAiDifficulty,
  onRandomize,
  onStartGame,
  onBack,
}) => {
  const activeIndices = getActivePlayerIndices(playerCount);

  // Check if all active players have unique characters
  const activeCharacters = activeIndices.map((idx) => selectedCharacters[idx]);
  const isUnique = new Set(activeCharacters).size === activeIndices.length;
  const isReady = isUnique;

  const hasAnyAI = activeIndices.some((idx) => playerTypes[idx] === 'ai');

  // Handle character choice and prevent duplicate by swapping with other active player
  const handlePickCharacter = (playerIndex: number, charId: CharacterId) => {
    sounds.playButton();
    onSelectCharacter(playerIndex, charId);
  };

  return (
    <div className="min-h-screen w-full bg-[#140824] text-white flex flex-col justify-between p-3 sm:p-5 select-none relative overflow-x-hidden">
      {/* Background ambient lighting */}
      <div className="fixed -top-32 -left-32 w-80 h-80 rounded-full bg-purple-700/20 blur-3xl pointer-events-none" />
      <div className="fixed -bottom-32 -right-32 w-80 h-80 rounded-full bg-amber-500/20 blur-3xl pointer-events-none" />

      {/* TOP HEADER */}
      <header className="max-w-md w-full mx-auto flex items-center justify-between py-1.5 z-10">
        <button
          onClick={() => {
            sounds.playButton();
            onBack();
          }}
          className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors flex items-center gap-1.5 text-xs font-bold cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <div className="text-center">
          <h1 className="text-base sm:text-lg font-black tracking-tight text-amber-300">
            MATCH SETUP
          </h1>
          <p className="text-[10px] text-neutral-400 font-medium">
            Configure mode, players & leaders
          </p>
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
      </header>

      {/* MAIN CONFIGURATION CARDS */}
      <main className="max-w-md w-full mx-auto my-2 space-y-3 z-10 flex-1 overflow-y-auto pr-0.5">
        {/* 1. SEGMENTED PRIMARY MODE (PASS & PLAY vs VS AI) */}
        <section className="bg-neutral-900/90 border border-white/15 rounded-2xl p-2.5 shadow-xl backdrop-blur-sm">
          <div className="flex items-center gap-1 bg-neutral-950/80 p-1 rounded-xl border border-white/10">
            <button
              onClick={() => {
                sounds.playButton();
                onSetGameMode('local');
              }}
              className={`flex-1 py-2 rounded-lg text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                gameMode === 'local'
                  ? 'bg-amber-400 text-neutral-950 shadow-md'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Users className="w-4 h-4" /> Pass & Play (Local)
            </button>

            <button
              onClick={() => {
                sounds.playButton();
                onSetGameMode('ai');
              }}
              className={`flex-1 py-2 rounded-lg text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                gameMode === 'ai'
                  ? 'bg-amber-400 text-neutral-950 shadow-md'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Bot className="w-4 h-4" /> vs Computer (AI)
            </button>
          </div>
        </section>

        {/* 2. PLAYER COUNT & AI DIFFICULTY SELECTORS */}
        <section className="bg-neutral-900/90 border border-white/15 rounded-2xl p-3 shadow-xl backdrop-blur-sm space-y-3">
          {/* Player Count Buttons (2P / 3P / 4P) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-black uppercase tracking-wider text-amber-300/90">
                Number of Players
              </span>
              <span className="text-[10px] text-neutral-400">
                {playerCount === 2
                  ? '2 Players (Opposite Corners)'
                  : playerCount === 3
                  ? '3 Players Match'
                  : '4 Players Full Board'}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 bg-neutral-950/80 p-1 rounded-xl border border-white/10">
              {([2, 3, 4] as PlayerCount[]).map((count) => {
                const isSelected = playerCount === count;
                return (
                  <button
                    key={count}
                    onClick={() => {
                      sounds.playButton();
                      onSetPlayerCount(count);
                    }}
                    className={`py-2 rounded-lg text-xs font-black transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-amber-400 text-neutral-950 shadow-md'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    {count} Players
                  </button>
                );
              })}
            </div>
          </div>

          {/* AI Difficulty Selector (Visible when AI is enabled) */}
          {hasAnyAI && (
            <div className="pt-2 border-t border-white/10">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-black uppercase tracking-wider text-amber-300/90">
                  AI Difficulty
                </span>
                <span className="text-[10px] text-neutral-400">
                  {aiDifficulty === 'easy'
                    ? '🟢 Casual play'
                    : aiDifficulty === 'medium'
                    ? '🟡 Balanced tactical'
                    : '🔴 Master threat evasion'}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 bg-neutral-950/80 p-1 rounded-xl border border-white/10">
                <button
                  onClick={() => {
                    sounds.playButton();
                    onSetAiDifficulty('easy');
                  }}
                  className={`py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                    aiDifficulty === 'easy'
                      ? 'bg-emerald-500 text-white shadow-md'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  🟢 Easy
                </button>
                <button
                  onClick={() => {
                    sounds.playButton();
                    onSetAiDifficulty('medium');
                  }}
                  className={`py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                    aiDifficulty === 'medium'
                      ? 'bg-amber-500 text-neutral-950 shadow-md'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  🟡 Medium
                </button>
                <button
                  onClick={() => {
                    sounds.playButton();
                    onSetAiDifficulty('hard');
                  }}
                  className={`py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                    aiDifficulty === 'hard'
                      ? 'bg-rose-500 text-white shadow-md'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  🔴 Hard
                </button>
              </div>
            </div>
          )}
        </section>

        {/* 4. INDIVIDUAL PLAYER SETUP SLOTS (P1 to P4) */}
        <section className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] font-black uppercase tracking-wider text-amber-300/90">
              Player Slots & Leaders
            </span>
            <span className="text-[10px] text-neutral-400">
              Tap avatar to switch leader
            </span>
          </div>

          {[3, 1, 0, 2].map((slotIdx, displayOrder) => {
            const isActive = activeIndices.includes(slotIdx);
            const color = PLAYER_COLORS[slotIdx];
            const colorCfg = COLOR_CONFIG[color];
            const currentCharId = selectedCharacters[slotIdx];
            const currentChar = CHARACTERS[currentCharId];
            const isAI = playerTypes[slotIdx] === 'ai';
            const playerName = playerNames[slotIdx] || (slotIdx === 3 ? 'Player 1' : `Player ${displayOrder + 1}`);

            const cornerLabel = 
              slotIdx === 3 ? 'Bottom-Left' :
              slotIdx === 1 ? 'Top-Right' :
              slotIdx === 0 ? 'Top-Left' : 'Bottom-Right';

            // Check if character is taken by another ACTIVE player
            const isTakenByOtherActive = (cId: CharacterId) => {
              return activeIndices.some(
                (otherIdx) => otherIdx !== slotIdx && selectedCharacters[otherIdx] === cId
              );
            };

            if (!isActive) {
              return (
                <div
                  key={slotIdx}
                  className="bg-neutral-950/40 border border-white/5 rounded-2xl p-3 opacity-40 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="text-[9px] font-black px-2 py-0.5 rounded-md text-white/60 uppercase"
                      style={{ backgroundColor: colorCfg.bgHex }}
                    >
                      {colorCfg.name} • {cornerLabel}
                    </span>
                    <span className="text-xs font-bold text-neutral-500 italic">
                      Slot Inactive ({playerCount}P Mode)
                    </span>
                  </div>
                  <span className="text-[10px] text-neutral-600 font-bold uppercase">
                    Disabled
                  </span>
                </div>
              );
            }

            return (
              <motion.div
                key={slotIdx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-neutral-900/90 border border-white/15 rounded-2xl p-3 shadow-xl backdrop-blur-sm space-y-2"
              >
                {/* Header: Player Tag + Name Input + Human/AI Toggle */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span
                      className="text-[10px] font-black px-2 py-1 rounded-lg text-white uppercase tracking-wider shadow-sm shrink-0"
                      style={{ backgroundColor: colorCfg.bgHex }}
                    >
                      {colorCfg.name} • {cornerLabel}
                    </span>

                    {/* Editable Player Name Input */}
                    <input
                      type="text"
                      maxLength={14}
                      value={playerName}
                      onChange={(e) => onUpdatePlayerName(slotIdx, e.target.value)}
                      placeholder={slotIdx === 3 ? 'Player 1' : `Player ${displayOrder + 1}`}
                      className="bg-neutral-950/80 border border-white/15 rounded-lg px-2 py-0.5 text-xs font-bold text-white focus:outline-none focus:border-amber-400 flex-1 min-w-0"
                    />
                  </div>

                  {/* Human / AI Toggle */}
                  <button
                    onClick={() => {
                      sounds.playButton();
                      onTogglePlayerType(slotIdx);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-black flex items-center gap-1 border transition-all cursor-pointer shrink-0 ${
                      isAI
                        ? 'bg-purple-900/90 border-purple-400 text-purple-200 shadow-sm'
                        : 'bg-blue-900/90 border-blue-400 text-blue-200 shadow-sm'
                    }`}
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

                {/* Leader Catchphrase Tagline */}
                {currentChar && (
                  <div className="text-[11px] text-amber-300/90 italic font-medium truncate px-1">
                    "{currentChar.catchphrase}"
                  </div>
                )}

                {/* 4 Political Leaders Choice Pills */}
                <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
                  {ALL_CHAR_IDS.map((charId) => {
                    const char = CHARACTERS[charId];
                    const isSelected = currentCharId === charId;
                    const isTaken = isTakenByOtherActive(charId);

                    return (
                      <button
                        key={charId}
                        disabled={isTaken}
                        onClick={() => handlePickCharacter(slotIdx, charId)}
                        className={`relative rounded-xl p-1.5 flex flex-col items-center justify-center transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-amber-400 text-neutral-950 font-black ring-2 sm:ring-3 ring-amber-300 shadow-md scale-[1.02]'
                            : isTaken
                            ? 'bg-neutral-950/60 text-neutral-600 opacity-30 cursor-not-allowed border border-white/5'
                            : 'bg-neutral-800/80 hover:bg-neutral-700/80 text-white border border-white/10'
                        }`}
                      >
                        <CharacterAvatar
                          id={charId}
                          size="xs"
                          className="w-7 h-7 sm:w-8 sm:h-8 mb-0.5"
                        />
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
              </motion.div>
            );
          })}
        </section>
      </main>

      {/* BOTTOM START MATCH CTA BUTTON */}
      <footer className="max-w-md w-full mx-auto py-2 z-10">
        <motion.button
          id="start-match-btn"
          whileHover={{ scale: isReady ? 1.02 : 1 }}
          whileTap={{ scale: isReady ? 0.98 : 1 }}
          disabled={!isReady}
          onClick={() => {
            sounds.playButton();
            onStartGame();
          }}
          className={`w-full py-4 px-6 rounded-2xl font-black text-base uppercase tracking-wider flex items-center justify-center gap-2.5 shadow-2xl transition-all ${
            isReady
              ? 'bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-neutral-950 cursor-pointer shadow-amber-400/30 border-2 border-amber-300'
              : 'bg-neutral-800 text-neutral-500 cursor-not-allowed border border-white/5'
          }`}
        >
          <Play className="w-5 h-5 fill-current" /> START MATCH ({playerCount}P)
        </motion.button>
      </footer>
    </div>
  );
};
