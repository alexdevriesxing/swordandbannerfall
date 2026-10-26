# Local two-player match (one keyboard, 10 versus 10)

**Sword & Bannerfall** supports the default **VS AI** mode and an optional **Local 2P** mode, selected by pressing **P during the 12-second preparation period**. This is *not* online multiplayer and does not require servers or recurring Cloudflare D1 reads.

Both teams retain their full ten-fighter elimination rosters: one human-controlled champion and nine autonomous allies per side. Players direct their own champions and issue simple squad commands rather than micromanaging every unit. The selected control mode is locked when the match starts; restarting a full Windows-mode match returns to VS AI, and the limited HTML5 preview still permits only one match.

| | Blue champion / Player 1 | Red champion / Player 2 |
|---|---|---|
| Move | A / D | Left / Right arrows |
| Jump | W / Space | Up arrow |
| Drop from a gantry | S | Down arrow |
| Melee attack | J | U |
| Ranged attack | K | I |
| Hold Guard | L | O |
| Cycle guard/patrol/hunt orders | E | R |
| Build trap / turret / shield | F / G / H | V / B / N |
| Choose a comeback card | 1 / 2 / 3 | Q / T / Y |

**Shared:** P toggles VS AI / Local 2P **before** combat only. Enter starts the battle. Escape pauses/resumes the entire match.

## Fair setup economy

The standard VS AI encounter starts with two author-authored red defensive placements (a turret and a shield), correctly deducted from the red AI's budget. Selecting Local 2P removes those initial automated defenses, refunds their exact catalog costs and gives the red human champion the full starting supply of 100. Player 2 can purchase defenses with V/B/N, subject to the same territory, overlap and cost restrictions as blue. Switching back to VS AI removes and refunds the red human's purchases and recreates the intended AI setup. Once fighting starts the mode cannot be changed; the automated red defense director is disabled in Local 2P so it cannot secretly spend the human player's budget.

During Local 2P, red champion movement, attacks, stance and tactical orders come only from Player 2's keyboard. The existing enemy-champion pursuit/shooting algorithm runs only in VS AI. Red AI escorts still autonomously fight under the red human's current guard/patrol/hunt order. Both teams earn their own comeback cards when losing roster members; unlike VS AI, where the enemy captain chooses cards automatically, the red human chooses Q/T/Y and sees the approved original card art. The blue card display takes priority when both teams have pending offers; either human's corresponding keys can resolve their selection.

## Testability and release limits

`tests/match-control-mode.test.js` covers the default mode, pre-match toggles and post-start lock. The production-art-gated real Chromium runner `scripts/browser-local-2p-smoke.mjs` checks red initial-defense refunds, purchase costs and duplicate placement rejection, mode changes back and forth, red champion movement/jumping, stance/order input, and the impossibility of changing controllers mid-battle. The existing `scripts/browser-smoke.mjs` separately tests the default VS AI match to a natural win and full replay. Both run from the manual `Full Chromium gameplay and replay QA` GitHub Actions workflow after the original SHA-locked artwork clears the mandatory license/art gate.

The model and compiled JavaScript have not yet replaced actual Chromium testing. The remaining original 17 textures must be committed, and a complete 2P hands-on balance / performance / UX review is required before commercial release.
