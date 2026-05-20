module.exports = {
  apps: [
    {
      name: 'amazebid-backend',
      script: './dist/server.cjs',
      instances: 'max',       // Utilize all available CPU cores for clustering
      exec_mode: 'cluster',    // Run in cluster mode
      autorestart: true,       // Auto-restart if code crashes
      watch: false,            // Watch is false in production to optimize performance
      max_memory_restart: '1G', // Restart if RAM usage exceeds 1GB
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000
      }
    }
  ]
};
