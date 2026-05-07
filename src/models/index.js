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

// ========= END OF CUSTOM ASSOCIATIONS =========

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;