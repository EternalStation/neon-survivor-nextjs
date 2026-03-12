# Incubator System

The Incubator System allows players to enhance their Meteorites over time by placing them in a controlled growth environment. This system is located in the Blueprint Bay and requires Meteorite Dust as fuel to remain operational.

## 1. Incubation Logic
When a compatible Meteorite is placed in the Incubator, it begins a growth cycle. At regular intervals (every 20 seconds), the Incubator consumes 1 unit of fuel to progress the growth.

- **Growth Boost**: Each successful tick increases the Meteorite's **Incubator Boost** stat by 1-2%.
- **Instability**: Each tick also increases the **Instability** of the Meteorite by 3-5%.
- **Structural Failure**: If a Meteorite has positive instability, there is a chance (Instability / 100) that it will be ruined during a tick. Ruined meteorites are grayed out and provide no benefits, but can be recycled for 5 Meteorite Dust.

## 2. Fuel Management
The Incubator requires **Meteorite Dust** to function. If the fuel reaches zero, growth stalls but the meteorite remains safe.

- **Refueling**: Players can click or hold the "Load Fuel" button in the Blueprint Bay to transfer Meteorite Dust into the Incubator's fuel tank.
- **Conversion Rate**: 1 Meteorite Dust = 1 Unit of Incubator Fuel.
- **Capacity**: The Incubator has a maximum capacity of 30 fuel units.

## 3. Visual Indicators
The Incubator's status is visible via:
- **Incubator Monitor**: A HUD element showing current fuel levels, instability of the active meteorite, and total boost gained.
- **Blueprint Bay Display**: A detailed industrial view with magnetic plasma columns and automated laser arms that process the meteorite.
- **Fuel Loading Animation**: A plasma surge effect that pulses the fuel bar when actively loading dust.
