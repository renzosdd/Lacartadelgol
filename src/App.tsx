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
import type { ActionType, GameState, Team } from "./game/types";

const actionLabels: Record<ActionType, string> = {
  pass: "Pase",
  dribble: "Drible",
  shot: "Remate",
  hold: "Retener",
  wall: "Pared",
};

function teamLabel(team: Team) {
  return team === "player" ? "Jugador" : "IA";
}

export default function App() {
  const [game, setGame] = useState<GameState>(initialGame());

  const selectedAttacker = game.player.playerHand.find(p => p.id === game.selection.attackerId);

  const pendingAttack = game.pendingAttack;

  const playerAttacking = game.turn === "player" && !pendingAttack && !game.ended;
  const playerChoosingDefense = pendingAttack?.attackerTeam === "player";
  const playerDefending = pendingAttack?.attackerTeam === "ai";

  useEffect(() => {
    if (game.turn === "ai" && !game.pendingAttack && !game.ended) {
      const id = setTimeout(() => {
        setGame(prev => beginAiAttack(prev));
      }, 600);
      return () => clearTimeout(id);
    }
  }, [game]);

  useEffect(() => {
    if (playerChoosingDefense) {
      setGame(prev => autoPickDefense(prev));
    }
  }, [playerChoosingDefense]);

  function startAttack(action: ActionType) {
    setGame(prev => beginPlayerAttack(prev, action));
  }

  function resolve() {
    setGame(prev => resolvePendingAttack(prev));
  }

  return (
    <div className="app">
      <header className="header">
        <h1>La Carta del Gol</h1>
        <button onClick={() => setGame(initialGame())}>Nueva partida</button>
      </header>

      <div className="scoreboard">
        <div>Jugador: {game.player.score}</div>
        <div>Etapa {game.stage.currentPhase}</div>
        <div>IA: {game.ai.score}</div>
      </div>

      {game.ended && <div className="winner">{game.winner}</div>}

      <div className="pitch">
        <div className="goal">Arco IA</div>

        <div className="center">
          {!pendingAttack && <div>Selecciona acción</div>}

          {pendingAttack && (
            <div>
              {teamLabel(pendingAttack.attackerTeam)} ejecuta{" "}
              {actionLabels[pendingAttack.action]}
            </div>
          )}

          {game.battleView && (
            <div className="battle">
              <div>Ataque: {game.battleView.attackTotal}</div>
              <div>Defensa: {game.battleView.defenseTotal}</div>
              <div>{game.battleView.summary}</div>
            </div>
          )}
        </div>

        <div className="goal">Arco Jugador</div>
      </div>

      <div className="actions">
        {Object.keys(actionLabels).map(a => (
          <button
            key={a}
            disabled={!playerAttacking || !selectedAttacker}
            onClick={() => startAttack(a as ActionType)}
          >
            {actionLabels[a as ActionType]}
          </button>
        ))}
      </div>

      {(playerChoosingDefense || playerDefending) && (
        <button onClick={resolve} className="resolve">
          Resolver
        </button>
      )}

      <div className="hands">
        <div>
          <h3>Jugadores</h3>
          {game.player.playerHand.map(p => (
            <button
              key={p.id}
              className={game.selection.attackerId === p.id ? "selected" : ""}
              onClick={() => setGame(prev => setSelection(prev, "attackerId", p.id))}
            >
              {p.name}
              <br />
              {formatFootballer(p)}
            </button>
          ))}
        </div>

        <div>
          <h3>Defensa</h3>
          {(playerChoosingDefense ? game.ai.playerHand : game.player.playerHand).map(p => (
            <button
              key={p.id}
              className={game.selection.defenderId === p.id ? "selected" : ""}
              onClick={() => setGame(prev => setSelection(prev, "defenderId", p.id))}
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      <div className="history">
        {game.history.map((h, i) => (
          <div key={i}>{h}</div>
        ))}
      </div>
    </div>
  );
}