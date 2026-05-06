const { Sequelize } = require('sequelize');
require('dotenv').config();

const dialect  = process.env.DB_DIALECT || 'mssql';
const port     = parseInt(process.env.DB_PORT || (dialect === 'postgres' ? '5432' : '1433'));

// ── dialectOptions theo từng database ────────────────────────────
const dialectOptions = dialect === 'postgres'
  ? {
      // PostgreSQL: bật SSL khi DB_SSL=true (môi trường cloud)
      ssl: process.env.DB_SSL === 'true'
        ? { require: true, rejectUnauthorized: false }
        : false,
    }
  : {
      // MSSQL / Tedious
      options: {
        useUTC: false,
        dateFirst: 1,
        requestTimeout: 120000,        // 120 giây — cho phép query thống kê lớn
        connectTimeout: 30000,
        trustServerCertificate: true,  // cần cho MSSQL Docker (self-signed cert)
      },
    };

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port,
    dialect,
    logging: false,
    timezone: '+07:00',
    dialectOptions,
  }
);

module.exports = sequelize;
