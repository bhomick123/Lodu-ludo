export type CharacterId = 'modi' | 'kejriwal' | 'rahul' | 'trump';

export type PlayerColor = 'red' | 'green' | 'yellow' | 'blue';

export type AIDifficulty = 'easy' | 'medium' | 'hard';

export type PlayerType = 'human' | 'ai';

export type GameMode = 'local' | 'ai' | 'friends';

export type GameSubMode = 'classic' | 'team_up' | 'quick';

export type PlayerCount = 2 | 3 | 4;

export type NavigationTab = 'home' | 'events' | 'leaders' | 'settings';

export interface RoomPlayer {
  id: string; // unique client id
  slotIndex: number; // 3 (Blue/P1), 1 (Green/P2), 0 (Red/P3), 2 (Yellow/P4)
  name: string;
  characterId: CharacterId;
  isHost: boolean;
  isReady: boolean;
}

export interface FriendsRoomState {
  code: string;
  hostId: string;
  createdAt: number;
  status: 'lobby' | 'playing';
  players: RoomPlayer[];
  playerCount: PlayerCount;
  characterAssignments: Record<number, CharacterId>;
  playerNames: Record<number, string>;
  playerTypes: Record<number, PlayerType>;
}

export interface Character {
  id: CharacterId;
  name: string;
  shortName: string;
  tagline: string;
  catchphrase: string;
  winQuote: string;
  cutQuote: string;
  lostQuote: string;
  sixQuote: string;
  accentColor: string;
  bgGradient: string;
}

export interface Player {
  id: number; // 0, 1, 2, 3
  color: PlayerColor;
  characterId: CharacterId;
  name: string;
  tokens: TokenData[];
  hasWon: boolean;
  isAI?: boolean;
  playerType?: PlayerType;
  difficulty?: AIDifficulty;
  rank?: number;
}

export interface TokenData {
  id: number; // 0, 1, 2, 3
  playerId: number;
  // step:
  // 0: in base
  // 1 to 51: along track from player's starting offset
  // 52 to 56: home stretch steps 1 to 5
  // 57: in central home
  step: number;
  isHome: boolean;
}

export type GamePhase = 'home' | 'match_setup' | 'friends_room' | 'playing' | 'game_over';

export type TurnState = 
  | 'WAITING_FOR_ROLL'
  | 'ROLLING'
  | 'WAITING_FOR_TOKEN_SELECTION'
  | 'MOVING_TOKEN'
  | 'TURN_ENDING';

export interface BoardCoordinate {
  row: number; // 0 to 14
  col: number; // 0 to 14
}

export interface MoveOption {
  tokenId: number;
  fromStep: number;
  toStep: number;
  isRelease: boolean;
  isHomeEntry: boolean;
  cutsOpponentToken?: {
    playerId: number;
    tokenId: number;
  };
}

export interface CaptureFeedback {
  coord: BoardCoordinate;
  attackerPlayerId: number;
  capturedPlayerId: number;
  capturedTokenId: number;
  capturedCharacterId: CharacterId;
  capturedPlayerColor: PlayerColor;
}
