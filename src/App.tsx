import { useEffect, useMemo, useState } from "react";
import {
  autoPickDefense,
  beginAiAttack,
  beginPlayerAttack,
  initialGame,
  resolvePendingAttack,
  setSelection,
} from "./game/engine";
import { formatFootballer } from "./game/utils";
import type { ActionType, GameState, OpportunityCard, Team } from "./game/types";

const actionLabels: Record<ActionType, string> = {
  pass: "Pase",
  dribble: "Drible",
  shot: "Remate",
  hold: "Retener",
  wall: "Pared",
};

const actionHints: Record<ActionType, string> = {
  pass: "Mantiene la posesión si superas la anticipación rival.",
  dribble: "Si ganas el duelo, encaras al arquero.",
  shot: "Solo conviene cuando tu cadena ofensiva ya está armada.",
  hold: "Sirve para sostener la jugada y preparar el remate.",
  wall: "Necesita un segundo atacante y promedia su atributo de pared.",
};

function teamLabel(team: Team) {
  return team === "player" ? "Jugador" : "IA";
}

function opportunityFitsAction(card: OpportunityCard, action: ActionType) {
  return (
    card.type === "Comodín" ||
    (action === "pass" && card.type === "Pase") ||
    (action === "dribble" && card.type === "Drible") ||
    (action === "shot" && card.type === "Remate") ||
    (action === "hold" && card.type === "Retener") ||
    (action === "wall" && card.type === "Pared")
  );
}

export default function App() {
  const [game, setGame] = useState<GameState>(initialGame());
  const [selectedAction, setSelectedAction] = useState<ActionType>("pass");

  const selectedAttacker = game.player.playerHand.find((p) => p.id === game.selection.attackerId);
  const selectedSecondAttacker = game.player.playerHand.find(
    (p) => p.id === game.selection.secondAttackerId
  );
  const selectedOpportunity = game.player.opportunityHand.find(
    (card) => card.id === game.selection.attackOpportunityId
  );
  const selectedSpecial = game.player.specialHand.find(
    (card) => card.id === game.selection.attackSpecialId
  );

  const pendingAttack = game.pendingAttack;

  const playerAttacking = game.turn === "player" && !pendingAttack && !game.ended;
  const playerChoosingDefense = pendingAttack?.attackerTeam === "player";
  const playerDefending = pendingAttack?.attackerTeam === "ai";

  const playableOpportunities = useMemo(
    () =>
      game.player.opportunityHand.filter((card) => opportunityFitsAction(card, selectedAction)),
    [game.player.opportunityHand, selectedAction]
  );

  useEffect(() => {
    if (game.turn === "ai" && !game.pendingAttack && !game.ended) {
      const id = setTimeout(() => {
        setGame((prev) => beginAiAttack(prev));
      }, 600);
      return () => clearTimeout(id);
    }
  }, [game]);

  useEffect(() => {
    if (playerChoosingDefense) {
      setGame((prev) => autoPickDefense(prev));
    }
  }, [playerChoosingDefense]);

  useEffect(() => {
    if (
      game.selection.attackOpportunityId &&
      !playableOpportunities.some((card) => card.id === game.selection.attackOpportunityId)
    ) {
      setGame((prev) => setSelection(prev, "attackOpportunityId", prev.selection.attackOpportunityId));
    }
  }, [game.selection.attackOpportunityId, playableOpportunities]);

  useEffect(() => {
    if (selectedAction !== "wall" && game.selection.secondAttackerId) {
      setGame((prev) => setSelection(prev, "secondAttackerId", prev.selection.secondAttackerId));
    }
  }, [selectedAction, game.selection.secondAttackerId]);

  function startAttack(action: ActionType) {
    setSelectedAction(action);
    setGame((prev) => beginPlayerAttack(prev, action));
  }

  function resolve() {
    setGame((prev) => resolvePendingAttack(prev));
  }

  return (
    <div className="app">
      <header className="header">
        <div>
          <h1>La Carta del Gol</h1>
          <p className="subtitle">MVP táctico por turnos: arma la jugada y rompe la defensa rival.</p>
        </div>
        <button onClick={() => setGame(initialGame())}>Nueva partida</button>
      </header>

      <div className="scoreboard">
        <div>Jugador: {game.player.score}</div>
        <div>
          Etapa {game.stage.currentPhase} · Turno {game.stage.turnsInPhase + 1}/{game.stage.maxTurnsInPhase}
        </div>
        <div>IA: {game.ai.score}</div>
      </div>

      {game.ended && <div className="winner">{game.winner}</div>}

      <div className="pitch">
        <div className="goal">Arco IA</div>

        <div className="center">
          <div className="status-pill">Posesión: {teamLabel(game.possession)}</div>

          {!pendingAttack && (
            <div className="turn-summary">
              <strong>{teamLabel(game.turn)}</strong> ataca.
              <div>{actionHints[selectedAction]}</div>
            </div>
          )}

          {pendingAttack && (
            <div className="turn-summary">
              {teamLabel(pendingAttack.attackerTeam)} ejecuta {actionLabels[pendingAttack.action]}
            </div>
          )}

          {game.battleView && (
            <div className="battle">
              <div>Fase: {game.battleView.phase === "field" ? "Duelo de campo" : "Arquero"}</div>
              <div>Ataque: {game.battleView.attackTotal}</div>
              <div>Defensa: {game.battleView.defenseTotal}</div>
              {game.battleView.specialDie && <div>Dado especial: {game.battleView.specialDie}</div>}
              <div>{game.battleView.summary}</div>
            </div>
          )}
        </div>

        <div className="goal">Arco Jugador</div>
      </div>

      <section className="panel-grid">
        <div className="panel">
          <h3>Preparar ataque</h3>
          <div className="selection-summary">
            <div>Atacante: {selectedAttacker?.name ?? "Sin elegir"}</div>
            {selectedAction === "wall" && (
              <div>Socio de pared: {selectedSecondAttacker?.name ?? "Falta elegir"}</div>
            )}
            <div>
              Oportunidad: {selectedOpportunity ? `${selectedOpportunity.type} (+${selectedOpportunity.value})` : "Ninguna"}
            </div>
            <div>Especial: {selectedSpecial?.type ?? "Ninguna"}</div>
          </div>

          <div className="actions action-grid">
            {Object.keys(actionLabels).map((a) => (
              <button
                key={a}
                className={selectedAction === a ? "selected action-button" : "action-button"}
                disabled={!playerAttacking || !selectedAttacker}
                onClick={() => startAttack(a as ActionType)}
              >
                {actionLabels[a as ActionType]}
              </button>
            ))}
          </div>

          <p className="hint">Tip: puedes dejar cartas sin usar o reservar la especial para otra jugada.</p>
        </div>

        <div className="panel">
          <h3>Jugadores</h3>
          <div className="card-grid">
            {game.player.playerHand.map((p) => {
              const isPrimary = game.selection.attackerId === p.id;
              const isSecondary = game.selection.secondAttackerId === p.id;

              return (
                <button
                  key={p.id}
                  className={isPrimary || isSecondary ? "card-button selected" : "card-button"}
                  onClick={() => {
                    if (selectedAction === "wall" && game.selection.attackerId && game.selection.attackerId !== p.id) {
                      setGame((prev) => setSelection(prev, "secondAttackerId", p.id));
                      return;
                    }

                    setGame((prev) => setSelection(prev, "attackerId", p.id));
                  }}
                >
                  <strong>{p.name}</strong>
                  <span>{formatFootballer(p)}</span>
                  {isPrimary && <small>Atacante</small>}
                  {isSecondary && <small>Socio pared</small>}
                </button>
              );
            })}
          </div>
        </div>

        <div className="panel">
          <h3>Oportunidades</h3>
          <div className="card-grid compact-grid">
            {game.player.opportunityHand.map((card) => {
              const playable = opportunityFitsAction(card, selectedAction);
              return (
                <button
                  key={card.id}
                  className={
                    game.selection.attackOpportunityId === card.id
                      ? "card-button selected"
                      : playable
                        ? "card-button"
                        : "card-button muted"
                  }
                  disabled={!playerAttacking || !playable}
                  onClick={() => setGame((prev) => setSelection(prev, "attackOpportunityId", card.id))}
                >
                  <strong>{card.type}</strong>
                  <span>+{card.value}</span>
                </button>
              );
            })}
          </div>
          {playableOpportunities.length === 0 && <p className="hint">No tienes cartas compatibles con {actionLabels[selectedAction]}.</p>}
        </div>

        <div className="panel">
          <h3>Especiales</h3>
          <div className="card-grid compact-grid">
            {game.player.specialHand.map((card) => (
              <button
                key={card.id}
                className={game.selection.attackSpecialId === card.id ? "card-button selected" : "card-button"}
                disabled={!playerAttacking}
                onClick={() => setGame((prev) => setSelection(prev, "attackSpecialId", card.id))}
              >
                <strong>{card.type}</strong>
              </button>
            ))}
          </div>
        </div>

        <div className="panel">
          <h3>Defensa</h3>
          <div className="card-grid compact-grid">
            {(playerChoosingDefense ? game.ai.playerHand : game.player.playerHand).map((p) => (
              <button
                key={p.id}
                className={game.selection.defenderId === p.id ? "card-button selected" : "card-button"}
                onClick={() => setGame((prev) => setSelection(prev, "defenderId", p.id))}
              >
                <strong>{p.name}</strong>
              </button>
            ))}
          </div>

          {(playerChoosingDefense || playerDefending) && (
            <button onClick={resolve} className="resolve">
              Resolver jugada
            </button>
          )}
        </div>
      </section>

      <div className="history panel">
        <h3>Historial</h3>
        {game.history.map((h, i) => (
          <div key={i}>{h}</div>
        ))}
      </div>
    </div>
  );
}
