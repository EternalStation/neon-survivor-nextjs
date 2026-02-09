import os
import re

logic_root = r'src\logic'
src_root = r'src'

# Old rel path to New rel path (rel to logic root)
mapping = {
    'AudioBase.ts': 'audio/AudioBase.ts',
    'AudioLogic.ts': 'audio/AudioLogic.ts',
    'BlueprintLogic.ts': 'upgrades/BlueprintLogic.ts',
    'ColorPalettes.ts': 'rendering/ColorPalettes.ts',
    'DeathLogic.ts': 'mission/DeathLogic.ts',
    'DirectorLogic.ts': 'enemies/DirectorLogic.ts',
    'EfficiencyLogic.ts': 'upgrades/EfficiencyLogic.ts',
    'EnemyArchetypes.ts': 'enemies/EnemyArchetypes.ts',
    'EnemyLogic.ts': 'enemies/EnemyLogic.ts',
    'ExtractionLogic.ts': 'mission/ExtractionLogic.ts',
    'GameConfig.ts': 'core/GameConfig.ts',
    'GameRenderer.ts': 'rendering/GameRenderer.ts',
    'GameState.ts': 'core/GameState.ts',
    'Keybinds.ts': 'utils/Keybinds.ts',
    'LegendaryLogic.ts': 'upgrades/LegendaryLogic.ts',
    'LootLogic.ts': 'mission/LootLogic.ts',
    'MapLogic.ts': 'mission/MapLogic.ts',
    'MathUtils.ts': 'utils/MathUtils.ts',
    'ParticleLogic.ts': 'effects/ParticleLogic.ts',
    'PlayerLogic.ts': 'player/PlayerLogic.ts',
    'ProjectileLogic.ts': 'combat/ProjectileLogic.ts',
    'ProjectileSpawning.ts': 'combat/ProjectileSpawning.ts',
    'PulseSystem.ts': 'effects/PulseSystem.ts',
    'SfxLogic.ts': 'audio/SfxLogic.ts',
    'SkillLogic.ts': 'player/SkillLogic.ts',
    'SpatialGrid.ts': 'core/SpatialGrid.ts',
    'UpgradeLogic.ts': 'upgrades/UpgradeLogic.ts',
    'classes.ts': 'core/classes.ts',
    'clean_enemy_logic.cjs': 'utils/clean_enemy_logic.cjs',
    'constants.ts': 'core/constants.ts',
    'gameWorker.ts': 'core/gameWorker.ts',
    'helpers.ts': 'utils/helpers.ts',
    'types.ts': 'core/types.ts',
    
    # Stayed put (rel to logic root)
    'player/PlayerCombat.ts': 'player/PlayerCombat.ts',
    'player/PlayerMovement.ts': 'player/PlayerMovement.ts',
    'player/PlayerStats.ts': 'player/PlayerStats.ts',
    'enemies/BossEnemyLogic.ts': 'enemies/BossEnemyLogic.ts',
    'enemies/EliteEnemyLogic.ts': 'enemies/EliteEnemyLogic.ts',
    'enemies/EnemyAILogic.ts': 'enemies/EnemyAILogic.ts',
    'enemies/EnemyMergeLogic.ts': 'enemies/EnemyMergeLogic.ts',
    'enemies/EnemySpawnLogic.ts': 'enemies/EnemySpawnLogic.ts',
    'enemies/NormalEnemyLogic.ts': 'enemies/NormalEnemyLogic.ts',
    'enemies/UniqueEnemyLogic.ts': 'enemies/UniqueEnemyLogic.ts',
    
    # Moved from renderers/ to rendering/renderers/
    'renderers/EffectRenderer.ts': 'rendering/renderers/EffectRenderer.ts',
    'renderers/EnemyRenderer.ts': 'rendering/renderers/EnemyRenderer.ts',
    'renderers/EntityRenderer.ts': 'rendering/renderers/EntityRenderer.ts',
    'renderers/MapRenderer.ts': 'rendering/renderers/MapRenderer.ts',
    'renderers/PlayerRenderer.ts': 'rendering/renderers/PlayerRenderer.ts',
    'renderers/ProjectileRenderer.ts': 'rendering/renderers/ProjectileRenderer.ts',
}

# Reverse mapping for easy lookup of target extension-less path
target_mapping = {}
for k, v in mapping.items():
    k_no_ext = os.path.splitext(k)[0].replace('\\', '/')
    v_no_ext = os.path.splitext(v)[0].replace('\\', '/')
    target_mapping[k_no_ext] = v_no_ext

def get_rel_path(from_path, to_path):
    # Standardize to use forward slashes for JS imports
    rel = os.path.relpath(to_path, from_path).replace('\\', '/')
    if not rel.startswith('.'):
        rel = './' + rel
    return rel

import_pattern = re.compile(r"(['\"])(@/logic/|(?:\./|\.\./)+)([^'\"]+)(['\"])")

def update_file(file_path):
    # 1. Determine current file's relative path to logic root
    abs_logic_root = os.path.abspath(os.path.join(os.getcwd(), src_root, 'logic'))
    abs_file_path = os.path.abspath(file_path)
    
    is_in_logic = abs_file_path.startswith(abs_logic_root)
    
    current_rel_logic_path = None
    if is_in_logic:
        current_rel_logic_path = os.path.relpath(abs_file_path, abs_logic_root).replace('\\', '/')

    # We need to know where it WAS to resolve its imports correctly
    # If it's a file we moved, its current location is "New".
    # If it's a file we didn't move, its current location is "Old" AND "New".
    
    was_rel_logic_path = None
    if is_in_logic:
        for k, v in mapping.items():
            if v == current_rel_logic_path:
                was_rel_logic_path = k
                break
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    def replacer(match):
        quote = match.group(1)
        prefix = match.group(2)
        import_path = match.group(3)
        suffix = match.group(4)
        
        target_abs_logic_path = None
        
        if prefix == '@/logic/':
            target_abs_logic_path = import_path
        else:
            # It's a relative import. Resolve it against where the file WAS.
            if not is_in_logic:
                # If not in logic, imports are likely like '../logic/...'
                # This doesn't match our regex prefix (which expects ./ or ../ starting immediately with logic content)
                # Wait, if HUD.tsx imports '../logic/types', prefix is '../logic/'. 
                # Our regex handles prefix `(?:\./|\.\./)+`.
                # If path is `../logic/types`, it might be captured as prefix `../` and path `logic/types`.
                pass
            
            # Special case for files outside of logic importing logic
            if not is_in_logic:
                # If it's like '../logic/MapLogic', prefix='../', import_path='logic/MapLogic'
                if import_path.startswith('logic/'):
                    logic_target = import_path[len('logic/'):]
                    if logic_target in target_mapping:
                        new_target = target_mapping[logic_target]
                        return f"{quote}{prefix}logic/{new_target}{quote}"
                return match.group(0)

            # Inside logic, importing logic
            # File was at `was_rel_logic_path` (e.g. `player/PlayerCombat.ts`)
            # Import was `../types`
            # Target was `player/../types` -> `types`
            if was_rel_logic_path:
                was_dir = os.path.dirname(was_rel_logic_path)
                target_was_rel = os.path.normpath(os.path.join(was_dir, import_path)).replace('\\', '/')
                if target_was_rel in target_mapping:
                    new_target_rel = target_mapping[target_was_rel]
                    # Compute new relative path from current (new) location
                    new_dir = os.path.dirname(current_rel_logic_path)
                    final_rel = get_rel_path(new_dir, new_target_rel)
                    return f"{quote}{final_rel}{quote}"
        
        # Handle @/logic/ alias
        if prefix == '@/logic/':
            if import_path in target_mapping:
                return f"{quote}@/logic/{target_mapping[import_path]}{quote}"
            # Also handle subdirectory renderers
            if import_path.startswith('renderers/'):
                return f"{quote}@/logic/rendering/{import_path}{quote}"

        return match.group(0)

    new_content = import_pattern.sub(replacer, content)
    
    # Second pass for relative imports that didn't match the first exactly (e.g. '../logic' from outside)
    # This is handled by the `if not is_in_logic` block above mostly.

    if new_content != content:
        print(f"Updating {file_path}")
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)

# Start walking
for root, dirs, files in os.walk(src_root):
    for file in files:
        if file.endswith(('.ts', '.tsx', '.cjs', '.js')):
            update_file(os.path.join(root, file))
