// Mirrors schema/day.schema.json, schema/card.schema.json and schema/markets.schema.json.

export type Tier = "normal" | "silver" | "gold" | "diamond";
export type Difficulty = 1 | 2 | 3;

export interface BankQuestion {
  id: string; kind: "bank"; category: "rules" | "history";
  prompt: string; options: string[]; answerIndex: number; why: string;
  difficulty: Difficulty; source: string; template?: string | null;
}
export interface HiddenHero {
  id: string; kind: "hidden_hero"; classic?: boolean; difficulty: Difficulty;
  players: { alias: string; box: { goals: number; assists: number; shots: number; toi_min: number } }[];
  answerIndex: number; why: string;
  reveal: { alias: string; name: string; impact: unknown }[];
}
export interface HigherLower {
  id: string; kind: "higher_lower"; classic?: boolean; difficulty: Difficulty;
  metric: "shots" | "saves" | "goals" | "penalty_minutes" | "team_goals" | "standings_points" | "titles";
  prompt: string; a: { label: string; value: number }; b: { label: string; value: number };
  answer: "a" | "b"; why: string;
}
export interface GuessPlayer {
  id: string; kind: "guess_player"; classic?: boolean; difficulty: Difficulty;
  clues: string[]; options: string[]; answerIndex: number; why: string;
}
export type Question = BankQuestion | HiddenHero | HigherLower | GuessPlayer;

export interface DayPack {
  date: string; games: string[]; depth: "results" | "events"; questions: Question[];
}

export type CardCategory = "player" | "moment" | "goalie" | "team" | "rule" | "gotd" | "achievement";
export type Rarity = "common" | "rare" | "epic" | "legendary";

export interface Card {
  id: string; category: CardCategory; title: string; team: string | null;
  availableOn: string | null; unlock: string | null; image: string | null; statsHidden?: boolean;
  rarity: Rarity; front: string[];
  back: {
    normal: string; silver: string;
    gold: { text: string; visual: "timeline" | "shotmap" | "table"; data: Record<string, unknown> };
    diamond: { question: string; options: string[]; answerIndex: number };
  };
}
export interface CardSet { id: string; label: string; cardIds: string[]; reward: { pucks: number; packId?: string } }
export interface Catalog { cards: Card[]; sets: CardSet[] }

export interface MarketOption { id: string; label: string; odds: number }
export interface Market {
  id: string; kind: "winner" | "star" | "powerplay"; date: string; gameId: string;
  lockAt: string; options: MarketOption[];
}
export interface DayMarkets { date: string; markets: Market[]; results: Record<string, string> }
export type SetBonus = CardSet;

export interface ScheduledGame {
  id: string;
  date: string;
  start: string;
  stage: string;
  group: string | null;
  home: string;
  away: string;
  score: [number, number];
}
