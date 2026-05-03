const os = require("os");

module.exports = {
  apps: [
    {
      name: "board-game-server",
      script: "dist/index.js",
      instances: os.cpus().length,
      exec_mode: "fork",
      watch: false,
    },
  ],
};
