import React from 'react';
import { motion } from 'motion/react';
import { CharacterId, PlayerColor } from '../types';
import { CharacterAvatar } from './CharacterAvatar';
import { COLOR_CONFIG } from '../utils/ludoConstants';
import { sounds } from '../utils/audio';

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
    normal: 'w-[90%] h-[90%]',
    stacked: 'w-[72%] h-[72%]',
    tiny: 'w-[56%] h-[56%]',
  }[size];

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSelectable && onClick) {
      sounds.playTokenSelect();
      onClick();
    } else if (!isSelectable && !isMoving) {
      sounds.playInvalidToken();
    }
  };

  return (
    <motion.div
      id={`token-p${playerId}-t${tokenId}`}
      animate={
        isSelectable
          ? {
              scale: [1, 1.16, 1],
              y: [0, -6, 0],
            }
          : { scale: 1, y: 0 }
      }
      transition={
        isSelectable
          ? {
              duration: 0.75,
              repeat: Infinity,
              ease: 'easeInOut',
            }
          : { duration: 0.2 }
      }
      style={{
        transform: `translate(${offsetX}px, ${offsetY}px)`,
        zIndex: isMoving ? 50 : isSelectable ? 40 : 10 + stackIndex,
      }}
      onClick={handleClick}
      className={`relative rounded-full select-none flex items-center justify-center transition-all ${dimensionClasses} ${
        isSelectable ? 'cursor-pointer touch-manipulation' : 'pointer-events-auto'
      }`}
    >
      {/* Radiant Glowing Pulsing Rings if selectable */}
      {isSelectable && (
        <>
          <motion.div
            animate={{ scale: [1, 1.45, 1], opacity: [0.85, 0.15, 0.85] }}
            transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -inset-2 rounded-full border-2 border-amber-300 pointer-events-none"
            style={{
              boxShadow: `0 0 16px 4px ${colorCfg.bgHex}dd, inset 0 0 8px ${colorCfg.bgHex}aa`,
            }}
          />
          <motion.div
            animate={{ scale: [1.1, 1.3, 1.1], opacity: [0.5, 0.1, 0.5] }}
            transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }}
            className="absolute -inset-3 rounded-full bg-white/20 pointer-events-none"
          />
        </>
      )}

      {/* Outer colored token disc */}
      <div
        className={`w-full h-full rounded-full p-[2px] shadow-lg flex items-center justify-center border-2 ${
          isSelectable ? 'border-amber-300 ring-2 ring-white/90' : 'border-white'
        }`}
        style={{
          backgroundColor: colorCfg.bgHex,
          boxShadow: isSelectable
            ? `0 0 14px 4px ${colorCfg.bgHex}, 0 4px 8px rgba(0,0,0,0.5)`
            : '0 2px 5px rgba(0,0,0,0.3)',
        }}
      >
        {/* Inner white circle containing the character avatar */}
        <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden border border-neutral-200">
          <CharacterAvatar id={characterId} size="xs" className="w-[92%] h-[92%]" />
        </div>
      </div>
    </motion.div>
  );
};
