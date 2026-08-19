import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
  Copy, 
  Check, 
  Users, 
  Plus, 
  Play, 
  Share2, 
  LogOut, 
  Crown, 
  ShieldCheck, 
  RefreshCw, 
  AlertCircle,
  Sparkles
} from 'lucide-react';
import { CharacterAvatar } from './CharacterAvatar';
import { CHARACTERS } from '../data/characters';
import { COLOR_CONFIG } from '../utils/ludoConstants';
import { sounds } from '../utils/audio';
import { 
  CharacterId, 
  FriendsRoomState, 
  PlayerColor, 
  PlayerCount, 
  PlayerType 
} from '../types';
import { 
  createNewRoom, 
  joinRoom, 
  leaveRoom, 
  getRoomState, 
  saveRoomState, 
  deleteRoom,
  addSimulatedFriendToRoom,
  currentClientId, 
  subscribeToRoomMessages 
} from '../utils/roomService';
import { getActivePlayerIndices } from './MatchSetup';

interface FriendsRoomProps {
  onBack: () => void;
  onStartMatch: (config: {
    characterAssignments: Record<number, CharacterId>;
    playerTypes: Record<number, PlayerType>;
    playerNames: Record<number, string>;
    playerCount: PlayerCount;
  }) => void;
}

const PLAYER_COLORS: PlayerColor[] = ['red', 'green', 'yellow', 'blue'];
const ALL_CHAR_IDS: CharacterId[] = ['modi', 'kejriwal', 'rahul', 'trump'];
const SLOT_ORDER = [3, 1, 0, 2];

export const FriendsRoom: React.FC<FriendsRoomProps> = ({ onBack, onStartMatch }) => {
  const [activeTab, setActiveTab] = useState<'create' | 'join'>('create');
  const [roomState, setRoomState] = useState<FriendsRoomState | null>(null);
  
  // Create / Join form states
  const [playerName, setPlayerName] = useState<string>('Player 1');
  const [joinCodeInput, setJoinCodeInput] = useState<string>('');
  const [selectedCharacter, setSelectedCharacter] = useState<CharacterId>('modi');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  const isHost = roomState?.hostId === currentClientId;
  const currentSlotIndex = roomState?.players.find((p) => p.id === currentClientId)?.slotIndex;

  // Sync room updates across tabs via BroadcastChannel, Storage Events & polling fallback
  useEffect(() => {
    if (!roomState?.code) return;

    const currentCode = roomState.code;

    // 1. BroadcastChannel subscription
    const unsubscribe = subscribeToRoomMessages((msg) => {
      if (msg.code !== currentCode) return;
      if (msg.type === 'ROOM_UPDATED') {
        setRoomState({ ...msg.state });
      } else if (msg.type === 'ROOM_CLOSED') {
        setRoomState(null);
        setErrorMessage('The room was closed by the host.');
      } else if (msg.type === 'GAME_STARTED') {
        handleLaunchGame(msg.state);
      }
    });

    // 2. Storage event listener (cross-tab synchronization)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === `lucky_ludo_room_${currentCode}`) {
        if (!e.newValue) {
          setRoomState(null);
          setErrorMessage('The room was closed.');
        } else {
          try {
            const updated = JSON.parse(e.newValue) as FriendsRoomState;
            setRoomState(updated);
            if (updated.status === 'playing') {
              handleLaunchGame(updated);
            }
          } catch {
            // Ignore parse errors
          }
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);

    // 3. Fallback polling interval
    const pollInterval = setInterval(() => {
      const latest = getRoomState(currentCode);
      if (!latest) {
        setRoomState(null);
        setErrorMessage('The room was closed.');
      } else {
        setRoomState(latest);
        if (latest.status === 'playing') {
          handleLaunchGame(latest);
        }
      }
    }, 800);

    return () => {
      unsubscribe();
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(pollInterval);
    };
  }, [roomState?.code]);

  const handleLaunchGame = (state: FriendsRoomState) => {
    const count = Math.max(2, state.players.length) as PlayerCount;
    const activeIndices = getActivePlayerIndices(count);

    // Build finalized configuration
    const characterAssignments: Record<number, CharacterId> = { ...state.characterAssignments };
    const playerNames: Record<number, string> = { ...state.playerNames };
    const playerTypes: Record<number, PlayerType> = { ...state.playerTypes };

    // Fill missing character assignments
    activeIndices.forEach((slot) => {
      if (!characterAssignments[slot]) {
        characterAssignments[slot] = ALL_CHAR_IDS[slot % ALL_CHAR_IDS.length];
      }
      if (!playerNames[slot]) {
        playerNames[slot] = `Player ${slot + 1}`;
      }
      playerTypes[slot] = 'human';
    });

    onStartMatch({
      characterAssignments,
      playerNames,
      playerTypes,
      playerCount: count,
    });
  };

  // Create room handler
  const handleCreateRoom = () => {
    sounds.playButton();
    setErrorMessage(null);
    const newRoom = createNewRoom(playerName, selectedCharacter);
    setRoomState(newRoom);
  };

  // Join room handler
  const handleJoinRoom = () => {
    sounds.playButton();
    setErrorMessage(null);
    const result = joinRoom(joinCodeInput, playerName, selectedCharacter);
    if (!result.success || !result.room) {
      setErrorMessage(result.error || 'Failed to join room.');
      return;
    }
    setRoomState(result.room);
  };

  // Copy room code to clipboard
  const handleCopyCode = async () => {
    if (!roomState?.code) return;
    sounds.playButton();
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(roomState.code);
      }
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  // Share room code via Web Share API if supported
  const handleShareCode = async () => {
    if (!roomState?.code) return;
    sounds.playButton();
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join my Lucky Ludo Room!',
          text: `Join my Lucky Ludo match with Room Code: ${roomState.code}`,
          url: window.location.href,
        });
      } catch {
        handleCopyCode();
      }
    } else {
      handleCopyCode();
    }
  };

  // Add friend locally / simulated player
  const handleAddSimulatedFriend = () => {
    if (!roomState) return;
    sounds.playButton();
    const updated = addSimulatedFriendToRoom(roomState);
    setRoomState({ ...updated });
  };

  // Host starts the match
  const handleStartGame = () => {
    if (!roomState) return;
    sounds.playButton();
    const count = Math.max(2, roomState.players.length) as PlayerCount;
    const updatedState: FriendsRoomState = {
      ...roomState,
      status: 'playing',
      playerCount: count,
    };
    saveRoomState(updatedState);
    handleLaunchGame(updatedState);
  };

  // Leave room
  const handleLeaveRoom = () => {
    sounds.playButton();
    if (roomState?.code) {
      leaveRoom(roomState.code, currentClientId);
    }
    setRoomState(null);
    setErrorMessage(null);
  };

  // Update leader choice for current client
  const handleSelectMyCharacter = (charId: CharacterId) => {
    sounds.playButton();
    setSelectedCharacter(charId);
    if (!roomState || currentSlotIndex === undefined) return;

    const isTaken = roomState.players.some(
      (p) => p.id !== currentClientId && p.characterId === charId
    );
    if (isTaken) return;

    const updatedPlayers = roomState.players.map((p) =>
      p.id === currentClientId ? { ...p, characterId: charId } : p
    );

    const updatedState: FriendsRoomState = {
      ...roomState,
      players: updatedPlayers,
      characterAssignments: {
        ...roomState.characterAssignments,
        [currentSlotIndex]: charId,
      },
    };
    saveRoomState(updatedState);
    setRoomState(updatedState);
  };

  // Update player name in lobby
  const handleUpdateMyName = (name: string) => {
    setPlayerName(name);
    if (!roomState || currentSlotIndex === undefined) return;

    const updatedPlayers = roomState.players.map((p) =>
      p.id === currentClientId ? { ...p, name } : p
    );

    const updatedState: FriendsRoomState = {
      ...roomState,
      players: updatedPlayers,
      playerNames: {
        ...roomState.playerNames,
        [currentSlotIndex]: name,
      },
    };
    saveRoomState(updatedState);
    setRoomState(updatedState);
  };

  return (
    <div className="min-h-screen w-full bg-[#140824] text-white flex flex-col justify-between p-3 sm:p-5 select-none relative overflow-x-hidden">
      {/* Background ambient lighting */}
      <div className="fixed -top-32 -left-32 w-80 h-80 rounded-full bg-emerald-600/15 blur-3xl pointer-events-none" />
      <div className="fixed -bottom-32 -right-32 w-80 h-80 rounded-full bg-amber-500/20 blur-3xl pointer-events-none" />

      {/* TOP HEADER */}
      <header className="max-w-md w-full mx-auto flex items-center justify-between py-1.5 z-10">
        <button
          onClick={() => {
            sounds.playButton();
            if (roomState) {
              handleLeaveRoom();
            }
            onBack();
          }}
          className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors flex items-center gap-1.5 text-xs font-bold cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <div className="text-center">
          <h1 className="text-base sm:text-lg font-black tracking-tight text-emerald-400 flex items-center justify-center gap-1.5">
            <Users className="w-5 h-5 text-emerald-400" /> FRIENDS ROOM
          </h1>
          <p className="text-[10px] text-neutral-400 font-medium">
            Play with friends using room code
          </p>
        </div>

        <div className="w-14 flex justify-end">
          {roomState && (
            <button
              onClick={handleLeaveRoom}
              className="p-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 transition-colors flex items-center gap-1 text-xs font-bold cursor-pointer"
              title="Leave Room"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="max-w-md w-full mx-auto my-2 space-y-3 z-10 flex-1 overflow-y-auto pr-0.5">
        {/* ERROR TOAST MESSAGE */}
        <AnimatePresence>
          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-3 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-200 text-xs font-semibold flex items-center justify-between shadow-lg"
            >
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{errorMessage}</span>
              </div>
              <button
                onClick={() => setErrorMessage(null)}
                className="text-rose-400 hover:text-white font-bold ml-2 cursor-pointer"
              >
                ✕
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 1. ROOM CREATION & JOINING VIEW (When not in an active room) */}
        {!roomState && (
          <div className="space-y-3">
            {/* Create vs Join Segmented Selector */}
            <div className="bg-neutral-900/90 border border-white/15 rounded-2xl p-1.5 shadow-xl backdrop-blur-sm">
              <div className="grid grid-cols-2 gap-1 bg-neutral-950/80 p-1 rounded-xl border border-white/10">
                <button
                  id="tab-create-room-btn"
                  onClick={() => {
                    sounds.playButton();
                    setActiveTab('create');
                    setErrorMessage(null);
                  }}
                  className={`py-2 rounded-lg text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    activeTab === 'create'
                      ? 'bg-emerald-500 text-neutral-950 shadow-md'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  <Plus className="w-4 h-4" /> CREATE ROOM
                </button>

                <button
                  id="tab-join-room-btn"
                  onClick={() => {
                    sounds.playButton();
                    setActiveTab('join');
                    setErrorMessage(null);
                  }}
                  className={`py-2 rounded-lg text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    activeTab === 'join'
                      ? 'bg-amber-400 text-neutral-950 shadow-md'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" /> JOIN ROOM
                </button>
              </div>
            </div>

            {/* Profile Setup: Name & Leader Selection */}
            <section className="bg-neutral-900/90 border border-white/15 rounded-2xl p-3.5 shadow-xl backdrop-blur-sm space-y-3">
              <div>
                <label className="text-[11px] font-black uppercase tracking-wider text-amber-300/90 block mb-1">
                  Your Player Name
                </label>
                <input
                  type="text"
                  maxLength={14}
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full bg-neutral-950/80 border border-white/15 rounded-xl px-3 py-2 text-sm font-bold text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Choose Leader Avatar */}
              <div>
                <label className="text-[11px] font-black uppercase tracking-wider text-amber-300/90 block mb-1.5">
                  Choose Your Leader
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {ALL_CHAR_IDS.map((charId) => {
                    const char = CHARACTERS[charId];
                    const isSelected = selectedCharacter === charId;
                    return (
                      <button
                        key={charId}
                        onClick={() => {
                          sounds.playButton();
                          setSelectedCharacter(charId);
                        }}
                        className={`rounded-xl p-2 flex flex-col items-center justify-center transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-amber-400 text-neutral-950 font-black ring-2 ring-amber-300 shadow-md scale-[1.02]'
                            : 'bg-neutral-800/80 hover:bg-neutral-700/80 text-white border border-white/10'
                        }`}
                      >
                        <CharacterAvatar id={charId} size="xs" className="w-8 h-8 mb-1" />
                        <span className="text-[10px] font-bold truncate w-full text-center">
                          {char.shortName}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* JOIN CODE INPUT (Only in Join Tab) */}
              {activeTab === 'join' && (
                <div className="pt-2 border-t border-white/10 space-y-1.5">
                  <label className="text-[11px] font-black uppercase tracking-wider text-amber-300/90 block">
                    Enter 4-Character Room Code
                  </label>
                  <input
                    id="join-room-code-input"
                    type="text"
                    maxLength={4}
                    value={joinCodeInput}
                    onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                    placeholder="e.g. ABCD"
                    className="w-full bg-neutral-950/90 border-2 border-amber-400/50 rounded-xl px-3 py-2.5 text-center text-xl font-black tracking-widest text-amber-300 uppercase focus:outline-none focus:border-amber-400"
                  />
                  <p className="text-[10px] text-neutral-400 text-center">
                    Ask your friend for their 4-character room code.
                  </p>
                </div>
              )}
            </section>
          </div>
        )}

        {/* 2. ACTIVE ROOM LOBBY VIEW */}
        {roomState && (
          <div className="space-y-3">
            {/* Room Code Card (Large Display + Copy / Share) */}
            <section className="bg-gradient-to-br from-emerald-950/90 via-neutral-900/90 to-neutral-950 border-2 border-emerald-500/40 rounded-2xl p-4 shadow-xl text-center relative overflow-hidden">
              <div className="text-[11px] font-black uppercase tracking-wider text-emerald-400 mb-1">
                FRIENDS ROOM CODE
              </div>

              <div className="flex items-center justify-center gap-3 my-2">
                <span className="text-3xl sm:text-4xl font-black tracking-widest text-white px-4 py-1.5 rounded-2xl bg-neutral-950/80 border border-white/20 shadow-inner">
                  {roomState.code}
                </span>

                <div className="flex gap-1.5">
                  <button
                    onClick={handleCopyCode}
                    className="p-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-black flex items-center gap-1 text-xs shadow-md transition-all cursor-pointer"
                    title="Copy Code"
                  >
                    {copiedCode ? <Check className="w-4 h-4 stroke-[3]" /> : <Copy className="w-4 h-4" />}
                  </button>

                  <button
                    onClick={handleShareCode}
                    className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold flex items-center gap-1 text-xs transition-all cursor-pointer"
                    title="Share Room Code"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {copiedCode && (
                <p className="text-[11px] text-emerald-300 font-bold animate-fade-in">
                  ✓ Room code copied to clipboard!
                </p>
              )}

              <p className="text-[10px] text-neutral-400 mt-1">
                Share this code with your friends to join the match. (2 to 4 Players)
              </p>
            </section>

            {/* 4 Player Slots Display */}
            <section className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-[11px] font-black uppercase tracking-wider text-amber-300/90 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-emerald-400" /> Players ({roomState.players.length}/4)
                </span>
                {isHost && roomState.players.length < 4 && (
                  <button
                    onClick={handleAddSimulatedFriend}
                    className="text-[10px] text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" /> Add Player
                  </button>
                )}
              </div>

              {SLOT_ORDER.map((slotIdx, orderIdx) => {
                const player = roomState.players.find((p) => p.slotIndex === slotIdx);
                const color = PLAYER_COLORS[slotIdx];
                const colorCfg = COLOR_CONFIG[color];
                const isMe = player?.id === currentClientId;

                const cornerLabel = 
                  slotIdx === 3 ? 'Bottom-Left (Host)' :
                  slotIdx === 1 ? 'Top-Right' :
                  slotIdx === 0 ? 'Top-Left' : 'Bottom-Right';

                if (player) {
                  const char = CHARACTERS[player.characterId];
                  return (
                    <motion.div
                      key={slotIdx}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-neutral-900/90 border border-white/15 rounded-2xl p-3 shadow-md space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className="text-[9px] font-black px-2 py-0.5 rounded-md text-white uppercase"
                            style={{ backgroundColor: colorCfg.bgHex }}
                          >
                            {colorCfg.name}
                          </span>
                          <span className="text-xs font-black text-white flex items-center gap-1">
                            {player.name}
                            {player.isHost && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-400 text-neutral-950 font-black uppercase">
                                Host
                              </span>
                            )}
                            {isMe && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500 text-neutral-950 font-black uppercase">
                                You
                              </span>
                            )}
                          </span>
                        </div>

                        <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                          Joined
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-neutral-950 border border-white/20 flex items-center justify-center shrink-0">
                          <CharacterAvatar id={player.characterId} size="xs" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold text-amber-200 truncate">
                            {char.name}
                          </div>
                          <div className="text-[10px] text-neutral-400 italic truncate">
                            "{char.tagline}"
                          </div>
                        </div>

                        {/* If this slot belongs to the active user, allow changing leader */}
                        {isMe && (
                          <div className="flex gap-1">
                            {ALL_CHAR_IDS.map((cId) => {
                              const isTaken = roomState.players.some(
                                (p) => p.id !== currentClientId && p.characterId === cId
                              );
                              if (isTaken) return null;
                              return (
                                <button
                                  key={cId}
                                  onClick={() => handleSelectMyCharacter(cId)}
                                  className={`p-1 rounded-lg border cursor-pointer ${
                                    player.characterId === cId
                                      ? 'bg-amber-400/30 border-amber-400'
                                      : 'bg-neutral-800 border-white/10 hover:border-white/20'
                                  }`}
                                  title={`Switch to ${CHARACTERS[cId].shortName}`}
                                >
                                  <CharacterAvatar id={cId} size="xs" className="w-5 h-5" />
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                }

                // Empty / Waiting Slot
                return (
                  <div
                    key={slotIdx}
                    className="bg-neutral-950/40 border border-dashed border-white/10 rounded-2xl p-3 flex items-center justify-between opacity-60"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="text-[9px] font-black px-2 py-0.5 rounded-md text-white/50 uppercase"
                        style={{ backgroundColor: colorCfg.bgHex }}
                      >
                        {colorCfg.name}
                      </span>
                      <span className="text-xs font-bold text-neutral-400 italic">
                        ⚪ Slot {orderIdx + 1} — Waiting for friend...
                      </span>
                    </div>
                    <span className="text-[10px] text-neutral-500 font-bold uppercase">
                      Open
                    </span>
                  </div>
                );
              })}
            </section>
          </div>
        )}
      </main>

      {/* BOTTOM ACTION CTA */}
      <footer className="max-w-md w-full mx-auto py-2 z-10">
        {!roomState ? (
          activeTab === 'create' ? (
            <motion.button
              id="friends-create-room-btn"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleCreateRoom}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-500 hover:from-emerald-400 hover:to-emerald-300 text-neutral-950 font-black text-base uppercase tracking-wider flex items-center justify-center gap-2 shadow-2xl shadow-emerald-500/25 border-2 border-emerald-300 cursor-pointer"
            >
              <Plus className="w-5 h-5 stroke-[3]" /> CREATE ROOM LOBBY
            </motion.button>
          ) : (
            <motion.button
              id="friends-join-room-btn"
              whileHover={{ scale: joinCodeInput.length === 4 ? 1.02 : 1 }}
              whileTap={{ scale: joinCodeInput.length === 4 ? 0.98 : 1 }}
              disabled={joinCodeInput.length !== 4}
              onClick={handleJoinRoom}
              className={`w-full py-4 px-6 rounded-2xl font-black text-base uppercase tracking-wider flex items-center justify-center gap-2 shadow-2xl transition-all ${
                joinCodeInput.length === 4
                  ? 'bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-neutral-950 cursor-pointer shadow-amber-400/30 border-2 border-amber-300'
                  : 'bg-neutral-800 text-neutral-500 cursor-not-allowed border border-white/5'
              }`}
            >
              <ShieldCheck className="w-5 h-5 stroke-[3]" /> JOIN ROOM ({joinCodeInput.length}/4)
            </motion.button>
          )
        ) : isHost ? (
          <div className="space-y-2">
            <motion.button
              id="friends-start-game-btn"
              whileHover={{ scale: roomState.players.length >= 2 ? 1.02 : 1 }}
              whileTap={{ scale: roomState.players.length >= 2 ? 0.98 : 1 }}
              disabled={roomState.players.length < 2}
              onClick={handleStartGame}
              className={`w-full py-4 px-6 rounded-2xl font-black text-base uppercase tracking-wider flex items-center justify-center gap-2 shadow-2xl transition-all ${
                roomState.players.length >= 2
                  ? 'bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-500 hover:from-emerald-400 hover:to-emerald-300 text-neutral-950 cursor-pointer shadow-emerald-400/30 border-2 border-emerald-300'
                  : 'bg-neutral-800 text-neutral-500 cursor-not-allowed border border-white/5'
              }`}
            >
              <Play className="w-5 h-5 fill-current" /> START GAME ({roomState.players.length} Players)
            </motion.button>

            {roomState.players.length < 2 && (
              <p className="text-[10px] text-amber-300/90 text-center font-bold">
                Waiting for at least 1 friend to join (min 2 players).
              </p>
            )}
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-neutral-900 border border-white/10 text-center space-y-1">
            <div className="flex items-center justify-center gap-2 text-xs font-bold text-amber-300">
              <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
              Waiting for host to start the game...
            </div>
            <p className="text-[10px] text-neutral-400">
              Get ready! The match will begin as soon as the host taps start.
            </p>
          </div>
        )}
      </footer>
    </div>
  );
};
