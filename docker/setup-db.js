/**
 * docker/setup-db.js
 * Chạy một lần khi container khởi động lần đầu:
 *   - Tạo database nếu chưa tồn tại
 *   - Tạo login / user nếu chưa tồn tại
 *   - Cấp quyền db_owner cho api_user
 *
 * Kết nối bằng SA (chỉ dùng lúc init, không dùng trong runtime app).
 */

'use strict';
require('dotenv').config();
const { Sequelize } = require('sequelize');

const host      = process.env.DB_HOST     || 'sqlserver';
const port      = parseInt(process.env.DB_PORT || '1433');
const saPass    = process.env.SA_PASSWORD;
const dbName    = process.env.DB_NAME     || 'SUCKHUOETHUDO_DB';
const apiUser   = process.env.DB_USER     || 'api_user';
const apiPass   = process.env.DB_PASSWORD || 'Api@123456';

if (!saPass) {
  console.error('❌ SA_PASSWORD không được cấu hình.');
  process.exit(1);
}

const dialectOptions = {
  options: {
    useUTC: false,
    dateFirst: 1,
    connectTimeout: 30000,
    requestTimeout: 30000,
    trustServerCertificate: true,   // cần thiết với MSSQL Docker (self-signed cert)
  },
};

/** Tạo kết nối Sequelize tới một database cụ thể bằng SA */
const makeConn = (database) =>
  new Sequelize(database, 'sa', saPass, {
    host,
    port,
    dialect: 'mssql',
    logging: false,
    dialectOptions,
  });

async function run() {
  // ── Kết nối master (dùng cho toàn bộ setup, tránh race condition) ──
  const master = makeConn('master');
  try {
    await master.authenticate();
    console.log('  ✅ Kết nối SA thành công.');

    // Tạo database
    await master.query(`
      IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'${dbName}')
      BEGIN
        CREATE DATABASE [${dbName}];
      END
    `);

    // Tạo login
    await master.query(`
      IF NOT EXISTS (
        SELECT name FROM sys.server_principals
        WHERE name = N'${apiUser}' AND type = 'S'
      )
      BEGIN
        CREATE LOGIN [${apiUser}] WITH PASSWORD = N'${apiPass}',
          CHECK_EXPIRATION = OFF, CHECK_POLICY = OFF;
      END
    `);

    console.log(`  ✅ Database [${dbName}] và Login [${apiUser}] sẵn sàng.`);

    // Tạo user + gán quyền TRONG target DB, dùng EXEC để chạy trong ngữ cảnh đúng DB
    // Không mở thêm connection mới — tránh race condition ngay sau CREATE DATABASE
    await master.query(`
      EXEC [${dbName}].dbo.sp_executesql N'
        IF NOT EXISTS (
          SELECT name FROM sys.database_principals
          WHERE name = N''${apiUser}'' AND type = ''S''
        )
        BEGIN
          CREATE USER [${apiUser}] FOR LOGIN [${apiUser}];
        END

        IF IS_ROLEMEMBER(''db_owner'', ''${apiUser}'') = 0
        BEGIN
          EXEC sp_addrolemember ''db_owner'', ''${apiUser}'';
        END
      '
    `);

    console.log(`  ✅ User [${apiUser}] đã có quyền db_owner trên [${dbName}].`);
  } finally {
    await master.close();
  }
}

run().catch((err) => {
  console.error('❌ Lỗi khởi tạo DB:', err.message);
  process.exit(1);
});
