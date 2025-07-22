const mongoose = require('mongoose');

const CreatureSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  ac: {
    type: Number,
    default: 10,
  },
  dexterity: {
    type: Number,
    default: 10,
  },
  initiativeModifier: {
    type: Number,
    default: 0,
  },
  hp: {
    type: Number,
    default: 10,
  },
  legendaryActions: {
    type: Number,
    default: 0,
  },
  lairActions: {
    type: Boolean,
    default: false,
  },
});

module.exports = mongoose.model('Creature', CreatureSchema);
