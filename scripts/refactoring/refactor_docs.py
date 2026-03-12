import os
import re

replacements = {
    # Documentation links
    r'classes/malware\.md': 'classes/Malware.md',
    r'classes/void-eventhorizon\.md': 'classes/VoidEventhorizon.md',
    r'classes/ray-stormstrike\.md': 'classes/RayStormstrike.md',
    r'classes/vortex-aigis\.md': 'classes/VortexAigis.md',
    r'classes/hive-mother\.md': 'classes/HiveMother.md',
    r'mechanics/stat-formula\.md': 'mechanics/StatFormula.md',
    r'mechanics/damage_reduction\.md': 'mechanics/DamageReduction.md',
    r'mechanics/dash-ability\.md': 'mechanics/DashAbility.md',
    r'mechanics/enemy_hp_bars\.md': 'mechanics/EnemyHpBars.md',
    r'mechanics/enemy_visuals\.md': 'mechanics/EnemyVisuals.md',
    r'mechanics/PentagonBoss\.md': 'mechanics/PentagonBoss.md',
    r'mechanics/cheat-codes\.md': 'mechanics/CheatCodes.md',
    r'mechanics/cooldown\.md': 'mechanics/Cooldown.md',
    r'mechanics/stats/hp\.md': 'mechanics/stats/Hp.md',
    r'mechanics/stats/armor\.md': 'mechanics/stats/Armor.md',
    r'mechanics/stats/damage\.md': 'mechanics/stats/Damage.md',
    r'mechanics/stats/attack-speed\.md': 'mechanics/stats/AttackSpeed.md',
    r'mechanics/stats/regen\.md': 'mechanics/stats/Regen.md',
    r'mechanics/stats/xp-gain\.md': 'mechanics/stats/XpGain.md',
    r'mechanics/stats/collision-reduction\.md': 'mechanics/stats/CollisionReduction.md',
    r'mechanics/stats/cooldown-reduction\.md': 'mechanics/stats/CooldownReduction.md',
    r'mechanics/legendary-upgrades/ecodmg\.md': 'mechanics/legendary-upgrades/EcoDmg.md',
    r'mechanics/legendary-upgrades/ecoxp\.md': 'mechanics/legendary-upgrades/EcoXp.md',
    r'mechanics/legendary-upgrades/ecohp\.md': 'mechanics/legendary-upgrades/EcoHp.md',
    r'mechanics/legendary-upgrades/combshield\.md': 'mechanics/legendary-upgrades/CombShield.md',
    r'mechanics/legendary-upgrades/comlife\.md': 'mechanics/legendary-upgrades/ComLife.md',
    r'mechanics/legendary-upgrades/comcrit\.md': 'mechanics/legendary-upgrades/ComCrit.md',
    r'mechanics/legendary-upgrades/comwave\.md': 'mechanics/legendary-upgrades/ComWave.md',
    r'mechanics/legendary-upgrades/radiationcore\.md': 'mechanics/legendary-upgrades/RadiationCore.md',
    r'mechanics/legendary-upgrades/defpuddle\.md': 'mechanics/legendary-upgrades/DefPuddle.md',
    r'mechanics/legendary-upgrades/defepi\.md': 'mechanics/legendary-upgrades/DefEpi.md',
    r'mechanics/legendary-upgrades/kineticbattery\.md': 'mechanics/legendary-upgrades/KineticBattery.md',
    r'mechanics/legendary-upgrades/chronoplating\.md': 'mechanics/legendary-upgrades/ChronoPlating.md',
    r'mechanics/legendary-upgrades/fusions\.md': 'mechanics/legendary-upgrades/Fusions.md',
    r'mechanics/legendary-upgrades/gravitationalharvest\.md': 'mechanics/legendary-upgrades/GravitationalHarvest.md',
    r'enemies/overlord\.md': 'enemies/Overlord.md',
    r'enemies/snitch\.md': 'enemies/Snitch.md',
}

def process_file(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    new_content = content
    for pattern, replacement in replacements.items():
        new_content = re.sub(pattern, replacement, new_content)
    
    if new_content != content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated {file_path}")

root_dir = r'c:\Users\trohi\Desktop\neon-survivor-nextjs\docs'
for root, dirs, files in os.walk(root_dir):
    for file in files:
        if file.endswith(('.md')):
            process_file(os.path.join(root, file))
