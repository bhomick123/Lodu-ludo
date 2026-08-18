import React from 'react';
import { motion } from 'motion/react';
import { Player, TurnState } from '../types';
import { CharacterAvatar } from './CharacterAvatar';
import { Dice } from './Dice';
import { COLOR_CONFIG } from '../utils/ludoConstants';
import { CHARACTERS } from '../data/characters';
import { Sparkles, ArrowRight, Dices } from 'lucide-react';

interface TurnIndicatorProps {
  activePlayer: Player;
  turnState: TurnState;
  diceValue: number | null;
  isRolling: boolean;
  hasValidMoves: boolean;
  onRollDice: () => void;
}

export const TurnIndicator: React.FC<TurnIndicatorProps> = ({
  activePlayer,
  turnState,
  diceValue,
  isRolling,
  hasValidMoves,
  onRollDice,
}) => {
  const colorCfg = COLOR_CONFIG[activePlayer.color];
  const char = CHARACTERS[activePlayer.characterId];

  const getStatusText = () => {
    switch (turnState) {
      case 'WAITING_FOR_ROLL':
        return 'Tap dice to roll!';
      case 'ROLLING':
        return 'Rolling fate... 🎲';
      case 'WAITING_FOR_TOKEN_SELECTION':
        return 'Tap a highlighted token to move';
      case 'MOVING_TOKEN':
        return 'Goti moving... 🚀';
      case 'TURN_ENDING':
        return hasValidMoves ? 'Turn complete' : 'No valid moves! Passing turn...';
      default:
        return '';
    }
  };

  const canRoll = turnState === 'WAITING_FOR_ROLL';

  return (
    <div className="w-full max-w-md mx-auto bg-neutral-900/95 border border-white/15 rounded-3xl p-3 sm:p-4 backdrop-blur-md shadow-2xl flex items-center justify-between gap-3 text-white">
      {/* Current Player Profile */}
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        <div className="relative">
          <div
            className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl p-1 flex items-center justify-center shadow-lg border-2"
            style={{
              backgroundColor: colorCfg.bgHex,
              borderColor: '#FFFFFF',
            }}
          >
            <CharacterAvatar id={activePlayer.characterId} size="sm" />
          </div>
          {/* Active Player Turn Halo */}
          <span className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-amber-400 border border-neutral-900"></span>
          </span>
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span
              className="text-[10px] uppercase font-extrabold px-1.5 py-0.5 rounded-md"
              style={{ backgroundColor: colorCfg.bgHex }}
            >
              {colorCfg.name}
            </span>
            <span className="text-xs text-neutral-400 truncate">Turn</span>
          </div>

          <h3 className="text-sm sm:text-base font-bold text-white truncate leading-tight mt-0.5">
            {activePlayer.name}
          </h3>

          <p className="text-xs text-amber-300 font-medium truncate mt-0.5 flex items-center gap-1">
            <span className="truncate">{getStatusText()}</span>
          </p>
        </div>
      </div>

      {/* Dice Controller */}
      <div className="shrink-0 flex items-center">
        <Dice
          value={diceValue}
          isRolling={isRolling}
          canRoll={canRoll}
          playerColor={activePlayer.color}
          onRoll={onRollDice}
        />
      </div>
    </div>
  );
};
