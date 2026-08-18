/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { CharacterId, GamePhase } from './types';
import { HomeScreen } from './components/HomeScreen';
import { CharacterSelection } from './components/CharacterSelection';
import { LudoGame } from './components/LudoGame';

export default function App() {
  const [phase, setPhase] = useState<GamePhase>('home');

  // Default unique character assignments for 4 players (0: Red, 1: Green, 2: Yellow, 3: Blue)
  const [characterAssignments, setCharacterAssignments] = useState<Record<number, CharacterId>>({
    0: 'modi',      // Red (Modi)
    1: 'kejriwal',  // Green (Kejriwal)
    2: 'rahul',     // Yellow (Rahul)
    3: 'trump',     // Blue (Trump)
  });

  // Assign character to a player slot, ensuring uniqueness
  const handleSelectCharacter = (playerIndex: number, newCharId: CharacterId) => {
    setCharacterAssignments((prev) => {
      // Find if another player currently holds this character
      const otherPlayerIndex = Object.entries(prev).find(
        ([pIdx, charId]) => Number(pIdx) !== playerIndex && charId === newCharId
      )?.[0];

      if (otherPlayerIndex !== undefined) {
        // Swap with the other player so all 4 remain unique
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

  return (
    <main className="min-h-screen w-full bg-[#140824] text-neutral-100 font-sans selection:bg-amber-400 selection:text-neutral-900">
      {phase === 'home' && (
        <HomeScreen
          onStart={() => setPhase('character_selection')}
        />
      )}

      {phase === 'character_selection' && (
        <CharacterSelection
          selectedCharacters={characterAssignments}
          onSelectCharacter={handleSelectCharacter}
          onRandomize={handleRandomize}
          onStartGame={() => setPhase('playing')}
          onBack={() => setPhase('home')}
        />
      )}

      {phase === 'playing' && (
        <LudoGame
          characterAssignments={characterAssignments}
          onBackToSelection={() => setPhase('character_selection')}
          onGoHome={() => setPhase('home')}
        />
      )}
    </main>
  );
}
