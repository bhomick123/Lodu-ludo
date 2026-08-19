import { AIDifficulty, MoveOption, Player, TokenData } from '../types';
import { 
  getTrackIndex, 
  isSafeSquare, 
  TOTAL_STEPS_TO_HOME 
} from './ludoLogic';
import { PLAYER_START_OFFSETS } from './ludoConstants';

/**
 * Calculates if an unsafe track position is threatened by an opponent within striking range (1-6 steps behind).
 */
export function isPositionThreatened(
  allPlayers: Player[],
  currentPlayerId: number,
  trackIndex: number | null
): { isThreatened: boolean; threatLevel: number } {
  if (trackIndex === null || isSafeSquare(trackIndex)) {
    return { isThreatened: false, threatLevel: 0 };
  }

  let threatCount = 0;

  for (const opp of allPlayers) {
    if (opp.id === currentPlayerId || opp.hasWon) continue;

    for (const token of opp.tokens) {
      if (token.step >= 1 && token.step <= 51) {
        const oppTrackIndex = getTrackIndex(opp.id, token.step);
        if (oppTrackIndex !== null) {
          // Calculate distance along clockwise 52-cell track
          const distance = (trackIndex - oppTrackIndex + 52) % 52;
          if (distance >= 1 && distance <= 6) {
            threatCount++;
          }
        }
      }
    }
  }

  return { 
    isThreatened: threatCount > 0, 
    threatLevel: threatCount 
  };
}

/**
 * Evaluates whether landing on `toStep` will form a 2+ token stack with another friendly token.
 */
export function formsFriendlyStack(player: Player, move: MoveOption): boolean {
  if (move.toStep <= 0 || move.toStep >= TOTAL_STEPS_TO_HOME) return false;
  return player.tokens.some((t) => t.id !== move.tokenId && t.step === move.toStep);
}

/**
 * Checks if the token at `fromStep` is currently in danger of being captured by an opponent.
 */
export function isTokenInDanger(
  player: Player,
  allPlayers: Player[],
  token: TokenData
): boolean {
  if (token.step < 1 || token.step > 51) return false;
  const currentTrackIndex = getTrackIndex(player.id, token.step);
  return isPositionThreatened(allPlayers, player.id, currentTrackIndex).isThreatened;
}

/**
 * Scores a move for Medium AI.
 */
export function getMediumMoveScore(
  player: Player,
  allPlayers: Player[],
  move: MoveOption
): number {
  let score = 0;

  // 1. Reaching final home is top priority
  if (move.toStep === TOTAL_STEPS_TO_HOME) {
    score += 300;
  }

  // 2. Capturing an opponent token
  if (move.cutsOpponentToken) {
    score += 150;
  }

  // 3. Entering the safe home lane (steps 52-56)
  if (move.toStep >= 52 && move.fromStep < 52) {
    score += 70;
  }

  // 4. Releasing a token from base on 6
  if (move.isRelease) {
    const activeTokens = player.tokens.filter((t) => t.step >= 1 && t.step < TOTAL_STEPS_TO_HOME).length;
    score += activeTokens === 0 ? 90 : 45;
  }

  // 5. Landing on a safe star square
  const targetTrackIndex = getTrackIndex(player.id, move.toStep);
  if (targetTrackIndex !== null && isSafeSquare(targetTrackIndex)) {
    score += 35;
  }

  // 6. Penalty for landing on an unsafe square within opponent striking range
  if (targetTrackIndex !== null && !isSafeSquare(targetTrackIndex)) {
    const threat = isPositionThreatened(allPlayers, player.id, targetTrackIndex);
    if (threat.isThreatened) {
      score -= 50 * threat.threatLevel;
    }
  }

  // 7. General forward progress
  score += move.toStep - move.fromStep;

  return score;
}

/**
 * Scores a move for Hard AI with sophisticated strategic depth.
 */
export function getHardMoveScore(
  player: Player,
  allPlayers: Player[],
  move: MoveOption
): number {
  let score = 0;

  // 1. Winning the game or securing a token home
  if (move.toStep === TOTAL_STEPS_TO_HOME) {
    score += 1000;
  }

  // 2. High-value capture
  if (move.cutsOpponentToken) {
    score += 450;
    // Extra incentive if capturing an opponent's advanced token
    const oppPlayer = allPlayers.find((p) => p.id === move.cutsOpponentToken?.playerId);
    const oppToken = oppPlayer?.tokens.find((t) => t.id === move.cutsOpponentToken?.tokenId);
    if (oppToken && oppToken.step > 20) {
      score += oppToken.step * 3;
    }
  }

  // 3. Escaping existing danger
  const currentToken = player.tokens.find((t) => t.id === move.tokenId);
  if (currentToken && isTokenInDanger(player, allPlayers, currentToken)) {
    score += 160;
  }

  // 4. Entering the home stretch (immune to captures)
  if (move.toStep >= 52 && move.fromStep < 52) {
    score += 180;
  }

  // 5. Releasing from base
  if (move.isRelease) {
    const activeTokens = player.tokens.filter((t) => t.step >= 1 && t.step < TOTAL_STEPS_TO_HOME).length;
    if (activeTokens === 0) {
      score += 200; // Must release first token!
    } else if (activeTokens === 1) {
      score += 110;
    } else {
      score += 60;
    }
  }

  // 6. Forming a protective 2-token stack/block
  if (formsFriendlyStack(player, move)) {
    score += 85;
  }

  // 7. Landing on a safe star square
  const targetTrackIndex = getTrackIndex(player.id, move.toStep);
  if (targetTrackIndex !== null && isSafeSquare(targetTrackIndex)) {
    score += 120;
  }

  // 8. Heavy penalty for moving into danger
  if (targetTrackIndex !== null && !isSafeSquare(targetTrackIndex)) {
    const threat = isPositionThreatened(allPlayers, player.id, targetTrackIndex);
    if (threat.isThreatened) {
      score -= (180 + move.toStep * 2) * threat.threatLevel;
    }
  }

  // 9. Reward advancing further along the board
  score += Math.round(move.toStep * 1.5);

  return score;
}

/**
 * Easy AI Decision:
 * Selects randomly from legal options, occasionally taking an obvious capture/win.
 */
export function chooseEasyMove(validMoves: MoveOption[]): MoveOption {
  if (validMoves.length === 1) return validMoves[0];

  // 30% chance to pick an obvious winning or capture move if one exists
  const specialMove = validMoves.find((m) => m.toStep === TOTAL_STEPS_TO_HOME || Boolean(m.cutsOpponentToken));
  if (specialMove && Math.random() < 0.35) {
    return specialMove;
  }

  // Otherwise, select completely randomly among legal moves
  const randomIndex = Math.floor(Math.random() * validMoves.length);
  return validMoves[randomIndex];
}

/**
 * Medium AI Decision:
 * Scores all valid moves, adds controlled noise, and picks the highest scoring move.
 */
export function chooseMediumMove(
  player: Player,
  allPlayers: Player[],
  validMoves: MoveOption[]
): MoveOption {
  if (validMoves.length === 1) return validMoves[0];

  const scoredMoves = validMoves.map((move) => {
    const baseScore = getMediumMoveScore(player, allPlayers, move);
    // Add small random jitter (±15) to prevent mechanical predictability
    const jitter = (Math.random() - 0.5) * 30;
    return { move, score: baseScore + jitter };
  });

  scoredMoves.sort((a, b) => b.score - a.score);
  return scoredMoves[0].move;
}

/**
 * Hard AI Decision:
 * Performs deep strategic evaluation and selects the optimal move with high precision.
 */
export function chooseHardMove(
  player: Player,
  allPlayers: Player[],
  validMoves: MoveOption[]
): MoveOption {
  if (validMoves.length === 1) return validMoves[0];

  const scoredMoves = validMoves.map((move) => {
    const baseScore = getHardMoveScore(player, allPlayers, move);
    // Minimal random jitter (±5) for tie-breaking
    const jitter = (Math.random() - 0.5) * 10;
    return { move, score: baseScore + jitter };
  });

  scoredMoves.sort((a, b) => b.score - a.score);
  return scoredMoves[0].move;
}

/**
 * Central entry point for AI token decision making.
 * Receives the authoritative game state and legal moves, and returns the chosen MoveOption.
 */
export function chooseAIMove(
  player: Player,
  allPlayers: Player[],
  diceRoll: number,
  validMoves: MoveOption[],
  difficulty: AIDifficulty = 'medium'
): MoveOption | null {
  if (!validMoves || validMoves.length === 0) {
    return null;
  }

  if (validMoves.length === 1) {
    return validMoves[0];
  }

  switch (difficulty) {
    case 'easy':
      return chooseEasyMove(validMoves);
    case 'hard':
      return chooseHardMove(player, allPlayers, validMoves);
    case 'medium':
    default:
      return chooseMediumMove(player, allPlayers, validMoves);
  }
}
