import React from 'react';
import { motion } from 'motion/react';
import { CharacterId, PlayerColor } from '../types';
import { CharacterAvatar } from './CharacterAvatar';
import { COLOR_CONFIG } from '../utils/ludoConstants';

interface TokenProps {
  tokenId: number;
  playerId: number;
  characterId: CharacterId;
  playerColor: PlayerColor;
  isSelectable: boolean;
  isMoving?: boolean;
  onClick?: () => void;
  stackIndex?: number;
  stackTotal?: number;
  size?: 'normal' | 'stacked' | 'tiny';
}

export const Token: React.FC<TokenProps> = ({
  tokenId,
  playerId,
  characterId,
  playerColor,
  isSelectable,
  isMoving = false,
  onClick,
  stackIndex = 0,
  stackTotal = 1,
  size = 'normal',
}) => {
  const colorCfg = COLOR_CONFIG[playerColor];

  // Offset calculation if multiple tokens share the square
  let offsetX = 0;
  let offsetY = 0;
  if (stackTotal > 1) {
    if (stackTotal === 2) {
      offsetX = stackIndex === 0 ? -4 : 4;
      offsetY = stackIndex === 0 ? -4 : 4;
    } else if (stackTotal === 3) {
      const angles = [0, (2 * Math.PI) / 3, (4 * Math.PI) / 3];
      offsetX = Math.cos(angles[stackIndex]) * 5;
      offsetY = Math.sin(angles[stackIndex]) * 5;
    } else {
      const positions = [
        { x: -5, y: -5 },
        { x: 5, y: -5 },
        { x: -5, y: 5 },
        { x: 5, y: 5 },
      ];
      offsetX = positions[stackIndex % 4].x;
      offsetY = positions[stackIndex % 4].y;
    }
  }

  const dimensionClasses = {
    normal: 'w-[88%] h-[88%]',
    stacked: 'w-[70%] h-[70%]',
    tiny: 'w-[55%] h-[55%]',
  }[size];

  return (
    <motion.div
      id={`token-p${playerId}-t${tokenId}`}
      animate={
        isSelectable
          ? {
              scale: [1, 1.18, 1],
              y: [0, -6, 0],
            }
          : { scale: 1, y: 0 }
      }
      transition={
        isSelectable
          ? {
              duration: 0.8,
              repeat: Infinity,
              ease: 'easeInOut',
            }
          : { duration: 0.2 }
      }
      style={{
        transform: `translate(${offsetX}px, ${offsetY}px)`,
        zIndex: isMoving ? 50 : isSelectable ? 40 : 10 + stackIndex,
      }}
      onClick={(e) => {
        e.stopPropagation();
        if (isSelectable && onClick) {
          onClick();
        }
      }}
      className={`relative rounded-full select-none flex items-center justify-center transition-all ${dimensionClasses} ${
        isSelectable ? 'cursor-pointer' : 'pointer-events-none'
      }`}
    >
      {/* Glow / Pulsing Ring if selectable */}
      {isSelectable && (
        <motion.div
          animate={{ scale: [1, 1.4, 1], opacity: [0.9, 0.2, 0.9] }}
          transition={{ duration: 1.1, repeat: Infinity }}
          className="absolute -inset-1.5 rounded-full border-2 border-white bg-white/30 pointer-events-none"
        />
      )}

      {/* Outer colored token disc */}
      <div
        className="w-full h-full rounded-full p-[2px] shadow-lg flex items-center justify-center border-2 border-white"
        style={{
          backgroundColor: colorCfg.bgHex,
          boxShadow: isSelectable
            ? `0 0 12px 3px ${colorCfg.bgHex}, 0 4px 6px rgba(0,0,0,0.4)`
            : '0 2px 5px rgba(0,0,0,0.3)',
        }}
      >
        {/* Inner white circle containing the character avatar */}
        <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden border border-neutral-200">
          <CharacterAvatar id={characterId} size="xs" className="w-[90%] h-[90%]" />
        </div>
      </div>
    </motion.div>
  );
};
