import os
import re

replacements = {
    r'/classes(?=[\'"])': '/Classes',
    r'/constants(?=[\'"])': '/Constants',
    r'/gameWorker(?=[\'"])': '/GameWorker',
    r'/types(?=[\'"])': '/Types',
    r'/damageMapping(?=[\'"])': '/DamageMapping',
    r'/deathCauseUtils(?=[\'"])': '/DeathCauseUtils',
    r'/format(?=[\'"])': '/Format',
    r'/leaderboard(?=[\'"])': '/Leaderboard',
    r'/client(?=[\'"])': '/Client',
    r'/helpers(?=[\'"])': '/Helpers',
    r'/useAreaEffectLogic(?=[\'"])': '/UseAreaEffectLogic',
    r'/useGame(?=[\'"])': '/UseGame',
    r'/useGameInput(?=[\'"])': '/UseGameInput',
    r'/useGameLogic(?=[\'"])': '/UseGameLogic',
    r'/useGameUIHandlers(?=[\'"])': '/UseGameUIHandlers',
    r'/useMultiplayerGame(?=[\'"])': '/UseMultiplayerGame',
    r'/useMultiplayerLobby(?=[\'"])': '/UseMultiplayerLobby',
    r'/useOrbit(?=[\'"])': '/UseOrbit',
    r'/useWindowScale(?=[\'"])': '/UseWindowScale',
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

root_dir = r'c:\Users\trohi\Desktop\neon-survivor-nextjs\src'
for root, dirs, files in os.walk(root_dir):
    for file in files:
        if file.endswith(('.ts', '.tsx', '.js', '.jsx', '.css')):
            process_file(os.path.join(root, file))
