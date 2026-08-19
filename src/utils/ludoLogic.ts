import { 
  BoardCoordinate, 
  MoveOption, 
  Player, 
  TokenData 
} from '../types';
import {
  BASE_TOKEN_COORDS,
  COMMON_TRACK_COORDS,
  FINAL_HOME_COORDS,
  HOME_PATHS,
  PLAYER_START_OFFSETS,
  SAFE_TRACK_INDICES,
} from './ludoConstants';

export const TOTAL_STEPS_TO_HOME = 57; // 1 (start) to 51 (pre-turn), 52-56 (home lane), 57 (final home)

/**
 * Returns the exact grid coordinate for a token based on its player, tokenId, and step.
 */
export function getCoordinateForToken(
  playerId: number,
  tokenId: number,
  step: number
): BoardCoordinate {
  // Step 0: In base slot
  if (step === 0) {
    const baseCoords = BASE_TOKEN_COORDS[playerId] || BASE_TOKEN_COORDS[0];
    return baseCoords[tokenId] || { row: 0, col: 0 };
  }

  // Step 1 to 51: On the common circular track
  if (step >= 1 && step <= 51) {
    const startOffset = PLAYER_START_OFFSETS[playerId] || 0;
    const trackIndex = (startOffset + (step - 1)) % 52;
    return COMMON_TRACK_COORDS[trackIndex];
  }

  // Step 52 to 56: In the player's colored home path
  if (step >= 52 && step <= 56) {
    const homeIndex = step - 52;
    const path = HOME_PATHS[playerId] || HOME_PATHS[0];
    return path[homeIndex];
  }

  // Step 57: In the center home triangle
  return FINAL_HOME_COORDS[playerId] || { row: 7, col: 7 };
}

/**
 * Returns the track index (0-51) if the token is on the common path, otherwise null.
 */
export function getTrackIndex(playerId: number, step: number): number | null {
  if (step >= 1 && step <= 51) {
    const startOffset = PLAYER_START_OFFSETS[playerId] || 0;
    return (startOffset + (step - 1)) % 52;
  }
  return null;
}

/**
 * Returns true if a given track index is a designated safe star square.
 */
export function isSafeSquare(trackIndex: number | null): boolean {
  if (trackIndex === null) return true; // Home path & base are always safe from cuts
  return SAFE_TRACK_INDICES.has(trackIndex);
}

/**
 * Returns all tokens currently on a specific common track index (0-51).
 */
export function getTokensAtTrack(
  allPlayers: Player[],
  trackIndex: number
): { player: Player; token: TokenData }[] {
  const result: { player: Player; token: TokenData }[] = [];
  for (const p of allPlayers) {
    for (const token of p.tokens) {
      if (token.step >= 1 && token.step <= 51) {
        const tIndex = getTrackIndex(p.id, token.step);
        if (tIndex === trackIndex) {
          result.push({ player: p, token });
        }
      }
    }
  }
  return result;
}

/**
 * Returns the count of a specific player's tokens on a common track index.
 */
export function getPlayerTokensAtTrack(
  player: Player,
  trackIndex: number
): TokenData[] {
  return player.tokens.filter((token) => {
    if (token.step >= 1 && token.step <= 51) {
      return getTrackIndex(player.id, token.step) === trackIndex;
    }
    return false;
  });
}

/**
 * Checks if an opponent has a block (2 or more same-color tokens) on a specific track index.
 */
export function isOpponentBlockAtTrack(
  allPlayers: Player[],
  currentPlayerId: number,
  trackIndex: number
): boolean {
  for (const opp of allPlayers) {
    if (opp.id === currentPlayerId || opp.hasWon || checkIfPlayerWon(opp)) continue;
    const oppTokensOnCell = getPlayerTokensAtTrack(opp, trackIndex);
    if (oppTokensOnCell.length >= 2) {
      return true;
    }
  }
  return false;
}

/**
 * Validates whether a token can traverse from `fromStep` to `toStep`.
 * Checks every intermediate step and destination for opponent blocks.
 * A block (2+ opponent tokens on the same cell) is impassable and cannot be jumped over or landed upon.
 */
export function isPathBlocked(
  player: Player,
  allPlayers: Player[],
  fromStep: number,
  toStep: number
): boolean {
  if (fromStep === 0) {
    // Releasing to step 1
    const targetTrackIndex = PLAYER_START_OFFSETS[player.id];
    return isOpponentBlockAtTrack(allPlayers, player.id, targetTrackIndex);
  }

  // Check each step along the movement path
  for (let s = fromStep + 1; s <= toStep; s++) {
    // Only common track steps (1 to 51) can contain opponent tokens/blocks
    if (s >= 1 && s <= 51) {
      const trackIndex = (PLAYER_START_OFFSETS[player.id] + (s - 1)) % 52;
      if (isOpponentBlockAtTrack(allPlayers, player.id, trackIndex)) {
        return true; // Path is blocked by an opponent stack!
      }
    }
  }

  return false;
}

/**
 * Finds if a legal cut of an opponent's single token can happen at the target track index.
 * - Must NOT be a safe square.
 * - Must be an opponent with EXACTLY 1 token on the square.
 */
export function findOpponentTokenToCut(
  allPlayers: Player[],
  currentPlayerId: number,
  targetTrackIndex: number
): { playerId: number; tokenId: number } | undefined {
  if (isSafeSquare(targetTrackIndex)) {
    return undefined; // Safe square: no cuts allowed
  }

  for (const opp of allPlayers) {
    if (opp.id === currentPlayerId || opp.hasWon || checkIfPlayerWon(opp)) continue;
    const oppTokens = getPlayerTokensAtTrack(opp, targetTrackIndex);
    // If opponent has exactly 1 token on this non-safe square, it can be captured
    if (oppTokens.length === 1) {
      return { playerId: opp.id, tokenId: oppTokens[0].id };
    }
    // If opponent has 2+ tokens, it's a block and cannot be cut
  }

  return undefined;
}

/**
 * Extracts the distinct token IDs that have legal moves available for the current dice roll.
 */
export function getDistinctLegalTokenIds(moves: MoveOption[]): number[] {
  const tokenIds = new Set<number>();
  for (const move of moves) {
    tokenIds.add(move.tokenId);
  }
  return Array.from(tokenIds);
}

/**
 * Returns all valid moves for the given player and dice roll.
 * Enforces:
 * - Base release only on 6
 * - Exact home entry (no overshooting beyond step 57)
 * - Complete path validation against opponent blocks
 * - Proper stack immunity & single-token capture
 * - Correct evaluation regardless of how many tokens (0, 1, 2, or 3) have already reached home
 */
export function getValidMoves(
  player: Player,
  allPlayers: Player[],
  diceRoll: number
): MoveOption[] {
  if (player.hasWon || checkIfPlayerWon(player)) return [];
  const moves: MoveOption[] = [];

  for (const token of player.tokens) {
    // 1. Token in base (step 0)
    if (token.step === 0) {
      if (diceRoll === 6) {
        const targetTrackIndex = PLAYER_START_OFFSETS[player.id];
        // Check if start position is blocked by an opponent stack
        if (!isOpponentBlockAtTrack(allPlayers, player.id, targetTrackIndex)) {
          const opponentCut = findOpponentTokenToCut(allPlayers, player.id, targetTrackIndex);
          moves.push({
            tokenId: token.id,
            fromStep: 0,
            toStep: 1,
            isRelease: true,
            isHomeEntry: false,
            cutsOpponentToken: opponentCut,
          });
        }
      }
      continue;
    }

    // 2. Token already in final home (step 57) - ignore finished tokens
    if (token.step === TOTAL_STEPS_TO_HOME) {
      continue;
    }

    // 3. Token on board or home stretch
    const targetStep = token.step + diceRoll;

    // Reject overshoot (must enter home on exact count)
    if (targetStep > TOTAL_STEPS_TO_HOME) {
      continue;
    }

    // Check if the entire path is unobstructed by opponent blocks
    if (isPathBlocked(player, allPlayers, token.step, targetStep)) {
      continue;
    }

    const isHomeEntry = targetStep === TOTAL_STEPS_TO_HOME;
    let opponentCut: { playerId: number; tokenId: number } | undefined;

    if (targetStep >= 1 && targetStep <= 51) {
      const targetTrackIndex = (PLAYER_START_OFFSETS[player.id] + (targetStep - 1)) % 52;
      opponentCut = findOpponentTokenToCut(allPlayers, player.id, targetTrackIndex);
    }

    moves.push({
      tokenId: token.id,
      fromStep: token.step,
      toStep: targetStep,
      isRelease: false,
      isHomeEntry,
      cutsOpponentToken: opponentCut,
    });
  }

  return moves;
}

/**
 * Generates an ordered list of BoardCoordinates for the step-by-step animation.
 */
export function generateStepAnimationPath(
  playerId: number,
  tokenId: number,
  fromStep: number,
  toStep: number
): BoardCoordinate[] {
  const path: BoardCoordinate[] = [];

  if (fromStep === 0) {
    // Releasing: base -> start
    path.push(getCoordinateForToken(playerId, tokenId, 0));
    path.push(getCoordinateForToken(playerId, tokenId, 1));
    return path;
  }

  for (let s = fromStep; s <= toStep; s++) {
    path.push(getCoordinateForToken(playerId, tokenId, s));
  }

  return path;
}

/**
 * Determines the next player's turn, skipping players who have already won.
 */
export function getNextPlayerId(
  currentPlayerId: number,
  allPlayers: Player[],
  getsExtraTurn: boolean
): number {
  if (getsExtraTurn) {
    const current = allPlayers.find((p) => p.id === currentPlayerId);
    if (current && !current.hasWon && !checkIfPlayerWon(current)) {
      return currentPlayerId;
    }
  }

  // Step clockwise 0 -> 1 -> 2 -> 3 -> 0
  for (let i = 1; i <= 4; i++) {
    const nextId = (currentPlayerId + i) % 4;
    const nextPlayer = allPlayers.find((p) => p.id === nextId);
    if (nextPlayer && !nextPlayer.hasWon && !checkIfPlayerWon(nextPlayer)) {
      return nextId;
    }
  }

  return currentPlayerId;
}

/**
 * Checks if the player has won (all 4 tokens reached home step 57).
 */
export function checkIfPlayerWon(player: Player): boolean {
  return player.tokens.every((t) => t.step === TOTAL_STEPS_TO_HOME);
}

export interface CornerSlotAssignments {
  topLeft: number;
  topRight: number;
  bottomLeft: number;
  bottomRight: number;
}

/**
 * Physical UI corner slot assignments matching the Ludo board quadrants:
 * - Top-Left: Player 0 (Red)
 * - Top-Right: Player 1 (Green)
 * - Bottom-Left: Player 3 (Blue - preferred human seat in VS AI)
 * - Bottom-Right: Player 2 (Yellow)
 */
export function getCornerSlotAssignments(): CornerSlotAssignments {
  return { topLeft: 0, topRight: 1, bottomLeft: 3, bottomRight: 2 };
}
