import React, { useState, useEffect, useRef } from 'react';
import { 
  CharacterId, 
  GamePhase, 
  MoveOption, 
  Player, 
  PlayerColor, 
  TokenData, 
  TurnState,
  BoardCoordinate 
} from '../types';
import { LudoBoard } from './LudoBoard';
import { TurnIndicator } from './TurnIndicator';
import { PlayerArea } from './PlayerArea';
import { ReactionMessage } from './ReactionMessage';
import { WinnerScreen } from './WinnerScreen';
import { CHARACTERS, FUNNY_REACTIONS } from '../data/characters';
import { 
  checkIfPlayerWon, 
  generateStepAnimationPath, 
  getNextPlayerId, 
  getValidMoves,
  TOTAL_STEPS_TO_HOME
} from '../utils/ludoLogic';
import { sounds } from '../utils/audio';
import { RotateCcw, Volume2, VolumeX, ArrowLeft, Dices } from 'lucide-react';

interface LudoGameProps {
  characterAssignments: Record<number, CharacterId>;
  onBackToSelection: () => void;
  onGoHome: () => void;
}

const PLAYER_COLORS: PlayerColor[] = ['red', 'green', 'yellow', 'blue'];

export const LudoGame: React.FC<LudoGameProps> = ({
  characterAssignments,
  onBackToSelection,
  onGoHome,
}) => {
  // Initialize 4 players
  const initializePlayers = (): Player[] => {
    return [0, 1, 2, 3].map((idx) => {
      const charId = characterAssignments[idx] || 'modi';
      const char = CHARACTERS[charId];
      return {
        id: idx,
        color: PLAYER_COLORS[idx],
        characterId: charId,
        name: char.name,
        tokens: [0, 1, 2, 3].map((tId) => ({
          id: tId,
          playerId: idx,
          step: 0, // In base
          isHome: false,
        })),
        hasWon: false,
      };
    });
  };

  const [players, setPlayers] = useState<Player[]>(initializePlayers);
  const [activePlayerId, setActivePlayerId] = useState<number>(0);
  const [turnState, setTurnState] = useState<TurnState>('WAITING_FOR_ROLL');
  const [diceValue, setDiceValue] = useState<number | null>(null);
  const [isRolling, setIsRolling] = useState<boolean>(false);
  const [validMoves, setValidMoves] = useState<MoveOption[]>([]);
  const [isMoving, setIsMoving] = useState<boolean>(false);
  const [movingTokenInfo, setMovingTokenInfo] = useState<{
    playerId: number;
    tokenId: number;
    currentCoord: BoardCoordinate;
  } | null>(null);

  const [reaction, setReaction] = useState<{
    message: string | null;
    speakerCharacterId?: CharacterId;
    speakerName?: string;
    type?: 'quote' | 'event' | 'cut' | 'six';
  }>({ message: null });

  const [winner, setWinner] = useState<Player | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(sounds.getMuted());
  const [showRestartConfirm, setShowRestartConfirm] = useState<boolean>(false);

  const activePlayer = players[activePlayerId] || players[0];

  // Helper to trigger reaction toasts with auto clear
  const triggerReaction = (
    message: string,
    speakerId?: CharacterId,
    speakerName?: string,
    type: 'quote' | 'event' | 'cut' | 'six' = 'event'
  ) => {
    setReaction({
      message,
      speakerCharacterId: speakerId,
      speakerName,
      type,
    });
  };

  // Handle dice rolling
  const handleRollDice = () => {
    if (turnState !== 'WAITING_FOR_ROLL' || isRolling || isMoving) return;

    setIsRolling(true);
    setTurnState('ROLLING');
    sounds.playDiceRoll();

    // Roll random number 1-6
    const roll = Math.floor(Math.random() * 6) + 1;

    setTimeout(() => {
      setIsRolling(false);
      setDiceValue(roll);

      const moves = getValidMoves(activePlayer, players, roll);
      setValidMoves(moves);

      const char = CHARACTERS[activePlayer.characterId];

      if (roll === 6) {
        triggerReaction(char?.sixQuote || 'Ek Aur Chance 😏', activePlayer.characterId, char?.shortName, 'six');
      }

      if (moves.length === 0) {
        // No moves possible!
        setTurnState('TURN_ENDING');
        triggerReaction(
          'No valid moves! Passing turn... 🤷‍♂️',
          activePlayer.characterId,
          char?.shortName
        );

        // Auto pass turn
        setTimeout(() => {
          advanceTurn(false);
        }, 1200);
      } else {
        setTurnState('WAITING_FOR_TOKEN_SELECTION');
      }
    }, 650);
  };

  // Handle player clicking a token to move
  const handleTokenClick = (tokenId: number) => {
    if (turnState !== 'WAITING_FOR_TOKEN_SELECTION' || isMoving) return;

    const chosenMove = validMoves.find((m) => m.tokenId === tokenId);
    if (!chosenMove) return;

    executeMove(chosenMove);
  };

  // Step-by-step smooth movement animation
  const executeMove = async (move: MoveOption) => {
    setIsMoving(true);
    setTurnState('MOVING_TOKEN');
    setValidMoves([]); // Clear highlights while moving

    const pathCoords = generateStepAnimationPath(
      activePlayerId,
      move.tokenId,
      move.fromStep,
      move.toStep
    );

    // Animate along each coordinate
    for (let i = 0; i < pathCoords.length; i++) {
      setMovingTokenInfo({
        playerId: activePlayerId,
        tokenId: move.tokenId,
        currentCoord: pathCoords[i],
      });

      if (i > 0) {
        sounds.playTokenStep();
      }

      // Small delay between hops for smooth animation
      await new Promise((resolve) => setTimeout(resolve, 140));
    }

    // Finished animation, apply game state update
    let didCutOpponent = false;
    let didReachHome = move.toStep === TOTAL_STEPS_TO_HOME;
    let opponentCutInfo: { playerName: string; charId: CharacterId } | null = null;

    setPlayers((prevPlayers) => {
      const updated = prevPlayers.map((p) => {
        // Update current player's token
        if (p.id === activePlayerId) {
          const updatedTokens = p.tokens.map((t) => {
            if (t.id === move.tokenId) {
              return {
                ...t,
                step: move.toStep,
                isHome: move.toStep === TOTAL_STEPS_TO_HOME,
              };
            }
            return t;
          });

          return {
            ...p,
            tokens: updatedTokens,
          };
        }

        // Check if opponent token is cut
        if (move.cutsOpponentToken && p.id === move.cutsOpponentToken.playerId) {
          didCutOpponent = true;
          const oppChar = CHARACTERS[p.characterId];
          opponentCutInfo = { playerName: p.name, charId: p.characterId };

          const updatedOppTokens = p.tokens.map((t) => {
            if (t.id === move.cutsOpponentToken!.tokenId) {
              return {
                ...t,
                step: 0, // Reset back to base!
                isHome: false,
              };
            }
            return t;
          });

          return {
            ...p,
            tokens: updatedOppTokens,
          };
        }

        return p;
      });

      return updated;
    });

    setMovingTokenInfo(null);
    setIsMoving(false);

    // Audio & Reaction triggers
    const activeChar = CHARACTERS[activePlayer.characterId];

    if (didCutOpponent) {
      sounds.playTokenCut();
      triggerReaction(
        activeChar?.cutQuote || 'Bhai Gayi Goti 💀',
        activePlayer.characterId,
        activeChar?.shortName,
        'cut'
      );
    } else if (didReachHome) {
      sounds.playHomeEntry();
      triggerReaction(
        'Bas Ghar Aa Gaya! 🏠',
        activePlayer.characterId,
        activeChar?.shortName
      );
    } else if (move.isRelease) {
      sounds.playTokenRelease();
      triggerReaction(
        'Goti Maidan Mein! 🚀',
        activePlayer.characterId,
        activeChar?.shortName
      );
    }

    // Check Win Condition
    const currentPlayerUpdated = players.find((p) => p.id === activePlayerId);
    // Note: check with move.toStep included
    const tokensHome = (currentPlayerUpdated?.tokens || []).filter((t) =>
      t.id === move.tokenId ? move.toStep === TOTAL_STEPS_TO_HOME : t.step === TOTAL_STEPS_TO_HOME
    ).length;

    if (tokensHome === 4) {
      // Current player won!
      const wonPlayer = {
        ...activePlayer,
        hasWon: true,
      };
      setWinner(wonPlayer);
      return;
    }

    // Extra Turn logic:
    // Rolling a 6, cutting an opponent, or entering Home earns an extra turn!
    const getsExtraTurn = (diceValue === 6) || didCutOpponent || didReachHome;

    if (getsExtraTurn) {
      setTimeout(() => {
        advanceTurn(true);
      }, 500);
    } else {
      setTimeout(() => {
        advanceTurn(false);
      }, 400);
    }
  };

  // Advance turn to next player
  const advanceTurn = (extraTurn: boolean) => {
    const nextId = getNextPlayerId(activePlayerId, players, extraTurn);
    setActivePlayerId(nextId);
    setDiceValue(null);
    setValidMoves([]);
    setTurnState('WAITING_FOR_ROLL');
  };

  // Restart game with current characters
  const handleRestart = () => {
    setPlayers(initializePlayers());
    setActivePlayerId(0);
    setTurnState('WAITING_FOR_ROLL');
    setDiceValue(null);
    setValidMoves([]);
    setIsMoving(false);
    setMovingTokenInfo(null);
    setWinner(null);
    setShowRestartConfirm(false);
    triggerReaction('Game Restarted! Modi Ji (Red) starts.');
  };

  return (
    <div className="min-h-screen w-full bg-[#140824] text-white flex flex-col justify-between p-2 sm:p-4 select-none relative overflow-x-hidden">
      {/* Top Navbar */}
      <div className="max-w-md w-full mx-auto flex items-center justify-between py-1">
        <button
          onClick={onBackToSelection}
          className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors flex items-center gap-1 text-xs font-bold cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Change Heroes
        </button>

        <div className="flex items-center gap-1 text-center">
          <span className="text-sm font-black tracking-wider text-amber-300">
            LODU <span className="text-white">LUDO</span>
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowRestartConfirm(true)}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-neutral-300 hover:text-white transition-colors cursor-pointer"
            title="Restart Game"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              const muted = sounds.toggleMute();
              setIsMuted(muted);
            }}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-neutral-300 hover:text-white transition-colors cursor-pointer"
            title={isMuted ? 'Unmute audio' : 'Mute audio'}
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4 text-rose-400" />
            ) : (
              <Volume2 className="w-4 h-4 text-emerald-400" />
            )}
          </button>
        </div>
      </div>

      {/* 4 Player Summary Dashboard */}
      <div className="my-1">
        <PlayerArea players={players} activePlayerId={activePlayerId} />
      </div>

      {/* Short Dynamic Banter / Reaction Toast */}
      <div className="my-0.5">
        <ReactionMessage
          message={reaction.message}
          speakerCharacterId={reaction.speakerCharacterId}
          speakerName={reaction.speakerName}
          type={reaction.type}
        />
      </div>

      {/* Primary Ludo Board (Mobile-first Square 15x15) */}
      <div className="my-auto py-1 flex items-center justify-center">
        <LudoBoard
          players={players}
          activePlayerId={activePlayerId}
          validMoves={validMoves}
          isMoving={isMoving}
          movingTokenInfo={movingTokenInfo}
          onTokenClick={handleTokenClick}
        />
      </div>

      {/* Bottom Turn & Animated Dice Dock */}
      <div className="mt-2 mb-1">
        <TurnIndicator
          activePlayer={activePlayer}
          turnState={turnState}
          diceValue={diceValue}
          isRolling={isRolling}
          hasValidMoves={validMoves.length > 0}
          onRollDice={handleRollDice}
        />
      </div>

      {/* Winner Screen Popup */}
      {winner && (
        <WinnerScreen
          winner={winner}
          onPlayAgain={handleRestart}
          onChangeCharacters={onBackToSelection}
          onGoHome={onGoHome}
        />
      )}

      {/* Restart Confirmation Modal */}
      {showRestartConfirm && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-white/20 rounded-2xl p-5 max-w-xs w-full text-center shadow-2xl">
            <h3 className="text-base font-bold text-white mb-2">Restart Game?</h3>
            <p className="text-xs text-neutral-400 mb-4">
              This will reset the current game board and token positions.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setShowRestartConfirm(false)}
                className="py-2.5 rounded-xl bg-neutral-800 text-neutral-300 font-semibold text-xs hover:bg-neutral-700"
              >
                Cancel
              </button>
              <button
                onClick={handleRestart}
                className="py-2.5 rounded-xl bg-rose-600 text-white font-bold text-xs hover:bg-rose-500"
              >
                Yes, Restart
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
