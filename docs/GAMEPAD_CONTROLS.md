# Gamepad support: Windows and limited browser demo

Sword & Bannerfall can be played with keyboard and standard-mapping Xbox / PlayStation-style gamepads. Phaser 4's Scene-owned Gamepad Plugin is enabled with `input:{gamepad:true}`. Controllers may need a button press before a browser considers them connected. Physical-controller compatibility and latency **have not yet been validated** on Windows or in Chromium because the licensed artwork gate currently prevents a playable boot.

In **VS AI**, the first connected controller operates the blue champion while the red champion remains AI-driven. In **Local 2P**, the first controller operates the blue champion and the second controller operates the red champion. Either or both players may use the keyboard instead, and a single controller plus keyboard works. Controllers never control the autonomous escort squads directly.

| Action | Standard-mapping controller | Keyboard Blue | Keyboard Red (Local 2P) |
|---|---|---|---|
| Horizontal movement | Left stick / D-pad | A / D | Left / Right |
| Jump | A / D-pad up | W / Space | Up |
| Drop from gantry | D-pad down / left stick down | S | Down |
| Melee | X / Square | J | U |
| Shoot | B / Circle | K | I |
| Guard | Hold LB / L1 | Hold L | Hold O |
| Squad order | Y / Triangle | E | R |
| Trap | LT / L2 | F | V |
| Turret | RB / R1 | G | B |
| Shield | RT / R2 | H | N |
| Comeback cards | X / Y / B (three options) | 1 / 2 / 3 | Q / T / Y |
| Start / replay | Start / Options | Enter | Enter |
| Toggle Local 2P in preparation | Back / Select on Controller 1 | P | P |
| Pause / resume in combat | Back / Select (either active player's controller) | Escape | Escape |

**Controller input arbitration:** keyboard horizontal input overrides the same champion's connected pad when both are used. Hold-actions (guard and movement) read current states, while taps (attacks, jumps, abilities, defense purchases, mode toggle, card choice) use a rising-edge tracker so a held button cannot buy many defenses or fire repeatedly by accident. Standard controller buttons X/Y/B are mapped to card choices while a draft is pending; the same press is then suppressed from also causing melee/shoot/squad-order action. The existing attack cooldowns apply identically to keyboard and gamepad.

**Pausing:** The Arena Scene stops its physics, timer and combat callbacks when paused. A gamepad Back press opens the shared overlay during combat. The overlay requires the Back button to be released once before another Back press resumes, preventing an immediate pause/resume bounce. During preparation, Back on Controller 1 toggles VS AI/Local 2P instead, while Escape still opens Pause.

## QA boundaries

`src/systems/gamepad-controls.js` is renderer-independent. `tests/gamepad-controls.test.js` verifies 10 mapping, edge detection, analog deadzone, disconnect, D-pad, invalid/partial mappings and reset scenarios without introducing test-only game art.

The standard `npm test`, both Vite builds and Windows offline-bundle inspection can validate the implementation and packaging. **They cannot certify real controller hardware compatibility.** Once the verified original source pack is committed and strict production-art rights checks pass, test two XInput devices with the actual Windows installer, plus two controllers and keyboard/controller combinations in Chromium. Test focus loss/reconnects, pause/resume, analog drift, simultaneous melee, card selection and post-victory replay. The controls page and in-game footer are text UI; no placeholder images or newly generated shapes were added.
