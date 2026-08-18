import React from 'react';
import { Player } from '../types';
import { CharacterAvatar } from './CharacterAvatar';
import { COLOR_CONFIG } from '../utils/ludoConstants';
import { Crown, Home } from 'lucide-react';

interface PlayerAreaProps {
  players: Player[];
  activePlayerId: number;
}

export const PlayerArea: React.FC<PlayerAreaProps> = ({ players, activePlayerId }) => {
  return (
    <div className="w-full max-w-md mx-auto grid grid-cols-4 gap-1.5 px-1 sm:px-0">
      {players.map((player) => {
        const isActive = player.id === activePlayerId;
        const colorCfg = COLOR_CONFIG[player.color];
        const inHomeCount = player.tokens.filter((t) => t.step === 57).length;
        const inBaseCount = player.tokens.filter((t) => t.step === 0).length;
        const onBoardCount = 4 - inHomeCount - inBaseCount;

        return (
          <div
            key={player.id}
            className={`relative rounded-2xl p-1.5 sm:p-2 flex flex-col items-center justify-between transition-all duration-200 border ${
              isActive
                ? 'bg-neutral-900/95 border-amber-400 ring-2 ring-amber-400/50 shadow-lg scale-[1.03]'
                : 'bg-neutral-900/60 border-white/10 opacity-80'
            }`}
          >
            {/* Top Color strip */}
            <div
              className="w-full h-1 rounded-full mb-1"
              style={{ backgroundColor: colorCfg.bgHex }}
            />

            {/* Avatar & Winner Crown */}
            <div className="relative">
              <CharacterAvatar id={player.characterId} size="xs" className="w-7 h-7 sm:w-8 sm:h-8" />
              {player.hasWon && (
                <div className="absolute -top-1.5 -right-1.5 bg-amber-400 text-neutral-950 p-0.5 rounded-full shadow-xs">
                  <Crown className="w-2.5 h-2.5 fill-current" />
                </div>
              )}
            </div>

            {/* Name */}
            <span className="text-[10px] sm:text-[11px] font-bold text-white truncate max-w-full mt-1">
              {player.name.split(' ')[0]}
            </span>

            {/* Home Progress Pips */}
            <div className="flex items-center gap-0.5 mt-1 bg-black/40 px-1.5 py-0.5 rounded-full border border-white/10">
              <Home className="w-2.5 h-2.5 text-amber-300 mr-0.5" />
              <span className="text-[9px] font-extrabold text-white">
                {inHomeCount}/4
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
