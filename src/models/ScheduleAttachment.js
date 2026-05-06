const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ScheduleAttachment = sequelize.define('ScheduleAttachment', {
    id: { 
      type: DataTypes.BIGINT, 
      primaryKey: true, 
      autoIncrement: true 
    },
    schedule_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    file_name: { 
      type: DataTypes.STRING(255), 
      allowNull: false 
    },
    file_path: { 
      type: DataTypes.STRING(500), 
      allowNull: false 
    },
    file_type: { 
      type: DataTypes.STRING(50), 
      allowNull: true 
    },
  }, {
    tableName: 'schedule_attachments',
    timestamps: true,
    createdAt: 'uploaded_at',
    updatedAt: false, // No 'updated_at' column in the schema
    indexes: [
      { fields: ['schedule_id'] }
    ]
  });

  return ScheduleAttachment;
};
