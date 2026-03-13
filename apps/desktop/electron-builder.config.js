/**
 * @type {import('electron-builder').Configuration}
 * @see https://www.electron.build/configuration/configuration
 */
module.exports = {
  appId: "com.eternalstation.neonsurvivorgame",
  productName: "Neon Survivor",
  directories: {
    output: "release"
  },
  files: [
    "out/main/**/*",
    "out/preload/**/*",
    "out/renderer/**/*"
  ],
  extraResources: [
    "public/**/*"
  ],
  win: {
    target: [
      {
        target: "nsis",
        arch: ["x64"]
      },
      {
        target: "dir",
        arch: ["x64"]
      }
    ]
  }
};
