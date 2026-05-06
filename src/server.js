require('dotenv').config();
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const app = require('./app');
const sequelize = require('./config/database');

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection established successfully.');

    // iisnode truyền named pipe qua PORT (bắt đầu bằng '\\.\pipe\')
    // Trong trường hợp đó, dùng HTTP — IIS xử lý SSL termination
    const isNamedPipe = typeof PORT === 'string' && PORT.includes('pipe');

    const keyPath = path.join(__dirname, '../key.pem');
    const certPath = path.join(__dirname, '../cert.pem');
    const hasSSL = !isNamedPipe && fs.existsSync(keyPath) && fs.existsSync(certPath);

    if (hasSSL) {
      const httpsOptions = {
        key: fs.readFileSync(keyPath),
        cert: fs.readFileSync(certPath),
      };
      https.createServer(httpsOptions, app).listen(PORT, () => {
        console.log(`HTTPS Server running on port ${PORT}`);
      });
    } else {
      http.createServer(app).listen(PORT, () => {
        const mode = isNamedPipe ? `named pipe ${PORT}` : `port ${PORT}`;
        console.log(`HTTP Server running on ${mode}`);
      });
    }
  } catch (error) {
    console.error('Unable to start server:', error);
    process.exit(1);
  }
};

startServer();
