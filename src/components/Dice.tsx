import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PlayerColor } from '../types';
import { COLOR_CONFIG } from '../utils/ludoConstants';
import { sounds } from '../utils/audio';

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
  const prevIsRollingRef = useRef<boolean>(false);
  const colorCfg = COLOR_CONFIG[playerColor];

  // Cycling dice roll visual while rolling
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRolling) {
      interval = setInterval(() => {
        setAnimIndex((prev) => {
          let next = Math.floor(Math.random() * 6) + 1;
          return next === prev ? (next % 6) + 1 : next;
        });
      }, 65);
    } else if (prevIsRollingRef.current && !isRolling) {
      // Just landed!
      sounds.playDiceLand();
    }
    prevIsRollingRef.current = isRolling;
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
              <motion.div
                layout
                className={`${pipSize} rounded-full shadow-inner ${
                  val === 6 ? 'bg-amber-500 ring-1 ring-amber-400' : 'bg-neutral-900'
                }`}
                style={{
                  boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.6), 0 1px 1px rgba(255,255,255,0.4)',
                }}
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
    <div className="relative flex flex-col items-center justify-center select-none">
      {/* Pulsing Glowing Aura when it's the active player's turn to roll */}
      {canRoll && !isRolling && !disabled && (
        <motion.div
          animate={{ scale: [1, 1.18, 1], opacity: [0.9, 0.3, 0.9] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -inset-1.5 sm:-inset-2 rounded-2xl border-2 border-amber-400 shadow-lg shadow-amber-400/40 pointer-events-none"
        />
      )}

      {/* 3D Tactile Dice Button */}
      <motion.button
        type="button"
        whileTap={canRoll && !isRolling && !disabled ? { scale: 0.88, rotate: -4 } : {}}
        whileHover={canRoll && !isRolling && !disabled ? { scale: 1.08 } : {}}
        onClick={() => {
          if (canRoll && !isRolling && !disabled) {
            onRoll();
          }
        }}
        disabled={!canRoll || isRolling || disabled}
        className={`relative ${dimensions} rounded-xl sm:rounded-2xl transition-all duration-200 select-none flex items-center justify-center border ${
          canRoll && !isRolling && !disabled
            ? 'cursor-pointer ring-2 sm:ring-3 ring-amber-400 shadow-xl shadow-amber-500/30 border-white'
            : disabled
            ? 'opacity-35 cursor-not-allowed border-neutral-800 bg-neutral-900'
            : 'opacity-100 cursor-default border-white/80 shadow-md'
        }`}
        style={{
          background: disabled
            ? '#1f1f1f'
            : 'linear-gradient(145deg, #ffffff 0%, #f4f4f7 60%, #e2e4e9 100%)',
          boxShadow: canRoll && !isRolling && !disabled
            ? `0 8px 20px -2px ${colorCfg.bgHex}bb, 0 4px 6px -1px rgba(0,0,0,0.3), inset 0 2px 4px rgba(255,255,255,1)`
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
                  scale: [1, 1.25, 0.85, 1.15, 1],
                }
              : {
                  rotateX: 0,
                  rotateY: 0,
                  rotateZ: 0,
                  scale: [0.85, 1.12, 0.95, 1],
                }
          }
          transition={
            isRolling
              ? { duration: 0.65, ease: 'easeInOut' }
              : { duration: 0.35, ease: 'easeOut' }
          }
          className="w-full h-full flex items-center justify-center"
        >
          {renderPips(displayVal)}
        </motion.div>
      </motion.button>

      {/* Tap Prompt or Result Badge */}
      {canRoll && !isRolling && !disabled ? (
        <span className="absolute -bottom-4 text-[9px] sm:text-[10px] font-black text-amber-300 tracking-wider uppercase whitespace-nowrap drop-shadow-md animate-pulse">
          TAP ROLL
        </span>
      ) : value && !isRolling && !disabled ? (
        <motion.span
          initial={{ scale: 0.5, y: -4 }}
          animate={{ scale: 1, y: 0 }}
          className="absolute -bottom-4 px-1.5 py-0.2 rounded-xs text-[8px] sm:text-[9px] font-black text-white uppercase whitespace-nowrap shadow-md flex items-center gap-0.5"
          style={{ backgroundColor: colorCfg.bgHex }}
        >
          {value === 6 ? '★ 6' : value}
        </motion.span>
      ) : null}
    </div>
  );
};
