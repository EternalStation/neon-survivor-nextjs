const fs = require('fs');
const path = require('path');

function copyRecursiveSync(src, dest) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();
  if (isDirectory) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    fs.readdirSync(src).forEach((childItemName) => {
      copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

const source = path.resolve(__dirname, '../packages/shared/assets');
const destinations = [
  path.resolve(__dirname, '../apps/web/public/assets'),
  path.resolve(__dirname, '../apps/desktop/public/assets')
];

destinations.forEach(dest => {
  console.log(`Copying assets from ${source} to ${dest}...`);
  if (fs.existsSync(dest)) {
    // Optional: clean destination first to avoid stale files
    // fs.rmSync(dest, { recursive: true, force: true });
  }
  copyRecursiveSync(source, dest);
  console.log(`Assets copied to ${dest} successfully.`);
});
