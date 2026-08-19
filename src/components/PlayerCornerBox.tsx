import React from 'react';
import { motion } from 'motion/react';
import { Player, TurnState } from '../types';
import { CharacterAvatar } from './CharacterAvatar';
import { Dice } from './Dice';
import { COLOR_CONFIG } from '../utils/ludoConstants';
import { Bot, Crown, Home, Sparkles } from 'lucide-react';

interface PlayerCornerBoxProps {
  player: Player;
  isActive: boolean;
  isInactiveSlot?: boolean;
  turnState: TurnState;
  diceValue: number | null;
  isRolling: boolean;
  canRoll: boolean;
  onRollDice: () => void;
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

export const PlayerCornerBox: React.FC<PlayerCornerBoxProps> = ({
  player,
  isActive,
  isInactiveSlot = false,
  turnState,
  diceValue,
  isRolling,
  canRoll,
  onRollDice,
  position,
}) => {
  const colorCfg = COLOR_CONFIG[player.color];
  const homeCount = player.tokens.filter((t) => t.step === 57).length;
  const isRightSide = position === 'top-right' || position === 'bottom-right';

  // Inactive Slot placeholder
  if (isInactiveSlot) {
    return (
      <div
        className={`flex items-center gap-1.5 opacity-30 select-none ${
          isRightSide ? 'flex-row-reverse text-right' : 'flex-row text-left'
        }`}
      >
        <div className="px-2.5 py-2 rounded-2xl bg-neutral-950/40 border border-white/5 text-[10px] font-bold text-neutral-500">
          Empty Slot
        </div>
      </div>
    );
  }

  // Only the active player's dice can roll during WAITING_FOR_ROLL (and only human players can click manual roll)
  const isPlayerDiceActive = isActive && canRoll && !player.isAI;
  // If active, show current dice value or null; if inactive, show idle state
  const displayedDiceValue = isActive ? diceValue : null;
  const isThisPlayerRolling = isActive && isRolling;

  return (
    <div
      className={`flex items-center gap-1.5 sm:gap-2 select-none transition-all duration-300 ${
        isRightSide ? 'flex-row-reverse text-right' : 'flex-row text-left'
      }`}
    >
      {/* Player Profile Box */}
      <motion.div
        animate={
          isActive
            ? { scale: [1, 1.02, 1] }
            : { scale: 1 }
        }
        transition={
          isActive
            ? { duration: 2, repeat: Infinity, ease: 'easeInOut' }
            : { duration: 0.2 }
        }
        className={`relative flex items-center gap-1.5 sm:gap-2 px-2 py-1.5 sm:px-2.5 sm:py-2 rounded-2xl transition-all duration-200 border ${
          isRightSide ? 'flex-row-reverse' : 'flex-row'
        } ${
          isActive
            ? 'bg-neutral-900/95 border-amber-400 ring-2 ring-amber-400/70 shadow-lg shadow-amber-500/25'
            : 'bg-neutral-900/70 border-white/10 opacity-75'
        }`}
      >
        {/* Avatar with Color ring & Winner Crown */}
        <div className="relative shrink-0">
          <div
            className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl p-0.5 flex items-center justify-center border-2 shadow-md"
            style={{
              backgroundColor: colorCfg.bgHex,
              borderColor: isActive ? '#FDE047' : '#FFFFFF',
            }}
          >
            <CharacterAvatar id={player.characterId} size="xs" />
          </div>

          {player.hasWon && (
            <div className="absolute -top-1.5 -right-1.5 bg-amber-400 text-neutral-950 p-0.5 rounded-full shadow-md">
              <Crown className="w-3 h-3 fill-current" />
            </div>
          )}

          {isActive && (
            <span className="absolute -bottom-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-400 border border-neutral-900"></span>
            </span>
          )}
        </div>

        {/* Player Name & Progress Badge */}
        <div className="min-w-0 max-w-[70px] sm:max-w-[90px]">
          <div className="flex items-center gap-1">
            <span
              className="text-[9px] sm:text-[10px] font-black uppercase px-1 rounded-xs truncate"
              style={{ backgroundColor: colorCfg.bgHex, color: '#FFFFFF' }}
            >
              {colorCfg.name}
            </span>

            {player.isAI && (
              <span className="bg-purple-950/80 border border-purple-500/50 text-purple-300 text-[8px] font-extrabold px-1 rounded-xs flex items-center gap-0.5">
                <Bot className="w-2.5 h-2.5" /> AI
              </span>
            )}
          </div>

          <div className="text-[11px] sm:text-xs font-bold text-white truncate leading-tight mt-0.5">
            {player.name.split(' ')[0]}
          </div>

          <div className="flex items-center gap-0.5 mt-0.5 text-[10px] font-extrabold text-amber-300/90">
            <Home className="w-2.5 h-2.5 inline shrink-0" />
            <span>{homeCount}/4</span>
          </div>
        </div>

        {/* Subtle Turn / AI Thinking Indicator Badge */}
        {isActive && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className={`absolute -top-2.5 ${
              isRightSide ? 'right-2' : 'left-2'
            } ${
              player.isAI ? 'bg-purple-600 text-white' : 'bg-amber-400 text-neutral-950'
            } text-[8px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded-full shadow-md flex items-center gap-0.5 pointer-events-none`}
          >
            {player.isAI ? (
              <>
                <Bot className="w-2 h-2 fill-current" />
                {turnState === 'WAITING_FOR_ROLL' || turnState === 'ROLLING'
                  ? 'AI Rolling...'
                  : turnState === 'WAITING_FOR_TOKEN_SELECTION'
                  ? 'AI Thinking...'
                  : 'AI Moving'}
              </>
            ) : (
              <>
                <Sparkles className="w-2 h-2 fill-current" /> YOUR TURN
              </>
            )}
          </motion.div>
        )}
      </motion.div>

      {/* Dedicated Player Dice Unit */}
      <div className="relative shrink-0">
        <Dice
          value={displayedDiceValue}
          isRolling={isThisPlayerRolling}
          canRoll={isPlayerDiceActive}
          playerColor={player.color}
          onRoll={onRollDice}
          disabled={!isActive}
          size="sm"
        />
      </div>
    </div>
  );
};
