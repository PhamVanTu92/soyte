'use strict'; 
const path = require('path');
const Sequelize = require('sequelize'); 
const sequelize = require('../config/database'); // Your db connection
const db = {};

// Manually import models
const modelsToLoad = [
  'User',
  'Post',
  'WorkSchedule',
  'ScheduleAttachment',
  'Form',
  'Feedback',
  'FeedbackSection',
  'FeedbackOption',
  'SocialFacility',
  'Permission',
  'EmailConfirm',
  'Survey',
  'AffiliatedFacility',
  'TradingFacility',
  'Role',
];

for (const modelName of modelsToLoad) {
  const modelDefinition = require(path.join(__dirname, modelName));
  let model;
  if (typeof modelDefinition === 'function') {
    // If the model exports a function (e.g., WorkSchedule.js, ScheduleAttachment.js)
    model = modelDefinition(sequelize, Sequelize.DataTypes);
  } else {
    // If the model directly exports the model class (e.g., User.js, Post.js)
    model = modelDefinition;
  }
  db[model.name] = model;
}

// Define all associations
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

// ========= START OF CUSTOM ASSOCIATIONS =========

db.User.hasMany(db.Post, {
  foreignKey: { name: 'author_id', allowNull: true },
  as: 'posts',
});
db.Post.belongsTo(db.User, {
  foreignKey: { name: 'author_id', allowNull: true },
  as: 'author',
});


// --- WorkSchedule Associations ---

// 1-N: User (creator) <--> WorkSchedule
db.User.hasMany(db.WorkSchedule, { foreignKey: 'created_by', as: 'createdSchedules' });
db.WorkSchedule.belongsTo(db.User, { foreignKey: 'created_by', as: 'creator' });

// 1-N: User (approver) <--> WorkSchedule
db.User.hasMany(db.WorkSchedule, { foreignKey: 'approved_by', as: 'approvedSchedules' });
db.WorkSchedule.belongsTo(db.User, { foreignKey: 'approved_by', as: 'approver' });

// 1-N: User (presider) <--> WorkSchedule
db.User.hasMany(db.WorkSchedule, { foreignKey: 'presider_id', as: 'presidedSchedules' });
db.WorkSchedule.belongsTo(db.User, { foreignKey: 'presider_id', as: 'presider' });


// N-N: WorkSchedule <--> User (attendees)
// This requires a junction table 'schedule_attendees' with 'schedule_id' and 'user_id'
db.WorkSchedule.belongsToMany(db.User, {
  through: 'schedule_attendees',
  foreignKey: 'schedule_id',
  otherKey: 'user_id',
  as: 'attendees',
  timestamps: false,
});
db.User.belongsToMany(db.WorkSchedule, {
  through: 'schedule_attendees',
  foreignKey: 'user_id',
  otherKey: 'schedule_id',
  as: 'attendedSchedules',
  timestamps: false,
});


// --- ScheduleAttachment Associations ---

// 1-N: WorkSchedule <--> ScheduleAttachment
db.WorkSchedule.hasMany(db.ScheduleAttachment, {
  foreignKey: 'schedule_id',
  as: 'attachments',
  onDelete: 'CASCADE', // Automatically delete attachments when a schedule is deleted
  hooks: true // Ensure hooks are triggered
});
db.ScheduleAttachment.belongsTo(db.WorkSchedule, { foreignKey: 'schedule_id' });


// --- Feedback Associations ---
db.User.hasMany(db.Feedback, { foreignKey: 'user_id', as: 'feedbacks' });
db.Feedback.belongsTo(db.User, { foreignKey: 'user_id', as: 'user' });

// --- User-Facility Association ---
db.User.belongsTo(db.SocialFacility, { foreignKey: 'unit', as: 'facility' });
db.SocialFacility.hasMany(db.User, { foreignKey: 'unit', as: 'users' });

// --- User-Role Association (legacy: single role via FK) ---
db.User.belongsTo(db.Role, { foreignKey: 'role_id', as: 'assignedRole' });
db.Role.hasMany(db.User, { foreignKey: 'role_id', as: 'roleUsers' });

// --- User-Role Association (N:N: nhiều roles qua user_roles) ---
db.User.belongsToMany(db.Role, {
  through: 'user_roles',
  foreignKey: 'user_id',
  otherKey: 'role_id',
  as: 'assignedRoles',
  timestamps: false,
});
db.Role.belongsToMany(db.User, {
  through: 'user_roles',
  foreignKey: 'role_id',
  otherKey: 'user_id',
  as: 'roleMembers',
  timestamps: false,
});

// --- Role-Permission Association (N-N) ---
db.Role.belongsToMany(db.Permission, {
  through: 'role_permissions',
  foreignKey: 'role_id',
  otherKey: 'permission_id',
  as: 'permissions',
  timestamps: false,
});
db.Permission.belongsToMany(db.Role, {
  through: 'role_permissions',
  foreignKey: 'permission_id',
  otherKey: 'role_id',
  as: 'roles',
  timestamps: false,
});

// ========= END OF CUSTOM ASSOCIATIONS =========

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;