export type CharacterId = 'modi' | 'kejriwal' | 'rahul' | 'trump';

export type PlayerColor = 'red' | 'green' | 'yellow' | 'blue';

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

export type GamePhase = 'home' | 'character_selection' | 'playing' | 'game_over';

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
