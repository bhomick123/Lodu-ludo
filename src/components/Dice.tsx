import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PlayerColor } from '../types';
import { COLOR_CONFIG } from '../utils/ludoConstants';

interface DiceProps {
  value: number | null;
  isRolling: boolean;
  canRoll: boolean;
  playerColor: PlayerColor;
  onRoll: () => void;
  disabled?: boolean;
}

export const Dice: React.FC<DiceProps> = ({
  value,
  isRolling,
  canRoll,
  playerColor,
  onRoll,
  disabled = false,
}) => {
  const [animIndex, setAnimIndex] = useState(1);
  const colorCfg = COLOR_CONFIG[playerColor];

  // Render dice pips based on value (1-6)
  const renderPips = (val: number) => {
    const pips: Record<number, number[]> = {
      1: [4],
      2: [0, 8],
      3: [0, 4, 8],
      4: [0, 2, 6, 8],
      5: [0, 2, 4, 6, 8],
      6: [0, 2, 3, 5, 6, 8],
    };

    const activePips = new Set(pips[val] || [4]);

    return (
      <div className="grid grid-cols-3 grid-rows-3 w-full h-full p-2.5 gap-1 place-items-center">
        {Array.from({ length: 9 }).map((_, idx) => (
          <div key={idx} className="w-full h-full flex items-center justify-center">
            {activePips.has(idx) ? (
              <motion.div
                layoutId={`pip-${idx}`}
                className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-neutral-900 shadow-inner"
              />
            ) : null}
          </div>
        ))}
      </div>
    );
  };

  const displayVal = isRolling ? ((animIndex % 6) + 1) : (value || 6);

  return (
    <div className="relative flex flex-col items-center justify-center">
      {/* Pulsing ring when it's player's turn to roll */}
      {canRoll && !isRolling && !disabled && (
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.7, 0.2, 0.7] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -inset-2.5 rounded-2xl border-2 border-dashed pointer-events-none"
          style={{ borderColor: colorCfg.bgHex }}
        />
      )}

      {/* Interactive 3D Dice Button */}
      <motion.button
        id="dice-roll-button"
        whileTap={canRoll && !isRolling && !disabled ? { scale: 0.92 } : {}}
        whileHover={canRoll && !isRolling && !disabled ? { scale: 1.05, y: -2 } : {}}
        onClick={() => {
          if (canRoll && !isRolling && !disabled) {
            onRoll();
          }
        }}
        disabled={!canRoll || isRolling || disabled}
        className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl shadow-xl transition-all duration-200 select-none flex items-center justify-center ${
          canRoll && !isRolling && !disabled
            ? 'cursor-pointer ring-4 ring-white/90 shadow-2xl'
            : 'opacity-85 cursor-not-allowed'
        }`}
        style={{
          background: 'linear-gradient(145deg, #ffffff, #f0f0f3)',
          boxShadow: canRoll && !isRolling
            ? `0 10px 25px -5px ${colorCfg.bgHex}88, inset 0 2px 4px rgba(255,255,255,0.9)`
            : '0 4px 10px rgba(0,0,0,0.3), inset 0 2px 4px rgba(255,255,255,0.7)',
        }}
      >
        <motion.div
          animate={
            isRolling
              ? {
                  rotateX: [0, 360, 720, 1080],
                  rotateY: [0, 720, 360, 1440],
                  rotateZ: [0, 180, 360, 540],
                  scale: [1, 1.25, 0.9, 1.1, 1],
                }
              : { rotateX: 0, rotateY: 0, rotateZ: 0, scale: 1 }
          }
          transition={{ duration: 0.65, ease: 'easeOut' }}
          className="w-full h-full flex items-center justify-center"
        >
          {renderPips(displayVal)}
        </motion.div>
      </motion.button>

      {/* Value Badge on bottom */}
      {value && !isRolling && (
        <motion.div
          initial={{ scale: 0, y: -5 }}
          animate={{ scale: 1, y: 0 }}
          className="mt-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold text-white shadow-md uppercase tracking-wider"
          style={{ backgroundColor: colorCfg.bgHex }}
        >
          Rolled: {value}
        </motion.div>
      )}

      {canRoll && !isRolling && !disabled && (
        <span className="mt-1 text-[11px] font-semibold text-amber-300 animate-pulse tracking-wide uppercase">
          TAP TO ROLL
        </span>
      )}
    </div>
  );
};
