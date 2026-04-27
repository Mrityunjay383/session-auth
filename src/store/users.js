const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: true },
  },
  { timestamps: true }
);

const User = mongoose.model('User', userSchema);

async function createUser(username, hashedPassword) {
  return User.create({ username, password: hashedPassword });
}

async function findByUsername(username) {
  return User.findOne({ username }).lean();
}

async function findById(id) {
  return User.findById(id).lean();
}

module.exports = { createUser, findByUsername, findById };
