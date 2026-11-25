export interface Team {
  id: string;
  name: string;
  is_public: boolean;
  is_ready: boolean;
  is_deleted: boolean;
  created_at: string;
}

export interface Member {
  id: string;
  team_id: string;
  name: string;
  photo_url: string | null;
  created_at: string;
}

export interface TeamProperty {
  id: string;
  team_id: string;
  label: string;
  position: number | null;
  created_at: string;
}

export interface Clue {
  id: string;
  member_id: string;
  property_id: string;
  value: string;
  created_at: string;
}

export interface MemberWithClues extends Member {
  clues: Clue[];
}

export type GamePhase = 'loading' | 'idle' | 'playing' | 'round-result' | 'end';
