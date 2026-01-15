// =============================================================================
// PM2 PRODUCTION CONFIG - ADMIN PANEL API
// =============================================================================
// Este arquivo configura o PM2 para rodar o backend NestJS em produção
// Usado pelo script ci-deploy.sh durante o deploy automático
// =============================================================================

const path = require('path');
const homeDir = process.env.HOME || '/home/robson';

module.exports = {
  apps: [{
    name: 'admin-panel-api',
    script: 'dist/main.js',
    cwd: path.join(homeDir, 'dev/admin-panel/apps/api'),

    // Ambiente
    env: {
      NODE_ENV: 'production',
      PORT: 3001,
      HOST: '0.0.0.0'
    },

    // Instâncias (fork mode para NestJS)
    instances: 1,
    exec_mode: 'fork',

    // Logs
    error_file: path.join(homeDir, 'logs/admin-panel/api-error.log'),
    out_file: path.join(homeDir, 'logs/admin-panel/api-out.log'),
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,

    // Restart policies
    max_restarts: 10,
    min_uptime: '10s',
    restart_delay: 4000,

    // Memory management
    max_memory_restart: '500M',

    // Graceful shutdown
    kill_timeout: 5000,
    wait_ready: true,
    listen_timeout: 10000,

    // Watch (desabilitado em produção)
    watch: false,
    ignore_watch: ['node_modules', 'logs', '.git'],

    // Auto restart on crash
    autorestart: true,

    // Exponential backoff restart
    exp_backoff_restart_delay: 100
  }]
};
