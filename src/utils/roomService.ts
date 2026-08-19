import { CharacterId, FriendsRoomState, PlayerCount, PlayerType, RoomPlayer } from '../types';

const ROOM_STORAGE_PREFIX = 'lucky_ludo_room_';
const CHANNEL_NAME = 'lucky_ludo_room_channel';

// Unique client ID per browser tab session
export const currentClientId = `client_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`;

// BroadcastChannel instance (with fallback for browser)
let broadcastChannel: BroadcastChannel | null = null;
try {
  if (typeof window !== 'undefined' && typeof BroadcastChannel !== 'undefined') {
    broadcastChannel = new BroadcastChannel(CHANNEL_NAME);
  }
} catch {
  broadcastChannel = null;
}

export type RoomMessage = 
  | { type: 'ROOM_UPDATED'; code: string; state: FriendsRoomState }
  | { type: 'ROOM_CLOSED'; code: string }
  | { type: 'GAME_STARTED'; code: string; state: FriendsRoomState };

export function broadcastRoomMessage(msg: RoomMessage) {
  try {
    broadcastChannel?.postMessage(msg);
  } catch {
    // Ignore postMessage failures if channel is closed
  }
}

export function subscribeToRoomMessages(callback: (msg: RoomMessage) => void): () => void {
  if (!broadcastChannel) {
    return () => {};
  }
  const handler = (event: MessageEvent<RoomMessage>) => {
    callback(event.data);
  };
  broadcastChannel.addEventListener('message', handler);
  return () => {
    broadcastChannel?.removeEventListener('message', handler);
  };
}

/**
 * Generates a clean 4-character room code.
 */
export function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export function getRoomState(code: string): FriendsRoomState | null {
  try {
    const raw = localStorage.getItem(`${ROOM_STORAGE_PREFIX}${code.toUpperCase().trim()}`);
    if (!raw) return null;
    return JSON.parse(raw) as FriendsRoomState;
  } catch {
    return null;
  }
}

export function saveRoomState(state: FriendsRoomState): void {
  try {
    localStorage.setItem(`${ROOM_STORAGE_PREFIX}${state.code}`, JSON.stringify(state));
    broadcastRoomMessage({ type: 'ROOM_UPDATED', code: state.code, state });
  } catch (err) {
    console.error('Failed to save room state:', err);
  }
}

export function deleteRoom(code: string): void {
  try {
    localStorage.removeItem(`${ROOM_STORAGE_PREFIX}${code}`);
    broadcastRoomMessage({ type: 'ROOM_CLOSED', code });
  } catch (err) {
    console.error('Failed to delete room:', err);
  }
}

const SLOT_ORDER = [3, 1, 0, 2]; // 3: Blue (Host), 1: Green, 0: Red, 2: Yellow
const DEFAULT_CHARS: CharacterId[] = ['modi', 'kejriwal', 'rahul', 'trump'];

/**
 * Creates a new Friends Room with the host in Slot 3 (Bottom-Left / Blue).
 */
export function createNewRoom(
  hostName: string, 
  hostCharacter: CharacterId = 'modi',
  hostId: string = currentClientId
): FriendsRoomState {
  const code = generateRoomCode();
  const hostPlayer: RoomPlayer = {
    id: hostId,
    slotIndex: 3,
    name: hostName.trim() || 'Host',
    characterId: hostCharacter,
    isHost: true,
    isReady: true,
  };

  const roomState: FriendsRoomState = {
    code,
    hostId: hostId,
    createdAt: Date.now(),
    status: 'lobby',
    players: [hostPlayer],
    playerCount: 2,
    characterAssignments: {
      3: hostCharacter,
      1: 'kejriwal',
      0: 'rahul',
      2: 'trump',
    },
    playerNames: {
      3: hostName.trim() || 'Host',
      1: 'Friend 1',
      0: 'Friend 2',
      2: 'Friend 3',
    },
    playerTypes: {
      3: 'human',
      1: 'human',
      0: 'human',
      2: 'human',
    },
  };

  saveRoomState(roomState);
  return roomState;
}

/**
 * Attempts to join an existing room by code.
 */
export function joinRoom(
  code: string, 
  playerName: string, 
  preferredCharacter?: CharacterId,
  joiningClientId: string = currentClientId
): { success: boolean; error?: string; room?: FriendsRoomState } {
  const normalizedCode = code.toUpperCase().trim();
  if (!normalizedCode || normalizedCode.length !== 4) {
    return { success: false, error: 'Please enter a valid 4-character room code.' };
  }

  const room = getRoomState(normalizedCode);
  if (!room) {
    return { success: false, error: 'Room not found. Please check the code and try again.' };
  }

  if (room.status === 'playing') {
    return { success: false, error: 'Match is already in progress for this room.' };
  }

  // Check if client is already in the room
  const existingPlayer = room.players.find((p) => p.id === joiningClientId);
  if (existingPlayer) {
    return { success: true, room };
  }

  if (room.players.length >= 4) {
    return { success: false, error: 'Room is full (maximum 4 players reached).' };
  }

  // Find next available slot from [3, 1, 0, 2]
  const occupiedSlots = new Set(room.players.map((p) => p.slotIndex));
  const nextSlot = SLOT_ORDER.find((slot) => !occupiedSlots.has(slot));

  if (nextSlot === undefined) {
    return { success: false, error: 'No available player slots in this room.' };
  }

  // Pick a character not taken by active players
  const takenChars = new Set(room.players.map((p) => p.characterId));
  let assignedChar: CharacterId = preferredCharacter || 'kejriwal';
  if (takenChars.has(assignedChar)) {
    assignedChar = DEFAULT_CHARS.find((c) => !takenChars.has(c)) || 'kejriwal';
  }

  const newPlayer: RoomPlayer = {
    id: joiningClientId,
    slotIndex: nextSlot,
    name: playerName.trim() || `Friend ${room.players.length}`,
    characterId: assignedChar,
    isHost: false,
    isReady: true,
  };

  room.players.push(newPlayer);
  room.playerCount = Math.max(2, room.players.length) as PlayerCount;
  room.characterAssignments[nextSlot] = assignedChar;
  room.playerNames[nextSlot] = newPlayer.name;
  room.playerTypes[nextSlot] = 'human';

  saveRoomState(room);
  return { success: true, room };
}

/**
 * Adds a simulated / pass-and-play friend slot to the room (Host action).
 */
export function addSimulatedFriendToRoom(room: FriendsRoomState): FriendsRoomState {
  if (room.players.length >= 4) return room;

  const occupiedSlots = new Set(room.players.map((p) => p.slotIndex));
  const nextSlot = SLOT_ORDER.find((slot) => !occupiedSlots.has(slot));
  if (nextSlot === undefined) return room;

  const takenChars = new Set(room.players.map((p) => p.characterId));
  const assignedChar = DEFAULT_CHARS.find((c) => !takenChars.has(c)) || 'kejriwal';

  const simulatedPlayer: RoomPlayer = {
    id: `simulated_${nextSlot}_${Date.now()}`,
    slotIndex: nextSlot,
    name: `Friend ${room.players.length}`,
    characterId: assignedChar,
    isHost: false,
    isReady: true,
  };

  room.players.push(simulatedPlayer);
  room.playerCount = Math.max(2, room.players.length) as PlayerCount;
  room.characterAssignments[nextSlot] = assignedChar;
  room.playerNames[nextSlot] = simulatedPlayer.name;
  room.playerTypes[nextSlot] = 'human';

  saveRoomState(room);
  return room;
}

/**
 * Removes a player from the room.
 */
export function leaveRoom(code: string, playerId: string): void {
  const room = getRoomState(code);
  if (!room) return;

  if (room.hostId === playerId) {
    // If host leaves, delete room
    deleteRoom(code);
    return;
  }

  // Remove guest player
  const leavingPlayer = room.players.find((p) => p.id === playerId);
  if (leavingPlayer) {
    delete room.characterAssignments[leavingPlayer.slotIndex];
    delete room.playerNames[leavingPlayer.slotIndex];
  }

  room.players = room.players.filter((p) => p.id !== playerId);
  room.playerCount = Math.max(2, room.players.length) as PlayerCount;
  saveRoomState(room);
}
