const BESTIARY_DATA = [
    {
        id: 'circle',
        name: 'Seeker',
        classification: 'Basic Assault Unit',
        threat: 'Normal Enemy',
        description: 'Fast, aggressive and relentless in pursuit',
        behavior: 'Direct chase pattern. Closes distance rapidly and maintains constant pressure on targets.',
        stats: { hp: 'X0.8 Base', speed: 'X1.3 Base', damage: '15% Max HP', xp: 'X1.0 Base' }
    },
    {
        id: 'triangle',
        name: 'Striker',
        classification: 'Dash Assault Unit',
        threat: 'Normal Enemy',
        description: 'Aggressive melee combatant equipped with short-range dash capabilities.',
        behavior: 'Charges at targets every 5 seconds with a high-speed dash attack.',
        stats: { hp: 'X1.0 Base', speed: 'X1.3 Base', damage: '15% Max HP', xp: 'X1.0 Base' }
    },
    {
        id: 'square',
        name: 'Bulwark',
        classification: 'Heavy Tank Unit',
        threat: 'Normal Enemy',
        description: 'Heavily armored slow-moving fortress. Designed to absorb punishment and block escape routes.',
        behavior: 'Slow but steady advance. High durability makes them excellent shields for other enemies.',
        stats: { hp: 'X2.0 Base', speed: 'X0.7 Base', damage: '15% Max HP', xp: 'X1.0 Base' }
    },
    {
        id: 'diamond',
        name: 'Viper',
        classification: 'Ranged Sniper Unit',
        threat: 'Normal Enemy',
        description: 'Highly mobile ranged combatant. Maintains optimal firing distance while evading return fire.',
        behavior: 'Kites at range. Fires projectiles every 5-7 seconds. Performs evasive strafing and emergency dashes.',
        stats: { hp: 'X0.8 Base', speed: 'X1.6 Base', damage: '10% (Bullet)', xp: 'X1.0 Base' }
    },
    {
        id: 'pentagon',
        name: 'Hive-Mother',
        classification: 'Summoner Unit',
        threat: 'Normal Enemy',
        description: 'Spawns minions that will protect their mother over anything.',
        behavior: 'Spawns Minions every 20 seconds. Will release all minions if player comes too close. After 60 seconds, will start releasing all minions one by one and eventually self-destruct.',
        stats: { hp: 'X3.0 Base', speed: 'X1.0 Base', damage: '15% Max HP', xp: 'X1.0 Base' }
    },
    {
        id: 'minion',
        name: 'Minion',
        classification: 'Autonomous Drone',
        threat: 'Normal Enemy',
        description: 'Small, aggressive drones deployed in swarms to overwhelm targets.',
        behavior: 'Swarm intelligence. Closely follows the Hive-Mother until released to engage the player.',
        stats: { hp: 'X0.4 Base', speed: 'X1.5 Base', damage: '8% Max HP', xp: 'X0.2 Base' }
    },
    // Elites
    {
        id: 'elite_circle',
        name: 'Elite Seeker',
        classification: 'Advanced Assault Unit',
        threat: 'Elite Enemy',
        description: 'Upgraded variant of the Seeker with enhanced durability and aggression protocols.',
        behavior: 'Relentless chase with increased tracking speed and resistance to knockback.',
        stats: { hp: 'X12.0 Base', speed: 'X1.6 Base', damage: '15% Max HP', xp: 'X14.0 Base' },
        mergeInfo: 'Merge Requirements: 10 Normal Seekers.'
    },
    {
        id: 'elite_triangle',
        name: 'Elite Striker',
        classification: 'Advanced Dash Unit',
        threat: 'Elite Enemy',
        description: 'Deadly melee specialist with reduced dash cooldowns and increased impact force.',
        behavior: 'Dashes more frequently and with greater accuracy. Capable of chain-dashing.',
        stats: { hp: 'X12.0 Base', speed: 'X1.6 Base', damage: '15% Max HP', xp: 'X14.0 Base' },
        mergeInfo: 'Merge Requirements: 10 Normal Strikers.'
    },
    {
        id: 'elite_square',
        name: 'Elite Bulwark',
        classification: 'Mobile Fortress',
        threat: 'Elite Enemy',
        description: 'Heavily reinforced tank unit with kinetic plating and active regeneration.',
        behavior: 'Nearly unstoppable advance. Regenerates health if not under constant fire.',
        stats: { hp: 'X12.0 Base', speed: 'X0.7 Base', damage: '15% Max HP', xp: 'X14.0 Base' },
        mergeInfo: 'Merge Requirements: 10 Normal Bulwarks.'
    },
    {
        id: 'elite_diamond',
        name: 'Elite Viper',
        classification: 'Sharpshooter Unit',
        threat: 'Elite Enemy',
        description: 'Master sniper with rapid-fire capabilities and advanced stealth cloaking.',
        behavior: 'Fires bursts of projectiles every 5-7 seconds. Cloaks when threatened. Maintains extreme range.',
        stats: { hp: 'X12.0 Base', speed: 'X2.5 Base', damage: '20% (Bullet)', xp: 'X14.0 Base' },
        mergeInfo: 'Merge Requirements: 10 Normal Vipers.'
    },
    {
        id: 'elite_pentagon',
        name: 'Elite Hive-Mother',
        classification: 'Brood Matriarch',
        threat: 'Elite Enemy',
        description: 'Massive summoner capable of spawning Elite Minions instantly.',
        behavior: 'Spawns waves of Elite Minions. Generates a protective field for her brood.',
        stats: { hp: 'X6.0 Base', speed: 'X1.0 Base', damage: '15% Max HP', xp: 'X7.0 Base' },
        mergeInfo: 'Merge Requirements: 5 Normal Hive-Mothers.'
    },
    {
        id: 'elite_minion',
        name: 'Elite Minion',
        classification: 'Heavy Combat Drone',
        threat: 'Elite Enemy',
        description: 'Reinforced drones with specialized combat inhibitors.',
        behavior: 'Aggressive pursuit. Possesses a stun skill that can temporarily disable player movement upon impact.',
        stats: { hp: 'X2.5 Base', speed: 'X1.8 Base', damage: '12% Max HP', xp: 'X2.0 Base' }
    },
    // Uniques
    {
        id: 'hexagon',
        name: 'Legionnaires',
        classification: 'Swarm Consolidation Unit',
        threat: 'Unique',
        description: 'A massive formation consisting of 30 units acting as a single entity.',
        behavior: 'Maintains a protective shield equal to 100% of their total Max HP. Moves relentlessly towards the player, attempting to crush them with their immense combined mass.',
        stats: { hp: 'X1.0 Base', speed: 'X1.0 Base', damage: '15% Max HP' }
    },
    {
        id: 'snitch',
        name: 'Quantum Snitch',
        classification: 'Evasion Specialist',
        threat: 'Unique',
        description: 'Elusive high-value target with advanced evasion protocols.',
        behavior: 'Flees from player. Spawns smoke on first hit and teleports away if the player comes too close (5s CD).',
        stats: { hp: '1 HP', speed: 'X1.6 Base', damage: '0% (Non-Hostile)' }
    },
    {
        id: 'glitcher',
        name: 'Prism Glitcher',
        classification: 'Anomaly Entity',
        threat: 'Unique',
        description: 'Reality-warping entity. Trailing clouds reverse player movement.',
        behavior: 'Teleports randomly. Leaks reality-distorting particles. Highly erratic movement patterns. Cannot be damaged.',
        stats: { hp: 'INVISIBLE', speed: 'X1.6 Base', damage: '0% (Evasive)' }
    },
    {
        id: 'worm',
        name: 'Void Burrower',
        classification: 'Subterranean Apex Predator',
        threat: 'Unique',
        description: 'An eldritch serpentine entity that distorts space-time to hunt. It is known as the "Pale Nightmare".',
        behavior: 'Orbits in a "Baited Coil." Launches high-speed strikes with red eyes. Servering the body leaves an "inactive" dormant piece for 1s before it spawns a new head and dives. Regrows segments every 3s while underground.',
        stats: { hp: 'Head: X10.0 / Segments: 20% of Head', speed: 'Stalk: X1.4 / Strike: X4.5', damage: 'Head: 20% TRUE (Piercing) / Body: 15% Collision' }
    },
    // Bosses
    {
        id: 'boss_circle',
        name: 'The Warlord',
        classification: 'Apex Assault Unit',
        threat: 'Boss',
        description: 'A massive Seeker unit. On kill provides legendary upgrade.',
        behavior: 'Aggressively chases player. Uses gravitational wells to pull enemies in.',
        stats: { hp: 'X40.0 Base', speed: 'X1.3 Base', damage: '15% Max HP (Collision)' },
        abilities: { lvl1: 'Direct Pursuit: Aggressively maneuvers to collide with the player.', lvl2: 'Charge: Executes a high-speed non-lethal charge to close distance.', lvl3: 'Vortex: Generates a massive gravity well that pulls enemies towards the center (No damage).' }
    },
    {
        id: 'boss_triangle',
        name: 'The Reaper',
        classification: 'Apex Melee Unit',
        threat: 'Boss',
        description: 'An evolved Striker unit optimized for slaughter. Capable of entering a hyper-lethal berserk state.',
        behavior: 'Rapid dashes and melee strikes. Enters Berserk mode periodically, deflecting projectiles and moving at extreme speeds.',
        stats: { hp: 'X30.0 Base', speed: 'X2.5 Base (Berserk)', damage: '15% Max HP (Collision/Dash)' },
        abilities: { lvl1: 'Direct Pursuit: Aggressively maneuvers to collide with the player.', lvl2: 'Berserk Rage: Increases movement speed by 255% for short durations.', lvl3: 'Projectile Deflection: Active during Berserk. Reflects all incoming projectiles.' }
    },
    {
        id: 'boss_square',
        name: 'The Fortress',
        classification: 'Apex Tank Unit',
        threat: 'Boss',
        description: 'A walking stronghold. Virtually indestructible frontal armor with regenerative capabilities.',
        behavior: 'Slow, inexorable advance. Deploys orbital shields that render it invulnerable.',
        stats: { hp: 'X99.0 Base', speed: 'X0.7 Base', damage: '15% Max HP (Collision)' },
        abilities: { lvl1: 'Direct Pursuit: Aggressively maneuvers to collide with the player.', lvl2: 'Spiked Armor: Reflects 3% of incoming damage back to the attacker.', lvl3: 'Orbital Plating: Deploys 3 rotating shields. Boss is INVULNERABLE while shields are active. Regenerates every 15s.' }
    },
    {
        id: 'boss_diamond',
        name: 'The Marksman',
        classification: 'Apex Sniper Unit',
        threat: 'Boss',
        description: 'The ultimate ranged combatant. Equipped with orbital satellite uplink for precision strikes.',
        behavior: 'Maintains extreme range. Charges a devastating Kinetic Beam. Calls down orbital bombardments.',
        stats: { hp: 'X20.0 Base', speed: 'X1.6 Base', damage: '10% (Beam) / 15% Max HP' },
        abilities: { lvl1: 'Direct Pursuit: Aggressively maneuvers to collide with the player.', lvl2: 'Kinetic Beam: Charges a sniper shot that deals 5% Max HP (3% if Lvl 3) and pierces obstacles.', lvl3: 'Orbital Satellites: Marks multiple zones for immediate orbital bombardment. Deals massive damage.' }
    },
    {
        id: 'boss_pentagon',
        name: 'The Omega',
        classification: 'Apex Hive Mind',
        threat: 'Boss',
        description: 'The central node of the swarm. Connects to all nearby units to share power and drain life.',
        behavior: 'Links to other enemies to buff them. Drains player health to heal itself.',
        stats: { hp: 'X50.0 Base', speed: 'X0.7 Base', damage: '10% / sec (Link) / 15% Max HP' },
        abilities: { lvl1: 'Stunner Swarm: Regularly deploys minions equipped with stun movement inhibitors.', lvl2: 'Soul Link: Connects to nearby enemies, sharing buffs and damage distribution.', lvl3: 'Parasitic Link: Drains 3% of Player Max HP per second to heal self when in range.' }
    }
];


function generateHTML(entries, colorClass, badgeColorClass) {
    return `<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
` + entries.map(entry => `        <div class="group relative bg-background-dark border border-primary/20 p-6 hover:border-primary transition-all duration-300">
            <div class="absolute -top-3 -left-3 px-3 py-1 bg-background-dark border border-primary text-xs font-bold ${colorClass}">${entry.classification}</div>
            <h3 class="text-xl font-bold mb-2 uppercase tracking-wider text-white group-hover:${colorClass} transition-colors">${entry.name}</h3>
            
            <div class="mb-4">
                 <p class="text-white/60 italic text-sm mb-2">"${entry.description}"</p>
                 <p class="text-sm leading-relaxed text-white/80"><strong class="${colorClass}">Behavior:</strong> ${entry.behavior}</p>
            </div>

            <div class="grid grid-cols-2 gap-2 text-xs font-mono mb-4">
                <div class="bg-white/5 px-2 py-1 rounded border border-white/10"><span class="text-white/50">HP:</span> <span class="text-white">${entry.stats.hp}</span></div>
                <div class="bg-white/5 px-2 py-1 rounded border border-white/10"><span class="text-white/50">SPD:</span> <span class="text-white">${entry.stats.speed}</span></div>
                <div class="col-span-2 bg-white/5 px-2 py-1 rounded border border-white/10"><span class="text-white/50">DMG:</span> <span class="text-white">${entry.stats.damage}</span></div>
                ${entry.stats.xp ? `<div class="col-span-2 bg-white/5 px-2 py-1 rounded border border-white/10"><span class="text-white/50">XP:</span> <span class="text-white">${entry.stats.xp}</span></div>` : ''}
            </div>

            ${entry.abilities ? `
            <div class="mt-4 p-3 bg-white/5 rounded border border-white/10 text-xs">
                <div class="${colorClass} font-bold mb-2 uppercase tracking-wider">Threat Capabilities</div>
                ${entry.abilities.lvl1 ? `<div class="mb-1"><strong class="text-slate-400">[LVL 1]</strong> <span class="text-slate-200">${entry.abilities.lvl1}</span></div>` : ''}
                ${entry.abilities.lvl2 ? `<div class="mb-1"><strong class="text-amber-400">[LVL 2]</strong> <span class="text-slate-200">${entry.abilities.lvl2}</span></div>` : ''}
                ${entry.abilities.lvl3 ? `<div><strong class="text-red-400">[LVL 3]</strong> <span class="text-slate-200">${entry.abilities.lvl3}</span></div>` : ''}
            </div>` : ''}

            ${entry.mergeInfo ? `
            <div class="mt-4 pt-2 border-t border-white/10 text-xs ${colorClass}">
                <strong>FUSION PROTOCOL:</strong> ${entry.mergeInfo}
            </div>` : ''}
        </div>`).join('\n') + `
    </div>`;
}

const fs = require('fs');

const content = `
<!-- ENEMIES -->
<section id="section-enemies" class="mb-16">
    <div class="flex items-center gap-4 mb-8">
        <div class="w-12 h-1 bg-primary"></div>
        <h2 class="text-3xl font-black text-white tracking-widest uppercase">Standard Threats</h2>
    </div>
    ${generateHTML(BESTIARY_DATA.filter(e => e.threat === 'Normal Enemy'), 'text-primary', 'border-primary')}
</section>

<!-- ELITES -->
<section id="section-elites" class="mb-16">
    <div class="flex items-center gap-4 mb-8">
        <div class="w-12 h-1 bg-amber-500"></div>
        <h2 class="text-3xl font-black text-white tracking-widest uppercase">Elite Database</h2>
    </div>
    ${generateHTML(BESTIARY_DATA.filter(e => e.threat === 'Elite Enemy'), 'text-amber-500', 'border-amber-500')}
</section>

<!-- UNIQUES -->
<section id="section-uniques" class="mb-16">
    <div class="flex items-center gap-4 mb-8">
        <div class="w-12 h-1 bg-purple-500"></div>
        <h2 class="text-3xl font-black text-white tracking-widest uppercase">Unique Entities</h2>
    </div>
    ${generateHTML(BESTIARY_DATA.filter(e => e.threat === 'Unique'), 'text-purple-500', 'border-purple-500')}
</section>

<!-- BOSSES -->
<section id="section-bosses" class="mb-16">
    <div class="flex items-center gap-4 mb-8">
        <div class="w-12 h-1 bg-red-600"></div>
        <h2 class="text-3xl font-black text-white tracking-widest uppercase">Apex Threats</h2>
    </div>
    ${generateHTML(BESTIARY_DATA.filter(e => e.threat === 'Boss'), 'text-red-600', 'border-red-600')}
</section>
`;


fs.writeFileSync('scripts/wiki_content.html', content, 'utf8');
console.log('Written to scripts/wiki_content.html');

