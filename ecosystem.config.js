module.exports = {
  apps: [
    {
      name: 'soyte-be',
      script: 'src/server.js',
      instances: 1,          // Tăng lên 'max' nếu muốn cluster mode
      exec_mode: 'fork',     // Đổi thành 'cluster' nếu instances > 1
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',

      // Biến môi trường production — đọc từ .env
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
      },

      // Log files
      error_file: 'logs/pm2-error.log',
      out_file: 'logs/pm2-out.log',
      log_file: 'logs/pm2-combined.log',
      time: true,
      merge_logs: true,
    },
  ],
};
