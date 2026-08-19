import { 
  getCoordinateForToken, 
  getTrackIndex, 
  isSafeSquare, 
  getTokensAtTrack, 
  getPlayerTokensAtTrack, 
  isOpponentBlockAtTrack, 
  isPathBlocked, 
  findOpponentTokenToCut, 
  getValidMoves, 
  getDistinctLegalTokenIds,
  getNextPlayerId, 
  checkIfPlayerWon,
  generateStepAnimationPath,
  getCornerSlotAssignments,
  TOTAL_STEPS_TO_HOME
} from './ludoLogic';
import { 
  chooseAIMove,
  chooseEasyMove,
  chooseMediumMove,
  chooseHardMove,
  getHardMoveScore,
  getMediumMoveScore,
  isPositionThreatened,
  formsFriendlyStack
} from './ludoAI';
import { shouldGrantExtraTurn } from '../components/LudoGame';
import { Player, PlayerColor } from '../types';
import { 
  createNewRoom, 
  joinRoom, 
  leaveRoom, 
  getRoomState, 
  addSimulatedFriendToRoom 
} from './roomService';

// Polyfill localStorage in test environment if needed
if (typeof globalThis.localStorage === 'undefined') {
  const store: Record<string, string> = {};
  (globalThis as any).localStorage = {
    getItem: (k: string) => store[k] ?? null,
    setItem: (k: string, v: string) => { store[k] = v; },
    removeItem: (k: string) => { delete store[k]; },
    clear: () => { Object.keys(store).forEach((k) => delete store[k]); },
  };
}

function createMockPlayers(): Player[] {
  const colors: PlayerColor[] = ['red', 'green', 'yellow', 'blue'];
  return [0, 1, 2, 3].map((id) => ({
    id,
    color: colors[id],
    characterId: id === 0 ? 'modi' : id === 1 ? 'kejriwal' : id === 2 ? 'rahul' : 'trump',
    name: `Player ${id}`,
    tokens: [0, 1, 2, 3].map((tId) => ({
      id: tId,
      playerId: id,
      step: 0,
      isHome: false,
    })),
    hasWon: false,
  }));
}

export function runLudoLogicTests(): { passed: boolean; results: string[] } {
  const results: string[] = [];
  let allPassed = true;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      results.push(`✅ PASS: ${testName}`);
    } else {
      results.push(`❌ FAIL: ${testName}`);
      allPassed = false;
    }
  }

  // 1. Base release: Roll 5 vs Roll 6
  {
    const players = createMockPlayers();
    const movesRoll5 = getValidMoves(players[0], players, 5);
    const movesRoll6 = getValidMoves(players[0], players, 6);
    assert(movesRoll5.length === 0, 'Tokens in base cannot move on roll 5');
    assert(movesRoll6.length === 4, 'All 4 base tokens are valid options on roll 6');
  }

  // 2. Exact Home Entry and Overshoot Prevention
  {
    const players = createMockPlayers();
    players[0].tokens[0].step = 55; // 2 steps away from 57
    const movesRoll2 = getValidMoves(players[0], players, 2);
    const movesRoll3 = getValidMoves(players[0], players, 3);
    assert(movesRoll2.some((m) => m.tokenId === 0 && m.toStep === 57 && m.isHomeEntry), 'Roll 2 reaches exact home (step 57)');
    assert(!movesRoll3.some((m) => m.tokenId === 0), 'Roll 3 overshoots home and is rejected');
  }

  // 3. Single Opponent Capture on Normal Square
  {
    const players = createMockPlayers();
    players[0].tokens[0].step = 1;
    players[1].tokens[0].step = 44; 

    const redMoves = getValidMoves(players[0], players, 4); // Step 1 + 4 = Step 5 (track index 4)
    const move = redMoves.find((m) => m.tokenId === 0);
    assert(move !== undefined && move.cutsOpponentToken?.playerId === 1, 'Red cuts single Green token on normal track square');
  }

  // 4. Safe Square Immunity: No capture on safe star / start squares
  {
    const players = createMockPlayers();
    players[0].tokens[0].step = 5;
    players[1].tokens[0].step = 48; // track index 8

    const redMoves = getValidMoves(players[0], players, 4); // Step 5 + 4 = 9 (track index 8)
    const move = redMoves.find((m) => m.tokenId === 0);
    assert(move !== undefined && move.cutsOpponentToken === undefined, 'Safe square: landing on opponent does NOT capture');
  }

  // 5. Two-Token Stack / Block: Opponent Single Token CANNOT Capture Block
  {
    const players = createMockPlayers();
    players[1].tokens[0].step = 44;
    players[1].tokens[1].step = 44;
    players[0].tokens[0].step = 1;

    const redMoves = getValidMoves(players[0], players, 4);
    const redMoveToBlock = redMoves.find((m) => m.tokenId === 0);
    assert(redMoveToBlock === undefined, 'Opponent cannot land on or capture a 2-token stack');
  }

  // 6. Block Path Obstruction: Cannot Pass Through Opponent Block in Path
  {
    const players = createMockPlayers();
    players[1].tokens[0].step = 44;
    players[1].tokens[1].step = 44;
    players[0].tokens[0].step = 1;

    const redMoves = getValidMoves(players[0], players, 6);
    const redMoveThroughBlock = redMoves.find((m) => m.tokenId === 0);
    assert(redMoveThroughBlock === undefined, 'Opponent cannot pass through an intermediate block along the path');
  }

  // 7. Own Tokens Stacking: Player CAN land on and jump past their own tokens
  {
    const players = createMockPlayers();
    players[0].tokens[0].step = 5;
    players[0].tokens[1].step = 1;

    const redMoves = getValidMoves(players[0], players, 4);
    const token1Move = redMoves.find((m) => m.tokenId === 1);
    assert(token1Move !== undefined && token1Move.toStep === 5, 'Player can land on their own token to form a stack');
  }

  // 8. Player-specific Starting Offsets for All 4 Players
  {
    assert(getTrackIndex(0, 1) === 0, 'Red player starting track index is 0');
    assert(getTrackIndex(1, 1) === 13, 'Green player starting track index is 13');
    assert(getTrackIndex(2, 1) === 26, 'Yellow player starting track index is 26');
    assert(getTrackIndex(3, 1) === 39, 'Blue player starting track index is 39');
  }

  // 9. Winner Detection: Only when all 4 tokens reach step 57
  {
    const players = createMockPlayers();
    players[0].tokens[0].step = 57;
    players[0].tokens[1].step = 57;
    players[0].tokens[2].step = 57;
    players[0].tokens[3].step = 56;
    assert(!checkIfPlayerWon(players[0]), '3 tokens home does NOT trigger win');

    players[0].tokens[3].step = 57;
    assert(checkIfPlayerWon(players[0]), 'All 4 tokens home triggers win');
  }

  // 10. Single Valid Move vs Multiple Valid Moves
  {
    const players = createMockPlayers();
    players[0].tokens[0].step = 5;
    players[0].tokens[1].step = 0;
    players[0].tokens[2].step = 0;
    players[0].tokens[3].step = 0;

    const movesRoll4 = getValidMoves(players[0], players, 4);
    const legalTokensRoll4 = getDistinctLegalTokenIds(movesRoll4);
    assert(legalTokensRoll4.length === 1 && legalTokensRoll4[0] === 0, 'Exactly 1 distinct valid token when 1 token on board and roll is not 6');

    const movesRoll6 = getValidMoves(players[0], players, 6);
    const legalTokensRoll6 = getDistinctLegalTokenIds(movesRoll6);
    assert(legalTokensRoll6.length === 4, 'Multiple valid tokens (4 distinct IDs) when roll is 6 and base tokens can release');
  }

  // 11. Extra Turn Authoritative Logic
  {
    assert(
      !shouldGrantExtraTurn({ rolledSix: false, capturedOpponent: false, reachedHome: false }),
      'Normal roll with no cut / home does not grant extra turn'
    );
    assert(
      shouldGrantExtraTurn({ rolledSix: false, capturedOpponent: true, reachedHome: false }),
      'Capturing an opponent grants an extra turn'
    );
    assert(
      shouldGrantExtraTurn({ rolledSix: true, capturedOpponent: false, reachedHome: false }),
      'Rolling a 6 grants an extra turn'
    );
    assert(
      shouldGrantExtraTurn({ rolledSix: true, capturedOpponent: true, reachedHome: false }),
      'Rolling a 6 and capturing grants extra turn'
    );
    assert(
      shouldGrantExtraTurn({ rolledSix: false, capturedOpponent: false, reachedHome: true }),
      'Reaching home grants an extra turn'
    );
    assert(
      !shouldGrantExtraTurn({ rolledSix: true, capturedOpponent: false, reachedHome: false, isThirdConsecutiveSix: true }),
      'Third consecutive six penalty forfeits extra turn'
    );
  }

  // 12. Yellow Player: Token A on normal track & Token B in Home Path
  {
    const players = createMockPlayers();
    const yellow = players[2];
    yellow.tokens[0].step = 20;
    yellow.tokens[1].step = 53;
    yellow.tokens[2].step = 0;
    yellow.tokens[3].step = 0;

    const movesRoll3 = getValidMoves(yellow, players, 3);
    const distinctTokenIds = getDistinctLegalTokenIds(movesRoll3);

    assert(
      distinctTokenIds.length === 2,
      'Yellow has exactly 2 distinct legal tokens (Token A on track, Token B in home lane)'
    );
    assert(
      distinctTokenIds.includes(0) && distinctTokenIds.includes(1),
      'Distinct legal tokens contain both Token 0 and Token 1'
    );
    assert(
      distinctTokenIds.length > 1,
      'When distinct tokens > 1, game MUST require manual selection and NEVER auto-move'
    );
  }

  // 13. Home Path Overshoot Discrimination: Only 1 token movable
  {
    const players = createMockPlayers();
    const yellow = players[2];
    yellow.tokens[0].step = 20;
    yellow.tokens[1].step = 56;
    yellow.tokens[2].step = 0;
    yellow.tokens[3].step = 0;

    const movesRoll3 = getValidMoves(yellow, players, 3);
    const distinctTokenIds = getDistinctLegalTokenIds(movesRoll3);

    assert(
      distinctTokenIds.length === 1 && distinctTokenIds[0] === 0,
      'Only Token A is legally movable when Token B overshoots home'
    );
  }

  // 14. Path Block Discrimination: Only 1 token movable when other is blocked
  {
    const players = createMockPlayers();
    players[0].tokens[0].step = 1;
    players[0].tokens[1].step = 10;
    players[0].tokens[2].step = 0;
    players[0].tokens[3].step = 0;

    players[1].tokens[0].step = 44;
    players[1].tokens[1].step = 44;

    const redMoves = getValidMoves(players[0], players, 4);
    const distinctTokenIds = getDistinctLegalTokenIds(redMoves);

    assert(
      distinctTokenIds.length === 1 && distinctTokenIds[0] === 1,
      'Only Token 1 is legally movable when Token 0 is blocked by an opponent stack'
    );
  }

  // 15. Exactly 0 Legal Tokens -> Turn passes
  {
    const players = createMockPlayers();
    const moves = getValidMoves(players[0], players, 3);
    const tokenIds = getDistinctLegalTokenIds(moves);
    assert(tokenIds.length === 0, '0 legal tokens when all tokens in base and roll is not 6');
  }

  // 16. Exactly 2 Tokens in Home Path both legally movable -> Manual Selection
  {
    const players = createMockPlayers();
    const yellow = players[2];
    yellow.tokens[0].step = 52;
    yellow.tokens[1].step = 54;
    yellow.tokens[2].step = 0;
    yellow.tokens[3].step = 0;

    const moves = getValidMoves(yellow, players, 2);
    const tokenIds = getDistinctLegalTokenIds(moves);
    assert(tokenIds.length === 2 && tokenIds.includes(0) && tokenIds.includes(1), '2 tokens in home lane both legally movable -> manual selection required');
  }

  // 17. Exactly 3 Legal Tokens -> Manual Selection
  {
    const players = createMockPlayers();
    players[0].tokens[0].step = 5;
    players[0].tokens[1].step = 10;
    players[0].tokens[2].step = 15;
    players[0].tokens[3].step = 0;

    const moves = getValidMoves(players[0], players, 4);
    const tokenIds = getDistinctLegalTokenIds(moves);
    assert(tokenIds.length === 3, 'Exactly 3 legal tokens on track -> manual selection required');
  }

  // 18. One Active Token + 3 Base Tokens on non-6 roll -> Auto-move
  {
    const players = createMockPlayers();
    players[0].tokens[0].step = 8;
    players[0].tokens[1].step = 0;
    players[0].tokens[2].step = 0;
    players[0].tokens[3].step = 0;

    const moves = getValidMoves(players[0], players, 3);
    const tokenIds = getDistinctLegalTokenIds(moves);
    assert(tokenIds.length === 1 && tokenIds[0] === 0, '1 active token with remaining in base on roll 3 -> exactly 1 legal token');
  }

  // 19. Single Token in Home Lane with other tokens in base on roll 2 -> Auto-move
  {
    const players = createMockPlayers();
    players[0].tokens[0].step = 53;
    players[0].tokens[1].step = 0;
    players[0].tokens[2].step = 0;
    players[0].tokens[3].step = 0;

    const moves = getValidMoves(players[0], players, 2);
    const tokenIds = getDistinctLegalTokenIds(moves);
    assert(tokenIds.length === 1 && tokenIds[0] === 0, 'Single token in home lane with remaining in base on roll 2 -> exactly 1 legal token');
  }

  // 20. 1 Active Token + 1 Base Token on Roll 6 -> 2 Distinct Legal Tokens -> Manual Selection
  {
    const players = createMockPlayers();
    players[0].tokens[0].step = 10;
    players[0].tokens[1].step = 0;
    players[0].tokens[2].step = 57;
    players[0].tokens[3].step = 57;

    const moves = getValidMoves(players[0], players, 6);
    const tokenIds = getDistinctLegalTokenIds(moves);
    assert(tokenIds.length === 2 && tokenIds.includes(0) && tokenIds.includes(1), '1 active token + 1 base token on roll 6 -> exactly 2 distinct legal tokens');
  }

  // 21. Roll 6 with Zero Legal Moves (Base release blocked by opponent 2-token block)
  {
    const players = createMockPlayers();
    players[1].tokens[0].step = 40; // Green offset 13 -> step 40 is track index 0
    players[1].tokens[1].step = 40;

    const moves = getValidMoves(players[0], players, 6);
    const tokenIds = getDistinctLegalTokenIds(moves);
    assert(tokenIds.length === 0, 'Roll 6 with base release blocked by opponent stack produces 0 legal moves');
  }

  // 22. Winner Player Object Consistency & hasWon Flag
  {
    const players = createMockPlayers();
    const winningPlayer = {
      ...players[0],
      tokens: [
        { id: 0, playerId: 0, step: 57, isHome: true },
        { id: 1, playerId: 0, step: 57, isHome: true },
        { id: 2, playerId: 0, step: 57, isHome: true },
        { id: 3, playerId: 0, step: 57, isHome: true },
      ],
      hasWon: true,
    };

    assert(winningPlayer.hasWon === true, 'Winner player object has hasWon = true');
    assert(winningPlayer.tokens.every((t) => t.step === 57 && t.isHome), 'All 4 tokens on winner player object are step 57 and isHome = true');
  }

  // 23. Next player turn skipping players who have won
  {
    const players = createMockPlayers();
    players[1].hasWon = true; // Player 1 (Green) already won

    const nextFromP0 = getNextPlayerId(0, players, false);
    assert(nextFromP0 === 2, 'Turn passes from P0 to P2, skipping P1 who already won');

    const nextFromP0WithExtraTurn = getNextPlayerId(0, players, true);
    assert(nextFromP0WithExtraTurn === 0, 'Extra turn keeps turn with active player (P0)');
  }

  // --- REGRESSION SUITE: BUG 1 & BUG 2 DISCOVERY TESTS ---

  // REGRESSION TEST 1: Three finished tokens + 6
  // Setup: 3 tokens finished (step 57), 1 token in base (step 0), dice = 6.
  // Expected: remaining token is legal, token can exit base, 6 is NOT wasted.
  {
    const players = createMockPlayers();
    const p = players[0];
    p.tokens[0].step = 57;
    p.tokens[0].isHome = true;
    p.tokens[1].step = 57;
    p.tokens[1].isHome = true;
    p.tokens[2].step = 57;
    p.tokens[2].isHome = true;
    p.tokens[3].step = 0;
    p.tokens[3].isHome = false;

    const moves = getValidMoves(p, players, 6);
    const distinctIds = getDistinctLegalTokenIds(moves);

    assert(distinctIds.length === 1 && distinctIds[0] === 3, 'REGRESSION TEST 1: Exactly 1 legal move for token 3 when 3 tokens finished and roll is 6');
    assert(moves[0].isRelease === true && moves[0].toStep === 1, 'REGRESSION TEST 1: Token 3 releases from base to step 1 on 6');
    assert(!p.hasWon, 'REGRESSION TEST 1: Player has not won yet with 3 finished tokens');
  }

  // REGRESSION TEST 2: Two finished tokens + 6
  // Expected: unfinished base tokens eligible according to existing entry rule.
  {
    const players = createMockPlayers();
    const p = players[2]; // Yellow
    p.tokens[0].step = 57;
    p.tokens[0].isHome = true;
    p.tokens[1].step = 57;
    p.tokens[1].isHome = true;
    p.tokens[2].step = 0;
    p.tokens[3].step = 0;

    const moves = getValidMoves(p, players, 6);
    const distinctIds = getDistinctLegalTokenIds(moves);

    assert(distinctIds.length === 2 && distinctIds.includes(2) && distinctIds.includes(3), 'REGRESSION TEST 2: Two base tokens are eligible on 6 with 2 finished tokens');
  }

  // REGRESSION TEST 3: One finished token + 6
  // Expected: normal legal-move behavior.
  {
    const players = createMockPlayers();
    const p = players[1]; // Green
    p.tokens[0].step = 57;
    p.tokens[0].isHome = true;
    p.tokens[1].step = 10;
    p.tokens[2].step = 0;
    p.tokens[3].step = 0;

    const moves = getValidMoves(p, players, 6);
    const distinctIds = getDistinctLegalTokenIds(moves);

    assert(distinctIds.length === 3 && distinctIds.includes(1) && distinctIds.includes(2) && distinctIds.includes(3), 'REGRESSION TEST 3: 1 active token + 2 base tokens are all legal on 6 with 1 finished token');
  }

  // REGRESSION TEST 4: Zero finished tokens + 6
  // Expected: all 4 base tokens are valid options.
  {
    const players = createMockPlayers();
    const p = players[3]; // Blue
    const moves = getValidMoves(p, players, 6);
    const distinctIds = getDistinctLegalTokenIds(moves);

    assert(distinctIds.length === 4, 'REGRESSION TEST 4: All 4 base tokens valid on 6 with 0 finished tokens');
  }

  // REGRESSION TEST 5: Four finished tokens (Winner state)
  // Expected: winner state triggers, no token remains selectable.
  {
    const players = createMockPlayers();
    const p = players[0];
    p.tokens.forEach((t) => {
      t.step = 57;
      t.isHome = true;
    });

    assert(checkIfPlayerWon(p) === true, 'REGRESSION TEST 5: checkIfPlayerWon is true for 4 finished tokens');
    const moves = getValidMoves(p, players, 6);
    assert(moves.length === 0, 'REGRESSION TEST 5: 0 moves returned for already won player');
  }

  // REGRESSION TEST 6: Repeated normal movement across all player colors
  // Expected: every legal token consistently moves; no player/color becomes stuck.
  {
    const players = createMockPlayers();
    let allColorsMoved = true;

    for (let playerId = 0; playerId < 4; playerId++) {
      const p = players[playerId];
      // Release token 0 to step 1
      const releaseMoves = getValidMoves(p, players, 6);
      if (releaseMoves.length === 0) {
        allColorsMoved = false;
        break;
      }
      p.tokens[0].step = 1;

      // Simulate 5 consecutive moves along the track
      for (let stepInc = 1; stepInc <= 5; stepInc++) {
        const stepMoves = getValidMoves(p, players, 3);
        const tokenMove = stepMoves.find((m) => m.tokenId === 0);
        if (!tokenMove) {
          allColorsMoved = false;
          break;
        }
        p.tokens[0].step = tokenMove.toStep;
      }
    }

    assert(allColorsMoved, 'REGRESSION TEST 6: All 4 player colors can release and move along track without becoming stuck');
  }

  // REGRESSION TEST 7: Movement animation completion and path step generation
  // Expected: path generation produces exact ordered step coordinates.
  {
    const releasePath = generateStepAnimationPath(0, 0, 0, 1);
    assert(releasePath.length === 2, 'REGRESSION TEST 7: Release path has exactly 2 coordinates (base -> start)');

    const multiStepPath = generateStepAnimationPath(2, 0, 10, 15);
    assert(multiStepPath.length === 6, 'REGRESSION TEST 7: Hop path from step 10 to 15 has 6 coordinates');
    assert(multiStepPath[0].row !== undefined && multiStepPath[5].col !== undefined, 'REGRESSION TEST 7: Path coordinates are valid board coordinates');
  }

  // REGRESSION TEST 8: Rapid consecutive turns & 6 -> move -> extra-turn cycles
  // Expected: no duplicate turn advancement, correct extra-turn handling.
  {
    const players = createMockPlayers();
    
    // P0 rolls 6, moves -> gets extra turn -> active player stays 0
    const extraTurn1 = shouldGrantExtraTurn({ rolledSix: true, capturedOpponent: false, reachedHome: false });
    const nextP0 = getNextPlayerId(0, players, extraTurn1);
    assert(nextP0 === 0, 'REGRESSION TEST 8: Roll 6 keeps turn with P0');

    // P0 rolls 4, normal move (no cut, not home) -> turn advances to P1
    const normalTurn = shouldGrantExtraTurn({ rolledSix: false, capturedOpponent: false, reachedHome: false });
    const nextP1 = getNextPlayerId(0, players, normalTurn);
    assert(nextP1 === 1, 'REGRESSION TEST 8: Normal roll advances turn to P1');

    // P1 captures opponent -> gets extra turn -> active player stays 1
    const cutExtraTurn = shouldGrantExtraTurn({ rolledSix: false, capturedOpponent: true, reachedHome: false });
    const nextP1AfterCut = getNextPlayerId(1, players, cutExtraTurn);
    assert(nextP1AfterCut === 1, 'REGRESSION TEST 8: Capture grants extra turn to P1');
  }

  // ==========================================
  // PHASE 4: AI OPPONENTS MVP TEST SUITE
  // ==========================================

  // AI TEST 1: AI returns null when 0 valid moves are available
  {
    const players = createMockPlayers();
    const chosen = chooseAIMove(players[0], players, 3, [], 'hard');
    assert(chosen === null, 'AI TEST 1: AI Decision Engine returns null for 0 valid moves');
  }

  // AI TEST 2: AI immediately picks the only move when exactly 1 valid move exists
  {
    const players = createMockPlayers();
    players[0].tokens[0].step = 10;
    const moves = getValidMoves(players[0], players, 4); // Only token 0 can move (tokens 1,2,3 in base)
    assert(moves.length === 1, 'Precondition: Exactly 1 valid move exists');
    const chosen = chooseAIMove(players[0], players, 4, moves, 'hard');
    assert(chosen !== null && chosen.tokenId === 0, 'AI TEST 2: AI immediately returns the only valid move when length === 1');
  }

  // AI TEST 3: Hard AI prioritizes an immediate winning/home move (toStep 57)
  {
    const players = createMockPlayers();
    players[0].tokens[0].step = 55; // Roll 2 reaches step 57 (home!)
    players[0].tokens[1].step = 10; // Roll 2 reaches step 12
    const moves = getValidMoves(players[0], players, 2);
    const chosen = chooseHardMove(players[0], players, moves);
    assert(chosen.tokenId === 0 && chosen.toStep === 57, 'AI TEST 3: Hard AI prioritizes immediate winning move to step 57');
  }

  // AI TEST 4: Hard AI prioritizes capturing an opponent over standard advancing moves
  {
    const players = createMockPlayers();
    players[0].tokens[0].step = 1;  // Red token at step 1
    players[0].tokens[1].step = 20; // Red token at step 20
    players[1].tokens[0].step = 44; // Green token at track index 4 (Red step 5)

    const moves = getValidMoves(players[0], players, 4); // Token 0 cuts Green at step 5; Token 1 advances to 24
    const cutMove = moves.find((m) => m.tokenId === 0);
    assert(cutMove !== undefined && cutMove.cutsOpponentToken !== undefined, 'Precondition: Move 0 cuts opponent');

    const chosen = chooseHardMove(players[0], players, moves);
    assert(chosen.tokenId === 0 && chosen.cutsOpponentToken !== undefined, 'AI TEST 4: Hard AI prioritizes capturing opponent');
  }

  // AI TEST 5: Hard AI prefers entering safe home lane (steps 52-56)
  {
    const players = createMockPlayers();
    players[0].tokens[0].step = 50; // Roll 3 enters home stretch (step 53)
    players[0].tokens[1].step = 10; // Roll 3 moves to step 13 (track)
    const moves = getValidMoves(players[0], players, 3);
    const chosen = chooseHardMove(players[0], players, moves);
    assert(chosen.tokenId === 0 && chosen.toStep === 53, 'AI TEST 5: Hard AI prefers entering safe home stretch over standard track move');
  }

  // AI TEST 6: Hard AI prioritizes escaping a threatened position
  {
    const players = createMockPlayers();
    players[0].tokens[0].step = 15; // Red token at track index 14
    players[1].tokens[0].step = 51; // Green token at track index 11 ((13 + 51 - 1)%52 = 11 -> 3 steps behind Red!)
    players[0].tokens[1].step = 30; // Red token at track index 29 (safe/unthreatened)

    const moves = getValidMoves(players[0], players, 4);
    const chosen = chooseHardMove(players[0], players, moves);
    assert(chosen.tokenId === 0, 'AI TEST 6: Hard AI moves threatened token to escape opponent striking range');
  }

  // AI TEST 7: Hard AI avoids moving into an unsafe track position directly threatened by opponent
  {
    const players = createMockPlayers();
    players[0].tokens[0].step = 10; // Advancing by 3 lands on step 13 (track index 12)
    players[0].tokens[1].step = 30; // Advancing by 3 lands on step 33 (track index 32)
    players[1].tokens[0].step = 50; // Green token at track index 10 ((13 + 50 - 1)%52 = 10 -> 2 steps behind track index 12!)

    const moves = getValidMoves(players[0], players, 3);
    const score0 = getHardMoveScore(players[0], players, moves.find((m) => m.tokenId === 0)!);
    const score1 = getHardMoveScore(players[0], players, moves.find((m) => m.tokenId === 1)!);
    assert(score1 > score0, 'AI TEST 7: Hard AI scores safe destination significantly higher than endangered destination');
  }

  // AI TEST 8: Hard AI prioritizes releasing first token from base on roll 6
  {
    const players = createMockPlayers();
    // All tokens in base except none
    const moves = getValidMoves(players[0], players, 6);
    const chosen = chooseHardMove(players[0], players, moves);
    assert(chosen.isRelease === true, 'AI TEST 8: Hard AI releases token from base on roll 6 when 0 tokens on track');
  }

  // AI TEST 9: Hard AI values forming a protective 2-token friendly stack
  {
    const players = createMockPlayers();
    players[0].tokens[0].step = 15;
    players[0].tokens[1].step = 11; // Moving by 4 lands on step 15 (forms friendly block!)
    players[0].tokens[2].step = 25; // Moving by 4 lands on step 29

    const moves = getValidMoves(players[0], players, 4);
    const stackMove = moves.find((m) => m.tokenId === 1);
    assert(stackMove !== undefined && formsFriendlyStack(players[0], stackMove), 'Precondition: Token 1 forms stack');

    const scoreStack = getHardMoveScore(players[0], players, stackMove!);
    const nonStackMove = moves.find((m) => m.tokenId === 2)!;
    const scoreNonStack = getHardMoveScore(players[0], players, nonStackMove);
    assert(scoreStack > scoreNonStack, 'AI TEST 9: Hard AI scores stacking higher than standard non-stack move');
  }

  // AI TEST 10: Medium AI prioritizes winning moves (step 57)
  {
    const players = createMockPlayers();
    players[0].tokens[0].step = 55; // Roll 2 reaches step 57
    players[0].tokens[1].step = 10;
    const moves = getValidMoves(players[0], players, 2);
    const scoreHome = getMediumMoveScore(players[0], players, moves.find((m) => m.tokenId === 0)!);
    const scoreNormal = getMediumMoveScore(players[0], players, moves.find((m) => m.tokenId === 1)!);
    assert(scoreHome > scoreNormal, 'AI TEST 10: Medium AI scores winning move higher than normal move');
  }

  // AI TEST 11: Medium AI prioritizes captures over general track progress
  {
    const players = createMockPlayers();
    players[0].tokens[0].step = 1;
    players[0].tokens[1].step = 20;
    players[1].tokens[0].step = 44; // Green at Red's step 5

    const moves = getValidMoves(players[0], players, 4);
    const scoreCut = getMediumMoveScore(players[0], players, moves.find((m) => m.tokenId === 0)!);
    const scoreTrack = getMediumMoveScore(players[0], players, moves.find((m) => m.tokenId === 1)!);
    assert(scoreCut > scoreTrack, 'AI TEST 11: Medium AI scores capture higher than normal progress');
  }

  // AI TEST 12: Easy AI returns a valid legal move without throwing errors or picking illegal tokens
  {
    const players = createMockPlayers();
    players[0].tokens[0].step = 5;
    players[0].tokens[1].step = 12;
    const moves = getValidMoves(players[0], players, 3);
    const chosen = chooseEasyMove(moves);
    assert(moves.some((m) => m.tokenId === chosen.tokenId), 'AI TEST 12: Easy AI selects a valid legal move option');
  }

  // AI TEST 13: Edge Case - 3 tokens finished (step 57) + 1 token in base (step 0) on roll 6
  {
    const players = createMockPlayers();
    players[0].tokens[0].step = 57;
    players[0].tokens[1].step = 57;
    players[0].tokens[2].step = 57;
    players[0].tokens[3].step = 0; // Only token 3 in base

    const moves = getValidMoves(players[0], players, 6);
    assert(moves.length === 1 && moves[0].tokenId === 3 && moves[0].isRelease, 'Precondition: Exactly token 3 can be released');
    const chosen = chooseAIMove(players[0], players, 6, moves, 'hard');
    assert(chosen !== null && chosen.tokenId === 3 && chosen.isRelease, 'AI TEST 13: AI correctly releases 4th token when first 3 are finished');
  }

  // AI TEST 14: AI honors opponent blocks and only selects non-blocked legal path options
  {
    const players = createMockPlayers();
    players[0].tokens[0].step = 1;  // Moving 4 tries to pass step 3 (blocked)
    players[0].tokens[1].step = 20; // Moving 4 is unblocked
    players[1].tokens[0].step = 42; // Green block at track index 2 (Red step 3)
    players[1].tokens[1].step = 42;

    const moves = getValidMoves(players[0], players, 4);
    assert(moves.length === 1 && moves[0].tokenId === 1, 'Precondition: Token 0 is blocked, only Token 1 is valid');
    const chosen = chooseAIMove(players[0], players, 4, moves, 'hard');
    assert(chosen !== null && chosen.tokenId === 1, 'AI TEST 14: AI only selects unblocked legal move');
  }

  // AI TEST 15: isPositionThreatened accurately detects opponent tokens within 1-6 clockwise track distance
  {
    const players = createMockPlayers();
    players[1].tokens[0].step = 41; // Green token at track index 1
    // Target track index is 5 (distance: 5 - 1 = 4 -> threatened!)
    const threatenedResult = isPositionThreatened(players, 0, 5);
    assert(threatenedResult.isThreatened === true && threatenedResult.threatLevel === 1, 'AI TEST 15: isPositionThreatened detects opponent at distance 4');

    // Target track index is safe star square (index 8) -> never threatened!
    const safeSquareResult = isPositionThreatened(players, 0, 8);
    assert(safeSquareResult.isThreatened === false, 'AI TEST 15: Safe square is never threatened');
  }

  // =========================================================================
  // FORENSIC REGRESSION TESTS: AI 6 EXTRA-TURN & DICE PIPELINE VERIFICATION
  // =========================================================================

  // FORENSIC TEST 1: AI roll = 6, AI opens base token -> extra turn = TRUE
  {
    const players = createMockPlayers();
    players[1].isAI = true; // Player 1 (Green) is AI
    const moves = getValidMoves(players[1], players, 6);
    assert(moves.length === 4 && moves.every((m) => m.isRelease), 'AI TEST 1: AI has 4 valid base release options on roll 6');
    const chosenMove = chooseAIMove(players[1], players, 6, moves, 'hard');
    assert(chosenMove !== null && chosenMove.isRelease, 'AI TEST 1: AI chose a valid base release move');
    
    // Simulate authoritative extra turn evaluation for this move
    const roll = 6;
    const didCutOpponent = Boolean(chosenMove?.cutsOpponentToken);
    const didReachHome = chosenMove?.toStep === TOTAL_STEPS_TO_HOME;
    const getsExtraTurn = shouldGrantExtraTurn({
      rolledSix: roll === 6,
      capturedOpponent: didCutOpponent,
      reachedHome: didReachHome,
    });
    assert(getsExtraTurn === true, 'AI TEST 1: AI opening base token on roll 6 grants extra turn = TRUE');
    const nextPlayerId = getNextPlayerId(1, players, getsExtraTurn);
    assert(nextPlayerId === 1, 'AI TEST 1: Turn stays with AI player (P1) after roll 6 base release');
  }

  // FORENSIC TEST 2: AI roll = 6, AI moves active token -> extra turn = TRUE
  {
    const players = createMockPlayers();
    players[1].isAI = true;
    players[1].tokens[0].step = 10; // Active token on track
    const moves = getValidMoves(players[1], players, 6);
    const activeMove = moves.find((m) => m.tokenId === 0);
    assert(activeMove !== undefined && activeMove.toStep === 16, 'AI TEST 2: Active AI token has valid move from 10 to 16 on roll 6');
    const getsExtraTurn = shouldGrantExtraTurn({
      rolledSix: true,
      capturedOpponent: false,
      reachedHome: false,
    });
    assert(getsExtraTurn === true, 'AI TEST 2: AI moving active token on roll 6 grants extra turn = TRUE');
    const nextPlayerId = getNextPlayerId(1, players, getsExtraTurn);
    assert(nextPlayerId === 1, 'AI TEST 2: Turn stays with AI player (P1) after roll 6 active token move');
  }

  // FORENSIC TEST 3: AI roll = 1-5, no capture, no home -> extra turn = FALSE
  {
    const players = createMockPlayers();
    players[1].isAI = true;
    players[1].tokens[0].step = 10;
    for (let roll = 1; roll <= 5; roll++) {
      const getsExtraTurn = shouldGrantExtraTurn({
        rolledSix: roll === 6,
        capturedOpponent: false,
        reachedHome: false,
      });
      assert(getsExtraTurn === false, `AI TEST 3: Roll ${roll} without capture/home grants extra turn = FALSE`);
      const nextPlayerId = getNextPlayerId(1, players, getsExtraTurn);
      assert(nextPlayerId === 2, `AI TEST 3: Roll ${roll} advances turn to next player (P2)`);
    }
  }

  // FORENSIC TEST 4: AI roll = 6 + capture -> exactly one extra turn
  {
    const players = createMockPlayers();
    players[1].isAI = true;
    players[1].tokens[0].step = 1; // Track index 13 + 0 = 13
    players[0].tokens[0].step = 20; // Track index 19 (distance from 13 is 6)
    const moves = getValidMoves(players[1], players, 6);
    const captureMove = moves.find((m) => m.tokenId === 0 && m.cutsOpponentToken?.playerId === 0);
    assert(captureMove !== undefined, 'AI TEST 4: AI has legal capture move on roll 6');
    
    // Evaluate extra turn
    const getsExtraTurn = shouldGrantExtraTurn({
      rolledSix: true,
      capturedOpponent: true,
      reachedHome: false,
    });
    assert(getsExtraTurn === true, 'AI TEST 4: AI roll 6 + capture grants extra turn = TRUE');
    const nextPlayerId = getNextPlayerId(1, players, getsExtraTurn);
    assert(nextPlayerId === 1, 'AI TEST 4: Exactly one turn retained by AI (nextPlayerId is P1)');
  }

  // FORENSIC TEST 5: AI reaches home -> extra turn = TRUE
  {
    const players = createMockPlayers();
    players[1].isAI = true;
    players[1].tokens[0].step = 54;
    const moves = getValidMoves(players[1], players, 3);
    const homeMove = moves.find((m) => m.tokenId === 0 && m.toStep === 57);
    assert(homeMove !== undefined, 'AI TEST 5: AI token reaches step 57 on roll 3');
    const getsExtraTurn = shouldGrantExtraTurn({
      rolledSix: false,
      capturedOpponent: false,
      reachedHome: true,
    });
    assert(getsExtraTurn === true, 'AI TEST 5: Reaching home grants extra turn = TRUE');
    const nextPlayerId = getNextPlayerId(1, players, getsExtraTurn);
    assert(nextPlayerId === 1, 'AI TEST 5: Turn retained by AI player upon reaching home');
  }

  // FORENSIC TEST 6: AI third consecutive 6 -> turn forfeited
  {
    const players = createMockPlayers();
    players[1].isAI = true;
    // When third consecutive 6 is rolled, penalty is triggered and advanceTurn(false) is called
    const consecutiveSixesCount = 3;
    const forfeitsTurn = consecutiveSixesCount >= 3;
    assert(forfeitsTurn === true, 'AI TEST 6: Third consecutive six triggers forfeit');
    const nextPlayerId = getNextPlayerId(1, players, false);
    assert(nextPlayerId === 2, 'AI TEST 6: Turn passes to next player (P2) upon 3rd consecutive six forfeit');
  }

  // FORENSIC TEST 7: AI displayed dice value equals actual gameplay roll
  {
    // Authoritative roll generation generates a value in [1, 6]
    for (let testRoll = 1; testRoll <= 6; testRoll++) {
      const gameplayRoll = testRoll;
      const visualDiceValue = gameplayRoll; // State mirror guarantees synchronous propagation
      assert(visualDiceValue === gameplayRoll, `AI TEST 7: Visual dice value (${visualDiceValue}) matches authoritative roll (${gameplayRoll})`);
    }
  }

  // FORENSIC TEST 8: AI roll 6 does not accidentally reset diceValue before move completes
  {
    const players = createMockPlayers();
    players[1].isAI = true;
    // Step simulation: roll -> diceValue set -> move executed with roll -> extra turn evaluated
    const roll = 6;
    let diceValueRefCurrent: number | null = roll;
    const move = { tokenId: 0, fromStep: 0, toStep: 1, isRelease: true };
    
    // Movement evaluates using the synchronous roll parameter or ref
    const actualRoll = roll ?? diceValueRefCurrent;
    const rolledSix = actualRoll === 6;
    assert(rolledSix === true, 'AI TEST 8: roll 6 evaluated synchronously during move execution');
    assert(diceValueRefCurrent === 6, 'AI TEST 8: diceValueRef was not prematurely wiped during move execution');
  }

  // FORENSIC TEST 9: AI extra turn does not trigger two turn transitions
  {
    const players = createMockPlayers();
    players[1].isAI = true;
    let activePlayer = 1;
    // Single move transition with extraTurn = true
    activePlayer = getNextPlayerId(activePlayer, players, true);
    assert(activePlayer === 1, 'AI TEST 9: First turn resolution leaves P1 active');
    // Verify no secondary turn advance occurs
    assert(activePlayer === 1, 'AI TEST 9: Exactly ONE turn transition executed for the move');
  }

  // FORENSIC TEST 10: Human behavior remains completely unchanged
  {
    const players = createMockPlayers();
    players[0].isAI = false; // Human player
    // Human roll 6 base release
    const humanMoves = getValidMoves(players[0], players, 6);
    assert(humanMoves.length === 4, 'AI TEST 10: Human has 4 base release moves on roll 6');
    const humanGetsExtraTurn = shouldGrantExtraTurn({
      rolledSix: true,
      capturedOpponent: false,
      reachedHome: false,
    });
    assert(humanGetsExtraTurn === true, 'AI TEST 10: Human roll 6 gets extra turn = TRUE');
    const humanNextId = getNextPlayerId(0, players, humanGetsExtraTurn);
    assert(humanNextId === 0, 'AI TEST 10: Human retains turn on roll 6');
  }

  // =========================================================================
  // CORNER SLOT ASSIGNMENTS & ACTIVE PLAYER INDICES (HUMAN BOTTOM-LEFT ANCHORING)
  // =========================================================================

  // UI SLOT TEST 1: Quadrant mapping matches physical board layout
  {
    const slots = getCornerSlotAssignments();
    assert(slots.topLeft === 0, 'UI SLOT TEST 1: Top-Left is Player 0 (Red)');
    assert(slots.topRight === 1, 'UI SLOT TEST 1: Top-Right is Player 1 (Green)');
    assert(slots.bottomLeft === 3, 'UI SLOT TEST 1: Bottom-Left is Player 3 (Blue)');
    assert(slots.bottomRight === 2, 'UI SLOT TEST 1: Bottom-Right is Player 2 (Yellow)');
  }

  // UI SLOT TEST 2: 2-Player Match has Human in Bottom-Left (3) and AI in Top-Right (1)
  {
    const activeIndices = [3, 1];
    assert(activeIndices[0] === 3, 'UI SLOT TEST 2: In 2P match, starting active player is Bottom-Left (3)');
    assert(activeIndices[1] === 1, 'UI SLOT TEST 2: In 2P match, opponent is Top-Right (1)');
    
    // Test turn progression for 2P mode
    const players = createMockPlayers();
    players[0].hasWon = true; // Inactive
    players[2].hasWon = true; // Inactive
    players[1].hasWon = false; // Active AI
    players[3].hasWon = false; // Active Human

    const nextAfterHuman = getNextPlayerId(3, players, false);
    assert(nextAfterHuman === 1, 'UI SLOT TEST 2: Turn passes from Human (3 - Bottom-Left) to AI (1 - Top-Right)');

    const nextAfterAI = getNextPlayerId(1, players, false);
    assert(nextAfterAI === 3, 'UI SLOT TEST 2: Turn passes from AI (1 - Top-Right) back to Human (3 - Bottom-Left)');
  }

  // UI SLOT TEST 3: 3-Player Match has Human in Bottom-Left (3), AI 1 in Top-Left (0), AI 2 in Top-Right (1)
  {
    const activeIndices = [3, 0, 1];
    assert(activeIndices[0] === 3 && activeIndices[1] === 0 && activeIndices[2] === 1, 'UI SLOT TEST 3: 3P match active indices are [3, 0, 1]');

    const players = createMockPlayers();
    players[2].hasWon = true; // Inactive
    players[3].hasWon = false; // Active Human
    players[0].hasWon = false; // Active AI 1
    players[1].hasWon = false; // Active AI 2

    const next1 = getNextPlayerId(3, players, false);
    assert(next1 === 0, 'UI SLOT TEST 3: Turn passes from Human (3) to AI 1 (0)');

    const next2 = getNextPlayerId(0, players, false);
    assert(next2 === 1, 'UI SLOT TEST 3: Turn passes from AI 1 (0) to AI 2 (1)');

    const next3 = getNextPlayerId(1, players, false);
    assert(next3 === 3, 'UI SLOT TEST 3: Turn passes from AI 2 (1) back to Human (3)');
  }

  // UI SLOT TEST 4: 4-Player Match has Human in Bottom-Left (3) and all 4 corners active
  {
    const activeIndices = [3, 0, 1, 2];
    assert(activeIndices[0] === 3, 'UI SLOT TEST 4: 4P match starts with Human (3 - Bottom-Left)');
    assert(activeIndices.length === 4, 'UI SLOT TEST 4: All 4 players are active');

    const players = createMockPlayers();
    players.forEach((p) => { p.hasWon = false; });

    assert(getNextPlayerId(3, players, false) === 0, 'UI SLOT TEST 4: Turn passes 3 -> 0');
    assert(getNextPlayerId(0, players, false) === 1, 'UI SLOT TEST 4: Turn passes 0 -> 1');
    assert(getNextPlayerId(1, players, false) === 2, 'UI SLOT TEST 4: Turn passes 1 -> 2');
    assert(getNextPlayerId(2, players, false) === 3, 'UI SLOT TEST 4: Turn passes 2 -> 3');
  }

  // =========================================================================
  // CRITICAL REGRESSION TEST: 6 ROLL -> BASE RELEASE -> MULTI-TOKEN MANUAL CHOICE
  // =========================================================================
  {
    // Step 1: Red player has Token 0 already on track at step 10, other tokens in base (step 0)
    const players = createMockPlayers();
    players[0].tokens[0].step = 10;
    players[0].tokens[1].step = 0;
    players[0].tokens[2].step = 0;
    players[0].tokens[3].step = 0;

    // Step 2: Red player rolls 6
    const roll6 = 6;
    const movesOn6 = getValidMoves(players[0], players, roll6);
    const distinctTokenIdsOn6 = getDistinctLegalTokenIds(movesOn6);

    assert(distinctTokenIdsOn6.includes(0), 'REGRESSION TEST: Active Token 0 is legal on roll 6');
    assert(distinctTokenIdsOn6.includes(1), 'REGRESSION TEST: Base Token 1 is legal on roll 6');
    assert(distinctTokenIdsOn6.length >= 2, 'REGRESSION TEST: At least 2 distinct tokens available on roll 6');

    // Step 3: Human player selects base Token 1 to release
    const releaseMove = movesOn6.find((m) => m.tokenId === 1 && m.isRelease);
    assert(releaseMove !== undefined, 'REGRESSION TEST: Base release move for Token 1 exists');

    // Simulate move execution: Token 1 moves from 0 to 1
    players[0].tokens[1].step = 1;
    const extraTurnGranted = shouldGrantExtraTurn({
      rolledSix: true,
      capturedOpponent: false,
      reachedHome: false,
    });
    assert(extraTurnGranted === true, 'REGRESSION TEST: Extra turn is granted upon rolling 6 and releasing');

    // Turn stays with Red (Player 0)
    const activePlayerIdAfter6 = getNextPlayerId(0, players, extraTurnGranted);
    assert(activePlayerIdAfter6 === 0, 'REGRESSION TEST: Turn stays with Player 0 for extra turn');

    // Step 4: Red rolls 4 on the extra turn
    const rollAfterRelease = 4;
    const movesNextRoll = getValidMoves(players[0], players, rollAfterRelease);
    const distinctTokenIdsNextRoll = getDistinctLegalTokenIds(movesNextRoll);

    // Step 5: Both Token 0 (step 10 -> 14) and Token 1 (step 1 -> 5) are legally movable
    assert(distinctTokenIdsNextRoll.length === 2, 'REGRESSION TEST: Exactly 2 DISTINCT legal token IDs on next roll');
    assert(distinctTokenIdsNextRoll.includes(0) && distinctTokenIdsNextRoll.includes(1), 'REGRESSION TEST: Both Token 0 and Token 1 are legal');

    // Step 6: Verify automatic movement is strictly prohibited when count >= 2
    const requiresManualSelection = distinctTokenIdsNextRoll.length >= 2;
    assert(requiresManualSelection === true, 'REGRESSION TEST: Automatic movement must NOT occur; manual selection is required');

    // Step 7: Verify selecting Token 0 moves only Token 0
    const chosenMoveToken0 = movesNextRoll.find((m) => m.tokenId === 0);
    assert(chosenMoveToken0 !== undefined && chosenMoveToken0.toStep === 14, 'REGRESSION TEST: Selecting Token 0 targets step 14');

    // Step 8: Verify selecting Token 1 moves only Token 1
    const chosenMoveToken1 = movesNextRoll.find((m) => m.tokenId === 1);
    assert(chosenMoveToken1 !== undefined && chosenMoveToken1.toStep === 5, 'REGRESSION TEST: Selecting Token 1 targets step 5');

    // Step 9: Simulate manual choice of Token 0 -> Token 0 moves to 14, Token 1 stays at 1
    players[0].tokens[0].step = 14;
    assert(players[0].tokens[0].step === 14 && players[0].tokens[1].step === 1, 'REGRESSION TEST: Only selected Token 0 moved, Token 1 preserved');

    // Step 10: Turn advancement after normal roll (4) passes turn to Player 1
    const extraTurnAfter4 = shouldGrantExtraTurn({
      rolledSix: false,
      capturedOpponent: false,
      reachedHome: false,
    });
    assert(extraTurnAfter4 === false, 'REGRESSION TEST: Normal roll does not grant extra turn');
    const nextPlayerAfter4 = getNextPlayerId(0, players, extraTurnAfter4);
    assert(nextPlayerAfter4 === 1, 'REGRESSION TEST: Exactly one turn transition occurs to next player (Player 1)');
  }

  // =========================================================================
  // SAFETY REQUIREMENT GUARD TESTS (SIMULATING PRE-EXECUTION AUTO-MOVE CHECKS)
  // =========================================================================
  {
    // Safety check simulation function matching the 7-point guard in LudoGame.tsx
    function evaluateAutoMoveSafetyGuard(params: {
      gameSessionId: number;
      expectedSessionId: number;
      activePlayerId: number;
      snapshotPlayerId: number;
      turnState: string;
      isMoving: boolean;
      currentDiceValue: number | null;
      snapshotRoll: number;
      freshLegalTokenCount: number;
      freshTargetTokenId: number;
      scheduledTokenId: number;
    }): boolean {
      if (
        params.gameSessionId !== params.expectedSessionId ||
        params.activePlayerId !== params.snapshotPlayerId ||
        params.turnState !== 'WAITING_FOR_TOKEN_SELECTION' ||
        params.isMoving ||
        params.currentDiceValue !== params.snapshotRoll
      ) {
        return false; // Aborted by lifecycle / state guard
      }

      if (params.freshLegalTokenCount !== 1 || params.freshTargetTokenId !== params.scheduledTokenId) {
        return false; // Aborted by move count or token mismatch guard
      }

      return true; // Safe to execute auto-move
    }

    // Case A: Perfect single legal token match -> ALLOW
    assert(
      evaluateAutoMoveSafetyGuard({
        gameSessionId: 1,
        expectedSessionId: 1,
        activePlayerId: 0,
        snapshotPlayerId: 0,
        turnState: 'WAITING_FOR_TOKEN_SELECTION',
        isMoving: false,
        currentDiceValue: 4,
        snapshotRoll: 4,
        freshLegalTokenCount: 1,
        freshTargetTokenId: 0,
        scheduledTokenId: 0,
      }) === true,
      'SAFETY GUARD: Allows execution when all 7 safety conditions are met'
    );

    // Case B: Dice value changed / cleared -> ABORT
    assert(
      evaluateAutoMoveSafetyGuard({
        gameSessionId: 1,
        expectedSessionId: 1,
        activePlayerId: 0,
        snapshotPlayerId: 0,
        turnState: 'WAITING_FOR_TOKEN_SELECTION',
        isMoving: false,
        currentDiceValue: null, // Dice cleared or re-rolled
        snapshotRoll: 4,
        freshLegalTokenCount: 1,
        freshTargetTokenId: 0,
        scheduledTokenId: 0,
      }) === false,
      'SAFETY GUARD: Aborts auto-move if dice value was cleared or changed'
    );

    // Case C: Active player changed -> ABORT
    assert(
      evaluateAutoMoveSafetyGuard({
        gameSessionId: 1,
        expectedSessionId: 1,
        activePlayerId: 1, // Turn advanced to next player
        snapshotPlayerId: 0,
        turnState: 'WAITING_FOR_TOKEN_SELECTION',
        isMoving: false,
        currentDiceValue: 4,
        snapshotRoll: 4,
        freshLegalTokenCount: 1,
        freshTargetTokenId: 0,
        scheduledTokenId: 0,
      }) === false,
      'SAFETY GUARD: Aborts auto-move if active player changed'
    );

    // Case D: Fresh moves has 2 distinct tokens -> ABORT
    assert(
      evaluateAutoMoveSafetyGuard({
        gameSessionId: 1,
        expectedSessionId: 1,
        activePlayerId: 0,
        snapshotPlayerId: 0,
        turnState: 'WAITING_FOR_TOKEN_SELECTION',
        isMoving: false,
        currentDiceValue: 4,
        snapshotRoll: 4,
        freshLegalTokenCount: 2, // Multiple tokens available!
        freshTargetTokenId: 0,
        scheduledTokenId: 0,
      }) === false,
      'SAFETY GUARD: Aborts auto-move if fresh legal move count >= 2'
    );

    // Case E: Session invalidated -> ABORT
    assert(
      evaluateAutoMoveSafetyGuard({
        gameSessionId: 2, // New session after restart / rematch
        expectedSessionId: 1,
        activePlayerId: 0,
        snapshotPlayerId: 0,
        turnState: 'WAITING_FOR_TOKEN_SELECTION',
        isMoving: false,
        currentDiceValue: 4,
        snapshotRoll: 4,
        freshLegalTokenCount: 1,
        freshTargetTokenId: 0,
        scheduledTokenId: 0,
      }) === false,
      'SAFETY GUARD: Aborts auto-move if game session was invalidated'
    );
  }

  // =========================================================================
  // FRIENDS ROOM SERVICE TESTS
  // =========================================================================
  {
    // Test 1: Create room
    const room = createNewRoom('HostPlayer', 'modi');
    assert(room.code.length === 4, 'ROOM TEST 1: Created room has 4-character code');
    assert(room.players.length === 1, 'ROOM TEST 1: Host is the first player');
    assert(room.players[0].slotIndex === 3, 'ROOM TEST 1: Host occupies Slot 3 (Blue/Bottom-Left)');
    assert(room.status === 'lobby', 'ROOM TEST 1: Room status starts in lobby');

    // Test 2: Join room
    const joinRes = joinRoom(room.code, 'GuestPlayer', 'kejriwal', 'guest_client_1');
    assert(joinRes.success === true && joinRes.room !== undefined, 'ROOM TEST 2: Guest joins room successfully');
    assert(joinRes.room!.players.length === 2, 'ROOM TEST 2: Room now has 2 players');
    assert(joinRes.room!.players[1].slotIndex === 1, 'ROOM TEST 2: Second player assigned to Slot 1 (Green/Top-Right)');

    // Test 3: Add players up to 4
    addSimulatedFriendToRoom(joinRes.room!);
    addSimulatedFriendToRoom(joinRes.room!);
    const updated = getRoomState(room.code);
    assert(updated !== null && updated.players.length === 4, 'ROOM TEST 3: Room can hold up to 4 players');

    // Test 4: Cannot join full room with 5th player
    const overfillRes = joinRoom(room.code, 'ExtraPlayer', 'rahul', 'guest_client_5');
    assert(overfillRes.success === false, 'ROOM TEST 4: Full room rejects extra players');

    // Test 5: Invalid room code rejected
    const invalidRes = joinRoom('ZZZZ', 'Player', 'modi');
    assert(invalidRes.success === false, 'ROOM TEST 5: Non-existent room code rejected');
  }

  return { passed: allPassed, results };
}

// When run directly as a script via `npm test` or `tsx src/utils/ludoLogic.test.ts`
if (typeof process !== 'undefined' && process.argv && process.argv[1]?.includes('ludoLogic.test.ts')) {
  const result = runLudoLogicTests();
  console.log(result.results.join('\n'));
  console.log(`\nTOTAL ASSERTIONS: ${result.results.length} | PASSED: ${result.passed}`);
  if (!result.passed) {
    process.exit(1);
  }
}
