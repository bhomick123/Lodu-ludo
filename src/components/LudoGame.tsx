import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  AIDifficulty,
  BoardCoordinate,
  CaptureFeedback,
  CharacterId, 
  GamePhase, 
  MoveOption, 
  Player, 
  PlayerColor, 
  PlayerType,
  TokenData, 
  TurnState,
} from '../types';
import { LudoBoard } from './LudoBoard';
import { PlayerCornerBox } from './PlayerCornerBox';
import { WinnerScreen } from './WinnerScreen';
import { AudioSettingsModal } from './AudioSettingsModal';
import { CHARACTERS } from '../data/characters';
import { 
  checkIfPlayerWon, 
  generateStepAnimationPath, 
  getNextPlayerId, 
  getValidMoves,
  getDistinctLegalTokenIds,
  getCornerSlotAssignments,
  TOTAL_STEPS_TO_HOME
} from '../utils/ludoLogic';
import { chooseAIMove } from '../utils/ludoAI';
import { sounds } from '../utils/audio';
import { RotateCcw, Volume2, VolumeX, ArrowLeft, Sliders } from 'lucide-react';

interface LudoGameProps {
  characterAssignments: Record<number, CharacterId>;
  playerTypes?: Record<number, PlayerType>;
  playerNames?: Record<number, string>;
  activePlayerIndices?: number[];
  aiDifficulty?: AIDifficulty;
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
  playerTypes = { 0: 'human', 1: 'ai', 2: 'ai', 3: 'ai' } as Record<number, PlayerType>,
  playerNames = {} as Record<number, string>,
  activePlayerIndices = [0, 1, 2, 3],
  aiDifficulty = 'medium' as AIDifficulty,
  onBackToSelection,
  onGoHome,
}) => {
  // Initialize 4 players with full token states and AI configurations
  const initializePlayers = (): Player[] => {
    return [0, 1, 2, 3].map((idx) => {
      const isActiveSlot = activePlayerIndices.includes(idx);
      const charId = characterAssignments[idx] || 'modi';
      const char = CHARACTERS[charId];
      const pType: PlayerType = playerTypes[idx] || 'human';
      const customName = playerNames[idx]?.trim();
      const pName =
        customName && customName.length > 0
          ? customName
          : pType === 'ai'
          ? `${char.shortName} (AI)`
          : `Player ${idx + 1}`;

      const player: Player = {
        id: idx,
        color: PLAYER_COLORS[idx],
        characterId: charId,
        name: pName,
        isAI: pType === 'ai',
        playerType: pType,
        difficulty: aiDifficulty,
        tokens: [0, 1, 2, 3].map((tId) => ({
          id: tId,
          playerId: idx,
          step: isActiveSlot ? 0 : 57, // Inactive player tokens placed in home so they never appear on the board
          isHome: !isActiveSlot,
        })),
        hasWon: !isActiveSlot, // Inactive slots start hasWon = true so getNextPlayerId skips them automatically
      };
      return player;
    });
  };

  const [players, setPlayers] = useState<Player[]>(initializePlayers);
  const [activePlayerId, setActivePlayerId] = useState<number>(activePlayerIndices[0] ?? 0);
  const [turnState, setTurnState] = useState<TurnState>('WAITING_FOR_ROLL');
  const [diceValue, setDiceValue] = useState<number | null>(null);
  const [isRolling, setIsRolling] = useState<boolean>(false);
  const [validMoves, setValidMoves] = useState<MoveOption[]>([]);
  const [isMoving, setIsMoving] = useState<boolean>(false);
  
  // Centralized Session & Lifecycle Management Refs
  const gameSessionIdRef = useRef<number>(1);
  const trackedTimeoutsRef = useRef<Set<NodeJS.Timeout>>(new Set());
  const isMovingRef = useRef<boolean>(false);
  const autoMoveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const aiDecisionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const aiRollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const rollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const turnEndingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const advanceTurnTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Synchronous State Mirror Refs - ALWAYS kept immediately up to date
  const playersRef = useRef<Player[]>(players);
  playersRef.current = players;
  const activePlayerIdRef = useRef<number>(activePlayerId);
  activePlayerIdRef.current = activePlayerId;
  const turnStateRef = useRef<TurnState>(turnState);
  turnStateRef.current = turnState;
  const diceValueRef = useRef<number | null>(diceValue);
  diceValueRef.current = diceValue;
  const validMovesRef = useRef<MoveOption[]>([]);
  const consecutiveSixesRef = useRef<number>(0);

  const [movingTokenInfo, setMovingTokenInfo] = useState<{
    playerId: number;
    tokenId: number;
    currentCoord: BoardCoordinate;
  } | null>(null);

  const [captureFeedback, setCaptureFeedback] = useState<CaptureFeedback | null>(null);
  const [winner, setWinner] = useState<Player | null>(null);
  const [consecutiveSixes, setConsecutiveSixes] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(sounds.getMuted());
  const [showRestartConfirm, setShowRestartConfirm] = useState<boolean>(false);
  const [showAudioSettings, setShowAudioSettings] = useState<boolean>(false);

  // Helper to update turnState and its synchronous ref atomically
  const updateTurnState = useCallback((nextState: TurnState) => {
    turnStateRef.current = nextState;
    setTurnState(nextState);
  }, []);

  // Helper to update activePlayerId and its synchronous ref atomically
  const updateActivePlayerId = useCallback((nextId: number) => {
    activePlayerIdRef.current = nextId;
    setActivePlayerId(nextId);
  }, []);

  // Helper to update players and its synchronous ref atomically
  const updatePlayers = useCallback((nextPlayers: Player[]) => {
    playersRef.current = nextPlayers;
    setPlayers(nextPlayers);
  }, []);

  // Helper to update validMoves and its synchronous ref atomically
  const updateValidMoves = useCallback((moves: MoveOption[]) => {
    validMovesRef.current = moves;
    setValidMoves(moves);
  }, []);

  // Comprehensive turn timeout clearer to prevent any stale asynchronous executions
  const clearAllPendingTurnTimeouts = useCallback(() => {
    if (autoMoveTimeoutRef.current) {
      clearTimeout(autoMoveTimeoutRef.current);
      autoMoveTimeoutRef.current = null;
    }
    if (aiDecisionTimeoutRef.current) {
      clearTimeout(aiDecisionTimeoutRef.current);
      aiDecisionTimeoutRef.current = null;
    }
    if (aiRollTimeoutRef.current) {
      clearTimeout(aiRollTimeoutRef.current);
      aiRollTimeoutRef.current = null;
    }
    if (rollTimeoutRef.current) {
      clearTimeout(rollTimeoutRef.current);
      rollTimeoutRef.current = null;
    }
    if (turnEndingTimeoutRef.current) {
      clearTimeout(turnEndingTimeoutRef.current);
      turnEndingTimeoutRef.current = null;
    }
    if (advanceTurnTimeoutRef.current) {
      clearTimeout(advanceTurnTimeoutRef.current);
      advanceTurnTimeoutRef.current = null;
    }
  }, []);

  // Start subtle background music on mount / first user interaction
  useEffect(() => {
    sounds.startMusic();
  }, []);

  /**
   * Centralized timeout scheduler that binds every timeout to the active game session.
   * If the session is invalidated (e.g. on restart, match change, or unmount), the callback is silently dropped.
   */
  const scheduleSessionTimeout = useCallback((callback: () => void, delayMs: number): NodeJS.Timeout => {
    const sessionId = gameSessionIdRef.current;
    let timerId: NodeJS.Timeout;
    timerId = setTimeout(() => {
      trackedTimeoutsRef.current.delete(timerId);
      if (gameSessionIdRef.current !== sessionId) {
        return; // Session was invalidated - abort execution!
      }
      callback();
    }, delayMs);
    trackedTimeoutsRef.current.add(timerId);
    return timerId;
  }, []);

  /**
   * Cancels all pending asynchronous tasks and increments the session ID.
   */
  const cancelCurrentGameSession = useCallback(() => {
    gameSessionIdRef.current += 1;
    clearAllPendingTurnTimeouts();
    trackedTimeoutsRef.current.forEach((timer) => clearTimeout(timer));
    trackedTimeoutsRef.current.clear();
    isMovingRef.current = false;
  }, [clearAllPendingTurnTimeouts]);

  // Step-by-step smooth movement animation with synchronous capture handling
  const executeMove = async (move: MoveOption, rollValue?: number) => {
    if (isMovingRef.current) return;
    const movementSession = gameSessionIdRef.current;
    isMovingRef.current = true;

    clearAllPendingTurnTimeouts();

    setIsMoving(true);
    updateTurnState('MOVING_TOKEN');
    updateValidMoves([]); // Clear highlights while moving

    try {
      const pathCoords = generateStepAnimationPath(
        activePlayerIdRef.current,
        move.tokenId,
        move.fromStep,
        move.toStep
      );

      // Animate along each coordinate with session guards
      for (let i = 0; i < pathCoords.length; i++) {
        if (gameSessionIdRef.current !== movementSession) {
          return;
        }

        setMovingTokenInfo({
          playerId: activePlayerIdRef.current,
          tokenId: move.tokenId,
          currentCoord: pathCoords[i],
        });

        if (i > 0) {
          sounds.playTokenStep();
        }

        // Small delay between hops for smooth animation
        await new Promise((resolve) => setTimeout(resolve, 140));

        if (gameSessionIdRef.current !== movementSession) {
          return;
        }
      }

      // Step animation completed: evaluate capture, home entry, and extra turn synchronously
      const didCutOpponent = Boolean(move.cutsOpponentToken);
      const didReachHome = move.toStep === TOTAL_STEPS_TO_HOME;
      const enteredHomeLane = move.fromStep < 52 && move.toStep >= 52 && !didReachHome;
      const actualRoll = rollValue ?? diceValueRef.current;
      const rolledSix = actualRoll === 6;

      // If a capture occurred, trigger the rich capture impact & knockback sequence
      if (didCutOpponent && move.cutsOpponentToken) {
        const oppPlayer = playersRef.current.find((p) => p.id === move.cutsOpponentToken!.playerId);
        const destinationCoord = pathCoords[pathCoords.length - 1];

        if (oppPlayer) {
          setCaptureFeedback({
            coord: destinationCoord,
            attackerPlayerId: activePlayerIdRef.current,
            capturedPlayerId: oppPlayer.id,
            capturedTokenId: move.cutsOpponentToken.tokenId,
            capturedCharacterId: oppPlayer.characterId,
            capturedPlayerColor: oppPlayer.color,
          });

          sounds.playTokenCut();

          // Allow satisfying 450ms visual capture feedback sequence to finish
          await new Promise((resolve) => setTimeout(resolve, 450));

          if (gameSessionIdRef.current !== movementSession) {
            return;
          }

          setCaptureFeedback(null);
        }
      } else if (didReachHome) {
        sounds.playHomeArrival();
      } else if (enteredHomeLane) {
        sounds.playHomeLaneEntry();
      } else if (move.isRelease) {
        sounds.playTokenRelease();
      }

      if (gameSessionIdRef.current !== movementSession) {
        return;
      }

      // Build fully consistent authoritative player and winner state
      let winningPlayer: Player | null = null;

      const updatedPlayers = playersRef.current.map((p) => {
        if (p.id === activePlayerIdRef.current) {
          const updatedTokens = p.tokens.map((t) =>
            t.id === move.tokenId
              ? { ...t, step: move.toStep, isHome: move.toStep === TOTAL_STEPS_TO_HOME }
              : t
          );
          const allHome = updatedTokens.every((t) => t.step === TOTAL_STEPS_TO_HOME);
          const updatedP: Player = {
            ...p,
            tokens: updatedTokens,
            hasWon: allHome,
          };

          if (allHome) {
            winningPlayer = updatedP;
          }
          return updatedP;
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

      updatePlayers(updatedPlayers);
      setMovingTokenInfo(null);

      // If player won with this move, display winner screen with consistent player state
      if (winningPlayer) {
        setWinner(winningPlayer);
        return;
      }

      // Authoritative extra turn calculation
      const getsExtraTurn = shouldGrantExtraTurn({
        rolledSix,
        capturedOpponent: didCutOpponent,
        reachedHome: didReachHome,
      });

      advanceTurnTimeoutRef.current = scheduleSessionTimeout(() => {
        advanceTurn(getsExtraTurn);
      }, getsExtraTurn ? 400 : 350);
    } finally {
      // Guaranteed lock reset
      isMovingRef.current = false;
      setIsMoving(false);
    }
  };

  // Authoritative turn transition
  const advanceTurn = (extraTurn: boolean) => {
    clearAllPendingTurnTimeouts();

    if (!extraTurn) {
      consecutiveSixesRef.current = 0;
      setConsecutiveSixes(0);
      sounds.playTurnChange();
    }

    const currentPlayers = playersRef.current;
    const nextId = getNextPlayerId(activePlayerIdRef.current, currentPlayers, extraTurn);
    updateActivePlayerId(nextId);
    diceValueRef.current = null;
    setDiceValue(null);
    updateValidMoves([]);
    updateTurnState('WAITING_FOR_ROLL');
  };

  // Handle dice rolling for both human and AI
  const handleRollDice = () => {
    if (turnStateRef.current !== 'WAITING_FOR_ROLL' || isRolling || isMovingRef.current) return;

    // Ensure music is playing on user interaction
    sounds.startMusic();

    clearAllPendingTurnTimeouts();

    setIsRolling(true);
    updateTurnState('ROLLING');
    sounds.playDiceRoll();

    // Roll random number 1-6 using authoritative single dice pipeline
    const roll = Math.floor(Math.random() * 6) + 1;
    const currentSession = gameSessionIdRef.current;

    rollTimeoutRef.current = scheduleSessionTimeout(() => {
      if (gameSessionIdRef.current !== currentSession) return;

      setIsRolling(false);
      diceValueRef.current = roll;
      setDiceValue(roll);

      const currentPlayers = playersRef.current;
      const currentActive = currentPlayers[activePlayerIdRef.current] || currentPlayers[0];

      if (roll === 6) {
        const nextSixes = consecutiveSixesRef.current + 1;
        if (nextSixes >= 3) {
          // Three consecutive 6s penalty: turn forfeited!
          consecutiveSixesRef.current = 0;
          setConsecutiveSixes(0);
          updateTurnState('TURN_ENDING');
          turnEndingTimeoutRef.current = scheduleSessionTimeout(() => {
            advanceTurn(false);
          }, 1000);
          return;
        }
        consecutiveSixesRef.current = nextSixes;
        setConsecutiveSixes(nextSixes);
      } else {
        consecutiveSixesRef.current = 0;
        setConsecutiveSixes(0);
      }

      // Calculate fresh legal moves for current player and dice roll
      const moves = getValidMoves(currentActive, currentPlayers, roll);
      const distinctLegalTokenIds = getDistinctLegalTokenIds(moves);
      const legalTokenCount = distinctLegalTokenIds.length;

      updateValidMoves(moves);

      if (legalTokenCount === 0) {
        // 0 valid moves -> pass turn (or if 6 was rolled with 0 moves, grant extra roll per standard rule)
        const getsExtraRollOnSix = roll === 6 && consecutiveSixesRef.current < 3;
        updateTurnState('TURN_ENDING');
        turnEndingTimeoutRef.current = scheduleSessionTimeout(() => {
          advanceTurn(getsExtraRollOnSix);
        }, 1000);
      } else if (legalTokenCount === 1) {
        // EXACTLY 1 distinct legal token -> Snapshot parameters and automatic move after a brief delay
        const targetTokenId = distinctLegalTokenIds[0];
        const snapshotPlayerId = currentActive.id;
        const snapshotRoll = roll;

        updateTurnState('WAITING_FOR_TOKEN_SELECTION');
        
        autoMoveTimeoutRef.current = scheduleSessionTimeout(() => {
          // Strict 7-point safety requirement guard:
          // 1. Same game session
          // 2. Same active player
          // 3. Same turn state (WAITING_FOR_TOKEN_SELECTION)
          // 4. No movement currently in progress
          // 5. Current authoritative roll is still the expected roll
          // 6. Freshly recalculated legal moves still contain exactly ONE distinct legal token ID
          // 7. That token ID is the same token originally scheduled for auto-move
          if (
            gameSessionIdRef.current !== currentSession ||
            activePlayerIdRef.current !== snapshotPlayerId ||
            turnStateRef.current !== 'WAITING_FOR_TOKEN_SELECTION' ||
            isMovingRef.current ||
            diceValueRef.current !== snapshotRoll
          ) {
            // Abort delayed automatic move
            return;
          }

          const latestPlayers = playersRef.current;
          const latestActive = latestPlayers[snapshotPlayerId];
          if (!latestActive) return;

          const freshMoves = getValidMoves(latestActive, latestPlayers, snapshotRoll);
          const freshTokenIds = getDistinctLegalTokenIds(freshMoves);

          if (freshTokenIds.length === 1 && freshTokenIds[0] === targetTokenId) {
            const freshMove = freshMoves.find((m) => m.tokenId === targetTokenId);
            if (freshMove) {
              executeMove(freshMove, snapshotRoll);
            }
          }
        }, 350);
      } else {
        // 2 or more distinct legal tokens -> Human MUST choose manually, NEVER auto-move
        updateTurnState('WAITING_FOR_TOKEN_SELECTION');

        // If the active player is an AI, schedule human-like thinking delay and make smart decision
        if (currentActive.isAI) {
          const snapshotPlayerId = currentActive.id;
          const snapshotRoll = roll;
          const snapshotDifficulty = currentActive.difficulty || aiDifficulty;

          aiDecisionTimeoutRef.current = scheduleSessionTimeout(() => {
            if (
              gameSessionIdRef.current === currentSession &&
              activePlayerIdRef.current === snapshotPlayerId &&
              turnStateRef.current === 'WAITING_FOR_TOKEN_SELECTION' &&
              !isMovingRef.current &&
              diceValueRef.current === snapshotRoll
            ) {
              const latestPlayers = playersRef.current;
              const latestActive = latestPlayers[snapshotPlayerId];
              if (!latestActive) return;

              const freshMoves = getValidMoves(latestActive, latestPlayers, snapshotRoll);

              if (freshMoves.length > 0) {
                const chosenMove = chooseAIMove(
                  latestActive,
                  latestPlayers,
                  snapshotRoll,
                  freshMoves,
                  snapshotDifficulty
                );

                if (chosenMove) {
                  executeMove(chosenMove, snapshotRoll);
                }
              }
            }
          }, 600);
        }
      }
    }, 650);
  };

  // AI Turn Orchestrator: automatically triggers AI dice roll when waiting for roll
  useEffect(() => {
    const currentActive = playersRef.current[activePlayerId];
    if (
      currentActive &&
      currentActive.isAI &&
      turnState === 'WAITING_FOR_ROLL' &&
      !isRolling &&
      !isMoving
    ) {
      const currentSession = gameSessionIdRef.current;
      const targetPlayerId = activePlayerId;

      if (aiRollTimeoutRef.current) {
        clearTimeout(aiRollTimeoutRef.current);
      }

      aiRollTimeoutRef.current = scheduleSessionTimeout(() => {
        if (
          gameSessionIdRef.current === currentSession &&
          activePlayerIdRef.current === targetPlayerId &&
          turnStateRef.current === 'WAITING_FOR_ROLL' &&
          !isMovingRef.current
        ) {
          handleRollDice();
        }
      }, 700);
    }
  }, [activePlayerId, turnState, isRolling, isMoving, scheduleSessionTimeout]);

  // Handle player clicking a token to move
  const handleTokenClick = (tokenId: number) => {
    const currentActive = playersRef.current[activePlayerIdRef.current];
    // If active player is AI, prevent manual token interference
    if (currentActive && currentActive.isAI) return;

    if (turnStateRef.current !== 'WAITING_FOR_TOKEN_SELECTION' || isMovingRef.current) return;

    // Manual click always cancels any pending auto-move / turn timers
    clearAllPendingTurnTimeouts();

    const currentRoll = diceValueRef.current;
    if (currentRoll === null) return;

    // Find move from validMovesRef or recalculate freshly to ensure no stale closure
    const availableMoves = validMovesRef.current.length > 0 
      ? validMovesRef.current 
      : getValidMoves(currentActive, playersRef.current, currentRoll);

    const chosenMove = availableMoves.find((m) => m.tokenId === tokenId);
    if (!chosenMove) return;

    executeMove(chosenMove, currentRoll);
  };

  // Restart game with current characters and player types
  const handleRestart = () => {
    sounds.playButton();
    cancelCurrentGameSession();
    const freshPlayers = initializePlayers();
    updatePlayers(freshPlayers);
    updateActivePlayerId(activePlayerIndices[0] ?? 0);
    consecutiveSixesRef.current = 0;
    setConsecutiveSixes(0);
    updateTurnState('WAITING_FOR_ROLL');
    diceValueRef.current = null;
    setDiceValue(null);
    updateValidMoves([]);
    setIsMoving(false);
    isMovingRef.current = false;
    setMovingTokenInfo(null);
    setCaptureFeedback(null);
    setWinner(null);
    setShowRestartConfirm(false);
  };

  const handleBackToSelection = () => {
    sounds.playButton();
    cancelCurrentGameSession();
    onBackToSelection();
  };

  const handleGoHome = () => {
    sounds.playButton();
    cancelCurrentGameSession();
    onGoHome();
  };

  // Cleanup pending timeouts and invalidate session on unmount
  useEffect(() => {
    return () => {
      cancelCurrentGameSession();
    };
  }, [cancelCurrentGameSession]);

  // Compute corner slot assignments matching board quadrants (Top-Left: 0, Top-Right: 1, Bottom-Left: 3, Bottom-Right: 2)
  const cornerSlotAssignments = getCornerSlotAssignments();

  return (
    <div className="min-h-screen w-full bg-[#140824] text-white flex flex-col justify-between p-2 sm:p-4 select-none relative overflow-x-hidden">
      {/* Top Navbar */}
      <div className="w-full max-w-[440px] mx-auto flex items-center justify-between py-1.5 px-1">
        <button
          onClick={handleBackToSelection}
          className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors flex items-center gap-1 text-xs font-bold cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Setup
        </button>

        <div className="flex items-center gap-1 text-center">
          <span className="text-sm font-black tracking-wider text-amber-300">
            LUCKY <span className="text-white">LUDO</span>
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => {
              sounds.playButton();
              setShowAudioSettings(true);
            }}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-neutral-300 hover:text-white transition-colors cursor-pointer"
            title="Audio Controls"
          >
            <Sliders className="w-4 h-4 text-amber-400" />
          </button>

          <button
            onClick={() => {
              const muted = sounds.toggleMute();
              setIsMuted(muted);
            }}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-neutral-300 hover:text-white transition-colors cursor-pointer"
            title={isMuted ? 'Unmute audio' : 'Quick Mute'}
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4 text-rose-400" />
            ) : (
              <Volume2 className="w-4 h-4 text-emerald-400" />
            )}
          </button>

          <button
            onClick={() => {
              sounds.playButton();
              setShowRestartConfirm(true);
            }}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-neutral-300 hover:text-white transition-colors cursor-pointer"
            title="Restart Game"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Game Arena: Top Corner Players + Board + Bottom Corner Players */}
      <div className="w-full max-w-[440px] mx-auto my-auto flex flex-col gap-2.5 sm:gap-3">
        {/* Top 2 Corner Players */}
        <div className="flex items-center justify-between px-1">
          <PlayerCornerBox
            player={players[cornerSlotAssignments.topLeft]}
            isActive={activePlayerId === cornerSlotAssignments.topLeft}
            isInactiveSlot={!activePlayerIndices.includes(cornerSlotAssignments.topLeft)}
            turnState={turnState}
            diceValue={diceValue}
            isRolling={isRolling}
            canRoll={turnState === 'WAITING_FOR_ROLL'}
            onRollDice={handleRollDice}
            position="top-left"
          />

          <PlayerCornerBox
            player={players[cornerSlotAssignments.topRight]}
            isActive={activePlayerId === cornerSlotAssignments.topRight}
            isInactiveSlot={!activePlayerIndices.includes(cornerSlotAssignments.topRight)}
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
            activePlayerIndices={activePlayerIndices}
            validMoves={validMoves}
            isMoving={isMoving}
            movingTokenInfo={movingTokenInfo}
            captureFeedback={captureFeedback}
            onTokenClick={handleTokenClick}
          />
        </div>

        {/* Bottom 2 Corner Players */}
        <div className="flex items-center justify-between px-1">
          <PlayerCornerBox
            player={players[cornerSlotAssignments.bottomLeft]}
            isActive={activePlayerId === cornerSlotAssignments.bottomLeft}
            isInactiveSlot={!activePlayerIndices.includes(cornerSlotAssignments.bottomLeft)}
            turnState={turnState}
            diceValue={diceValue}
            isRolling={isRolling}
            canRoll={turnState === 'WAITING_FOR_ROLL'}
            onRollDice={handleRollDice}
            position="bottom-left"
          />

          <PlayerCornerBox
            player={players[cornerSlotAssignments.bottomRight]}
            isActive={activePlayerId === cornerSlotAssignments.bottomRight}
            isInactiveSlot={!activePlayerIndices.includes(cornerSlotAssignments.bottomRight)}
            turnState={turnState}
            diceValue={diceValue}
            isRolling={isRolling}
            canRoll={turnState === 'WAITING_FOR_ROLL'}
            onRollDice={handleRollDice}
            position="bottom-right"
          />
        </div>
      </div>

      {/* Winner Screen Popup with Confetti Celebration */}
      {winner && (
        <WinnerScreen
          winner={winner}
          onPlayAgain={handleRestart}
          onChangeCharacters={handleBackToSelection}
          onGoHome={handleGoHome}
        />
      )}

      {/* Audio Settings Popover Modal */}
      <AudioSettingsModal
        isOpen={showAudioSettings}
        onClose={() => setShowAudioSettings(false)}
      />

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
                onClick={() => {
                  sounds.playButton();
                  setShowRestartConfirm(false);
                }}
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
