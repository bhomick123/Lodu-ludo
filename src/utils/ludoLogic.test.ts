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
  TOTAL_STEPS_TO_HOME
} from './ludoLogic';
import { shouldGrantExtraTurn } from '../components/LudoGame';
import { Player, PlayerColor } from '../types';

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
    // Red token at step 1 (track index 0, Red Start - which is safe)
    // Red token moves to step 5 (track index 4 - normal square)
    players[0].tokens[0].step = 1;
    // Green token placed on track index 4
    // For Green (start offset 13), track index 4 means (13 + step - 1) % 52 = 4 => step = (4 - 13 + 52) + 1 = 44
    players[1].tokens[0].step = 44; 

    const redMoves = getValidMoves(players[0], players, 4); // Step 1 + 4 = Step 5 (track index 4)
    const move = redMoves.find((m) => m.tokenId === 0);
    assert(move !== undefined && move.cutsOpponentToken?.playerId === 1, 'Red cuts single Green token on normal track square');
  }

  // 4. Safe Square Immunity: No capture on safe star / start squares
  {
    const players = createMockPlayers();
    // Red token at step 5 (track index 4)
    // Red moves 4 steps to step 9 (track index 8 - Red star safe square)
    players[0].tokens[0].step = 5;
    // Green token at track index 8
    // For Green (offset 13): track index 8 => step = (8 - 13 + 52) + 1 = 48
    players[1].tokens[0].step = 48;

    const redMoves = getValidMoves(players[0], players, 4); // Step 5 + 4 = 9 (track index 8)
    const move = redMoves.find((m) => m.tokenId === 0);
    assert(move !== undefined && move.cutsOpponentToken === undefined, 'Safe square: landing on opponent does NOT capture');
  }

  // 5. Two-Token Stack / Block: Opponent Single Token CANNOT Capture Block
  {
    const players = createMockPlayers();
    // Green has a 2-token stack on track index 4
    players[1].tokens[0].step = 44; // Green token 0 at track index 4
    players[1].tokens[1].step = 44; // Green token 1 at track index 4

    // Red single token at step 1 (track index 0)
    players[0].tokens[0].step = 1;

    // Red rolls 4 (trying to land on track index 4 where Green has a block)
    const redMoves = getValidMoves(players[0], players, 4);
    const redMoveToBlock = redMoves.find((m) => m.tokenId === 0);
    assert(redMoveToBlock === undefined, 'Opponent cannot land on or capture a 2-token stack');
  }

  // 6. Block Path Obstruction: Cannot Pass Through Opponent Block in Path
  {
    const players = createMockPlayers();
    // Green has a block on track index 4
    players[1].tokens[0].step = 44;
    players[1].tokens[1].step = 44;

    // Red token at step 1 (track index 0)
    players[0].tokens[0].step = 1;

    // Red rolls 6 (trying to reach step 7 / track index 6, which crosses track index 4)
    const redMoves = getValidMoves(players[0], players, 6);
    const redMoveThroughBlock = redMoves.find((m) => m.tokenId === 0);
    assert(redMoveThroughBlock === undefined, 'Opponent cannot pass through an intermediate block along the path');
  }

  // 7. Own Tokens Stacking: Player CAN land on and jump past their own tokens
  {
    const players = createMockPlayers();
    // Red token 0 at step 5
    // Red token 1 at step 1
    players[0].tokens[0].step = 5;
    players[0].tokens[1].step = 1;

    // Red token 1 rolls 4 to land on step 5 (forming own stack)
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
    players[0].tokens[3].step = 56; // 3 home, 1 almost home
    assert(!checkIfPlayerWon(players[0]), '3 tokens home does NOT trigger win');

    players[0].tokens[3].step = 57; // all 4 home
    assert(checkIfPlayerWon(players[0]), 'All 4 tokens home triggers win');
  }

  // 10. Single Valid Move vs Multiple Valid Moves (Automatic Movement prerequisite)
  {
    const players = createMockPlayers();
    // 1 token on board (step 5), 3 in base (step 0)
    players[0].tokens[0].step = 5;
    players[0].tokens[1].step = 0;
    players[0].tokens[2].step = 0;
    players[0].tokens[3].step = 0;

    // Roll 4: only Token 0 can move -> distinct legal token count must be exactly 1
    const movesRoll4 = getValidMoves(players[0], players, 4);
    const legalTokensRoll4 = getDistinctLegalTokenIds(movesRoll4);
    assert(legalTokensRoll4.length === 1 && legalTokensRoll4[0] === 0, 'Exactly 1 distinct valid token when 1 token on board and roll is not 6');

    // Roll 6: Token 0 can move + 3 base tokens can release -> distinct legal token count must be 4
    const movesRoll6 = getValidMoves(players[0], players, 6);
    const legalTokensRoll6 = getDistinctLegalTokenIds(movesRoll6);
    assert(legalTokensRoll6.length === 4, 'Multiple valid tokens (4 distinct IDs) when roll is 6 and base tokens can release');
  }

  // 11. Extra Turn Authoritative Logic (Capture, Six, Home, 3-Sixes penalty)
  {
    // Normal roll 4 with no cut / no home -> No extra turn
    assert(
      !shouldGrantExtraTurn({ rolledSix: false, capturedOpponent: false, reachedHome: false }),
      'Normal roll with no cut / home does not grant extra turn'
    );

    // Roll 4 with opponent cut -> Extra turn granted!
    assert(
      shouldGrantExtraTurn({ rolledSix: false, capturedOpponent: true, reachedHome: false }),
      'Capturing an opponent grants an extra turn'
    );

    // Roll 6 -> Extra turn granted!
    assert(
      shouldGrantExtraTurn({ rolledSix: true, capturedOpponent: false, reachedHome: false }),
      'Rolling a 6 grants an extra turn'
    );

    // Roll 6 + Opponent Cut -> Exactly one extra turn granted
    assert(
      shouldGrantExtraTurn({ rolledSix: true, capturedOpponent: true, reachedHome: false }),
      'Rolling a 6 and capturing grants extra turn'
    );

    // Reaching home -> Extra turn granted!
    assert(
      shouldGrantExtraTurn({ rolledSix: false, capturedOpponent: false, reachedHome: true }),
      'Reaching home grants an extra turn'
    );

    // 3 consecutive sixes penalty -> Turn forfeited (extraTurn = false)
    assert(
      !shouldGrantExtraTurn({ rolledSix: true, capturedOpponent: false, reachedHome: false, isThirdConsecutiveSix: true }),
      'Third consecutive six penalty forfeits extra turn'
    );
  }

  // 12. Yellow Player: Token A on normal track & Token B in Home Path (CRITICAL REGRESSION TEST)
  {
    const players = createMockPlayers();
    const yellow = players[2];
    // Token 0 (Token A): on common track at step 20 (track index 45)
    yellow.tokens[0].step = 20;
    // Token 1 (Token B): in home path at step 53 (2nd home lane square)
    yellow.tokens[1].step = 53;
    // Token 2 & 3: in base
    yellow.tokens[2].step = 0;
    yellow.tokens[3].step = 0;

    // Roll 3:
    // Token 0 can advance to step 23
    // Token 1 can advance to step 56 (within home lane)
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
    // Token 0 (Token A): on common track at step 20
    yellow.tokens[0].step = 20;
    // Token 1 (Token B): at step 56 (1 step away from home 57)
    yellow.tokens[1].step = 56;
    yellow.tokens[2].step = 0;
    yellow.tokens[3].step = 0;

    // Roll 3:
    // Token 0 can move to 23
    // Token 1 cannot move (56 + 3 = 59 > 57 overshoot)
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
    // Red Token 0 at step 1
    players[0].tokens[0].step = 1;
    // Red Token 1 at step 10
    players[0].tokens[1].step = 10;
    players[0].tokens[2].step = 0;
    players[0].tokens[3].step = 0;

    // Green creates a block on track index 4
    players[1].tokens[0].step = 44;
    players[1].tokens[1].step = 44;

    // Red rolls 4:
    // Red Token 0 tries to reach step 5 (track index 4) -> BLOCKED by Green
    // Red Token 1 reaches step 14 (track index 13) -> UNBLOCKED
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
    // All 4 tokens in base, roll 3 -> 0 legal tokens
    const moves = getValidMoves(players[0], players, 3);
    const tokenIds = getDistinctLegalTokenIds(moves);
    assert(tokenIds.length === 0, '0 legal tokens when all tokens in base and roll is not 6');
  }

  // 16. Exactly 2 Tokens in Home Path both legally movable -> Manual Selection
  {
    const players = createMockPlayers();
    const yellow = players[2];
    yellow.tokens[0].step = 52; // home lane 1
    yellow.tokens[1].step = 54; // home lane 3
    yellow.tokens[2].step = 0;
    yellow.tokens[3].step = 0;

    // Roll 2 -> Token 0 reaches 54, Token 1 reaches 56 (both <= 57)
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
    players[0].tokens[3].step = 0; // base (roll 4 cannot release)

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
    players[0].tokens[2].step = 57; // finished home
    players[0].tokens[3].step = 57; // finished home

    const moves = getValidMoves(players[0], players, 6);
    const tokenIds = getDistinctLegalTokenIds(moves);
    assert(tokenIds.length === 2 && tokenIds.includes(0) && tokenIds.includes(1), '1 active token + 1 base token on roll 6 -> exactly 2 distinct legal tokens');
  }

  return { passed: allPassed, results };
}
