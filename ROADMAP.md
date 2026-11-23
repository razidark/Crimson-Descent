# Vampire Task Heroes — Production Roadmap

---

## ✅ Phase 1 — Done

| Area | Item | File |
|---|---|---|
| Art | Enemy spritesheets (5 types, 2-frame animated) | `assets/enemies.png` |
| Art | Hero spritesheets (3 heroes, 2-frame animated) | `assets/heroes.png` |
| Art | Weapons & skills icons (11 icons) | `assets/skills.png` |
| Art | Relic gear icons (24 items, 8×3 grid) | `assets/relics.png` |
| Art | Environment tiles, bonfire, portal | `assets/levels.png` etc. |
| System | Core combat loop (weapons, enemies, orbs) | `useGameState.ts` |
| System | 5 weapon types with auto-fire ticks | `useGameState.ts` |
| System | 3 hero ultimates with cooldowns | `useGameState.ts` |
| System | Relic types: weapon / armor / accessory | `types/game.ts` |
| System | Run stats & lifetime stats tracking | `useGameState.ts` |
| System | Blood meta-upgrade data model | `types/game.ts` |
| Graphics | **3D WebGL Isometric Engine** — hardware accelerated | `DarknessEngine.ts` |
| Graphics | **Dynamic Soft Shadows & Lighting** — torchlight & wall lights | `DarknessEngine.ts` |
| Graphics | **Wet Stone Reflections** — gloss maps & water puddles | `DarknessEngine.ts` |
| Graphics | **Smooth Camera Orbit** — 45-degree rotation with `[A]` / `[D]` | `DarknessEngine.ts` |
| UI | Coffin Vault — hero level & equipment panel | `CoffinVault.tsx` |
| UI | Crypt Inventory — Diablo-style grid + double-bordered tooltips | `CryptInventory.tsx` |
| UI | Castle Boiler — overclock speed control | `CastleBoiler.tsx` |
| UI | System Defrag — sector grid minigame | `SystemDefrag.tsx` |
| UI | DracConsole — terminal log + basic commands | `DracConsole.tsx` |
| UI | Coven HUD — hero portraits + HP bars | `CovenHUD.tsx` |
| UI | Taskbar — sprite lane, tray icons, flyout panel | `Taskbar.tsx` |
| Audio | **Title Screen Pause** — silence combat loop in main menu | `useGameState.ts` |
| Combat | **Auto-Attack (Claymore Cleave)** — auto-swings at nearby enemies | `useGameState.ts` / `DarknessEngine.ts` |
| Combat | **Q Key Spell Binding** — press Q to cast Blood Nova | `App.tsx` / `useGameState.ts` |
| HUD | **Objective & Tutorial Panel** — live monster counter + key guide | `App.tsx` |

---

## ✅ Phase 2 — Done

| Priority | Item | File | Notes |
|---|---|---|---|
| 🔴 High | **High-Polygon Character** | `DarknessEngine.ts` | Upgrade Vlad's mesh with detailed armor plates and helmet plume |
| 🔴 High | **3D Compound Bricks** | `DarknessEngine.ts` | Replace flat walls with complex stone groups (core, trims, loose bricks) |
| 🔴 High | **Overhead Gothic Arches** | `DarknessEngine.ts` | Add overhead stone arches that catch light and frame the camera |
| 🟡 Med | **Atmospheric Mist & Smoke** | `DarknessEngine.ts` | Add semi-transparent drifting mist and rising torch smoke |
| 🟡 Med | **CovenStats** — live run timer, DPS bars, kill counts, lifetime records | `CovenStats.tsx` [NEW] | Wire `runStats` + `lifetimeStats` from state |
| 🟡 Med | **BloodAltar** — spend blood on 4 permanent upgrades (HP / lifesteal / CDR / XP) | `BloodAltar.tsx` [NEW] | Wire `buyBloodUpgrade` action |
| 🟡 Med | **Taskbar buttons** — add 📊 Stats and 🩸 Altar flyout triggers | `Taskbar.tsx` | Add beside existing boiler/defrag buttons |
| 🟢 Low | **Desktop wiring** — add `stats` + `altar` cases to flyout renderer | `Desktop.tsx` | + expose new actions from `useGameState` |
| 🟢 Low | **DracConsole commands** — `/warp`, `/spawn_boss`, `/defrag_all`, `/grant_blood`, `/reset` | `DracConsole.tsx` + `useGameState.ts` | Partial — needs 5 more commands |

---

## 🔨 Phase 3 — In Progress (Next)

| Item | Notes |
|---|---|
| **Achievements system** | 4 badges unlocked via `lifetimeStats`, award relics on unlock |
| **Desktop wallpaper switcher** | 3 themes: gothic mist, castle moon, terminal grid |
| **Consumables & materials icons** | New spritesheet for potions, crafting ingredients |
| **Lore Bible & Script** | Complete Legacy of Kain / Raziel narrative in `LORE_BIBLE.md` |
| **Godot 4 Architecture** | Migration blueprint for native Vulkan 3D ARPG engine in `LORE_BIBLE.md` |
| **Save slots & export** | 3 named save slots, JSON export/import |
| **Boss cinematic** | Screen flash + boss title card on wave 10 |

---

## 📜 Narrative Architecture & Canon Summary (See `LORE_BIBLE.md`)
- **Sanctuary Hub:** The Hamlet of Lorek.
- **The Immortal Mentor:** **Raziel** (The Spectral Sage) — acts as our Deckard Cain & Tyrael. Anchors portals, blesses the player, and imparts ancient Nosgoth lore.
- **The Protagonist:** **The Fledgling of the Razielim** (Player) — one of Raziel's surviving spawns who inherits physical vampirism and ethereal soul-siphoning.
- **The Wound:** **The Crimson Rupture** — a subterranean tear bleeding corrupted vitae and ancient spirits beneath the ruined Pillars.
- **The Final Tragic Antagonist:** **Lord Kain** (The Corrupted Scion) — fallen to madness over millennia; the player must descend to deliver holy mercy.
- **3 Corruption Hypotheses for Parallel Review:** Detailed in [`LORE_BIBLE.md`](./LORE_BIBLE.md) (A: Elder God Parasite, B: Reaver Soul Backlash, C: Primordial Siphon).
