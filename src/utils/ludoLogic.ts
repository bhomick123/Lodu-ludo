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
 * Returns all valid moves for the given player and dice roll.
 */
export function getValidMoves(
  player: Player,
  allPlayers: Player[],
  diceRoll: number
): MoveOption[] {
  if (player.hasWon) return [];
  const moves: MoveOption[] = [];

  for (const token of player.tokens) {
    // 1. Token in base
    if (token.step === 0) {
      if (diceRoll === 6) {
        // Can release token to step 1
        const targetTrackIndex = PLAYER_START_OFFSETS[player.id];
        // Check if releasing cuts an opponent (on start square it is safe, so cuts won't happen on safe square)
        const opponentCut = !isSafeSquare(targetTrackIndex)
          ? findOpponentTokenAtTrack(allPlayers, player.id, targetTrackIndex)
          : undefined;

        moves.push({
          tokenId: token.id,
          fromStep: 0,
          toStep: 1,
          isRelease: true,
          isHomeEntry: false,
          cutsOpponentToken: opponentCut,
        });
      }
      continue;
    }

    // 2. Token already at final home
    if (token.step === TOTAL_STEPS_TO_HOME) {
      continue;
    }

    // 3. Token on board or home stretch
    const targetStep = token.step + diceRoll;
    if (targetStep <= TOTAL_STEPS_TO_HOME) {
      const isHomeEntry = targetStep === TOTAL_STEPS_TO_HOME;
      let opponentCut: { playerId: number; tokenId: number } | undefined;

      if (targetStep >= 1 && targetStep <= 51) {
        const targetTrackIndex = (PLAYER_START_OFFSETS[player.id] + (targetStep - 1)) % 52;
        if (!isSafeSquare(targetTrackIndex)) {
          opponentCut = findOpponentTokenAtTrack(allPlayers, player.id, targetTrackIndex);
        }
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
  }

  return moves;
}

/**
 * Finds if any opponent's token is currently on the specified common track index.
 */
export function findOpponentTokenAtTrack(
  allPlayers: Player[],
  currentPlayerId: number,
  targetTrackIndex: number
): { playerId: number; tokenId: number } | undefined {
  for (const opp of allPlayers) {
    if (opp.id === currentPlayerId || opp.hasWon) continue;
    for (const token of opp.tokens) {
      if (token.step >= 1 && token.step <= 51) {
        const oppTrackIndex = getTrackIndex(opp.id, token.step);
        if (oppTrackIndex === targetTrackIndex) {
          return { playerId: opp.id, tokenId: token.id };
        }
      }
    }
  }
  return undefined;
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
    // Current player keeps turn if they haven't won
    const current = allPlayers.find((p) => p.id === currentPlayerId);
    if (current && !current.hasWon) {
      return currentPlayerId;
    }
  }

  // Find next active player in clockwise order 0 -> 1 -> 2 -> 3 -> 0
  for (let i = 1; i <= 4; i++) {
    const nextId = (currentPlayerId + i) % 4;
    const nextPlayer = allPlayers.find((p) => p.id === nextId);
    if (nextPlayer && !nextPlayer.hasWon) {
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
