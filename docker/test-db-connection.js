/**
 * Test kết nối database — chạy trước khi deploy:
 *   node docker/test-db-connection.js
 */
require('dotenv').config();
const sequelize = require('../src/config/database');

(async () => {
  console.log(`\n🔌 Kết nối tới ${sequelize.options.dialect}://${sequelize.options.host}:${sequelize.options.port || '?'}/${process.env.DB_NAME}`);
  try {
    await sequelize.authenticate();
    console.log('✅ Kết nối thành công!\n');

    // Kiểm tra bảng users tồn tại chưa
    const dialect = sequelize.options.dialect;
    const checkSQL = dialect === 'postgres'
      ? `SELECT COUNT(*) AS cnt FROM information_schema.tables WHERE table_name = 'users'`
      : `SELECT COUNT(*) AS cnt FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'users'`;

    const [rows] = await sequelize.query(checkSQL);
    const cnt = parseInt(rows[0].cnt, 10);
    if (cnt > 0) {
      console.log('📋 Bảng users đã tồn tại — schema đã sẵn sàng.');
    } else {
      console.log('⚠️  Bảng users chưa tồn tại — cần chạy: pnpm migrate');
    }
  } catch (err) {
    console.error('❌ Kết nối thất bại:', err.message);
    console.error('\n🔍 Kiểm tra lại:');
    console.error('   - DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD trong .env');
    if (sequelize.options.dialect === 'postgres') {
      console.error('   - PostgreSQL có cho phép kết nối từ IP này không? (pg_hba.conf)');
      console.error('   - Nếu aaPanel: vào Database → PostgreSQL → Remote Access');
    } else {
      console.error('   - SQL Server có bật TCP/IP chưa?');
      console.error('   - Firewall có mở port 1433 chưa?');
    }
    process.exit(1);
  } finally {
    await sequelize.close();
  }
})();
