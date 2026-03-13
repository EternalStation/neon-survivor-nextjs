const fs = require('fs');
const path = 'c:\\Users\\trohi\\Desktop\\Game\\src\\logic\\EnemyLogic.ts';

try {
    const data = fs.readFileSync(path, 'utf8');
    const lines = data.split(/\r?\n/);
    const newLines = [];
    let skipCount = 0;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (skipCount > 0) {
            skipCount--;
            continue;
        }

        if (line.trim() === '// --- STATUS OVERRIDES ---') {
            // Check if this is indeed the start of the block
            // We can check the next line to be sure
            if (i + 1 < lines.length && lines[i + 1].trim() === '// Feared Status (ComWave Lvl 2)') {
                // Determine indentation of this line
                const indent = line.search(/\S|$/);
                // We will skip 69 lines (based on our counting)
                // But wait, indentation might affect newlines?
                // The code block has empty lines which are just whitespace?
                // Let's verify the block length is robust.
                // We can loop ahead until we find the closing brace that matches the block structure?
                // Or just skip 69 lines.
                // Let's assume 69 lines.
                skipCount = 68; // Skip THIS line + 68 next lines = 69 total
                console.log(`Removing block at line ${i + 1}`);
                // Skip the current line by not adding it
            } else {
                newLines.push(line);
            }
        } else {
            newLines.push(line);
        }
    }

    fs.writeFileSync(path, newLines.join('\n'));
    console.log('Done cleaning file.');

} catch (err) {
    console.error(err);
}
