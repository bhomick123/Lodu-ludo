import React from 'react';
import { Star, Home, Crown, ArrowRight, ArrowDown, ArrowLeft, ArrowUp } from 'lucide-react';
import { BoardCoordinate, MoveOption, Player, TokenData } from '../types';
import { Token } from './Token';
import { CharacterAvatar } from './CharacterAvatar';
import { COLOR_CONFIG } from '../utils/ludoConstants';

interface LudoBoardProps {
  players: Player[];
  activePlayerId: number;
  validMoves: MoveOption[];
  isMoving: boolean;
  movingTokenInfo?: {
    playerId: number;
    tokenId: number;
    currentCoord: BoardCoordinate;
  } | null;
  onTokenClick: (tokenId: number) => void;
}

export const LudoBoard: React.FC<LudoBoardProps> = ({
  players,
  activePlayerId,
  validMoves,
  isMoving,
  movingTokenInfo,
  onTokenClick,
}) => {
  // Map all static tokens to their coordinates (row, col)
  const tokenMap: Record<string, { token: TokenData; player: Player }[]> = {};

  players.forEach((player) => {
    player.tokens.forEach((token) => {
      // If this token is actively moving, skip it from static grid map
      if (
        isMoving &&
        movingTokenInfo &&
        movingTokenInfo.playerId === player.id &&
        movingTokenInfo.tokenId === token.id
      ) {
        return;
      }

      const coord = getStaticTokenCoord(player.id, token.id, token.step);
      const key = `${coord.row}-${coord.col}`;
      if (!tokenMap[key]) {
        tokenMap[key] = [];
      }
      tokenMap[key].push({ token, player });
    });
  });

  function getStaticTokenCoord(playerId: number, tokenId: number, step: number): BoardCoordinate {
    if (step === 0) {
      const baseCoords: Record<number, BoardCoordinate[]> = {
        0: [{ row: 2, col: 2 }, { row: 2, col: 3 }, { row: 3, col: 2 }, { row: 3, col: 3 }],
        1: [{ row: 2, col: 11 }, { row: 2, col: 12 }, { row: 3, col: 11 }, { row: 3, col: 12 }],
        2: [{ row: 11, col: 11 }, { row: 11, col: 12 }, { row: 12, col: 11 }, { row: 12, col: 12 }],
        3: [{ row: 11, col: 2 }, { row: 11, col: 3 }, { row: 12, col: 2 }, { row: 12, col: 3 }],
      };
      return baseCoords[playerId][tokenId];
    }
    if (step <= 51) {
      const offsets = [0, 13, 26, 39];
      const trackIdx = (offsets[playerId] + (step - 1)) % 52;
      const COMMON: BoardCoordinate[] = [
        { row: 6, col: 1 }, { row: 6, col: 2 }, { row: 6, col: 3 }, { row: 6, col: 4 }, { row: 6, col: 5 },
        { row: 5, col: 6 }, { row: 4, col: 6 }, { row: 3, col: 6 }, { row: 2, col: 6 }, { row: 1, col: 6 }, { row: 0, col: 6 },
        { row: 0, col: 7 }, { row: 0, col: 8 },
        { row: 1, col: 8 }, { row: 2, col: 8 }, { row: 3, col: 8 }, { row: 4, col: 8 }, { row: 5, col: 8 },
        { row: 6, col: 9 }, { row: 6, col: 10 }, { row: 6, col: 11 }, { row: 6, col: 12 }, { row: 6, col: 13 }, { row: 6, col: 14 },
        { row: 7, col: 14 }, { row: 8, col: 14 },
        { row: 8, col: 13 }, { row: 8, col: 12 }, { row: 8, col: 11 }, { row: 8, col: 10 }, { row: 8, col: 9 },
        { row: 9, col: 8 }, { row: 10, col: 8 }, { row: 11, col: 8 }, { row: 12, col: 8 }, { row: 13, col: 8 }, { row: 14, col: 8 },
        { row: 14, col: 7 }, { row: 14, col: 6 },
        { row: 13, col: 6 }, { row: 12, col: 6 }, { row: 11, col: 6 }, { row: 10, col: 6 }, { row: 9, col: 6 },
        { row: 8, col: 5 }, { row: 8, col: 4 }, { row: 8, col: 3 }, { row: 8, col: 2 }, { row: 8, col: 1 }, { row: 8, col: 0 },
        { row: 7, col: 0 }, { row: 6, col: 0 }
      ];
      return COMMON[trackIdx];
    }
    if (step <= 56) {
      const homeIdx = step - 52;
      const paths: Record<number, BoardCoordinate[]> = {
        0: [{ row: 7, col: 1 }, { row: 7, col: 2 }, { row: 7, col: 3 }, { row: 7, col: 4 }, { row: 7, col: 5 }],
        1: [{ row: 1, col: 7 }, { row: 2, col: 7 }, { row: 3, col: 7 }, { row: 4, col: 7 }, { row: 5, col: 7 }],
        2: [{ row: 7, col: 13 }, { row: 7, col: 12 }, { row: 7, col: 11 }, { row: 7, col: 10 }, { row: 7, col: 9 }],
        3: [{ row: 13, col: 7 }, { row: 12, col: 7 }, { row: 11, col: 7 }, { row: 10, col: 7 }, { row: 9, col: 7 }],
      };
      return paths[playerId][homeIdx];
    }
    // Final home
    const finalHomes: Record<number, BoardCoordinate> = {
      0: { row: 7, col: 6 },
      1: { row: 6, col: 7 },
      2: { row: 7, col: 8 },
      3: { row: 8, col: 7 },
    };
    return finalHomes[playerId];
  }

  // Safe square cell set
  const safeCells = new Set<string>([
    '6-1',  // Red Start
    '2-6',  // Red Star
    '1-8',  // Green Start
    '6-12', // Green Star
    '8-13', // Yellow Start
    '12-8', // Yellow Star
    '13-6', // Blue Start
    '8-2',  // Blue Star
  ]);

  const renderCellContent = (row: number, col: number) => {
    const key = `${row}-${col}`;
    const tokensHere = tokenMap[key] || [];

    // Red Base (0-5, 0-5)
    if (row < 6 && col < 6) return null;
    // Green Base (0-5, 9-14)
    if (row < 6 && col > 8) return null;
    // Yellow Base (9-14, 9-14)
    if (row > 8 && col > 8) return null;
    // Blue Base (9-14, 0-5)
    if (row > 8 && col < 6) return null;
    // Center Triangle (6-8, 6-8)
    if (row >= 6 && row <= 8 && col >= 6 && col <= 8) return null;

    // Check specific path styling
    let cellBg = 'bg-white';
    let icon = null;

    // Home paths
    if (row === 7 && col >= 1 && col <= 5) cellBg = 'bg-red-500 text-white';
    else if (col === 7 && row >= 1 && row <= 5) cellBg = 'bg-emerald-500 text-white';
    else if (row === 7 && col >= 9 && col <= 13) cellBg = 'bg-amber-400 text-white';
    else if (col === 7 && row >= 9 && row <= 13) cellBg = 'bg-blue-500 text-white';

    // Start squares
    if (row === 6 && col === 1) {
      cellBg = 'bg-red-500 text-white';
      icon = <ArrowRight className="w-3.5 h-3.5 text-white/90 stroke-[2.5]" />;
    } else if (row === 1 && col === 8) {
      cellBg = 'bg-emerald-500 text-white';
      icon = <ArrowDown className="w-3.5 h-3.5 text-white/90 stroke-[2.5]" />;
    } else if (row === 8 && col === 13) {
      cellBg = 'bg-amber-400 text-white';
      icon = <ArrowLeft className="w-3.5 h-3.5 text-white/90 stroke-[2.5]" />;
    } else if (row === 13 && col === 6) {
      cellBg = 'bg-blue-500 text-white';
      icon = <ArrowUp className="w-3.5 h-3.5 text-white/90 stroke-[2.5]" />;
    }

    // Star Safe squares
    if (safeCells.has(key) && !icon) {
      icon = <Star className="w-3 h-3 text-amber-500 fill-amber-400" />;
    }

    return (
      <div
        className={`w-full h-full border border-neutral-300 flex items-center justify-center relative select-none ${cellBg}`}
      >
        {icon && tokensHere.length === 0 && (
          <div className="opacity-90">{icon}</div>
        )}

        {/* Tokens in this cell */}
        {tokensHere.length > 0 && (
          <div className="relative w-full h-full flex items-center justify-center">
            {tokensHere.map((item, idx) => {
              const isSelectable =
                !isMoving &&
                item.player.id === activePlayerId &&
                validMoves.some((m) => m.tokenId === item.token.id);

              return (
                <Token
                  key={`token-${item.player.id}-${item.token.id}`}
                  tokenId={item.token.id}
                  playerId={item.player.id}
                  characterId={item.player.characterId}
                  playerColor={item.player.color}
                  isSelectable={isSelectable}
                  stackIndex={idx}
                  stackTotal={tokensHere.length}
                  size={tokensHere.length > 1 ? 'stacked' : 'normal'}
                  onClick={() => onTokenClick(item.token.id)}
                />
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const renderBase = (playerIndex: number) => {
    const player = players[playerIndex];
    if (!player) return null;
    const colorCfg = COLOR_CONFIG[player.color];

    const basePositions = [
      'top-0 left-0',     // Red: Top-Left
      'top-0 right-0',    // Green: Top-Right
      'bottom-0 right-0', // Yellow: Bottom-Right
      'bottom-0 left-0',  // Blue: Bottom-Left
    ];

    const isCurrentActive = player.id === activePlayerId;

    return (
      <div
        className={`absolute ${basePositions[playerIndex]} w-[40%] h-[40%] p-2 sm:p-3 transition-all duration-300`}
      >
        <div
          className={`w-full h-full rounded-2xl p-2.5 sm:p-3.5 flex flex-col justify-between shadow-md border-2 relative ${
            isCurrentActive ? 'ring-4 ring-white shadow-xl scale-[1.02]' : 'opacity-95'
          }`}
          style={{
            backgroundColor: colorCfg.bgHex,
            borderColor: '#FFFFFF',
          }}
        >
          {/* Base Header with Character info */}
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center gap-1.5 overflow-hidden">
              <CharacterAvatar id={player.characterId} size="xs" />
              <span className="text-[11px] sm:text-xs font-bold truncate drop-shadow-xs">
                {player.name}
              </span>
            </div>
            {player.hasWon && (
              <span className="text-[10px] bg-amber-400 text-neutral-900 px-1.5 py-0.5 rounded-full font-extrabold flex items-center gap-0.5">
                <Crown className="w-2.5 h-2.5 fill-current" /> WON
              </span>
            )}
          </div>

          {/* White Inner Box with 4 Token Slots */}
          <div className="bg-white rounded-xl p-2 grid grid-cols-2 grid-rows-2 gap-2 place-items-center shadow-inner h-[65%]">
            {[0, 1, 2, 3].map((slotIdx) => {
              const token = player.tokens[slotIdx];
              const isInBase = token && token.step === 0;
              const isSelectable =
                !isMoving &&
                isInBase &&
                isCurrentActive &&
                validMoves.some((m) => m.tokenId === token.id);

              return (
                <div
                  key={slotIdx}
                  className="w-7 h-7 sm:w-9 sm:h-9 rounded-full flex items-center justify-center border-2 border-neutral-200 shadow-inner"
                  style={{ backgroundColor: colorCfg.lightHex }}
                >
                  {isInBase && (
                    <Token
                      tokenId={token.id}
                      playerId={player.id}
                      characterId={player.characterId}
                      playerColor={player.color}
                      isSelectable={isSelectable}
                      onClick={() => onTokenClick(token.id)}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // Center Home 3x3 Triangles
  const renderCenterHome = () => {
    return (
      <div className="absolute top-[40%] left-[40%] w-[20%] h-[20%] bg-neutral-900 overflow-hidden shadow-inner border border-neutral-300">
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {/* Red Triangle (Left) */}
          <polygon points="0,0 50,50 0,100" fill="#DC2626" />
          {/* Green Triangle (Top) */}
          <polygon points="0,0 50,50 100,0" fill="#16A34A" />
          {/* Yellow Triangle (Right) */}
          <polygon points="100,0 50,50 100,100" fill="#EAB308" />
          {/* Blue Triangle (Bottom) */}
          <polygon points="0,100 50,50 100,100" fill="#2563EB" />
          {/* Center Golden Circle */}
          <circle cx="50" cy="50" r="16" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="2" />
        </svg>

        {/* Center Golden Home Badge */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-6 h-6 rounded-full bg-amber-400 shadow-md flex items-center justify-center border border-amber-200">
            <Home className="w-3.5 h-3.5 text-amber-950 fill-amber-950" />
          </div>
        </div>

        {/* Display Tokens that have reached final home step 57 */}
        {players.map((p) => {
          const homeTokens = p.tokens.filter((t) => t.step === 57);
          if (homeTokens.length === 0) return null;

          const positions = [
            'top-1/2 left-2 -translate-y-1/2',    // Red (left)
            'top-2 left-1/2 -translate-x-1/2',    // Green (top)
            'top-1/2 right-2 -translate-y-1/2',   // Yellow (right)
            'bottom-2 left-1/2 -translate-x-1/2', // Blue (bottom)
          ];

          return (
            <div
              key={`home-tokens-${p.id}`}
              className={`absolute ${positions[p.id]} flex items-center gap-0.5 pointer-events-none`}
            >
              <div className="w-4 h-4 rounded-full bg-white flex items-center justify-center text-[9px] font-extrabold shadow-sm border border-neutral-300">
                {homeTokens.length}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="relative w-full max-w-[440px] aspect-square mx-auto bg-white rounded-3xl shadow-2xl overflow-hidden border-4 border-neutral-800 select-none">
      {/* 15x15 Grid of standard cells */}
      <div className="grid grid-cols-15 grid-rows-15 w-full h-full">
        {Array.from({ length: 15 }).map((_, r) =>
          Array.from({ length: 15 }).map((_, c) => (
            <div key={`${r}-${c}`} className="w-full h-full">
              {renderCellContent(r, c)}
            </div>
          ))
        )}
      </div>

      {/* 4 Corner Base Yards */}
      {renderBase(0)}
      {renderBase(1)}
      {renderBase(2)}
      {renderBase(3)}

      {/* Center Home */}
      {renderCenterHome()}

      {/* Active Moving Token Overlay (Step-by-step smooth jump) */}
      {isMoving && movingTokenInfo && (
        <div
          className="absolute pointer-events-none transition-all duration-150 ease-out z-50"
          style={{
            width: `${100 / 15}%`,
            height: `${100 / 15}%`,
            top: `${(movingTokenInfo.currentCoord.row / 15) * 100}%`,
            left: `${(movingTokenInfo.currentCoord.col / 15) * 100}%`,
          }}
        >
          <Token
            tokenId={movingTokenInfo.tokenId}
            playerId={movingTokenInfo.playerId}
            characterId={players[movingTokenInfo.playerId]?.characterId || 'modi'}
            playerColor={players[movingTokenInfo.playerId]?.color || 'red'}
            isSelectable={false}
            isMoving={true}
            size="normal"
          />
        </div>
      )}
    </div>
  );
};
