export type Team = "player" | "ai";

export type ActionType = "pass" | "dribble" | "shot" | "hold" | "wall";

export type Attribute =
  | "shot"
  | "pass"
  | "dribble"
  | "wall"
  | "mark"
  | "hold"
  | "anticipation";

export type OpportunityType =
  | "Pase"
  | "Remate"
  | "Drible"
  | "Anticipación"
  | "Retener"
  | "Pared"
  | "Comodín";

export type SpecialType =
  | "Confianza"
  | "Temor"
  | "Movimiento Rápido"
  | "Distracción"
  | "Contra-ataque"
  | "Afuera"
  | "Presión"
  | "Juego local"
  | "Arco cerrado"
  | "Inteligencia";

export type FootballerCard = {
  id: string;
  name: string;
  shot: number;
  pass: number;
  dribble: number;
  wall: number;
  mark: number;
  hold: number;
  anticipation: number;
};

export type OpportunityCard = {
  id: string;
  type: OpportunityType;
  value: number;
};

export type SpecialCard = {
  id: string;
  type: SpecialType;
};

export type Goalkeeper = {
  saveShot: number;
  saveDribble: number;
  savePenalty: number;
};

export type SideState = {
  team: Team;
  score: number;
  playersDeck: FootballerCard[];
  opportunitiesDeck: OpportunityCard[];
  specialsDeck: SpecialCard[];
  playerHand: FootballerCard[];
  opportunityHand: OpportunityCard[];
  specialHand: SpecialCard[];
  goalkeeper: Goalkeeper;
  pressureBonus: number;
  localPassBonus: number;
};

export type StageState = {
  currentPhase: 1 | 2 | 3;
  turnsInPhase: number;
  maxTurnsInPhase: number;
};

export type ActiveEffects = {
  ownAttributeMod?: number;
  rivalAttributeMod?: number;
  ignoreAnticipation?: boolean;
  goalkeeperDefenseMod?: number;
  rivalShotMod?: number;
  scouting?: boolean;
};

export type SelectionState = {
  attackerId: string | null;
  secondAttackerId: string | null;
  attackOpportunityId: string | null;
  attackSpecialId: string | null;
  defenderId: string | null;
  defenseOpportunityId: string | null;
};

export type PendingAttack = {
  attackerTeam: Team;
  action: ActionType;
  attackerId: string;
  secondAttackerId?: string | null;
  attackOpportunityId?: string | null;
  attackSpecialId?: string | null;
};

export type BattleView = {
  phase: "field" | "goalkeeper";
  attackRoll: number;
  defenseRoll: number;
  attackTotal: number;
  defenseTotal: number;
  summary: string;
  specialDie?: string;
};

export type GameState = {
  started: boolean;
  ended: boolean;
  winner: string | null;
  turn: Team;
  possession: Team;
  attackChainCount: number;
  stage: StageState;
  history: string[];
  battleView: BattleView | null;
  player: SideState;
  ai: SideState;
  pendingGoalCancelForPlayer: boolean;
  pendingGoalCancelForAI: boolean;
  activeEffects: ActiveEffects;
  selection: SelectionState;
  pendingAttack: PendingAttack | null;
};