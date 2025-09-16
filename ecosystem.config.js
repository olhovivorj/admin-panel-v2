module.exports = {
  apps: [{
    name: 'admin-panel',
    script: 'npm',
    args: 'run dev',
    cwd: '/home/robson/Documentos/projetos/codigo-fonte/admin-panel',
    env: {
      NODE_ENV: 'development',
      PORT: 3001,
      HOST: '0.0.0.0'
    },
    watch: false,
    restart_delay: 2000,
    max_restarts: 5,
    min_uptime: '10s'
  }]
}