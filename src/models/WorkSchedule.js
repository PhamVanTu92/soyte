const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const WorkSchedule = sequelize.define('WorkSchedule', {
    id: { 
      type: DataTypes.BIGINT, 
      primaryKey: true, 
      autoIncrement: true 
    },
    title: { 
      type: DataTypes.STRING(255), 
      allowNull: false 
    },
    content: { 
      type: DataTypes.TEXT, // NVARCHAR(MAX) maps to TEXT
      allowNull: true 
    },
    start_time: { 
      type: DataTypes.DATE, // DATETIME2 maps to DATE
      allowNull: false 
    },
    end_time: { 
      type: DataTypes.DATE, 
      allowNull: false 
    },
    location: { 
      type: DataTypes.STRING(500), 
      allowNull: true 
    },
    coordinating_unit: { 
      type: DataTypes.STRING(255), 
      allowNull: true 
    },
    status: { 
      type: DataTypes.ENUM('DRAFT', 'APPROVED', 'CANCELLED'), 
      defaultValue: 'DRAFT', 
      allowNull: false 
    },
    priority: { 
      type: DataTypes.ENUM('NORMAL', 'IMPORTANT', 'URGENT'), 
      defaultValue: 'NORMAL', 
      allowNull: false 
    },
    internal_notes: { 
      type: DataTypes.TEXT, 
      allowNull: true 
    },
    license_plate: { 
      type: DataTypes.STRING(20), 
      allowNull: true 
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    approved_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    presider_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    }
  }, {
    tableName: 'work_schedules',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['start_time'] },
      { fields: ['status'] },
      { fields: ['presider_id'] },
    ]
  });

  return WorkSchedule;
};
