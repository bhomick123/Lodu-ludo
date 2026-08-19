import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { PlayerColor } from '../types';
import { COLOR_CONFIG } from '../utils/ludoConstants';

interface DiceProps {
  value: number | null;
  isRolling: boolean;
  canRoll: boolean;
  playerColor: PlayerColor;
  onRoll: () => void;
  disabled?: boolean;
  size?: 'sm' | 'md';
}

export const Dice: React.FC<DiceProps> = ({
  value,
  isRolling,
  canRoll,
  playerColor,
  onRoll,
  disabled = false,
  size = 'sm',
}) => {
  const [animIndex, setAnimIndex] = useState(1);
  const colorCfg = COLOR_CONFIG[playerColor];

  // Cycling dice roll visual while rolling
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRolling) {
      interval = setInterval(() => {
        setAnimIndex((prev) => (prev % 6) + 1);
      }, 70);
    }
    return () => clearInterval(interval);
  }, [isRolling]);

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
    const pipSize = size === 'sm' ? 'w-2 h-2 sm:w-2.5 sm:h-2.5' : 'w-2.5 h-2.5 sm:w-3 sm:h-3';

    return (
      <div className="grid grid-cols-3 grid-rows-3 w-full h-full p-1.5 sm:p-2 gap-0.5 place-items-center">
        {Array.from({ length: 9 }).map((_, idx) => (
          <div key={idx} className="w-full h-full flex items-center justify-center">
            {activePips.has(idx) ? (
              <div
                className={`${pipSize} rounded-full bg-neutral-900 shadow-xs`}
              />
            ) : null}
          </div>
        ))}
      </div>
    );
  };

  const displayVal = isRolling ? animIndex : (value || 6);
  const dimensions = size === 'sm' ? 'w-11 h-11 sm:w-13 sm:h-13' : 'w-16 h-16 sm:w-20 sm:h-20';

  return (
    <div className="relative flex flex-col items-center justify-center">
      {/* Pulsing Highlight ring when active */}
      {canRoll && !isRolling && !disabled && (
        <motion.div
          animate={{ scale: [1, 1.14, 1], opacity: [0.8, 0.25, 0.8] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -inset-1.5 sm:-inset-2 rounded-2xl border-2 border-amber-400 pointer-events-none"
        />
      )}

      {/* 3D Dice Button */}
      <motion.button
        type="button"
        whileTap={canRoll && !isRolling && !disabled ? { scale: 0.9 } : {}}
        whileHover={canRoll && !isRolling && !disabled ? { scale: 1.06 } : {}}
        onClick={() => {
          if (canRoll && !isRolling && !disabled) {
            onRoll();
          }
        }}
        disabled={!canRoll || isRolling || disabled}
        className={`relative ${dimensions} rounded-xl sm:rounded-2xl transition-all duration-200 select-none flex items-center justify-center border ${
          canRoll && !isRolling && !disabled
            ? 'cursor-pointer ring-2 sm:ring-3 ring-amber-400 shadow-lg shadow-amber-500/30 border-white'
            : disabled
            ? 'opacity-40 cursor-not-allowed border-neutral-700 bg-neutral-800'
            : 'opacity-85 cursor-not-allowed border-white/60'
        }`}
        style={{
          background: disabled
            ? '#262626'
            : 'linear-gradient(145deg, #ffffff, #f1f1f4)',
          boxShadow: canRoll && !isRolling && !disabled
            ? `0 6px 16px -2px ${colorCfg.bgHex}99, inset 0 2px 4px rgba(255,255,255,1)`
            : '0 2px 6px rgba(0,0,0,0.4)',
        }}
      >
        <motion.div
          animate={
            isRolling
              ? {
                  rotateX: [0, 360, 720, 1080],
                  rotateY: [0, 720, 360, 1440],
                  rotateZ: [0, 180, 360, 540],
                  scale: [1, 1.2, 0.9, 1.1, 1],
                }
              : { rotateX: 0, rotateY: 0, rotateZ: 0, scale: 1 }
          }
          transition={{ duration: 0.65, ease: 'easeOut' }}
          className="w-full h-full flex items-center justify-center"
        >
          {renderPips(displayVal)}
        </motion.div>
      </motion.button>

      {/* Compact Rolled Label or Tap Prompt */}
      {canRoll && !isRolling && !disabled ? (
        <span className="absolute -bottom-4 text-[9px] font-black text-amber-300 tracking-wider uppercase whitespace-nowrap drop-shadow-sm animate-pulse">
          ROLL
        </span>
      ) : value && !isRolling && !disabled ? (
        <span
          className="absolute -bottom-4 px-1 rounded-xs text-[8px] sm:text-[9px] font-black text-white uppercase whitespace-nowrap shadow-xs"
          style={{ backgroundColor: colorCfg.bgHex }}
        >
          {value}
        </span>
      ) : null}
    </div>
  );
};

