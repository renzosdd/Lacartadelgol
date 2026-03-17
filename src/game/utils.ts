import { OPPORTUNITY_DEFS, PLAYER_NAMES, SPECIAL_DECK } from "./constants";
import type {
  FootballerCard,
  Goalkeeper,
  OpportunityCard,
  SideState,
  SpecialCard,
  Team,
} from "./types";

export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function d6(): number {
  return randomInt(1, 6);
}

export function specialDie() {
  const roll = randomInt(1, 4);
  if (roll === 1) return "AZUL" as const;
  if (roll === 2) return "NARANJA" as const;
  if (roll === 3) return "VERDE" as const;
  return "BLANCO" as const;
}

export function shuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function drawMany<T>(deck: T[], amount: number) {
  return {
    hand: deck.slice(0, amount),
    remaining: deck.slice(amount),
  };
}

export function makeFootballer(name: string, prefix: string, index: number): FootballerCard {
  return {
    id: `${prefix}-pl-${index}`,
    name,
    shot: randomInt(3, 10),
    pass: randomInt(3, 10),
    dribble: randomInt(3, 10),
    wall: randomInt(3, 10),
    mark: randomInt(3, 10),
    hold: randomInt(3, 10),
    anticipation: randomInt(3, 10),
  };
}

export function makeOpportunityDeck(prefix: string): OpportunityCard[] {
  let i = 0;

  return shuffle(
    OPPORTUNITY_DEFS.flatMap((def) =>
      Array.from({ length: def.count }, () => ({
        id: `${prefix}-op-${i++}`,
        type: def.type,
        value: def.value,
      }))
    )
  );
}

export function makeSpecialDeck(prefix: string): SpecialCard[] {
  return shuffle(
    SPECIAL_DECK.map((type, index) => ({
      id: `${prefix}-sp-${index}`,
      type,
    }))
  );
}

export function buildGoalkeeper(): Goalkeeper {
  return {
    saveShot: randomInt(5, 9),
    saveDribble: randomInt(5, 9),
    savePenalty: randomInt(5, 9),
  };
}

export function buildSide(team: Team, prefix: string): SideState {
  const playerDeck = shuffle(
    PLAYER_NAMES.map((name, index) =>
      makeFootballer(`${team === "player" ? "J" : "IA"}-${name}`, prefix, index)
    )
  );

  const opportunitiesDeck = makeOpportunityDeck(prefix);
  const specialsDeck = makeSpecialDeck(prefix);

  const players = drawMany(playerDeck, 3);
  const opportunities = drawMany(opportunitiesDeck, 5);
  const specials = drawMany(specialsDeck, 1);

  return {
    team,
    score: 0,
    playersDeck: players.remaining,
    opportunitiesDeck: opportunities.remaining,
    specialsDeck: specials.remaining,
    playerHand: players.hand,
    opportunityHand: opportunities.hand,
    specialHand: specials.hand,
    goalkeeper: buildGoalkeeper(),
    pressureBonus: 0,
    localPassBonus: 0,
  };
}

export function formatFootballer(card: FootballerCard): string {
  return `R:${card.shot} P:${card.pass} D:${card.dribble} Pa:${card.wall} M:${card.mark} Rt:${card.hold} A:${card.anticipation}`;
}