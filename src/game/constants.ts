import type { OpportunityType, SpecialType } from "./types";

export const PLAYER_NAMES = [
  "Torres",
  "Molina",
  "Vega",
  "Ríos",
  "Paredes",
  "Acuña",
  "Suárez",
  "Ferreyra",
  "Sosa",
  "Ibarra",
  "Romero",
  "Méndez",
  "Pinto",
  "Luna",
  "Navarro",
];

export const PHASES = [
  { phase: 1 as const, playersToDraw: 3, opportunityToDraw: 5, specialToDraw: 1, maxTurnsInPhase: 6 },
  { phase: 2 as const, playersToDraw: 3, opportunityToDraw: 5, specialToDraw: 1, maxTurnsInPhase: 6 },
  { phase: 3 as const, playersToDraw: 4, opportunityToDraw: 7, specialToDraw: 1, maxTurnsInPhase: 6 },
];

export const OPPORTUNITY_DEFS: Array<{ type: OpportunityType; count: number; value: number }> = [
  { type: "Pase", count: 5, value: 2 },
  { type: "Remate", count: 5, value: 2 },
  { type: "Drible", count: 5, value: 2 },
  { type: "Anticipación", count: 4, value: 2 },
  { type: "Retener", count: 4, value: 2 },
  { type: "Pared", count: 4, value: 2 },
  { type: "Comodín", count: 3, value: 5 },
];

export const SPECIAL_DECK: SpecialType[] = [
  "Confianza",
  "Temor",
  "Movimiento Rápido",
  "Distracción",
  "Contra-ataque",
  "Afuera",
  "Presión",
  "Juego local",
  "Arco cerrado",
  "Inteligencia",
  "Confianza",
  "Temor",
  "Distracción",
  "Presión",
  "Juego local",
];