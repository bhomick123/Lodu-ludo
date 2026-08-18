import React from 'react';
import { motion } from 'motion/react';
import { Play, Sparkles, Check, ArrowLeft, Shuffle } from 'lucide-react';
import { CharacterId, PlayerColor } from '../types';
import { CharacterAvatar } from './CharacterAvatar';
import { CHARACTERS } from '../data/characters';
import { COLOR_CONFIG } from '../utils/ludoConstants';

interface CharacterSelectionProps {
  selectedCharacters: Record<number, CharacterId>;
  onSelectCharacter: (playerIndex: number, charId: CharacterId) => void;
  onRandomize: () => void;
  onStartGame: () => void;
  onBack: () => void;
}

const PLAYER_COLORS: PlayerColor[] = ['red', 'green', 'yellow', 'blue'];
const ALL_CHAR_IDS: CharacterId[] = ['modi', 'kejriwal', 'rahul', 'trump'];

export const CharacterSelection: React.FC<CharacterSelectionProps> = ({
  selectedCharacters,
  onSelectCharacter,
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

  return (
    <div className="min-h-screen w-full bg-[#180d28] text-white flex flex-col justify-between p-4 sm:p-6 select-none overflow-y-auto">
      {/* Top Header */}
      <div className="max-w-xl w-full mx-auto flex items-center justify-between py-2">
        <button
          onClick={onBack}
          className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors flex items-center gap-1 text-xs font-bold cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <div className="text-center">
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-amber-300">
            CHOOSE YOUR LEADERS
          </h1>
          <p className="text-xs text-neutral-400">Assign 1 unique character per player</p>
        </div>

        <button
          onClick={onRandomize}
          className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-amber-300 transition-colors flex items-center gap-1 text-xs font-bold cursor-pointer"
          title="Randomize choices"
        >
          <Shuffle className="w-4 h-4" />
        </button>
      </div>

      {/* 4 Player Selection Slots */}
      <div className="max-w-xl w-full mx-auto my-4 space-y-3.5 flex-1 flex flex-col justify-center">
        {[0, 1, 2, 3].map((playerIndex) => {
          const color = PLAYER_COLORS[playerIndex];
          const colorCfg = COLOR_CONFIG[color];
          const currentSelection = selectedCharacters[playerIndex];
          const currentChar = CHARACTERS[currentSelection];

          return (
            <div
              key={playerIndex}
              className="bg-neutral-900/90 border border-white/15 rounded-2xl p-3 sm:p-4 shadow-xl backdrop-blur-sm"
            >
              {/* Player Tag */}
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-2">
                  <span
                    className="text-[11px] font-extrabold px-2 py-0.5 rounded-md text-white uppercase tracking-wider shadow-xs"
                    style={{ backgroundColor: colorCfg.bgHex }}
                  >
                    Player {playerIndex + 1} ({colorCfg.name})
                  </span>
                </div>
                {currentChar && (
                  <span className="text-xs text-amber-300/90 italic font-medium truncate max-w-[200px]">
                    "{currentChar.catchphrase}"
                  </span>
                )}
              </div>

              {/* 4 Character Choice Pills */}
              <div className="grid grid-cols-4 gap-2">
                {ALL_CHAR_IDS.map((charId) => {
                  const char = CHARACTERS[charId];
                  const isSelected = currentSelection === charId;
                  const isTaken = isCharTakenByOther(charId, playerIndex);

                  return (
                    <button
                      key={charId}
                      disabled={isTaken}
                      onClick={() => onSelectCharacter(playerIndex, charId)}
                      className={`relative rounded-xl p-2 flex flex-col items-center justify-center transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-amber-400 text-neutral-950 font-bold ring-3 ring-amber-300 shadow-md scale-[1.03]'
                          : isTaken
                          ? 'bg-neutral-950/60 text-neutral-600 opacity-40 cursor-not-allowed border border-white/5'
                          : 'bg-neutral-800/80 hover:bg-neutral-700/80 text-white border border-white/10'
                      }`}
                    >
                      <CharacterAvatar id={charId} size="xs" className="w-8 h-8 sm:w-9 sm:h-9 mb-1" />
                      <span className="text-[11px] sm:text-xs truncate w-full text-center leading-tight">
                        {char.shortName}
                      </span>

                      {isSelected && (
                        <div className="absolute -top-1.5 -right-1.5 bg-neutral-950 text-amber-400 rounded-full p-0.5 shadow-xs">
                          <Check className="w-3 h-3 stroke-[3]" />
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
      <div className="max-w-xl w-full mx-auto py-2">
        <motion.button
          id="start-lodu-button"
          whileHover={{ scale: isReady ? 1.02 : 1 }}
          whileTap={{ scale: isReady ? 0.98 : 1 }}
          disabled={!isReady}
          onClick={onStartGame}
          className={`w-full py-4 px-6 rounded-2xl font-black text-base uppercase tracking-wider flex items-center justify-center gap-3 shadow-2xl transition-all ${
            isReady
              ? 'bg-amber-400 hover:bg-amber-300 text-neutral-950 cursor-pointer shadow-amber-400/30'
              : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
          }`}
        >
          <Play className="w-5 h-5 fill-current" /> START LODU
        </motion.button>
      </div>
    </div>
  );
};
