# Production asset contract

The game **must not ship with geometric stand-ins or programmer artwork**. Place licensed, cleared final art at these exact paths inside public/assets/ (Vite serves that folder from /assets):

- arena/iron-citadel.webp — full HD painted battlefield background (16:9).
- arena/citadel-ground.webp — seamless battleground foreground.
- fighters/knight.png — transparent facing-right blue champion.
- fighters/raider.png — transparent facing-left red champion.
- fx/projectile.png — transparent glowing ranged projectile.
- fx/slash.png — transparent melee arc.
- branding/fire-dragon-interactive.png — official Fire Dragon Interactive logo.

The bootstrap deliberately stops and displays an asset-error message if any file is absent. No placeholder assets are committed. All third-party art needs a license record, source, author, and rights confirmation. Visual polish, animation atlases, SFX and effects are not complete until approved assets are integrated.
