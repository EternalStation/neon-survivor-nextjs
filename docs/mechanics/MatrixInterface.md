# Matrix Interface

The Matrix Module serves as the central tactical hub for upgrade management, inventory sorting, and legendary fusion analysis. It allows the operator to interface with the core chassis metrics and optimize meteorite socketing.

## Navigation and Interactions
The interface comprises three primary specialized views, accessible via global navigation within the module:
- **Matrix Core**: The primary hex-grid environment for meteorite socketing and stat optimization.
- **Fusion Forge**: A specialized analysis sub-view for previewing and initiating legendary skill fusions.
- **Bestiary**: A tactical database of encountered enemies and их analysis.

## Core Controls
Access and termination of the Matrix link follow specific protocol to ensure tactical awareness is maintained:
- **Interface Exit (Esc Key)**: The operator can instantly terminate the Matrix link from any sub-view (Core, Forge, or Bestiary) by pressing the **Escape** key.
- **Exit Propagation**: If multiple tactical overlays are active (such as Boss Skill Details within the Bestiary), the Escape key follows a hierarchical closure protocol, first closing the active sub-detail before closing the Matrix Module itself.
- **System Guards**: The termination protocol is inhibited during active **Legendary Hex** placement or when an **Extraction Sequence** is in progress (Requested or Waiting) to prevent critical interruption of high-priority processes.

## Operational Recovery
Exiting the Matrix interface initiates a tactical recovery period for the chassis:
- **Unpause Delay**: Upon closing the module, the game state resumes with a 0.5s to 1.0s delay. This period allows the operator to re-adjust to the combat scenario while maintaining a visual "Scanning" effect.
