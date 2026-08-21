// PM2 process manager config for deploying the backend on a bare VPS
// (as an alternative to Docker). Usage, from /backend after `npm run build`:
//   pm2 start ecosystem.config.js --env production
//   pm2 save && pm2 startup   # persist across reboots
//
// Pair this with the Nginx reverse-proxy snippet in the README's
// deployment section to serve the built frontend and proxy /api and
// /socket.io to this process.
module.exports = {
  apps: [
    {
      name: 'drivehub-api',
      script: './dist/server.js',
      cwd: __dirname,
      instances: 1, // Socket.io's default in-memory adapter doesn't support horizontal scaling across instances; use the Redis adapter first if you need >1
      exec_mode: 'fork',
      env_production: {
        NODE_ENV: 'production',
      },
      max_memory_restart: '400M',
      autorestart: true,
      watch: false,
      out_file: './logs/out.log',
      error_file: './logs/error.log',
      merge_logs: true,
      time: true,
    },
  ],
};
