/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  AIDifficulty, 
  CharacterId, 
  GameMode, 
  GamePhase, 
  GameSubMode, 
  PlayerCount, 
  PlayerType 
} from './types';
import { HomeScreen } from './components/HomeScreen';
import { MatchSetup, getActivePlayerIndices } from './components/MatchSetup';
import { FriendsRoom } from './components/FriendsRoom';
import { LudoGame } from './components/LudoGame';

export default function App() {
  const [phase, setPhase] = useState<GamePhase>('home');
  const [gameMode, setGameMode] = useState<GameMode>('local');
  const [subMode, setSubMode] = useState<GameSubMode>('classic');
  const [playerCount, setPlayerCount] = useState<PlayerCount>(4);
  const [aiDifficulty, setAiDifficulty] = useState<AIDifficulty>('medium');

  // Player Names: Default customizable names
  const [playerNames, setPlayerNames] = useState<Record<number, string>>({
    3: 'Player 1',
    1: 'Player 2',
    0: 'Player 3',
    2: 'Player 4',
  });

  // Player Types: default all human for 'local' (Pass & Play), P3 (Blue) human + P1, P0, P2 AI for 'ai' mode
  const [playerTypes, setPlayerTypes] = useState<Record<number, PlayerType>>({
    3: 'human',
    1: 'human',
    0: 'human',
    2: 'human',
  });

  // Default unique character assignments for 4 players (3: Blue, 1: Green, 0: Red, 2: Yellow)
  const [characterAssignments, setCharacterAssignments] = useState<Record<number, CharacterId>>({
    3: 'modi',      // Blue (Bottom-Left)
    1: 'kejriwal',  // Green (Top-Right)
    0: 'rahul',     // Red (Top-Left)
    2: 'trump',     // Yellow (Bottom-Right)
  });

  // Handle Game Mode change (Pass & Play vs AI)
  const handleSetGameMode = (mode: GameMode) => {
    setGameMode(mode);
    if (mode === 'local') {
      setPlayerTypes({
        3: 'human',
        1: 'human',
        0: 'human',
        2: 'human',
      });
    } else {
      setPlayerTypes({
        3: 'human', // Human occupies bottom-left (Slot 3)
        1: 'ai',    // AI occupies top-right (Slot 1)
        0: 'ai',    // AI occupies top-left (Slot 0)
        2: 'ai',    // AI occupies bottom-right (Slot 2)
      });
    }
  };

  // Toggle individual player slot between Human and AI
  const handleTogglePlayerType = (playerIndex: number) => {
    setPlayerTypes((prev) => ({
      ...prev,
      [playerIndex]: prev[playerIndex] === 'human' ? 'ai' : 'human',
    }));
  };

  // Update customized player name
  const handleUpdatePlayerName = (playerIndex: number, name: string) => {
    setPlayerNames((prev) => ({
      ...prev,
      [playerIndex]: name,
    }));
  };

  // Assign character to a player slot, swapping if another active player has it
  const handleSelectCharacter = (playerIndex: number, newCharId: CharacterId) => {
    setCharacterAssignments((prev) => {
      // Find if another player currently holds this character
      const otherPlayerIndex = Object.entries(prev).find(
        ([pIdx, charId]) => Number(pIdx) !== playerIndex && charId === newCharId
      )?.[0];

      if (otherPlayerIndex !== undefined) {
        // Swap with the other player so all remain unique
        const currentOfThis = prev[playerIndex];
        return {
          ...prev,
          [playerIndex]: newCharId,
          [Number(otherPlayerIndex)]: currentOfThis,
        };
      }

      return {
        ...prev,
        [playerIndex]: newCharId,
      };
    });
  };

  // Randomize character assignments
  const handleRandomize = () => {
    const chars: CharacterId[] = ['modi', 'kejriwal', 'rahul', 'trump'];
    // Fisher-Yates shuffle
    for (let i = chars.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [chars[i], chars[j]] = [chars[j], chars[i]];
    }

    setCharacterAssignments({
      0: chars[0],
      1: chars[1],
      2: chars[2],
      3: chars[3],
    });
  };

  const handleStartFromHome = (mode: GameMode) => {
    setGameMode(mode);
    if (mode === 'friends') {
      setPhase('friends_room');
    } else {
      handleSetGameMode(mode);
      setPhase('match_setup');
    }
  };

  const handleStartFriendsMatch = (config: {
    characterAssignments: Record<number, CharacterId>;
    playerTypes: Record<number, PlayerType>;
    playerNames: Record<number, string>;
    playerCount: PlayerCount;
  }) => {
    setCharacterAssignments(config.characterAssignments);
    setPlayerTypes(config.playerTypes);
    setPlayerNames(config.playerNames);
    setPlayerCount(config.playerCount);
    setPhase('playing');
  };

  const activePlayerIndices = getActivePlayerIndices(playerCount);

  return (
    <main className="min-h-screen w-full bg-[#140824] text-neutral-100 font-sans selection:bg-amber-400 selection:text-neutral-900">
      {phase === 'home' && (
        <HomeScreen
          onStart={handleStartFromHome}
        />
      )}

      {phase === 'friends_room' && (
        <FriendsRoom
          onBack={() => setPhase('home')}
          onStartMatch={handleStartFriendsMatch}
        />
      )}

      {phase === 'match_setup' && (
        <MatchSetup
          gameMode={gameMode}
          onSetGameMode={handleSetGameMode}
          subMode={subMode}
          onSetSubMode={setSubMode}
          playerCount={playerCount}
          onSetPlayerCount={setPlayerCount}
          selectedCharacters={characterAssignments}
          onSelectCharacter={handleSelectCharacter}
          playerTypes={playerTypes}
          onTogglePlayerType={handleTogglePlayerType}
          playerNames={playerNames}
          onUpdatePlayerName={handleUpdatePlayerName}
          aiDifficulty={aiDifficulty}
          onSetAiDifficulty={setAiDifficulty}
          onRandomize={handleRandomize}
          onStartGame={() => setPhase('playing')}
          onBack={() => setPhase('home')}
        />
      )}

      {phase === 'playing' && (
        <LudoGame
          characterAssignments={characterAssignments}
          playerTypes={playerTypes}
          playerNames={playerNames}
          activePlayerIndices={activePlayerIndices}
          aiDifficulty={aiDifficulty}
          onBackToSelection={() => {
            if (gameMode === 'friends') {
              setPhase('friends_room');
            } else {
              setPhase('match_setup');
            }
          }}
          onGoHome={() => setPhase('home')}
        />
      )}
    </main>
  );
}
