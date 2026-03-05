const fs = require('fs');

let content = fs.readFileSync('src/logic/upgrades/LegendaryMergeLogic.ts', 'utf8');

const regex = /state\.moduleSockets\.hexagons\[([a-zA-Z0-9_]+)\] = null;\r?\n\s*state\.moduleSockets\.hexagons\[([a-zA-Z0-9_]+)\] = null;\r?\n\s*state\.moduleSockets\.hexagons\[([a-zA-Z0-9_]+)\] = mergedHex;/g;

content = content.replace(regex, (match, p1, p2, p3) => {
    return `state.moduleSockets.hexagons[${p1}] = null;\n    state.moduleSockets.hexagons[${p2}] = null;\n    state.pendingFusionHex = { hex: mergedHex, validHexIndices: [${p1}, ${p2}] };`;
});

fs.writeFileSync('src/logic/upgrades/LegendaryMergeLogic.ts', content);
console.log('Replaced occurrences.');
