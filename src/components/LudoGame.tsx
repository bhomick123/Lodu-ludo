import React, { useState, useEffect, useRef } from 'react';
import { 
  CharacterId, 
  GamePhase, 
  MoveOption, 
  Player, 
  PlayerColor, 
  TokenData, 
  TurnState,
  BoardCoordinate,
  CaptureFeedback
} from '../types';
import { LudoBoard } from './LudoBoard';
import { PlayerCornerBox } from './PlayerCornerBox';
import { ReactionMessage } from './ReactionMessage';
import { WinnerScreen } from './WinnerScreen';
import { CHARACTERS, FUNNY_REACTIONS } from '../data/characters';
import { 
  checkIfPlayerWon, 
  generateStepAnimationPath, 
  getNextPlayerId, 
  getValidMoves,
  getDistinctLegalTokenIds,
  TOTAL_STEPS_TO_HOME
} from '../utils/ludoLogic';
import { sounds } from '../utils/audio';
import { RotateCcw, Volume2, VolumeX, ArrowLeft } from 'lucide-react';

interface LudoGameProps {
  characterAssignments: Record<number, CharacterId>;
  onBackToSelection: () => void;
  onGoHome: () => void;
}

const PLAYER_COLORS: PlayerColor[] = ['red', 'green', 'yellow', 'blue'];

/**
 * Authoritatively determines if the current player should continue rolling or pass the turn.
 */
export function shouldGrantExtraTurn(params: {
  rolledSix: boolean;
  capturedOpponent: boolean;
  reachedHome: boolean;
  isThirdConsecutiveSix?: boolean;
}): boolean {
  if (params.isThirdConsecutiveSix) {
    return false; // Third consecutive six penalty: forfeit turn!
  }
  return params.rolledSix || params.capturedOpponent || params.reachedHome;
}

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
  
  // Refs to guarantee atomic execution and prevent stale closures across async ticks
  const isMovingRef = useRef<boolean>(false);
  const autoMoveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const playersRef = useRef<Player[]>(players);
  playersRef.current = players;
  const activePlayerIdRef = useRef<number>(activePlayerId);
  activePlayerIdRef.current = activePlayerId;
  const turnStateRef = useRef<TurnState>(turnState);
  turnStateRef.current = turnState;

  const [movingTokenInfo, setMovingTokenInfo] = useState<{
    playerId: number;
    tokenId: number;
    currentCoord: BoardCoordinate;
  } | null>(null);

  const [captureFeedback, setCaptureFeedback] = useState<CaptureFeedback | null>(null);

  const [reaction, setReaction] = useState<{
    message: string | null;
    speakerCharacterId?: CharacterId;
    speakerName?: string;
    type?: 'quote' | 'event' | 'cut' | 'six';
  }>({ message: null });

  const [winner, setWinner] = useState<Player | null>(null);
  const [consecutiveSixes, setConsecutiveSixes] = useState<number>(0);
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
    if (turnState !== 'WAITING_FOR_ROLL' || isRolling || isMoving || isMovingRef.current) return;

    if (autoMoveTimeoutRef.current) {
      clearTimeout(autoMoveTimeoutRef.current);
      autoMoveTimeoutRef.current = null;
    }

    setIsRolling(true);
    setTurnState('ROLLING');
    sounds.playDiceRoll();

    // Roll random number 1-6
    const roll = Math.floor(Math.random() * 6) + 1;

    setTimeout(() => {
      setIsRolling(false);
      setDiceValue(roll);

      const currentPlayers = playersRef.current;
      const currentActive = currentPlayers[activePlayerIdRef.current] || currentPlayers[0];
      const char = CHARACTERS[currentActive.characterId];

      if (roll === 6) {
        const nextSixes = consecutiveSixes + 1;
        if (nextSixes >= 3) {
          // Three consecutive 6s penalty: turn forfeited!
          setConsecutiveSixes(0);
          setTurnState('TURN_ENDING');
          triggerReaction(
            '3 Sixes in a row! Turn forfeited! 🎲❌',
            currentActive.characterId,
            char?.shortName
          );
          setTimeout(() => {
            advanceTurn(false);
          }, 1200);
          return;
        }
        setConsecutiveSixes(nextSixes);
        triggerReaction(char?.sixQuote || 'Ek Aur Chance 😏', currentActive.characterId, char?.shortName, 'six');
      } else {
        setConsecutiveSixes(0);
      }

      // Calculate fresh legal moves for current player and dice roll
      const moves = getValidMoves(currentActive, currentPlayers, roll);
      const distinctLegalTokenIds = getDistinctLegalTokenIds(moves);
      const legalTokenCount = distinctLegalTokenIds.length;

      setValidMoves(moves);

      if (legalTokenCount === 0) {
        // 0 valid tokens -> auto pass turn
        setTurnState('TURN_ENDING');
        triggerReaction(
          'No valid moves! Passing turn... 🤷‍♂️',
          currentActive.characterId,
          char?.shortName
        );
        setTimeout(() => {
          advanceTurn(false);
        }, 1200);
      } else if (legalTokenCount === 1) {
        // EXACTLY 1 distinct legal token -> Snapshot parameters and automatic move after a brief delay
        const targetTokenId = distinctLegalTokenIds[0];
        const targetMove = moves.find((m) => m.tokenId === targetTokenId)!;
        const snapshotPlayerId = currentActive.id;
        const snapshotRoll = roll;

        setTurnState('WAITING_FOR_TOKEN_SELECTION');
        
        autoMoveTimeoutRef.current = setTimeout(() => {
          // Pre-execution snapshot guard: re-verify conditions
          if (
            activePlayerIdRef.current === snapshotPlayerId &&
            turnStateRef.current === 'WAITING_FOR_TOKEN_SELECTION' &&
            !isMovingRef.current
          ) {
            const latestPlayers = playersRef.current;
            const latestActive = latestPlayers[snapshotPlayerId];
            const freshMoves = getValidMoves(latestActive, latestPlayers, snapshotRoll);
            const freshTokenIds = getDistinctLegalTokenIds(freshMoves);

            if (freshTokenIds.length === 1 && freshTokenIds[0] === targetTokenId) {
              const freshMove = freshMoves.find((m) => m.tokenId === targetTokenId);
              if (freshMove) {
                executeMove(freshMove);
              }
            }
          }
        }, 350);
      } else {
        // 2 or more distinct legal tokens -> NEVER auto-move! Cancel any pending timers and wait for player choice
        if (autoMoveTimeoutRef.current) {
          clearTimeout(autoMoveTimeoutRef.current);
          autoMoveTimeoutRef.current = null;
        }
        setTurnState('WAITING_FOR_TOKEN_SELECTION');
      }
    }, 650);
  };

  // Handle player clicking a token to move
  const handleTokenClick = (tokenId: number) => {
    if (turnState !== 'WAITING_FOR_TOKEN_SELECTION' || isMoving || isMovingRef.current) return;

    // Manual click always cancels any pending auto-move timer
    if (autoMoveTimeoutRef.current) {
      clearTimeout(autoMoveTimeoutRef.current);
      autoMoveTimeoutRef.current = null;
    }

    const chosenMove = validMoves.find((m) => m.tokenId === tokenId);
    if (!chosenMove) return;

    executeMove(chosenMove);
  };

  // Step-by-step smooth movement animation with synchronous capture handling
  const executeMove = async (move: MoveOption) => {
    if (isMovingRef.current) return;
    isMovingRef.current = true;

    if (autoMoveTimeoutRef.current) {
      clearTimeout(autoMoveTimeoutRef.current);
      autoMoveTimeoutRef.current = null;
    }

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

    // Step animation completed: evaluate capture, home entry, and extra turn synchronously
    const didCutOpponent = Boolean(move.cutsOpponentToken);
    const didReachHome = move.toStep === TOTAL_STEPS_TO_HOME;
    const rolledSix = diceValue === 6;
    const currentActive = playersRef.current[activePlayerIdRef.current] || activePlayer;
    const activeChar = CHARACTERS[currentActive.characterId];

    // If a capture occurred, trigger the rich capture impact & knockback sequence
    if (didCutOpponent && move.cutsOpponentToken) {
      const oppPlayer = playersRef.current.find((p) => p.id === move.cutsOpponentToken!.playerId);
      const destinationCoord = pathCoords[pathCoords.length - 1];

      if (oppPlayer) {
        setCaptureFeedback({
          coord: destinationCoord,
          attackerPlayerId: activePlayerId,
          capturedPlayerId: oppPlayer.id,
          capturedTokenId: move.cutsOpponentToken.tokenId,
          capturedCharacterId: oppPlayer.characterId,
          capturedPlayerColor: oppPlayer.color,
        });

        sounds.playTokenCut();

        triggerReaction(
          activeChar?.cutQuote || 'Bhai Gayi Goti 💀',
          currentActive.characterId,
          activeChar?.shortName,
          'cut'
        );

        // Allow satisfying 450ms visual capture feedback sequence to finish
        await new Promise((resolve) => setTimeout(resolve, 450));
        setCaptureFeedback(null);
      }
    } else if (didReachHome) {
      sounds.playHomeEntry();
      triggerReaction(
        'Bas Ghar Aa Gaya! 🏠',
        currentActive.characterId,
        activeChar?.shortName
      );
    } else if (move.isRelease) {
      sounds.playTokenRelease();
      triggerReaction(
        'Goti Maidan Mein! 🚀',
        currentActive.characterId,
        activeChar?.shortName
      );
    }

    // Apply logical game state updates to all players
    setPlayers((prevPlayers) => {
      return prevPlayers.map((p) => {
        // Update current moving token
        if (p.id === activePlayerId) {
          return {
            ...p,
            tokens: p.tokens.map((t) =>
              t.id === move.tokenId
                ? { ...t, step: move.toStep, isHome: move.toStep === TOTAL_STEPS_TO_HOME }
                : t
            ),
          };
        }

        // Reset captured opponent token to base
        if (move.cutsOpponentToken && p.id === move.cutsOpponentToken.playerId) {
          return {
            ...p,
            tokens: p.tokens.map((t) =>
              t.id === move.cutsOpponentToken!.tokenId
                ? { ...t, step: 0, isHome: false }
                : t
            ),
          };
        }

        return p;
      });
    });

    setMovingTokenInfo(null);
    isMovingRef.current = false;
    setIsMoving(false);

    // Check Win Condition
    const currentPlayerTokens = playersRef.current.find((p) => p.id === activePlayerId)?.tokens || [];
    const tokensHome = currentPlayerTokens.filter((t) =>
      t.id === move.tokenId ? move.toStep === TOTAL_STEPS_TO_HOME : t.step === TOTAL_STEPS_TO_HOME
    ).length;

    if (tokensHome === 4) {
      const wonPlayer = {
        ...currentActive,
        hasWon: true,
      };
      setWinner(wonPlayer);
      sounds.playWinFanfare();
      return;
    }

    // Authoritative extra turn calculation
    const getsExtraTurn = shouldGrantExtraTurn({
      rolledSix,
      capturedOpponent: didCutOpponent,
      reachedHome: didReachHome,
    });

    if (getsExtraTurn) {
      setTimeout(() => {
        advanceTurn(true);
      }, 400);
    } else {
      setTimeout(() => {
        advanceTurn(false);
      }, 350);
    }
  };

  // Authoritative turn transition
  const advanceTurn = (extraTurn: boolean) => {
    if (autoMoveTimeoutRef.current) {
      clearTimeout(autoMoveTimeoutRef.current);
      autoMoveTimeoutRef.current = null;
    }

    if (!extraTurn) {
      setConsecutiveSixes(0);
    }

    const currentPlayers = playersRef.current;
    const nextId = getNextPlayerId(activePlayerIdRef.current, currentPlayers, extraTurn);
    setActivePlayerId(nextId);
    setDiceValue(null);
    setValidMoves([]);
    setTurnState('WAITING_FOR_ROLL');
  };

  // Restart game with current characters
  const handleRestart = () => {
    if (autoMoveTimeoutRef.current) {
      clearTimeout(autoMoveTimeoutRef.current);
      autoMoveTimeoutRef.current = null;
    }
    isMovingRef.current = false;
    setPlayers(initializePlayers());
    setActivePlayerId(0);
    setConsecutiveSixes(0);
    setTurnState('WAITING_FOR_ROLL');
    setDiceValue(null);
    setValidMoves([]);
    setIsMoving(false);
    setMovingTokenInfo(null);
    setCaptureFeedback(null);
    setWinner(null);
    setShowRestartConfirm(false);
    triggerReaction('Game Restarted! Modi Ji (Red) starts.');
  };

  // Cleanup pending timeouts on unmount
  useEffect(() => {
    return () => {
      if (autoMoveTimeoutRef.current) {
        clearTimeout(autoMoveTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="min-h-screen w-full bg-[#140824] text-white flex flex-col justify-between p-2 sm:p-4 select-none relative overflow-x-hidden">
      {/* Top Navbar */}
      <div className="w-full max-w-[440px] mx-auto flex items-center justify-between py-1 px-1">
        <button
          onClick={onBackToSelection}
          className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors flex items-center gap-1 text-xs font-bold cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Heroes
        </button>

        <div className="flex items-center gap-1 text-center">
          <span className="text-sm font-black tracking-wider text-amber-300">
            LODU <span className="text-white">LUDO</span>
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowRestartConfirm(true)}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-neutral-300 hover:text-white transition-colors cursor-pointer"
            title="Restart Game"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              const muted = sounds.toggleMute();
              setIsMuted(muted);
            }}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-neutral-300 hover:text-white transition-colors cursor-pointer"
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

      {/* Floating Reaction Toast Notification */}
      <ReactionMessage
        message={reaction.message}
        speakerCharacterId={reaction.speakerCharacterId}
        speakerName={reaction.speakerName}
        type={reaction.type}
      />

      {/* Main Game Arena: Top Corner Players + Board + Bottom Corner Players */}
      <div className="w-full max-w-[440px] mx-auto my-auto flex flex-col gap-2.5 sm:gap-3">
        {/* Top 2 Corner Players: Red (P0 - Top-Left) & Green (P1 - Top-Right) */}
        <div className="flex items-center justify-between px-1">
          <PlayerCornerBox
            player={players[0]}
            isActive={activePlayerId === 0}
            turnState={turnState}
            diceValue={diceValue}
            isRolling={isRolling}
            canRoll={turnState === 'WAITING_FOR_ROLL'}
            onRollDice={handleRollDice}
            position="top-left"
          />

          <PlayerCornerBox
            player={players[1]}
            isActive={activePlayerId === 1}
            turnState={turnState}
            diceValue={diceValue}
            isRolling={isRolling}
            canRoll={turnState === 'WAITING_FOR_ROLL'}
            onRollDice={handleRollDice}
            position="top-right"
          />
        </div>

        {/* Primary 15x15 Ludo Board (Hero) */}
        <div className="w-full aspect-square flex items-center justify-center">
          <LudoBoard
            players={players}
            activePlayerId={activePlayerId}
            validMoves={validMoves}
            isMoving={isMoving}
            movingTokenInfo={movingTokenInfo}
            captureFeedback={captureFeedback}
            onTokenClick={handleTokenClick}
          />
        </div>

        {/* Bottom 2 Corner Players: Blue (P3 - Bottom-Left) & Yellow (P2 - Bottom-Right) */}
        <div className="flex items-center justify-between px-1">
          <PlayerCornerBox
            player={players[3]}
            isActive={activePlayerId === 3}
            turnState={turnState}
            diceValue={diceValue}
            isRolling={isRolling}
            canRoll={turnState === 'WAITING_FOR_ROLL'}
            onRollDice={handleRollDice}
            position="bottom-left"
          />

          <PlayerCornerBox
            player={players[2]}
            isActive={activePlayerId === 2}
            turnState={turnState}
            diceValue={diceValue}
            isRolling={isRolling}
            canRoll={turnState === 'WAITING_FOR_ROLL'}
            onRollDice={handleRollDice}
            position="bottom-right"
          />
        </div>
      </div>

      {/* Winner Screen Popup */}
      {winner && (
        <WinnerScreen
          winner={winner}
          onRestart={handleRestart}
          onBackToSelection={onBackToSelection}
        />
      )}

      {/* Restart Confirmation Modal */}
      {showRestartConfirm && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-neutral-900 border border-neutral-700 rounded-2xl p-5 max-w-xs w-full shadow-2xl text-center">
            <h3 className="text-base font-bold text-white mb-2">Restart Game?</h3>
            <p className="text-xs text-neutral-400 mb-5">
              Current match progress will be reset for all 4 players.
            </p>
            <div className="flex gap-2.5">
              <button
                onClick={() => setShowRestartConfirm(false)}
                className="flex-1 py-2 px-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-semibold text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleRestart}
                className="flex-1 py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-colors cursor-pointer"
              >
                Restart
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
