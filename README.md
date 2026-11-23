# Crimson Descent

> **The Legacy of Raziel** — a dark fantasy gothic action-roguelike played inside a
> simulated desktop OS. *Diablo* meets *Legacy of Kain*, with Shakespearean tragedy,
> gothic melancholy and operatic dread.

You are the last spawn of **Raziel**, the final scion of the wiped-out Razielim clan.
You inherit his dual nature: the physical ferocity of a vampire, and the ethereal blue
soul-fire that lets you perceive the spectral rift and siphon souls from the fallen.
Your destiny is the **Crimson Rupture** — the chasm torn into the belly of Nosgoth.

---

## Tech stack

| | |
|---|---|
| Renderer | React 19 + TypeScript |
| 3D | three.js (WebGL), post-processing via `EffectComposer` / `GTAOPass` / `UnrealBloomPass` |
| Animation | Framer Motion |
| Icons | lucide-react |
| Shell | Electron (desktop) |
| Build | Vite + `tsc -b` |

## Requirements

- Node.js 20+
- npm (or pnpm)

## Getting started

```bash
npm install
npm run dev          # Vite dev server -> http://127.0.0.1:5181
```

### Desktop

```bash
npm run electron:dev   # run inside Electron
npm run build:exe      # package a Windows .exe
```

### Other scripts

| Script | Does |
|---|---|
| `npm run build` | type-check (`tsc -b`) then build to `dist/` |
| `npm run lint` | ESLint |
| `npm run preview` | serve the production build |

## Project layout

```
src/
  engine/       Three.js game engines (DarknessEngine, GothicCanvasEngine)
  hooks/        React state for the game loop (useGameState)
  components/   UI (HUD, inventory, dialogue, ...)
  types/        Shared game types
main.cjs        Electron main process
```

The bulk of the game lives in `src/engine/DarknessEngine.ts` — the dungeon renderer,
raycasting, lighting, particle systems and input handling.

## Narrative design

The full world, cast and story architecture live in
[`LORE_BIBLE.md`](LORE_BIBLE.md). Development plans are in
[`ROADMAP.md`](ROADMAP.md).

## Security note

The renderer is pure React + three.js and uses **no Node API**. The Electron window
therefore runs with `nodeIntegration: false`, `contextIsolation: true` and
`sandbox: true` — there is no path from page content to the filesystem.

## Credits

Built by **RZL Apps**.
