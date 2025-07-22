const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  subscriptionTier: {
    type: String,
    default: 'Free Adventurer',
  },
  parties: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Party',
    },
  ],
});

module.exports = mongoose.model('User', UserSchema);
