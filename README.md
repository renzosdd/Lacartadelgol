# ⚽ La Carta del Gol

Juego web táctico de fútbol por turnos basado en cartas, dados y estrategia.

Este proyecto es un **MVP funcional** desarrollado con React + TypeScript usando Vite.

---

## 🎮 Descripción

“La Carta del Gol” es un juego donde dos equipos (Jugador vs IA) compiten por marcar más goles mediante:

- cartas de jugadores
- cartas de oportunidad
- cartas especiales
- tiradas de dados
- decisiones tácticas

Cada turno simula una jugada ofensiva completa.

---

## 🚀 Stack Tecnológico

- React
- TypeScript
- Vite
- CSS puro

👉 Vite se usa como servidor de desarrollo rápido con hot reload y build optimizado :contentReference[oaicite:0]{index=0}

---

## 📦 Instalación

### 1. Clonar o crear proyecto

```bash
git clone <tu-repo>
cd la-carta-del-gol

O crear desde cero:

npm create vite@latest la-carta-del-gol -- --template react-ts

👉 Este comando genera un proyecto React + TypeScript listo para usar

2. Instalar dependencias
npm install
3. Ejecutar el juego
npm run dev

Abrir en navegador:

http://localhost:5173

👉 Vite levanta un servidor local con recarga instantánea (HMR)

🧠 Arquitectura del Proyecto
src/
  App.tsx              → UI principal
  styles.css           → estilos globales

  game/
    engine.ts          → lógica central del juego
    types.ts           → tipos de datos
    constants.ts       → configuración
    utils.ts           → helpers
⚙️ Mecánicas del Juego
🎯 Objetivo

Marcar más goles que la IA.

🕒 Etapas
Etapa	Jugadores	Oportunidades	Especial
1	3	5	1
2	3	5	1
3	4	7	1
🔁 Flujo de Turno

Seleccionar atacante

Elegir acción:

Pase

Drible

Remate

Retener

Pared

Elegir carta de oportunidad (opcional)

Elegir carta especial (opcional)

Elegir defensa rival

Resolver batalla

Si corresponde → arquero

Resultado:

Gol

No gol

Poste

Fuera

Cambio de turno

⚔️ Sistema de Batalla
Ataque = atributo + carta + dado (d6)
Defensa = atributo + carta + dado (d6)

👉 Empate gana la defensa

🧤 Arquero

Se activa después de superar la defensa.

Ataque = atributo + d6 + dado especial
Defensa = arquero + d6
🎲 Dado especial
Color	Resultado
Azul	Fuera
Naranja	Poste
Verde	+1
Blanco	Normal
🃏 Cartas
Jugadores

Atributos (1–10):

Remate

Pase

Drible

Pared

Marca

Retener

Anticipación

Oportunidad

Pase

Remate

Drible

Anticipación

Retener

Pared

Comodín (+5)

Especiales

Confianza → +2

Temor → -2 rival

Movimiento rápido → ignora defensa

Distracción → -3 arquero

Contra-ataque → directo al arquero

Afuera → anula gol

Presión → +1 defensa

Juego local → +1 pase

Arco cerrado → -2 remate rival

Inteligencia → ver rival

🤖 IA

La IA toma decisiones simples:

si puede rematar → remata

si no → pase o drible

usa cartas automáticamente

🖥️ UI

Incluye:

cancha visual

marcador

historial

mano de cartas

selección de ataque y defensa

resolución de jugadas

🧪 Estado actual (MVP)

✅ Jugable
✅ Ataque vs defensa real
✅ IA funcional
✅ Sistema de cartas
✅ Arquero + dado especial
✅ Etapas completas

🔜 Próximos pasos

Animaciones de jugadas

Posicionamiento real en cancha

IA avanzada

Multiplayer online

Sistema de energía o stamina

Cartas con efectos persistentes

🧑‍💻 Desarrollo
Build producción
npm run build

👉 Genera carpeta /dist lista para deploy

🧠 Filosofía del código

lógica desacoplada (engine.ts)

UI separada

estado central simple

fácil de escalar a online

📄 Licencia

MIT

⚽ Autor

Proyecto creado como prototipo de videojuego táctico web.

💬 Nota final

Este proyecto está diseñado para evolucionar a:

👉 juego competitivo online tipo carta táctica + fútbol