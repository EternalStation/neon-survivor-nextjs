# Orbit AFK Laser Refactoring

## Changes Made
- **AFK Strike Damage Delayed**: The instant death caused by `afk_strike` when the targeted phase ended has been moved into the `afk_strike_hit` effect. This effectively delays the "Coffee Spilled" death by `0.6s`, perfectly synchronizing the game over event with the visible completion of the laser animation.
- **Drone Launch Spam Fixed**: The logic tracking the AFK timer and launching sequential strikes in `useOrbit.ts` now properly halts and resets its internal loop if the player's HP reaches 0 or the game ends. This stops Orbit from threatening to send a second drone when the player just died to the first.
- **Strike Survival Cooldown Accurate**: The countdown to evaluating if the player survived the AFK strike now waits an additional `0.6s` to account for the new laser animation duration before determining survival and proceeding with "Pilot is in place...".
