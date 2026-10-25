# Comeback Card System — Game Design & Original Art Specification

## Purpose
The 10v10 format is an elimination battle, **not** ten separate rounds. Every fighter has one life, the last team with living fighters wins, and a defeated champion is never revived. Combacks restore player agency when a battle turns against them, not a way to manufacture an endless fight. The first, third, and fifth allied KOs unlock a *three-card choice*. A maximum of three awards per team are available; the other team receives their own distinct, deterministic three-card choices on the same casualty thresholds.

When multiple allies fall before the player has chosen, drafts **queue without expiring or blocking combat**, so the player is never punished for prioritizing dodging and attacks. Number keys **1 / 2 / 3** choose; the next queued choice appears immediately. The autonomous red commander takes a bounded counterpick. Chosen effects last for the rest of that battle and are reset on Enter-to-replay. They do not add fighters or refill the eliminated roster.

## Six cards and gameplay identity

| ID | Name | Reward | Strategic identity |
| --- | --- | --- | --- |
| `war-cry` | War Cry | +16% outgoing team damage | A comeback through risky aggression; boosts every surviving fighter |
| `shieldwall` | Shieldwall | 14% less incoming team damage | A counter to overwhelming pressure; reduction applies before shields and Sentinel interception |
| `swift-march` | Swift March | +18% movement speed | Close distance, retreat and reach higher-value targets |
| `field-medics` | Field Medics | Heal each *living* friendly fighter by 14 HP up to the existing maximum | Buys endurance but cannot save eliminated fighters |
| `war-chest` | War Chest | +55 defense supply | Enables timely turrets, traps and shields for a player who has lost ground |
| `deadeye` | Deadeye | +22% team ranged damage | Rewards flanking and ranged control of upper gantries |

The combat model limits bonuses to +48% global offense, +50% ranged specialization, +50% movement and at most 35% incoming damage reduction from cards. Shield absorption, Sentinel interception and base champion guard operate under their established rules. Zero-damage hits never consume mitigation. Every battle restarts with no cards.

**Player-choice rhythm:** the player can choose from three cards at the first blue casualty, another rotating trio at the third, and the final rotating trio at the fifth. War Cry and Shieldwall define the risk/reward polarity; Field Medics offers an immediate, finite stabilizer; War Chest supports the existing defense-placement system. The enemy commander favors Swift March, Deadeye and War Cry because its currently implemented AI fights autonomously rather than constructing new defensive structures.

**QA acceptance:** losing five blue fighters before selecting anything must preserve three successive offers; choosing all three must neither revive the dead champion nor increase `EliminationMatch.remaining()`. Verify perks affect actual attack, movement, and mitigation paths, and that replay clears the whole draft state. The headless 10v10 tests are not visual browser QA.

## Required production card illustration bible

All artwork must be **new, hand-authored**, consistent with Fire Dragon Interactive's brutal yet readable fantasy/modern/sci-fi blend. Do not copy identifiable franchise icons, stock clipart, procedural shapes, or unrelated scraped images. Deliver layered source masters (PSD, Krita or other editable layered format), plus edge-clean transparent or painted PNGs **1024 × 1024**, 16-bit master if supported and sRGB export. Each icon must read at 96 × 96 and 192 × 192 at regular playing distance; art-direction review must cover contrast and readability for accessibility.

- **War Cry:** a battered herald trumpet and torn war banner surging through curling sparks; warm copper and scarlet, hand-painted metal dents, strong diagonal silhouette.
- **Shieldwall:** interlocking medieval tower shield, modern riot plate and sci-fi energy edge pressed against an incoming impact; cobalt blue and steel with pale deflection highlights.
- **Swift March:** three bootprints disappearing toward a scorched horizon, a winged greave in front; ochre dust and emerald momentum streaks, strong left-to-right action.
- **Field Medics:** a weathered medic satchel, clean bandages and a glass restorative phial; antique ivory, moss green and copper, practical nonmagical utility.
- **War Chest:** a reinforced campaign coffer containing ration seals, ammunition and spare parts; weathered gold/bronze, legible resource silhouette.
- **Deadeye:** a keen-eyed ranger framed by a cross-era scope and a single arrow/bullet sight line; nocturnal violet and silver, disciplined precision.

UI cards will be treated as **finished informational choices**, not art stand-ins. Current developer-facing text choices communicate real gameplay effects but do not satisfy the final illustration standard. When the six illustrations arrive and are approved, integrate the art in the card picker, allow gamepad navigation, and extend the strict release inventory and rights register to include them. Do not label the card feature art-complete until that work is done.

## Source of truth
Implementation: `src/systems/comeback-draft.js`; live integration: `src/main.js`; tests: `tests/comeback-draft.test.js` and `tests/comeback-match.test.js`. These rules supersede the legacy `CombatDirector.finishRound()` card model, which is not used in the current single-elimination arena mode.
