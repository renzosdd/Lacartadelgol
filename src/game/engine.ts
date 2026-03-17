import { PHASES } from "./constants";
import { buildSide, d6, drawMany, specialDie } from "./utils";
import type {
  ActionType,
  ActiveEffects,
  Attribute,
  BattleView,
  FootballerCard,
  GameState,
  OpportunityCard,
  PendingAttack,
  SelectionState,
  SideState,
  SpecialCard,
  Team,
} from "./types";

const emptySelection: SelectionState = {
  attackerId: null,
  secondAttackerId: null,
  attackOpportunityId: null,
  attackSpecialId: null,
  defenderId: null,
  defenseOpportunityId: null,
};

export function initialGame(): GameState {
  return {
    started: true,
    ended: false,
    winner: null,
    turn: "player",
    possession: "player",
    attackChainCount: 0,
    stage: {
      currentPhase: 1,
      turnsInPhase: 0,
      maxTurnsInPhase: 6,
    },
    history: ["Comienza el partido"],
    battleView: null,
    player: buildSide("player", "p"),
    ai: buildSide("ai", "a"),
    pendingGoalCancelForPlayer: false,
    pendingGoalCancelForAI: false,
    activeEffects: {},
    selection: emptySelection,
    pendingAttack: null,
  };
}

function getSide(state: GameState, team: Team): SideState {
  return team === "player" ? state.player : state.ai;
}

function setSide(state: GameState, side: SideState): GameState {
  return side.team === "player" ? { ...state, player: side } : { ...state, ai: side };
}

function appendHistory(state: GameState, text: string): GameState {
  return {
    ...state,
    history: [text, ...state.history].slice(0, 24),
  };
}

function removeById<T extends { id: string }>(list: T[], id?: string | null): T[] {
  if (!id) return list;
  return list.filter((item) => item.id !== id);
}

function getPhaseConfig(phase: 1 | 2 | 3) {
  return PHASES.find((item) => item.phase === phase)!;
}

function attributeForAction(action: ActionType): Attribute {
  switch (action) {
    case "pass":
      return "pass";
    case "dribble":
      return "dribble";
    case "shot":
      return "shot";
    case "hold":
      return "hold";
    case "wall":
      return "wall";
  }
}

function defenderAttributeForAction(action: ActionType): Attribute {
  switch (action) {
    case "pass":
    case "shot":
    case "wall":
      return "anticipation";
    case "dribble":
    case "hold":
      return "mark";
  }
}

function opportunityBoost(card: OpportunityCard | undefined, action: ActionType): number {
  if (!card) return 0;

  const mapping: Record<string, ActionType | "any"> = {
    Pase: "pass",
    Remate: "shot",
    Drible: "dribble",
    Anticipación: "shot",
    Retener: "hold",
    Pared: "wall",
    Comodín: "any",
  };

  return mapping[card.type] === action || mapping[card.type] === "any" ? card.value : 0;
}

function applySpecialEffects(state: GameState, team: Team, special?: SpecialCard): GameState {
  if (!special) return state;

  let next = { ...state };
  const side = getSide(next, team);

  switch (special.type) {
    case "Confianza":
      next.activeEffects = { ...next.activeEffects, ownAttributeMod: 2 };
      next = appendHistory(next, `${team === "player" ? "Jugador" : "IA"} usa Confianza (+2)`);
      break;

    case "Temor":
      next.activeEffects = { ...next.activeEffects, rivalAttributeMod: -2 };
      next = appendHistory(next, `${team === "player" ? "Jugador" : "IA"} usa Temor (-2 rival)`);
      break;

    case "Movimiento Rápido":
      next.activeEffects = { ...next.activeEffects, ignoreAnticipation: true };
      next = appendHistory(next, `${team === "player" ? "Jugador" : "IA"} usa Movimiento Rápido`);
      break;

    case "Distracción":
      next.activeEffects = { ...next.activeEffects, goalkeeperDefenseMod: -3 };
      next = appendHistory(next, `${team === "player" ? "Jugador" : "IA"} distrae al arquero (-3)`);
      break;

    case "Contra-ataque":
      next.attackChainCount = 2;
      next = appendHistory(next, `${team === "player" ? "Jugador" : "IA"} activa Contra-ataque`);
      break;

    case "Afuera":
      if (team === "player") next.pendingGoalCancelForAI = true;
      else next.pendingGoalCancelForPlayer = true;
      next = appendHistory(next, `${team === "player" ? "Jugador" : "IA"} prepara Afuera`);
      break;

    case "Presión":
      next = setSide(next, { ...side, pressureBonus: side.pressureBonus + 1 });
      next = appendHistory(next, `${team === "player" ? "Jugador" : "IA"} gana Presión (+1 equipo)`);
      break;

    case "Juego local":
      next = setSide(next, { ...side, localPassBonus: side.localPassBonus + 1 });
      next = appendHistory(next, `${team === "player" ? "Jugador" : "IA"} gana Juego local (+1 pase)`);
      break;

    case "Arco cerrado":
      next.activeEffects = { ...next.activeEffects, rivalShotMod: -2 };
      next = appendHistory(next, `${team === "player" ? "Jugador" : "IA"} activa Arco cerrado`);
      break;

    case "Inteligencia":
      next.activeEffects = { ...next.activeEffects, scouting: true };
      next = appendHistory(next, `${team === "player" ? "Jugador" : "IA"} usa Inteligencia`);
      break;
  }

  const refreshed = getSide(next, team);

  return setSide(next, {
    ...refreshed,
    specialHand: removeById(refreshed.specialHand, special.id),
  });
}

function finishTurn(state: GameState): GameState {
  const nextTurn: Team = state.turn === "player" ? "ai" : "player";

  let next: GameState = {
    ...state,
    turn: nextTurn,
    possession: nextTurn,
    attackChainCount: 0,
    activeEffects: {},
    selection: emptySelection,
    pendingAttack: null,
  };

  next = {
    ...next,
    stage: {
      ...next.stage,
      turnsInPhase: next.stage.turnsInPhase + 1,
    },
  };

  if (next.stage.turnsInPhase >= next.stage.maxTurnsInPhase) {
    if (next.stage.currentPhase === 3) {
      const winner =
        next.player.score === next.ai.score
          ? "Empate"
          : next.player.score > next.ai.score
            ? "Ganó el jugador"
            : "Ganó la IA";

      next = { ...next, ended: true, winner };
      return appendHistory(next, `Fin del partido: ${winner}`);
    }

    const nextPhase = (next.stage.currentPhase + 1) as 2 | 3;
    const phaseConfig = getPhaseConfig(nextPhase);

    const growSide = (side: SideState): SideState => {
      const players = drawMany(side.playersDeck, phaseConfig.playersToDraw);
      const opportunities = drawMany(side.opportunitiesDeck, phaseConfig.opportunityToDraw);
      const specials = drawMany(side.specialsDeck, phaseConfig.specialToDraw);

      return {
        ...side,
        playersDeck: players.remaining,
        opportunitiesDeck: opportunities.remaining,
        specialsDeck: specials.remaining,
        playerHand: [...side.playerHand, ...players.hand],
        opportunityHand: [...side.opportunityHand, ...opportunities.hand],
        specialHand: [...side.specialHand, ...specials.hand],
      };
    };

    next = {
      ...next,
      player: growSide(next.player),
      ai: growSide(next.ai),
      stage: {
        currentPhase: nextPhase,
        turnsInPhase: 0,
        maxTurnsInPhase: phaseConfig.maxTurnsInPhase,
      },
    };

    next = appendHistory(next, `Comienza la etapa ${nextPhase}`);
  }

  return next;
}

function resolveFieldBattle(
  attacker: FootballerCard,
  defender: FootballerCard,
  action: ActionType,
  attackOpportunity: OpportunityCard | undefined,
  defenseOpportunity: OpportunityCard | undefined,
  effects: ActiveEffects,
  attackerSide: SideState,
  defenderSide: SideState
) {
  const attackRoll = d6();
  const defenseRoll = d6();

  const attackAttr = attacker[attributeForAction(action)] + (effects.ownAttributeMod ?? 0);
  const defenseKey = defenderAttributeForAction(action);

  const ignoreDefense = action === "pass" && effects.ignoreAnticipation;
  const defenseAttr = (ignoreDefense ? 0 : defender[defenseKey]) + (effects.rivalAttributeMod ?? 0);

  const attackTotal =
    attackAttr +
    attackRoll +
    opportunityBoost(attackOpportunity, action) +
    (action === "pass" ? attackerSide.localPassBonus : 0);

  const defenseTotal =
    defenseAttr +
    defenseRoll +
    opportunityBoost(defenseOpportunity, action) +
    defenderSide.pressureBonus;

  const success = attackTotal > defenseTotal;

  const battleView: BattleView = {
    phase: "field",
    attackRoll,
    defenseRoll,
    attackTotal,
    defenseTotal,
    summary: `${action.toUpperCase()} ${attackTotal} vs ${defenseTotal} → ${success ? "éxito" : "defiende"}`,
  };

  return { success, battleView };
}

function resolveGoalkeeperBattle(
  attacker: FootballerCard,
  action: "shot" | "dribble",
  attackOpportunity: OpportunityCard | undefined,
  defendingSide: SideState,
  effects: ActiveEffects
) {
  const attackRoll = d6();
  const keeperRoll = d6();
  const die = specialDie();

  let baseAttack =
    attacker[action] +
    opportunityBoost(attackOpportunity, action) +
    (effects.ownAttributeMod ?? 0);

  if (action === "shot") {
    baseAttack += effects.rivalShotMod ?? 0;
  }

  let attackTotal = baseAttack + attackRoll;
  const defenseTotal =
    (action === "shot" ? defendingSide.goalkeeper.saveShot : defendingSide.goalkeeper.saveDribble) +
    keeperRoll +
    (effects.goalkeeperDefenseMod ?? 0);

  if (die === "VERDE") {
    attackTotal += 1;
  }

  const battleView: BattleView = {
    phase: "goalkeeper",
    attackRoll,
    defenseRoll: keeperRoll,
    attackTotal,
    defenseTotal,
    specialDie: die,
    summary: "",
  };

  if (die === "AZUL") {
    battleView.summary = "Dado especial AZUL → FUERA";
    return { outcome: "FUERA" as const, battleView };
  }

  if (die === "NARANJA") {
    battleView.summary = "Dado especial NARANJA → POSTE";
    return { outcome: "POSTE" as const, battleView };
  }

  const outcome = attackTotal > defenseTotal ? "GOAL" : "NO_GOAL";
  battleView.summary = `Arquero ${attackTotal} vs ${defenseTotal} → ${outcome}`;

  return { outcome, battleView };
}

export function setSelection(
  state: GameState,
  key: keyof SelectionState,
  value: string | null
): GameState {
  return {
    ...state,
    selection: {
      ...state.selection,
      [key]: state.selection[key] === value ? null : value,
    },
  };
}

export function beginPlayerAttack(state: GameState, action: ActionType): GameState {
  const { attackerId, secondAttackerId, attackOpportunityId, attackSpecialId } = state.selection;

  if (!attackerId) return state;
  if (action === "wall" && !secondAttackerId) return state;

  return {
    ...state,
    pendingAttack: {
      attackerTeam: "player",
      action,
      attackerId,
      secondAttackerId,
      attackOpportunityId,
      attackSpecialId,
    },
  };
}

export function beginAiAttack(state: GameState): GameState {
  const ai = getSide(state, "ai");

  if (ai.playerHand.length === 0) {
    return finishTurn(appendHistory(state, "La IA no tiene jugadores disponibles"));
  }

  const attacker = [...ai.playerHand].sort(
    (a, b) => b.shot + b.dribble + b.pass - (a.shot + a.dribble + a.pass)
  )[0];

  const opportunities = ai.opportunityHand;
  const special = ai.specialHand[0];

  let action: ActionType = "pass";
  if (state.attackChainCount >= 1 && attacker.shot >= 7) action = "shot";
  else if (attacker.dribble >= attacker.pass) action = "dribble";
  else action = "pass";

  const attackOpportunity =
    action === "shot"
      ? opportunities.find((card) => card.type === "Remate" || card.type === "Comodín")
      : action === "dribble"
        ? opportunities.find((card) => card.type === "Drible" || card.type === "Comodín")
        : opportunities.find((card) => card.type === "Pase" || card.type === "Comodín");

  let next = { ...state };

  if (special && Math.random() > 0.45) {
    next = applySpecialEffects(next, "ai", special);
  }

  next = appendHistory(next, `La IA prepara ${action}`);

  return {
    ...next,
    pendingAttack: {
      attackerTeam: "ai",
      action,
      attackerId: attacker.id,
      attackOpportunityId: attackOpportunity?.id ?? null,
      attackSpecialId: null,
    },
  };
}

export function autoPickDefense(state: GameState): GameState {
  if (!state.pendingAttack) return state;

  const defendingTeam: Team = state.pendingAttack.attackerTeam === "player" ? "ai" : "player";
  const defendingSide = getSide(state, defendingTeam);
  const defenseAttr = defenderAttributeForAction(state.pendingAttack.action);

  const defender = [...defendingSide.playerHand].sort((a, b) => b[defenseAttr] - a[defenseAttr])[0];
  const defenseOpportunity = defendingSide.opportunityHand.find(
    (card) => card.type === "Anticipación" || card.type === "Comodín"
  );

  return {
    ...state,
    selection: {
      ...state.selection,
      defenderId: defender?.id ?? null,
      defenseOpportunityId: defenseOpportunity?.id ?? null,
    },
  };
}

export function resolvePendingAttack(state: GameState): GameState {
  const pending = state.pendingAttack;
  if (!pending) return state;

  const attackingTeam = pending.attackerTeam;
  const defendingTeam: Team = attackingTeam === "player" ? "ai" : "player";

  let next = { ...state };

  if (pending.attackSpecialId) {
    const special = getSide(next, attackingTeam).specialHand.find(
      (card) => card.id === pending.attackSpecialId
    );
    next = applySpecialEffects(next, attackingTeam, special);
  }

  const attackingSide = getSide(next, attackingTeam);
  const defendingSide = getSide(next, defendingTeam);

  const attacker = attackingSide.playerHand.find((card) => card.id === pending.attackerId);
  const defender = defendingSide.playerHand.find((card) => card.id === next.selection.defenderId);

  const attackOpportunity = attackingSide.opportunityHand.find(
    (card) => card.id === pending.attackOpportunityId
  );
  const defenseOpportunity = defendingSide.opportunityHand.find(
    (card) => card.id === next.selection.defenseOpportunityId
  );

  if (!attacker || !defender) return next;

  const effectiveAttacker =
    pending.action === "wall" && pending.secondAttackerId
      ? {
          ...attacker,
          wall: Math.round(
            (attacker.wall +
              (attackingSide.playerHand.find((card) => card.id === pending.secondAttackerId)?.wall ??
                attacker.wall)) /
              2
          ),
        }
      : attacker;

  const field = resolveFieldBattle(
    effectiveAttacker,
    defender,
    pending.action,
    attackOpportunity,
    defenseOpportunity,
    next.activeEffects,
    attackingSide,
    defendingSide
  );

  next = { ...next, battleView: field.battleView };

  next = setSide(next, {
    ...defendingSide,
    playerHand: removeById(defendingSide.playerHand, defender.id),
    opportunityHand: removeById(defendingSide.opportunityHand, defenseOpportunity?.id),
  });

  const refreshedAttackingSide = getSide(next, attackingTeam);

  if (!field.success) {
    next = setSide(next, {
      ...refreshedAttackingSide,
      playerHand:
        pending.action === "wall"
          ? removeById(removeById(refreshedAttackingSide.playerHand, attacker.id), pending.secondAttackerId)
          : removeById(refreshedAttackingSide.playerHand, attacker.id),
      opportunityHand: removeById(refreshedAttackingSide.opportunityHand, attackOpportunity?.id),
    });

    next = appendHistory(
      next,
      `${defendingTeam === "player" ? "Jugador" : "IA"} detiene la jugada con ${defender.name}`
    );

    return finishTurn(next);
  }

  if (pending.action === "pass" || pending.action === "hold" || pending.action === "wall") {
    next = setSide(next, {
      ...refreshedAttackingSide,
      playerHand:
        pending.action === "wall"
          ? removeById(removeById(refreshedAttackingSide.playerHand, attacker.id), pending.secondAttackerId)
          : removeById(refreshedAttackingSide.playerHand, attacker.id),
      opportunityHand: removeById(refreshedAttackingSide.opportunityHand, attackOpportunity?.id),
    });

    next = appendHistory(
      next,
      `${attackingTeam === "player" ? "Jugador" : "IA"} gana la acción ${pending.action}`
    );

    return {
      ...next,
      attackChainCount: next.attackChainCount + 1,
      pendingAttack: null,
      selection: emptySelection,
    };
  }

  const keeper = resolveGoalkeeperBattle(
    attacker,
    pending.action === "shot" ? "shot" : "dribble",
    attackOpportunity,
    getSide(next, defendingTeam),
    next.activeEffects
  );

  next = { ...next, battleView: keeper.battleView };

  const updatedAttackingSide = getSide(next, attackingTeam);
  next = setSide(next, {
    ...updatedAttackingSide,
    playerHand: removeById(updatedAttackingSide.playerHand, attacker.id),
    opportunityHand: removeById(updatedAttackingSide.opportunityHand, attackOpportunity?.id),
  });

  if (keeper.outcome === "FUERA") {
    next = appendHistory(next, `${attackingTeam === "player" ? "Jugador" : "IA"} la tira afuera`);
    return finishTurn(next);
  }

  if (keeper.outcome === "POSTE") {
    next = appendHistory(
      next,
      `¡Poste! sigue la presión del ${attackingTeam === "player" ? "jugador" : "ataque rival"}`
    );
    return {
      ...next,
      pendingAttack: null,
      selection: emptySelection,
    };
  }

  if (keeper.outcome === "NO_GOAL") {
    next = appendHistory(
      next,
      `${defendingTeam === "player" ? "Tu arquero ataja" : "El arquero rival ataja"}`
    );
    return finishTurn(next);
  }

  if (attackingTeam === "player" && next.pendingGoalCancelForPlayer) {
    next = { ...next, pendingGoalCancelForPlayer: false };
    next = appendHistory(next, "Gol del jugador anulado por Afuera");
    return finishTurn(next);
  }

  if (attackingTeam === "ai" && next.pendingGoalCancelForAI) {
    next = { ...next, pendingGoalCancelForAI: false };
    next = appendHistory(next, "Gol de la IA anulado por Afuera");
    return finishTurn(next);
  }

  const scorer = getSide(next, attackingTeam);
  next = setSide(next, {
    ...scorer,
    score: scorer.score + 1,
  });

  next = appendHistory(next, `¡Gol del ${attackingTeam === "player" ? "jugador" : "IA"}!`);
  return finishTurn(next);
}